import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_BYTES,
  STEM_NAMES,
  deleteStemJob,
  getStemUrl,
  listStemJobs,
  pollStemJob,
  startStemJob,
  type StemJob,
  type StemName,
} from '../api/stemsApi';
import { useAuth } from '../auth/AuthProvider';

const STEM_LABELS: Record<StemName, string> = {
  vocals: 'Vocals',
  guitar: 'Guitar',
  piano: 'Piano',
  bass: 'Bass',
  drums: 'Drums',
  other: 'Other',
};

export function StemAnalysis() {
  const { configured, profile } = useAuth();
  const [jobs, setJobs] = useState<StemJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollersRef = useRef(new Map<string, () => void>());

  const updateJob = useCallback((job: StemJob) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
  }, []);

  const watchJob = useCallback((job: StemJob) => {
    if (pollersRef.current.has(job.id)) return;
    const { done, cancel } = pollStemJob(job.id, updateJob);
    pollersRef.current.set(job.id, cancel);
    done.finally(() => pollersRef.current.delete(job.id)).catch(() => {});
  }, [updateJob]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const list = await listStemJobs();
        if (disposed) return;
        setJobs(list);
        list.filter((j) => j.status === 'pending' || j.status === 'processing').forEach(watchJob);
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : 'Failed to load stem jobs.');
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    const pollers = pollersRef.current;
    return () => {
      disposed = true;
      pollers.forEach((cancel) => cancel());
      pollers.clear();
    };
  }, [watchJob]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const job = await startStemJob(file);
      setJobs((prev) => [job, ...prev]);
      watchJob(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [watchJob]);

  const handleDelete = useCallback(async (id: string) => {
    pollersRef.current.get(id)?.();
    pollersRef.current.delete(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await deleteStemJob(id);
    } catch { /* row is gone from the UI either way */ }
  }, []);

  const signedIn = configured && !!profile;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-[var(--c-text-strong)]">Stem Analysis</h1>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">
          Upload a song and split it into six stems — vocals, guitar, piano, bass, drums and
          the rest — so you can practice along with any part isolated. Separation runs
          Meta's HT-Demucs model and takes a few minutes per track.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-5 text-center">
        {!signedIn ? (
          <p className="text-sm text-[var(--c-text-muted)]">Sign in to analyze your tracks.</p>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
            >
              {uploading ? 'Uploading…' : 'Upload a track'}
            </button>
            <p className="text-xs text-[var(--c-text-muted)] mt-2">
              {ACCEPTED_EXTENSIONS.join(', ')} · up to {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB
              · max 6 minutes
            </p>
          </>
        )}
        {error && <p className="text-sm text-amber-400 mt-3">{error}</p>}
      </div>

      {/* Jobs */}
      {loading ? (
        <div className="text-center py-8 text-[var(--c-text-muted)]">Loading…</div>
      ) : jobs.length > 0 && (
        <div className="grid gap-2">
          {jobs.map((job) => (
            <StemJobCard key={job.id} job={job} onDelete={() => handleDelete(job.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StemJobCard({ job, onDelete }: { job: StemJob; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(job.createdAt).toLocaleDateString();
  const running = job.status === 'pending' || job.status === 'processing';

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--c-text-strong)] truncate">{job.trackName}</div>
          <div className="text-xs text-[var(--c-text-muted)]">
            {date}
            {job.durationSec != null && ` · ${Math.round(job.durationSec)}s`}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.status === 'complete' && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition"
            >
              {expanded ? 'Hide stems' : 'Show stems'}
            </button>
          )}
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="p-1.5 rounded-lg text-[var(--c-text-muted)] hover:text-red-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {running && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--c-text-muted)] mb-1">
            <span>{job.status === 'pending' ? 'Waiting to start…' : 'Separating stems…'}</span>
            <span>{job.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--c-bg)] overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, job.progress)}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'error' && (
        <p className="mt-2 text-xs text-amber-400">{job.error ?? 'Separation failed.'}</p>
      )}

      {job.status === 'complete' && expanded && <StemList job={job} />}
    </div>
  );
}

function StemList({ job }: { job: StemJob }) {
  const [urls, setUrls] = useState<Partial<Record<StemName, string>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const entries = await Promise.all(
          STEM_NAMES.filter((s) => job.stems?.[s]).map(
            async (s) => [s, await getStemUrl(job, s)] as const,
          ),
        );
        if (!disposed) setUrls(Object.fromEntries(entries));
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : 'Could not load stems.');
      }
    })();
    return () => { disposed = true; };
  }, [job]);

  if (error) return <p className="mt-3 text-xs text-amber-400">{error}</p>;

  return (
    <div className="mt-3 grid gap-2">
      {STEM_NAMES.filter((s) => job.stems?.[s]).map((stem) => (
        <div key={stem} className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--c-text-muted)] w-14 shrink-0">
            {STEM_LABELS[stem]}
          </span>
          {urls[stem] ? (
            <>
              <audio controls preload="none" src={urls[stem]} className="h-8 flex-1 min-w-0" />
              <a
                href={urls[stem]}
                download={`${job.trackName}-${stem}.mp3`}
                aria-label={`Download ${STEM_LABELS[stem]} stem`}
                className="p-1.5 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
              </a>
            </>
          ) : (
            <span className="text-xs text-[var(--c-text-muted)]">Loading…</span>
          )}
        </div>
      ))}
    </div>
  );
}
