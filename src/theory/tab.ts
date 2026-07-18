import type { MelodyNote } from './staff';
import type { FretPosition, InstrumentTuning } from './fretboard';
import { generateFretboard, findNotePositions } from './fretboard';

export interface TabPosition {
  string: number;
  fret: number;
}

/**
 * Picks the best fret position among several candidates for the same pitch
 * (a given note/octave can usually be fretted on more than one string).
 * Weighted toward minimal hand movement from the previously chosen fret,
 * with a smaller preference for staying near the nut, so a mapped melody
 * reads as a sensible, playable tab line rather than jumping strings and
 * frets erratically.
 */
function scorePosition(pos: FretPosition, prev: TabPosition | null): number {
  const jump = prev ? Math.abs(pos.fret - prev.fret) : 0;
  return jump * 2 + pos.fret * 0.3;
}

function pickBest(candidates: FretPosition[], prev: TabPosition | null): FretPosition {
  let best = candidates[0];
  let bestScore = scorePosition(best, prev);
  for (let i = 1; i < candidates.length; i++) {
    const score = scorePosition(candidates[i], prev);
    if (score < bestScore) {
      best = candidates[i];
      bestScore = score;
    }
  }
  return best;
}

/**
 * Same pitch class, different octave than requested (the note falls outside
 * this tuning's fretted range, e.g. a melody recorded on a different
 * instrument) — fall back to whichever octave is closest, so the tab still
 * shows *a* playable position instead of nothing.
 */
function closestByOctave(candidates: FretPosition[], octave: number): FretPosition[] {
  let bestDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs(c.octave - octave);
    if (diff < bestDiff) bestDiff = diff;
  }
  return candidates.filter((c) => Math.abs(c.octave - octave) === bestDiff);
}

/**
 * Maps each melody note to a playable (string, fret) position on the given
 * tuning's fretboard, one entry per note in `notes` (or null when the note
 * has no matching pitch class anywhere on the fretboard).
 */
export function mapMelodyToTab(notes: MelodyNote[], tuning: InstrumentTuning): (TabPosition | null)[] {
  const fretboard = generateFretboard(tuning);
  const results: (TabPosition | null)[] = [];
  let prev: TabPosition | null = null;

  for (const note of notes) {
    let candidates = findNotePositions(fretboard, note.note, note.octave);
    if (candidates.length === 0) {
      const sameLetter = findNotePositions(fretboard, note.note);
      if (sameLetter.length === 0) {
        results.push(null);
        prev = null;
        continue;
      }
      candidates = closestByOctave(sameLetter, note.octave);
    }

    const best = pickBest(candidates, prev);
    const pos: TabPosition = { string: best.string, fret: best.fret };
    results.push(pos);
    prev = pos;
  }

  return results;
}
