/**
 * Polyphonic (multi-note) pitch detection from a frequency-domain magnitude
 * spectrum -- i.e. "which notes are sounding right now", not just "the one
 * dominant pitch". This is what makes real chord detection possible: the
 * previous approach fed a single-pitch tracker's readings into a rolling
 * time window and guessed a chord from whichever note names showed up over
 * ~800ms, which is fundamentally limited (it can only ever "see" one
 * frequency at a time, and gets confused by harmonics/transients when
 * multiple strings ring together).
 *
 * ALGORITHM: iterative harmonic-sum "peeling".
 * 1. Score every candidate fundamental frequency by summing the energy at
 *    its own bin plus (tapered) energy at its harmonic multiples (2x, 3x, ...).
 *    A real fundamental scores much higher than a bin that's merely one of
 *    several overlapping notes' harmonics, because the real fundamental's
 *    *own* bin energy anchors the score.
 * 2. Take the single best-scoring candidate as a found note.
 * 3. Subtract (cancel) that note's entire harmonic series from the spectrum,
 *    so the next iteration doesn't just re-find the same note or one of its
 *    overtones.
 * 4. Repeat until no candidate scores high enough relative to the first
 *    (strongest) note found, or maxNotes is reached.
 *
 * A harmonic lookup uses a small search window around each expected harmonic
 * bin (widening slightly at higher harmonic numbers) because a fundamental's
 * own bin-quantization error multiplies by the harmonic number -- e.g. a
 * fundamental estimate that's a fraction of a bin off will have its 4th
 * harmonic drift a full bin or more from where that harmonic's real energy
 * actually landed. Searching a small window absorbs that drift.
 *
 * Validated against synthetic multi-note harmonic spectra (chords, power
 * chords, dense 6-note voicings, adjacent semitones, low bass notes) before
 * being wired into the live audio pipeline.
 */

export interface PolyphonicDetectionOptions {
  /** Lowest fundamental frequency to consider, in Hz. */
  minFrequency: number;
  /** Highest fundamental frequency to consider, in Hz. */
  maxFrequency: number;
  /** Maximum number of simultaneous notes to report. Default 6. */
  maxNotes?: number;
  /** How many harmonics (including the fundamental itself) to sum per candidate. Default 6. */
  numHarmonics?: number;
  /**
   * A found note's harmonic-sum score must be at least this fraction of the
   * *first* (strongest) note's score to be accepted -- filters out residual
   * spectral noise left over after peeling out the real notes. Default 0.25.
   */
  relativeSalienceThreshold?: number;
}

const DEFAULT_MAX_NOTES = 6;
const DEFAULT_NUM_HARMONICS = 6;
const DEFAULT_RELATIVE_THRESHOLD = 0.25;

/** Search/cancellation window (in bins) for the k-th harmonic -- widens a
 * little at higher k to absorb compounding bin-quantization drift. */
function harmonicWindow(k: number): number {
  return 1 + Math.floor(k / 3);
}

function maxInWindow(mags: Float64Array, centerBin: number, window: number): number {
  let best = 0;
  for (let d = -window; d <= window; d++) {
    const b = centerBin + d;
    if (b >= 0 && b < mags.length && mags[b] > best) best = mags[b];
  }
  return best;
}

function harmonicSalienceAt(mags: Float64Array, bin: number, numHarmonics: number): number {
  let sum = mags[bin];
  for (let k = 2; k <= numHarmonics; k++) {
    sum += maxInWindow(mags, bin * k, harmonicWindow(k)) / (k * k);
  }
  return sum;
}

function findBestFundamental(
  mags: Float64Array,
  minBin: number,
  maxBin: number,
  numHarmonics: number,
): { bin: number; value: number } {
  let bestBin = -1;
  let bestVal = 0;
  for (let bin = minBin; bin <= maxBin; bin++) {
    const val = harmonicSalienceAt(mags, bin, numHarmonics);
    if (val > bestVal) {
      bestVal = val;
      bestBin = bin;
    }
  }
  return { bin: bestBin, value: bestVal };
}

function cancelHarmonics(mags: Float64Array, fundamentalBin: number, numHarmonics: number): void {
  mags[fundamentalBin] = 0;
  for (let k = 2; k <= numHarmonics; k++) {
    const window = harmonicWindow(k);
    const center = fundamentalBin * k;
    for (let d = -window; d <= window; d++) {
      const b = center + d;
      if (b >= 0 && b < mags.length) mags[b] = 0;
    }
  }
}

/** True if `freq` sits within `toleranceCents` of an integer multiple of `fundamental`. */
function isHarmonicOf(freq: number, fundamental: number, toleranceCents = 35): boolean {
  const ratio = freq / fundamental;
  const nearest = Math.round(ratio);
  if (nearest < 1) return false;
  const centsOff = 1200 * Math.log2(ratio / nearest);
  return Math.abs(centsOff) < toleranceCents;
}

/**
 * Detect the fundamental frequencies of every note currently sounding in a
 * linear-magnitude spectrum (NOT dB -- see `dbToLinearMagnitudes` below for
 * converting AnalyserNode output first).
 *
 * Returns detected fundamentals sorted low to high.
 */
export function detectPolyphonicFrequencies(
  magnitudes: Float32Array | Float64Array,
  binHz: number,
  options: PolyphonicDetectionOptions,
): number[] {
  const {
    minFrequency,
    maxFrequency,
    maxNotes = DEFAULT_MAX_NOTES,
    numHarmonics = DEFAULT_NUM_HARMONICS,
    relativeSalienceThreshold = DEFAULT_RELATIVE_THRESHOLD,
  } = options;

  const mags = Float64Array.from(magnitudes);
  const minBin = Math.max(1, Math.floor(minFrequency / binHz));
  const maxBin = Math.min(Math.floor(maxFrequency / binHz), Math.floor(mags.length / numHarmonics));
  if (maxBin <= minBin) return [];

  let peakBinVal = 0;
  for (let i = minBin; i <= maxBin; i++) peakBinVal = Math.max(peakBinVal, mags[i]);
  if (peakBinVal <= 0) return [];

  const found: number[] = [];
  for (let n = 0; n < maxNotes; n++) {
    const { bin, value } = findBestFundamental(mags, minBin, maxBin, numHarmonics);
    if (bin < 0 || value < peakBinVal * relativeSalienceThreshold) break;

    const freq = bin * binHz;
    const isDupe = found.some((f) => isHarmonicOf(freq, f) || isHarmonicOf(f, freq));
    // Cancel regardless of dupe status so a repeatedly-rediscovered octave
    // doesn't just keep winning every subsequent iteration.
    cancelHarmonics(mags, bin, numHarmonics);
    if (isDupe) continue;

    found.push(freq);
  }

  return found.sort((a, b) => a - b);
}

/** Convert AnalyserNode dB magnitudes (typically -100..0) to linear amplitude. */
export function dbToLinearMagnitudes(dbData: Float32Array): Float64Array {
  const out = new Float64Array(dbData.length);
  for (let i = 0; i < dbData.length; i++) {
    out[i] = Math.pow(10, dbData[i] / 20);
  }
  return out;
}
