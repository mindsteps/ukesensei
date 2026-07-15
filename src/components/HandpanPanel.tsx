import { useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { HANDPAN_D_KURD } from '../theory/handpanLayout';
import { displayNote, type NoteName } from '../theory/notes';
import { HandpanDiagram } from './HandpanDiagram';

interface HandpanPanelProps {
  detectedNote: DetectedNote | null;
  onPlayNote: (note: NoteName, octave: number) => void;
}

const DING = HANDPAN_D_KURD[0];

export function HandpanPanel({ detectedNote, onPlayNote }: HandpanPanelProps) {
  const displayed = useDisplayedNote(detectedNote);
  const [picked, setPicked] = useState<{ note: NoteName; octave: number }>(
    () => ({ note: DING.note, octave: DING.octave }),
  );

  // Detected pitch always wins while it's live/fading; otherwise fall back to
  // whatever tone field the user last picked from the strip below.
  const active = displayed
    ? { note: displayed.note.note, octave: displayed.note.octave, opacity: displayed.opacity }
    : { ...picked, opacity: 1 };

  const handlePick = (note: NoteName, octave: number) => {
    setPicked({ note, octave });
    onPlayNote(note, octave);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[220px] lg:w-[240px]">
      <HandpanDiagram active={active} size={170} opacity={active.opacity} />
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected pitch' : 'Tap a tone field to hear & play it'}
      </div>

      <div className="w-full max-h-[88px] overflow-y-auto flex flex-wrap gap-1 justify-center border-t border-[var(--c-border)] pt-2">
        {HANDPAN_D_KURD.map((tone, i) => {
          const isActive = !displayed && picked.note === tone.note && picked.octave === tone.octave;
          const label = tone.isDing ? 'Ding' : `${displayNote(tone.note, tone.note === 'A#')}${tone.octave}`;
          return (
            <button
              key={i}
              onClick={() => handlePick(tone.note, tone.octave)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface-half)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
              }`}
              title={label}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
