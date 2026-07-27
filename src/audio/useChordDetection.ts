import { useRef, useEffect, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';
import { CHORD_QUALITIES, detectChord, findVoicing, type ChordInstrument, type ChordVoicing } from '../theory/chords';

const CHORD_WINDOW_MS = 800;
const CHORD_MIN_UNIQUE_NOTES = 3;
const CHORD_UPDATE_INTERVAL_MS = 150;
const DOMINANT_NOTE_THRESHOLD = 0.75;
// A note must appear at least this often to be considered real (filters harmonics / noise)
const MIN_NOTE_FRACTION = 0.12;
const MIN_NOTE_COUNT = 2;
// Chord inference accumulates single-pitch readings over a window and infers
// a chord from the resulting note set -- so it's far more sensitive to noisy/
// ambiguous readings than just displaying "the current note" is. The
// single-note display threshold was deliberately lowered (see noteUtils.ts)
// to catch natural, breathy/vibrato-heavy tones, but feeding those same
// low-confidence readings into the chord window is what let stray harmonics
// and inter-string transients get miscounted as real notes, producing wrong
// chord guesses (e.g. an A chord read as Gmaj7). Require a higher bar here.
const CHORD_MIN_CLARITY = 0.8;

export interface DetectedChord {
  root: NoteName;
  quality: string;
  display: string;
  voicing: ChordVoicing | null;
  timestamp: number;
}

export function useChordDetection(
  detectedNote: DetectedNote | null,
  instrument: ChordInstrument = 'ukulele',
): DetectedChord | null {
  const noteHistoryRef = useRef<{ note: NoteName; timestamp: number }[]>([]);
  const lastUpdateRef = useRef(0);
  const [chord, setChord] = useState<DetectedChord | null>(null);

  useEffect(() => {
    if (!detectedNote) return;
    // Keep noisy/ambiguous single-pitch readings out of the chord window
    // entirely (they're fine for showing "current note", but not for
    // inferring a chord from an accumulated note set).
    if (detectedNote.clarity < CHORD_MIN_CLARITY) return;

    const now = Date.now();

    noteHistoryRef.current.push({
      note: detectedNote.note,
      timestamp: now,
    });

    noteHistoryRef.current = noteHistoryRef.current.filter(
      (n) => now - n.timestamp < CHORD_WINDOW_MS,
    );

    if (now - lastUpdateRef.current < CHORD_UPDATE_INTERVAL_MS) return;
    lastUpdateRef.current = now;

    const recentNotes = noteHistoryRef.current;
    const uniqueNotes = [...new Set(recentNotes.map((n) => n.note))];

    if (uniqueNotes.length < CHORD_MIN_UNIQUE_NOTES) return;

    // Build note frequency counts for weighting
    const noteCounts = new Map<NoteName, number>();
    for (const entry of recentNotes) {
      noteCounts.set(entry.note, (noteCounts.get(entry.note) ?? 0) + 1);
    }

    // If one note dominates the window, it's a single string ringing -- not a chord
    const totalDetections = recentNotes.length;
    const maxCount = Math.max(...noteCounts.values());
    if (maxCount / totalDetections >= DOMINANT_NOTE_THRESHOLD) return;

    // Filter out notes that appeared too rarely — they are likely harmonics,
    // pitch-detection glitches, or bleed from a previous chord
    const filteredNotes: NoteName[] = [];
    for (const [note, count] of noteCounts.entries()) {
      if (count >= MIN_NOTE_COUNT && count / totalDetections >= MIN_NOTE_FRACTION) {
        filteredNotes.push(note);
      }
    }
    if (filteredNotes.length < CHORD_MIN_UNIQUE_NOTES) return;

    const detected = detectChord(filteredNotes, noteCounts, instrument);
    if (detected) {
      const qualitySuffix = getQualitySuffix(detected.quality);
      const voicing = findVoicing(detected.root, qualitySuffix, instrument);
      setChord({
        root: detected.root,
        quality: detected.quality,
        display: detected.display,
        voicing,
        timestamp: now,
      });
    }
  }, [detectedNote, instrument]);

  return chord;
}

function getQualitySuffix(quality: string): string {
  return CHORD_QUALITIES[quality]?.suffix ?? '';
}
