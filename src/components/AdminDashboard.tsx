import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminOverview,
  fetchAdminRecentLogins,
  fetchAdminTopUsers,
  fetchAdminUsers,
  type AdminOverview,
  type AdminRecentLogin,
  type AdminTopUser,
  type AdminUserRow,
} from '../api/adminApi';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [topUsers, setTopUsers] = useState<AdminTopUser[]>([]);
  const [recentLogins, setRecentLogins] = useState<AdminRecentLogin[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, top, logins, all] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminTopUsers(),
        fetchAdminRecentLogins(),
        fetchAdminUsers(),
      ]);
      setOverview(o);
      setTopUsers(top);
      setRecentLogins(logins);
      setUsers(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="text-center py-12 text-[var(--c-text-muted)]">Loading admin reports…</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-red-400">{error}</p>
        <p className="text-xs text-[var(--c-text-muted)]">
          Run <code className="text-[var(--c-accent)]">yarn setup:db</code> and{' '}
          <code className="text-[var(--c-accent)]">yarn admin:grant</code> if this is your first setup.
        </p>
        <button onClick={load} className="text-sm text-teal-400 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--c-text-strong)]">Admin Dashboard</h2>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
        >
          Refresh
        </button>
      </div>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <StatCard label="Total users" value={String(overview.total_users)} />
          <StatCard label="Onboarded" value={String(overview.onboarded_users)} />
          <StatCard label="Logins (7d)" value={String(overview.logins_7d)} />
          <StatCard label="Logins (30d)" value={String(overview.logins_30d)} />
          <StatCard label="New users (7d)" value={String(overview.new_users_7d)} />
          <StatCard label="Sessions" value={String(overview.total_sessions)} />
          <StatCard label="Practice time" value={formatDuration(overview.total_practice_sec)} />
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">
          Top users
        </h3>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--c-text-muted)] border-b border-[var(--c-border)]">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Practice</th>
                <th className="px-3 py-2">Lessons</th>
                <th className="px-3 py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-[var(--c-border)]/50">
                  <td className="px-3 py-2 text-[var(--c-text-strong)]">
                    {u.display_name ?? u.user_id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">{u.session_count}</td>
                  <td className="px-3 py-2">{formatDuration(Number(u.practice_sec))}</td>
                  <td className="px-3 py-2">{u.lessons_completed}</td>
                  <td className="px-3 py-2 text-[var(--c-text-muted)]">{formatDate(u.last_sign_in)}</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-[var(--c-text-muted)]">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">
          Recent logins
        </h3>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--c-text-muted)] border-b border-[var(--c-border)]">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {recentLogins.map((r) => (
                <tr key={r.user_id} className="border-b border-[var(--c-border)]/50">
                  <td className="px-3 py-2">{r.email ?? '—'}</td>
                  <td className="px-3 py-2">{r.display_name ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">{r.provider}</td>
                  <td className="px-3 py-2 text-[var(--c-text-muted)]">{formatDate(r.last_sign_in)}</td>
                </tr>
              ))}
              {recentLogins.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-[var(--c-text-muted)]">No logins yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">
          All users
        </h3>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--c-surface)]">
              <tr className="text-left text-[var(--c-text-muted)] border-b border-[var(--c-border)]">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-[var(--c-border)]/50">
                  <td className="px-3 py-2">{u.email ?? '—'}</td>
                  <td className="px-3 py-2">
                    {u.display_name ?? '—'}
                    {u.is_admin && <span className="ml-1 text-teal-400">admin</span>}
                  </td>
                  <td className="px-3 py-2">{u.preferred_key}</td>
                  <td className="px-3 py-2">{u.session_count}</td>
                  <td className="px-3 py-2 text-[var(--c-text-muted)]">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)]">
      <div className="text-lg font-bold text-[var(--c-text-strong)]">{value}</div>
      <div className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
