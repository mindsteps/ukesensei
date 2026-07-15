import type { NoteName } from '../theory/notes';
import type { RhythmStep } from '../exercises/cajonPatterns';

export type LessonCategory = 'theory' | 'technique' | 'practice';

export type LessonContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'list'; items: string[] };

/**
 * A checkpoint is the gating exercise for a lesson. Positions are expressed as
 * [string, fret] tuples (string 0 = G, 1 = C, 2 = E, 3 = A) and resolved to
 * full FretPositions at runtime. The player must play them in order, plucking
 * one string at a time (monophonic), which is exactly how fingerpicking works.
 */
export interface PitchCheckpointDef {
  title: string;
  instructions: string;
  /** Root + scaleKey drive the fretboard scale overlay shown during the checkpoint. */
  root: NoteName;
  scaleKey: string;
  positions: [number, number][];
  /** Fraction of notes (0-1) that must be correct to pass and unlock the next lesson. */
  requiredAccuracy: number;
  /** Optional tempo. null = no metronome (free, untimed). */
  bpm: number | null;
}

/**
 * A rhythm checkpoint (cajon): the gating exercise is a hit-type + timing
 * pattern rather than a pitch sequence, graded by useRhythmExercise.ts
 * against real mic-detected onsets instead of pitch.
 */
export interface RhythmCheckpointDef {
  title: string;
  instructions: string;
  pattern: RhythmStep[];
  beatsPerLoop: number;
  loops: number;
  bpm: number;
  /** Fraction of hits (0-1) that must be correct to pass and unlock the next lesson. */
  requiredAccuracy: number;
}

export type CheckpointDef = PitchCheckpointDef | RhythmCheckpointDef;

/** True for rhythm (cajon) checkpoints; false for pitch checkpoints (every other instrument). Distinguished by the presence of `pattern`, which only rhythm checkpoints have. */
export function isRhythmCheckpoint(checkpoint: CheckpointDef): checkpoint is RhythmCheckpointDef {
  return 'pattern' in checkpoint;
}

/**
 * A practice drill: a freely-playable exercise that is NOT gated. Lets the
 * player warm up and build toward the lesson's checkpoint.
 */
export interface PitchPracticeExercise {
  id: string;
  title: string;
  instructions: string;
  root: NoteName;
  scaleKey: string;
  positions: [number, number][];
  bpm: number | null;
}

/** A freely-playable rhythm drill (cajon), NOT gated. */
export interface RhythmPracticeExercise {
  id: string;
  title: string;
  instructions: string;
  pattern: RhythmStep[];
  beatsPerLoop: number;
  loops: number;
  bpm: number;
}

export type PracticeExercise = PitchPracticeExercise | RhythmPracticeExercise;

/** True for rhythm (cajon) practice drills; distinguished the same way as isRhythmCheckpoint. */
export function isRhythmPractice(practice: PracticeExercise): practice is RhythmPracticeExercise {
  return 'pattern' in practice;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  category: LessonCategory;
  summary: string;
  content: LessonContentBlock[];
  /** Freely-playable warm-up drills for this lesson. */
  practice: PracticeExercise[];
  /** The gating exercise that must be passed to unlock the next lesson. */
  checkpoint: CheckpointDef;
}

export interface LessonModule {
  id: string;
  title: string;
  description: string;
}
