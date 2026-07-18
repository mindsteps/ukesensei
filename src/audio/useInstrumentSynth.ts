import type { Instrument } from '../theory/fretboard';
import { useUkeSynth } from './useUkeSynth';
import { useBassSynth } from './useBassSynth';
import { useGuitarSynth } from './useGuitarSynth';
import { useClarinetSynth } from './useClarinetSynth';
import { useVoiceSynth } from './useVoiceSynth';
import { useHandpanSynth } from './useHandpanSynth';
import { useCajonSynth } from './useCajonSynth';
import { useHarmonicaSynth } from './useHarmonicaSynth';

/**
 * Type guard to narrow synth to a pitched instrument (with playNote).
 * Cajon is the only rhythm instrument and returns { playHit } instead.
 */
export function isPitchedSynth(
  synth: ReturnType<typeof useInstrumentSynth>,
): synth is ReturnType<typeof useUkeSynth> {
  return 'playNote' in synth;
}

/**
 * Factory hook that returns the appropriate synth hook for a given instrument.
 * Each instrument has its own synthesis method (plucked strings, bowed strings,
 * pitched percussion, etc.), so this dispatches to the right one.
 *
 * Returns a synth object with either `playNote` (pitched instruments) or
 * `playHit` (rhythm instruments like cajon).
 */
export function useInstrumentSynth(instrument: Instrument = 'ukulele') {
  switch (instrument) {
    case 'ukulele':
      return useUkeSynth();
    case 'bass':
      return useBassSynth();
    case 'guitar':
      return useGuitarSynth();
    case 'cello':
      // Cello uses bowed string synthesis similar to bass/guitar
      return useBassSynth();
    case 'clarinet':
      return useClarinetSynth();
    case 'voice':
      return useVoiceSynth();
    case 'handpan':
      return useHandpanSynth();
    case 'cajon':
      return useCajonSynth();
    case 'harmonica':
      return useHarmonicaSynth();
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = instrument;
      throw new Error(`Unknown instrument: ${_exhaustive}`);
  }
}
