import { type NoteName, noteToSemitone, semitoneToNote } from './notes';

/**
 * A simplified Boehm-system clarinet fingering model.
 *
 * Real clarinets have several duplicate keys (e.g. the low E/F#/G# pinky keys
 * exist on *both* pinkies so players can pick whichever is convenient). This
 * model only picks one canonical key per note so the diagram stays simple —
 * good enough as a "how do I finger this note" reference, not a full
 * mechanical simulation.
 */
export type ClarinetKeyId =
  | 'register'
  | 'thumb'
  | 'l1' | 'l2' | 'l3'
  | 'r1' | 'r2' | 'r3'
  | 'lSideCsharp' | 'lSideGsharp' | 'lSideA'
  | 'rPinkyE' | 'rPinkyF' | 'rPinkyFsharp' | 'rPinkyGsharp' | 'rPinkyEb';

export interface ClarinetKeyInfo {
  id: ClarinetKeyId;
  label: string;
  group: 'register' | 'left-main' | 'left-side' | 'right-main' | 'right-pinky';
}

export const CLARINET_KEYS: ClarinetKeyInfo[] = [
  { id: 'register', label: 'Reg', group: 'register' },
  { id: 'thumb', label: 'Th', group: 'left-main' },
  { id: 'l1', label: '1', group: 'left-main' },
  { id: 'l2', label: '2', group: 'left-main' },
  { id: 'l3', label: '3', group: 'left-main' },
  { id: 'lSideCsharp', label: 'C#', group: 'left-side' },
  { id: 'lSideGsharp', label: 'G#', group: 'left-side' },
  { id: 'lSideA', label: 'A', group: 'left-side' },
  { id: 'r1', label: '1', group: 'right-main' },
  { id: 'r2', label: '2', group: 'right-main' },
  { id: 'r3', label: '3', group: 'right-main' },
  { id: 'rPinkyE', label: 'E', group: 'right-pinky' },
  { id: 'rPinkyF', label: 'F', group: 'right-pinky' },
  { id: 'rPinkyFsharp', label: 'F#', group: 'right-pinky' },
  { id: 'rPinkyGsharp', label: 'G#', group: 'right-pinky' },
  { id: 'rPinkyEb', label: 'Eb', group: 'right-pinky' },
];

export interface ClarinetFingering {
  note: NoteName;
  octave: number;
  /** MIDI note number (C4 = 60), used as the lookup key. */
  midi: number;
  /** Keys that are pressed/closed for this note; everything else is open. */
  closed: Set<ClarinetKeyId>;
}

function midiOf(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(note);
}

function noteAt(midi: number): { note: NoteName; octave: number } {
  return { note: semitoneToNote(midi), octave: Math.floor(midi / 12) - 1 };
}

/**
 * Chalumeau register (E3-A#4), i.e. register key off. Fingerings are the
 * "Basic" fingerings from the Boehm-system clarinet fingering chart
 * (thewoodwind fingering guide), with a single canonical hand choice for
 * notes that have duplicate left/right pinky options.
 */
const CHALUMEAU: { midi: number; closed: ClarinetKeyId[] }[] = [
  { midi: midiOf('E', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rPinkyE'] },
  { midi: midiOf('F', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rPinkyF'] },
  { midi: midiOf('F#', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rPinkyFsharp'] },
  { midi: midiOf('G', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3'] },
  { midi: midiOf('G#', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rPinkyGsharp'] },
  { midi: midiOf('A', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1', 'r2'] },
  { midi: midiOf('A#', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r1'] },
  { midi: midiOf('B', 3), closed: ['thumb', 'l1', 'l2', 'l3', 'r2'] },
  { midi: midiOf('C', 4), closed: ['thumb', 'l1', 'l2', 'l3'] },
  { midi: midiOf('C#', 4), closed: ['thumb', 'l1', 'l2', 'l3', 'lSideCsharp'] },
  { midi: midiOf('D', 4), closed: ['thumb', 'l1', 'l2'] },
  { midi: midiOf('D#', 4), closed: ['thumb', 'l1', 'l2', 'rPinkyEb'] },
  { midi: midiOf('E', 4), closed: ['thumb', 'l1'] },
  { midi: midiOf('F', 4), closed: ['thumb'] },
  { midi: midiOf('F#', 4), closed: ['l1'] },
  { midi: midiOf('G', 4), closed: [] },
  { midi: midiOf('G#', 4), closed: ['lSideGsharp'] },
  { midi: midiOf('A', 4), closed: ['lSideA'] },
  { midi: midiOf('A#', 4), closed: ['register', 'lSideA'] },
];

const CHALUMEAU_BY_MIDI = new Map(CHALUMEAU.map((f) => [f.midi, f]));

/**
 * The clarinet's cylindrical bore means the register key overblows to a
 * twelfth (19 semitones) rather than an octave. So the clarion register
 * (B4-C6) mirrors the chalumeau fingering a twelfth below, plus the register
 * key. This holds for every note in that range (verified against the
 * reference chart note-by-note).
 */
const REGISTER_INTERVAL = 19;

const FINGERING_BY_MIDI = new Map<number, ClarinetFingering>();

for (const entry of CHALUMEAU) {
  const { note, octave } = noteAt(entry.midi);
  FINGERING_BY_MIDI.set(entry.midi, {
    note,
    octave,
    midi: entry.midi,
    closed: new Set(entry.closed),
  });
}

const CLARION_MIN = midiOf('B', 4);
const CLARION_MAX = midiOf('C', 6);
for (let midi = CLARION_MIN; midi <= CLARION_MAX; midi++) {
  const base = CHALUMEAU_BY_MIDI.get(midi - REGISTER_INTERVAL);
  if (!base) continue;
  const { note, octave } = noteAt(midi);
  FINGERING_BY_MIDI.set(midi, {
    note,
    octave,
    midi,
    closed: new Set([...base.closed, 'register']),
  });
}

/** Ordered list of every playable note, low to high — handy for note pickers. */
export const CLARINET_RANGE: ClarinetFingering[] = Array.from(FINGERING_BY_MIDI.values())
  .sort((a, b) => a.midi - b.midi);

export function getClarinetFingering(note: NoteName, octave: number): ClarinetFingering | null {
  return FINGERING_BY_MIDI.get(midiOf(note, octave)) ?? null;
}

export const CLARINET_MIN_MIDI = Math.min(...Array.from(FINGERING_BY_MIDI.keys()));
export const CLARINET_MAX_MIDI = Math.max(...Array.from(FINGERING_BY_MIDI.keys()));
