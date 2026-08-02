// ─── Authentication Context ────────────────────────────────────────────────────
// AUTH-002 / DB-001B-2B — Provides authentication state, session, and the
// authenticated user's profile record to the entire app tree.
//
// Design rules:
//  - currentUser is null while loading or when no session exists.
//  - loading is true only during the initial session restoration on first mount.
//  - userProfile is the Supabase user_profiles row for currentUser (null when
//    unauthenticated, null while profile is being fetched).
//  - All Supabase Auth side-effects are contained here. No other file should
//    import `supabase` directly for auth operations.
//  - The context deliberately does NOT redirect users or protect routes —
//    that belongs to a future ProtectedRoute component (AUTH-004).
//  - Existing in-memory prototype data (livestock, workspace, etc.) continues
//    to work regardless of auth state — no migration in this phase.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setAuthBridge } from '../lib/authBridge';
import type { UserProfile, UserProfileUpdateInput } from '../types/userProfile';
import {
  repoGetUserProfile,
  repoUpsertUserProfile,
  UserProfileRepoError,
} from '../repositories/userProfileRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  error: AuthError | null;
}

export interface ProfileUpdateResult {
  data: UserProfile | null;
  error: string | null;
}

export interface AuthContextValue {
  /** The currently signed-in Supabase user, or null if unauthenticated. */
  currentUser: User | null;
  /** The active Supabase session (contains access/refresh tokens), or null. */
  session: Session | null;
  /**
   * True only during the initial session restoration on first app load.
   * Components that need to avoid rendering before auth state is known
   * should check this flag.
   */
  loading: boolean;

  /**
   * The user_profiles row for the current user.
   * null when unauthenticated, null while the profile is being loaded.
   * Stays null in demo mode (no Supabase credentials configured).
   */
  userProfile: UserProfile | null;

  /** Sign in with email + password. Returns an AuthResult with error if failed. */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /**
   * Sign up with email + password and optional user metadata.
   * Pass `options.data` to persist extra profile fields (name, phone, etc.)
   * in the Supabase user's `user_metadata`.
   */
  signUp: (
    email: string,
    password: string,
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string },
  ) => Promise<AuthResult>;
  /** Sign out the current user. */
  signOut: () => Promise<AuthResult>;
  /**
   * Send a password reset email to the given address.
   * The user follows the link to set a new password.
   */
  resetPassword: (email: string) => Promise<AuthResult>;
  /**
   * Force-refresh the current session.
   * Supabase auto-refreshes tokens, but call this if you suspect staleness.
   */
  refreshSession: () => Promise<AuthResult>;
  /**
   * AUTH-007 — Re-send the email verification link to the given address.
   * Use on the /verify-email page; subject to Supabase rate limits.
   */
  resendVerificationEmail: (email: string) => Promise<AuthResult>;
  /**
   * AUTH-007 — Fetch the freshest user record directly from Supabase Auth.
   * Updates `currentUser` in-place. Use after a verification action to pick
   * up `email_confirmed_at` without waiting for the next token refresh.
   */
  fetchUser: () => Promise<AuthResult>;

  /**
   * DB-001B-2B — Update the current user's profile in Supabase.
   * Merges the given fields into the existing user_profiles row.
   * Updates the local `userProfile` state on success.
   */
  updateProfile: (updates: UserProfileUpdateInput) => Promise<ProfileUpdateResult>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Internal helper ─────────────────────────────────────────────────────────

/**
 * Loads the user_profiles row for a given auth user.
 * Returns null on any error (network, RLS) so callers degrade gracefully.
 */
async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('[AuthContext] PROFILE QUERY START', { userId });
  try {
    const profile = await repoGetUserProfile(userId);
    if (profile) {
      console.log('[AuthContext] PROFILE FOUND', { profile });
    } else {
      console.log('[AuthContext] PROFILE QUERY SUCCESS NULL - profile row missing or access denied', { userId });
    }
    return profile;
  } catch (err) {
    console.error('[AuthContext] PROFILE QUERY ERROR', { userId, error: err });
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const debugSetLoading = useCallback((value: boolean) => {
    console.log('[AuthContext] SET LOADING', value);
    setLoading(value);
  }, []);

  // On first mount: restore any persisted session, then subscribe to future
  // auth state changes (login, logout, token refresh, etc.).
  useEffect(() => {
    let cancelled = false;
    console.log('[AuthContext] init auth restore');
    console.log('[AuthContext] before supabase.auth.getSession()');

    // 1. Fetch the current session from Supabase (persisted in localStorage by
    //    the Supabase client — this is a managed cache, not app-level SSOT).
    supabase.auth.getSession()
      .then(async ({ data }) => {
        console.log('[AuthContext] getSession resolved', data);
        const u = data.session?.user ?? null;
        setSession(data.session);
        setCurrentUser(u);
        setAuthBridge(
          u?.id ?? null,
          u?.email ?? null,
          (u?.user_metadata?.role as string | undefined) ?? null,
        );
        if (u) {
          console.log('[AuthContext] AUTH OK', { userId: u.id, email: u.email });
        } else {
          console.log('[AuthContext] AUTH NO USER');
        }
        let profile: UserProfile | null = null;
        if (u) {
          console.log('[AuthContext] PROFILE QUERY');
          profile = await loadUserProfile(u.id);
        }
        setUserProfile(profile);
        console.log('[AuthContext] SET LOADING FALSE', {
          currentUser: u ? { id: u.id, email: u.email } : null,
          userProfile: profile ? 'FOUND' : 'NULL',
        });
        if (!cancelled) debugSetLoading(false);
      })
      .catch((err) => {
        console.error('[AuthContext] getSession threw', err);
        if (!cancelled) {
          setSession(null);
          setCurrentUser(null);
          setAuthBridge(null, null, null);
          setUserProfile(null);
          console.log('[AuthContext] SET LOADING FALSE on getSession error');
          debugSetLoading(false);
        }
      });

    // 2. Listen for subsequent auth events fired by Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthContext] onAuthStateChange', { event, newSession });
        // FLOW-001 duplicate-query fix: skip INITIAL_SESSION — the getSession()
        // call above already handles the initial auth state and triggers
        // WorkspaceContext's fetchWorkspaces() via currentUser state change.
        // Without this guard, Supabase fires INITIAL_SESSION immediately after
        // subscription (even when a valid session exists), causing currentUser
        // to be set twice with a new object reference each time and
        // WorkspaceContext to run two concurrent Supabase workspace fetches.
        if (event === 'INITIAL_SESSION') return;

        const u = newSession?.user ?? null;
        console.log('[AuthContext] AUTH STATE CHANGE', { event, userId: u?.id ?? null, email: u?.email ?? null });
        setSession(newSession);
        setCurrentUser(u);
        setAuthBridge(
          u?.id ?? null,
          u?.email ?? null,
          (u?.user_metadata?.role as string | undefined) ?? null,
        );
        if (u) {
          console.log('[AuthContext] AUTH OK', { userId: u.id, email: u.email });
        } else {
          console.log('[AuthContext] AUTH LOGOUT / NO USER');
        }
        let profile: UserProfile | null = null;
        if (u) {
          console.log('[AuthContext] PROFILE QUERY');
          profile = await loadUserProfile(u.id);
        }
        setUserProfile(profile);
        console.log('[AuthContext] SET LOADING FALSE', {
          currentUser: u ? { id: u.id, email: u.email } : null,
          userProfile: profile ? 'FOUND' : 'NULL',
          event,
        });
        if (!cancelled) debugSetLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [debugSetLoading]);

  // ─── Auth Actions ──────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string },
  ): Promise<AuthResult> => {
    const { emailRedirectTo, ...rest } = options ?? {};
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...rest,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    // Profile and user are cleared by the onAuthStateChange listener (u=null branch).
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Redirect the user here after they click the reset link.
      // AUTH-005 will implement this page; for now Supabase will redirect
      // to the app root which is safe.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.refreshSession();
    return { error };
  }, []);

  // AUTH-007 — Re-send signup verification email.
  const resendVerificationEmail = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error };
  }, []);

  // AUTH-007 — Fetch the freshest user record from Supabase Auth and sync
  // it into state so email_confirmed_at is immediately visible.
  const fetchUser = useCallback(async (): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.getUser();
    const u = data.user ?? null;
    if (u) {
      console.log('[AuthContext] AUTH OK fetchUser', { userId: u.id, email: u.email });
      setCurrentUser(u);
      setAuthBridge(
        u.id,
        u.email ?? null,
        (u.user_metadata?.role as string | undefined) ?? null,
      );
      console.log('[AuthContext] PROFILE QUERY');
      const profile = await loadUserProfile(u.id);
      setUserProfile(profile);
    } else {
      console.log('[AuthContext] AUTH NO USER fetchUser');
      setCurrentUser(null);
      setUserProfile(null);
      setAuthBridge(null, null, null);
    }
    return { error };
  }, []);

  // DB-001B-2B — Update the current user's profile in Supabase.
  const updateProfile = useCallback(async (
    updates: UserProfileUpdateInput,
  ): Promise<ProfileUpdateResult> => {
    if (!currentUser) {
      return { data: null, error: 'Tidak ada pengguna yang sedang masuk.' };
    }
    try {
      const updated = await repoUpsertUserProfile(currentUser.id, updates);
      setUserProfile(updated);
      return { data: updated, error: null };
    } catch (err) {
      const message =
        err instanceof UserProfileRepoError
          ? err.message
          : 'Gagal memperbarui profil.';
      return { data: null, error: message };
    }
  }, [currentUser]);

  // ─── Context Value ─────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    currentUser,
    session,
    loading,
    userProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    resendVerificationEmail,
    fetchUser,
    updateProfile,
  };

  const renderState = currentUser
    ? userProfile
      ? 'RENDER APP'
      : 'RENDER ONBOARDING / PROFILE SETUP'
    : 'RENDER LOGIN';

  console.log('[AuthContext] render provider', {
    renderState,
    currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
    session: session ? { expires_at: session.expires_at } : null,
    loading,
    userProfile: userProfile ? 'FOUND' : 'NULL',
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — consume the authentication context from any component.
 *
 * Throws if called outside of <AuthProvider>. This is intentional:
 * if auth state is unavailable, it is a wiring bug, not a runtime condition.
 *
 * @example
 *   const { currentUser, userProfile, signOut } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('[TernakHub] useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
