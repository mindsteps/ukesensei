import { getSupabase } from '../lib/supabase';
import type { SessionDetail, SessionSummary, UploadMetadata } from '../api/sessionApi';
import { SPACES_UPLOAD_THRESHOLD_BYTES } from '../config/recordingStorage';
import { uploadToSpaces, getSpacesDownloadUrl, deleteSpacesRecording } from './spacesRecordingStore';

type AudioProvider = 'supabase' | 'spaces';

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function isCloudSessionId(id: string): boolean {
  return !id.startsWith('local-') && /^[0-9a-f-]{36}$/i.test(id);
}

function rowToSummary(row: Record<string, unknown>): SessionSummary {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    scaleKey: row.scale_key as string,
    root: row.root as string,
    bpm: row.bpm as number,
    tuningKey: row.tuning_key as string,
    durationSec: row.duration_sec as number,
    pitchAccuracy: Math.round((row.pitch_accuracy as number) * 100),
    timingOnTimePercent: Math.round((row.timing_on_time_percent as number) * 100),
    overallScore: Math.round((row.overall_score as number) * 100),
    analysisStatus: 'none',
    hasAudio: !!row.has_audio,
  };
}

export async function saveCloudSession(
  userId: string,
  metadata: UploadMetadata,
  audioBlob: Blob | null,
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const durationSec = Math.max(0, (metadata.endedAt - metadata.startedAt) / 1000);
  const hasAudio = !!(audioBlob && audioBlob.size > 0);

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: userId,
      scale_key: metadata.scaleKey,
      root: metadata.root,
      bpm: metadata.bpm,
      tuning_key: metadata.tuningKey,
      started_at: metadata.startedAt,
      ended_at: metadata.endedAt,
      duration_sec: durationSec,
      pitch_accuracy: metadata.pitchAccuracy,
      timing_on_time_percent: metadata.timingOnTimePercent,
      overall_score: metadata.overallScore,
      notes_json: metadata.notes,
      has_audio: hasAudio,
    })
    .select('id')
    .single();

  if (error) throw error;
  const sessionId = data.id as string;

  if (hasAudio && audioBlob) {
    const useSpaces = audioBlob.size > SPACES_UPLOAD_THRESHOLD_BYTES;
    let audioPath: string;
    let provider: AudioProvider;

    if (useSpaces) {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Not signed in');
      audioPath = await uploadToSpaces(accessToken, audioBlob);
      provider = 'spaces';
    } else {
      audioPath = `${userId}/${sessionId}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('session-audio')
        .upload(audioPath, audioBlob, { contentType: audioBlob.type || 'audio/webm', upsert: true });
      if (uploadError) throw uploadError;
      provider = 'supabase';
    }

    await supabase
      .from('practice_sessions')
      .update({ audio_path: audioPath, audio_provider: provider })
      .eq('id', sessionId);
  }

  return sessionId;
}

export async function listCloudSessions(userId: string): Promise<SessionSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToSummary);
}

export async function getCloudSession(id: string): Promise<SessionDetail | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const summary = rowToSummary(data);
  return {
    ...summary,
    notes: data.notes_json ?? [],
    startedAt: data.started_at,
    endedAt: data.ended_at,
  };
}

export async function getCloudAudioUrl(userId: string, sessionId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from('practice_sessions')
    .select('audio_path, has_audio, audio_provider')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!data?.has_audio || !data.audio_path) return null;

  if (data.audio_provider === 'spaces') {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;
    try {
      return await getSpacesDownloadUrl(accessToken, data.audio_path);
    } catch {
      return null;
    }
  }

  const { data: signed, error } = await supabase.storage
    .from('session-audio')
    .createSignedUrl(data.audio_path, 3600);

  if (error) return null;
  return signed.signedUrl;
}

export async function deleteCloudSession(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data } = await supabase
    .from('practice_sessions')
    .select('audio_path, audio_provider')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (data?.audio_path) {
    if (data.audio_provider === 'spaces') {
      const accessToken = await getAccessToken();
      if (accessToken) {
        try {
          await deleteSpacesRecording(accessToken, data.audio_path);
        } catch (err) {
          console.warn('Failed to delete Spaces recording:', err);
        }
      }
    } else {
      await supabase.storage.from('session-audio').remove([data.audio_path]);
    }
  }

  const { error } = await supabase
    .from('practice_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
