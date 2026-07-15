import { useRef, useCallback, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHROMATIC_NOTES, type NoteName } from '../theory/notes';
import { detectTuningFromNote, AUDIO_CONFIG_BY_INSTRUMENT } from './noteUtils';
import type { Instrument } from '../theory/fretboard';
import { logMetric, logEvent } from './audioDebugLog';

const MIN_CLARITY = 0.85;
const LEVEL_SMOOTHING = 0.3;

export type EqBand = 'low' | 'mid' | 'high';
export interface EqBandState {
  /** Corner frequency (low/high shelf) or center frequency (mid peak), in Hz. */
  freq: number;
  /** Gain in dB, typically -12..+12. */
  gain: number;
}
export type EqBands = Record<EqBand, EqBandState>;

const EQ_DEFAULTS: EqBands = {
  low: { freq: 250, gain: 0 },
  mid: { freq: 1000, gain: 0 },
  high: { freq: 4000, gain: 0 },
};
const EQ_FILTER_TYPE: Record<EqBand, BiquadFilterType> = {
  low: 'lowshelf',
  mid: 'peaking',
  high: 'highshelf',
};

interface WasmAudioState {
  audioContext: AudioContext | null;
  workletNode: AudioWorkletNode | null;
  stream: MediaStream | null;
  gainNode: GainNode | null;
  analyser: AnalyserNode | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  eqNodes: Record<EqBand, BiquadFilterNode> | null;
}

export function useWasmAudio() {
  const stateRef = useRef<WasmAudioState>({
    audioContext: null,
    workletNode: null,
    stream: null,
    gainNode: null,
    analyser: null,
    sourceNode: null,
    eqNodes: null,
  });

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGainState] = useState(1.0);
  const [eq, setEqState] = useState<EqBands>(EQ_DEFAULTS);
  const eqRef = useRef(eq);
  useEffect(() => {
    eqRef.current = eq;
  }, [eq]);
  const [wasmReady, setWasmReady] = useState(false);
  const smoothedLevelRef = useRef(0);
  const tuningAutoRef = useRef({ lowGCount: 0, highGCount: 0 });
  const lastWorkletMsgAtRef = useRef<number | null>(null);

  const setDetectedNote = useAppStore((s) => s.setDetectedNote);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const tuningKeyRef = useRef(useAppStore.getState().tuningKey);
  const instrument = useAppStore((s) => s.instrument);
  const instrumentRef = useRef<Instrument>(instrument);

  useEffect(() => {
    return useAppStore.subscribe((state) => {
      tuningKeyRef.current = state.tuningKey;
      instrumentRef.current = state.instrument;
    });
  }, []);

  const setTuning = useAppStore((s) => s.setTuning);
  const setTuningAutoDetected = useAppStore((s) => s.setTuningAutoDetected);

  const handleWorkletMessage = useCallback((e: MessageEvent) => {
    const data = e.data;
    if (data.type === 'ready') {
      setWasmReady(true);
      return;
    }
    if (data.type === 'error') {
      setError(`WASM init failed: ${data.message}`);
      return;
    }
    if (data.type !== 'pitch') return;

    const { frequency, clarity, midiNote, cents, rms } = data;

    // Timing between worklet 'pitch' messages should be steady (~analyzeEveryN
    // render quanta). Large/irregular gaps here point to audio-thread
    // underruns or main-thread stalls delaying message delivery — i.e. real
    // "buffering" — rather than a visualization bug.
    const now = performance.now();
    if (lastWorkletMsgAtRef.current != null) {
      logMetric('worklet.msgDtMs', now - lastWorkletMsgAtRef.current);
    }
    lastWorkletMsgAtRef.current = now;

    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    const normalizedLevel = Math.max(0, Math.min(1, (dbFS + 60) / 60));
    smoothedLevelRef.current =
      smoothedLevelRef.current * LEVEL_SMOOTHING +
      normalizedLevel * (1 - LEVEL_SMOOTHING);
    setAudioLevel(smoothedLevelRef.current);
    logMetric('worklet.rms', rms);
    logMetric('worklet.levelSmoothed', smoothedLevelRef.current);

    const { minFrequency, maxFrequency } = AUDIO_CONFIG_BY_INSTRUMENT[instrumentRef.current];
    if (frequency < minFrequency || frequency > maxFrequency || clarity < MIN_CLARITY) {
      setDetectedNote(null);
      return;
    }

    const noteIndex = ((midiNote % 12) + 12) % 12;
    const note = CHROMATIC_NOTES[noteIndex] as NoteName;
    const octave = Math.floor(midiNote / 12) - 1;
    const tuningKey = tuningKeyRef.current;

    setDetectedNote({
      note,
      octave,
      frequency,
      clarity,
      cents,
      timestamp: Date.now(),
    });

    // Auto-detecting high-G vs low-G only makes sense for the ukulele.
    if (instrumentRef.current !== 'ukulele') return;

    const detected = detectTuningFromNote(note, octave, frequency);
    if (detected) {
      const counts = tuningAutoRef.current;
      if (detected === 'low_g') counts.lowGCount++;
      else counts.highGCount++;

      const threshold = 3;
      if (counts.lowGCount >= threshold && detected === 'low_g' && tuningKey !== 'low_g') {
        setTuning('low_g');
        setTuningAutoDetected(true);
        counts.lowGCount = 0;
        counts.highGCount = 0;
      } else if (counts.highGCount >= threshold && detected === 'standard' && tuningKey !== 'standard') {
        setTuning('standard');
        setTuningAutoDetected(true);
        counts.lowGCount = 0;
        counts.highGCount = 0;
      }
    }
  }, [setDetectedNote, setAudioLevel, setTuning, setTuningAutoDetected]);

  const start = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();
      logEvent('AudioContext created', `state=${audioContext.state} sampleRate=${audioContext.sampleRate}`);
      audioContext.onstatechange = () => {
        // A context that suspends mid-session (tab backgrounding, OS power
        // saving, some Bluetooth profile switches) will make levels/FFT
        // drop to near-zero until it resumes — a very plausible cause of
        // "fading in and out".
        logEvent('AudioContext statechange', audioContext.state);
      };

      const micTrack = stream.getAudioTracks()[0];
      if (micTrack) {
        logEvent('mic track', `label=${micTrack.label} muted=${micTrack.muted} readyState=${micTrack.readyState}`);
        micTrack.addEventListener('mute', () => logEvent('mic track muted'));
        micTrack.addEventListener('unmute', () => logEvent('mic track unmuted'));
        micTrack.addEventListener('ended', () => logEvent('mic track ended'));
      }

      await audioContext.audioWorklet.addModule('/audio-worklet-processor.js');

      const wasmResponse = await fetch('/audio-engine.wasm');
      const wasmBinary = await wasmResponse.arrayBuffer();

      const workletNode = new AudioWorkletNode(audioContext, 'wasm-pitch-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });

      const { analysisSize } = AUDIO_CONFIG_BY_INSTRUMENT[instrument];
      workletNode.port.onmessage = handleWorkletMessage;
      workletNode.port.postMessage({ type: 'wasm-binary', binary: wasmBinary, analysisSize }, [wasmBinary]);
      workletNode.port.postMessage({ type: 'set-gain', gain });

      const source = audioContext.createMediaStreamSource(stream);

      const gainNode = audioContext.createGain();
      gainNode.gain.value = gain;

      // 3-band EQ (low shelf / mid peak / high shelf) sits between the input
      // gain and everything downstream, so it shapes the tone that's both
      // analyzed (pitch detection, visualizers) and recorded.
      const eqLow = audioContext.createBiquadFilter();
      eqLow.type = EQ_FILTER_TYPE.low;
      eqLow.frequency.value = eqRef.current.low.freq;
      eqLow.gain.value = eqRef.current.low.gain;

      const eqMid = audioContext.createBiquadFilter();
      eqMid.type = EQ_FILTER_TYPE.mid;
      eqMid.frequency.value = eqRef.current.mid.freq;
      eqMid.Q.value = 0.8;
      eqMid.gain.value = eqRef.current.mid.gain;

      const eqHigh = audioContext.createBiquadFilter();
      eqHigh.type = EQ_FILTER_TYPE.high;
      eqHigh.frequency.value = eqRef.current.high.freq;
      eqHigh.gain.value = eqRef.current.high.gain;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      // Low smoothing keeps the FFT visualizer reacting to whatever is
      // currently at the mic (plucks, noise, chords) instead of only
      // building up visible energy for sustained, tonal (pure) notes.
      analyser.smoothingTimeConstant = 0.15;

      source.connect(gainNode);
      gainNode.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(workletNode);
      eqHigh.connect(analyser);

      stateRef.current = {
        audioContext,
        workletNode,
        stream,
        gainNode,
        analyser,
        sourceNode: source,
        eqNodes: { low: eqLow, mid: eqMid, high: eqHigh },
      };
      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow access in your browser settings.'
          : `Could not initialize audio: ${err}`,
      );
    }
  }, [gain, instrument, handleWorkletMessage]);

  const stop = useCallback(() => {
    const { audioContext, stream, workletNode } = stateRef.current;
    if (workletNode) {
      workletNode.port.onmessage = null;
      workletNode.disconnect();
    }
    stream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    stateRef.current = {
      audioContext: null,
      workletNode: null,
      stream: null,
      gainNode: null,
      analyser: null,
      sourceNode: null,
      eqNodes: null,
    };
    setIsActive(false);
    setWasmReady(false);
    smoothedLevelRef.current = 0;
    lastWorkletMsgAtRef.current = null;
  }, []);

  const setGain = useCallback((value: number) => {
    setGainState(value);
    const { gainNode, workletNode } = stateRef.current;
    if (gainNode) gainNode.gain.value = value;
    if (workletNode) {
      workletNode.port.postMessage({ type: 'set-gain', gain: value });
    }
  }, []);

  const setEqBand = useCallback((band: EqBand, patch: Partial<EqBandState>) => {
    setEqState((prev) => ({ ...prev, [band]: { ...prev[band], ...patch } }));
    const { eqNodes } = stateRef.current;
    const node = eqNodes && eqNodes[band];
    if (node) {
      if (patch.gain !== undefined) node.gain.value = patch.gain;
      if (patch.freq !== undefined) node.frequency.value = patch.freq;
    }
  }, []);

  // Combined magnitude response (linear) of the 3-band EQ chain at the given
  // frequencies, for driving the curve editor's visualization. Returns null
  // if the filter nodes aren't live (e.g. mic not started yet).
  const getEqFrequencyResponse = useCallback((frequencies: Float32Array<ArrayBuffer>): Float32Array<ArrayBuffer> | null => {
    const nodes = stateRef.current.eqNodes;
    if (!nodes) return null;
    const magOut = new Float32Array(frequencies.length);
    const phaseOut = new Float32Array(frequencies.length);
    const totalMag = new Float32Array(frequencies.length).fill(1);
    for (const band of Object.keys(nodes) as EqBand[]) {
      nodes[band].getFrequencyResponse(frequencies, magOut, phaseOut);
      for (let i = 0; i < frequencies.length; i++) totalMag[i] *= magOut[i];
    }
    return totalMag;
  }, []);

  // The analysis buffer size differs per instrument, so switching instruments
  // while listening requires tearing down and re-initializing the engine.
  const prevInstrumentRef = useRef(instrument);
  useEffect(() => {
    if (prevInstrumentRef.current === instrument) return;
    prevInstrumentRef.current = instrument;
    setDetectedNote(null);
    tuningAutoRef.current = { lowGCount: 0, highGCount: 0 };
    if (stateRef.current.audioContext) {
      stop();
      start();
    }
  }, [instrument, start, stop, setDetectedNote]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  // Stable identities (read from stateRef, no reactive deps) so consumers like
  // FftVisualizer can keep a persistent animation loop running without it
  // restarting on every pitch-detection re-render of the caller.
  const getAnalyser = useCallback(() => stateRef.current.analyser, []);
  const getSampleRate = useCallback(() => stateRef.current.audioContext?.sampleRate ?? 44100, []);
  // Recording from a MediaStreamAudioDestinationNode (i.e. piping the mic
  // through the Web Audio graph) is known to produce sped-up, glitchy
  // MediaRecorder output in Chrome, since the graph's render clock can drift
  // from real time under load. The raw getUserMedia stream doesn't have this
  // problem, so recordings use it directly (the EQ still shapes what's
  // analyzed/visualized live, just not what's captured to disk).
  const getStream = useCallback(() => stateRef.current.stream, []);

  return {
    isActive,
    error,
    gain,
    setGain,
    eq,
    setEqBand,
    getEqFrequencyResponse,
    start,
    stop,
    wasmReady,
    getAnalyser,
    getSampleRate,
    getStream,
  };
}
