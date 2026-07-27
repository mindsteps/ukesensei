import { useRef, useEffect, useState, useCallback } from 'react';
import type { NoteName } from '../theory/notes';
import { frequencyToNote } from '../theory/notes';
import { CHORD_QUALITIES, detectChord, findVoicing, type ChordInstrument, type ChordVoicing } from '../theory/chords';
import { AUDIO_CONFIG_BY_INSTRUMENT } from './noteUtils';
import { detectPolyphonicFrequencies, dbToLinearMagnitudes } from './polyphonicPitch';

// How often to actually re-run the polyphonic spectral analysis. This is
// deliberately not every animation frame -- the analysis is a bit heavier
// than simple peak-picking, and chords don't change fast enough to need it.
const ANALYSIS_INTERVAL_MS = 100;
// How long a rolling window of per-frame note-sets to keep, for majority-vote
// smoothing against a single noisy frame (e.g. right at pluck attack).
const CHORD_WINDOW_MS = 500;
// A note must show up in at least this fraction of frames within the window
// to be trusted as part of the chord (filters one-off spurious frames).
const MIN_FRAME_FRACTION = 0.4;
const CHORD_MIN_UNIQUE_NOTES = 2;

export interface DetectedChord {
  root: NoteName;
  quality: string;
  display: string;
  voicing: ChordVoicing | null;
  timestamp: number;
}

interface FrameEntry {
  notes: Set<NoteName>;
  timestamp: number;
}

/**
 * Real polyphonic chord detection: analyzes the live frequency spectrum for
 * every simultaneously-sounding note (see polyphonicPitch.ts), rather than
 * inferring a chord from a rolling window of single-pitch readings. This
 * lets it correctly tell apart e.g. an A chord from a Gmaj7 even though a
 * monophonic tracker sampling one string at a time could easily confuse the
 * two when strings ring together.
 */
export function useChordDetection(
  getAnalyser: () => AnalyserNode | null,
  isActive: boolean,
  instrument: ChordInstrument = 'ukulele',
): DetectedChord | null {
  const frameHistoryRef = useRef<FrameEntry[]>([]);
  const lastAnalysisRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dbBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const [chord, setChord] = useState<DetectedChord | null>(null);

  const analyze = useCallback(() => {
    const analyser = getAnalyser();
    if (!analyser) {
      rafRef.current = requestAnimationFrame(analyze);
      return;
    }

    const now = performance.now();
    if (now - lastAnalysisRef.current >= ANALYSIS_INTERVAL_MS) {
      lastAnalysisRef.current = now;

      const binCount = analyser.frequencyBinCount;
      if (!dbBufferRef.current || dbBufferRef.current.length !== binCount) {
        dbBufferRef.current = new Float32Array(binCount);
      }
      const dbBuffer = dbBufferRef.current;
      analyser.getFloatFrequencyData(dbBuffer);

      const sampleRate = analyser.context.sampleRate;
      const binHz = sampleRate / analyser.fftSize;
      const { minFrequency, maxFrequency } = AUDIO_CONFIG_BY_INSTRUMENT[instrument];

      const linearMags = dbToLinearMagnitudes(dbBuffer);
      const frequencies = detectPolyphonicFrequencies(linearMags, binHz, {
        minFrequency,
        maxFrequency,
      });

      const frameNotes = new Set<NoteName>();
      for (const freq of frequencies) {
        frameNotes.add(frequencyToNote(freq).note);
      }

      const nowMs = Date.now();
      frameHistoryRef.current.push({ notes: frameNotes, timestamp: nowMs });
      frameHistoryRef.current = frameHistoryRef.current.filter(
        (f) => nowMs - f.timestamp < CHORD_WINDOW_MS,
      );

      const frames = frameHistoryRef.current;
      if (frames.length > 0) {
        const noteCounts = new Map<NoteName, number>();
        for (const frame of frames) {
          for (const note of frame.notes) {
            noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);
          }
        }

        const stableNotes: NoteName[] = [];
        for (const [note, count] of noteCounts.entries()) {
          if (count / frames.length >= MIN_FRAME_FRACTION) stableNotes.push(note);
        }

        if (stableNotes.length >= CHORD_MIN_UNIQUE_NOTES) {
          const detected = detectChord(stableNotes, noteCounts, instrument);
          if (detected) {
            const qualitySuffix = getQualitySuffix(detected.quality);
            const voicing = findVoicing(detected.root, qualitySuffix, instrument);
            setChord({
              root: detected.root,
              quality: detected.quality,
              display: detected.display,
              voicing,
              timestamp: nowMs,
            });
          }
        } else if (stableNotes.length === 0 && frames.length >= 3) {
          // Sustained silence/single-note-only across the window -- clear
          // any stale chord rather than leaving the last guess displayed.
          setChord(null);
        }
      }
    }

    rafRef.current = requestAnimationFrame(analyze);
  }, [getAnalyser, instrument]);

  useEffect(() => {
    if (isActive) {
      frameHistoryRef.current = [];
      lastAnalysisRef.current = 0;
      rafRef.current = requestAnimationFrame(analyze);
    } else {
      setChord(null);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, analyze]);

  return chord;
}

function getQualitySuffix(quality: string): string {
  return CHORD_QUALITIES[quality]?.suffix ?? '';
}
