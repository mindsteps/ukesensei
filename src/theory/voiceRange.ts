import { type NoteName, noteToSemitone, semitoneToNote } from './notes';
import type { FretPosition } from './fretboard';

/**
 * Voice has no strings, frets, or keys — pitch comes entirely from the
 * singer's ear and vocal tract, so there's no fingering diagram to show.
 * What exercises and lessons need instead is a shared working range.
 *
 * This is a single, average "practice range" (C3-C5, two octaves) rather
 * than a specific voice type (soprano/alto/tenor/bass) — it's meant to sit
 * comfortably in the middle of most adult voices so warm-ups and scale
 * drills work regardless of vocal range. Singers with a narrower or shifted
 * range can simply favor whichever octave suits them.
 */
export interface VoiceRangeNote {
  note: NoteName;
  octave: number;
  /** MIDI note number (C4 = 60), used as the lookup key. */
  midi: number;
}

function midiOf(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(note);
}

function noteAt(midi: number): { note: NoteName; octave: number } {
  return { note: semitoneToNote(midi), octave: Math.floor(midi / 12) - 1 };
}

export const VOICE_MIN_MIDI = midiOf('C', 3);
export const VOICE_MAX_MIDI = midiOf('C', 5);

/** Ordered list of every note in the practice range, low to high. */
export const VOICE_RANGE: VoiceRangeNote[] = [];
for (let midi = VOICE_MIN_MIDI; midi <= VOICE_MAX_MIDI; midi++) {
  const { note, octave } = noteAt(midi);
  VOICE_RANGE.push({ note, octave, midi });
}

/**
 * A "fake fretboard" spanning the voice practice range, one chromatic
 * semitone per fret on a single virtual string (string 0). This lets voice
 * reuse the same scale-exercise and lesson-position machinery built for
 * fretted instruments — `[0, N]` means "the note N semitones above the
 * practice range floor (C3)" — without needing frets or strings of its own.
 */
export function getVoiceRangeBoard(): FretPosition[] {
  return VOICE_RANGE.map((n, i) => ({ string: 0, fret: i, note: n.note, octave: n.octave }));
}
