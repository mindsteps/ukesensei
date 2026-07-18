import { type NoteName, noteToSemitone, semitoneToNote } from './notes';
import type { FretPosition, InstrumentTuning } from './fretboard';

/**
 * Cello is a fretless instrument with four open strings tuned A-D-G-C
 * (from thinnest/highest to thickest/lowest). Each string spans approximately
 * 3.5 octaves, and a cellist finds pitches by ear and by precise finger placement.
 *
 * This module creates a virtual pitch board where each string maps to a
 * chromatic range starting from its open pitch. Unlike a fretted instrument,
 * there's no discrete "fret" — instead, we map semitones continuously across
 * each string. A position [string, fret] means "on string N, at semitone offset
 * fret above the open pitch of that string."
 *
 * Open string pitches (A3-D3-G2-C2):
 * - String 0 (A): A3
 * - String 1 (D): D3
 * - String 2 (G): G2
 * - String 3 (C): C2
 *
 * This lets cello reuse the same exercise/lesson machinery as other
 * pitch-based instruments (voice, handpan), but with four strings instead of one.
 */

export interface CelloString {
  name: 'A' | 'D' | 'G' | 'C';
  openNote: NoteName;
  openOctave: number;
}

export const CELLO_STRINGS: CelloString[] = [
  { name: 'A', openNote: 'A', openOctave: 3 },
  { name: 'D', openNote: 'D', openOctave: 3 },
  { name: 'G', openNote: 'G', openOctave: 2 },
  { name: 'C', openNote: 'C', openOctave: 2 },
];

/**
 * Cello has no alternate tunings (unlike ukulele/bass/guitar), but it's
 * still drawn using the same fretboard visualization as those instruments --
 * this lets the app reuse the generic <Fretboard> component and its
 * scale/exercise-target highlighting instead of building a bespoke diagram.
 * "Frets" here just mean semitone offsets from the open string, same as
 * getCelloPitchBoard(); the curriculum never needs more than a handful of
 * semitones per string, well within the standard NUM_FRETS range.
 */
export const CELLO_TUNING: InstrumentTuning = {
  name: 'Standard (A-D-G-C)',
  strings: CELLO_STRINGS.map((s) => ({ note: s.openNote, octave: s.openOctave })),
};

/**
 * The range of semitones that can be played on a single string, relative to
 * its open pitch. This allows for a comfortable playing range that covers
 * about 3.5 octaves (42 semitones) per string, covering beginner through
 * advanced repertoire without excessive shifts.
 */
export const SEMITONES_PER_STRING = 42;

/**
 * Generate a virtual pitch board for cello. Each string gets a chromatic
 * range starting from its open pitch. Positions are stored as [string, offset]
 * where offset is the number of semitones above the open string pitch.
 *
 * This returns an array ordered by string and then by semitone offset,
 * making it easy to resolve `[string, offset]` tuples to actual note pitches.
 */
export function getCelloPitchBoard(): FretPosition[] {
  const board: FretPosition[] = [];

  for (let stringIdx = 0; stringIdx < CELLO_STRINGS.length; stringIdx++) {
    const str = CELLO_STRINGS[stringIdx];
    const openSemitone = noteToSemitone(str.openNote);
    const openOctave = str.openOctave;

    // For each semitone offset on this string
    for (let offset = 0; offset <= SEMITONES_PER_STRING; offset++) {
      const totalSemitones = openSemitone + offset;
      const octaveOffset = Math.floor(totalSemitones / 12);
      const noteWithinOctave = totalSemitones % 12;
      const note = semitoneToNote(noteWithinOctave);
      const octave = openOctave + octaveOffset;

      board.push({
        string: stringIdx,
        fret: offset, // Using "fret" nomenclature for compatibility, though it's actually semitone offset
        note,
        octave,
      });
    }
  }

  return board;
}

/**
 * Find the closest playable pitch on a cello to a target note/octave.
 * This is useful for generating exercises: given a desired note, find which
 * string (if any) can play it, and at what semitone offset.
 *
 * Returns [stringIndex, semitoneOffset] or null if the note is outside the range.
 */
export function findCelloPitch(targetNote: NoteName, targetOctave: number): [number, number] | null {
  const targetSemitone = noteToSemitone(targetNote);
  const targetAbsoluteValue = (targetOctave + 1) * 12 + targetSemitone;

  for (let stringIdx = 0; stringIdx < CELLO_STRINGS.length; stringIdx++) {
    const str = CELLO_STRINGS[stringIdx];
    const openSemitone = noteToSemitone(str.openNote);
    const openAbsoluteValue = (str.openOctave + 1) * 12 + openSemitone;

    const offset = targetAbsoluteValue - openAbsoluteValue;

    // Check if this offset is within the playable range
    if (offset >= 0 && offset <= SEMITONES_PER_STRING) {
      return [stringIdx, offset];
    }
  }

  return null;
}

/**
 * Find the lowest string that can play a given pitch (useful for
 * selecting a preferred string for exercises).
 */
export function findLowestCelloString(note: NoteName, octave: number): number | null {
  const pitch = findCelloPitch(note, octave);
  if (!pitch) return null;

  // Search from the lowest string downward to see if other strings can play it
  for (let s = CELLO_STRINGS.length - 1; s > pitch[0]; s--) {
    const candidate = findCelloPitch(note, octave);
    if (candidate && candidate[0] === s) {
      return s;
    }
  }

  return pitch[0];
}
