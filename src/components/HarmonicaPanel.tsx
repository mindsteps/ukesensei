import { useMemo, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { HARMONICA_TUNINGS, DEFAULT_HARMONICA_TUNING } from '../theory/harmonicaTunings';
import { type HarmonicaHole, type HarmonicaNote, type HarmonicaDirection } from '../theory/harmonicaLayout';
import { noteToSemitone } from '../theory/notes';
import { displayNote, type NoteName } from '../theory/notes';
import { HarmonicaDiagram } from './HarmonicaDiagram';

interface HarmonicaPanelProps {
  detectedNote: DetectedNote | null;
  onPlayNote: (note: NoteName, octave: number) => void;
  /** Which harmonica key the user has selected (e.g. 'richter_c', 'richter_bb'). */
  tuningKey?: string;
}

function midiOf(n: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(n);
}

function notesForHoles(holes: HarmonicaHole[]): HarmonicaNote[] {
  return holes
    .flatMap((h) => [
      { hole: h.hole, direction: 'blow' as const, note: h.blow.note, octave: h.blow.octave, midi: midiOf(h.blow.note, h.blow.octave) },
      { hole: h.hole, direction: 'draw' as const, note: h.draw.note, octave: h.draw.octave, midi: midiOf(h.draw.note, h.draw.octave) },
    ])
    .sort((a, b) => a.midi - b.midi);
}

export function HarmonicaPanel({ detectedNote, onPlayNote, tuningKey }: HarmonicaPanelProps) {
  const displayed = useDisplayedNote(detectedNote);
  const tuning = (tuningKey && HARMONICA_TUNINGS[tuningKey]) || DEFAULT_HARMONICA_TUNING;
  const holes = tuning.holes;
  const notes = useMemo(() => notesForHoles(holes), [holes]);

  const [picked, setPicked] = useState<{ hole: number; direction: HarmonicaDirection; note: NoteName; octave: number }>(
    () => notes[6], // hole 4 blow — the usual "home" note for a beginner
  );

  // Reset the picked note if the tuning changes and the old pick no longer
  // matches the new hole/direction's note (keeps display in sync with key).
  const safePicked = notes.find((n) => n.hole === picked.hole && n.direction === picked.direction) ?? notes[6];

  // A detected pitch can't tell us which hole/direction produced it (several
  // holes can share the same pitch) -- just show the lowest-numbered hole
  // that plays it, purely for display.
  const displayedHarmonicaNote = displayed
    ? notes.find((n) => n.note === displayed.note.note && n.octave === displayed.note.octave)
    : undefined;

  const active = displayed && displayedHarmonicaNote
    ? { ...displayedHarmonicaNote, opacity: displayed.opacity }
    : { ...safePicked, opacity: 1 };

  const handlePick = (hole: number, direction: HarmonicaDirection, note: NoteName, octave: number) => {
    setPicked({ hole, direction, note, octave });
    onPlayNote(note, octave);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[300px] lg:w-[320px]">
      <HarmonicaDiagram holes={holes} active={active} onHoleClick={handlePick} size={260} opacity={active.opacity} />
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected pitch' : 'Tap a hole to hear & play it'}
      </div>

      <div className="w-full max-h-[88px] overflow-y-auto flex flex-wrap gap-1 justify-center border-t border-[var(--c-border)] pt-2">
        {notes.map((n) => {
          const isActive = !displayed && safePicked.hole === n.hole && safePicked.direction === n.direction;
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
