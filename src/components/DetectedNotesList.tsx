import type { MelodyNote } from '../theory/staff';

interface DetectedNotesListProps {
  notes: MelodyNote[];
  title?: string;
  className?: string;
  activeNoteIndex?: number;
  onNoteClick?: (index: number) => void;
}

function formatMs(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Plain list of detected notes from a recording — no tempo grid, no staff
 * notation, no bar/beat quantization. Just what the pitch detector actually
 * heard: note name, octave, tuning offset (cents), and rough timing, in the
 * order they occurred. This replaced SheetMusicView's quantized staff
 * rendering, which was found to be too inaccurate to be useful — forcing
 * detected pitches onto a tempo grid introduced more error than it removed.
 */
export function DetectedNotesList({
  notes,
  title = 'Detected notes',
  className = '',
  activeNoteIndex,
  onNoteClick,
}: DetectedNotesListProps) {
  if (notes.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] mb-2">{title}</h3>
        <p className="text-xs text-[var(--c-text-muted)]">
          No notes detected. Try singing slowly, one note at a time, holding each note steady for at least half a second.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-[var(--c-text-muted)] mb-2">
        {title} <span className="font-normal text-[var(--c-text-muted)]/70">({notes.length} notes)</span>
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((n, i) => {
          const isActive = i === activeNoteIndex;
          const inTune = Math.abs(n.cents) <= 10;
          return (
            <button
              key={i}
              onClick={() => onNoteClick?.(i)}
              title={`${formatMs(n.startMs)} · ${n.cents > 0 ? '+' : ''}${n.cents}¢`}
              className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border transition ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-500'
                  : 'bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-border)] hover:bg-[var(--c-surface-hover)]'
              }`}
            >
              {n.note}
              <span className="text-xs align-super opacity-70">{n.octave}</span>
              {!isActive && !inTune && (
                <span className={`ml-1 text-[10px] ${n.cents > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {n.cents > 0 ? '♯' : '♭'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
