import { memo, useMemo } from 'react';
import { ChordDiagram } from './ChordDiagram';
import { CHORD_QUALITIES, findVoicing } from '../theory/chords';
import { displayNote, type NoteName } from '../theory/notes';

export interface ChordRowChord {
  root: string;
  quality: string;
  display: string;
}

interface ChordRowProps {
  chords: Array<ChordRowChord | null>;
  className?: string;
}

/** Collapses consecutive repeats of the same measure-level chord into a single entry per chord change. */
function dedupeChordChanges(chords: Array<ChordRowChord | null>): ChordRowChord[] {
  const changes: ChordRowChord[] = [];
  let lastDisplay: string | null = null;
  for (const chord of chords) {
    if (!chord || chord.display === lastDisplay) continue;
    changes.push(chord);
    lastDisplay = chord.display;
  }
  return changes;
}

function ChordRowInner({ chords, className = '' }: ChordRowProps) {
  const changes = useMemo(() => dedupeChordChanges(chords), [chords]);

  if (changes.length === 0) return null;

  return (
    <div className={`flex items-start gap-3 overflow-x-auto pb-1 ${className}`}>
      {changes.map((chord, i) => {
        const suffix = CHORD_QUALITIES[chord.quality]?.suffix ?? '';
        // Melody-derived chord roots are always sharp-spelled (NoteName is
        // drawn from CHROMATIC_NOTES), but several ukulele voicings below
        // are keyed by their flat name instead (Bb, Eb, Ab, Db, Gb) — try
        // both spellings so those chords still resolve to a diagram.
        const voicing = findVoicing(chord.root, suffix)
          ?? findVoicing(displayNote(chord.root as NoteName, true), suffix);
        if (!voicing) {
          return (
            <div
              key={`${chord.display}-${i}`}
              className="shrink-0 min-w-[72px] flex items-center justify-center text-sm font-bold text-[var(--c-text)]"
            >
              {chord.display}
            </div>
          );
        }
        return (
          <div key={`${chord.display}-${i}`} className="shrink-0">
            <ChordDiagram voicing={voicing} label={chord.display} size={120} />
          </div>
        );
      })}
    </div>
  );
}

export const ChordRow = memo(ChordRowInner);
