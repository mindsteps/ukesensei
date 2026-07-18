import { AuthGate } from './auth/AuthGate';
import App from './App';
import { WelcomeTour } from './components/WelcomeTour';
import { SharedSessionView } from './components/SharedSessionView';

/** Matches `/s/<token>` — kept out of the normal router/store since shared
 * links must work for recipients with no account and no completed
 * onboarding, and should never be gated by AuthGate's onboarding wizard. */
function matchSharedToken(pathname: string): string | null {
  const match = pathname.match(/^\/s\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AppRoot() {
  const sharedToken = typeof window !== 'undefined' ? matchSharedToken(window.location.pathname) : null;

  if (sharedToken) {
    return <SharedSessionView token={sharedToken} />;
  }

  return (
    <AuthGate>
      <App />
      <WelcomeTour />
    </AuthGate>
  );
}
