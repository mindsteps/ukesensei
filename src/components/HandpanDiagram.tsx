import { memo } from 'react';
import { HANDPAN_D_KURD, type HandpanTone } from '../theory/handpanLayout';
import { displayNote, type NoteName } from '../theory/notes';

interface HandpanDiagramProps {
  active: { note: NoteName; octave: number } | null;
  size?: number;
  opacity?: number;
}

const SVG_SIZE = 160;
const CENTER = SVG_SIZE / 2;
const FIELD_RADIUS = 58;
const FIELD_R = 17;
const DING_R = 24;

function toneLabel(tone: HandpanTone): string {
  const preferFlats = tone.note === 'A#';
  return `${displayNote(tone.note, preferFlats)}${tone.octave}`;
}

function isActiveTone(tone: HandpanTone, active: { note: NoteName; octave: number } | null): boolean {
  return !!active && active.note === tone.note && active.octave === tone.octave;
}

/**
 * A circular diagram of a D Kurd handpan: the center "Ding" note plus 8 tone
 * fields arranged around it, standing in for a fingering/fretboard diagram
 * since a handpan has neither strings nor keys — just fixed struck pitches.
 */
function HandpanDiagramInner({ active, size = 180, opacity = 1 }: HandpanDiagramProps) {
  const ding = HANDPAN_D_KURD[0];
  const fields = HANDPAN_D_KURD.slice(1);
  const dingActive = isActiveTone(ding, active);

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      {active && (
        <div className="text-lg font-bold text-[var(--c-accent)] mb-1">
          {displayNote(active.note, active.note === 'A#')}
          <span className="text-xs font-normal opacity-60">{active.octave}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} width={size} height={size}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={SVG_SIZE / 2 - 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.15}
        />

        {fields.map((tone, i) => {
          const rad = (tone.angle * Math.PI) / 180;
          const x = CENTER + FIELD_RADIUS * Math.sin(rad);
          const y = CENTER - FIELD_RADIUS * Math.cos(rad);
          const isActive = isActiveTone(tone, active);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={FIELD_R}
                fill={isActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                opacity={isActive ? 0.95 : 0.4}
              />
              <text
                x={x}
                y={y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={600}
                fill={isActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                opacity={isActive ? 1 : 0.75}
              >
                {toneLabel(tone)}
              </text>
            </g>
          );
        })}

        {/* Ding, center */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={DING_R}
          fill={dingActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={dingActive ? 0.95 : 0.5}
        />
        <text
          x={CENTER}
          y={CENTER + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fontWeight={700}
          fill={dingActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
        >
          Ding
        </text>
      </svg>
    </div>
  );
}

export const HandpanDiagram = memo(HandpanDiagramInner);
