import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  getSession,
  getAnalysis,
  triggerAnalysis,
  resolveAudioUrl,
  downloadSessionAudio,
  type SessionDetail,
  type AnalysisResult,
} from '../api/sessionApi';
import { AudioWaveform } from './AudioWaveform';
import { StringWaveform } from './StringWaveform';
import { PlaybackFftVisualizer } from './PlaybackFftVisualizer';
import { DetectedNotesList } from './DetectedNotesList';
import { ShareModal } from './ShareModal';
import { Fretboard } from './Fretboard/Fretboard';
import {
  findActiveMelodyNoteIndex,
  sessionNotesToMelody,
} from '../theory/staff';
import { SCALE_DEFINITIONS } from '../theory/scales';
import { findTuningByKey, instrumentFromTuningKey } from '../theory/fretboard';
import { isCloudSessionId } from '../storage/cloudSessionStore';
import { useAuth } from '../auth/AuthProvider';
import { useAudioClock } from '../audio/useAudioClock';
import { useInstrumentSynth, isPitchedSynth } from '../audio/useInstrumentSynth';

interface SessionPlaybackProps {
  sessionId: string;
  onBack: () => void;
}

export function SessionPlayback({ sessionId, onBack }: SessionPlaybackProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const {
    audioRef, currentTime, duration, isPlaying, toggle: handlePlayPause, seek: seekTo,
    handleLoadedMetadata, handleEnded,
  } = useAudioClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformWidth, setWaveformWidth] = useState(600);

  useEffect(() => {
    let cancelled = false;
    setSelectedNoteIndex(null);
    (async () => {
      try {
        setLoading(true);
        const sess = await getSession(sessionId);
        if (cancelled) return;
        setSession(sess);

        if (sess.analysisStatus === 'complete') {
          try {
            const a = await getAnalysis(sessionId);
            if (!cancelled) setAnalysis(a);
          } catch { /* analysis may not exist yet */ }
        }
      } catch {
        if (!cancelled) setError('Failed to load session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (!session?.hasAudio) {
      setResolvedAudioUrl(null);
      return;
    }
    let cancelled = false;
    resolveAudioUrl(sessionId).then((url) => {
      if (!cancelled) setResolvedAudioUrl(url);
    });
    return () => { cancelled = true; };
  }, [sessionId, session?.hasAudio]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWaveformWidth(Math.floor(entry.contentRect.width));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!session || downloading) return;
    setDownloading(true);
    try {
      await downloadSessionAudio(session);
    } catch {
      setError('Could not download the recording. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [session, downloading]);

  const handleRunAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      await triggerAnalysis(sessionId);
      const a = await getAnalysis(sessionId);
      setAnalysis(a);
    } catch {
      setError('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [sessionId]);

  const handleSeekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(fraction * duration);
  }, [duration, seekTo]);

  const melodyNotes = useMemo(
    () => session ? sessionNotesToMelody(session.notes, session.startedAt) : [],
    [session],
  );

  // Hooks must run unconditionally, before the loading/error early returns
  // below, so fall back to a default instrument until the session loads.
  const synth = useInstrumentSynth(session ? instrumentFromTuningKey(session.tuningKey) : 'ukulele');

  const handleNoteClick = useCallback((index: number) => {
    setSelectedNoteIndex(index);
    const note = melodyNotes[index];
    if (note && isPitchedSynth(synth)) synth.playNote(note.note, note.octave);
  }, [melodyNotes, synth]);

  if (loading) {
    return <div className="text-center py-12 text-(--c-text-muted)">Loading session...</div>;
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-3">{error ?? 'Session not found'}</p>
        <button onClick={onBack} className="text-sm text-(--c-text-muted) hover:text-(--c-text-strong)">
          Back to library
        </button>
      </div>
    );
  }

  const scaleLabel = session.scaleKey === 'melody' ? 'Song' : (SCALE_DEFINITIONS[session.scaleKey]?.name ?? session.scaleKey);
  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const audioUrl = resolvedAudioUrl;
  const pitchColor = session.pitchAccuracy >= 80 ? '#34d399' : session.pitchAccuracy >= 50 ? '#fbbf24' : '#f87171';
  const timingColor = session.timingOnTimePercent >= 75 ? '#34d399' : session.timingOnTimePercent >= 40 ? '#fbbf24' : '#f87171';
  const scoreColor = session.overallScore >= 70 ? '#34d399' : session.overallScore >= 40 ? '#fbbf24' : '#f87171';
  const playingNoteIndex = audioUrl ? findActiveMelodyNoteIndex(melodyNotes, currentTime * 1000) : -1;
  // Whichever transport is actively moving wins; otherwise show whichever
  // note was last clicked in the list, if any.
  const displayNoteIndex = isPlaying ? playingNoteIndex : (selectedNoteIndex ?? playingNoteIndex);
  const displayedMelodyNote = displayNoteIndex >= 0 ? melodyNotes[displayNoteIndex] : null;
  const tuning = findTuningByKey(session.tuningKey);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          title="Back to library"
          className="text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition p-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[var(--c-text-strong)] leading-tight">
            {session.scaleKey === 'melody' ? 'Song recording' : `${session.root} ${scaleLabel}`}
          </h2>
          <p className="text-[10px] text-[var(--c-text-muted)] leading-tight">
            {new Date(session.createdAt).toLocaleString()} &middot; {session.bpm} BPM &middot; {Math.round(session.durationSec)}s
          </p>
        </div>

        {/* Inline stats */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-center">
            <div className="text-sm font-bold leading-none" style={{ color: pitchColor }}>{session.pitchAccuracy}%</div>
            <div className="text-[9px] text-[var(--c-text-muted)] uppercase leading-tight">Pitch</div>
          </div>
          <div className="w-px h-5 bg-[var(--c-border)]" />
          <div className="text-center">
            <div className="text-sm font-bold leading-none" style={{ color: timingColor }}>{session.timingOnTimePercent}%</div>
            <div className="text-[9px] text-[var(--c-text-muted)] uppercase leading-tight">Timing</div>
          </div>
          <div className="w-px h-5 bg-[var(--c-border)]" />
          <div className="text-center">
            <div className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{session.overallScore}</div>
            <div className="text-[9px] text-[var(--c-text-muted)] uppercase leading-tight">Score</div>
          </div>
        </div>

        {user && isCloudSessionId(session.id) && (
          <button
            onClick={() => setShareModalOpen(true)}
            title="Share this recording"
            className="text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition p-1 shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 10.51 15.42 6.5M8.59 13.49l6.83 4.01" />
            </svg>
          </button>
        )}
      </div>

      {shareModalOpen && user && (
        <ShareModal
          userId={user.id}
          sessionId={session.id}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* Audio player + visualizations */}
      {audioUrl && (
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-hidden">
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          {/* Transport bar */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--c-border)]">
            <button
              onClick={handlePlayPause}
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
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Download recording"
              className="text-[var(--c-text-muted)] hover:text-teal-400 transition p-1 shrink-0 disabled:opacity-50"
            >
              {downloading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              )}
            </button>
          </div>

          {/* Visualizations stack */}
          <div className="px-3 py-2 space-y-2">
            {/* FFT + Waveform side-by-side on wider screens, stacked on narrow */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-2">
              <div>
                <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-1 px-0.5">
                  FFT Spectrum
                </div>
                <PlaybackFftVisualizer
                  audioUrl={audioUrl}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  height={80}
                />
              </div>

              <div>
                <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-1 px-0.5">
                  Waveform
                </div>
                <AudioWaveform
                  audioUrl={audioUrl}
                  currentTime={currentTime}
                  duration={duration}
                  width={waveformWidth > 800 ? Math.floor((waveformWidth - 30) / 2) : waveformWidth - 24}
                  height={80}
                  onSeek={seekTo}
                />
              </div>
            </div>

            {/* Per-string energy — full width */}
            {analysis && (
              <div>
                <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-1 px-0.5">
                  Per-String Energy
                </div>
                <StringWaveform
                  frames={analysis.frames}
                  durationSec={analysis.durationSec}
                  currentTime={currentTime}
                  width={waveformWidth - 24}
                  height={130}
                  stringNames={findTuningByKey(session.tuningKey)?.strings.map((s) => s.note)}
                />
              </div>
            )}

            {!analysis && session.analysisStatus !== 'complete' && (
              <div className="flex items-center gap-3 py-1">
                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="px-3 py-1 bg-teal-600/20 text-teal-400 rounded-lg text-xs font-medium hover:bg-teal-600/30 transition disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Run String Analysis'}
                </button>
                <span className="text-[10px] text-[var(--c-text-muted)]">
                  Separate audio into per-string waveforms
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!audioUrl && (
        <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)] text-center">
          <p className="text-[var(--c-text-muted)] text-sm">No audio recording for this session</p>
        </div>
      )}

      {/* Detected notes */}
      {melodyNotes.length > 0 && (
        <DetectedNotesList
          notes={melodyNotes}
          title="Detected notes"
          activeNoteIndex={displayNoteIndex}
          onNoteClick={handleNoteClick}
        />
      )}

      {/* Fretboard, highlighting whichever note is playing (or was clicked) */}
      {(audioUrl || selectedNoteIndex !== null) && tuning && (
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3">
          <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-1 px-0.5">
            Fretboard
          </div>
          <Fretboard
            tuning={tuning}
            root={displayedMelodyNote?.note ?? 'C'}
            scaleKey="ionian"
            showScale={false}
            detectedNote={displayedMelodyNote}
          />
        </div>
      )}

      {/* Note timeline */}
      {session.notes.length > 0 && (
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-hidden">
          <div className="text-[10px] text-[var(--c-text-muted)] font-medium uppercase tracking-wider px-3 py-1.5 border-b border-[var(--c-border)]">
            Notes Played ({session.notes.length})
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {session.notes.map((n, i) => {
              const relTime = ((n.timestamp - session.startedAt) / 1000).toFixed(1);
              const isActive = audioUrl && duration > 0
                && Math.abs(currentTime - (n.timestamp - session.startedAt) / 1000) < 0.3;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs px-3 py-1 transition-colors ${isActive ? 'bg-teal-500/10' : ''}`}
                  onClick={() => seekTo((n.timestamp - session.startedAt) / 1000)}
                  style={{ cursor: audioUrl ? 'pointer' : 'default' }}
                >
                  <span className="w-[36px] text-right font-mono text-[var(--c-text-muted)] tabular-nums">{relTime}s</span>
                  <span className={`font-bold w-[20px] ${n.wasCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {n.note}
                  </span>
                  <span className="text-[var(--c-text-muted)] w-[32px] text-right tabular-nums">
                    {n.cents > 0 ? '+' : ''}{n.cents}{'\u00A2'}
                  </span>
                  {n.beatOffset !== null && n.beatOffset !== 0 && (
                    <span className="text-[var(--c-text-muted)] w-[44px] text-right tabular-nums">
                      {n.beatOffset > 0 ? '+' : ''}{n.beatOffset}ms
                    </span>
                  )}
                  {n.expectedNote && n.expectedNote !== n.note && (
                    <span className="text-red-400/60 text-[10px]">exp: {n.expectedNote}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
