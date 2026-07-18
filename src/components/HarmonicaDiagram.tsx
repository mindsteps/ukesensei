import { memo } from 'react';
import { HARMONICA_HOLES, type HarmonicaDirection } from '../theory/harmonicaLayout';
import { displayNote, type NoteName } from '../theory/notes';

interface HarmonicaDiagramProps {
  active: { hole: number; direction: HarmonicaDirection; note: NoteName; octave: number } | null;
  /** Called when a hole's blow or draw half is clicked/tapped, to hear & select it. */
  onHoleClick?: (hole: number, direction: HarmonicaDirection, note: NoteName, octave: number) => void;
  size?: number;
  opacity?: number;
}

const HOLE_W = 26;
const HOLE_GAP = 4;
const HOLE_H = 66;
const PAD_X = 10;
const PAD_Y = 8;
const SVG_WIDTH = PAD_X * 2 + HARMONICA_HOLES.length * HOLE_W + (HARMONICA_HOLES.length - 1) * HOLE_GAP;
const SVG_HEIGHT = PAD_Y * 2 + HOLE_H + 14;

/**
 * A schematic row of the 10 holes on a diatonic harmonica, each split into a
 * blow half (top, exhale) and a draw half (bottom, inhale) — standing in for
 * a fingering/fretboard diagram since a harmonica has no strings or keys,
 * just two fixed pitches per hole. Halves are clickable so players can hear
 * & select any note directly on the diagram.
 */
function HarmonicaDiagramInner({ active, onHoleClick, size = 260, opacity = 1 }: HarmonicaDiagramProps) {
  const scale = size / SVG_WIDTH;
  const height = SVG_HEIGHT * scale;

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      {active && (
        <div className="text-lg font-bold text-[var(--c-accent)] mb-1">
          {displayNote(active.note)}
          <span className="text-xs font-normal opacity-60">{active.octave}</span>
          <span className="text-xs font-normal opacity-60 ml-1.5">
            hole {active.hole} {active.direction}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width={size} height={height}>
        <text x={PAD_X} y={SVG_HEIGHT - 3} fontSize={7} className="fill-current opacity-40" textAnchor="start">
          blow ↑ / draw ↓
        </text>
        {HARMONICA_HOLES.map((h, i) => {
          const x = PAD_X + i * (HOLE_W + HOLE_GAP);
          const y = PAD_Y;
          const blowActive = active?.hole === h.hole && active.direction === 'blow';
          const drawActive = active?.hole === h.hole && active.direction === 'draw';
          return (
            <g key={h.hole}>
              <rect
                x={x}
                y={y}
                width={HOLE_W}
                height={HOLE_H}
                rx={5}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.25}
              />
              <line x1={x} y1={y + HOLE_H / 2} x2={x + HOLE_W} y2={y + HOLE_H / 2} stroke="currentColor" strokeWidth={1} opacity={0.2} />

              {/* Blow half (top) */}
              <g
                onClick={onHoleClick ? () => onHoleClick(h.hole, 'blow', h.blow.note, h.blow.octave) : undefined}
                style={onHoleClick ? { cursor: 'pointer' } : undefined}
                role={onHoleClick ? 'button' : undefined}
                aria-label={onHoleClick ? `Play hole ${h.hole} blow` : undefined}
              >
                <rect x={x + 1} y={y + 1} width={HOLE_W - 2} height={HOLE_H / 2 - 2} rx={4} fill={blowActive ? 'currentColor' : 'transparent'} opacity={blowActive ? 0.95 : 0} />
                <text
                  x={x + HOLE_W / 2}
                  y={y + HOLE_H / 4 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={600}
                  fill={blowActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                  opacity={blowActive ? 1 : 0.75}
                  style={{ pointerEvents: 'none' }}
                >
                  {displayNote(h.blow.note)}
                </text>
              </g>

              {/* Draw half (bottom) */}
              <g
                onClick={onHoleClick ? () => onHoleClick(h.hole, 'draw', h.draw.note, h.draw.octave) : undefined}
                style={onHoleClick ? { cursor: 'pointer' } : undefined}
                role={onHoleClick ? 'button' : undefined}
                aria-label={onHoleClick ? `Play hole ${h.hole} draw` : undefined}
              >
                <rect x={x + 1} y={y + HOLE_H / 2 + 1} width={HOLE_W - 2} height={HOLE_H / 2 - 2} rx={4} fill={drawActive ? 'currentColor' : 'transparent'} opacity={drawActive ? 0.95 : 0} />
                <text
                  x={x + HOLE_W / 2}
                  y={y + (HOLE_H * 3) / 4 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={600}
                  fill={drawActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                  opacity={drawActive ? 1 : 0.75}
                  style={{ pointerEvents: 'none' }}
                >
                  {displayNote(h.draw.note)}
                </text>
              </g>

              <text
                x={x + HOLE_W / 2}
                y={y + HOLE_H + 10}
                textAnchor="middle"
                fontSize={8}
                fill="currentColor"
                opacity={0.5}
              >
                {h.hole}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const HarmonicaDiagram = memo(HarmonicaDiagramInner);
