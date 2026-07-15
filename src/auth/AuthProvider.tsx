import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, type UserProfile } from '../lib/supabase';
import { fetchLessonProgress, saveLessonComplete } from '../storage/cloudProgressStore';
import { useAppStore } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';
import { CHROMATIC_NOTES } from '../theory/notes';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  /** Password sign-in used only for admin access — not shown to regular users. */
  signInAsAdmin: (email: string, password: string) => Promise<{ error?: string }>;
  completeOnboarding: (displayName: string, contactEmail: string, password?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** True while the profile editor (onboarding flow) is being shown for an already-onboarded user. */
  forceOnboarding: boolean;
  /** Re-open the onboarding flow so the user can update their name/password/email. */
  openOnboarding: () => void;
  closeOnboarding: () => void;
  /**
   * Display name → username, chosen password → password. Same name +
   * same password resumes the same profile from any device; a name
   * already taken with a different password is rejected like a wrong
   * password. 'error' means something unexpected happened (e.g. a
   * transient network/rate-limit issue) — distinct from a real name
   * conflict so the UI doesn't misreport it as "wrong password".
   */
  claimIdentity: (name: string, password: string) => Promise<'resumed' | 'linked' | 'taken' | 'error'>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'player';
}

/**
 * Deterministic pseudo-email for a display name. Never a real inbox — but
 * it must live on a domain with real DNS records, because Supabase Auth
 * rejects addresses whose domain has no A/MX record (`invalid_email_dns`).
 * RFC 2606-reserved domains like `.invalid` deliberately never resolve, so
 * they get rejected by that check (inconsistently, depending on caching) —
 * we use our own real deployment domain instead, which always resolves.
 */
function credentialEmail(name: string): string {
  return `${slugifyName(name)}@ukesensei.vercel.app`;
}

/**
 * Interprets an error from updating the login credential (email/password).
 * Only a genuine name conflict should read as "that name is taken" — errors
 * like "same as current value" mean there was nothing to change (safe to
 * ignore), and anything else is unexpected and worth logging rather than
 * misreporting as a naming conflict.
 */
function handleCredentialUpdateError(credError: { code?: string; message?: string } | null): void {
  if (!credError) return;
  if (credError.code === 'email_exists' || credError.code === 'user_already_exists') {
    throw new Error('That name is already taken with a different key — try another name or key.');
  }
  if (credError.code === 'same_password' || credError.code === 'same_email') {
    // Nothing actually changed — not an error.
    return;
  }
  console.error('Failed to update login credential:', credError);
  throw new Error('Something went wrong saving your key — please try again.');
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, contact_email, preferred_key, onboarding_complete, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('id, display_name, contact_email, preferred_key, onboarding_complete, is_admin')
      .single();
    if (insertError) throw insertError;
    return created as UserProfile;
  }
  return data as UserProfile;
}

async function syncLessonProgress(userId: string) {
  const ids = await fetchLessonProgress(userId);
  useAppStore.setState({ completedLessons: ids });
}

function applyPreferredKey(key: string) {
  if (CHROMATIC_NOTES.includes(key as NoteName)) {
    useAppStore.getState().setSelectedRoot(key as NoteName);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const openOnboarding = useCallback(() => setForceOnboarding(true), []);
  const closeOnboarding = useCallback(() => setForceOnboarding(false), []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user.id);
    setProfile(p);
    if (p?.onboarding_complete && p.preferred_key) {
      applyPreferredKey(p.preferred_key);
      await syncLessonProgress(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase()!;

    const init = async (session: Session | null) => {
      if (!session?.user) {
        // No session yet — sign in anonymously so the app can go straight
        // into onboarding without a separate "sign in" step. The resulting
        // auth state change re-enters init() with the new session.
        setProfile(null);
        try {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn('Anonymous sign-in failed:', error);
            setUser(null);
            setLoading(false);
          }
        } catch (err) {
          console.warn('Anonymous sign-in failed:', err);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setUser(session.user);
      try {
        const p = await loadProfile(session.user.id);
        setProfile(p);
        if (p?.onboarding_complete) {
          if (p.preferred_key) applyPreferredKey(p.preferred_key);
          await syncLessonProgress(session.user.id);
        }
      } catch (err) {
        console.warn('Failed to load profile:', err);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => init(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      init(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    useAppStore.setState({ completedLessons: [] });
    // Immediately start a fresh anonymous session so the app re-enters
    // onboarding instead of getting stuck signed out.
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.warn('Anonymous sign-in failed:', error);
  }, []);

  const claimIdentity = useCallback(async (name: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return 'error' as const;

    const email = credentialEmail(name);

    // This exact name+password already belongs to a real account (this
    // device or another one) — switch straight into it instead of creating
    // a new one.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError && signInData.session) {
      return 'resumed' as const;
    }
    if (signInError && signInError.code !== 'invalid_credentials') {
      // Anything other than "wrong password" here (rate limiting, network
      // issues, etc.) is worth knowing about rather than silently falling
      // through to the claim attempt below.
      console.warn('Unexpected error checking existing identity:', signInError);
    }

    // Otherwise, claim this name+password for the current session. This
    // upgrades an anonymous session into a permanent one (Supabase's
    // built-in anonymous-to-permanent flow), or re-labels an existing real
    // account.
    const { error: updateError } = await supabase.auth.updateUser({ email, password });
    if (updateError) {
      // Only a genuine "that name is already registered" conflict should
      // read as "wrong password" — anything else (rate limits, network
      // blips, etc.) gets surfaced as a real error instead of being
      // misreported as a credential mismatch.
      const isNameConflict = updateError.code === 'email_exists' || updateError.code === 'user_already_exists';
      if (!isNameConflict) {
        console.error('Failed to claim identity:', updateError);
        return 'error' as const;
      }
      return 'taken' as const;
    }
    return 'linked' as const;
  }, []);

  const signInAsAdmin = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth not configured' };

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: error.message };
    // onAuthStateChange picks up the new session and reloads the profile.
    return {};
  }, []);

  const completeOnboarding = useCallback(async (displayName: string, contactEmail: string, password?: string) => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    // Keep the name+password credential in sync so it keeps working as a
    // login later (skipped for the real admin account, which has its own
    // password, and skipped entirely if the password field was left blank
    // while editing an existing profile).
    if (!profile?.is_admin && password) {
      const { error: credError } = await supabase.auth.updateUser({
        email: credentialEmail(displayName),
        password,
      });
      handleCredentialUpdateError(credError);
    } else if (!profile?.is_admin && profile?.onboarding_complete) {
      // Editing without changing the password — still keep the login email
      // in sync in case the display name changed.
      const { error: credError } = await supabase.auth.updateUser({
        email: credentialEmail(displayName),
      });
      handleCredentialUpdateError(credError);
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        contact_email: contactEmail.trim() || null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    const localLessons = useAppStore.getState().completedLessons;
    for (const lessonId of localLessons) {
      await saveLessonComplete(user.id, lessonId);
    }

    const p = await loadProfile(user.id);
    setProfile(p);
  }, [user, profile]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    user,
    profile,
    signOut,
    signInAsAdmin,
    completeOnboarding,
    refreshProfile,
    forceOnboarding,
    openOnboarding,
    closeOnboarding,
    claimIdentity,
  }), [loading, user, profile, signOut, signInAsAdmin, completeOnboarding, refreshProfile, forceOnboarding, openOnboarding, closeOnboarding, claimIdentity]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
