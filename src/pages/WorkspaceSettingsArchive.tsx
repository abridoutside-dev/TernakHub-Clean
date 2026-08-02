// ─── Workspace Archive / Restore — WS-006 ────────────────────────────────────
//
// Route: /workspace/settings/archive
//
// Allows the workspace Owner to archive an Active workspace or restore an
// Archived one. No other role has access.
//
// When Archived:
//   - workspace_status transitions to 'Archived'; archived_at is set
//   - Workspace becomes read-only (enforced at data-layer calls in future modules)
//   - Blocked: dashboard edits, livestock/feed/medicine updates, marketplace, members
//   - Allowed: view info, export, restore
//
// When Restored:
//   - workspace_status transitions back to 'Active'; archived_at is cleared
//   - All prior data remains intact
//
// Guard: only the resolver's workspace-archive permission may archive or restore.
// Stub: transfer / background-process check always passes in this prototype.
//
// Uses:
//   - useWorkspace() → activeWorkspace, saveWorkspace, refreshWorkspaces
//   - useAuth()      → currentUser.id
//   - getMemberByUserId() → role check

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
import { WORKSPACE_TYPE_LABEL } from '../types/workspace';
import { removeRecentWorkspace } from '../utils/recentWorkspaces';

// ─── Stub: transfer / background-process check ───────────────────────────────

interface ArchiveBlocker { blocked: boolean; reason?: string }

function checkCanArchive(_workspaceUuid: string): ArchiveBlocker {
  // Prototype: no real transfer or background-process tracking yet.
  // Future: check marketplace pending transactions, active data migrations, etc.
  return { blocked: false };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { kind: 'success' | 'error'; message: string }

function ToastBanner({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const ok = toast.kind === 'success';
  return (
    <div style={{
      position: 'fixed', top: 'calc(var(--top-app-bar-height) + 8px)', left: 0, right: 0, zIndex: 300,
      display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none',
    }}>
      <div style={{
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%', pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 16, color: ok ? '#166534' : '#dc2626', flexShrink: 0 }}>
          {ok ? '✓' : '⚠'}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ok ? '#166534' : '#991b1b' }}>
          {toast.message}
        </span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: ok ? '#166534' : '#dc2626', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Consequence item ─────────────────────────────────────────────────────────

function ConsequenceItem({ icon, text, blocked }: { icon: string; text: string; blocked: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: blocked ? '#dc2626' : '#166534', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ─── Archive Confirm Dialog ───────────────────────────────────────────────────

function ArchiveConfirmDialog({
  workspaceName,
  onConfirm,
  onCancel,
  loading,
}: {
  workspaceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === workspaceName.trim();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 16, padding: '24px 22px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Arsipkan Workspace</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Tindakan ini tidak dapat dibatalkan tanpa pemulihan.</p>
          </div>
        </div>

        {/* Consequences recap */}
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Saat diarsipkan, workspace ini akan:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              'Langsung menjadi hanya-baca',
              'Memblokir semua perubahan data (ternak, pakan, obat)',
              'Menangguhkan semua aktivitas Marketplace',
              'Mencegah perubahan manajemen anggota',
            ].map((line) => (
              <div key={line} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#991b1b' }}>
                <span>•</span><span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name confirmation input */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
            Ketik <code style={{ background: 'var(--color-bg)', padding: '1px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{workspaceName}</code> untuk konfirmasi:
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Ketik nama workspace…"
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: `1.5px solid ${matches ? '#86efac' : 'var(--color-border)'}`,
              fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)',
              boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
            }}
          />
          {typed.length > 0 && !matches && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#dc2626' }}>Nama tidak cocok. Periksa ejaan dan coba lagi.</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, height: 42, background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || loading}
            style={{
              flex: 1, height: 42, borderRadius: 10, border: 'none',
              fontSize: 14, fontWeight: 700, color: '#fff',
              background: matches && !loading ? '#dc2626' : '#fca5a5',
              cursor: matches && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ws-arch-spin 0.7s linear infinite' }} />
            ) : '🔒 Arsipkan Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore Confirm Dialog ───────────────────────────────────────────────────

function RestoreConfirmDialog({
  workspaceName,
  onConfirm,
  onCancel,
  loading,
}: {
  workspaceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 16, padding: '24px 22px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 48 }}>♻️</span>
          <h3 style={{ margin: '10px 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            Pulihkan "{workspaceName}"?
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Workspace ini akan kembali <strong>Aktif</strong>. Semua data sebelumnya tetap utuh dan semua anggota akan mendapatkan kembali akses mereka.
          </p>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              'Status workspace → Aktif',
              'Semua data dan pengaturan tetap terjaga',
              'Anggota mendapatkan kembali akses mereka',
              'Listing Marketplace dapat diaktifkan kembali',
            ].map((line) => (
              <div key={line} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#166534' }}>
                <span>✓</span><span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, height: 42, background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, height: 42, borderRadius: 10, border: 'none',
              fontSize: 14, fontWeight: 700, color: '#fff',
              background: loading ? '#86efac' : 'var(--color-primary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ws-arch-spin 0.7s linear infinite' }} />
            ) : '♻️ Pulihkan Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Info card ────────────────────────────────────────────────────────────────

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      {children}
    </div>
  );
}

function InfoCardHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsArchive() {
  const { activeWorkspace, saveWorkspace, refreshWorkspaces } = useWorkspace();
  const { canArchive, role } = useWorkspacePermission();
  const navigate = useNavigate();

  // Modal state
  const [showArchiveDialog,  setShowArchiveDialog]  = useState(false);
  const [showRestoreDialog,  setShowRestoreDialog]  = useState(false);
  const [loading,            setLoading]            = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  function showToast(kind: ToastState['kind'], message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 5000);
  }

  // ── Archive handler ─────────────────────────────────────────────────────────
  async function handleArchive() {
    if (!activeWorkspace || !canArchive) {
      showToast('error', 'Anda tidak memiliki izin untuk mengarsipkan workspace.');
      return;
    }

    const { blocked, reason } = checkCanArchive(activeWorkspace.workspace_uuid);
    if (blocked) {
      setShowArchiveDialog(false);
      showToast('error', reason ?? 'Workspace tidak dapat diarsipkan saat ini. Silakan coba lagi nanti.');
      return;
    }

    setLoading(true);
    try {
      const result = await saveWorkspace(activeWorkspace.workspace_uuid, {
        workspace_status: 'Archived',
      });

      if (result.ok) {
        setShowArchiveDialog(false);
        // Remove from recent workspaces since it's now inaccessible for switching
        removeRecentWorkspace(activeWorkspace.workspace_uuid);
        refreshWorkspaces();
        showToast('success', `"${activeWorkspace.workspace_name}" berhasil diarsipkan.`);
      } else {
        setShowArchiveDialog(false);
        const msg = result.errors.map((e) => e.message).join(' · ');
        showToast('error', msg || 'Gagal mengarsipkan workspace. Silakan coba lagi.');
      }
    } catch {
      setShowArchiveDialog(false);
      showToast('error', 'Terjadi kesalahan tidak terduga. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // ── Restore handler ─────────────────────────────────────────────────────────
  async function handleRestore() {
    if (!activeWorkspace || !canArchive) {
      showToast('error', 'Anda tidak memiliki izin untuk memulihkan workspace.');
      return;
    }
    setLoading(true);
    try {
      const result = await saveWorkspace(activeWorkspace.workspace_uuid, {
        workspace_status: 'Active',
      });

      if (result.ok) {
        setShowRestoreDialog(false);
        refreshWorkspaces();
        showToast('success', `"${activeWorkspace.workspace_name}" berhasil dipulihkan dan kini Aktif.`);
      } else {
        setShowRestoreDialog(false);
        const msg = result.errors.map((e) => e.message).join(' · ');
        showToast('error', msg || 'Gagal memulihkan workspace. Silakan coba lagi.');
      }
    } catch {
      setShowRestoreDialog(false);
      showToast('error', 'Terjadi kesalahan tidak terduga. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // ── Early returns ───────────────────────────────────────────────────────────

  if (!activeWorkspace) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
        Tidak ada workspace yang dipilih.
      </div>
    );
  }

  if (!canArchive) {
    return (
      <div style={{
        paddingTop: 16, paddingBottom: 40, paddingLeft: 16, paddingRight: 16,
        maxWidth: 540, margin: '0 auto',
      }}>
        <div style={{
          background: '#fef2f2', border: '1.5px solid #fca5a5',
          borderRadius: 14, padding: '28px 22px', textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>🔐</span>
          <h2 style={{ margin: '12px 0 8px', fontSize: 17, fontWeight: 700, color: '#991b1b' }}>
            Diperlukan Akses Owner
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#7f1d1d', lineHeight: 1.5 }}>
            Hanya <strong>Owner</strong> workspace ini yang dapat mengarsipkan atau memulihkannya.
            {role
              ? ` Peran Anda saat ini adalah ${role}.`
              : ' Anda tidak memiliki catatan keanggotaan untuk workspace ini.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: 18, padding: '10px 24px', background: '#dc2626', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const isArchived = activeWorkspace.workspace_status === 'Archived';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
        paddingTop: 16, paddingBottom: 56, paddingLeft: 16, paddingRight: 16,
        background: 'var(--color-bg)', minHeight: '100dvh',
      boxSizing: 'border-box',
    }}>
      <style>{`@keyframes ws-arch-spin { to { transform: rotate(360deg); } }`}</style>

      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}

      {showArchiveDialog && (
        <ArchiveConfirmDialog
          workspaceName={activeWorkspace.workspace_name}
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveDialog(false)}
          loading={loading}
        />
      )}

      {showRestoreDialog && (
        <RestoreConfirmDialog
          workspaceName={activeWorkspace.workspace_name}
          onConfirm={handleRestore}
          onCancel={() => setShowRestoreDialog(false)}
          loading={loading}
        />
      )}

      <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Workspace identity ── */}
        <InfoCard>
          <InfoCardHeader icon="🏢" title="Workspace" />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{activeWorkspace.workspace_name}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: isArchived ? '#fef3c7' : '#dcfce7',
                color:      isArchived ? '#92400e' : '#166534',
              }}>
                {isArchived ? '🔒 Diarsipkan' : '● Aktif'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                {WORKSPACE_TYPE_LABEL[activeWorkspace.workspace_type]}
              </span>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                {activeWorkspace.workspace_slug}
              </span>
            </div>
            {isArchived && activeWorkspace.archived_at && (
              <div style={{ fontSize: 12, color: '#d97706', marginTop: 2 }}>
                Diarsipkan pada {new Date(activeWorkspace.archived_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </InfoCard>

        {/* ── Archive section (shown when Active) ── */}
        {!isArchived && (
          <InfoCard>
            <InfoCardHeader icon="📦" title="Arsipkan Workspace" />
            <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Mengarsipkan menjaga semua data workspace tetapi membuat workspace dalam status hanya-baca. Anda dapat memulihkannya kapan saja.
              </p>

              {/* Blocked consequences */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>🚫 Saat diarsipkan, hal-hal berikut akan diblokir:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['🐄', 'Pembaruan data ternak dan registrasi baru'],
                    ['🌾', 'Perubahan pakan dan inventaris'],
                    ['💊', 'Pembaruan obat dan catatan kesehatan'],
                    ['🛒', 'Listing dan transaksi Marketplace'],
                    ['👥', 'Perubahan manajemen anggota'],
                    ['📊', 'Entri dan pengeditan data Dashboard'],
                  ].map(([icon, text]) => (
                    <ConsequenceItem key={text} icon={icon} text={text} blocked />
                  ))}
                </div>
              </div>

              {/* Allowed */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 8 }}>✅ Anda masih dapat:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['👁️', 'Melihat semua informasi dan riwayat workspace'],
                    ['📤', 'Mengekspor data Anda kapan saja'],
                    ['♻️', 'Memulihkan workspace kapan pun Anda siap'],
                  ].map(([icon, text]) => (
                    <ConsequenceItem key={text} icon={icon} text={text} blocked={false} />
                  ))}
                </div>
              </div>

              {/* Archive button */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                <button
                  onClick={() => setShowArchiveDialog(true)}
                  style={{
                    width: '100%', height: 46,
                    background: '#dc2626', border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  🔒 Arsipkan Workspace Ini
                </button>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
                  Hanya Anda (Owner) yang dapat mengarsipkan atau memulihkan workspace ini.
                </p>
              </div>
            </div>
          </InfoCard>
        )}

        {/* ── Archived state view ── */}
        {isArchived && (
          <>
            {/* Prominent archived banner */}
            <div style={{
              background: '#fef3c7', border: '1.5px solid #fbbf24',
              borderRadius: 14, padding: '20px 18px', textAlign: 'center',
            }}>
              <span style={{ fontSize: 48 }}>🔒</span>
              <h3 style={{ margin: '10px 0 6px', fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                Workspace Ini Telah Diarsipkan
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                Semua data terjaga dan utuh. Workspace saat ini dalam mode hanya-baca.
                Tidak ada perubahan yang dapat dilakukan hingga dipulihkan.
              </p>
            </div>

            {/* What's blocked */}
            <InfoCard>
              <InfoCardHeader icon="🚫" title="Sedang Diblokir" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['🐄', 'Pembaruan data ternak'],
                  ['🌾', 'Perubahan pakan dan inventaris'],
                  ['💊', 'Pembaruan obat dan kesehatan'],
                  ['🛒', 'Aktivitas Marketplace'],
                  ['👥', 'Manajemen anggota'],
                  ['📊', 'Perubahan Dashboard'],
                ].map(([icon, text]) => (
                  <ConsequenceItem key={text} icon={icon} text={text} blocked />
                ))}
              </div>
            </InfoCard>

            {/* What's still allowed */}
            <InfoCard>
              <InfoCardHeader icon="✅" title="Masih Tersedia" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['👁️', 'Melihat semua data dan riwayat workspace'],
                  ['📤', 'Mengekspor data workspace'],
                  ['♻️', 'Memulihkan workspace kapan saja'],
                ].map(([icon, text]) => (
                  <ConsequenceItem key={text} icon={icon} text={text} blocked={false} />
                ))}
              </div>
            </InfoCard>

            {/* Restore section */}
            <InfoCard>
              <InfoCardHeader icon="♻️" title="Pulihkan Workspace" />
              <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  Pemulihan akan membuat workspace ini kembali <strong>Aktif</strong>. Semua data, pengaturan, dan akses anggota sebelumnya akan sepenuhnya dipulihkan.
                </p>
                <button
                  onClick={() => setShowRestoreDialog(true)}
                  style={{
                    width: '100%', height: 46,
                    background: 'var(--color-primary)', border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  ♻️ Pulihkan Workspace Ini
                </button>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
                  Hanya Anda (Owner) yang dapat mengarsipkan atau memulihkan workspace ini.
                </p>
              </div>
            </InfoCard>
          </>
        )}

        {/* ── Security note ── */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>Jaminan Keamanan Data</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Pengarsipan tidak pernah menghapus data apapun. Workspace, anggota, catatan ternak, dan seluruh riwayat Anda tersimpan permanen dan dapat dipulihkan kapan saja.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
