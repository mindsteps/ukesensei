import { type NoteName } from './notes';
import type { FretPosition } from './fretboard';

/**
 * Handpan has no strings or frets — pitch comes from striking one of a fixed
 * set of tone fields hammered into the shell. This models the most common
 * beginner scale, D Kurd (9 notes): a center "Ding" note plus 8 tone fields
 * arranged in a circle around it, each a fixed, unchangeable pitch.
 *
 * Unlike voice's continuous chromatic range, a handpan can only ever sound
 * these 9 specific pitches, so scale/exercise generation naturally produces
 * shorter (sometimes very short) note sequences for scales that share few
 * notes with D Kurd -- that's expected, not a bug.
 */
export interface HandpanTone {
  note: NoteName;
  octave: number;
  /** The center note, struck with a different technique than the tone fields. */
  isDing: boolean;
  /** Position around the circle in degrees (0 = top, clockwise), for the diagram. Unused for Ding. */
  angle: number;
}

/**
 * D Kurd, ascending from the Ding: D3 (Ding), A3, Bb3, C4, D4, E4, F4, G4, A4.
 * Tone fields are laid out in ascending pitch order around the circle, which
 * matches how most manufacturers arrange a Kurd-scale handpan.
 */
export const HANDPAN_D_KURD: HandpanTone[] = [
  { note: 'D', octave: 3, isDing: true, angle: 0 },
  { note: 'A', octave: 3, isDing: false, angle: 0 },
  { note: 'A#', octave: 3, isDing: false, angle: 45 },
  { note: 'C', octave: 4, isDing: false, angle: 90 },
  { note: 'D', octave: 4, isDing: false, angle: 135 },
  { note: 'E', octave: 4, isDing: false, angle: 180 },
  { note: 'F', octave: 4, isDing: false, angle: 225 },
  { note: 'G', octave: 4, isDing: false, angle: 270 },
  { note: 'A', octave: 4, isDing: false, angle: 315 },
];

/**
 * A "fake fretboard" spanning the 9 D Kurd tones, one per fret on a single
 * virtual string (string 0), ordered exactly as HANDPAN_D_KURD (fret 0 =
 * Ding). This lets handpan reuse the same scale-exercise and lesson-position
 * machinery built for fretted instruments, just like voice's virtual board
 * in voiceRange.ts.
 */
export function getHandpanBoard(): FretPosition[] {
  return HANDPAN_D_KURD.map((t, i) => ({ string: 0, fret: i, note: t.note, octave: t.octave }));
}

export function findHandpanTone(note: NoteName, octave: number): HandpanTone | undefined {
  return HANDPAN_D_KURD.find((t) => t.note === note && t.octave === octave);
}
