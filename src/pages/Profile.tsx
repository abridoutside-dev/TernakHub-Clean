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
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubscription } from '../contexts/SubscriptionContext';
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
import { PLAN_CONFIG, PLAN_ORDER } from '../data/workspaceSubscriptionData';
import type { WorkspacePlan } from '../types/workspace';
import {
  createSubscriptionChangeRequest,
  getLatestSubscriptionChangeRequest,
} from '../services/workspaceService';

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

// ─── Subscription Card ─────────────────────────────────────────────────────────

function SubscriptionCard() {
  const { plan: currentPlan, subscriptionId } = useSubscription();
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentCfg = PLAN_CONFIG[currentPlan] ?? PLAN_CONFIG.Free;
  const [changeOpen, setChangeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<WorkspacePlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [latestRequest, setLatestRequest] = useState<{ id: string; from_plan_key: string; to_plan_key: string; status: string; created_at: string; reviewed_at?: string | null; note?: string | null } | null>(null);

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const canUpgrade = currentIdx < PLAN_ORDER.length - 1;
  const canDowngrade = currentIdx > 0;

  useEffect(() => {
    if (!activeWorkspace) return;
    getLatestSubscriptionChangeRequest(activeWorkspace.workspace_uuid).then((req) => {
      if (req) setLatestRequest(req);
    });
  }, [activeWorkspace]);

  function handleRequestChange(plan: WorkspacePlan) {
    setTargetPlan(plan);
    setChangeOpen(true);
    setError(null);
    setSuccess(null);
  }

  async function handleConfirmChange() {
    if (!targetPlan || !currentUser || !activeWorkspace) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await createSubscriptionChangeRequest({
      workspace_id: activeWorkspace.workspace_uuid,
      subscription_id: subscriptionId,
      from_plan_key: currentPlan,
      to_plan_key: targetPlan,
      requested_by: currentUser.id,
      note: `Pengajuan perubahan paket dari ${PLAN_CONFIG[currentPlan].label} ke ${PLAN_CONFIG[targetPlan].label}.`,
    });

    if (!result.ok) {
      setError(result.error.message);
    } else {
      setSuccess(`Permintaan perubahan paket ke ${PLAN_CONFIG[targetPlan].label} telah dikirim. Administrator akan memproses permintaan Anda.`);
      const latest = await getLatestSubscriptionChangeRequest(activeWorkspace.workspace_uuid);
      if (latest) setLatestRequest(latest);
    }

    setSubmitting(false);
  }

  function handleCloseDialog() {
    setChangeOpen(false);
    setTargetPlan(null);
    setError(null);
  }

  const statusConfig: Record<string, { label: string; bg: string; border: string; color: string }> = {
    Pending:   { label: 'Menunggu Persetujuan', bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
    Approved:  { label: 'Disetujui',            bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
    Rejected:  { label: 'Ditolak',              bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    Cancelled: { label: 'Dibatalkan',           bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' },
  };

  const requestStatus = latestRequest ? statusConfig[latestRequest.status] ?? null : null;

  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.3 }}>
        LANGGANAN & PAKET
      </div>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: currentCfg.bg, border: `1.5px solid ${currentCfg.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 28 }}>{currentCfg.badge ?? '📋'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: currentCfg.color, marginBottom: 2 }}>
              PAKET SAAT INI
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: currentCfg.color }}>
              {currentCfg.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
              {currentCfg.description}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: currentCfg.color, marginTop: 4 }}>
              {currentCfg.price_label}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {canUpgrade && (
            <button onClick={() => handleRequestChange(PLAN_ORDER[currentIdx + 1])} style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ⬆️ Upgrade
            </button>
          )}
          {canDowngrade && (
            <button onClick={() => handleRequestChange(PLAN_ORDER[currentIdx - 1])} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--color-text)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ⬇️ Downgrade
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PLAN_ORDER.map((planKey) => {
            const cfg = PLAN_CONFIG[planKey];
            const isCurrent = planKey === currentPlan;
            return (
              <div key={planKey} style={{ padding: '10px 12px', background: isCurrent ? cfg.bg : 'var(--color-bg)', border: `1px solid ${isCurrent ? cfg.border : 'var(--color-border)'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 18 }}>{cfg.badge ?? '📋'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? cfg.color : 'var(--color-text)' }}>
                    {cfg.label} {isCurrent && <span style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '1px 6px', color: cfg.color }}>AKTIF</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{cfg.price_label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {latestRequest && (
          <div style={{ padding: '10px 12px', background: requestStatus?.bg ?? '#f1f5f9', border: `1px solid ${requestStatus?.border ?? '#e2e8f0'}`, borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: requestStatus?.color ?? '#64748b', background: requestStatus?.bg ?? '#f1f5f9', border: `1px solid ${requestStatus?.border ?? '#e2e8f0'}`, borderRadius: 6, padding: '2px 8px' }}>
                {requestStatus?.label ?? latestRequest.status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {latestRequest.from_plan_key} → {latestRequest.to_plan_key}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Diajukan: {new Date(latestRequest.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {latestRequest.reviewed_at && <> · Diproses: {new Date(latestRequest.reviewed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
            </div>
            {latestRequest.note && (
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, fontStyle: 'italic' }}>
                {latestRequest.note}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>ℹ️ Perubahan paket dilakukan oleh administrator platform. Hubungi admin untuk upgrade atau downgrade paket Workspace ini.</span>
          <button onClick={() => navigate('/profile/support/contact')} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Hubungi Admin →
          </button>
        </div>
      </div>

      {changeOpen && targetPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={handleCloseDialog}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Konfirmasi Perubahan Paket</div>
            {!success ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                Anda akan mengajukan perubahan paket dari <strong>{currentCfg.label}</strong> ke <strong>{PLAN_CONFIG[targetPlan].label}</strong>.
                <br /><br />
                Perubahan paket hanya dapat dilakukan oleh administrator platform. Hubungi admin untuk melanjutkan.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                {success}
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#166534' }}>
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {success ? (
                <button onClick={handleCloseDialog} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Tutup
                </button>
              ) : (
                <>
                  <button onClick={handleCloseDialog} disabled={submitting} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    Batal
                  </button>
                  <button onClick={handleConfirmChange} disabled={submitting} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Mengirim...' : 'Ajukan Perubahan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

      {/* Subscription */}
      <SubscriptionCard />

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
