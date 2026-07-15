import type { RhythmExerciseState } from '../store/useAppStore';
import { HIT_LABELS } from '../exercises/cajonPatterns';
import { Metronome } from './Metronome';

interface RhythmExercisePlayerProps {
  exercise: RhythmExerciseState;
  onStop: () => void;
  countingIn?: boolean;
  countInBeat?: number;
  metronome?: {
    bpm: number;
    beatsPerMeasure: number;
    isPlaying: boolean;
    currentBeat: number;
    onBpmChange: (bpm: number) => void;
    onBeatsChange: (beats: number) => void;
    onStart: () => void;
    onStop: () => void;
    onTap: () => void;
  };
}

export function RhythmExercisePlayer({ exercise, onStop, countingIn, countInBeat, metronome }: RhythmExercisePlayerProps) {
  const totalSteps = exercise.targetSteps.length;
  const currentIndex = exercise.currentStepIndex;
  const progress = totalSteps > 0 ? (currentIndex / totalSteps) * 100 : 0;

  const currentTarget = exercise.targetSteps[currentIndex];
  const correctCount = exercise.hitsPlayed.filter((h) => h.correct).length;

  const lastHit = exercise.hitsPlayed[exercise.hitsPlayed.length - 1];
  const lastBeatOffset = lastHit?.beatOffsetMs;

  return (
    <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--c-accent)]">
            {exercise.title ?? 'Rhythm Exercise'}
          </h3>
          <p className="text-xs text-[var(--c-text-muted)]">
            Hit {Math.min(currentIndex + 1, totalSteps)} of {totalSteps}
            <span className="ml-1 text-teal-400">@ {exercise.bpm} BPM</span>
          </p>
        </div>
        <button
          onClick={onStop}
          className="text-xs px-3 py-1.5 rounded bg-[var(--c-bg)] text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition"
        >
          Stop
        </button>
      </div>

      {/* Metronome controls */}
      {metronome && (
        <div className="mb-3 pb-3 border-b border-[var(--c-border)]">
          <Metronome {...metronome} compact />
        </div>
      )}

      {/* Progress bar */}
      <div className="h-2 bg-[var(--c-bg)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Count-in overlay */}
      {countingIn && metronome && (
        <div className="text-center py-4">
          <div className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-2">
            Count in
          </div>
          <div className="text-5xl font-bold text-amber-300 tabular-nums">
            {(countInBeat ?? 0) + 1}
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: metronome.beatsPerMeasure }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-75 ${
                  i <= (countInBeat ?? 0) ? 'bg-amber-400 scale-110' : 'bg-[var(--c-border)]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Target hit */}
      {!countingIn && !exercise.isComplete && currentTarget && (
        <div className="text-center py-2">
          <div className="text-xs text-[var(--c-text-muted)] mb-1">Play this hit:</div>
          <div className="text-3xl font-bold text-amber-300">
            {HIT_LABELS[currentTarget.hit]}
          </div>
        </div>
      )}

      {/* Timing indicator */}
      {lastBeatOffset != null && (
        <div className="flex justify-center mt-1 mb-1">
          <TimingBadge offset={lastBeatOffset} />
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 text-xs text-[var(--c-text-muted)] mt-2">
        <span>Correct: {correctCount}</span>
        <span>Streak: {getStreak(exercise)}</span>
      </div>
    </div>
  );
}

function TimingBadge({ offset }: { offset: number }) {
  const abs = Math.abs(offset);
  let label: string;
  let color: string;

  if (abs <= 30) {
    label = 'Perfect';
    color = 'text-emerald-400';
  } else if (abs <= 80) {
    label = offset < 0 ? 'Slightly early' : 'Slightly late';
    color = 'text-teal-400';
  } else {
    label = offset < 0 ? 'Early' : 'Late';
    color = 'text-amber-400';
  }

  return (
    <span className={`text-xs font-medium ${color} transition-all`}>
      {label} ({offset > 0 ? '+' : ''}{offset}ms)
    </span>
  );
}

function getStreak(exercise: RhythmExerciseState): number {
  let streak = 0;
  for (let i = exercise.hitsPlayed.length - 1; i >= 0; i--) {
    if (exercise.hitsPlayed[i].correct) streak++;
    else break;
  }
  return streak;
}
