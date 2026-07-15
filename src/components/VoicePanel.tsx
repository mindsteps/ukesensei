import { useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { VOICE_RANGE } from '../theory/voiceRange';
import { displayNote, type NoteName } from '../theory/notes';
import { VoiceRangeLadder } from './VoiceRangeLadder';

interface VoicePanelProps {
  detectedNote: DetectedNote | null;
  onPlayNote: (note: NoteName, octave: number) => void;
}

const MIDDLE_C = VOICE_RANGE.find((n) => n.note === 'C' && n.octave === 4) ?? VOICE_RANGE[0];

export function VoicePanel({ detectedNote, onPlayNote }: VoicePanelProps) {
  const displayed = useDisplayedNote(detectedNote);
  const [picked, setPicked] = useState<{ note: NoteName; octave: number }>(
    () => ({ note: MIDDLE_C.note, octave: MIDDLE_C.octave }),
  );

  // Detected pitch always wins while it's live/fading; otherwise fall back to
  // whatever note the user last picked from the strip below (no cents offset
  // for a picked note — it's a reference tone, not something being sung).
  const active = displayed
    ? { note: displayed.note.note, octave: displayed.note.octave, opacity: displayed.opacity, cents: displayed.note.cents }
    : { ...picked, opacity: 1, cents: 0 };

  const handlePick = (note: NoteName, octave: number) => {
    setPicked({ note, octave });
    onPlayNote(note, octave);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[220px] lg:w-[240px]">
      <VoiceRangeLadder
        active={active}
        cents={active.cents}
        onNoteClick={handlePick}
        size={150}
        opacity={active.opacity}
      />
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected pitch' : 'Tap a note to hear & sing it'}
      </div>

      <div className="w-full max-h-[88px] overflow-y-auto flex flex-wrap gap-1 justify-center border-t border-[var(--c-border)] pt-2">
        {VOICE_RANGE.map(({ note, octave, midi }) => {
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
