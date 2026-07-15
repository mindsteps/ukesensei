import type { FretPosition } from '../theory/fretboard';
import type { Lesson, LessonModule } from './types';

/**
 * A fully-resolved lesson curriculum for one instrument. Position tuples in a
 * curriculum's lessons are `[string, fret]` pairs relative to that curriculum's
 * own `referenceBoard` -- NOT necessarily the tuning the player currently has
 * selected in the app (e.g. the ukulele curriculum is always resolved against
 * Low-G, even if the player is in Standard tuning; note names are identical
 * across tunings for a given string/fret, only the octave differs). For
 * instruments with no real fretboard (e.g. voice), the reference board can be
 * any FretPosition[] that defines the pitch targets `[string, fret]` map to --
 * see voiceRange.ts's getVoiceRangeBoard().
 */
export interface Curriculum {
  id: string;
  title: string;
  description: string;
  modules: LessonModule[];
  lessons: Lesson[];
  resolvePositions: (tuples: [number, number][]) => FretPosition[];
  getLessonById: (id: string) => Lesson | undefined;
  getLessonIndex: (id: string) => number;
  getNextLessonId: (id: string) => string | null;
  getLessonsForModule: (moduleId: string) => Lesson[];
  isLessonUnlocked: (id: string, completed: string[]) => boolean;
}

export interface CreateCurriculumOptions {
  id: string;
  title: string;
  description: string;
  /** The board that this curriculum's `[string, fret]` position tuples are resolved against. */
  referenceBoard: FretPosition[];
  modules: LessonModule[];
  lessons: Lesson[];
}

export function createCurriculum(opts: CreateCurriculumOptions): Curriculum {
  const { id, title, description, referenceBoard, modules, lessons } = opts;

  function resolvePositions(tuples: [number, number][]): FretPosition[] {
    return tuples.map(([string, fret]) => {
      const pos = referenceBoard.find((p) => p.string === string && p.fret === fret);
      if (!pos) throw new Error(`Invalid position s${string}f${fret} in curriculum "${id}"`);
      return pos;
    });
  }

  function getLessonById(lessonId: string): Lesson | undefined {
    return lessons.find((l) => l.id === lessonId);
  }

  function getLessonIndex(lessonId: string): number {
    return lessons.findIndex((l) => l.id === lessonId);
  }

  function getNextLessonId(lessonId: string): string | null {
    const idx = getLessonIndex(lessonId);
    if (idx === -1 || idx >= lessons.length - 1) return null;
    return lessons[idx + 1].id;
  }

  function getLessonsForModule(moduleId: string): Lesson[] {
    return lessons.filter((l) => l.moduleId === moduleId);
  }

  /**
   * A lesson is unlocked if it is the first lesson, or the immediately
   * preceding lesson has been completed.
   */
  function isLessonUnlocked(lessonId: string, completed: string[]): boolean {
    const idx = getLessonIndex(lessonId);
    if (idx <= 0) return true;
    return completed.includes(lessons[idx - 1].id);
  }

  return {
    id,
    title,
    description,
    modules,
    lessons,
    resolvePositions,
    getLessonById,
    getLessonIndex,
    getNextLessonId,
    getLessonsForModule,
    isLessonUnlocked,
  };
}
