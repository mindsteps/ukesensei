import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

/**
 * Compact email+password sign-in shown only when a non-admin visits /admin.
 * Regular users never see this — the main app flow is fully anonymous.
 */
export function AdminSignIn() {
  const { signInAsAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signInAsAdmin(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, AuthProvider's auth-state listener swaps in the admin
    // session/profile automatically — no need to do anything else here.
  };

  return (
    <div className="max-w-sm mx-auto py-12 space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-[var(--c-text-strong)]">Admin sign-in</h2>
        <p className="text-xs text-[var(--c-text-muted)] mt-1">
          This page isn&apos;t for regular users — sign in with your admin account.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          required
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-text-muted)]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-text-muted)]"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-500 transition disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
