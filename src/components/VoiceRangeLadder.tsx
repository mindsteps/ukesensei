import { memo } from 'react';
import { VOICE_MAX_MIDI, VOICE_MIN_MIDI, VOICE_RANGE, midiOf } from '../theory/voiceRange';
import { displayNote, type NoteName } from '../theory/notes';

interface VoiceRangeLadderProps {
  active: { note: NoteName; octave: number } | null;
  /** Cents off the nearest semitone (-50..50). Lets the marker sit between
   * rows instead of snapping to whichever note is closest. */
  cents?: number | null;
  /** Called when a row is clicked/tapped, to hear & select that note. */
  onNoteClick?: (note: NoteName, octave: number) => void;
  size?: number;
  opacity?: number;
}

const ROW_HEIGHT = 12;
const SVG_WIDTH = 100;
const IN_TUNE_CENTS = 20;
const CLOSE_CENTS = 35;

function centsColor(cents: number): string {
  const abs = Math.abs(cents);
  if (abs <= IN_TUNE_CENTS) return '#34d399';
  if (abs <= CLOSE_CENTS) return '#fbbf24';
  return '#f87171';
}

/**
 * A simple vertical "ladder" of the voice practice range, standing in for a
 * fingering diagram (voice has no fingers to diagram). The marker tracks the
 * actual continuous pitch (nearest semitone + cents) rather than snapping to
 * a row, and its color/label show how far off-key the note is — like a
 * tuner needle laid along the practice range instead of centered on zero.
 */
function VoiceRangeLadderInner({ active, cents, onNoteClick, size = 150, opacity = 1 }: VoiceRangeLadderProps) {
  const rows = [...VOICE_RANGE].reverse();
  const height = rows.length * ROW_HEIGHT;
  const width = size * (SVG_WIDTH / height);

  const centsOff = cents ?? 0;
  const continuousMidi = active ? midiOf(active.note, active.octave) + centsOff / 100 : null;
  const clampedMidi = continuousMidi == null
    ? null
    : Math.max(VOICE_MIN_MIDI, Math.min(VOICE_MAX_MIDI, continuousMidi));
  const markerY = clampedMidi == null
    ? null
    : (VOICE_MAX_MIDI - clampedMidi) * ROW_HEIGHT + ROW_HEIGHT / 2;
  const markerColor = active ? centsColor(centsOff) : 'currentColor';

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)]">
      {active && (
        <div className="flex items-center gap-1.5 mb-1">
          <div className="text-lg font-bold text-[var(--c-accent)]">
            {displayNote(active.note)}
            <span className="text-xs font-normal opacity-60">{active.octave}</span>
          </div>
          <span className="text-[10px] font-semibold tabular-nums" style={{ color: markerColor }}>
            {centsOff > 0 ? '+' : ''}{Math.round(centsOff)}&cent;
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_WIDTH} ${height}`} width={width} height={size}>
        {rows.map((n, i) => {
          const isNatural = !n.note.includes('#');
          const isRowActive = !!active && active.note === n.note && active.octave === n.octave;
          const y = i * ROW_HEIGHT;
          const label = `${displayNote(n.note)}${n.octave}`;
          return (
            <g
              key={n.midi}
              onClick={onNoteClick ? () => onNoteClick(n.note, n.octave) : undefined}
              style={onNoteClick ? { cursor: 'pointer' } : undefined}
              role={onNoteClick ? 'button' : undefined}
              aria-label={onNoteClick ? `Play ${label}` : undefined}
            >
              <rect
                x={4}
                y={y + 1}
                width={SVG_WIDTH - 8}
                height={ROW_HEIGHT - 2}
                rx={3}
                fill={isRowActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1}
                opacity={isRowActive ? 0.25 : isNatural ? 0.35 : 0.15}
              />
              <text
                x={SVG_WIDTH / 2}
                y={y + ROW_HEIGHT / 2 + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={7.5}
                fontWeight={600}
                fill="currentColor"
                opacity={isNatural ? 0.8 : 0.4}
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {markerY != null && (
          <g style={{ transition: 'transform 80ms linear' }} transform={`translate(0, ${markerY})`}>
            <line x1={0} y1={0} x2={SVG_WIDTH} y2={0} stroke={markerColor} strokeWidth={2} opacity={0.9} />
            <polygon points={`0,-3.5 0,3.5 5,0`} fill={markerColor} />
            <polygon points={`${SVG_WIDTH},-3.5 ${SVG_WIDTH},3.5 ${SVG_WIDTH - 5},0`} fill={markerColor} />
          </g>
        )}
      </svg>
    </div>
  );
}

export const VoiceRangeLadder = memo(VoiceRangeLadderInner);
export { ROW_HEIGHT, SVG_WIDTH };
