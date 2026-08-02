// ─── PROFILE-009 — Security Data ─────────────────────────────────────────────
// Mengacu pada: docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Aturan utama:
//  - Ganti Password: validasi UI only — in-memory, belum ada backend.
//  - 2FA: TOTP berbasis RFC 6238 (client-side, Web Crypto API). Secret tersimpan
//    in-memory; verifikasi dilakukan di ProfileSecurity.tsx via utils/totp.ts.
//  - Session logout: hanya menandai sesi sebagai tidak aktif (in-memory).
//  - Login Activity: permanen (tidak dapat dihapus).

import { generateUUID } from '../utils/uuid';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type LoginActivityAksi =
  | 'Login'
  | 'Logout'
  | 'Gagal Login'
  | 'Ganti Password'
  | '2FA Diaktifkan'
  | '2FA Dinonaktifkan';

export type LoginActivityStatus = 'Berhasil' | 'Gagal';

export interface LoginSession {
  id: string;
  device: string;
  browser: string;
  platform: string;
  loginTime: string;
  lastActivity: string;
  isCurrentSession: boolean;
  ipAddress: string;
  location: string;
  isActive: boolean;
}

export interface LoginActivityEntry {
  id: string;
  aksi: LoginActivityAksi;
  device: string;
  browser: string;
  platform: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  status: LoginActivityStatus;
  catatan: string | null;
}

export interface TwoFARecord {
  enabled: boolean;
  method: '2FA App' | 'SMS' | null;
  setupAt: string | null;
  /** Base32-encoded TOTP secret. Present only after successful enrollment. */
  secret: string | null;
}

export interface SecurityRecord {
  userId: string;
  passwordLastChanged: string;
  sessions: LoginSession[];
  activityLog: LoginActivityEntry[];
  twoFA: TwoFARecord;
}

// ─── In-memory Store ──────────────────────────────────────────────────────────

let SECURITY: SecurityRecord | null = null;

function nowMinus(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysMinus(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function seedIfNeeded(): void {
  if (SECURITY) return;

  const sessions: LoginSession[] = [
    {
      id:               generateUUID(),
      device:           'Samsung Galaxy A54',
      browser:          'Chrome',
      platform:         'Android 14',
      loginTime:        daysMinus(2),
      lastActivity:     nowMinus(0),
      isCurrentSession: true,
      ipAddress:        '182.253.xxx.xxx',
      location:         'Garut, Jawa Barat',
      isActive:         true,
    },
    {
      id:               generateUUID(),
      device:           'MacBook Pro',
      browser:          'Safari',
      platform:         'macOS Ventura',
      loginTime:        daysMinus(5),
      lastActivity:     nowMinus(48),
      isCurrentSession: false,
      ipAddress:        '182.253.xxx.xxx',
      location:         'Bandung, Jawa Barat',
      isActive:         true,
    },
    {
      id:               generateUUID(),
      device:           'iPad Air',
      browser:          'Safari',
      platform:         'iPadOS 17',
      loginTime:        daysMinus(12),
      lastActivity:     nowMinus(180),
      isCurrentSession: false,
      ipAddress:        '114.125.xxx.xxx',
      location:         'Garut, Jawa Barat',
      isActive:         false,
    },
  ];

  function makeActivity(
    aksi: LoginActivityAksi,
    device: string,
    browser: string,
    platform: string,
    timestamp: string,
    ipAddress: string,
    location: string,
    status: LoginActivityStatus,
    catatan: string | null,
  ): LoginActivityEntry {
    return { id: generateUUID(), aksi, device, browser, platform, timestamp, ipAddress, location, status, catatan };
  }

  const activityLog: LoginActivityEntry[] = [
    makeActivity('Login',          'Samsung Galaxy A54', 'Chrome',  'Android 14',    daysMinus(2),  '182.253.xxx.xxx', 'Garut, Jawa Barat',    'Berhasil', null),
    makeActivity('Login',          'MacBook Pro',        'Safari',  'macOS Ventura', daysMinus(5),  '182.253.xxx.xxx', 'Bandung, Jawa Barat',  'Berhasil', null),
    makeActivity('Gagal Login',    'Unknown Device',     'Firefox', 'Windows 11',    daysMinus(7),  '103.xxx.xxx.xxx', 'Jakarta, DKI Jakarta', 'Gagal',    'Password salah 3x.'),
    makeActivity('Logout',         'iPad Air',           'Safari',  'iPadOS 17',     daysMinus(10), '114.125.xxx.xxx', 'Garut, Jawa Barat',    'Berhasil', null),
    makeActivity('Ganti Password', 'Samsung Galaxy A54', 'Chrome',  'Android 14',    daysMinus(30), '182.253.xxx.xxx', 'Garut, Jawa Barat',    'Berhasil', 'Password berhasil diperbarui.'),
    makeActivity('Login',          'iPad Air',           'Safari',  'iPadOS 17',     daysMinus(12), '114.125.xxx.xxx', 'Garut, Jawa Barat',    'Berhasil', null),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  SECURITY = {
    userId:              'usr-berkah-001',
    passwordLastChanged: daysMinus(30),
    sessions,
    activityLog,
    twoFA: {
      enabled:  false,
      method:   null,
      setupAt:  null,
      secret:   null,
    },
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function getSecurityRecord(): SecurityRecord {
  seedIfNeeded();
  return SECURITY!;
}

export function getActiveSessions(): LoginSession[] {
  seedIfNeeded();
  return (SECURITY?.sessions ?? []).filter((s) => s.isActive);
}

export function getLoginActivity(): LoginActivityEntry[] {
  seedIfNeeded();
  return [...(SECURITY?.activityLog ?? [])];
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/** Logout dari satu sesi (tandai tidak aktif). */
export function logoutSession(sessionId: string): void {
  seedIfNeeded();
  if (!SECURITY) return;
  const session = SECURITY.sessions.find((s) => s.id === sessionId);
  if (session && !session.isCurrentSession) {
    session.isActive = false;
    SECURITY.activityLog.unshift({
      id:        generateUUID(),
      aksi:      'Logout',
      device:    session.device,
      browser:   session.browser,
      platform:  session.platform,
      timestamp: new Date().toISOString(),
      ipAddress: session.ipAddress,
      location:  session.location,
      status:    'Berhasil',
      catatan:   'Logout dari jarak jauh.',
    });
  }
}

/** Logout dari semua sesi selain sesi saat ini. */
export function logoutAllOtherSessions(): void {
  seedIfNeeded();
  if (!SECURITY) return;
  SECURITY.sessions
    .filter((s) => !s.isCurrentSession && s.isActive)
    .forEach((s) => {
      s.isActive = false;
      SECURITY!.activityLog.unshift({
        id:        generateUUID(),
        aksi:      'Logout',
        device:    s.device,
        browser:   s.browser,
        platform:  s.platform,
        timestamp: new Date().toISOString(),
        ipAddress: s.ipAddress,
        location:  s.location,
        status:    'Berhasil',
        catatan:   'Logout semua perangkat lain.',
      });
    });
}

// ─── 2FA Mutations ────────────────────────────────────────────────────────────

/**
 * Enable 2FA after successful TOTP verification.
 * Stores the verified secret and logs the event.
 */
export function enable2FA(secret: string): void {
  seedIfNeeded();
  if (!SECURITY) return;
  SECURITY.twoFA = {
    enabled: true,
    method:  '2FA App',
    setupAt: new Date().toISOString(),
    secret,
  };
  SECURITY.activityLog.unshift({
    id:        generateUUID(),
    aksi:      '2FA Diaktifkan',
    device:    'Perangkat Saat Ini',
    browser:   '—',
    platform:  '—',
    timestamp: new Date().toISOString(),
    ipAddress: '—',
    location:  '—',
    status:    'Berhasil',
    catatan:   'Autentikasi dua faktor diaktifkan via Authenticator App.',
  });
}

/**
 * Disable 2FA. Clears secret and logs the event.
 */
export function disable2FA(): void {
  seedIfNeeded();
  if (!SECURITY) return;
  SECURITY.twoFA = {
    enabled: false,
    method:  null,
    setupAt: null,
    secret:  null,
  };
  SECURITY.activityLog.unshift({
    id:        generateUUID(),
    aksi:      '2FA Dinonaktifkan',
    device:    'Perangkat Saat Ini',
    browser:   '—',
    platform:  '—',
    timestamp: new Date().toISOString(),
    ipAddress: '—',
    location:  '—',
    status:    'Berhasil',
    catatan:   'Autentikasi dua faktor dinonaktifkan.',
  });
}

/**
 * Ganti password (UI only — in-memory, belum ada backend).
 * Hanya mencatat aktivitas ke log.
 */
export function changePassword(
  _currentPassword: string,
  _newPassword: string,
): { ok: boolean; error?: string } {
  seedIfNeeded();
  if (!SECURITY) return { ok: false, error: 'Data tidak ditemukan.' };

  // Simulasi validasi — belum ada backend
  if (_currentPassword.length < 6) {
    return { ok: false, error: 'Password saat ini tidak valid.' };
  }
  if (_newPassword.length < 8) {
    return { ok: false, error: 'Password baru minimal 8 karakter.' };
  }

  SECURITY.passwordLastChanged = new Date().toISOString();
  SECURITY.activityLog.unshift({
    id:        generateUUID(),
    aksi:      'Ganti Password',
    device:    'Perangkat Saat Ini',
    browser:   '—',
    platform:  '—',
    timestamp: new Date().toISOString(),
    ipAddress: '—',
    location:  '—',
    status:    'Berhasil',
    catatan:   'Password berhasil diperbarui.',
  });

  return { ok: true };
}
