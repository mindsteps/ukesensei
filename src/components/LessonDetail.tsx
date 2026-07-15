import type { Lesson, PracticeExercise } from '../lessons/types';
import { isRhythmCheckpoint } from '../lessons/types';
import type { Curriculum } from '../lessons/curriculum';
import { displayNote } from '../theory/notes';

interface LessonDetailProps {
  curriculum: Curriculum;
  lesson: Lesson;
  completed: boolean;
  onStartCheckpoint: () => void;
  onStartPractice: (practice: PracticeExercise) => void;
  onBack: () => void;
}

export function LessonDetail({ curriculum, lesson, completed, onStartCheckpoint, onStartPractice, onBack }: LessonDetailProps) {
  const idx = curriculum.getLessonIndex(lesson.id);
  const cp = lesson.checkpoint;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          title="Back to lesson path"
          className="text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition p-1 mt-0.5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--c-text-muted)]">Lesson {idx + 1} of {curriculum.lessons.length}</span>
            {completed && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                Completed
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-[var(--c-text-strong)]">{lesson.title}</h1>
        </div>
      </div>

      {/* Theory content */}
      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-5 space-y-3">
        {lesson.content.map((block, i) => {
          if (block.type === 'heading') {
            return (
              <h3 key={i} className="text-sm font-semibold text-[var(--c-accent)] pt-1">
                {block.text}
              </h3>
            );
          }
          if (block.type === 'paragraph') {
            return (
              <p key={i} className="text-sm text-[var(--c-text-subtle)] leading-relaxed">
                {block.text}
              </p>
            );
          }
          if (block.type === 'tip') {
            return (
              <div key={i} className="flex gap-2 bg-teal-500/10 border border-teal-500/25 rounded-lg p-3">
                <span className="text-teal-400 text-sm font-bold shrink-0">Tip</span>
                <p className="text-sm text-[var(--c-text-subtle)] leading-relaxed">{block.text}</p>
              </div>
            );
          }
          // list
          return (
            <ul key={i} className="space-y-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-[var(--c-text-subtle)]">
                  <span className="text-teal-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        })}
      </div>

      {/* Practice drills */}
      {lesson.practice.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-muted)]">
              Practice Drills
            </span>
            <span className="text-xs text-[var(--c-text-muted)]">Warm up — not graded</span>
          </div>
          <div className="space-y-1.5">
            {lesson.practice.map((drill) => (
              <div
                key={drill.id}
                className="flex items-center gap-3 bg-[var(--c-surface)] rounded-lg border border-[var(--c-border)] px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--c-text-strong)]">{drill.title}</span>
                    <span className="text-xs text-[var(--c-text-muted)] shrink-0">
                      {drill.bpm ? `${drill.bpm} BPM` : 'Untimed'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--c-text-muted)] truncate">{drill.instructions}</p>
                </div>
                <button
                  onClick={() => onStartPractice(drill)}
                  className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--c-bg)] text-[var(--c-accent)] border border-[var(--c-border)] hover:border-teal-500/50 transition"
                >
                  Practice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkpoint card */}
      <div className="bg-[var(--c-surface)] rounded-xl border border-teal-500/30 p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--c-accent)]">
            Checkpoint
          </span>
          <span className="text-xs text-[var(--c-text-muted)]">
            Pass at {Math.round(cp.requiredAccuracy * 100)}% to unlock the next lesson
          </span>
        </div>
        <h3 className="text-base font-bold text-[var(--c-text-strong)]">{cp.title}</h3>
        <p className="text-sm text-[var(--c-text-muted)] mt-1 mb-3">{cp.instructions}</p>

        <div className="flex items-center gap-3 text-xs text-[var(--c-text-muted)] mb-4">
          {isRhythmCheckpoint(cp) ? (
            <>
              <span>{cp.pattern.length} hits/loop</span>
              <span>·</span>
              <span>{cp.loops} loops</span>
              <span>·</span>
              <span>{cp.bpm} BPM (metronome)</span>
            </>
          ) : (
            <>
              <span>Key: <span className="text-[var(--c-text-subtle)] font-medium">{displayNote(cp.root)}</span></span>
              <span>·</span>
              <span>{cp.positions.length} notes</span>
              <span>·</span>
              <span>{cp.bpm ? `${cp.bpm} BPM (metronome)` : 'Untimed'}</span>
            </>
          )}
        </div>

        <button
          onClick={onStartCheckpoint}
          className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
        >
          {completed ? 'Practice Checkpoint Again' : 'Start Checkpoint'}
        </button>
      </div>
    </div>
  );
}
