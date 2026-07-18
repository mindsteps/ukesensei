import type { NoteName } from './notes';
import { noteToSemitone } from './notes';

const LETTER_DIATONIC: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

/** Diatonic step counting from C0. */
export function noteDiatonicStep(note: NoteName, octave: number): number {
  const letter = note.replace('#', '').replace('b', '');
  return octave * 7 + (LETTER_DIATONIC[letter] ?? 0);
}

/** B4 sits on the middle line of the treble staff. */
const TREBLE_REF_STEP = noteDiatonicStep('B', 4);

export function trebleStaffY(
  note: NoteName,
  octave: number,
  staffTop: number,
  lineSpacing: number,
): number {
  const step = noteDiatonicStep(note, octave);
  const middleLineY = staffTop + lineSpacing * 2;
  return middleLineY + (TREBLE_REF_STEP - step) * (lineSpacing / 2);
}

export function staffAccidental(note: NoteName): 'sharp' | 'flat' | null {
  if (note.includes('#')) return 'sharp';
  if (note.includes('b')) return 'flat';
  return null;
}

/** VexFlow key format, e.g. "c/4", "f#/5". */
export function noteToVexKey(note: NoteName, octave: number): string {
  const letter = note[0].toLowerCase();
  const acc = note.includes('#') ? '#' : note.includes('b') ? 'b' : '';
  return `${letter}${acc}/${octave}`;
}

/**
 * EasyScore pitch token, e.g. "c4", "f#5". Unlike `noteToVexKey`, EasyScore's
 * grammar expects the octave to immediately follow the note letter/accidental
 * with no slash (the slash is reserved for the duration that follows, e.g.
 * "c4/q"). Reusing `noteToVexKey` here would make EasyScore fail to parse.
 */
function noteToEasyScorePitch(note: NoteName, octave: number): string {
  const letter = note[0].toLowerCase();
  const acc = note.includes('#') ? '#' : note.includes('b') ? 'b' : '';
  return `${letter}${acc}${octave}`;
}

export function midiFromNote(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(note);
}

export function notesEqual(
  a: { note: NoteName; octave: number } | null,
  b: { note: NoteName; octave: number } | null,
): boolean {
  if (!a || !b) return false;
  return a.note === b.note && a.octave === b.octave;
}

/** Ledger line Y positions for notes that extend above or below the staff. */
export function ledgerLineYs(
  noteY: number,
  staffTop: number,
  staffBottom: number,
  lineSpacing: number,
): number[] {
  const half = lineSpacing / 2;
  const lines: number[] = [];

  let y = staffBottom + half;
  while (noteY >= y - 0.5) {
    lines.push(y);
    y += half;
  }

  y = staffTop - half;
  while (noteY <= y + 0.5) {
    lines.push(y);
    y -= half;
  }

  return lines;
}

export interface MelodyNote {
  note: NoteName;
  octave: number;
  cents: number;
  startMs: number;
  durationMs: number;
}

const MIN_BPM = 50;
const MAX_BPM = 200;

/**
 * Estimate a tempo from captured note onsets so the melody can be quantized
 * to a musical grid. Uses the median inter-onset interval (ignoring near-zero
 * gaps and long pauses between phrases) as a proxy for an eighth note, then
 * folds the result into a "normal" tempo range by doubling/halving.
 */
export function estimateBpm(notes: MelodyNote[]): number {
  const iois: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].startMs - notes[i - 1].startMs;
    if (gap > 50 && gap < 2000) iois.push(gap);
  }
  if (iois.length === 0) return 100;

  iois.sort((a, b) => a - b);
  const median = iois[Math.floor(iois.length / 2)];

  let bpm = 60000 / (median * 2);
  while (bpm < MIN_BPM) bpm *= 2;
  while (bpm > MAX_BPM) bpm /= 2;
  return Math.round(bpm);
}

// Quantization grid: 16th-note resolution, 4 beats (16 ticks) per 4/4 measure.
const TICKS_PER_BEAT = 4;
const TICKS_PER_MEASURE = TICKS_PER_BEAT * 4;

// Ordered largest-to-smallest so any 1..16 tick run decomposes into standard
// (optionally dotted) note values, e.g. 6 ticks -> dotted quarter (not two
// separately-attacked notes tied together).
const DURATION_UNITS: Array<{ ticks: number; duration: string; dots: number }> = [
  { ticks: 16, duration: 'w', dots: 0 },
  { ticks: 12, duration: 'h', dots: 1 },
  { ticks: 8, duration: 'h', dots: 0 },
  { ticks: 6, duration: 'q', dots: 1 },
  { ticks: 4, duration: 'q', dots: 0 },
  { ticks: 3, duration: '8', dots: 1 },
  { ticks: 2, duration: '8', dots: 0 },
  { ticks: 1, duration: '16', dots: 0 },
];

function decomposeTicks(ticks: number): Array<{ duration: string; dots: number }> {
  const pieces: Array<{ duration: string; dots: number }> = [];
  let remaining = ticks;
  while (remaining > 0) {
    const unit = DURATION_UNITS.find((u) => u.ticks <= remaining);
    if (!unit) break;
    pieces.push({ duration: unit.duration, dots: unit.dots });
    remaining -= unit.ticks;
  }
  return pieces;
}

function easyScoreToken(pitch: string | null, duration: string, dots: number): string {
  const dotStr = '.'.repeat(dots);
  return pitch === null ? `B4/${duration}/r${dotStr}` : `${pitch}/${duration}${dotStr}`;
}

export interface MeasureToken {
  /** EasyScore token, e.g. "c4/q" or a rest like "B4/q/r". */
  token: string;
  /** Index into the original (unquantized) `notes` array this token was derived from, or null for a rest. */
  noteIndex: number | null;
  /** VexFlow duration code (e.g. "q", "8", "h"), for renderers that build notes directly (e.g. tab) instead of via EasyScore. */
  duration: string;
  /** Number of rhythmic dots on this token's duration. */
  dots: number;
}

export interface QuantizedMelody {
  bpm: number;
  /** Tokens for each 4/4 measure, gaps between notes filled with rests. */
  measures: MeasureToken[][];
}

// A note's detected sustain can end up a bit short of the next note's onset
// even for genuinely legato playing (natural note-off timing, detector
// latency); allow this much slack (in grid ticks) before treating the
// shortfall as a deliberate rest instead.
const REST_SLACK_TICKS = 1;

/**
 * Snap captured note onsets/durations onto a 16th-note grid at the estimated
 * (or given) tempo, producing clean, tempo-aligned rhythmic notation instead
 * of the raw, often-jittery timing from live pitch detection.
 */
export function quantizeMelody(notes: MelodyNote[], bpm: number = estimateBpm(notes)): QuantizedMelody {
  if (notes.length === 0) return { bpm, measures: [] };

  const gridMs = 60000 / bpm / TICKS_PER_BEAT;
  const t0 = notes[0].startMs;
  const onsetTicks = notes.map((n) => Math.round((n.startMs - t0) / gridMs));

  // A note's rhythmic value is normally the (quantized) time until the next
  // note starts - melodic playing is usually legato, so this reads far more
  // naturally than the note's own raw sustain, which is often cut short by
  // pitch-detection dropout or the instrument's decay. But if the detected
  // sustain falls well short of that gap, the player likely left a real
  // pause, so only the sustain becomes the note and the rest of the gap
  // becomes a rest.
  const events: Array<{ pitch: string | null; ticks: number; noteIndex: number | null }> = [];
  for (let i = 0; i < notes.length; i++) {
    const pitch = noteToEasyScorePitch(notes[i].note, notes[i].octave);
    const durationTicks = Math.max(1, Math.round(notes[i].durationMs / gridMs));

    if (i === notes.length - 1) {
      events.push({ pitch, ticks: Math.min(durationTicks, TICKS_PER_MEASURE), noteIndex: i });
      continue;
    }

    const gapTicks = onsetTicks[i + 1] - onsetTicks[i];
    if (gapTicks <= 0) continue; // collapsed onto the next note by rounding

    const legato = durationTicks >= gapTicks - REST_SLACK_TICKS;
    const noteTicks = Math.min(legato ? gapTicks : durationTicks, gapTicks);
    events.push({ pitch, ticks: noteTicks, noteIndex: i });
    if (gapTicks > noteTicks) events.push({ pitch: null, ticks: gapTicks - noteTicks, noteIndex: null });
  }

  const measures: MeasureToken[][] = [[]];
  let measurePos = 0;
  const emit = (pitch: string | null, ticksLeft: number, noteIndex: number | null) => {
    let remaining = ticksLeft;
    while (remaining > 0) {
      const chunk = Math.min(remaining, TICKS_PER_MEASURE - measurePos);
      for (const { duration, dots } of decomposeTicks(chunk)) {
        measures[measures.length - 1].push({ token: easyScoreToken(pitch, duration, dots), noteIndex, duration, dots });
      }
      measurePos += chunk;
      remaining -= chunk;
      if (measurePos >= TICKS_PER_MEASURE) {
        measurePos = 0;
        measures.push([]);
      }
    }
  };
  for (const event of events) emit(event.pitch, event.ticks, event.noteIndex);
  if (measurePos > 0) emit(null, TICKS_PER_MEASURE - measurePos, null);
  if (measures[measures.length - 1].length === 0) measures.pop();

  return { bpm, measures };
}

export interface ScoreLine {
  /** Measures in this line, each an array of tokens, kept separate so each renders on its own stave with its own bar line. */
  measures: MeasureToken[][];
}

/** Group quantized measures into score lines a few bars at a time. */
export function chunkMeasuresIntoLines(measures: MeasureToken[][], measuresPerLine = 2): ScoreLine[] {
  const lines: ScoreLine[] = [];
  for (let i = 0; i < measures.length; i += measuresPerLine) {
    lines.push({ measures: measures.slice(i, i + measuresPerLine) });
  }
  return lines;
}

/**
 * Find the index of the melody note whose [startMs, startMs + durationMs)
 * window contains the given playback time, so playback UIs (sheet music
 * cursor, fretboard highlight) can highlight whichever note is "currently
 * playing" at a given moment.
 */
export function findActiveMelodyNoteIndex(notes: MelodyNote[], timeMs: number): number {
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (timeMs >= note.startMs && timeMs < note.startMs + note.durationMs) return i;
  }
  return -1;
}

/** Convert session note timestamps into melody segments with durations. */
export function sessionNotesToMelody(
  notes: Array<{
    note: string;
    octave: number;
    cents: number;
    timestamp: number;
  }>,
  sessionStart: number,
): MelodyNote[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  return sorted.map((n, i) => {
    const startMs = n.timestamp - sessionStart;
    const nextTs = i < sorted.length - 1 ? sorted[i + 1].timestamp : n.timestamp + 500;
    return {
      note: n.note as NoteName,
      octave: n.octave,
      cents: n.cents,
      startMs: Math.max(0, startMs),
      durationMs: Math.max(80, nextTs - n.timestamp),
    };
  });
}
