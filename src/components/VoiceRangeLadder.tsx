import { memo } from 'react';
import { VOICE_RANGE } from '../theory/voiceRange';
import { displayNote, type NoteName } from '../theory/notes';

interface VoiceRangeLadderProps {
  active: { note: NoteName; octave: number } | null;
  size?: number;
  opacity?: number;
}

const ROW_HEIGHT = 12;
const SVG_WIDTH = 100;

/**
 * A simple vertical "ladder" of the voice practice range, standing in for a
 * fingering diagram (voice has no fingers to diagram) -- it just shows where
 * the active pitch sits among the practice notes, low at the bottom to high
 * at the top like a real pitch axis.
 */
function VoiceRangeLadderInner({ active, size = 150, opacity = 1 }: VoiceRangeLadderProps) {
  const rows = [...VOICE_RANGE].reverse();
  const height = rows.length * ROW_HEIGHT;
  const width = size * (SVG_WIDTH / height);

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      {active && (
        <div className="text-lg font-bold text-[var(--c-accent)] mb-1">
          {displayNote(active.note)}
          <span className="text-xs font-normal opacity-60">{active.octave}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_WIDTH} ${height}`} width={width} height={size}>
        {rows.map((n, i) => {
          const isNatural = !n.note.includes('#');
          const isActive = !!active && active.note === n.note && active.octave === n.octave;
          const y = i * ROW_HEIGHT;
          return (
            <g key={n.midi}>
              <rect
                x={4}
                y={y + 1}
                width={SVG_WIDTH - 8}
                height={ROW_HEIGHT - 2}
                rx={3}
                fill={isActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1}
                opacity={isActive ? 0.95 : isNatural ? 0.35 : 0.15}
              />
              <text
                x={SVG_WIDTH / 2}
                y={y + ROW_HEIGHT / 2 + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={7.5}
                fontWeight={600}
                fill={isActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                opacity={isActive ? 1 : isNatural ? 0.8 : 0.4}
              >
                {displayNote(n.note)}{n.octave}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const VoiceRangeLadder = memo(VoiceRangeLadderInner);
export { ROW_HEIGHT, SVG_WIDTH };
