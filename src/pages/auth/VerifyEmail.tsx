// ─── VerifyEmail Page ─────────────────────────────────────────────────────────
// AUTH-007 — Full email verification page.
//
// Features:
//  - Shows user's email and current verification status.
//  - Resend verification email with a 60-second cooldown countdown.
//  - Manual status refresh (calls fetchUser() → Supabase Auth).
//  - Auto-refresh: reacts to session changes via AuthContext.currentUser.
//  - Auto-poll after resend: checks every 5 s for up to 2 minutes.
//  - On verified: immediately shows success state and removes restrictions.
//
// Security: always reads email_confirmed_at from Supabase — never local state.
// No OTP, no phone, no OAuth, no invitation/referral.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { isEmailVerified } from '../../utils/emailVerification';
import { hasCompletedOnboarding } from '../../data/onboardingData';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN_S = 60;         // seconds before resend is allowed again
const POLL_INTERVAL_MS  = 5_000;      // how often to poll after resend
const POLL_MAX_ATTEMPTS = 24;         // 24 × 5 s = 2 minutes max polling

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapResendError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Terlalu banyak permintaan. Tunggu beberapa menit, lalu coba lagi.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Tidak dapat terhubung. Periksa koneksi internet Anda.';
  }
  if (m.includes('already confirmed') || m.includes('already verified')) {
    return 'Email Anda sudah terverifikasi. Coba refresh status.';
  }
  return 'Gagal mengirim ulang. Silakan coba beberapa saat lagi.';
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local}@${domain}`;
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '7px 14px',
      borderRadius: 24,
      fontSize: 13,
      fontWeight: 700,
      background: verified ? '#e8f5ee' : '#fff8e1',
      color:      verified ? '#1b7a43' : '#7b5e2a',
      border: `1.5px solid ${verified ? '#a5d6b0' : '#f0d080'}`,
      margin: '6px 0 18px',
    }}>
      <span aria-hidden="true">{verified ? '✅' : '⏳'}</span>
      {verified ? 'Email Terverifikasi' : 'Menunggu Verifikasi'}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      padding: '9px 0',
      borderBottom: '1px solid var(--color-border)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VerifyEmail() {
  const { currentUser, resendVerificationEmail, fetchUser } = useAuth();
  const navigate = useNavigate();

  const verified = isEmailVerified(currentUser);
  const email    = currentUser?.email ?? '';

  // ── Resend cooldown ──────────────────────────────────────────────────────────
  const [cooldown,     setCooldown]     = useState(0);
  const [resendError,  setResendError]  = useState<string | null>(null);
  const [resendOk,     setResendOk]     = useState(false);

  // Tick down the cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1_000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Refresh state ────────────────────────────────────────────────────────────
  const [refreshing,   setRefreshing]   = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // ── Auto-poll after resend ───────────────────────────────────────────────────
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const { error } = await fetchUser();
      // Stop on success or when we exhaust attempts
      if (!error || pollCountRef.current >= POLL_MAX_ATTEMPTS) {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchUser, stopPolling]);

  // Stop polling once the user becomes verified
  useEffect(() => {
    if (verified) stopPolling();
  }, [verified, stopPolling]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;
    setResendError(null);
    setResendOk(false);

    const { error } = await resendVerificationEmail(email);
    if (error) {
      setResendError(mapResendError(error.message));
      return;
    }

    setResendOk(true);
    setCooldown(RESEND_COOLDOWN_S);
    startPolling();
  }, [email, cooldown, resendVerificationEmail, startPolling]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshError(null);
    setRefreshing(true);
    const { error } = await fetchUser();
    setRefreshing(false);
    if (error) {
      setRefreshError('Gagal memperbarui status. Periksa koneksi Anda dan coba lagi.');
    }
  }, [refreshing, fetchUser]);

  // ── Not logged in ────────────────────────────────────────────────────────────

  if (!currentUser) {
    return (
      <AuthLayout
        title="Verifikasi Email"
        subtitle="Masuk terlebih dahulu untuk memverifikasi email Anda."
        footer={
          <p style={{ margin: 0 }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Masuk ke Akun
            </Link>
          </p>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <span style={{ fontSize: 40 }}>🔐</span>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Anda belum masuk ke akun. Silakan masuk terlebih dahulu.
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── Verified ─────────────────────────────────────────────────────────────────

  if (verified) {
    // Determine next step in the post-registration flow:
    // onboarding not done → /onboarding → /workspace/create → /workspace/select
    const nextPath = hasCompletedOnboarding() ? '/workspace/create' : '/onboarding';
    const nextLabel = hasCompletedOnboarding() ? 'Buat Workspace' : 'Mulai Onboarding';

    return (
      <AuthLayout title="Email Terverifikasi">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#e8f5ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 16,
          }}>
            ✅
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            Akun Anda Sudah Aktif
          </h3>

          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Email{' '}
            <strong style={{ color: 'var(--color-text)' }}>{email}</strong>{' '}
            telah berhasil diverifikasi.
          </p>

          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Semua fitur TernakHub kini tersedia. Lanjutkan untuk menyiapkan workspace Anda.
          </p>

          <button
            type="button"
            onClick={() => navigate(nextPath, { replace: true })}
            style={{
              width: '100%', height: 48, borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {nextLabel} →
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ── Unverified ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle="Cek kotak masuk Anda dan klik tautan verifikasi."
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Envelope illustration */}
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: '#fff8e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 12,
        }}>
          ✉️
        </div>

        {/* Status badge */}
        <StatusBadge verified={false} />

        {/* Info rows */}
        <div style={{ width: '100%', marginBottom: 20 }}>
          <InfoRow label="Email" value={maskEmail(email)} />
          <InfoRow label="Status Akun" value="Aktif — email belum dikonfirmasi" />
          <InfoRow label="Akses Marketplace" value="Terbatas (transaksi diblokir)" />
        </div>

        {/* Instruction */}
        <div style={{
          width: '100%',
          background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--color-text)',
          lineHeight: 1.7,
          textAlign: 'left',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📋 Langkah verifikasi:</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-muted)' }}>
            <li>Buka email di <strong style={{ color: 'var(--color-text)' }}>{maskEmail(email)}</strong></li>
            <li>Cari email dari <strong style={{ color: 'var(--color-text)' }}>TernakHub</strong></li>
            <li>Klik tombol <strong style={{ color: 'var(--color-text)' }}>Konfirmasi Email</strong></li>
            <li>Kembali ke halaman ini — status akan diperbarui otomatis</li>
          </ol>
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--color-muted)' }}>
            💡 Tidak menemukan email? Periksa folder Spam / Junk.
          </p>
        </div>

        {/* Resend success banner */}
        {resendOk && !resendError && (
          <div style={{
            width: '100%',
            background: '#e8f5ee',
            border: '1.5px solid #a5d6b0',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: '#1b7a43',
            lineHeight: 1.5,
          }}>
            ✅ Email verifikasi telah dikirim. Periksa kotak masuk Anda.
          </div>
        )}

        {/* Resend error */}
        {resendError && (
          <div style={{
            width: '100%',
            background: '#ffebee',
            border: '1.5px solid #ef9a9a',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: '#c62828',
            lineHeight: 1.5,
          }}>
            ❌ {resendError}
          </div>
        )}

        {/* Refresh error */}
        {refreshError && (
          <div style={{
            width: '100%',
            background: '#ffebee',
            border: '1.5px solid #ef9a9a',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: '#c62828',
            lineHeight: 1.5,
          }}>
            ❌ {refreshError}
          </div>
        )}

        {/* Resend button with cooldown */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          style={{
            width: '100%', height: 48,
            borderRadius: 'var(--radius-sm)',
            background: cooldown > 0 ? 'var(--color-border)' : 'var(--color-primary)',
            color: cooldown > 0 ? 'var(--color-muted)' : '#fff',
            border: 'none',
            fontSize: 15, fontWeight: 700,
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            marginBottom: 10,
            transition: 'background 0.2s',
          }}
        >
          {cooldown > 0
            ? `Kirim Ulang (${cooldown}d)`
            : '📧 Kirim Ulang Email Verifikasi'}
        </button>

        {/* Manual refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            width: '100%', height: 44,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            color: refreshing ? 'var(--color-muted)' : 'var(--color-primary)',
            border: '1.5px solid var(--color-primary)',
            fontSize: 14, fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            marginBottom: 20,
          }}
        >
          {refreshing ? 'Memeriksa…' : '🔄 Refresh Status Verifikasi'}
        </button>

        {/* Footer */}
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Setelah memverifikasi, status akan diperbarui otomatis.{' '}
          <Link
            to="/"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Kembali ke Beranda
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}
