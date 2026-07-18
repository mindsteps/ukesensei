import { type NoteName, noteToSemitone } from './notes';
import type { FretPosition } from './fretboard';

/**
 * A standard 10-hole diatonic "Richter-tuned" harmonica in the key of C —
 * the most common harmonica for beginners. Unlike a chromatic instrument,
 * each hole only sounds two fixed pitches: one when you blow (exhale) and a
 * different one when you draw (inhale). There's no way to play any other
 * note on a given hole without bending (a pitch-lowering embouchure
 * technique that isn't modeled here — see the curriculum's grading caveat).
 *
 * This is the real Richter tuning chart, including its famous quirk: at
 * hole 7, the draw note (B5) is actually *lower* than the blow note (C6),
 * a one-time "reversal" compared to holes 1-6 where blow sits below draw.
 */
export interface HarmonicaHole {
  hole: number;
  blow: { note: NoteName; octave: number };
  draw: { note: NoteName; octave: number };
}

function note(n: NoteName, octave: number) {
  return { note: n, octave };
}

export const HARMONICA_HOLES: HarmonicaHole[] = [
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
];

export type HarmonicaDirection = 'blow' | 'draw';

export interface HarmonicaNote {
  hole: number;
  direction: HarmonicaDirection;
  note: NoteName;
  octave: number;
  /** MIDI note number (C4 = 60), used for sorting/lookup. */
  midi: number;
}

function midiOf(n: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(n);
}

/**
 * Every blow/draw note on the harmonica, sorted low to high by actual pitch
 * (not by hole order — the hole 7 reversal means sorting by hole number
 * would put notes out of pitch order). Adjacent holes sometimes share the
 * same pitch (e.g. hole 2 draw and hole 3 blow are both G4) — both are kept
 * as distinct entries since they're different physical holes to learn.
 */
export const HARMONICA_NOTES: HarmonicaNote[] = HARMONICA_HOLES.flatMap((h) => [
  { hole: h.hole, direction: 'blow' as const, note: h.blow.note, octave: h.blow.octave, midi: midiOf(h.blow.note, h.blow.octave) },
  { hole: h.hole, direction: 'draw' as const, note: h.draw.note, octave: h.draw.octave, midi: midiOf(h.draw.note, h.draw.octave) },
]).sort((a, b) => a.midi - b.midi);

/**
 * A "fake fretboard" spanning every hole/direction on the harmonica, one
 * per fret on a single virtual string (string 0), ordered exactly as
 * HARMONICA_NOTES (low to high). This lets harmonica reuse the same
 * scale-exercise and lesson-position machinery built for fretted
 * instruments, just like voice's and handpan's virtual boards.
 */
export function getHarmonicaBoard(): FretPosition[] {
  return HARMONICA_NOTES.map((n, i) => ({ string: 0, fret: i, note: n.note, octave: n.octave }));
}

export function findHarmonicaNotes(note: NoteName, octave: number): HarmonicaNote[] {
  return HARMONICA_NOTES.filter((n) => n.note === note && n.octave === octave);
}
