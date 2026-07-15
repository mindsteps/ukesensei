import type { NoteName } from '../theory/notes';
import { getScaleNotes } from '../theory/scales';
import { getScalePositions, type FretPosition } from '../theory/fretboard';
import type { ExerciseDirection, ScaleExerciseConfig } from './types';

export function buildScalePath(
  fretboard: FretPosition[],
  scaleNotes: NoteName[],
  direction: ExerciseDirection,
): FretPosition[] {
  const scalePositions = getScalePositions(fretboard, scaleNotes);

  const sortedPositions = [...scalePositions].sort((a, b) => {
    const octDiff = a.octave - b.octave;
    if (octDiff !== 0) return octDiff;
    const aSemi = scaleNotes.indexOf(a.note);
    const bSemi = scaleNotes.indexOf(b.note);
    return aSemi - bSemi;
  });

  const rootNote = scaleNotes[0];
  const rootPositions = sortedPositions.filter((p) => p.note === rootNote);
  if (rootPositions.length === 0) return [];

  const startPos = rootPositions[0];
  const startOctave = startPos.octave;

  const ascending: FretPosition[] = [];
  const usedNotes = new Set<string>();

  for (const note of scaleNotes) {
    const candidates = scalePositions
      .filter((p) => p.note === note && p.octave === startOctave)
      .sort((a, b) => a.fret - b.fret);

    if (candidates.length > 0 && !usedNotes.has(note)) {
      ascending.push(candidates[0]);
      usedNotes.add(note);
    }
  }

  const octaveRoot = scalePositions
    .filter((p) => p.note === rootNote && p.octave === startOctave + 1)
    .sort((a, b) => a.fret - b.fret);
  if (octaveRoot.length > 0) {
    ascending.push(octaveRoot[0]);
  }

  if (direction === 'ascending') return ascending;
  if (direction === 'descending') return [...ascending].reverse();

  const descending = [...ascending].reverse().slice(1);
  return [...ascending, ...descending];
}

/**
 * Build a scale exercise from an arbitrary pitch-target board: a real
 * fretboard (`generateFretboard(tuning)`) for string instruments, or e.g.
 * voice's range board (`getVoiceRangeBoard()`) for non-fretted instruments.
 */
export function createScaleExerciseFromBoard(
  root: NoteName,
  scaleKey: string,
  board: FretPosition[],
  direction: ExerciseDirection = 'ascending',
): ScaleExerciseConfig {
  const scaleNotes = getScaleNotes(root, scaleKey);
  const positions = buildScalePath(board, scaleNotes, direction);

  return { root, scaleKey, direction, positions };
}
