// ─── Accept Invitation — AUTH-001B ───────────────────────────────────────────
//
// Route: /invite/:token   (public — accessible before login)
//
// Flow:
//   1. Load invitation details via getInvitationByToken (SECURITY DEFINER fn).
//   2. If not logged in → show invitation card + Login / Daftar buttons
//      (redirect back to /invite/:token after auth).
//   3. If logged in → show Accept / Tolak buttons.
//   4. On Accept → acceptInvitation(token, userId) → redirect to / (workspace loads).
//   5. On Tolak  → rejectInvitation(token) → show confirmation.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
  type InvitationDetails,
} from '../../services/invitationService';
import { loadMembersFromSupabase } from '../../data/workspaceMembersData';
import {
  ROLE_LABEL,
  ROLE_COLOR,
  ROLE_DESCRIPTION,
  type MemberRole,
} from '../../types/workspacePermissions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatExpiry(isoDate: string | null): string {
  if (!isoDate) return 'Tidak ada batas waktu';
  const d = new Date(isoDate);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isExpired(isoDate: string | null): boolean {
  if (!isoDate) return false;
  return new Date(isoDate) < new Date();
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  const c = ROLE_COLOR[role] ?? { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 13, fontWeight: 700, padding: '4px 14px',
      borderRadius: 20, display: 'inline-block',
    }}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase =
  | 'loading'
  | 'not_found'
  | 'expired'
  | 'already_used'   // Accepted / Rejected / Revoked
  | 'ready'          // Pending — show Accept/Reject or login prompt
  | 'accepting'
  | 'rejecting'
  | 'accepted'
  | 'rejected'
  | 'error';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate  = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const [phase,       setPhase]       = useState<Phase>('loading');
  const [invitation,  setInvitation]  = useState<InvitationDetails | null>(null);
  const [errorMsg,    setErrorMsg]    = useState<string>('');
  const [showReject,  setShowReject]  = useState(false);

  // ── Load invitation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPhase('not_found'); return; }
    if (authLoading) return; // wait for auth to settle

    getInvitationByToken(token).then((result) => {
      if (!result.ok) {
        setPhase('not_found');
        return;
      }
      const inv = result.data;
      setInvitation(inv);

      if (inv.status !== 'Pending') {
        setPhase('already_used');
        return;
      }
      if (isExpired(inv.expires_at)) {
        setPhase('expired');
        return;
      }
      setPhase('ready');
    });
  }, [token, authLoading]);

  // ── Accept ─────────────────────────────────────────────────────────────────
  async function handleAccept() {
    if (!token || !currentUser) return;
    setPhase('accepting');
    const result = await acceptInvitation(token, currentUser.id);
    if (!result.ok) {
      setErrorMsg(result.message);
      setPhase('error');
      return;
    }
    // Refresh local members cache so the new membership is visible immediately.
    await loadMembersFromSupabase([result.data.workspace_id]);
    setPhase('accepted');
  }

  // ── Reject ─────────────────────────────────────────────────────────────────
  async function handleReject() {
    if (!token) return;
    setPhase('rejecting');
    await rejectInvitation(token);
    setPhase('rejected');
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    background: 'var(--color-bg)',
  };

  const card: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 20,
    padding: '32px 24px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    textAlign: 'center',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12,
    background: 'var(--color-primary)', color: '#fff',
    border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginBottom: 10,
  };

  const btnSecondary: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 12,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  if (authLoading || phase === 'loading') {
    return (
      <div style={page}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>Memuat undangan…</p>
      </div>
    );
  }

  if (phase === 'not_found') {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Undangan Tidak Ditemukan
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Tautan ini tidak valid atau sudah kadaluarsa. Minta undangan baru kepada pengelola workspace.
          </p>
          <button onClick={() => navigate('/')} style={btnPrimary}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⌛</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Undangan Kadaluarsa
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Undangan ini sudah melewati batas waktu {formatExpiry(invitation?.expires_at ?? null)}.
            Minta undangan baru kepada pengelola workspace.
          </p>
          <button onClick={() => navigate('/')} style={btnPrimary}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (phase === 'already_used') {
    const statusLabel: Record<string, string> = {
      Accepted: 'sudah diterima',
      Rejected: 'sudah ditolak',
      Revoked:  'telah dibatalkan oleh pengirim',
      Expired:  'sudah kadaluarsa',
    };
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>ℹ️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Undangan Tidak Aktif
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Undangan ini {statusLabel[invitation?.status ?? ''] ?? 'tidak aktif'}.
          </p>
          <button onClick={() => navigate('/')} style={btnPrimary}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (phase === 'accepted') {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 8px' }}>
            Selamat Datang!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.6 }}>
            Anda telah bergabung dengan workspace
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 24 }}>
            {invitation?.workspace_name}
          </p>
          <RoleBadge role={invitation?.role ?? 'Viewer'} />
          <div style={{ marginTop: 24 }}>
            <button onClick={() => navigate('/', { replace: true })} style={btnPrimary}>
              Masuk ke Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'rejected') {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Undangan Ditolak
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Anda telah menolak undangan ke workspace {invitation?.workspace_name}.
          </p>
          <button onClick={() => navigate('/')} style={btnPrimary}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ fontSize: 14, color: '#991b1b', marginBottom: 24, lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <button onClick={() => setPhase('ready')} style={btnPrimary}>Coba Lagi</button>
        </div>
      </div>
    );
  }

  // ── phase === 'ready' ──────────────────────────────────────────────────────

  const isLoggedIn  = !!currentUser;
  const isBusy      = phase === 'accepting' || phase === 'rejecting';
  const roleDesc    = invitation ? (ROLE_DESCRIPTION[invitation.role] ?? '') : '';

  return (
    <div style={page}>
      <div style={card}>
        {/* Workspace */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 16px',
        }}>
          🏢
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 4px' }}>
          Anda diundang untuk bergabung dengan
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 16px' }}>
          {invitation?.workspace_name}
        </h2>

        {/* Role */}
        <div style={{ marginBottom: 6 }}>
          <RoleBadge role={invitation?.role ?? 'Viewer'} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          {roleDesc}
        </p>

        {/* Expiry */}
        {invitation?.expires_at && (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
            Berlaku hingga {formatExpiry(invitation.expires_at)}
          </p>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 20px' }} />

        {/* CTA depends on auth state */}
        {isLoggedIn ? (
          <>
            {showReject ? (
              <>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}>
                  Yakin ingin menolak undangan ini?
                </p>
                <button
                  onClick={handleReject}
                  disabled={isBusy}
                  style={{ ...btnPrimary, background: '#dc2626' }}
                >
                  {phase === 'rejecting' ? 'Menolak…' : 'Ya, Tolak Undangan'}
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  disabled={isBusy}
                  style={btnSecondary}
                >
                  Batal
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isBusy}
                  style={btnPrimary}
                >
                  {phase === 'accepting' ? 'Memproses…' : 'Terima Undangan'}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={isBusy}
                  style={btnSecondary}
                >
                  Tolak
                </button>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 12 }}>
                  Masuk sebagai {currentUser?.email}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 600, marginBottom: 16 }}>
              Masuk atau daftar untuk menerima undangan ini
            </p>
            <Link
              to={`/login?redirect=/invite/${token}`}
              style={{
                display: 'block', width: '100%', height: 48, borderRadius: 12,
                background: 'var(--color-primary)', color: '#fff',
                fontSize: 15, fontWeight: 700, lineHeight: '48px',
                textDecoration: 'none', marginBottom: 10,
              }}
            >
              Masuk
            </Link>
            <Link
              to={`/register?redirect=/invite/${token}`}
              style={{
                display: 'block', width: '100%', height: 48, borderRadius: 12,
                background: 'var(--color-bg)', color: 'var(--color-text)',
                border: '1.5px solid var(--color-border)',
                fontSize: 15, fontWeight: 600, lineHeight: '48px',
                textDecoration: 'none',
              }}
            >
              Daftar Akun Baru
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
