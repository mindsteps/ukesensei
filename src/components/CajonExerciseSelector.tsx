import { useState } from 'react';
import { CAJON_PATTERN_LIBRARY } from '../exercises/cajonPatternLibrary';

interface CajonExerciseSelectorProps {
  onStart: (patternId: string, bpm: number, loops: number) => void;
}

export function CajonExerciseSelector({ onStart }: CajonExerciseSelectorProps) {
  const [selectedId, setSelectedId] = useState(CAJON_PATTERN_LIBRARY[0].id);
  const selected = CAJON_PATTERN_LIBRARY.find((p) => p.id === selectedId) ?? CAJON_PATTERN_LIBRARY[0];
  const [bpm, setBpm] = useState(selected.defaultBpm);
  const [loops, setLoops] = useState(selected.defaultLoops);

  const handleSelect = (id: string) => {
    const pattern = CAJON_PATTERN_LIBRARY.find((p) => p.id === id);
    setSelectedId(id);
    if (pattern) {
      setBpm(pattern.defaultBpm);
      setLoops(pattern.defaultLoops);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Groove selector */}
      <div>
        <label className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2 block">
          Groove
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CAJON_PATTERN_LIBRARY.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => handleSelect(pattern.id)}
              className={`
                px-3 py-2 rounded text-left transition-all
                ${selectedId === pattern.id
                  ? 'bg-teal-600/20 text-[var(--c-accent)] border border-teal-500/40'
                  : 'bg-[var(--c-surface)] text-[var(--c-text-muted)] hover:bg-[var(--c-surface-hover)] hover:text-[var(--c-text-subtle)] border border-transparent'
                }
              `}
            >
              <div className="text-sm font-medium">{pattern.title}</div>
              <div className="text-xs opacity-60 mt-0.5">{pattern.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tempo */}
      <div className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--c-text-muted)]">Tempo</span>
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="flex-1 h-1.5 accent-teal-500"
            aria-label="Exercise tempo"
          />
          <span className="text-sm font-mono font-bold text-[var(--c-text)] w-[56px] text-right">
            {bpm} BPM
          </span>
        </div>
      </div>

      {/* Loops */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--c-text-muted)]">Loops</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setLoops(n)}
              className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                loops === n
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface)] text-[var(--c-text-muted)] hover:text-[var(--c-text-subtle)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart(selectedId, bpm, loops)}
        className="mt-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg
          font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
      >
        Start Exercise
      </button>
    </div>
  );
}
