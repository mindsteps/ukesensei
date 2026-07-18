import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminOverview,
  fetchAdminRecentLogins,
  fetchAdminSharedLinks,
  fetchAdminTopUsers,
  fetchAdminUsers,
  adminRevokeSharedLink,
  adminDeleteUser,
  adminResetPassword,
  adminCleanUsers,
  type AdminOverview,
  type AdminRecentLogin,
  type AdminSharedLink,
  type AdminTopUser,
  type AdminUserRow,
} from '../api/adminApi';
import { getErrorMessage } from '../lib/errors';
import { useAuth } from '../auth/AuthProvider';

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

/** A short, easy-to-read random password to pre-fill the reset-password prompt. */
function generatePassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function AdminDashboard() {
  const { refreshProfile } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [topUsers, setTopUsers] = useState<AdminTopUser[]>([]);
  const [recentLogins, setRecentLogins] = useState<AdminRecentLogin[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [sharedLinks, setSharedLinks] = useState<AdminSharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, top, logins, all, links] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminTopUsers(),
        fetchAdminRecentLogins(),
        fetchAdminUsers(),
        fetchAdminSharedLinks(),
      ]);
      setOverview(o);
      setTopUsers(top);
      setRecentLogins(logins);
      setUsers(all);
      setSharedLinks(links);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load admin data'));
      // The nav only gets us here if the cached profile looked like an
      // admin's, but that can go stale (session swapped out from under us,
      // admin flag revoked elsewhere, etc). Re-sync it so the UI reflects
      // reality — e.g. falling back to the sign-in view — instead of being
      // stuck on this error with no way out but a manual reload.
      void refreshProfile();
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = useCallback(async (linkId: string) => {
    if (!window.confirm('Revoke this share link? Anyone with the link will lose access immediately.')) return;
    setRevokingId(linkId);
    try {
      await adminRevokeSharedLink(linkId);
      setSharedLinks((prev) => prev.map((l) => (l.link_id === linkId ? { ...l, revoked_at: new Date().toISOString() } : l)));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to revoke link'));
    } finally {
      setRevokingId(null);
    }
  }, []);

  const handleDeleteUser = useCallback(async (u: AdminUserRow) => {
    const label = u.display_name ?? u.email ?? u.user_id.slice(0, 8);
    if (!window.confirm(`Permanently delete ${label}? This removes their account, sessions, and progress. This cannot be undone.`)) return;
    setUserActionError(null);
    setUserActionId(u.user_id);
    try {
      await adminDeleteUser(u.user_id);
      setUsers((prev) => prev.filter((row) => row.user_id !== u.user_id));
    } catch (err) {
      setUserActionError(getErrorMessage(err, 'Failed to delete user'));
    } finally {
      setUserActionId(null);
    }
  }, []);

  const handleResetPassword = useCallback(async (u: AdminUserRow) => {
    const label = u.display_name ?? u.email ?? u.user_id.slice(0, 8);
    const suggested = generatePassword();
    const newPassword = window.prompt(`New password for ${label} (min 6 characters):`, suggested);
    if (!newPassword) return;
    setUserActionError(null);
    setUserActionId(u.user_id);
    try {
      await adminResetPassword(u.user_id, newPassword);
      window.alert(`Password reset for ${label}.\n\nNew password: ${newPassword}\n\nThey've been signed out everywhere and will need this to sign in again.`);
    } catch (err) {
      setUserActionError(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setUserActionId(null);
    }
  }, []);

  const handleCleanUsers = useCallback(async () => {
    const raw = window.prompt('Delete abandoned (never-onboarded) accounts older than how many hours?', '24');
    if (raw === null) return;
    const maxAgeHours = Number(raw);
    if (!Number.isFinite(maxAgeHours) || maxAgeHours < 0) {
      window.alert('Please enter a non-negative number of hours.');
      return;
    }
    if (!window.confirm(`Delete all non-admin accounts that never finished onboarding and are older than ${maxAgeHours}h? This cannot be undone.`)) return;
    setCleaning(true);
    setUserActionError(null);
    try {
      const deleted = await adminCleanUsers(maxAgeHours);
      window.alert(deleted === 1 ? 'Deleted 1 abandoned account.' : `Deleted ${deleted} abandoned accounts.`);
      await load();
    } catch (err) {
      setUserActionError(getErrorMessage(err, 'Failed to clean up users'));
    } finally {
      setCleaning(false);
    }
  }, [load]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanUsers}
            disabled={cleaning}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--c-border)] text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {cleaning ? 'Cleaning…' : 'Clean up abandoned users'}
          </button>
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {userActionError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {userActionError}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <StatCard label="Total users" value={String(overview.total_users)} />
          <StatCard label="Onboarded" value={String(overview.onboarded_users)} />
          <StatCard label="Logins (7d)" value={String(overview.logins_7d)} />
          <StatCard label="Logins (30d)" value={String(overview.logins_30d)} />
          <StatCard label="New users (7d)" value={String(overview.new_users_7d)} />
          <StatCard label="Sessions" value={String(overview.total_sessions)} />
          <StatCard label="Practice time" value={formatDuration(overview.total_practice_sec)} />
          <StatCard label="Shared links" value={String(overview.total_shared_links)} />
          <StatCard label="Active shared links" value={String(overview.active_shared_links)} />
          <StatCard label="Shared link views" value={String(overview.shared_link_views)} />
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
          Shared links
        </h3>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--c-text-muted)] border-b border-[var(--c-border)]">
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Session</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">Last viewed</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sharedLinks.map((l) => (
                <tr key={l.link_id} className="border-b border-[var(--c-border)]/50">
                  <td className="px-3 py-2 text-[var(--c-text-strong)]">{l.owner_display_name ?? '—'}</td>
                  <td className="px-3 py-2">{l.session_label}{!l.has_audio && <span className="text-[var(--c-text-muted)]"> (no audio)</span>}</td>
                  <td className="px-3 py-2">{l.view_count}</td>
                  <td className="px-3 py-2 text-[var(--c-text-muted)]">{formatDate(l.last_viewed_at)}</td>
                  <td className="px-3 py-2 text-[var(--c-text-muted)]">{formatDate(l.created_at)}</td>
                  <td className="px-3 py-2">
                    {l.revoked_at ? (
                      <span className="text-[var(--c-text-muted)]">Revoked</span>
                    ) : (
                      <span className="text-teal-400">Active</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!l.revoked_at && (
                      <button
                        onClick={() => handleRevoke(l.link_id)}
                        disabled={revokingId === l.link_id}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sharedLinks.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-[var(--c-text-muted)]">No shared links yet</td></tr>
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
                <th className="px-3 py-2" />
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
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {!u.is_admin && (
                      <>
                        <button
                          onClick={() => handleResetPassword(u)}
                          disabled={userActionId === u.user_id}
                          className="text-teal-400 hover:underline disabled:opacity-50"
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={userActionId === u.user_id}
                          className="ml-3 text-red-400 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
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
