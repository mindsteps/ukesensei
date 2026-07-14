import { memo } from 'react';
import type { ClarinetFingering, ClarinetKeyId } from '../theory/clarinetFingerings';
import { CLARINET_KEYS } from '../theory/clarinetFingerings';
import { displayNote } from '../theory/notes';

interface ClarinetDiagramProps {
  fingering: ClarinetFingering;
  size?: number;
  opacity?: number;
}

const MAIN_X = 60;
const SIDE_X = 26;
const PINKY_X = 94;

// Hand-tuned y-positions for each key so the diagram reads top-to-bottom like
// a real clarinet: register key at the very top, then the left hand (thumb +
// 3 rings, with side keys branching left), a joint gap, then the right hand
// (3 rings, with pinky keys branching right).
const KEY_POSITIONS: Record<ClarinetKeyId, { x: number; y: number; r: number }> = {
  register: { x: MAIN_X, y: 18, r: 6 },
  thumb: { x: MAIN_X, y: 46, r: 8 },
  l1: { x: MAIN_X, y: 78, r: 9 },
  l2: { x: MAIN_X, y: 106, r: 9 },
  l3: { x: MAIN_X, y: 134, r: 9 },
  lSideCsharp: { x: SIDE_X, y: 70, r: 6 },
  lSideGsharp: { x: SIDE_X, y: 94, r: 6 },
  lSideA: { x: SIDE_X, y: 118, r: 6 },
  r1: { x: MAIN_X, y: 176, r: 9 },
  r2: { x: MAIN_X, y: 204, r: 9 },
  r3: { x: MAIN_X, y: 232, r: 9 },
  rPinkyE: { x: PINKY_X, y: 224, r: 6 },
  rPinkyF: { x: PINKY_X, y: 244, r: 6 },
  rPinkyFsharp: { x: PINKY_X, y: 264, r: 6 },
  rPinkyGsharp: { x: PINKY_X, y: 284, r: 6 },
  rPinkyEb: { x: PINKY_X, y: 304, r: 6 },
};

const SVG_WIDTH = 120;
const SVG_HEIGHT = 320;

function ClarinetDiagramInner({ fingering, size = 160, opacity = 1 }: ClarinetDiagramProps) {
  const scale = size / SVG_WIDTH;
  const height = SVG_HEIGHT * scale;

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      <div className="text-lg font-bold text-[var(--c-accent)] mb-1">
        {displayNote(fingering.note)}<span className="text-xs font-normal opacity-60">{fingering.octave}</span>
      </div>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width={size} height={height}>
        {/* Body outline, split at the joint between the two hands */}
        <rect x={MAIN_X - 14} y={30} width={28} height={122} rx={10} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.25} />
        <rect x={MAIN_X - 14} y={162} width={28} height={82} rx={10} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.25} />

        {CLARINET_KEYS.map(({ id, label, group }) => {
          const pos = KEY_POSITIONS[id];
          const isClosed = fingering.closed.has(id);
          const isSatellite = group === 'left-side' || group === 'right-pinky';

          return (
            <g key={id}>
              {isSatellite && (
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={group === 'left-side' ? MAIN_X - 10 : MAIN_X + 10}
                  y2={pos.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.25}
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pos.r}
                fill={isClosed ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                opacity={isClosed ? 0.95 : 0.45}
              />
              <text
                x={pos.x}
                y={pos.y + (isSatellite ? -pos.r - 4 : 0.5)}
                textAnchor="middle"
                dominantBaseline={isSatellite ? undefined : 'central'}
                fontSize={isSatellite ? 8 : 9}
                fontWeight={600}
                fill={isClosed && !isSatellite ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                opacity={isSatellite ? 0.7 : 1}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Hand labels */}
        <text x={12} y={44} fontSize={9} className="fill-current opacity-40" textAnchor="start">L</text>
        <text x={12} y={200} fontSize={9} className="fill-current opacity-40" textAnchor="start">R</text>
      </svg>
    </div>
  );
}

export const ClarinetDiagram = memo(ClarinetDiagramInner);
