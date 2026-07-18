import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(authHeader: string | undefined): string | null {
  return authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

/**
 * Calls one of the admin_* RPC functions (see supabase/admin.sql) on behalf
 * of the requesting user. Each function does its own `is_admin_user()`
 * check server-side (raising "Not authorized" for non-admins), so this just
 * forwards the caller's own session token — no elevated/service-role
 * credentials involved. The point is purely to keep the browser from
 * talking to Supabase directly for admin data: it calls our REST API, which
 * calls Supabase.
 */
export async function callAdminRpc<T>(
  authHeader: string | undefined,
  fn: string,
  params?: Record<string, unknown>,
): Promise<T> {
  if (!url || !anonKey) throw new AdminApiError(503, 'Supabase not configured');

  const token = getBearerToken(authHeader);
  if (!token) throw new AdminApiError(401, 'Not authenticated');

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    throw new AdminApiError(error.message === 'Not authorized' ? 403 : 400, error.message);
  }
  return data as T;
}

/** Shared error -> HTTP response mapping for admin endpoint handlers. */
export function respondWithAdminError(res: { status: (code: number) => { json: (body: unknown) => void } }, err: unknown, fallbackMessage: string) {
  if (err instanceof AdminApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(`${fallbackMessage}:`, err);
  res.status(500).json({ error: fallbackMessage });
}

/** Clamps a `limit` query param to a sane range, with a default. */
export function parseLimit(raw: unknown, fallback: number, max: number): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}
