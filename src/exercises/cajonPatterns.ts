/**
 * Cajon has no stable pitch, so it can't be graded by the pitch-target
 * system every other instrument uses. Instead, a "pattern" is a sequence of
 * hit types placed at beat offsets, graded by matching real mic-detected
 * hits (see useOnsetDetection.ts) against the expected hit type + timing at
 * each beat (see useRhythmExercise.ts).
 */
export type CajonHitType = 'bass' | 'slap' | 'ghost';

export const HIT_LABELS: Record<CajonHitType, string> = {
  bass: 'Bass',
  slap: 'Slap',
  ghost: 'Ghost',
};

/** One expected hit in a rhythm pattern. */
export interface RhythmStep {
  hit: CajonHitType;
  /** Position within one loop of the pattern, in beats from the loop start (0-indexed). Supports fractional beats, e.g. 0.5 for eighth notes. */
  beat: number;
}

/** A named, reusable groove for the standalone Cajon exercises tab. */
export interface RhythmPatternConfig {
  id: string;
  title: string;
  description: string;
  pattern: RhythmStep[];
  /** Length of one loop of the pattern, in beats (4 = one 4/4 measure). */
  beatsPerLoop: number;
  defaultBpm: number;
  defaultLoops: number;
}
