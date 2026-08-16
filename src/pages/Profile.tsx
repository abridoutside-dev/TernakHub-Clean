// ─── Profile — Control Center (PROFILE-001) ───────────────────────────────────
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Layout: Header → User Summary → Quick Summary → Main Menu
//
// Catatan arsitektur:
// • Workspace Aktif ditampilkan hanya sebagai informasi — BUKAN Workspace Switcher.
// • Workspace Switching tetap di Global Header (TopAppBar).
// • Business Insight BELUM diimplementasikan — placeholder route tersedia.
// • Semua data dibaca dari profileData.ts — tidak ada duplikasi data bisnis.

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import { resetOnboarding } from '../data/onboardingData';
import { formatTanggalPendek } from '../utils/profileFormatDate';
import {
  getUserProfile,
  PROFILE_MENU,
  MEMBERSHIP_CONFIG,
  STATUS_AKUN_CONFIG,
  APP_VERSION,
  type ProfileMenuItem,
} from '../data/profileData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function MembershipBadge({ tier }: { tier: keyof typeof MEMBERSHIP_CONFIG }) {
  const cfg = MEMBERSHIP_CONFIG[tier];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Header Card ─────────────────────────────────────────────────────────────

function ProfileHeaderCard() {
  const user = getUserProfile();
  const { activeWorkspace } = useWorkspace();
  const ws = activeWorkspace;

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--color-primary-light)',
          border: '3px solid var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          flexShrink: 0,
        }}
      >
        {user.foto}
      </div>

      {/* Nama & username */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {user.nama}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>
          {user.username}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <MembershipBadge tier={user.membership} />
        {user.statusVerifikasi === 'Terverifikasi' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-primary)',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary)',
            }}
          >
            ✓ Terverifikasi
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, width: '100%', background: 'var(--color-border)', margin: '4px 0' }} />

       {/* Workspace Aktif — informasi saja, BUKAN switcher */}
       <div
         style={{
           display: 'flex',
           alignItems: 'center',
           gap: 8,
           padding: '8px 14px',
           background: 'var(--color-bg)',
           borderRadius: 'var(--radius-sm, 8px)',
           border: '1px solid var(--color-border)',
           width: '100%',
           boxSizing: 'border-box',
         }}
       >
         <span style={{ fontSize: 20 }}>{ws ? getWorkspaceIcon(ws) : '🏢'}</span>
         <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
           <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1 }}>Workspace Aktif</div>
           <div
             style={{
               fontSize: 13,
               fontWeight: 600,
               color: 'var(--color-text)',
               whiteSpace: 'nowrap',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               marginTop: 2,
             }}
           >
             {ws?.workspace_name ?? 'Tidak ada workspace aktif'}
           </div>
         </div>
         <span
           style={{
             fontSize: 11,
             color: 'var(--color-muted)',
             background: 'var(--color-border)',
             padding: '2px 6px',
             borderRadius: 4,
             flexShrink: 0,
           }}
         >
           {ws ? getWorkspaceTypeLabel(ws) : '—'}
         </span>
       </div>
    </div>
  );
}

// ─── Quick Summary ────────────────────────────────────────────────────────────

interface QuickStatProps {
  icon: string;
  value: string;
  label: string;
}

function QuickStat({ icon, value, label }: QuickStatProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.2 }}>{label}</span>
    </div>
  );
}

function QuickSummary() {
  const user      = getUserProfile();
  const { workspaces } = useWorkspace();
  const totalWs   = workspaces.length;
  const statusCfg = STATUS_AKUN_CONFIG[user.statusAkun];

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>
        RINGKASAN AKUN
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <QuickStat
          icon="🏢"
          value={String(totalWs)}
          label="Workspace"
        />
        <QuickStat
          icon={user.membership === 'PRO' ? '⭐' : user.membership === 'ENTERPRISE' ? '👑' : '🆓'}
          value={user.membership}
          label="Membership"
        />
        <QuickStat
          icon={statusCfg.icon}
          value={user.statusAkun}
          label="Status Akun"
        />
        <QuickStat
          icon="📱"
          value={APP_VERSION}
          label="Versi App"
        />
      </div>
    </div>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────

function MenuItem({ item }: { item: ProfileMenuItem }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(item.route)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm, 8px)',
          background: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {item.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.25 }}>
          {item.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.3 }}>
          {item.subtitle}
        </div>
      </div>

      {/* Badge (opsional) */}
      {item.badge && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            background: '#dc2626',
            borderRadius: 10,
            padding: '2px 7px',
            flexShrink: 0,
          }}
        >
          {item.badge}
        </span>
      )}

      {/* Chevron */}
      <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0, lineHeight: 1 }}>›</span>
    </button>
  );
}

function MainMenu() {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>
        MENU
      </div>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md, 12px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {PROFILE_MENU.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
        {/* Hapus border-bottom item terakhir */}
        <style>{`.profile-menu-last { border-bottom: none !important; }`}</style>
      </div>
    </div>
  );
}

// ─── Onboarding Restart ───────────────────────────────────────────────────────

function OnboardingRestart() {
  const navigate = useNavigate();

  function handleRestart() {
    resetOnboarding();
    navigate('/onboarding');
  }

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>
        PANDUAN
      </div>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={handleRestart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🧭
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.25 }}>
              Mulai Ulang Panduan
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.3 }}>
              Ulangi onboarding untuk mengenal fitur TernakHub
            </div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0, lineHeight: 1 }}>›</span>
        </button>
      </div>
    </div>
  );
}

// ─── Logout Button ────────────────────────────────────────────────────────────

function LogoutButton() {
  const { signOut } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await signOut();
    // Full-page replace: clears all React state (WorkspaceContext, subscriptions,
    // etc.) and replaces the history entry so Back cannot return to /dashboard.
    window.location.replace('/');
  }

  return (
    <>
      {/* Logout list item */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md, 12px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm, 8px)',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🚪
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#dc2626', lineHeight: 1.25 }}>
              Keluar
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.3 }}>
              Akhiri sesi dan kembali ke halaman login
            </div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0, lineHeight: 1 }}>›</span>
        </button>
      </div>

      {/* Confirmation dialog */}
      {showDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => !loading && setShowDialog(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
            }}
          />

          {/* Dialog card */}
          <div
            style={{
              position: 'relative',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '28px 24px 20px',
              width: '100%',
              maxWidth: 360,
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <div
              id="logout-dialog-title"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}
            >
              Keluar dari TernakHub?
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 24 }}>
              Sesi Anda akan diakhiri. Anda perlu login kembali untuk mengakses akun.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Keluar…' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const user = getUserProfile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Header */}
      <ProfileHeaderCard />

      {/* Quick Summary */}
      <QuickSummary />

      {/* Main Menu */}
      <MainMenu />

      {/* Onboarding restart */}
      <OnboardingRestart />

      {/* Logout */}
      <LogoutButton />

      {/* Footer info */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          Bergabung sejak {formatTanggalPendek(user.bergabungSejak)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, opacity: 0.6 }}>
          TernakHub v{APP_VERSION}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// imported from shared util — see src/utils/profileFormatDate.ts
