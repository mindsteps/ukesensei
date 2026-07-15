import { useCallback, useRef } from 'react';
import type { CajonHitType } from '../exercises/cajonPatterns';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * A percussive stand-in for the three cajon strokes this app grades:
 * - bass: a low sine "thump" (the deep, resonant tone from striking the
 *   center of the front plate) layered with a short burst of lowpassed
 *   noise for the attack.
 * - slap: a short, bright burst of highpassed/bandpassed noise (the sharp
 *   crack from striking near the top edge with fingertips).
 * - ghost: a very quiet, short tap -- same shape as a slap but much lower
 *   level, standing in for a muted/ghost note.
 *
 * Not a physical model of a real cajon, just enough of a percussive
 * reference sound to preview strokes in the panel before playing the real
 * instrument into the mic.
 */
function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

interface ActiveHit {
  nodes: AudioScheduledSourceNode[];
}

export function useCajonSynth() {
  const activeRef = useRef<ActiveHit[]>([]);

  const playHit = useCallback((type: CajonHitType) => {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const nodes: AudioScheduledSourceNode[] = [];

    const master = ctx.createGain();
    master.connect(ctx.destination);

    if (type === 'bass') {
      master.gain.value = 0.55;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);
      const oscEnv = ctx.createGain();
      oscEnv.gain.setValueAtTime(1, now);
      oscEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(oscEnv).connect(master);
      osc.start(now);
      osc.stop(now + 0.3);
      nodes.push(osc);

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.05);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 400;
      const noiseEnv = ctx.createGain();
      noiseEnv.gain.setValueAtTime(0.4, now);
      noiseEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(noiseFilter).connect(noiseEnv).connect(master);
      noise.start(now);
      noise.stop(now + 0.06);
      nodes.push(noise);
    } else if (type === 'slap') {
      master.gain.value = 0.45;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.09);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 2800;
      bandpass.Q.value = 0.7;
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 1500;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      noise.connect(bandpass).connect(highpass).connect(env).connect(master);
      noise.start(now);
      noise.stop(now + 0.1);
      nodes.push(noise);
    } else {
      master.gain.value = 0.14;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.05);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 2000;
      bandpass.Q.value = 0.6;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      noise.connect(bandpass).connect(env).connect(master);
      noise.start(now);
      noise.stop(now + 0.05);
      nodes.push(noise);
    }

    const active = activeRef.current;
    const hit: ActiveHit = { nodes };
    active.push(hit);
    nodes[0].onended = () => {
      const i = active.indexOf(hit);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 8) {
      const old = active.shift()!;
      for (const node of old.nodes) node.stop();
    }
  }, []);

  return { playHit };
}
