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
  /** Upload/replace the current user's avatar image. Throws with a user-facing message on failure. */
  uploadAvatar: (file: File) => Promise<void>;
  /** Clear the current user's avatar, reverting to the default placeholder. */
  removeAvatar: () => Promise<void>;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
 * True when an error indicates the session's user no longer exists server
 * side (e.g. the underlying auth.users row was deleted/reset while the
 * browser still holds a cached session for it). Once this happens, every
 * request signed with that session fails the same way — auth calls reject
 * the JWT's `sub`, and any insert that references it (like creating a
 * `profiles` row) hits a foreign-key violation. The only fix is to drop the
 * stale session and start a fresh one, not to retry the same request.
 */
function isMissingAuthUserError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; code?: string };
  const message = (err.message ?? '').toLowerCase();
  return (
    err.code === 'user_not_found' ||
    err.code === '23503' ||
    message.includes('sub claim in jwt does not exist') ||
    message.includes('violates foreign key constraint') ||
    message.includes('is not present in table')
  );
}

/**
 * Interprets an error from updating the login credential (email/password).
 * Only a genuine name conflict should read as "that name is taken" — errors
 * like "same as current value" mean there was nothing to change (safe to
 * ignore), and anything else is unexpected and worth logging rather than
 * misreporting as a naming conflict.
 */
async function handleCredentialUpdateError(
  credError: { code?: string; message?: string } | null,
  recoverStaleSession: () => Promise<void>,
): Promise<void> {
  if (!credError) return;
  if (isMissingAuthUserError(credError)) {
    await recoverStaleSession();
    throw new Error('Your session needed a refresh — please try again.');
  }
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
    .select('id, display_name, contact_email, preferred_key, onboarding_complete, is_admin, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('id, display_name, contact_email, preferred_key, onboarding_complete, is_admin, avatar_url')
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

  // Drops a stale session (one whose user no longer exists server side) so
  // the app can recover on its own instead of getting permanently stuck
  // failing every auth/profile request. Deliberately does NOT start a new
  // anonymous session here — that only happens lazily once the visitor
  // actually claims an identity (see claimIdentity), so a stale-session
  // recovery can't silently spawn a fresh throwaway account on its own.
  const recoverStaleSession = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    console.warn('Detected a stale session (user no longer exists server-side) — starting fresh.');
    setProfile(null);
    setUser(null);
    setLoading(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign-out during stale-session recovery failed (continuing anyway):', err);
    }
  }, []);

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
        // No session yet — this is the normal state for a first-time
        // visitor (and for anything that merely loads the page without
        // interacting, like a health check or crawler). We deliberately do
        // NOT sign in anonymously here: that would create a real
        // `auth.users` row for every page load. Instead AuthGate shows the
        // onboarding flow, and a session only gets created lazily once the
        // visitor actually commits to a name+key (see claimIdentity) or
        // logs into an existing account.
        setProfile(null);
        setUser(null);
        setLoading(false);
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
        if (isMissingAuthUserError(err)) {
          await recoverStaleSession();
          return;
        }
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => init(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      init(session);
    });

    return () => subscription.unsubscribe();
  }, [recoverStaleSession]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    useAppStore.setState({ completedLessons: [] });
    // No new session is started here — AuthGate shows onboarding for a
    // signed-out visitor, and a fresh account only gets created lazily if
    // they actually claim one (see claimIdentity).
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
      setUser(signInData.session.user);
      return 'resumed' as const;
    }
    if (signInError && signInError.code !== 'invalid_credentials') {
      // Anything other than "wrong password" here (rate limiting, network
      // issues, etc.) is worth knowing about rather than silently falling
      // through to the claim attempt below.
      console.warn('Unexpected error checking existing identity:', signInError);
    }

    // No existing account owns this name+key. This is the only place a
    // brand-new visitor gets a real `auth.users` row created: lazily,
    // right as they commit to a name+key by clicking through onboarding —
    // never just from loading the page (which would otherwise let health
    // checks/crawlers spam the users table with throwaway anonymous
    // accounts, one per visit).
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (!existingSession) {
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('Failed to start a session while claiming identity:', anonError);
        return 'error' as const;
      }
    }

    // Claim this name+password for the (now guaranteed to exist) session.
    // This upgrades an anonymous session into a permanent one (Supabase's
    // built-in anonymous-to-permanent flow), or re-labels an existing real
    // account.
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({ email, password });
    if (updateError) {
      if (isMissingAuthUserError(updateError)) {
        console.warn('Stale session detected while claiming identity — recovering.');
        await recoverStaleSession();
        return 'error' as const;
      }
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
    // Update state immediately rather than waiting for the async
    // onAuthStateChange listener to catch up — the very next onboarding
    // step reads `user` from context to save the profile.
    if (updateData.user) setUser(updateData.user);
    return 'linked' as const;
  }, [recoverStaleSession]);

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
      await handleCredentialUpdateError(credError, recoverStaleSession);
    } else if (!profile?.is_admin && profile?.onboarding_complete) {
      // Editing without changing the password — still keep the login email
      // in sync in case the display name changed.
      const { error: credError } = await supabase.auth.updateUser({
        email: credentialEmail(displayName),
      });
      await handleCredentialUpdateError(credError, recoverStaleSession);
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

    if (error) {
      if (isMissingAuthUserError(error)) {
        await recoverStaleSession();
        throw new Error('Your session needed a refresh — please try again.');
      }
      throw error;
    }

    const localLessons = useAppStore.getState().completedLessons;
    for (const lessonId of localLessons) {
      await saveLessonComplete(user.id, lessonId);
    }

    const p = await loadProfile(user.id);
    setProfile(p);
  }, [user, profile, recoverStaleSession]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) throw new Error('Not signed in');
    const supabase = getSupabase();
    if (!supabase) throw new Error('Auth not configured');

    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file.');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new Error('Image must be smaller than 5MB.');
    }

    // Fixed filename per user (upsert) so we don't accumulate orphaned
    // files across re-uploads; the query string cache-busts the CDN/browser
    // cache since the underlying object path never changes.
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) throw new Error(uploadError.message || 'Failed to upload image.');

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;

    setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
  }, [user]);

  const removeAvatar = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;

    setProfile((p) => (p ? { ...p, avatar_url: null } : p));
  }, [user]);

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
    uploadAvatar,
    removeAvatar,
  }), [loading, user, profile, signOut, signInAsAdmin, completeOnboarding, refreshProfile, forceOnboarding, openOnboarding, closeOnboarding, claimIdentity, uploadAvatar, removeAvatar]);

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
