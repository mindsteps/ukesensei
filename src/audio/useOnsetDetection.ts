import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CajonHitType } from '../exercises/cajonPatterns';

/**
 * Cajon has no stable pitch, so instead of the WASM pitch worklet this hook
 * reads the raw AnalyserNode that useWasmAudio already exposes (independent
 * of the pitch worklet) to detect percussive onsets directly: a rolling RMS
 * "floor" tracks the ambient/decaying-tail level, and a hit is flagged when
 * the instantaneous RMS spikes well above it. Each onset is then classified
 * by comparing low-band vs high-band frequency energy (bass tones ring low,
 * slaps are bright and high), with very quiet onsets treated as ghost taps
 * regardless of their spectral shape.
 *
 * This is a heuristic, not a physical model -- it won't perfectly match a
 * real cajon in every room/mic setup, but gives a real, playable timing +
 * hit-type signal without needing any changes to the WASM pitch engine.
 */
const ONSET_RATIO = 2.2;
const MIN_ONSET_RMS = 0.02;
const REFRACTORY_MS = 90;
const FLOOR_RISE = 0.02;
const FLOOR_FALL = 0.35;
const GHOST_RMS_THRESHOLD = 0.09;
const LOW_BAND_HZ: [number, number] = [0, 400];
const HIGH_BAND_HZ: [number, number] = [1500, 6000];
const SLAP_RATIO = 1.15;

function computeRMS(buffer: Float32Array<ArrayBuffer>): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

function bandEnergy(freqData: Uint8Array<ArrayBuffer>, sampleRate: number, fftSize: number, [lo, hi]: [number, number]): number {
  const binHz = sampleRate / fftSize;
  const loBin = Math.max(0, Math.floor(lo / binHz));
  const hiBin = Math.min(freqData.length - 1, Math.ceil(hi / binHz));
  let sum = 0;
  let count = 0;
  for (let i = loBin; i <= hiBin; i++) {
    sum += freqData[i];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function classifyHit(rms: number, freqData: Uint8Array<ArrayBuffer>, sampleRate: number, fftSize: number): CajonHitType {
  if (rms < GHOST_RMS_THRESHOLD) return 'ghost';
  const low = bandEnergy(freqData, sampleRate, fftSize, LOW_BAND_HZ);
  const high = bandEnergy(freqData, sampleRate, fftSize, HIGH_BAND_HZ);
  return high > low * SLAP_RATIO ? 'slap' : 'bass';
}

export function useOnsetDetection(getAnalyser: () => AnalyserNode | null, isActive: boolean) {
  const setDetectedHit = useAppStore((s) => s.setDetectedHit);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const freqBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const floorRef = useRef(0.01);
  const lastOnsetAtRef = useRef(0);

  const detect = useCallback(() => {
    const analyser = getAnalyser();
    if (!analyser) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    if (!bufferRef.current || bufferRef.current.length !== analyser.fftSize) {
      bufferRef.current = new Float32Array(analyser.fftSize);
    }
    if (!freqBufferRef.current || freqBufferRef.current.length !== analyser.frequencyBinCount) {
      freqBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const buffer = bufferRef.current;
    analyser.getFloatTimeDomainData(buffer);
    const rms = computeRMS(buffer);

    const now = Date.now();
    const sinceLastOnset = now - lastOnsetAtRef.current;

    if (rms > MIN_ONSET_RMS && rms > floorRef.current * ONSET_RATIO && sinceLastOnset > REFRACTORY_MS) {
      const freqData = freqBufferRef.current;
      analyser.getByteFrequencyData(freqData);
      const type = classifyHit(rms, freqData, analyser.context.sampleRate, analyser.fftSize);

      lastOnsetAtRef.current = now;
      // Jump the floor up to the hit's peak immediately, so its decaying
      // tail doesn't itself get mistaken for a second onset; FLOOR_FALL
      // below brings it back down as the tail fades.
      floorRef.current = rms;
      setDetectedHit({ type, level: Math.min(1, rms * 4), timestamp: now });
    } else {
      floorRef.current = rms > floorRef.current
        ? floorRef.current + (rms - floorRef.current) * FLOOR_RISE
        : floorRef.current + (rms - floorRef.current) * FLOOR_FALL;
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [getAnalyser, setDetectedHit]);

  useEffect(() => {
    if (isActive) {
      floorRef.current = 0.01;
      lastOnsetAtRef.current = 0;
      rafRef.current = requestAnimationFrame(detect);
    } else {
      setDetectedHit(null);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, detect, setDetectedHit]);
}
