import { useState } from 'react';
import type { DetectedHit } from '../store/useAppStore';
import { useDisplayedHit } from '../hooks/useDisplayedHit';
import type { CajonHitType } from '../exercises/cajonPatterns';
import { HIT_LABELS } from '../exercises/cajonPatterns';
import { CajonDiagram } from './CajonDiagram';

interface CajonPanelProps {
  detectedHit: DetectedHit | null;
  onPlayHit: (type: CajonHitType) => void;
}

const HIT_TYPES: CajonHitType[] = ['bass', 'slap', 'ghost'];

export function CajonPanel({ detectedHit, onPlayHit }: CajonPanelProps) {
  const displayed = useDisplayedHit(detectedHit);
  const [picked, setPicked] = useState<CajonHitType>('bass');

  // Detected (mic) hits always win while they're visible/fading; otherwise
  // fall back to whichever zone the user last tapped below.
  const active = displayed ? displayed.hit.type : picked;
  const opacity = displayed ? displayed.opacity : 1;

  const handlePick = (type: CajonHitType) => {
    setPicked(type);
    onPlayHit(type);
  };

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 flex flex-col items-center gap-3 w-full sm:w-[220px] lg:w-[240px]">
      <CajonDiagram active={active} size={170} opacity={opacity} />
      <div className="text-[10px] text-[var(--c-text-muted)] -mt-1">
        {displayed ? 'Detected hit' : 'Tap a zone to hear & play it'}
      </div>

      <div className="w-full flex gap-1.5 justify-center border-t border-[var(--c-border)] pt-2">
        {HIT_TYPES.map((type) => {
          const isActive = !displayed && picked === type;
          return (
            <button
              key={type}
              onClick={() => handlePick(type)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface-half)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]'
              }`}
            >
              {HIT_LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
