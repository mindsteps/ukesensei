import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { createScaleExerciseFromBoard } from './scaleExercises';
import type { ExerciseDirection } from './types';
import type { NoteName } from '../theory/notes';
import { generateFretboard, type FretPosition } from '../theory/fretboard';
import { getVoiceRangeBoard } from '../theory/voiceRange';
import { getHandpanBoard } from '../theory/handpanLayout';
import { getHarmonicaBoard } from '../theory/harmonicaLayout';
import { getCelloPitchBoard } from '../theory/celloPitches';

export interface CustomExerciseOptions {
  positions: FretPosition[];
  root: NoteName;
  scaleKey: string;
  title: string;
  lessonId?: string;
  requiredAccuracy?: number;
  bpm?: number | null;
}

const NOTE_HOLD_MS = 50;

interface UseExerciseOptions {
  getNearestBeatOffset?: (timestamp: number) => number;
}

export function useExercise(opts: UseExerciseOptions = {}) {
  const exercise = useAppStore((s) => s.exercise);
  const detectedNote = useAppStore((s) => s.detectedNote);
  const advanceExercise = useAppStore((s) => s.advanceExercise);
  const skipToIndex = useAppStore((s) => s.skipToIndex);
  const startExercise = useAppStore((s) => s.startExercise);
  const setView = useAppStore((s) => s.setView);
  const tuning = useAppStore((s) => s.tuning);
  const instrument = useAppStore((s) => s.instrument);
  const handpanLayoutKey = useAppStore((s) => s.handpanLayoutKey);

  const holdStartRef = useRef<number | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const getNearestBeatOffsetRef = useRef(opts.getNearestBeatOffset);
  getNearestBeatOffsetRef.current = opts.getNearestBeatOffset;

  const begin = useCallback(
    (root: NoteName, scaleKey: string, direction: ExerciseDirection = 'ascending', bpm: number | null = null, loops: number = 1) => {
      const board = instrument === 'voice' ? getVoiceRangeBoard()
        : instrument === 'handpan' ? getHandpanBoard(handpanLayoutKey)
        : instrument === 'harmonica' ? getHarmonicaBoard()
        : instrument === 'cello' ? getCelloPitchBoard()
        : generateFretboard(tuning);
      const config = createScaleExerciseFromBoard(root, scaleKey, board, direction);
      // Repeat the scale path for the requested number of loops
      let positions = config.positions;
      if (loops > 1) {
        const loopPositions: typeof positions = [];
        for (let i = 0; i < loops; i++) {
          if (i > 0) {
            // Skip the first note of subsequent loops (it's the same as the last of the previous)
            loopPositions.push(...positions.slice(1));
          } else {
            loopPositions.push(...positions);
          }
        }
        positions = loopPositions;
      }
      startExercise({
        scaleKey,
        root,
        currentNoteIndex: 0,
        targetPositions: positions,
        notesPlayed: [],
        isComplete: false,
        startedAt: Date.now(),
        bpm,
      });
      setView('freeplay');
    },
    [startExercise, setView, tuning, instrument, handpanLayoutKey],
  );

  const beginCustom = useCallback(
    (opts: CustomExerciseOptions) => {
      startExercise({
        scaleKey: opts.scaleKey,
        root: opts.root,
        currentNoteIndex: 0,
        targetPositions: opts.positions,
        notesPlayed: [],
        isComplete: false,
        startedAt: Date.now(),
        bpm: opts.bpm ?? null,
        title: opts.title,
        lessonId: opts.lessonId,
        requiredAccuracy: opts.requiredAccuracy,
      });
      setView('freeplay');
    },
    [startExercise, setView],
  );

  // How far ahead to look for a matching note when the player genuinely skips.
  // Kept small so a stray/ringing note can't jump to a much later position
  // (e.g. a scale that ends on the same note it started on).
  const LOOK_AHEAD = 3;
  // A skip must be held a bit longer than a normal advance to be accepted,
  // so brief overtones or a decaying previous note don't trigger one.
  const SKIP_HOLD_MS = 130;

  useEffect(() => {
    if (!exercise || exercise.isComplete || !detectedNote) {
      holdStartRef.current = null;
      lastNoteRef.current = null;
      return;
    }

    const target = exercise.targetPositions[exercise.currentNoteIndex];
    if (!target) return;

    const noteKey = `${detectedNote.note}${detectedNote.octave}`;
    const isCorrectNote = detectedNote.note === target.note;

    if (isCorrectNote) {
      if (lastNoteRef.current === noteKey) {
        if (holdStartRef.current && Date.now() - holdStartRef.current >= NOTE_HOLD_MS) {
          const beatOffset = getNearestBeatOffsetRef.current
            ? getNearestBeatOffsetRef.current(Date.now())
            : null;
          advanceExercise(true, detectedNote.cents, beatOffset);
          holdStartRef.current = null;
          lastNoteRef.current = null;
        }
      } else {
        lastNoteRef.current = noteKey;
        holdStartRef.current = Date.now();
      }
    } else {
      // The note we just played is probably still ringing out. Ignore it so it
      // can't be mistaken for a wrong note or used to trigger a skip ahead.
      const prevTarget = exercise.targetPositions[exercise.currentNoteIndex - 1];
      if (prevTarget && detectedNote.note === prevTarget.note) {
        return;
      }

      // Look ahead a little: if the player jumped forward to an upcoming note,
      // skip to it. The window is intentionally short.
      let foundAhead = -1;
      const limit = Math.min(
        exercise.currentNoteIndex + 1 + LOOK_AHEAD,
        exercise.targetPositions.length,
      );
      for (let i = exercise.currentNoteIndex + 1; i < limit; i++) {
        if (exercise.targetPositions[i].note === detectedNote.note) {
          foundAhead = i;
          break;
        }
      }

      if (foundAhead >= 0 && lastNoteRef.current === noteKey) {
        if (holdStartRef.current && Date.now() - holdStartRef.current >= SKIP_HOLD_MS) {
          const skipped = foundAhead - exercise.currentNoteIndex;
          skipToIndex(foundAhead, skipped);
          const beatOffset = getNearestBeatOffsetRef.current
            ? getNearestBeatOffsetRef.current(Date.now())
            : null;
          advanceExercise(true, detectedNote.cents, beatOffset);
          holdStartRef.current = null;
          lastNoteRef.current = null;
        }
      } else if (lastNoteRef.current !== noteKey) {
        lastNoteRef.current = noteKey;
        holdStartRef.current = foundAhead >= 0 ? Date.now() : null;
      }
    }
  }, [exercise, detectedNote, advanceExercise, skipToIndex]);

  return { exercise, begin, beginCustom };
}
