import type { DetectedNote } from '../store/useAppStore';
import { displayNote } from '../theory/notes';
import { useDisplayedNote } from '../hooks/useDisplayedNote';

interface NoteDisplayProps {
  note: DetectedNote | null;
}

export function NoteDisplay({ note }: NoteDisplayProps) {
  // Same hold/fade stabilization as LiveStaff, so a brief detection dropout
  // (e.g. clarity dipping for one worklet message) doesn't instantly snap
  // the letter/Hz back to the empty state — that abrupt on/off toggling at
  // ~40Hz is what reads as "flickering". While a note is actively detected
  // we still show its live values (so Hz keeps updating in real time); once
  // detection drops out we fall back to the held/fading last-known value.
  const displayed = useDisplayedNote(note);
  const stable = note ?? displayed?.note ?? null;
  const opacity = note ? 1 : displayed?.opacity ?? 1;

  return (
    <div className="text-center min-w-[72px] sm:min-w-[100px]">
      <div
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight h-[44px] sm:h-[52px] lg:h-[56px] flex items-center justify-center"
        style={{ color: stable ? '#34d399' : 'var(--c-inactive)', opacity }}
      >
        {stable ? displayNote(stable.note) : '—'}
      </div>
      <div
        className="text-xs sm:text-sm text-[var(--c-text-muted)] mt-0.5 sm:mt-1 h-[16px] sm:h-[20px]"
        style={{ opacity }}
      >
        {stable ? (
          <>{stable.octave} &middot; {Math.round(stable.frequency)} Hz</>
        ) : (
          <span className="invisible">0 · 000 Hz</span>
        )}
      </div>
    </div>
  );
}
