import { memo } from 'react';
import type { CajonHitType } from '../exercises/cajonPatterns';
import { HIT_LABELS } from '../exercises/cajonPatterns';

interface CajonDiagramProps {
  active: CajonHitType | null;
  size?: number;
  opacity?: number;
}

const SVG_WIDTH = 120;
const SVG_HEIGHT = 160;

/**
 * A simple front-plate diagram of a cajon with its three graded strike
 * zones: a bright top-edge "slap" zone, a resonant center "bass" zone, and
 * a small corner "ghost" (muted tap) zone -- standing in for a fingering
 * diagram since a cajon has no strings, keys, or fixed pitches.
 */
function CajonDiagramInner({ active, size = 160, opacity = 1 }: CajonDiagramProps) {
  const scale = size / SVG_WIDTH;
  const height = SVG_HEIGHT * scale;

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      {active && (
        <div className="text-lg font-bold text-[var(--c-accent)] mb-1">{HIT_LABELS[active]}</div>
      )}
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width={size} height={height}>
        <rect
          x={6}
          y={6}
          width={SVG_WIDTH - 12}
          height={SVG_HEIGHT - 12}
          rx={8}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.3}
        />

        {/* Slap zone -- top edge, struck near the corners with fingertips */}
        <rect
          x={14}
          y={14}
          width={SVG_WIDTH - 28}
          height={28}
          rx={6}
          fill={active === 'slap' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={active === 'slap' ? 0.9 : 0.35}
        />
        <text
          x={SVG_WIDTH / 2}
          y={28}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={600}
          fill={active === 'slap' ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
          opacity={active === 'slap' ? 1 : 0.7}
        >
          Slap
        </text>

        {/* Bass zone -- center of the plate */}
        <circle
          cx={SVG_WIDTH / 2}
          cy={92}
          r={30}
          fill={active === 'bass' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={active === 'bass' ? 0.9 : 0.35}
        />
        <text
          x={SVG_WIDTH / 2}
          y={92}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={600}
          fill={active === 'bass' ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
          opacity={active === 'bass' ? 1 : 0.7}
        >
          Bass
        </text>

        {/* Ghost zone -- a light, muted tap near a bottom corner */}
        <circle
          cx={SVG_WIDTH - 26}
          cy={SVG_HEIGHT - 22}
          r={14}
          fill={active === 'ghost' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={active === 'ghost' ? 0.9 : 0.3}
        />
        <text
          x={SVG_WIDTH - 26}
          y={SVG_HEIGHT - 22}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={7}
          fontWeight={600}
          fill={active === 'ghost' ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
          opacity={active === 'ghost' ? 1 : 0.6}
        >
          Ghost
        </text>
      </svg>
    </div>
  );
}

export const CajonDiagram = memo(CajonDiagramInner);
