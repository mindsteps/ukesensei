import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Verifies a Supabase access token by asking Supabase's auth server to
 * resolve it — no service-role key or JWT secret needed. Returns the
 * authenticated user's id, or null if the token is missing/invalid.
 */
export async function getUserIdFromRequest(authHeader: string | undefined): Promise<string | null> {
  if (!url || !anonKey) return null;
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** A recording key must live directly under the requesting user's own folder. */
export function keyBelongsToUser(key: string, userId: string): boolean {
  if (key.includes('..') || key.includes('\\')) return false;
  const prefix = `${userId}/`;
  if (!key.startsWith(prefix)) return false;
  return !key.slice(prefix.length).includes('/');
}

/**
 * Confirms a (non-revoked) share token grants access to this exact Spaces
 * object key, via the verify_shared_audio_key security-definer RPC — lets
 * an anonymous recipient of a share link play back a recording that lives
 * in Spaces rather than Supabase Storage.
 */
export async function shareTokenGrantsAccess(token: string, key: string): Promise<boolean> {
  if (!url || !anonKey) return false;
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.rpc('verify_shared_audio_key', { p_token: token, p_key: key });
  if (error) return false;
  return !!data;
}
