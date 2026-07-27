import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import { Onboarding } from '../components/Onboarding';

function AuthGateInner({ children }: { children: ReactNode }) {
  const { configured, loading, user, profile, forceOnboarding, closeOnboarding } = useAuth();

  if (!configured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <p className="text-[var(--c-text-muted)]">Loading…</p>
      </div>
    );
  }

  // No session yet (first-time visitor — or anything that merely loaded
  // the page without interacting, like a health check or crawler) is
  // treated the same as an existing-but-not-onboarded profile: show
  // onboarding. No account is created just from reaching this screen —
  // AuthProvider only creates one lazily once a name+key is actually
  // claimed (see claimIdentity), so idle page loads can't spam real users.
  if (!user || !profile?.onboarding_complete || forceOnboarding) {
    return <Onboarding onComplete={closeOnboarding} />;
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </AuthProvider>
  );
}
