import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Instrument, TuningKey } from '../store/useAppStore';
import { findActiveMelodyNoteIndex, quantizeMelody, type MelodyNote } from '../theory/staff';
import { findTuningByKey, isStringInstrument } from '../theory/fretboard';
import { inferSongChords } from '../theory/harmony';
import { useAudioRecorder } from '../audio/useAudioRecorder';
import { useAudioClock } from '../audio/useAudioClock';
import { transcribeAudioBlob } from '../audio/transcribeAudio';
import { SheetMusicScore } from './SheetMusicScore';
import { Fretboard } from './Fretboard/Fretboard';
import { uploadSession } from '../api/sessionApi';

interface SongRecorderProps {
  isListening: boolean;
  onEnsureListening: () => Promise<void>;
  getStream: () => MediaStream | null;
  tuningKey: TuningKey;
  instrument: Instrument;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, '0')}`;
}

function melodyToSessionNotes(
  notes: MelodyNote[],
  sessionStart: number,
): Array<{
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  timestamp: number;
  beatOffset: number;
  expectedNote: null;
  wasCorrect: true;
}> {
  return notes.map((n) => ({
    note: n.note,
    octave: n.octave,
    cents: n.cents,
    frequency: 0,
    timestamp: sessionStart + n.startMs,
    beatOffset: 0,
    expectedNote: null,
    wasCorrect: true as const,
  }));
}

export function SongRecorder({
  isListening,
  onEnsureListening,
  getStream,
  tuningKey,
  instrument,
}: SongRecorderProps) {
  const audio = useAudioRecorder();
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finishedNotes, setFinishedNotes] = useState<MelodyNote[] | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sessionTimes, setSessionTimes] = useState<{ start: number; end: number } | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const {
    audioRef, currentTime, duration, isPlaying, toggle: togglePlayback, seek: seekTo,
    reset: resetClock, handleLoadedMetadata, handleEnded,
  } = useAudioClock();

  // Recording always captures the full take first; pitch/note detection only
  // ever runs afterward on the finished audio, so a slow or missed live
  // detection can never cause part of the performance to go unrecorded.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  const handleStart = useCallback(async () => {
    setFinishedNotes(null);
    setSaveMessage(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audio.clearRecording();
    resetClock();
    setElapsedMs(0);

    if (!isListening) await onEnsureListening();

    const stream = getStream();
    if (!stream) return;

    const startedAt = Date.now();
    startedAtRef.current = startedAt;
    setSessionTimes({ start: startedAt, end: startedAt });
    audio.startRecording(stream);
    setRecording(true);
  }, [audio, audioUrl, resetClock, getStream, isListening, onEnsureListening]);

  const handleStop = useCallback(async () => {
    setRecording(false);
    startedAtRef.current = null;
    const blob = await audio.stopRecording();
    const endedAt = Date.now();
    setSessionTimes((prev) => (prev ? { ...prev, end: endedAt } : null));

    if (blob.size === 0) {
      setFinishedNotes([]);
      return;
    }

    setRecordedBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));

    setTranscribing(true);
    let notes: MelodyNote[] = [];
    try {
      notes = await transcribeAudioBlob(blob, instrument, tuningKey);
    } catch {
      // The recording itself is still saved/playable even if detection fails.
    }
    setFinishedNotes(notes);
    setTranscribing(false);
  }, [audio, instrument, tuningKey]);

  const handleDiscard = useCallback(() => {
    setRecording(false);
    audio.clearRecording();
    resetClock();
    setFinishedNotes(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSaveMessage(null);
    setSessionTimes(null);
  }, [audio, audioUrl, resetClock]);

  // Computed once here (rather than left for SheetMusicScore to infer on its
  // own) so the exact same chords shown in the preview are what gets saved.
  const { measures } = useMemo(() => quantizeMelody(finishedNotes ?? []), [finishedNotes]);
  const chordLabels = useMemo(
    () => inferSongChords(finishedNotes ?? [], measures),
    [finishedNotes, measures],
  );

  const handleSave = useCallback(async () => {
    if (!sessionTimes) return;
    const notes = finishedNotes ?? [];
    setSaving(true);
    setSaveMessage(null);

    try {
      const { local } = await uploadSession(recordedBlob, {
        scaleKey: 'melody',
        root: notes[0]?.note ?? 'C',
        bpm: 0,
        tuningKey,
        startedAt: sessionTimes.start,
        endedAt: sessionTimes.end,
        pitchAccuracy: 1,
        timingOnTimePercent: 1,
        overallScore: 1,
        notes: melodyToSessionNotes(notes, sessionTimes.start),
        chords: chordLabels,
      });
      setSaveMessage(local ? 'Saved to library (on this device)' : 'Saved to your library');
    } catch {
      setSaveMessage('Save failed');
    } finally {
      setSaving(false);
    }
  }, [finishedNotes, recordedBlob, sessionTimes, tuningKey, chordLabels]);

  const handleSeekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(fraction * duration);
  }, [duration, seekTo]);

  const activeNoteIndex = audioUrl
    ? findActiveMelodyNoteIndex(finishedNotes ?? [], currentTime * 1000)
    : -1;
  const activeMelodyNote = activeNoteIndex >= 0 ? (finishedNotes ?? [])[activeNoteIndex] : null;
  const tuning = isStringInstrument(instrument) ? findTuningByKey(tuningKey) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {!recording && !finishedNotes && !transcribing && (
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
          >
            Record Song
          </button>
        )}

        {recording && (
          <>
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-surface-hover)] transition"
            >
              Stop
            </button>
            <span className="flex items-center gap-2 text-sm text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Recording {formatDuration(elapsedMs)}
            </span>
          </>
        )}

        {transcribing && (
          <span className="text-sm text-[var(--c-text-muted)]">
            Detecting notes…
          </span>
        )}

        {finishedNotes && !recording && !transcribing && (
          <>
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
            >
              Record Again
            </button>
            <button
              onClick={handleDiscard}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save to Library'}
            </button>
            <span className="text-xs text-[var(--c-text-muted)]">
              {finishedNotes.length} notes detected
            </span>
          </>
        )}
      </div>

      {saveMessage && (
        <p className="text-xs text-[var(--c-text-muted)]">{saveMessage}</p>
      )}

      {audioUrl && !recording && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] max-w-md">
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
          <button
            onClick={togglePlayback}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white transition shrink-0"
          >
            {isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="3,0 14,7 3,14" />
              </svg>
            )}
          </button>
          <div className="flex-1 cursor-pointer" onClick={handleSeekBar}>
            <div className="h-1.5 bg-[var(--c-bg)] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-[width] duration-75"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--c-text-muted)] tabular-nums shrink-0">
            {formatDuration(currentTime * 1000)} / {formatDuration(duration * 1000)}
          </span>
        </div>
      )}

      {!recording && (finishedNotes || transcribing) && (
        <SheetMusicScore
          notes={finishedNotes ?? []}
          title={transcribing ? 'Detecting notes…' : 'Sheet music'}
          activeNoteIndex={activeNoteIndex}
          chords={chordLabels}
        />
      )}

      {!recording && tuning && finishedNotes && finishedNotes.length > 0 && (
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3">
          <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-1 px-0.5">
            Fretboard
          </div>
          <Fretboard
            tuning={tuning}
            root={activeMelodyNote?.note ?? 'C'}
            scaleKey="ionian"
            showScale={false}
            detectedNote={activeMelodyNote}
          />
        </div>
      )}
    </div>
  );
}
