import { type NoteName, semitoneToNote, noteToSemitone } from './notes';

/** Instruments with strings/frets, i.e. ones that have a tuning and a fretboard diagram. */
export type StringInstrument = 'ukulele' | 'bass' | 'guitar';

/** Clarinet has no strings/frets — it uses a fingering diagram instead (see clarinetFingerings.ts). */
/** Voice has no strings/frets either — it uses a vocal practice range instead (see voiceRange.ts). */
/** Handpan has no strings/frets either — it uses a fixed tone-field layout instead (see handpanLayout.ts). */
/** Cajon is percussive with no stable pitch — it uses hit-type/rhythm grading instead (see cajonPatterns.ts). */
export type Instrument = StringInstrument | 'clarinet' | 'voice' | 'handpan' | 'cajon';

export function isStringInstrument(instrument: Instrument): instrument is StringInstrument {
  return instrument === 'ukulele' || instrument === 'bass' || instrument === 'guitar';
}

/** Cajon has no pitch at all — it's graded by hit type/timing via a separate rhythm-exercise system. */
export function isRhythmInstrument(instrument: Instrument): instrument is 'cajon' {
  return instrument === 'cajon';
}

/**
 * Whether an instrument supports the pitch-target exercise/lesson-checkpoint
 * system. Every instrument with a defined pitch board (fretboard, voice's
 * vocal range, or handpan's tone fields) supports it; clarinet only has a
 * fingering chart, with no board to generate exercise paths from yet, and
 * cajon uses its own rhythm-based exercise system instead (see
 * isRhythmInstrument).
 */
export function supportsExercises(instrument: Instrument): boolean {
  return instrument !== 'clarinet';
}

export interface FretPosition {
  string: number;   // string index, 0 = topmost string as drawn on the fretboard
  fret: number;     // 0 = open, 1-15
  note: NoteName;
  octave: number;
}

export interface InstrumentTuning {
  name: string;
  strings: { note: NoteName; octave: number }[];
}

/** @deprecated use InstrumentTuning */
export type UkuleleTuning = InstrumentTuning;

export const TUNINGS: Record<string, InstrumentTuning> = {
  standard: {
    name: 'Standard (High G)',
    strings: [
      { note: 'G', octave: 4 },
      { note: 'C', octave: 4 },
      { note: 'E', octave: 4 },
      { note: 'A', octave: 4 },
    ],
  },
  low_g: {
    name: 'Low G',
    strings: [
      { note: 'G', octave: 3 },
      { note: 'C', octave: 4 },
      { note: 'E', octave: 4 },
      { note: 'A', octave: 4 },
    ],
  },
};

/**
 * Bass tunings, strings ordered top-to-bottom the way they're drawn on the fretboard
 * (thinnest first). Keys are namespaced with a `bass_` prefix so they stay distinct
 * from ukulele tuning keys when stored as a flat string (e.g. in session metadata).
 */
export const BASS_TUNINGS: Record<string, InstrumentTuning> = {
  bass_standard: {
    name: 'Standard (E-A-D-G)',
    strings: [
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
      { note: 'A', octave: 1 },
      { note: 'E', octave: 1 },
    ],
  },
};

/**
 * Guitar tunings, strings ordered top-to-bottom the way they're drawn on the fretboard
 * (thinnest first), matching the ordering convention used for bass tunings.
 */
export const GUITAR_TUNINGS: Record<string, InstrumentTuning> = {
  guitar_standard: {
    name: 'Standard (E-A-D-G-B-E)',
    strings: [
      { note: 'E', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'A', octave: 2 },
      { note: 'E', octave: 2 },
    ],
  },
};

export const TUNINGS_BY_INSTRUMENT: Record<StringInstrument, Record<string, InstrumentTuning>> = {
  ukulele: TUNINGS,
  bass: BASS_TUNINGS,
  guitar: GUITAR_TUNINGS,
};

export const DEFAULT_TUNING_KEY: Record<StringInstrument, string> = {
  ukulele: 'low_g',
  bass: 'bass_standard',
  guitar: 'guitar_standard',
};

/** Look up a tuning by its flat key regardless of which instrument it belongs to. */
export function findTuningByKey(tuningKey: string): InstrumentTuning | null {
  for (const tunings of Object.values(TUNINGS_BY_INSTRUMENT)) {
    if (tunings[tuningKey]) return tunings[tuningKey];
  }
  return null;
}

export const NUM_FRETS = 15;
export const FRET_MARKERS = [5, 7, 10, 12];
export const DOUBLE_FRET_MARKERS = [12];

export function generateFretboard(tuning: InstrumentTuning = TUNINGS.standard): FretPosition[] {
  const positions: FretPosition[] = [];

  for (let s = 0; s < tuning.strings.length; s++) {
    const openSemitone = noteToSemitone(tuning.strings[s].note);
    const openOctave = tuning.strings[s].octave;

    for (let f = 0; f <= NUM_FRETS; f++) {
      const totalSemitones = openSemitone + f;
      const note = semitoneToNote(totalSemitones);
      const octaveOffset = Math.floor((openSemitone + f) / 12) - Math.floor(openSemitone / 12);

      positions.push({
        string: s,
        fret: f,
        note,
        octave: openOctave + octaveOffset,
      });
    }
  }

  return positions;
}

export function getScalePositions(
  fretboard: FretPosition[],
  scaleNotes: NoteName[],
): FretPosition[] {
  return fretboard.filter(pos => scaleNotes.includes(pos.note));
}

export function findNotePositions(
  fretboard: FretPosition[],
  note: NoteName,
  octave?: number,
): FretPosition[] {
  return fretboard.filter(pos =>
    pos.note === note && (octave === undefined || pos.octave === octave)
  );
}

export function getPositionId(pos: FretPosition): string {
  return `s${pos.string}f${pos.fret}`;
}
