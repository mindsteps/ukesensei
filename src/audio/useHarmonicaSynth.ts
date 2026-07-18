import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * A free reed (harmonica) vibrates almost like a clarinet reed, but with no
 * resonating bore to filter it -- the result is brighter and buzzier, with
 * a strong presence across both odd and even harmonics rather than the
 * clarinet's hollow odd-harmonic-dominant sound. We approximate that with a
 * custom periodic wave with a broader, more gradually-decaying harmonic
 * spectrum, plus a quick breathy attack (reeds respond to air almost
 * instantly, unlike a bowed or plucked string).
 */
function createHarmonicaWave(ctx: AudioContext): PeriodicWave {
  const harmonicCount = 12;
  const real = new Float32Array(harmonicCount + 1);
  const imag = new Float32Array(harmonicCount + 1);
  for (let n = 1; n <= harmonicCount; n++) {
    imag[n] = 1 / Math.pow(n, 0.85);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

const NOTE_DURATION = 0.9;

interface ActiveVoice {
  osc: OscillatorNode;
  tremolo: OscillatorNode;
}

export function useHarmonicaSynth() {
  const activeRef = useRef<ActiveVoice[]>([]);
  const waveRef = useRef<PeriodicWave | null>(null);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);
    if (!waveRef.current) waveRef.current = createHarmonicaWave(ctx);

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.setPeriodicWave(waveRef.current);
    osc.frequency.value = freq;

    // A light amplitude tremolo, standing in for the slight unsteadiness of
    // breath through a free reed -- subtler than a sung/bowed vibrato since
    // reed pitch itself barely wavers.
    const tremolo = ctx.createOscillator();
    tremolo.frequency.value = 6;
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.06;

    // Quick attack (a reed speaks almost the instant air hits it) and a
    // clean release -- a sustained wind tone, not a plucked decay.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.4, now + 0.02);
    env.gain.setValueAtTime(0.38, now + NOTE_DURATION * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, now + NOTE_DURATION);

    tremolo.connect(tremoloGain).connect(env.gain);

    // Rolls off the buzziest upper harmonics so it reads as a harmonica, not a kazoo.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 6, 5000);
    lp.Q.value = 0.4;

    osc.connect(lp).connect(env).connect(ctx.destination);
    osc.start(now);
    tremolo.start(now);
    osc.stop(now + NOTE_DURATION);
    tremolo.stop(now + NOTE_DURATION);

    const active = activeRef.current;
    const voice: ActiveVoice = { osc, tremolo };
    active.push(voice);
    osc.onended = () => {
      const i = active.indexOf(voice);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 6) {
      const old = active.shift()!;
      old.osc.stop();
      old.tremolo.stop();
    }
  }, []);

  return { playNote };
}
