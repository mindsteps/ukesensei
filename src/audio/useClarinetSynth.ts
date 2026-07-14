import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * The clarinet's cylindrical, closed-pipe bore reinforces odd harmonics
 * (1st, 3rd, 5th...) far more than even ones — that's what gives it the
 * distinctive "hollow" chalumeau-register timbre, versus a conical/open
 * bore instrument like a saxophone. We approximate that spectrum with a
 * custom periodic wave instead of a plain oscillator shape.
 */
function createClarinetWave(ctx: AudioContext): PeriodicWave {
  const harmonicCount = 14;
  const real = new Float32Array(harmonicCount + 1);
  const imag = new Float32Array(harmonicCount + 1);
  for (let n = 1; n <= harmonicCount; n++) {
    const odd = n % 2 === 1;
    imag[n] = (odd ? 1 : 0.15) / n;
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

const NOTE_DURATION = 1.1;

interface ActiveVoice {
  osc: OscillatorNode;
  vibrato: OscillatorNode;
}

export function useClarinetSynth() {
  const activeRef = useRef<ActiveVoice[]>([]);
  const waveRef = useRef<PeriodicWave | null>(null);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);
    if (!waveRef.current) waveRef.current = createClarinetWave(ctx);

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.setPeriodicWave(waveRef.current);
    osc.frequency.value = freq;

    // A subtle vibrato — real reed players rarely hold pitch arrow-straight.
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = freq * 0.004;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    // Soft attack (like a reed catching) and a gentle release, held for most
    // of the duration — this is a sustained wind tone, not a plucked decay.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.045);
    env.gain.setValueAtTime(0.48, now + NOTE_DURATION * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, now + NOTE_DURATION);

    // Rolls off the buzzier upper harmonics, mimicking the bore + bell.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 5.5, 4500);
    lp.Q.value = 0.3;

    osc.connect(env).connect(lp).connect(ctx.destination);
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
