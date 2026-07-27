import { type NoteName, noteToSemitone } from './notes';
import type { FretPosition } from './fretboard';
import { HARMONICA_TUNINGS, DEFAULT_HARMONICA_TUNING } from './harmonicaTunings';

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

/**
 * Default harmonica layout (C major Richter tuning).
 * For other keys, use getHarmonicaBoard(tuningKey) instead.
 */
export const HARMONICA_HOLES: HarmonicaHole[] = DEFAULT_HARMONICA_TUNING.holes;

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
 * Every blow/draw note on the harmonica (default C tuning), sorted low to high by actual pitch.
 * For other tunings, use getHarmonicaNotes(tuning.holes) instead.
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
export function getHarmonicaBoard(tuningKey: string = 'richter_c'): FretPosition[] {
  const tuning = HARMONICA_TUNINGS[tuningKey] || DEFAULT_HARMONICA_TUNING;
  return getHarmonicaNotes(tuning.holes).map((n, i) => ({ string: 0, fret: i, note: n.note, octave: n.octave }));
}

/**
 * Get the harmonica notes for a specific tuning, sorted by pitch (low to high).
 */
function getHarmonicaNotes(holes: HarmonicaHole[]): HarmonicaNote[] {
  const notes = holes.flatMap((h) => [
    { hole: h.hole, direction: 'blow' as const, note: h.blow.note, octave: h.blow.octave, midi: midiOf(h.blow.note, h.blow.octave) },
    { hole: h.hole, direction: 'draw' as const, note: h.draw.note, octave: h.draw.octave, midi: midiOf(h.draw.note, h.draw.octave) },
  ]);
  return notes.sort((a, b) => a.midi - b.midi);
}

/**
 * Find which hole/direction(s) on the harmonica can play a given note.
 * Uses the default C major tuning. For other tunings, use findHarmonicaNotesByTuning.
 */
export function findHarmonicaNotes(note: NoteName, octave: number): HarmonicaNote[] {
  return HARMONICA_NOTES.filter((n) => n.note === note && n.octave === octave);
}

/**
 * Find which hole/direction(s) on the harmonica can play a given note (tuning-specific).
 */
export function findHarmonicaNotesByTuning(note: NoteName, octave: number, tuningKey: string = 'richter_c'): HarmonicaNote[] {
  const tuning = HARMONICA_TUNINGS[tuningKey] || DEFAULT_HARMONICA_TUNING;
  const notes = getHarmonicaNotes(tuning.holes);
  return notes.filter((n) => n.note === note && n.octave === octave);
}
