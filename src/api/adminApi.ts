import { getSupabase } from '../lib/supabase';

export interface AdminOverview {
  total_users: number;
  onboarded_users: number;
  total_sessions: number;
  total_practice_sec: number;
  logins_7d: number;
  logins_30d: number;
  new_users_7d: number;
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

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('admin_get_overview');
  if (error) throw error;
  return data as AdminOverview;
}

export async function fetchAdminTopUsers(limit = 15): Promise<AdminTopUser[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('admin_get_top_users', { row_limit: limit });
  if (error) throw error;
  return (data ?? []) as AdminTopUser[];
}

export async function fetchAdminRecentLogins(limit = 20): Promise<AdminRecentLogin[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('admin_get_recent_logins', { row_limit: limit });
  if (error) throw error;
  return (data ?? []) as AdminRecentLogin[];
}

export async function fetchAdminUsers(limit = 50): Promise<AdminUserRow[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('admin_list_users', { row_limit: limit });
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}
