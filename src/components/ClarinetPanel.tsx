import { useMemo, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { CLARINET_RANGE, getClarinetFingering } from '../theory/clarinetFingerings';
import { displayNote, type NoteName } from '../theory/notes';
import { ClarinetDiagram } from './ClarinetDiagram';

interface ClarinetPanelProps {
  detectedNote: DetectedNote | null;
  onPlayNote: (note: NoteName, octave: number) => void;
}

export function ClarinetPanel({ detectedNote, onPlayNote }: ClarinetPanelProps) {
  const displayed = useDisplayedNote(detectedNote);
  const [picked, setPicked] = useState<{ note: NoteName; octave: number }>(
    () => ({ note: CLARINET_RANGE[0].note, octave: CLARINET_RANGE[0].octave }),
  );

  // Detected pitch always wins while it's live/fading; otherwise fall back to
  // whatever note the user last picked from the strip below.
  const active = displayed
    ? { note: displayed.note.note, octave: displayed.note.octave, opacity: displayed.opacity }
    : { ...picked, opacity: 1 };

  const fingering = useMemo(
    () => getClarinetFingering(active.note, active.octave),
    [active.note, active.octave],
  );

  const handlePick = (note: NoteName, octave: number) => {
    setPicked({ note, octave });
    onPlayNote(note, octave);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[220px] lg:w-[240px]">
      {fingering ? (
        <ClarinetDiagram fingering={fingering} size={150} opacity={active.opacity} />
      ) : (
        <div className="text-xs text-[var(--c-text-muted)] h-[150px] flex items-center">
          Play or pick a note...
        </div>
      )}
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected pitch' : 'Tap a note to hear & see it'}
      </div>

      <div className="w-full max-h-[88px] overflow-y-auto flex flex-wrap gap-1 justify-center border-t border-[var(--c-border)] pt-2">
        {CLARINET_RANGE.map(({ note, octave, midi }) => {
          const isActive = !displayed && picked.note === note && picked.octave === octave;
          return (
            <button
              key={midi}
              onClick={() => handlePick(note, octave)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface-half)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
              }`}
              title={`${displayNote(note)}${octave}`}
            >
              {displayNote(note)}
              <span className="opacity-60">{octave}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
