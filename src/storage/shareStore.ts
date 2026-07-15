import { getSupabase } from '../lib/supabase';
import type { SessionDetail } from '../api/sessionApi';
import { getSpacesDownloadUrlForShare } from './spacesRecordingStore';

export interface ShareLink {
  id: string;
  token: string;
  createdAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface SharedSessionResult {
  session: SessionDetail;
  sharedBy: string | null;
  audioPath: string | null;
  audioProvider: 'supabase' | 'spaces';
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function rowToShareLink(row: Record<string, unknown>): ShareLink {
  return {
    id: row.id as string,
    token: row.token as string,
    createdAt: row.created_at as string,
    revokedAt: (row.revoked_at as string | null) ?? null,
    viewCount: row.view_count as number,
    lastViewedAt: (row.last_viewed_at as string | null) ?? null,
  };
}

export async function createShareLink(userId: string, sessionId: string): Promise<ShareLink> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('shared_links')
    .insert({ user_id: userId, session_id: sessionId, token: generateToken() })
    .select('id, token, created_at, revoked_at, view_count, last_viewed_at')
    .single();

  if (error) throw error;
  return rowToShareLink(data);
}

export async function listShareLinks(sessionId: string): Promise<ShareLink[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('shared_links')
    .select('id, token, created_at, revoked_at, view_count, last_viewed_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToShareLink);
}

export async function revokeShareLink(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('shared_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export function shareLinkUrl(token: string): string {
  return `${window.location.origin}/s/${token}`;
}

/** Resolves a share token to session data. Works with no Supabase session at all. */
export async function getSharedSession(token: string): Promise<SharedSessionResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('get_shared_session', { p_token: token });
  if (error) throw new Error('This link is invalid or has been revoked.');

  const row = data as { session: Record<string, unknown>; sharedBy: string | null };
  const s = row.session;
  const session: SessionDetail = {
    id: s.id as string,
    createdAt: s.createdAt as string,
    scaleKey: s.scaleKey as string,
    root: s.root as string,
    bpm: s.bpm as number,
    tuningKey: s.tuningKey as string,
    durationSec: s.durationSec as number,
    pitchAccuracy: Math.round((s.pitchAccuracy as number) * 100),
    timingOnTimePercent: Math.round((s.timingOnTimePercent as number) * 100),
    overallScore: Math.round((s.overallScore as number) * 100),
    analysisStatus: 'none',
    hasAudio: !!s.hasAudio,
    notes: (s.notes as SessionDetail['notes']) ?? [],
    startedAt: s.startedAt as number,
    endedAt: s.endedAt as number,
  };

  return {
    session,
    sharedBy: row.sharedBy,
    audioPath: (s.audioPath as string | null) ?? null,
    audioProvider: (s.audioProvider as 'supabase' | 'spaces' | undefined) ?? 'supabase',
  };
}

/**
 * Signed playback URL for a shared session's audio. Takes the audioPath
 * already returned by getSharedSession() rather than re-calling the RPC, so
 * viewing a recording doesn't double-count as two views.
 */
export async function getSharedAudioUrl(
  token: string,
  audioPath: string,
  audioProvider: 'supabase' | 'spaces',
): Promise<string | null> {
  if (audioProvider === 'spaces') {
    try {
      return await getSpacesDownloadUrlForShare(token, audioPath);
    } catch {
      return null;
    }
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: signed, error } = await supabase.storage
    .from('session-audio')
    .createSignedUrl(audioPath, 3600);

  if (error) return null;
  return signed.signedUrl;
}
