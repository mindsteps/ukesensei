import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useWasmAudio } from './audio/useWasmAudio';
import { useMetronome } from './audio/useMetronome';
import { useAudioRecorder } from './audio/useAudioRecorder';
import { useUkeSynth } from './audio/useUkeSynth';
import { useBassSynth } from './audio/useBassSynth';
import { useGuitarSynth } from './audio/useGuitarSynth';
import { useClarinetSynth } from './audio/useClarinetSynth';
import { useVoiceSynth } from './audio/useVoiceSynth';
import { useExercise } from './exercises/useExercise';
import { useSession, type SessionResult } from './exercises/useSession';
import { uploadSession, triggerAnalysis, type UploadMetadata } from './api/sessionApi';
import { analyzeSession } from './exercises/sessionAnalysis';
import { Layout } from './components/Layout';
import { Fretboard } from './components/Fretboard/Fretboard';
import { AudioStatus } from './components/AudioStatus';
import { NoteDisplay } from './components/NoteDisplay';
import { LiveStaff } from './components/LiveStaff';
import { CentsMeter } from './components/CentsMeter';
import { ExerciseSelector } from './components/ExerciseSelector';
import { ExercisePlayer, getPlayedPositionIds } from './components/ExercisePlayer';
import { FeedbackPanel } from './components/FeedbackPanel';
import { Metronome } from './components/Metronome';
import { SessionLibrary } from './components/SessionLibrary';
import { SessionPlayback } from './components/SessionPlayback';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSignIn } from './components/AdminSignIn';
import { LessonPath } from './components/LessonPath';
import { LessonDetail } from './components/LessonDetail';
import { About } from './components/About';
import { Profile } from './components/Profile';
import { SCALE_DEFINITIONS, SCALE_KEYS } from './theory/scales';
import { CHROMATIC_NOTES, type NoteName } from './theory/notes';
import { useChordDetection } from './audio/useChordDetection';
import { ChordDisplay } from './components/ChordDisplay';
import { ClarinetPanel } from './components/ClarinetPanel';
import { VoicePanel } from './components/VoicePanel';
import { HandpanPanel } from './components/HandpanPanel';
import { useHandpanSynth } from './audio/useHandpanSynth';
import { HarmonicaPanel } from './components/HarmonicaPanel';
import { useHarmonicaSynth } from './audio/useHarmonicaSynth';
import { CajonPanel } from './components/CajonPanel';
import { useCajonSynth } from './audio/useCajonSynth';
import { useOnsetDetection } from './audio/useOnsetDetection';
import { useRhythmExercise, type CustomRhythmExerciseOptions } from './exercises/useRhythmExercise';
import { CajonExerciseSelector } from './components/CajonExerciseSelector';
import { RhythmExercisePlayer } from './components/RhythmExercisePlayer';
import { RhythmFeedbackPanel } from './components/RhythmFeedbackPanel';
import { CAJON_PATTERN_LIBRARY, getCajonPattern } from './exercises/cajonPatternLibrary';
import { HIT_LABELS } from './exercises/cajonPatterns';
import { FftVisualizer } from './components/FftVisualizer';
import { SongRecorder } from './components/SongRecorder';
import { getVoicingFretPositions } from './theory/chords';
import { getCurriculumForInstrument } from './lessons/registry';
import type { Lesson, PracticeExercise } from './lessons/types';
import { isRhythmCheckpoint, isRhythmPractice } from './lessons/types';
import type { FretPosition } from './theory/fretboard';
import { syncCompleteLesson, syncResetLessonProgress } from './storage/progressSync';
import { useUrlSync } from './routing/useUrlSync';
import { useAuth } from './auth/AuthProvider';

export default function App() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const { profile } = useAuth();
  const detectedNote = useAppStore((s) => s.detectedNote);
  const detectedHit = useAppStore((s) => s.detectedHit);
  const setListening = useAppStore((s) => s.setListening);
  const selectedRoot = useAppStore((s) => s.selectedRoot);
  const setSelectedRoot = useAppStore((s) => s.setSelectedRoot);
  const selectedScale = useAppStore((s) => s.selectedScale);
  const setSelectedScale = useAppStore((s) => s.setSelectedScale);
  const showScale = useAppStore((s) => s.showScale);
  const setShowScale = useAppStore((s) => s.setShowScale);
  const clearExercise = useAppStore((s) => s.clearExercise);
  const clearRhythmExercise = useAppStore((s) => s.clearRhythmExercise);
  const instrument = useAppStore((s) => s.instrument);
  const setInstrument = useAppStore((s) => s.setInstrument);
  const tuningKey = useAppStore((s) => s.tuningKey);
  const tuning = useAppStore((s) => s.tuning);
  const setTuning = useAppStore((s) => s.setTuning);
  const tuningAutoDetected = useAppStore((s) => s.tuningAutoDetected);
  const handpanLayoutKey = useAppStore((s) => s.handpanLayoutKey);
  const setHandpanLayoutKey = useAppStore((s) => s.setHandpanLayoutKey);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const openTour = useAppStore((s) => s.openTour);
  const fretboardInverted = useAppStore((s) => s.fretboardInverted);
  const setFretboardInverted = useAppStore((s) => s.setFretboardInverted);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const selectedSessionId = useAppStore((s) => s.selectedSessionId);
  const setSelectedSessionId = useAppStore((s) => s.setSelectedSessionId);
  const completedLessons = useAppStore((s) => s.completedLessons);
  const selectedLessonId = useAppStore((s) => s.selectedLessonId);
  const setSelectedLessonId = useAppStore((s) => s.setSelectedLessonId);

  const curriculum = useMemo(() => getCurriculumForInstrument(instrument), [instrument]);

  useUrlSync();

  const mic = useWasmAudio();
  const ukeSynth = useUkeSynth();
  const bassSynth = useBassSynth();
  const guitarSynth = useGuitarSynth();
  const clarinetSynth = useClarinetSynth();
  const voiceSynth = useVoiceSynth();
  const handpanSynth = useHandpanSynth();
  const harmonicaSynth = useHarmonicaSynth();
  const synth = instrument === 'bass' ? bassSynth
    : instrument === 'guitar' ? guitarSynth
    : instrument === 'clarinet' ? clarinetSynth
    : instrument === 'voice' ? voiceSynth
    : instrument === 'handpan' ? handpanSynth
    : instrument === 'harmonica' ? harmonicaSynth
    : ukeSynth;

  const cajonSynth = useCajonSynth();
  useOnsetDetection(mic.getAnalyser, mic.isActive && instrument === 'cajon');

  const suppressDetection = useAppStore((s) => s.suppressDetection);
  // Clicking a note/pad to preview its sound plays it through the speakers,
  // which the mic can pick back up and mistake for the user actually
  // playing it (e.g. falsely advancing an exercise). Muting detection
  // briefly whenever a preview is triggered avoids that.
  const previewNote = useCallback(
    (note: NoteName, octave: number) => {
      suppressDetection();
      synth.playNote(note, octave);
    },
    [suppressDetection, synth],
  );
  const previewHit = useCallback(
    (type: Parameters<typeof cajonSynth.playHit>[0]) => {
      suppressDetection();
      cajonSynth.playHit(type);
    },
    [suppressDetection, cajonSynth],
  );

  const metronome = useMetronome();
  const recorder = useAudioRecorder();
  const { exercise, begin, beginCustom } = useExercise({ getNearestBeatOffset: metronome.getNearestBeatOffset });
  const { rhythmExercise, beginCustom: beginCustomRhythm } = useRhythmExercise();
  // Chord detection/display only makes sense for chorded instruments like the ukulele.
  const detectedChord = useChordDetection(instrument === 'ukulele' ? detectedNote : null);

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

      // Lesson checkpoint gating: mark the lesson complete if the player passed.
      if (exercise.lessonId && exercise.requiredAccuracy != null) {
        const total = exercise.targetPositions.length;
        const correct = exercise.notesPlayed.filter((n) => n.correct).length;
        const acc = total > 0 ? correct / total : 0;
        if (acc >= exercise.requiredAccuracy) {
          syncCompleteLesson(exercise.lessonId);
        }
      }

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

  // When a rhythm exercise completes, stop the metronome and, for lesson
  // checkpoints, mark the lesson complete if the player passed.
  const wasRhythmCompleteRef = useRef(false);
  useEffect(() => {
    if (rhythmExercise?.isComplete && !wasRhythmCompleteRef.current) {
      wasRhythmCompleteRef.current = true;
      metronome.stop();

      if (rhythmExercise.lessonId && rhythmExercise.requiredAccuracy != null) {
        const total = rhythmExercise.targetSteps.length;
        const correct = rhythmExercise.hitsPlayed.filter((h) => h.correct).length;
        const acc = total > 0 ? correct / total : 0;
        if (acc >= rhythmExercise.requiredAccuracy) {
          syncCompleteLesson(rhythmExercise.lessonId);
        }
      }
    }
    if (!rhythmExercise?.isComplete) {
      wasRhythmCompleteRef.current = false;
    }
  }, [rhythmExercise?.isComplete, metronome]);

  const handleMicToggle = useCallback(async () => {
    if (mic.isActive) {
      mic.stop();
      setListening(false);
    } else {
      await mic.start();
      setListening(true);
    }
  }, [mic, setListening]);

  // Shared launcher for custom (lesson) exercises: checkpoints and practice drills.
  const startCustomExercise = useCallback(async (opts: {
    positions: FretPosition[];
    root: NoteName;
    scaleKey: string;
    title: string;
    lessonId?: string;
    requiredAccuracy?: number;
    bpm: number | null;
  }) => {
    clearRhythmExercise();
    setSessionResult(null);
    session.clearSession();
    recorder.clearRecording();
    prevNoteCountRef.current = 0;

    if (!mic.isActive) {
      await mic.start();
      setListening(true);
    }

    if (opts.bpm) {
      metronome.setBpm(opts.bpm);
      metronome.start(true, () => {
        const stream = mic.getStream();
        if (stream) recorder.startRecording(stream);
      });
    } else {
      const stream = mic.getStream();
      if (stream) recorder.startRecording(stream);
    }

    beginCustom(opts);
  }, [beginCustom, metronome, session, recorder, mic, setListening, clearRhythmExercise]);

  // Shared launcher for cajon rhythm exercises: checkpoints, practice drills,
  // and the standalone groove library. Kept separate from startCustomExercise
  // since rhythm exercises don't use the pitch-based session/recording flow.
  const startCustomRhythmExercise = useCallback(async (opts: CustomRhythmExerciseOptions) => {
    clearExercise();
    if (!mic.isActive) {
      await mic.start();
      setListening(true);
    }
    metronome.setBpm(opts.bpm);
    metronome.start(true, () => beginCustomRhythm(opts));
  }, [mic, setListening, metronome, beginCustomRhythm, clearExercise]);

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
    if (!exercise) return;

    // Custom (lesson) exercises replay their exact note sequence.
    if (exercise.title) {
      startCustomExercise({
        positions: exercise.targetPositions,
        root: exercise.root,
        scaleKey: exercise.scaleKey,
        title: exercise.title,
        lessonId: exercise.lessonId,
        requiredAccuracy: exercise.requiredAccuracy,
        bpm: exercise.bpm,
      });
      return;
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
    begin(exercise.root, exercise.scaleKey, 'both', exercise.bpm, lastLoopsRef.current);
  }, [begin, exercise, metronome, session, recorder, mic, startCustomExercise]);

  const handleNextExercise = useCallback(() => {
    if (!exercise) return;

    // Lesson exercises have no "next scale"; return to the lesson instead.
    if (exercise.lessonId) {
      const lessonId = exercise.lessonId;
      setSessionResult(null);
      clearExercise();
      setSelectedLessonId(lessonId);
      setView('lessons');
      return;
    }

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
    const lessonId = exercise?.lessonId;
    metronome.stop();
    if (recorder.isRecording) recorder.stopRecording();
    session.clearSession();
    recorder.clearRecording();
    setSessionResult(null);
    prevNoteCountRef.current = 0;
    clearExercise();
    if (lessonId) {
      setSelectedLessonId(lessonId);
      setView('lessons');
    }
  }, [metronome, session, recorder, clearExercise, exercise, setView]);

  const lastCajonPatternIdRef = useRef(CAJON_PATTERN_LIBRARY[0].id);

  // Launches a standalone groove from the Cajon exercises tab (not a lesson).
  const handleStartCajonExercise = useCallback((patternId: string, bpm: number, loops: number) => {
    const pattern = getCajonPattern(patternId);
    if (!pattern) return;
    lastCajonPatternIdRef.current = patternId;
    startCustomRhythmExercise({
      pattern: pattern.pattern,
      beatsPerLoop: pattern.beatsPerLoop,
      loops,
      bpm,
      title: pattern.title,
    });
  }, [startCustomRhythmExercise]);

  const handlePlayAgainRhythm = useCallback(() => {
    if (!rhythmExercise) return;
    // Replay the exact same flattened hit sequence as a single "loop" --
    // mathematically identical to however many loops/pattern repeats it
    // originally came from, since beatsPerLoop only matters for offsetting
    // additional loops.
    startCustomRhythmExercise({
      pattern: rhythmExercise.targetSteps,
      beatsPerLoop: rhythmExercise.targetSteps.length,
      loops: 1,
      bpm: rhythmExercise.bpm,
      title: rhythmExercise.title ?? 'Rhythm Exercise',
      lessonId: rhythmExercise.lessonId,
      requiredAccuracy: rhythmExercise.requiredAccuracy,
    });
  }, [rhythmExercise, startCustomRhythmExercise]);

  const handleNextRhythmExercise = useCallback(() => {
    if (!rhythmExercise) return;

    // Lesson exercises have no "next groove"; return to the lesson instead.
    if (rhythmExercise.lessonId) {
      const lessonId = rhythmExercise.lessonId;
      clearRhythmExercise();
      setSelectedLessonId(lessonId);
      setView('lessons');
      return;
    }

    const currentIdx = CAJON_PATTERN_LIBRARY.findIndex((p) => p.id === lastCajonPatternIdRef.current);
    const next = CAJON_PATTERN_LIBRARY[(currentIdx + 1) % CAJON_PATTERN_LIBRARY.length];
    handleStartCajonExercise(next.id, next.defaultBpm, next.defaultLoops);
  }, [rhythmExercise, clearRhythmExercise, setSelectedLessonId, setView, handleStartCajonExercise]);

  const handleStopRhythmExercise = useCallback(() => {
    const lessonId = rhythmExercise?.lessonId;
    metronome.stop();
    clearRhythmExercise();
    if (lessonId) {
      setSelectedLessonId(lessonId);
      setView('lessons');
    }
  }, [metronome, clearRhythmExercise, rhythmExercise, setView, setSelectedLessonId]);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setView('playback');
  }, [setSelectedSessionId, setView]);

  const handleBackToLibrary = useCallback(() => {
    setSelectedSessionId(null);
    setView('library');
  }, [setSelectedSessionId, setView]);

  const runCheckpoint = useCallback((lesson: Lesson) => {
    if (!curriculum) return;
    const { checkpoint } = lesson;
    if (isRhythmCheckpoint(checkpoint)) {
      startCustomRhythmExercise({
        pattern: checkpoint.pattern,
        beatsPerLoop: checkpoint.beatsPerLoop,
        loops: checkpoint.loops,
        bpm: checkpoint.bpm,
        title: checkpoint.title,
        lessonId: lesson.id,
        requiredAccuracy: checkpoint.requiredAccuracy,
      });
      return;
    }
    startCustomExercise({
      positions: curriculum.resolvePositions(checkpoint.positions),
      root: checkpoint.root,
      scaleKey: checkpoint.scaleKey,
      title: checkpoint.title,
      lessonId: lesson.id,
      requiredAccuracy: checkpoint.requiredAccuracy,
      bpm: checkpoint.bpm,
    });
  }, [startCustomExercise, startCustomRhythmExercise, curriculum]);

  const handleStartCheckpoint = useCallback(() => {
    const lesson = selectedLessonId && curriculum ? curriculum.getLessonById(selectedLessonId) : undefined;
    if (lesson && curriculum?.isLessonUnlocked(lesson.id, completedLessons)) {
      runCheckpoint(lesson);
    }
  }, [selectedLessonId, runCheckpoint, curriculum, completedLessons]);

  const handleStartPractice = useCallback((practice: PracticeExercise) => {
    if (!curriculum) return;
    if (selectedLessonId && !curriculum.isLessonUnlocked(selectedLessonId, completedLessons)) return;
    if (isRhythmPractice(practice)) {
      startCustomRhythmExercise({
        pattern: practice.pattern,
        beatsPerLoop: practice.beatsPerLoop,
        loops: practice.loops,
        bpm: practice.bpm,
        title: practice.title,
        lessonId: selectedLessonId ?? undefined,
      });
      return;
    }
    startCustomExercise({
      positions: curriculum.resolvePositions(practice.positions),
      root: practice.root,
      scaleKey: practice.scaleKey,
      title: practice.title,
      lessonId: selectedLessonId ?? undefined,
      bpm: practice.bpm,
    });
  }, [startCustomExercise, startCustomRhythmExercise, selectedLessonId, curriculum, completedLessons]);

  const handleCheckpointContinue = useCallback(() => {
    const lessonId = exercise?.lessonId;
    setSessionResult(null);
    clearExercise();
    if (lessonId && curriculum) {
      setSelectedLessonId(curriculum.getNextLessonId(lessonId));
    }
    setView('lessons');
  }, [exercise, clearExercise, setView, curriculum]);

  const handleCheckpointRetry = useCallback(() => {
    const lessonId = exercise?.lessonId;
    const lesson = lessonId && curriculum ? curriculum.getLessonById(lessonId) : undefined;
    if (lesson) runCheckpoint(lesson);
  }, [exercise, runCheckpoint, curriculum]);

  const handleCheckpointExit = useCallback(() => {
    setSessionResult(null);
    clearExercise();
    setView('lessons');
  }, [clearExercise, setView]);

  const handleRhythmCheckpointContinue = useCallback(() => {
    const lessonId = rhythmExercise?.lessonId;
    clearRhythmExercise();
    if (lessonId && curriculum) {
      setSelectedLessonId(curriculum.getNextLessonId(lessonId));
    }
    setView('lessons');
  }, [rhythmExercise, clearRhythmExercise, setView, curriculum, setSelectedLessonId]);

  const handleRhythmCheckpointRetry = useCallback(() => {
    const lessonId = rhythmExercise?.lessonId;
    const lesson = lessonId && curriculum ? curriculum.getLessonById(lessonId) : undefined;
    if (lesson) runCheckpoint(lesson);
  }, [rhythmExercise, runCheckpoint, curriculum]);

  const handleRhythmCheckpointExit = useCallback(() => {
    clearRhythmExercise();
    setView('lessons');
  }, [clearRhythmExercise, setView]);

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

  const checkpointGate = useMemo(() => {
    if (!exercise?.isComplete || !exercise.lessonId || exercise.requiredAccuracy == null) {
      return null;
    }
    const total = exercise.targetPositions.length;
    const correct = exercise.notesPlayed.filter((n) => n.correct).length;
    const accuracy = total > 0 ? correct / total : 0;
    return {
      passed: accuracy >= exercise.requiredAccuracy,
      accuracy,
      requiredAccuracy: exercise.requiredAccuracy,
      isLastLesson: curriculum ? curriculum.getNextLessonId(exercise.lessonId) === null : true,
      onContinue: handleCheckpointContinue,
      onRetry: handleCheckpointRetry,
      onExit: handleCheckpointExit,
    };
  }, [exercise, handleCheckpointContinue, handleCheckpointRetry, handleCheckpointExit, curriculum]);

  const rhythmCheckpointGate = useMemo(() => {
    if (!rhythmExercise?.isComplete || !rhythmExercise.lessonId || rhythmExercise.requiredAccuracy == null) {
      return null;
    }
    const total = rhythmExercise.targetSteps.length;
    const correct = rhythmExercise.hitsPlayed.filter((h) => h.correct).length;
    const accuracy = total > 0 ? correct / total : 0;
    return {
      passed: accuracy >= rhythmExercise.requiredAccuracy,
      accuracy,
      requiredAccuracy: rhythmExercise.requiredAccuracy,
      isLastLesson: curriculum ? curriculum.getNextLessonId(rhythmExercise.lessonId) === null : true,
      onContinue: handleRhythmCheckpointContinue,
      onRetry: handleRhythmCheckpointRetry,
      onExit: handleRhythmCheckpointExit,
    };
  }, [rhythmExercise, handleRhythmCheckpointContinue, handleRhythmCheckpointRetry, handleRhythmCheckpointExit, curriculum]);

  // Library and playback views render without the fretboard/exercise UI
  if (view === 'library') {
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        <SessionLibrary onSelectSession={handleSelectSession} />
      </Layout>
    );
  }

  if (view === 'playback' && selectedSessionId) {
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        <SessionPlayback sessionId={selectedSessionId} onBack={handleBackToLibrary} />
      </Layout>
    );
  }

  if (view === 'about') {
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        <About />
      </Layout>
    );
  }

  if (view === 'profile') {
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        <Profile />
      </Layout>
    );
  }

  if (view === 'admin') {
    if (!profile?.is_admin) {
      return (
        <Layout view="freeplay" onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
          tuningKey={tuningKey} onTuningChange={setTuning}
          tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
          lessonsAvailable={!!curriculum}
          exercisesAvailable={instrument !== 'clarinet'}>
          <AdminSignIn />
        </Layout>
      );
    }
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        <AdminDashboard />
      </Layout>
    );
  }

  if (view === 'lessons' && curriculum) {
    const lesson = selectedLessonId ? curriculum.getLessonById(selectedLessonId) : undefined;
    return (
      <Layout view={view} onViewChange={setView} instrument={instrument} onInstrumentChange={setInstrument}
        tuningKey={tuningKey} onTuningChange={setTuning}
        tuningAutoDetected={tuningAutoDetected}
        handpanLayoutKey={handpanLayoutKey} onHandpanLayoutChange={setHandpanLayoutKey}
        theme={theme} onToggleTheme={toggleTheme} onOpenTour={openTour}
        lessonsAvailable={!!curriculum}
        exercisesAvailable={instrument !== 'clarinet'}>
        {lesson ? (
          <LessonDetail
            curriculum={curriculum}
            lesson={lesson}
            completed={completedLessons.includes(lesson.id)}
            unlocked={curriculum.isLessonUnlocked(lesson.id, completedLessons)}
            onStartCheckpoint={handleStartCheckpoint}
            onStartPractice={handleStartPractice}
            onBack={() => setSelectedLessonId(null)}
          />
        ) : (
          <LessonPath
            curriculum={curriculum}
            completedLessons={completedLessons}
            onSelectLesson={setSelectedLessonId}
            onReset={syncResetLessonProgress}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout
      view={view}
      onViewChange={setView}
      instrument={instrument}
      onInstrumentChange={setInstrument}
      tuningKey={tuningKey}
      onTuningChange={setTuning}
      tuningAutoDetected={tuningAutoDetected}
      handpanLayoutKey={handpanLayoutKey}
      onHandpanLayoutChange={setHandpanLayoutKey}
      theme={theme}
      onToggleTheme={toggleTheme} onOpenTour={openTour}
      lessonsAvailable={!!curriculum}
      exercisesAvailable={instrument !== 'clarinet'}
    >
      {/* Priority 1: FFT spectrum — always-live real-time feedback, shown first */}
      <div className="mb-3 sm:mb-4">
        <FftVisualizer getAnalyser={mic.getAnalyser} isActive={mic.isActive} />
      </div>

      {/* Priority 2: pitch/hit feedback — always visible, centered on small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-center gap-3 sm:gap-5 order-1 sm:order-2">
          {instrument === 'cajon' ? (
            <div className="text-sm text-[var(--c-text-muted)]">
              {detectedHit ? (
                <>Detected hit: <span className="text-[var(--c-accent)] font-semibold">{HIT_LABELS[detectedHit.type]}</span></>
              ) : (
                'No hit detected yet'
              )}
            </div>
          ) : (
            <>
              <NoteDisplay note={detectedNote} />
              <LiveStaff note={detectedNote} />
              <CentsMeter cents={detectedNote?.cents ?? null} />
            </>
          )}
        </div>
        <div className="flex items-center justify-center sm:justify-start order-2 sm:order-1">
          <AudioStatus
            isListening={mic.isActive}
            error={mic.error}
            audioLevel={audioLevel}
            gain={mic.gain}
            eq={mic.eq}
            onStart={() => handleMicToggle()}
            onStop={() => handleMicToggle()}
            onGainChange={mic.setGain}
            onEqChange={mic.setEqBand}
            getEqFrequencyResponse={mic.getEqFrequencyResponse}
          />
        </div>
      </div>

      {/* Priority 3: fretboard/fingering — primary practice surface */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6">
        {instrument === 'clarinet' ? (
          <div className="mx-auto sm:mx-0">
            <ClarinetPanel detectedNote={detectedNote} onPlayNote={previewNote} />
          </div>
        ) : instrument === 'voice' ? (
          <div className="mx-auto sm:mx-0">
            <VoicePanel detectedNote={detectedNote} onPlayNote={previewNote} />
          </div>
        ) : instrument === 'handpan' ? (
          <div className="mx-auto sm:mx-0">
            <HandpanPanel layoutKey={handpanLayoutKey} detectedNote={detectedNote} onPlayNote={previewNote} />
          </div>
        ) : instrument === 'cajon' ? (
          <div className="mx-auto sm:mx-0">
            <CajonPanel detectedHit={detectedHit} onPlayHit={previewHit} />
          </div>
        ) : instrument === 'harmonica' ? (
          <div className="mx-auto sm:mx-0">
            <HarmonicaPanel detectedNote={detectedNote} onPlayNote={previewNote} />
          </div>
        ) : (
          <>
            <div className="flex-1 bg-[var(--c-surface-half)] rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-[var(--c-border-half)] min-w-0 order-1">
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
                  title={
                    fretboardInverted
                      ? `${tuning.strings[0]?.note} string on top`
                      : `${tuning.strings[tuning.strings.length - 1]?.note} string on top`
                  }
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
                onNoteClick={previewNote}
              />
            </div>
            {instrument === 'ukulele' && (
              <>
                <div className="shrink-0 hidden lg:block order-2">
                  <ChordDisplay chord={detectedChord} />
                </div>
                <div className="lg:hidden order-2">
                  <ChordDisplay chord={detectedChord} compact />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Priority 4: exercise / free-play controls */}
      <div className="min-h-[120px] sm:min-h-[200px]">
        {/* Exercise feedback (completed) */}
        {exercise?.isComplete && (
          <FeedbackPanel
            exercise={exercise}
            onPlayAgain={handlePlayAgain}
            onNextExercise={handleNextExercise}
            onBackToExercises={handleStopExercise}
            sessionResult={sessionResult}
            checkpoint={checkpointGate}
            lessonContext={!!exercise.lessonId}
          />
        )}

        {/* Exercise in progress */}
        {exercise && !exercise.isComplete && (
          <div className="max-w-md">
            <ExercisePlayer
              exercise={exercise}
              instrument={instrument}
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

        {/* Rhythm exercise feedback (completed) */}
        {rhythmExercise?.isComplete && (
          <RhythmFeedbackPanel
            exercise={rhythmExercise}
            onPlayAgain={handlePlayAgainRhythm}
            onNextExercise={handleNextRhythmExercise}
            onBackToExercises={handleStopRhythmExercise}
            checkpoint={rhythmCheckpointGate}
            lessonContext={!!rhythmExercise.lessonId}
          />
        )}

        {/* Rhythm exercise in progress */}
        {rhythmExercise && !rhythmExercise.isComplete && (
          <div className="max-w-md">
            <RhythmExercisePlayer
              exercise={rhythmExercise}
              onStop={handleStopRhythmExercise}
              countingIn={metronome.countingIn}
              countInBeat={metronome.countInBeat}
              metronome={{
                bpm: metronome.bpm,
                beatsPerMeasure: metronome.beatsPerMeasure,
                isPlaying: metronome.isPlaying,
                currentBeat: metronome.currentBeat,
                onBpmChange: metronome.setBpm,
                onBeatsChange: metronome.setBeatsPerMeasure,
                onStart: metronome.start,
                onStop: metronome.stop,
                onTap: metronome.tap,
              }}
            />
          </div>
        )}

        {/* Free play controls */}
        {view === 'freeplay' && !exercise && !rhythmExercise && (
          <div className="space-y-6">
            {instrument !== 'clarinet' && instrument !== 'voice' && instrument !== 'handpan' && instrument !== 'cajon' && instrument !== 'harmonica' && (
              <FreePlayControls
                root={selectedRoot}
                scale={selectedScale}
                showScale={showScale}
                onRootChange={setSelectedRoot}
                onScaleChange={setSelectedScale}
                onToggleScale={setShowScale}
              />
            )}
            <div>
              <h2 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-3">
                Record Song
              </h2>
              <SongRecorder
                isListening={mic.isActive}
                onEnsureListening={handleMicToggle}
                getStream={mic.getStream}
                tuningKey={tuningKey}
                instrument={instrument}
              />
            </div>
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
        {view === 'exercises' && !exercise && !rhythmExercise && instrument === 'clarinet' && (
          <p className="text-sm text-[var(--c-text-muted)]">
            Exercises aren&apos;t available for clarinet yet — try Free Play to practice fingerings.
          </p>
        )}
        {view === 'exercises' && !exercise && !rhythmExercise && instrument === 'cajon' && (
          <CajonExerciseSelector onStart={handleStartCajonExercise} />
        )}
        {view === 'exercises' && !exercise && !rhythmExercise && instrument !== 'clarinet' && instrument !== 'cajon' && (
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
