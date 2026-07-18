// Client for the stem-analysis feature: upload a track to Spaces, create a
// stem_jobs row, kick off the serverless separation function
// (api/stems/separate.py), and poll the job row for progress. Stem playback
// URLs come from the same presigned-download endpoint as recordings.

import { getSupabase } from '../lib/supabase';
import { getSpacesDownloadUrl, uploadToSpaces } from '../storage/spacesRecordingStore';

export const STEM_NAMES = ['vocals', 'guitar', 'piano', 'bass', 'drums', 'other'] as const;
export type StemName = (typeof STEM_NAMES)[number];

export type StemJobStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface StemJob {
  id: string;
  createdAt: string;
  status: StemJobStatus;
  progress: number;
  trackName: string;
  durationSec: number | null;
  stems: Partial<Record<StemName, string>> | null;
  error: string | null;
}

export const ACCEPTED_EXTENSIONS = ['mp3', 'wav', 'flac', 'ogg'];
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

async function getAuth(): Promise<{ userId: string; accessToken: string }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Sign in to use stem analysis.');
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new Error('Sign in to use stem analysis.');
  return { userId: session.user.id, accessToken: session.access_token };
}

function rowToJob(row: Record<string, unknown>): StemJob {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    status: row.status as StemJobStatus,
    progress: (row.progress as number) ?? 0,
    trackName: (row.track_name as string) || 'Untitled track',
    durationSec: (row.duration_sec as number | null) ?? null,
    stems: (row.stems as StemJob['stems']) ?? null,
    error: (row.error as string | null) ?? null,
  };
}

/**
 * Uploads the track, creates the job row, and starts the separation function.
 * Resolves as soon as the job is started — track completion via pollStemJob.
 */
export async function startStemJob(file: File): Promise<StemJob> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported format ".${ext}" — use ${ACCEPTED_EXTENSIONS.join(', ')}.`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File is too large (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB).`);
  }

  const { userId, accessToken } = await getAuth();
  const supabase = getSupabase()!;

  const blob = new File([file], file.name, { type: file.type || `audio/${ext}` });
  const sourceKey = await uploadToSpaces(accessToken, blob);

  const { data, error } = await supabase
    .from('stem_jobs')
    .insert({
      user_id: userId,
      source_key: sourceKey,
      track_name: file.name.replace(/\.[^.]+$/, ''),
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create stem job: ${error.message}`);
  const job = rowToJob(data);

  // Fire-and-forget: the function runs for minutes and reports through the
  // job row. But if the request fails at the network level, or the function
  // dies mid-run (out of memory, timeout), the row would be stuck in
  // pending/processing forever — surface that onto the job for the poller.
  void fetch('/api/stems/separate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ jobId: job.id }),
  })
    .then(async (res) => {
      if (res.ok) return;
      const detail = await res.json().catch(() => null);
      await supabase
        .from('stem_jobs')
        .update({
          status: 'error',
          error: detail?.error ?? `Separation service failed (${res.status}).`,
        })
        .eq('id', job.id)
        .in('status', ['pending', 'processing']);
    })
    .catch(async () => {
      await supabase
        .from('stem_jobs')
        .update({ status: 'error', error: 'Could not reach the separation service.' })
        .eq('id', job.id)
        .in('status', ['pending', 'processing']);
    });

  return job;
}

export async function listStemJobs(): Promise<StemJob[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('stem_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to list stem jobs: ${error.message}`);
  return (data ?? []).map(rowToJob);
}

export async function getStemJob(id: string): Promise<StemJob | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('stem_jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch stem job: ${error.message}`);
  return data ? rowToJob(data) : null;
}

export async function deleteStemJob(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('stem_jobs').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete stem job: ${error.message}`);
}

/** Presigned playback/download URL for one stem of a completed job. */
export async function getStemUrl(job: StemJob, stem: StemName): Promise<string> {
  const key = job.stems?.[stem];
  if (!key) throw new Error(`No "${stem}" stem for this job.`);
  const { accessToken } = await getAuth();
  return getSpacesDownloadUrl(accessToken, key);
}

/**
 * Polls a job until it reaches a terminal state. Calls onUpdate with each
 * fresh snapshot. Returns the final job. The returned cancel function stops
 * polling (e.g. on component unmount).
 */
export function pollStemJob(
  id: string,
  onUpdate: (job: StemJob) => void,
  intervalMs = 3000,
): { done: Promise<StemJob>; cancel: () => void } {
  let cancelled = false;
  const done = (async () => {
    for (;;) {
      if (cancelled) throw new Error('cancelled');
      const job = await getStemJob(id);
      if (job) {
        onUpdate(job);
        if (job.status === 'complete' || job.status === 'error') return job;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  })();
  // Swallow the cancellation rejection so nobody has to catch it.
  done.catch(() => {});
  return { done, cancel: () => { cancelled = true; } };
}
