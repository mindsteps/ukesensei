import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useWasmAudio } from './audio/useWasmAudio';
import { useMetronome } from './audio/useMetronome';
import { useAudioRecorder } from './audio/useAudioRecorder';
import { useExercise } from './exercises/useExercise';
import { useSession, type SessionResult } from './exercises/useSession';
import { uploadSession, triggerAnalysis, type UploadMetadata } from './api/sessionApi';
import { analyzeSession } from './exercises/sessionAnalysis';
import { Layout } from './components/Layout';
import { Fretboard } from './components/Fretboard/Fretboard';
import { AudioStatus } from './components/AudioStatus';
import { NoteDisplay } from './components/NoteDisplay';
import { CentsMeter } from './components/CentsMeter';
import { ExerciseSelector } from './components/ExerciseSelector';
import { ExercisePlayer, getPlayedPositionIds } from './components/ExercisePlayer';
import { FeedbackPanel } from './components/FeedbackPanel';
import { Metronome } from './components/Metronome';
import { SessionLibrary } from './components/SessionLibrary';
import { SessionPlayback } from './components/SessionPlayback';
import { SCALE_DEFINITIONS, SCALE_KEYS } from './theory/scales';
import { CHROMATIC_NOTES, type NoteName } from './theory/notes';
import { useGpuChordDetection } from './audio/useGpuChordDetection';
import { ChordDisplay } from './components/ChordDisplay';
import { FftVisualizer } from './components/FftVisualizer';
import { getVoicingFretPositions } from './theory/chords';

export default function App() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const detectedNote = useAppStore((s) => s.detectedNote);
  const setListening = useAppStore((s) => s.setListening);
  const selectedRoot = useAppStore((s) => s.selectedRoot);
  const setSelectedRoot = useAppStore((s) => s.setSelectedRoot);
  const selectedScale = useAppStore((s) => s.selectedScale);
  const setSelectedScale = useAppStore((s) => s.setSelectedScale);
  const showScale = useAppStore((s) => s.showScale);
  const setShowScale = useAppStore((s) => s.setShowScale);
  const clearExercise = useAppStore((s) => s.clearExercise);
  const tuningKey = useAppStore((s) => s.tuningKey);
  const tuning = useAppStore((s) => s.tuning);
  const setTuning = useAppStore((s) => s.setTuning);
  const tuningAutoDetected = useAppStore((s) => s.tuningAutoDetected);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const fretboardInverted = useAppStore((s) => s.fretboardInverted);
  const setFretboardInverted = useAppStore((s) => s.setFretboardInverted);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const selectedSessionId = useAppStore((s) => s.selectedSessionId);
  const setSelectedSessionId = useAppStore((s) => s.setSelectedSessionId);

  const mic = useWasmAudio();

  const metronome = useMetronome();
  const recorder = useAudioRecorder();
  const { exercise, begin } = useExercise({ getNearestBeatOffset: metronome.getNearestBeatOffset });
  const { chord: detectedChord } = useGpuChordDetection(detectedNote);

  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  const session = useSession({
    bpm: exercise?.bpm ?? 80,
    root: exercise?.root ?? 'C',
    scaleKey: exercise?.scaleKey ?? 'ionian',
    getNearestBeatOffset: metronome.getNearestBeatOffset,
    isActive: !!(exercise && !exercise.isComplete),
  });

  // Record notes into session when exercise is running
  const prevNoteCountRef = useRef(0);
  useEffect(() => {
    if (!exercise || exercise.isComplete) return;
    if (!detectedNote) return;

    const currentNP = exercise.notesPlayed.length;
    if (currentNP > prevNoteCountRef.current) {
      const lastPlayed = exercise.notesPlayed[currentNP - 1];
      const target = exercise.targetPositions[exercise.currentNoteIndex - 1];
      session.recordNote(
        detectedNote,
        target?.note ?? null,
        lastPlayed?.correct ?? false,
      );
      prevNoteCountRef.current = currentNP;
    }
  }, [exercise?.notesPlayed.length]);

  // When exercise completes, end session, stop recording, and upload
  const wasCompleteRef = useRef(false);
  useEffect(() => {
    if (exercise?.isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      if (exercise.bpm) metronome.stop();

      (async () => {
        const audioBlob = recorder.isRecording ? await recorder.stopRecording() : null;
        const result = session.endSession();
        if (result) {
          result.audioBlob = audioBlob;
          setSessionResult(result);

          // Upload to server in background
          const analysisResult = analyzeSession(result);
          const meta: UploadMetadata = {
            scaleKey: result.scaleKey,
            root: result.root,
            bpm: result.bpm,
            tuningKey: tuningKey,
            startedAt: result.startedAt,
            endedAt: result.endedAt,
            pitchAccuracy: analysisResult.pitchAccuracy,
            timingOnTimePercent: analysisResult.timing.onTimePercent,
            overallScore: analysisResult.overallScore,
            notes: result.notes.map((n) => ({
              note: n.note,
              octave: n.octave,
              cents: n.cents,
              frequency: n.frequency,
              timestamp: n.timestamp,
              beatOffset: n.beatOffset,
              expectedNote: n.expectedNote,
              wasCorrect: n.wasCorrect,
            })),
          };

          uploadSession(audioBlob, meta)
            .then(({ id }) => triggerAnalysis(id).catch(() => {}))
            .catch((err) => console.warn('Session upload failed:', err));
        }
      })();
    }
    if (!exercise?.isComplete) {
      wasCompleteRef.current = false;
    }
  }, [exercise?.isComplete]);

  const handleMicToggle = useCallback(async () => {
    if (mic.isActive) {
      mic.stop();
      setListening(false);
    } else {
      await mic.start();
      setListening(true);
    }
  }, [mic, setListening]);

  const lastLoopsRef = useRef(3);
  const handleStartExercise = useCallback(async (bpm: number | null, loops: number = 3) => {
    lastLoopsRef.current = loops;
    setSessionResult(null);
    session.clearSession();
    recorder.clearRecording();
    prevNoteCountRef.current = 0;

    if (!mic.isActive) {
      await mic.start();
      setListening(true);
    }

    if (bpm) {
      metronome.setBpm(bpm);
      metronome.start(true, () => {
        const stream = mic.getStream();
        if (stream) recorder.startRecording(stream);
      });
    } else {
      const stream = mic.getStream();
      if (stream) recorder.startRecording(stream);
    }
    begin(selectedRoot, selectedScale, 'both', bpm, loops);
  }, [begin, selectedRoot, selectedScale, metronome, session, recorder, mic, setListening]);

  const handlePlayAgain = useCallback(() => {
    if (exercise) {
      setSessionResult(null);
      session.clearSession();
      recorder.clearRecording();
      prevNoteCountRef.current = 0;

      if (exercise.bpm) {
        metronome.setBpm(exercise.bpm);
        metronome.start(true, () => {
          const stream = mic.getStream();
          if (stream) recorder.startRecording(stream);
        });
      } else {
        const stream = mic.getStream();
        if (stream) recorder.startRecording(stream);
      }
      begin(exercise.root, exercise.scaleKey, 'both', exercise.bpm, lastLoopsRef.current);
    }
  }, [begin, exercise, metronome, session, recorder, mic]);

  const handleNextExercise = useCallback(() => {
    if (!exercise) return;
    const currentScaleIdx = SCALE_KEYS.indexOf(exercise.scaleKey);
    const currentRootIdx = CHROMATIC_NOTES.indexOf(exercise.root);

    let nextScaleIdx = currentScaleIdx;
    let nextRootIdx = currentRootIdx;

    if (currentScaleIdx < SCALE_KEYS.length - 1) {
      nextScaleIdx = currentScaleIdx + 1;
    } else {
      nextScaleIdx = 0;
      nextRootIdx = (currentRootIdx + 1) % CHROMATIC_NOTES.length;
    }

    setSessionResult(null);
    session.clearSession();
    recorder.clearRecording();
    prevNoteCountRef.current = 0;

    if (exercise.bpm) {
      metronome.setBpm(exercise.bpm);
      metronome.start(true, () => {
        const stream = mic.getStream();
        if (stream) recorder.startRecording(stream);
      });
    } else {
      const stream = mic.getStream();
      if (stream) recorder.startRecording(stream);
    }

    begin(
      CHROMATIC_NOTES[nextRootIdx] as NoteName,
      SCALE_KEYS[nextScaleIdx],
      'both',
      exercise.bpm,
      lastLoopsRef.current,
    );
  }, [begin, exercise, metronome, session, recorder, mic]);

  const handleStopExercise = useCallback(() => {
    metronome.stop();
    if (recorder.isRecording) recorder.stopRecording();
    session.clearSession();
    recorder.clearRecording();
    setSessionResult(null);
    prevNoteCountRef.current = 0;
    clearExercise();
  }, [metronome, session, recorder, clearExercise]);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setView('playback');
  }, [setSelectedSessionId, setView]);

  const handleBackToLibrary = useCallback(() => {
    setSelectedSessionId(null);
    setView('library');
  }, [setSelectedSessionId, setView]);

  const targetPosition = exercise && !exercise.isComplete
    ? exercise.targetPositions[exercise.currentNoteIndex] ?? null
    : null;

  const playedIds = useMemo(
    () => (exercise ? getPlayedPositionIds(exercise) : new Set<string>()),
    [exercise],
  );

  const activeRoot = exercise ? exercise.root : selectedRoot;
  const activeScale = exercise ? exercise.scaleKey : selectedScale;

  const chordPositionIds = useMemo(() => {
    if (!detectedChord?.voicing) return new Set<string>();
    const positions = getVoicingFretPositions(detectedChord.voicing);
    return new Set(positions.map((p) => `s${p.string}f${p.fret}`));
  }, [detectedChord]);

  // Library and playback views render without the fretboard/exercise UI
  if (view === 'library') {
    return (
      <Layout view={view} onViewChange={setView} tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected} theme={theme} onToggleTheme={toggleTheme}>
        <SessionLibrary onSelectSession={handleSelectSession} />
      </Layout>
    );
  }

  if (view === 'playback' && selectedSessionId) {
    return (
      <Layout view={view} onViewChange={setView} tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected} theme={theme} onToggleTheme={toggleTheme}>
        <SessionPlayback sessionId={selectedSessionId} onBack={handleBackToLibrary} />
      </Layout>
    );
  }

  return (
    <Layout
      view={view}
      onViewChange={setView}
      tuningKey={tuningKey}
      onTuningChange={setTuning}
      tuningAutoDetected={tuningAutoDetected}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {/* Top bar: audio controls + note display -- fixed height */}
      <div className="flex items-center justify-between gap-4 mb-6 h-[88px]">
        <AudioStatus
          isListening={mic.isActive}
          error={mic.error}
          audioLevel={audioLevel}
          gain={mic.gain}
          onStart={() => handleMicToggle()}
          onStop={() => handleMicToggle()}
          onGainChange={mic.setGain}
        />
        <div className="flex items-center gap-6">
          <NoteDisplay note={detectedNote} />
          <CentsMeter cents={detectedNote?.cents ?? null} />
        </div>
      </div>

      {/* Live FFT spectrum */}
      <div className="mb-4">
        <FftVisualizer getAnalyser={mic.getAnalyser} isActive={mic.isActive} />
      </div>

      {/* Fretboard + Chord display */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-[var(--c-surface-half)] rounded-2xl p-4 border border-[var(--c-border-half)] min-w-0">
          <div className="flex items-center justify-between h-[20px] mb-1 px-1">
            <div>
              {showScale && !exercise ? (
                <span className="text-xs text-[var(--c-text-muted)]">
                  Showing: <span className="text-[var(--c-accent)] font-medium">
                    {activeRoot} {SCALE_DEFINITIONS[activeScale]?.name}
                  </span>
                </span>
              ) : exercise && !exercise.isComplete ? (
                <span className="text-xs text-[var(--c-text-muted)]">
                  Exercise: <span className="text-amber-300 font-medium">
                    {activeRoot} {SCALE_DEFINITIONS[activeScale]?.name}
                  </span>
                </span>
              ) : null}
            </div>
            <button
              onClick={() => setFretboardInverted(!fretboardInverted)}
              className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition flex items-center gap-1"
              title={fretboardInverted ? 'G string on top' : 'A string on top'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" />
              </svg>
              Flip strings
            </button>
          </div>
          <Fretboard
            tuning={tuning}
            root={activeRoot}
            scaleKey={activeScale}
            showScale={showScale || !!exercise}
            inverted={fretboardInverted}
            detectedNote={exercise ? null : detectedNote}
            targetPosition={targetPosition}
          playedPositionIds={playedIds}
          chordPositionIds={chordPositionIds}
        />
        </div>
        <div className="shrink-0 hidden lg:block">
          <ChordDisplay chord={detectedChord} />
        </div>
      </div>

      {/* Below-fretboard content area -- min height to prevent jumping */}
      <div className="min-h-[200px]">
        {/* Exercise feedback (completed) */}
        {exercise?.isComplete && (
          <FeedbackPanel
            exercise={exercise}
            onPlayAgain={handlePlayAgain}
            onNextExercise={handleNextExercise}
            onBackToExercises={handleStopExercise}
            sessionResult={sessionResult}
          />
        )}

        {/* Exercise in progress */}
        {exercise && !exercise.isComplete && (
          <div className="max-w-md">
            <ExercisePlayer
              exercise={exercise}
              onStop={handleStopExercise}
              countingIn={metronome.countingIn}
              countInBeat={metronome.countInBeat}
              metronome={exercise.bpm ? {
                bpm: metronome.bpm,
                beatsPerMeasure: metronome.beatsPerMeasure,
                isPlaying: metronome.isPlaying,
                currentBeat: metronome.currentBeat,
                onBpmChange: metronome.setBpm,
                onBeatsChange: metronome.setBeatsPerMeasure,
                onStart: metronome.start,
                onStop: metronome.stop,
                onTap: metronome.tap,
              } : undefined}
            />
          </div>
        )}

        {/* Free play controls */}
        {view === 'freeplay' && !exercise && (
          <div className="space-y-6">
            <FreePlayControls
              root={selectedRoot}
              scale={selectedScale}
              showScale={showScale}
              onRootChange={setSelectedRoot}
              onScaleChange={setSelectedScale}
              onToggleScale={setShowScale}
            />
            {/* Standalone metronome in free play */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-3">
                Metronome
              </h2>
              <div className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)] inline-flex">
                <Metronome
                  bpm={metronome.bpm}
                  beatsPerMeasure={metronome.beatsPerMeasure}
                  isPlaying={metronome.isPlaying}
                  currentBeat={metronome.currentBeat}
                  onBpmChange={metronome.setBpm}
                  onBeatsChange={metronome.setBeatsPerMeasure}
                  onStart={metronome.start}
                  onStop={metronome.stop}
                  onTap={metronome.tap}
                />
              </div>
            </div>
          </div>
        )}

        {/* Exercise selector */}
        {view === 'exercises' && !exercise && (
          <ExerciseSelector
            selectedRoot={selectedRoot}
            selectedScale={selectedScale}
            onRootChange={setSelectedRoot}
            onScaleChange={setSelectedScale}
            onStart={handleStartExercise}
            showScale={showScale}
            onToggleScale={setShowScale}
          />
        )}
      </div>
    </Layout>
  );
}

function FreePlayControls({
  root,
  scale,
  showScale,
  onRootChange,
  onScaleChange,
  onToggleScale,
}: {
  root: NoteName;
  scale: string;
  showScale: boolean;
  onRootChange: (r: NoteName) => void;
  onScaleChange: (s: string) => void;
  onToggleScale: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">
        Scale Overlay
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--c-text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={showScale}
            onChange={(e) => onToggleScale(e.target.checked)}
            className="accent-teal-500"
          />
          Show scale
        </label>

        <select
          value={root}
          onChange={(e) => onRootChange(e.target.value as NoteName)}
          aria-label="Root note"
          className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-sm"
        >
          {CHROMATIC_NOTES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select
          value={scale}
          onChange={(e) => onScaleChange(e.target.value)}
          aria-label="Scale type"
          className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-sm"
        >
          {SCALE_KEYS.map((key) => (
            <option key={key} value={key}>{SCALE_DEFINITIONS[key].name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
