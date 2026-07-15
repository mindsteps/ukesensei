import type { RhythmPatternConfig } from './cajonPatterns';

/**
 * A handful of named grooves for the standalone Cajon exercises tab, in
 * rough order of difficulty. All patterns are one 4/4 measure (beatsPerLoop
 * = 4); `beat` values are 0-indexed offsets within that measure, with .5
 * used for eighth-note subdivisions.
 */
export const CAJON_PATTERN_LIBRARY: RhythmPatternConfig[] = [
  {
    id: 'quarter-pulse',
    title: 'Quarter Note Pulse',
    description: 'A steady bass tone on every beat -- the simplest possible groove.',
    pattern: [
      { hit: 'bass', beat: 0 },
      { hit: 'bass', beat: 1 },
      { hit: 'bass', beat: 2 },
      { hit: 'bass', beat: 3 },
    ],
    beatsPerLoop: 4,
    defaultBpm: 80,
    defaultLoops: 4,
  },
  {
    id: 'basic-groove',
    title: 'Basic Groove',
    description: 'Alternating bass and slap tones -- the foundation of most cajon grooves.',
    pattern: [
      { hit: 'bass', beat: 0 },
      { hit: 'slap', beat: 1 },
      { hit: 'bass', beat: 2 },
      { hit: 'slap', beat: 3 },
    ],
    beatsPerLoop: 4,
    defaultBpm: 85,
    defaultLoops: 4,
  },
  {
    id: 'backbeat-slap',
    title: 'Backbeat Slap',
    description: 'Bass tones drive the pulse, with a single slap accent on the backbeat.',
    pattern: [
      { hit: 'bass', beat: 0 },
      { hit: 'bass', beat: 1 },
      { hit: 'slap', beat: 2 },
      { hit: 'bass', beat: 3 },
    ],
    beatsPerLoop: 4,
    defaultBpm: 90,
    defaultLoops: 4,
  },
  {
    id: 'ghost-note-shuffle',
    title: 'Ghost Note Shuffle',
    description: 'Full eighth-note groove with quiet ghost taps filling every off-beat.',
    pattern: [
      { hit: 'bass', beat: 0 },
      { hit: 'ghost', beat: 0.5 },
      { hit: 'slap', beat: 1 },
      { hit: 'ghost', beat: 1.5 },
      { hit: 'bass', beat: 2 },
      { hit: 'ghost', beat: 2.5 },
      { hit: 'slap', beat: 3 },
      { hit: 'ghost', beat: 3.5 },
    ],
    beatsPerLoop: 4,
    defaultBpm: 85,
    defaultLoops: 3,
  },
  {
    id: 'tresillo-groove',
    title: 'Tresillo Groove',
    description: 'A classic 3-3-2 syncopated pattern, borrowed from Afro-Cuban and flamenco rhythm.',
    pattern: [
      { hit: 'bass', beat: 0 },
      { hit: 'slap', beat: 1.5 },
      { hit: 'bass', beat: 3 },
    ],
    beatsPerLoop: 4,
    defaultBpm: 90,
    defaultLoops: 4,
  },
];

export function getCajonPattern(id: string): RhythmPatternConfig | undefined {
  return CAJON_PATTERN_LIBRARY.find((p) => p.id === id);
}
