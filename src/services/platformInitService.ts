// ─── Platform Initialization Service ─────────────────────────────────────────
// AUTH-001 — Checks and executes the one-time platform bootstrap.
//
// Bootstrap state machine
// ────────────────────────
//  A. Fresh              — no platform_config, no auth user
//  B. Email pending      — auth user created, email NOT yet confirmed, no session
//                          → saved in localStorage under PENDING_KEY
//  C. Session active     — auth user confirmed, session exists, no platform_config
//  D. Initialized        — platform_config row present
//
// Transitions:
//  A → B   initializePlatform()      email-confirmation ON:  sets PENDING_KEY,
//                                                             returns needsEmailConfirmation=true
//  A → D   initializePlatform()      email-confirmation OFF: writes platform_config immediately
//  B → C   (user clicks email link)  Supabase fires SIGNED_IN auth event
//  C → D   finalizeInitialization()  writes platform_config using active session
//
// Safety rules:
//  • checkPlatformInitialized() defaults to true on ambiguous errors so
//    existing users are never redirected to /initialize on transient outages.
//  • finalizeInitialization() is idempotent: if platform_config already exists
//    (concurrent initialization) it returns a recoverable error string.
//  • PENDING_KEY is cleared by finalizeInitialization() on success and by
//    the Initialize page on any unrecoverable sign-in failure.

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformInitResult {
  /** null on success; an Indonesian-language error string on failure. */
  error: string | null;
}

export interface InitFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface PendingAdminInit {
  /** Email address used when the auth user was created. */
  email: string;
  /** Full name provided in the form (display-only after this point). */
  fullName: string;
}

// ─── Pending-state bridge (localStorage) ─────────────────────────────────────
// Written after signUp() returns with no session (email confirmation required).
// Lets the Initialize page show the "check your email" screen on any return
// visit and auto-finalize once a verified session is detected.

const PENDING_KEY = 'ternakhub_init_pending';

export function getPendingAdminInit(): PendingAdminInit | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingAdminInit) : null;
  } catch {
    return null;
  }
}

export function clearPendingAdminInit(): void {
  localStorage.removeItem(PENDING_KEY);
}

function savePendingAdminInit(data: PendingAdminInit): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

// ─── Check ────────────────────────────────────────────────────────────────────

/**
 * Returns true when the platform has already been initialized.
 *
 * Safe to call before any user is authenticated (uses anon SELECT policy).
 * Defaults to `true` on ambiguous errors (network failure, RLS
 * misconfiguration) so existing users are never accidentally sent to
 * /initialize on a transient outage.
 */
export async function checkPlatformInitialized(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('platform_config')
      .select('key')
      .eq('key', 'initialized')
      .maybeSingle();

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      const details = (
        (error as unknown as { details?: string }).details ?? ''
      ).toLowerCase();

      // Detect "table is absent" — treat as not yet initialized.
      //  • PGRST200 — PostgREST schema-cache miss (table absent or not in cache)
      //  • 42P01    — PostgreSQL undefined_table
      //  String fallbacks cover client versions that normalise codes differently.
      const isTableMissing =
        error.code === 'PGRST200' ||
        error.code === '42P01'    ||
        msg.includes('schema cache')   ||
        msg.includes('does not exist') ||
        details.includes('schema cache')   ||
        details.includes('does not exist');

      if (isTableMissing) return false;

      // Any other error → assume initialized to protect against accidental
      // re-initialization on a transient outage.
      console.warn('[TernakHub] Platform init check failed:', error.message);
      return true;
    }

    return data !== null;
  } catch {
    return true; // Safety default
  }
}

// ─── Finalize ─────────────────────────────────────────────────────────────────

/**
 * Writes the platform_config row using the currently active Supabase session.
 *
 * Precondition: the caller must have verified that a session exists (via
 * supabase.auth.getSession()) and that email is confirmed before calling this.
 *
 * On success:   clears PENDING_KEY, returns { error: null }.
 * On failure:   returns an Indonesian error string; does NOT clear PENDING_KEY
 *               (the caller should decide whether to retry or abort).
 */
export async function finalizeInitialization(): Promise<PlatformInitResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      error:
        'Sesi tidak ditemukan. Pastikan email Anda sudah diverifikasi, ' +
        'lalu klik "Lanjutkan Inisialisasi".',
    };
  }

  const { error: configError } = await supabase
    .from('platform_config')
    .insert({
      key: 'initialized',
      // is_public MUST be true so anon SELECT in checkPlatformInitialized() can
      // see this row.  The RLS policy allows anon only when is_public = true;
      // without this flag every anonymous visitor gets data=null → initialized=false
      // → PlatformInitGuard redirects all traffic back to /initialize.
      is_public: true,
      value: {
        admin_user_id: session.user.id,
        initialized_at: new Date().toISOString(),
      },
    });

  if (configError) {
    // RLS NOT EXISTS guard rejected the insert — already initialized concurrently.
    clearPendingAdminInit();
    return {
      error:
        'Platform ini sudah pernah diinisialisasi. Masuk menggunakan akun ' +
        'administrator yang sudah ada.',
    };
  }

  clearPendingAdminInit();
  return { error: null };
}

// ─── Sign-in to resume ────────────────────────────────────────────────────────

/**
 * Used when the admin user already exists and their email is confirmed, but
 * platform_config was never written (e.g. the browser was closed between
 * email verification and finalization).
 *
 * Signs in with the provided credentials, then calls finalizeInitialization().
 */
export async function signInAndFinalize({
  email,
  password,
}: Pick<InitFormData, 'email' | 'password'>): Promise<PlatformInitResult> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    const msg = signInError.message.toLowerCase();
    if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
      return { error: 'Email atau kata sandi salah. Coba lagi.' };
    }
    if (msg.includes('email not confirmed')) {
      return {
        error:
          'Email belum dikonfirmasi. Periksa kotak masuk Anda dan klik ' +
          'tautan verifikasi terlebih dahulu.',
      };
    }
    return { error: `Gagal masuk: ${signInError.message}` };
  }

  return finalizeInitialization();
}

// ─── Initialize (create user + finalize or set pending) ───────────────────────

export interface InitializePlatformResult extends PlatformInitResult {
  /**
   * true  → user was created but email confirmation is required before
   *          platform_config can be written.  The page should switch to
   *          the "check your email" screen.
   * false → initialization complete (or failed with an error string).
   */
  needsEmailConfirmation: boolean;
  /**
   * true  → signUp returned "already registered" (confirmed user exists).
   *          The page should switch to the "sign in to resume" screen.
   */
  userAlreadyExists: boolean;
}

/**
 * Primary entry point — creates the first admin user and either:
 *  a) Writes platform_config immediately (email confirmation disabled), or
 *  b) Saves pending state and signals that email verification is required.
 */
export async function initializePlatform({
  fullName,
  email,
  password,
}: InitFormData): Promise<InitializePlatformResult> {
  const base: InitializePlatformResult = {
    error: null,
    needsEmailConfirmation: false,
    userAlreadyExists: false,
  };

  // ── Step 1: Create auth user ──────────────────────────────────────────────
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'system_admin' },
    },
  });

  if (signUpError) {
    const msg = signUpError.message.toLowerCase();

    // "User already registered" → confirmed user exists, no platform_config yet.
    if (
      msg.includes('already registered') ||
      msg.includes('user already exists') ||
      msg.includes('email already in use')
    ) {
      return { ...base, error: 'ALREADY_EXISTS', userAlreadyExists: true };
    }

    return { ...base, error: mapSignUpError(signUpError.message) };
  }

  // ── Step 2a: Session returned → email confirmation disabled ───────────────
  if (signUpData.session) {
    const { error: configError } = await supabase
      .from('platform_config')
      .insert({
        key: 'initialized',
        // is_public MUST be true — see finalizeInitialization() for rationale.
        is_public: true,
        value: {
          admin_user_id: signUpData.user!.id,
          initialized_at: new Date().toISOString(),
        },
      });

    if (configError) {
      // Concurrent initialization — sign out and surface the error.
      await supabase.auth.signOut();
      return {
        ...base,
        error:
          'Platform ini sudah pernah diinisialisasi. Masuk menggunakan akun ' +
          'administrator yang sudah ada.',
      };
    }

    return base; // success — error: null, needsEmailConfirmation: false
  }

  // ── Step 2b: No session → email confirmation required ────────────────────
  // signUp() with Supabase email enumeration protection may also return
  // { session: null } for an already-registered-but-unconfirmed email — the
  // behavior is identical: another verification email is sent and we wait.
  savePendingAdminInit({ email, fullName });
  // Defensive sign-out in case the SDK stored an unconfirmed partial session.
  await supabase.auth.signOut();

  return { ...base, needsEmailConfirmation: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSignUpError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('password') && msg.includes('short')) {
    return 'Kata sandi terlalu pendek. Gunakan minimal 8 karakter.';
  }
  if (msg.includes('invalid email') || msg.includes('email address')) {
    return 'Alamat email tidak valid.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
  }
  return `Gagal membuat akun: ${raw}`;
}
