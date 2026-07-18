import { useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { HARMONICA_NOTES, findHarmonicaNotes, type HarmonicaDirection } from '../theory/harmonicaLayout';
import { displayNote, type NoteName } from '../theory/notes';
import { HarmonicaDiagram } from './HarmonicaDiagram';

interface HarmonicaPanelProps {
  detectedNote: DetectedNote | null;
  onPlayNote: (note: NoteName, octave: number) => void;
}

export function HarmonicaPanel({ detectedNote, onPlayNote }: HarmonicaPanelProps) {
  const displayed = useDisplayedNote(detectedNote);
  const [picked, setPicked] = useState<{ hole: number; direction: HarmonicaDirection; note: NoteName; octave: number }>(
    () => HARMONICA_NOTES[6], // hole 4 blow, C5 — the usual "home" note for a beginner
  );

  // A detected pitch can't tell us which hole/direction produced it (several
  // holes can share the same pitch) -- just show the lowest-numbered hole
  // that plays it, purely for display.
  const displayedHarmonicaNote = displayed
    ? findHarmonicaNotes(displayed.note.note, displayed.note.octave)[0]
    : undefined;

  const active = displayed && displayedHarmonicaNote
    ? { ...displayedHarmonicaNote, opacity: displayed.opacity }
    : { ...picked, opacity: 1 };

  const handlePick = (hole: number, direction: HarmonicaDirection, note: NoteName, octave: number) => {
    setPicked({ hole, direction, note, octave });
    onPlayNote(note, octave);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[300px] lg:w-[320px]">
      <HarmonicaDiagram active={active} onHoleClick={handlePick} size={260} opacity={active.opacity} />
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected pitch' : 'Tap a hole to hear & play it'}
      </div>

      <div className="w-full max-h-[88px] overflow-y-auto flex flex-wrap gap-1 justify-center border-t border-[var(--c-border)] pt-2">
        {HARMONICA_NOTES.map((n) => {
          const isActive = !displayed && picked.hole === n.hole && picked.direction === n.direction;
          const label = `${n.hole}${n.direction === 'blow' ? '↑' : '↓'}`;
          return (
            <button
              key={`${n.hole}-${n.direction}`}
              onClick={() => handlePick(n.hole, n.direction, n.note, n.octave)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface-half)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
              }`}
              title={`Hole ${n.hole} ${n.direction}: ${displayNote(n.note)}${n.octave}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
