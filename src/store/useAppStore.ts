import { create } from 'zustand';
import type { NoteName } from '../theory/notes';
import type { FretPosition, Instrument, InstrumentTuning } from '../theory/fretboard';
import { DEFAULT_TUNING_KEY, TUNINGS_BY_INSTRUMENT, isStringInstrument, supportsExercises } from '../theory/fretboard';
import { DEFAULT_HANDPAN_LAYOUT_KEY, isHandpanLayoutKey, type HandpanLayoutKey } from '../theory/handpanLayout';
import { pathToState } from '../routing/url';
import { hasCurriculum } from '../lessons/registry';
import type { CajonHitType, RhythmStep } from '../exercises/cajonPatterns';

export type AppView = 'freeplay' | 'exercises' | 'lessons' | 'library' | 'playback' | 'admin' | 'about' | 'profile';
export type TuningKey = string;
export type Theme = 'dark' | 'light';
export type { Instrument };

export interface DetectedNote {
  note: NoteName;
  octave: number;
  frequency: number;
  clarity: number;
  cents: number;
  timestamp: number;
}

export interface ExerciseNotePlayed {
  correct: boolean;
  cents: number;
  timestamp: number;
  beatOffset: number | null;
}

export interface ExerciseState {
  scaleKey: string;
  root: NoteName;
  currentNoteIndex: number;
  targetPositions: FretPosition[];
  notesPlayed: ExerciseNotePlayed[];
  isComplete: boolean;
  startedAt: number | null;
  bpm: number | null;
  /** Optional custom title (used by lesson checkpoints instead of the scale name). */
  title?: string;
  /** Set when this exercise is a lesson checkpoint; drives gating on completion. */
  lessonId?: string;
  /** Fraction of notes (0-1) required to pass a lesson checkpoint. */
  requiredAccuracy?: number;
}

export interface DetectedHit {
  type: CajonHitType;
  /** Peak RMS level of the onset, roughly 0-1. */
  level: number;
  timestamp: number;
}

export interface RhythmHitPlayed {
  correct: boolean;
  /** The hit type the mic actually detected for this step, or null if the step's timing window elapsed with no hit at all (a miss). */
  hitType: CajonHitType | null;
  beatOffsetMs: number | null;
  timestamp: number;
}

export interface RhythmExerciseState {
  /** Every expected hit across all loops, flattened, with `beat` as an absolute beat offset from the exercise start (loop N's steps are offset by N * beatsPerLoop). */
  targetSteps: RhythmStep[];
  currentStepIndex: number;
  hitsPlayed: RhythmHitPlayed[];
  isComplete: boolean;
  startedAt: number | null;
  bpm: number;
  /** Optional custom title (used by lesson checkpoints instead of the pattern name). */
  title?: string;
  /** Set when this exercise is a lesson checkpoint; drives gating on completion. */
  lessonId?: string;
  /** Fraction of hits (0-1) required to pass a lesson checkpoint. */
  requiredAccuracy?: number;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('uke-sensei-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

const INSTRUMENT_KEY = 'uke-sensei-instrument';

function getInitialInstrument(): Instrument {
  if (typeof window === 'undefined') return 'ukulele';
  const stored = localStorage.getItem(INSTRUMENT_KEY);
  if (
    stored === 'ukulele' || stored === 'bass' || stored === 'guitar' || stored === 'clarinet' ||
    stored === 'voice' || stored === 'handpan' || stored === 'cajon'
  ) return stored;
  return 'ukulele';
}

const HANDPAN_LAYOUT_KEY = 'uke-sensei-handpan-layout';

function getInitialHandpanLayoutKey(): HandpanLayoutKey {
  if (typeof window === 'undefined') return DEFAULT_HANDPAN_LAYOUT_KEY;
  const stored = localStorage.getItem(HANDPAN_LAYOUT_KEY);
  if (stored && isHandpanLayoutKey(stored)) return stored;
  return DEFAULT_HANDPAN_LAYOUT_KEY;
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (theme === 'dark') {
    el.classList.add('dark');
  } else {
    el.classList.remove('dark');
  }
}

interface AppState {
  view: AppView;
  setView: (view: AppView) => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Instrument
  instrument: Instrument;
  setInstrument: (instrument: Instrument) => void;

  // Tuning
  tuningKey: TuningKey;
  tuning: InstrumentTuning;
  setTuning: (key: TuningKey) => void;
  tuningAutoDetected: boolean;
  setTuningAutoDetected: (v: boolean) => void;

  // Handpan scale/layout (handpan's equivalent of a tuning)
  handpanLayoutKey: HandpanLayoutKey;
  setHandpanLayoutKey: (key: HandpanLayoutKey) => void;

  // Audio
  isListening: boolean;
  setListening: (listening: boolean) => void;
  detectedNote: DetectedNote | null;
  setDetectedNote: (note: DetectedNote | null) => void;
  audioLevel: number;
  setAudioLevel: (level: number) => void;
  detectedHit: DetectedHit | null;
  setDetectedHit: (hit: DetectedHit | null) => void;

  // Fretboard
  fretboardInverted: boolean;
  setFretboardInverted: (v: boolean) => void;

  // Scale selection
  selectedRoot: NoteName;
  setSelectedRoot: (root: NoteName) => void;
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  showScale: boolean;
  setShowScale: (show: boolean) => void;

  // Exercise
  exercise: ExerciseState | null;
  startExercise: (exercise: ExerciseState) => void;
  advanceExercise: (correct: boolean, cents: number, beatOffset?: number | null) => void;
  skipToIndex: (index: number, skippedCount: number) => void;
  completeExercise: () => void;
  clearExercise: () => void;

  // Rhythm exercise (Cajon)
  rhythmExercise: RhythmExerciseState | null;
  startRhythmExercise: (exercise: RhythmExerciseState) => void;
  advanceRhythmExercise: (correct: boolean, hitType: CajonHitType | null, beatOffsetMs?: number | null) => void;
  completeRhythmExercise: () => void;
  clearRhythmExercise: () => void;

  // Session playback
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  // Lesson navigation
  selectedLessonId: string | null;
  setSelectedLessonId: (id: string | null) => void;

  // Lesson progress
  completedLessons: string[];
  completeLesson: (id: string) => void;
  resetLessonProgress: () => void;

  // Welcome tour (first-run product tour)
  tourComplete: boolean;
  tourOpen: boolean;
  openTour: () => void;
  finishTour: () => void;
}

const LESSON_PROGRESS_KEY = 'uke-sensei-lessons';

const TOUR_COMPLETE_KEY = 'uke-sensei-tour-complete';

function getInitialTourComplete(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TOUR_COMPLETE_KEY) === '1';
}

function persistTourComplete() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOUR_COMPLETE_KEY, '1');
  } catch {
    /* storage may be unavailable */
  }
}

function getInitialLessonProgress(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LESSON_PROGRESS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    }
  } catch {
    /* ignore malformed storage */
  }
  return [];
}

function persistLessonProgress(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    /* storage may be unavailable */
  }
}

const initialTheme = getInitialTheme();
applyThemeClass(initialTheme);

const initialInstrument = getInitialInstrument();
// Clarinet has no tuning concept; fall back to a harmless placeholder tuning
// (unused by anything clarinet-related) so `tuning` always has a value.
const initialTuningKey = isStringInstrument(initialInstrument)
  ? DEFAULT_TUNING_KEY[initialInstrument]
  : DEFAULT_TUNING_KEY.ukulele;

const initialRoute =
  typeof window !== 'undefined'
    ? pathToState(window.location.pathname)
    : { view: 'freeplay' as AppView, lessonId: null, sessionId: null };

const initialTourComplete = getInitialTourComplete();

export const useAppStore = create<AppState>((set) => ({
  view: initialRoute.view,
  setView: (view) => set({ view }),

  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('uke-sensei-theme', next);
      applyThemeClass(next);
      return { theme: next };
    }),

  instrument: initialInstrument,
  setInstrument: (instrument) =>
    set((state) => {
      if (state.instrument === instrument) return state;
      localStorage.setItem(INSTRUMENT_KEY, instrument);
      // Clarinet has no tuning/fretboard, so leave tuning untouched (it's unused).
      const tuningKey = isStringInstrument(instrument) ? DEFAULT_TUNING_KEY[instrument] : state.tuningKey;
      const tuning = isStringInstrument(instrument)
        ? TUNINGS_BY_INSTRUMENT[instrument][tuningKey]
        : state.tuning;
      // Exercises/lessons don't apply when the instrument doesn't support them.
      const view = !supportsExercises(instrument) && state.view === 'exercises'
        ? 'freeplay'
        : !hasCurriculum(instrument) && state.view === 'lessons'
          ? 'freeplay'
          : state.view;
      return {
        instrument,
        tuningKey,
        tuning,
        tuningAutoDetected: false,
        // Fret positions from the previous instrument's board don't apply anymore.
        exercise: null,
        view,
      };
    }),

  tuningKey: initialTuningKey,
  tuning: isStringInstrument(initialInstrument)
    ? TUNINGS_BY_INSTRUMENT[initialInstrument][initialTuningKey]
    : TUNINGS_BY_INSTRUMENT.ukulele[initialTuningKey],
  setTuning: (key) =>
    set((state) => ({
      tuningKey: key,
      tuning: isStringInstrument(state.instrument)
        ? TUNINGS_BY_INSTRUMENT[state.instrument][key]
        : state.tuning,
    })),
  tuningAutoDetected: false,
  setTuningAutoDetected: (tuningAutoDetected) => set({ tuningAutoDetected }),

  handpanLayoutKey: getInitialHandpanLayoutKey(),
  setHandpanLayoutKey: (handpanLayoutKey) =>
    set(() => {
      localStorage.setItem(HANDPAN_LAYOUT_KEY, handpanLayoutKey);
      return { handpanLayoutKey };
    }),

  isListening: false,
  setListening: (isListening) => set({ isListening }),
  detectedNote: null,
  setDetectedNote: (detectedNote) => set({ detectedNote }),
  audioLevel: 0,
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  detectedHit: null,
  setDetectedHit: (detectedHit) => set({ detectedHit }),

  fretboardInverted: false,
  setFretboardInverted: (fretboardInverted) => set({ fretboardInverted }),

  selectedRoot: 'C',
  setSelectedRoot: (selectedRoot) => set({ selectedRoot }),
  selectedScale: 'ionian',
  setSelectedScale: (selectedScale) => set({ selectedScale }),
  showScale: true,
  setShowScale: (showScale) => set({ showScale }),

  exercise: null,
  startExercise: (exercise) => set({ exercise }),
  advanceExercise: (correct, cents, beatOffset = null) =>
    set((state) => {
      if (!state.exercise || state.exercise.isComplete) return state;
      const notesPlayed: ExerciseNotePlayed[] = [
        ...state.exercise.notesPlayed,
        { correct, cents, timestamp: Date.now(), beatOffset },
      ];
      const nextIndex = state.exercise.currentNoteIndex + (correct ? 1 : 0);
      const isComplete = nextIndex >= state.exercise.targetPositions.length;
      return {
        exercise: {
          ...state.exercise,
          notesPlayed,
          currentNoteIndex: nextIndex,
          isComplete,
        },
      };
    }),
  skipToIndex: (index, skippedCount) =>
    set((state) => {
      if (!state.exercise || state.exercise.isComplete) return state;
      const skippedNotes: ExerciseNotePlayed[] = [];
      for (let i = 0; i < skippedCount; i++) {
        skippedNotes.push({ correct: false, cents: 0, timestamp: Date.now(), beatOffset: null });
      }
      return {
        exercise: {
          ...state.exercise,
          notesPlayed: [...state.exercise.notesPlayed, ...skippedNotes],
          currentNoteIndex: index,
        },
      };
    }),
  completeExercise: () =>
    set((state) => {
      if (!state.exercise) return state;
      return { exercise: { ...state.exercise, isComplete: true } };
    }),
  clearExercise: () => set({ exercise: null, view: 'exercises' }),

  rhythmExercise: null,
  startRhythmExercise: (rhythmExercise) => set({ rhythmExercise }),
  advanceRhythmExercise: (correct, hitType, beatOffsetMs = null) =>
    set((state) => {
      if (!state.rhythmExercise || state.rhythmExercise.isComplete) return state;
      const hitsPlayed: RhythmHitPlayed[] = [
        ...state.rhythmExercise.hitsPlayed,
        { correct, hitType, beatOffsetMs, timestamp: Date.now() },
      ];
      const nextIndex = state.rhythmExercise.currentStepIndex + 1;
      const isComplete = nextIndex >= state.rhythmExercise.targetSteps.length;
      return {
        rhythmExercise: {
          ...state.rhythmExercise,
          hitsPlayed,
          currentStepIndex: nextIndex,
          isComplete,
        },
      };
    }),
  completeRhythmExercise: () =>
    set((state) => {
      if (!state.rhythmExercise) return state;
      return { rhythmExercise: { ...state.rhythmExercise, isComplete: true } };
    }),
  clearRhythmExercise: () => set({ rhythmExercise: null, view: 'exercises' }),

  selectedSessionId: initialRoute.sessionId,
  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),

  selectedLessonId: initialRoute.lessonId,
  setSelectedLessonId: (selectedLessonId) => set({ selectedLessonId }),

  completedLessons: getInitialLessonProgress(),
  completeLesson: (id) =>
    set((state) => {
      if (state.completedLessons.includes(id)) return state;
      const next = [...state.completedLessons, id];
      persistLessonProgress(next);
      return { completedLessons: next };
    }),
  resetLessonProgress: () =>
    set(() => {
      persistLessonProgress([]);
      return { completedLessons: [] };
    }),

  tourComplete: initialTourComplete,
  // Auto-open on first run for brand-new (non-persisted) users; explicit
  // restarts go through openTour().
  tourOpen: !initialTourComplete,
  openTour: () => set({ tourOpen: true }),
  finishTour: () =>
    set(() => {
      persistTourComplete();
      return { tourOpen: false, tourComplete: true };
    }),
}));
