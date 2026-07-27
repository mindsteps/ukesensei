import type { NoteName } from './notes';
import { type HarmonicaHole } from './harmonicaLayout';

/**
 * Harmonica tunings for different keys using Richter (diatonic) tuning.
 * A Richter-tuned harmonica in key X has the same physical layout as C major,
 * but transposed to start on X. So a G harmonica has hole 1 blow = G, etc.
 *
 * Common keys: C (easiest to learn), G, F, Bb (B-flat), Eb (E-flat), Db (D-flat).
 * The most common are C and G. Blues and folk often use F or Bb.
 */

export interface HarmonicaTuning {
  name: string;
  key: NoteName;
  holes: HarmonicaHole[];
}

function note(n: NoteName, octave: number) {
  return { note: n, octave };
}

/**
 * Standard C major Richter tuning (most common for beginners).
 * Hole 1 blow = C4, draw = D4, etc.
 */
export const RICHTER_C: HarmonicaTuning = {
  name: 'C Major (Richter)',
  key: 'C',
  holes: [
    { hole: 1, blow: note('C', 4), draw: note('D', 4) },
    { hole: 2, blow: note('E', 4), draw: note('G', 4) },
    { hole: 3, blow: note('G', 4), draw: note('B', 4) },
    { hole: 4, blow: note('C', 5), draw: note('D', 5) },
    { hole: 5, blow: note('E', 5), draw: note('F', 5) },
    { hole: 6, blow: note('G', 5), draw: note('A', 5) },
    { hole: 7, blow: note('C', 6), draw: note('B', 5) },
    { hole: 8, blow: note('E', 6), draw: note('D', 6) },
    { hole: 9, blow: note('G', 6), draw: note('F', 6) },
    { hole: 10, blow: note('C', 7), draw: note('A', 6) },
  ],
};

/**
 * G major Richter tuning (popular for blues and folk).
 * Hole 1 blow = G3, draw = A3, etc.
 */
export const RICHTER_G: HarmonicaTuning = {
  name: 'G Major (Richter)',
  key: 'G',
  holes: [
    { hole: 1, blow: note('G', 3), draw: note('A', 3) },
    { hole: 2, blow: note('B', 3), draw: note('D', 4) },
    { hole: 3, blow: note('D', 4), draw: note('F#', 4) },
    { hole: 4, blow: note('G', 4), draw: note('A', 4) },
    { hole: 5, blow: note('B', 4), draw: note('C', 5) },
    { hole: 6, blow: note('D', 5), draw: note('E', 5) },
    { hole: 7, blow: note('G', 5), draw: note('F#', 5) },
    { hole: 8, blow: note('B', 5), draw: note('A', 5) },
    { hole: 9, blow: note('D', 6), draw: note('C', 6) },
    { hole: 10, blow: note('G', 6), draw: note('E', 6) },
  ],
};

/**
 * F major Richter tuning (warm, mellow; used in folk and blues).
 * Hole 1 blow = F3, draw = G3, etc.
 */
export const RICHTER_F: HarmonicaTuning = {
  name: 'F Major (Richter)',
  key: 'F',
  holes: [
    { hole: 1, blow: note('F', 3), draw: note('G', 3) },
    { hole: 2, blow: note('A', 3), draw: note('C', 4) },
    { hole: 3, blow: note('C', 4), draw: note('E', 4) },
    { hole: 4, blow: note('F', 4), draw: note('G', 4) },
    { hole: 5, blow: note('A', 4), draw: note('A#', 4) },
    { hole: 6, blow: note('C', 5), draw: note('D', 5) },
    { hole: 7, blow: note('F', 5), draw: note('E', 5) },
    { hole: 8, blow: note('A', 5), draw: note('G', 5) },
    { hole: 9, blow: note('C', 6), draw: note('A#', 5) },
    { hole: 10, blow: note('F', 6), draw: note('D', 6) },
  ],
};

/**
 * Bb (B-flat) major Richter tuning (common in blues and jazz).
 * Hole 1 blow = A# (Bb), draw = C4, etc.
 */
export const RICHTER_BB: HarmonicaTuning = {
  name: 'Bb Major (Richter)',
  key: 'A#',
  holes: [
    { hole: 1, blow: note('A#', 3), draw: note('C', 4) },
    { hole: 2, blow: note('D', 4), draw: note('F', 4) },
    { hole: 3, blow: note('F', 4), draw: note('A', 4) },
    { hole: 4, blow: note('A#', 4), draw: note('C', 5) },
    { hole: 5, blow: note('D', 5), draw: note('D#', 5) },
    { hole: 6, blow: note('F', 5), draw: note('G', 5) },
    { hole: 7, blow: note('A#', 5), draw: note('A', 5) },
    { hole: 8, blow: note('D', 6), draw: note('C', 6) },
    { hole: 9, blow: note('F', 6), draw: note('D#', 6) },
    { hole: 10, blow: note('A#', 6), draw: note('G', 6) },
  ],
};

/**
 * Eb (E-flat) major Richter tuning (mellow, introspective sound).
 * Hole 1 blow = D# (Eb), draw = F3, etc.
 */
export const RICHTER_EB: HarmonicaTuning = {
  name: 'Eb Major (Richter)',
  key: 'D#',
  holes: [
    { hole: 1, blow: note('D#', 3), draw: note('F', 3) },
    { hole: 2, blow: note('G', 3), draw: note('A#', 3) },
    { hole: 3, blow: note('A#', 3), draw: note('D', 4) },
    { hole: 4, blow: note('D#', 4), draw: note('F', 4) },
    { hole: 5, blow: note('G', 4), draw: note('G#', 4) },
    { hole: 6, blow: note('A#', 4), draw: note('C', 5) },
    { hole: 7, blow: note('D#', 5), draw: note('D', 5) },
    { hole: 8, blow: note('G', 5), draw: note('F', 5) },
    { hole: 9, blow: note('A#', 5), draw: note('G#', 5) },
    { hole: 10, blow: note('D#', 6), draw: note('C', 6) },
  ],
};

/**
 * Db (D-flat) major Richter tuning (dark, soulful; used in slow blues).
 * Hole 1 blow = C# (Db), draw = D# (Eb), etc.
 */
export const RICHTER_DB: HarmonicaTuning = {
  name: 'Db Major (Richter)',
  key: 'C#',
  holes: [
    { hole: 1, blow: note('C#', 3), draw: note('D#', 3) },
    { hole: 2, blow: note('F#', 3), draw: note('G#', 3) },
    { hole: 3, blow: note('G#', 3), draw: note('C', 4) },
    { hole: 4, blow: note('C#', 4), draw: note('D#', 4) },
    { hole: 5, blow: note('F#', 4), draw: note('G', 4) },
    { hole: 6, blow: note('G#', 4), draw: note('A#', 4) },
    { hole: 7, blow: note('C#', 5), draw: note('C', 5) },
    { hole: 8, blow: note('F#', 5), draw: note('D#', 5) },
    { hole: 9, blow: note('G#', 5), draw: note('G', 5) },
    { hole: 10, blow: note('C#', 6), draw: note('A#', 6) },
  ],
};

/**
 * Map of all available harmonica tunings by key.
 */
export const HARMONICA_TUNINGS: Record<string, HarmonicaTuning> = {
  richter_c: RICHTER_C,
  richter_g: RICHTER_G,
  richter_f: RICHTER_F,
  richter_bb: RICHTER_BB,
  richter_eb: RICHTER_EB,
  richter_db: RICHTER_DB,
};

/**
 * Default harmonica tuning (C major, most common for learning).
 */
export const DEFAULT_HARMONICA_TUNING = RICHTER_C;
