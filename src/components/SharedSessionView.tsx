import { useEffect, useMemo, useRef, useState } from 'react';
import { getSharedSession, getSharedAudioUrl, type SharedSessionResult } from '../storage/shareStore';
import { SCALE_DEFINITIONS } from '../theory/scales';
import { sessionNotesToMelody } from '../theory/staff';
import { instrumentFromTuningKey } from '../theory/fretboard';
import { Logo } from './Logo';
import { SheetMusicView } from './SheetMusicView';

/**
 * Fully standalone page for `/s/:token` — rendered outside AuthGate/App, so
 * a recipient with no account (and no onboarding) can view a shared
 * recording. Read-only: no editing, no library, no nav.
 */
export function SharedSessionView({ token }: { token: string }) {
  const [result, setResult] = useState<SharedSessionResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const melodyNotes = useMemo(
    () => (result ? sessionNotesToMelody(result.session.notes, result.session.startedAt) : []),
    [result],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getSharedSession(token);
        if (cancelled) return;
        setResult(r);
        if (r.audioPath) {
          const url = await getSharedAudioUrl(token, r.audioPath, r.audioProvider);
          if (!cancelled) setAudioUrl(url);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'This link is invalid or has been revoked.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleDownload = async () => {
    if (!audioUrl || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `uke-sensei-shared-recording.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex flex-col items-center px-4 py-10">
      <a href="/" className="flex items-center gap-2 mb-8">
        <Logo className="w-8 h-8" />
        <span className="text-lg font-bold text-[var(--c-text-strong)] tracking-tight">Uke Sensei</span>
      </a>

      <div className="w-full max-w-lg">
        {loading && (
          <p className="text-center text-[var(--c-text-muted)] py-12">Loading recording…</p>
        )}

        {!loading && error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-red-400">{error}</p>
            <a href="/" className="text-sm text-teal-400 hover:underline">Go to Uke Sensei →</a>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-[var(--c-text-strong)] tracking-tight">
                {result.session.scaleKey === 'melody'
                  ? 'Song recording'
                  : `${result.session.root} ${SCALE_DEFINITIONS[result.session.scaleKey]?.name ?? result.session.scaleKey}`}
              </h1>
              {result.sharedBy && (
                <p className="text-sm text-[var(--c-text-muted)]">Shared by {result.sharedBy}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBlock label="Pitch" value={`${result.session.pitchAccuracy}%`} />
              <StatBlock label="Timing" value={`${result.session.timingOnTimePercent}%`} />
              <StatBlock label="Score" value={String(result.session.overallScore)} />
            </div>

            {audioUrl ? (
              <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 space-y-2">
                <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-xs font-medium text-[var(--c-accent)] hover:underline disabled:opacity-50"
                >
                  {downloading ? 'Downloading…' : 'Download recording'}
                </button>
              </div>
            ) : (
              <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-4 text-center">
                <p className="text-sm text-[var(--c-text-muted)]">No audio recording for this session</p>
              </div>
            )}

            {melodyNotes.length > 0 && (
              <SheetMusicView
                notes={melodyNotes}
                instrument={instrumentFromTuningKey(result.session.tuningKey)}
                tuningKey={result.session.tuningKey}
                title="Sheet Music"
                chords={result.session.chords ?? undefined}
              />
            )}

            <div className="text-center pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition"
              >
                Try Uke Sensei yourself →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)]">
      <div className="text-lg font-bold text-[var(--c-text-strong)]">{value}</div>
      <div className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
