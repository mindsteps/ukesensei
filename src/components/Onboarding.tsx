import { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function defaultNameFromUser(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '';
  const meta = user.user_metadata ?? {};
  return (
    meta.full_name
    ?? meta.name
    ?? meta.user_name
    ?? meta.preferred_username
    ?? ''
  );
}

function defaultEmailFromUser(user: ReturnType<typeof useAuth>['user']): string {
  return user?.email ?? '';
}

/** Abstract solarpunk backdrop: sun rays, drifting leaves, organic glow. Purely decorative. */
function SolarpunkBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-56 h-56 rounded-full bg-teal-400/10 blur-2xl" />

      <svg
        className="absolute inset-0 w-full h-full opacity-[0.16]"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Rising sun with rays, bottom-left */}
        <g transform="translate(30 340)">
          <circle r="46" fill="none" stroke="url(#sunGrad)" strokeWidth="2" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = Math.cos(angle) * 54;
            const y1 = Math.sin(angle) * 54;
            const x2 = Math.cos(angle) * 68;
            const y2 = Math.sin(angle) * 68;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#sunGrad)" strokeWidth="2" strokeLinecap="round" />
            );
          })}
        </g>

        {/* Climbing vine, right edge */}
        <path
          d="M 380 20 C 340 60, 400 100, 360 140 C 320 180, 390 220, 350 260 C 320 290, 370 330, 340 380"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {[[356, 55], [340, 118], [372, 175], [332, 235], [358, 300], [330, 355]].map(([cx, cy], i) => (
          <path
            key={i}
            d={`M ${cx} ${cy} q 16 -10 26 4 q -14 12 -26 -4 Z`}
            fill="#34d399"
            opacity={0.8}
            transform={`rotate(${i % 2 === 0 ? 20 : -25} ${cx} ${cy})`}
          />
        ))}

        {/* Hex "solar panel" motif, top-left */}
        <g transform="translate(60 60)" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity={0.7}>
          <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" />
          <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" opacity={0.6} />
        </g>
      </svg>
    </div>
  );
}

export function Onboarding({ onComplete }: { onComplete?: () => void }) {
  const { user, profile, completeOnboarding, claimIdentity } = useAuth();
  const suggestedName = useMemo(() => profile?.display_name || defaultNameFromUser(user), [user, profile]);
  const suggestedEmail = useMemo(() => profile?.contact_email || defaultEmailFromUser(user), [user, profile]);
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(suggestedName);
  const [keyText, setKeyText] = useState<string>(profile?.preferred_key ?? '');
  const [showKey, setShowKey] = useState(false);
  const [contactEmail, setContactEmail] = useState(suggestedEmail);
  const [saving, setSaving] = useState(false);
  const [checkingKey, setCheckingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!profile?.onboarding_complete;

  const parsedKey = useMemo(() => parseKeyInput(keyText), [keyText]);
  const keyInvalid = keyText.trim() !== '' && !parsedKey;
  const emailValid = contactEmail.trim() === '' || EMAIL_RE.test(contactEmail.trim());

  const handleKeyContinue = async () => {
    if (!parsedKey) return;
    if (isEditing) {
      setStep(2);
      return;
    }
    setCheckingKey(true);
    setKeyError(null);
    try {
      const result = await claimIdentity(displayName, parsedKey);
      if (result === 'resumed') {
        // AuthGate will notice the restored session and swap straight into
        // the app once the profile loads — nothing else to do here.
        return;
      }
      if (result === 'taken') {
        setKeyError(`That's not ${displayName.trim()}'s key. Try another key, or use a different name.`);
        return;
      }
    } finally {
      setCheckingKey(false);
    }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!parsedKey) return;
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(displayName, parsedKey, contactEmail);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center px-4 relative overflow-hidden">
      <SolarpunkBackdrop />

      <div className="w-full max-w-lg relative rounded-[28px] p-[1.5px] bg-gradient-to-br from-emerald-400/50 via-teal-400/20 to-amber-400/50">
        <div className="w-full bg-[var(--c-surface)]/95 backdrop-blur-sm rounded-[26px] border border-[var(--c-border)] p-6 sm:p-8 relative">
          {isEditing && (
            <button
              onClick={() => onComplete?.()}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-[var(--c-border)]'
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xl">🌿</span>
                <h1
                  className="text-3xl font-semibold text-[var(--c-text-strong)] mt-2 tracking-tight"
                  style={{ fontFamily: 'var(--font-arty)' }}
                >
                  Who are you?
                </h1>
                <p className="text-sm text-[var(--c-text-muted)] mt-2">
                  Pick a name we&apos;ll use to greet you in the app.
                </p>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={40}
                className="w-full px-4 py-3 rounded-xl bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] text-lg placeholder:text-[var(--c-text-muted)] focus:border-emerald-400/60 focus:outline-none transition-colors"
              />
              <button
                onClick={() => setStep(1)}
                disabled={!displayName.trim()}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xl">🔆</span>
                <h1
                  className="text-3xl font-semibold text-[var(--c-text-strong)] mt-2 tracking-tight"
                  style={{ fontFamily: 'var(--font-arty)' }}
                >
                  What is the key?
                </h1>
                <p className="text-sm text-[var(--c-text-muted)] mt-2">
                  Hi {displayName.trim()}! Your key is your passphrase — it&apos;s also your default for exercises and free play.
                  {!isEditing && ' The same name and key will bring your profile back on any device.'}
                </p>
              </div>
              <div className="relative">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)]">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyText}
                  onChange={(e) => { setKeyText(e.target.value); setKeyError(null); }}
                  placeholder="Your key (e.g. C, F#, Bb…)"
                  autoFocus
                  autoComplete="off"
                  maxLength={3}
                  className={`w-full pl-11 pr-11 py-3 rounded-xl bg-[var(--c-bg)] border text-[var(--c-text)] text-lg placeholder:text-[var(--c-text-muted)] focus:outline-none transition-colors ${
                    keyInvalid ? 'border-red-400/60' : 'border-[var(--c-border)] focus:border-emerald-400/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-border)]/40 transition"
                >
                  {showKey ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.557z" />
                      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 019.999 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHROMATIC_NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => { setKeyText(note); setKeyError(null); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      parsedKey === note
                        ? 'bg-emerald-600/80 text-white'
                        : 'bg-[var(--c-bg)] text-[var(--c-text-muted)] border border-[var(--c-border)] hover:border-emerald-500/50'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
              {keyInvalid && (
                <p className="text-xs text-red-400">Not a key we know — try C, C#, D, D#, E, F, F#, G, G#, A, A#, or B (flats work too).</p>
              )}
              {keyError && (
                <div className="rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3 space-y-2">
                  <p className="text-xs text-red-400">{keyError}</p>
                  <button
                    onClick={() => { setKeyError(null); setStep(0); }}
                    className="text-xs font-medium text-[var(--c-accent)] hover:underline"
                  >
                    Use a different name instead →
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-3 rounded-xl text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
                >
                  Back
                </button>
                <button
                  onClick={handleKeyContinue}
                  disabled={checkingKey || !parsedKey}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {checkingKey ? 'Unlocking…' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-2xl">🐝</span>
                <h1
                  className="text-3xl font-semibold text-[var(--c-text-strong)] mt-2 tracking-tight"
                  style={{ fontFamily: 'var(--font-arty)' }}
                >
                  Stay in the loop
                </h1>
                <p className="text-sm text-[var(--c-text-muted)] mt-2">
                  Add an email address for practice reminders and updates. You can leave this blank and add it later.
                </p>
              </div>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                maxLength={120}
                className={`w-full px-4 py-3 rounded-xl bg-[var(--c-bg)] border text-[var(--c-text)] text-lg placeholder:text-[var(--c-text-muted)] focus:outline-none transition-colors ${
                  emailValid ? 'border-[var(--c-border)] focus:border-emerald-400/60' : 'border-red-400/60'
                }`}
              />
              {!emailValid && (
                <p className="text-xs text-red-400">That doesn&apos;t look like a valid email address.</p>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving || !emailValid}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : isEditing ? 'Save' : 'Start playing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
