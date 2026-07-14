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

  // No account step — sign-in happens anonymously in the background
  // (see AuthProvider). If that ever fails, fall back to running the app
  // in local-only mode rather than dead-ending the user.
  if (!user) {
    return <>{children}</>;
  }

  if (!profile?.onboarding_complete || forceOnboarding) {
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
