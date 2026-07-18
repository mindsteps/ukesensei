import { getSupabase } from '../lib/supabase';

export interface AdminOverview {
  total_users: number;
  onboarded_users: number;
  total_sessions: number;
  total_practice_sec: number;
  logins_7d: number;
  logins_30d: number;
  new_users_7d: number;
  total_shared_links: number;
  active_shared_links: number;
  shared_link_views: number;
}

export interface AdminTopUser {
  user_id: string;
  display_name: string | null;
  preferred_key: string;
  onboarding_complete: boolean;
  session_count: number;
  practice_sec: number;
  lessons_completed: number;
  last_sign_in: string | null;
  created_at: string;
}

export interface AdminRecentLogin {
  user_id: string;
  email: string | null;
  display_name: string | null;
  last_sign_in: string;
  created_at: string;
  provider: string;
}

export interface AdminUserRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  preferred_key: string;
  is_admin: boolean;
  onboarding_complete: boolean;
  session_count: number;
  created_at: string;
}

export interface AdminSharedLink {
  link_id: string;
  token: string;
  owner_display_name: string | null;
  session_label: string;
  has_audio: boolean;
  view_count: number;
  last_viewed_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * All admin data goes through our own `/api/admin/*` REST endpoints rather
 * than calling Supabase directly from the browser — the endpoints forward
 * this session token to the same `admin_*` RPCs (see supabase/admin.sql),
 * which still do their own `is_admin_user()` check server-side.
 */
async function callAdminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');

  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Admin API request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return callAdminApi<AdminOverview>('overview');
}

export async function fetchAdminTopUsers(limit = 15): Promise<AdminTopUser[]> {
  return callAdminApi<AdminTopUser[]>(`top-users?limit=${limit}`);
}

export async function fetchAdminRecentLogins(limit = 20): Promise<AdminRecentLogin[]> {
  return callAdminApi<AdminRecentLogin[]>(`recent-logins?limit=${limit}`);
}

export async function fetchAdminUsers(limit = 50): Promise<AdminUserRow[]> {
  return callAdminApi<AdminUserRow[]>(`users?limit=${limit}`);
}

export async function fetchAdminSharedLinks(limit = 50): Promise<AdminSharedLink[]> {
  return callAdminApi<AdminSharedLink[]>(`shared-links?limit=${limit}`);
}

export async function adminRevokeSharedLink(linkId: string): Promise<void> {
  await callAdminApi<{ ok: true }>('revoke-shared-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkId }),
  });
}

/** Permanently deletes a user (auth account, profile, sessions, everything). Cannot target an admin or your own account. */
export async function adminDeleteUser(userId: string): Promise<void> {
  await callAdminApi<{ ok: true }>('delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

/** Sets a user's password directly and signs them out everywhere. */
export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  await callAdminApi<{ ok: true }>('reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword }),
  });
}

/** Deletes abandoned (never-onboarded, non-admin) accounts older than maxAgeHours. Returns how many were removed. */
export async function adminCleanUsers(maxAgeHours = 24): Promise<number> {
  const { deleted } = await callAdminApi<{ deleted: number }>('clean-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxAgeHours }),
  });
  return deleted;
}
