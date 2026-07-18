import { type NoteName, frequencyToNote } from '../theory/notes';
import {
  generateFretboard,
  findNotePositions,
  isStringInstrument,
  TUNINGS_BY_INSTRUMENT,
  DEFAULT_TUNING_KEY,
  type FretPosition,
  type Instrument,
  type StringInstrument,
} from '../theory/fretboard';

const fretboards: Record<StringInstrument, Record<string, FretPosition[]>> = {
  ukulele: Object.fromEntries(
    Object.entries(TUNINGS_BY_INSTRUMENT.ukulele).map(([key, t]) => [key, generateFretboard(t)]),
  ),
  bass: Object.fromEntries(
    Object.entries(TUNINGS_BY_INSTRUMENT.bass).map(([key, t]) => [key, generateFretboard(t)]),
  ),
  guitar: Object.fromEntries(
    Object.entries(TUNINGS_BY_INSTRUMENT.guitar).map(([key, t]) => [key, generateFretboard(t)]),
  ),
};

export interface NoteInfo {
  note: NoteName;
  octave: number;
  cents: number;
  frequency: number;
  positions: FretPosition[];
}

/**
 * Per-instrument pitch-detection tuning: the audible frequency range to accept,
 * and the analysis buffer size (larger buffers resolve low bass notes more
 * reliably, at the cost of a little extra latency).
 */
export const AUDIO_CONFIG_BY_INSTRUMENT: Record<
  Instrument,
  { minFrequency: number; maxFrequency: number; analysisSize: number }
> = {
  // G3 is ~196 Hz, so the floor must be below that for low G support
  ukulele: { minFrequency: 175, maxFrequency: 1200, analysisSize: 2048 },
  // Open E1 is ~41 Hz; give it headroom, and a bigger analysis window for accuracy.
  bass: { minFrequency: 33, maxFrequency: 450, analysisSize: 4096 },
  // Open E2 is ~82 Hz -- closer to bass than ukulele, so use the same larger
  // analysis window for reliable low-string resolution.
  guitar: { minFrequency: 70, maxFrequency: 1400, analysisSize: 4096 },
  // Chalumeau E3 (~165 Hz) to clarion C6 (~1047 Hz), the range covered by
  // the fingering chart in clarinetFingerings.ts.
  clarinet: { minFrequency: 145, maxFrequency: 1100, analysisSize: 2048 },
  // C3 (~131 Hz) to C5 (~523 Hz), the practice range covered by
  // voiceRange.ts. A larger analysis window helps resolve the lower notes,
  // similar to bass/guitar.
  voice: { minFrequency: 110, maxFrequency: 600, analysisSize: 4096 },
  // Handpan layouts span from the lowest Ding (C3, ~130.8 Hz) up to the
  // highest tone field (C5, ~523 Hz, on the 10-tone layouts); give some
  // headroom on both ends since handpans ring with strong overtones.
  handpan: { minFrequency: 120, maxFrequency: 900, analysisSize: 4096 },
  // Cajon has no stable pitch -- this entry only exists to satisfy the
  // Record<Instrument, ...> map. Cajon ignores detectedNote entirely and is
  // graded by useOnsetDetection.ts / useRhythmExercise.ts instead.
  cajon: { minFrequency: 60, maxFrequency: 5000, analysisSize: 2048 },
  // Hole 1 blow (C4, ~262 Hz) up to hole 10 blow (C7, ~2093 Hz), the full
  // range covered by harmonicaLayout.ts's 10-hole Richter chart.
  harmonica: { minFrequency: 240, maxFrequency: 2200, analysisSize: 2048 },
  // Cello open C string is C2 (~65 Hz); with a wide range up to A5 (~880 Hz).
  // Use a large analysis window (4096) to resolve the deep, resonant low notes.
  cello: { minFrequency: 55, maxFrequency: 1000, analysisSize: 4096 },
};

const MIN_CLARITY = 0.85;

export function analyzeFrequency(
  frequency: number,
  clarity: number,
  instrument: Instrument = 'ukulele',
  tuningKey?: string,
): NoteInfo | null {
  const { minFrequency, maxFrequency } = AUDIO_CONFIG_BY_INSTRUMENT[instrument];
  if (clarity < MIN_CLARITY || frequency < minFrequency || frequency > maxFrequency) return null;

  const { note, octave, cents } = frequencyToNote(frequency);

  // Clarinet has no fretboard — positions stay empty; the fingering diagram
  // is looked up separately via getClarinetFingering().
  if (!isStringInstrument(instrument)) {
    return { note, octave, cents, frequency, positions: [] };
  }

  const key = tuningKey ?? DEFAULT_TUNING_KEY[instrument];
  const fretboard = fretboards[instrument][key] ?? fretboards[instrument][DEFAULT_TUNING_KEY[instrument]];
  const positions = findNotePositions(fretboard, note, octave);

  return { note, octave, cents, frequency, positions };
}

/**
 * Detect tuning from a played note.
 * If we hear G3 (~196 Hz), the user has a low G string.
 * If we hear G4 (~392 Hz) on what would be the open G string, they have high G.
 */
export function detectTuningFromNote(
  note: NoteName,
  octave: number,
  frequency: number,
): 'standard' | 'low_g' | null {
  if (note !== 'G') return null;

  // G3 range: ~185-207 Hz (with some cents tolerance)
  if (octave === 3 && frequency >= 185 && frequency <= 210) return 'low_g';
  // G4 range: ~370-415 Hz
  if (octave === 4 && frequency >= 370 && frequency <= 415) return 'standard';

  return null;
}
