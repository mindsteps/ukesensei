import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * A soft, bell-like reference tone standing in for a struck handpan tone
 * field -- not a physical model, just a fundamental plus a couple of quiet,
 * slightly-detuned harmonic partials (handpans ring with rich, somewhat
 * inharmonic overtones) and a long, slow decay so tapping a tone field in
 * the panel gives a sustained pitch reference to match by ear.
 */
const NOTE_DURATION = 2.6;

interface ActiveTone {
  oscs: OscillatorNode[];
}

export function useHandpanSynth() {
  const activeRef = useRef<ActiveTone[]>([]);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);

    // Fundamental + two quiet, slightly-detuned partials, each with its own
    // decay envelope so the higher partials fade out first (as real struck
    // metal does).
    const partials: { ratio: number; detuneCents: number; gain: number; decay: number }[] = [
      { ratio: 1, detuneCents: 0, gain: 1, decay: NOTE_DURATION },
      { ratio: 2, detuneCents: 6, gain: 0.22, decay: NOTE_DURATION * 0.6 },
      { ratio: 3.005, detuneCents: -9, gain: 0.1, decay: NOTE_DURATION * 0.35 },
    ];

    const oscs: OscillatorNode[] = [];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * p.ratio;
      osc.detune.value = p.detuneCents;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(p.gain, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0005, now + p.decay);

      osc.connect(env).connect(master);
      osc.start(now);
      osc.stop(now + p.decay + 0.05);
      oscs.push(osc);
    }

    const active = activeRef.current;
    const tone: ActiveTone = { oscs };
    active.push(tone);
    oscs[0].onended = () => {
      const i = active.indexOf(tone);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 6) {
      const old = active.shift()!;
      for (const osc of old.oscs) osc.stop();
    }
  }, []);

  return { playNote };
}
