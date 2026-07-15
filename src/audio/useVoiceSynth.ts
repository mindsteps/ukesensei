import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * A hummed "oo" reference tone -- not a realistic vocal synth, just a soft,
 * sustained pitch reference so tapping a note in the voice panel gives the
 * singer something to match. A sawtooth source (rich in harmonics) is shaped
 * by two peaking filters standing in for vowel formants, then rolled off so
 * it sits closer to a hum than a buzz.
 */
const NOTE_DURATION = 1.3;

interface ActiveVoice {
  osc: OscillatorNode;
  vibrato: OscillatorNode;
}

export function useVoiceSynth() {
  const activeRef = useRef<ActiveVoice[]>([]);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // A gentle vibrato -- sung pitch rarely holds arrow-straight.
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = freq * 0.008;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    // Two rough formant peaks standing in for an "oo" vowel shape.
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'peaking';
    formant1.frequency.value = Math.max(freq * 1.5, 350);
    formant1.Q.value = 4;
    formant1.gain.value = 10;

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'peaking';
    formant2.frequency.value = Math.max(freq * 3, 900);
    formant2.Q.value = 5;
    formant2.gain.value = 6;

    // Rolls off the buzzier upper harmonics so it reads as a hum, not a synth lead.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 4, 2800);
    lp.Q.value = 0.4;

    // Soft attack (like breath catching a pitch) and a gentle taper.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.35, now + 0.08);
    env.gain.setValueAtTime(0.32, now + NOTE_DURATION * 0.65);
    env.gain.exponentialRampToValueAtTime(0.001, now + NOTE_DURATION);

    osc.connect(formant1).connect(formant2).connect(lp).connect(env).connect(ctx.destination);
    osc.start(now);
    vibrato.start(now);
    osc.stop(now + NOTE_DURATION);
    vibrato.stop(now + NOTE_DURATION);

    const active = activeRef.current;
    const voice: ActiveVoice = { osc, vibrato };
    active.push(voice);
    osc.onended = () => {
      const i = active.indexOf(voice);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 6) {
      const old = active.shift()!;
      old.osc.stop();
      old.vibrato.stop();
    }
  }, []);

  return { playNote };
}
