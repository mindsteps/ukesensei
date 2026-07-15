import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { RhythmStep } from './cajonPatterns';

export interface CustomRhythmExerciseOptions {
  pattern: RhythmStep[];
  beatsPerLoop: number;
  loops: number;
  bpm: number;
  title: string;
  lessonId?: string;
  requiredAccuracy?: number;
}

/** How close (ms) a detected hit must land to an expected step's time to count as an attempt at that step. */
const HIT_WINDOW_MS = 200;
/** Extra grace after a step's hit window closes before it's declared a miss, to absorb scheduling jitter. */
const MISS_GRACE_MS = 120;

function flattenPattern(pattern: RhythmStep[], beatsPerLoop: number, loops: number): RhythmStep[] {
  const steps: RhythmStep[] = [];
  for (let loop = 0; loop < loops; loop++) {
    for (const step of pattern) {
      steps.push({ hit: step.hit, beat: loop * beatsPerLoop + step.beat });
    }
  }
  return steps;
}

/**
 * Drives a cajon rhythm exercise: expected hit times are computed directly
 * from `startedAt` + bpm (its own self-contained clock, in the same Date.now()
 * domain as useOnsetDetection's hit timestamps), rather than the metronome's
 * internal AudioContext clock -- this keeps hit-matching and miss-detection
 * exact without needing the two clocks to agree.
 */
export function useRhythmExercise() {
  const rhythmExercise = useAppStore((s) => s.rhythmExercise);
  const detectedHit = useAppStore((s) => s.detectedHit);
  const advanceRhythmExercise = useAppStore((s) => s.advanceRhythmExercise);
  const startRhythmExerciseAction = useAppStore((s) => s.startRhythmExercise);
  const setView = useAppStore((s) => s.setView);

  const lastGradedHitTimestampRef = useRef<number | null>(null);
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginCustom = useCallback((opts: CustomRhythmExerciseOptions) => {
    const targetSteps = flattenPattern(opts.pattern, opts.beatsPerLoop, opts.loops);
    lastGradedHitTimestampRef.current = null;
    startRhythmExerciseAction({
      targetSteps,
      currentStepIndex: 0,
      hitsPlayed: [],
      isComplete: false,
      startedAt: Date.now(),
      bpm: opts.bpm,
      title: opts.title,
      lessonId: opts.lessonId,
      requiredAccuracy: opts.requiredAccuracy,
    });
    setView('freeplay');
  }, [startRhythmExerciseAction, setView]);

  const expectedTimestampFor = useCallback((index: number): number | null => {
    if (!rhythmExercise?.startedAt) return null;
    const step = rhythmExercise.targetSteps[index];
    if (!step) return null;
    const msPerBeat = 60000 / rhythmExercise.bpm;
    return rhythmExercise.startedAt + step.beat * msPerBeat;
  }, [rhythmExercise]);

  // Grade an incoming detected hit against whichever step is currently expected.
  useEffect(() => {
    if (!rhythmExercise || rhythmExercise.isComplete || !detectedHit) return;
    if (detectedHit.timestamp === lastGradedHitTimestampRef.current) return;

    const idx = rhythmExercise.currentStepIndex;
    const expected = expectedTimestampFor(idx);
    if (expected == null) return;

    const offset = detectedHit.timestamp - expected;
    if (Math.abs(offset) <= HIT_WINDOW_MS) {
      lastGradedHitTimestampRef.current = detectedHit.timestamp;
      const step = rhythmExercise.targetSteps[idx];
      const correct = detectedHit.type === step.hit;
      advanceRhythmExercise(correct, detectedHit.type, Math.round(offset));
    }
    // Hits outside the current step's window are ignored as stray/extra taps.
  }, [detectedHit, rhythmExercise, expectedTimestampFor, advanceRhythmExercise]);

  // Time-driven miss detection: once a step's window closes with no matching hit, grade it as a miss and move on.
  useEffect(() => {
    if (missTimerRef.current) {
      clearTimeout(missTimerRef.current);
      missTimerRef.current = null;
    }
    if (!rhythmExercise || rhythmExercise.isComplete) return;

    const idx = rhythmExercise.currentStepIndex;
    const expected = expectedTimestampFor(idx);
    if (expected == null) return;

    const declareMiss = () => {
      const current = useAppStore.getState().rhythmExercise;
      if (current && !current.isComplete && current.currentStepIndex === idx) {
        advanceRhythmExercise(false, null, null);
      }
    };

    const delay = expected + HIT_WINDOW_MS + MISS_GRACE_MS - Date.now();
    if (delay <= 0) {
      declareMiss();
    } else {
      missTimerRef.current = setTimeout(declareMiss, delay);
    }

    return () => {
      if (missTimerRef.current) {
        clearTimeout(missTimerRef.current);
        missTimerRef.current = null;
      }
    };
  }, [rhythmExercise, expectedTimestampFor, advanceRhythmExercise]);

  return { rhythmExercise, beginCustom };
}
