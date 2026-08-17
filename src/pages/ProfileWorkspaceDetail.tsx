// ─── Profile Workspace Detail — PROFILE-002 (revised) ────────────────────────
//
// Route: /profile/workspace/:id
// Shows detail for a single workspace, keyed by workspace_uuid.
// Data source: WorkspaceContext (Supabase via workspaceRepository → workspaceService).
// Edit/Archive/Restore go through saveWorkspace() from context.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubscription } from '../contexts/SubscriptionContext';
// LEGACY — scheduled removal after production migration.
// workspace_members is not yet in Supabase; member data served from in-memory store.
import { getMembersByWorkspace } from '../data/workspaceMembersData';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
import {
  WORKSPACE_TYPE_LABEL,
  WORKSPACE_PLAN_LABEL,
  WORKSPACE_STATUS_LABEL,
  type WorkspaceDependencies,
  type WorkspacePlan,
  type WorkspaceRecord,
  type WorkspaceUpdateInput,
} from '../types/workspace';
import { PLAN_CONFIG, PLAN_ORDER } from '../data/workspaceSubscriptionData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  Farm: '🐄', FeedStore: '🌾', Veterinary: '🩺', Transport: '🚚',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--color-text)', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word', lineHeight: 1.4 }}>
        {value || '—'}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>{title}</div>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Edit Sheet ────────────────────────────────────────────────────────────────

function EditWorkspaceSheet({
  ws, onSave, onClose, saving,
}: {
  ws: WorkspaceRecord;
  onSave: (patch: WorkspaceUpdateInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [logoUrl,     setLogoUrl]     = useState(ws.logo_url ?? '');
  const [name,        setName]        = useState(ws.workspace_name);
  const [description, setDescription] = useState(ws.description ?? '');
  const [phone,       setPhone]       = useState(ws.phone ?? '');
  const [email,       setEmail]       = useState(ws.email ?? '');
  const [province,    setProvince]    = useState(ws.province ?? '');
  const [city,        setCity]        = useState(ws.city ?? '');
  const [address,     setAddress]     = useState(ws.address ?? '');
  const [error,       setError]       = useState('');

  const fs: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  function handleSave() {
    if (!name.trim()) { setError('Nama tidak boleh kosong.'); return; }
    onSave({
      logo_url:       logoUrl.trim() || null,
      workspace_name: name.trim(),
      description:    description.trim() || null,
      phone:          phone.trim()       || null,
      email:          email.trim()       || null,
      province:       province.trim()    || null,
      city:           city.trim()        || null,
      address:        address.trim()     || null,
    });
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', zIndex: 401, maxHeight: '92vh', overflow: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Edit Workspace</span>
          <button onClick={onClose} style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Logo URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Foto / Logo (URL)</label>
            {logoUrl.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <img src={logoUrl.trim()} alt="preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span style={{ fontSize: 11, color: 'var(--color-muted)', wordBreak: 'break-all' }}>{logoUrl.trim()}</span>
              </div>
            )}
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" style={fs} disabled={saving} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Nama <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} style={{ ...fs, borderColor: error ? '#dc2626' : 'var(--color-border)' }} disabled={saving} />
            {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...fs, resize: 'none' }} disabled={saving} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>Lokasi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Provinsi</label>
              <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Jawa Barat" style={fs} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Kota</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Garut" style={fs} disabled={saving} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Alamat</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} style={{ ...fs, resize: 'none' }} disabled={saving} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>Kontak</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Telepon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 812-..." style={fs} disabled={saving} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fs} disabled={saving} />
          </div>
        </div>
        <div style={{ padding: '8px 20px 16px' }}>
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '13px', background: saving ? 'var(--color-border)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving ? <><span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pwd-spin 0.7s linear infinite' }} />Menyimpan…</> : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Archive Confirm Dialog ────────────────────────────────────────────────────

function ArchiveConfirmDialog({ wsName, onConfirm, onClose }: { wsName: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 16px)', padding: '24px 20px', zIndex: 501, width: 'min(340px, 90vw)', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Arsipkan Workspace?</div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          <strong>"{wsName}"</strong> akan diarsipkan. Data tetap tersimpan dan dapat dipulihkan kapan saja.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>Batal</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Arsipkan</button>
        </div>
      </div>
    </>
  );
}

// ─── Delete preflight dialog ─────────────────────────────────────────────────

function DeleteWorkspaceDialog({
  workspace,
  dependencies,
  loading,
  onConfirm,
  onClose,
}: {
  workspace: WorkspaceRecord;
  dependencies: WorkspaceDependencies | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === workspace.workspace_name;
  const blocked = dependencies?.hasDeleteBlockers ?? true;
  const dependencyCount = dependencies?.items.reduce((total, item) => total + item.count, 0) ?? 0;

  return (
    <>
      <div onClick={loading ? undefined : onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500 }} />
      <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 16px)', padding: '24px 20px', zIndex: 501, width: 'min(440px, 92vw)', maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 38, textAlign: 'center', marginBottom: 10 }}>🗑️</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center' }}>Hapus Workspace?</div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5, marginTop: 8, textAlign: 'center' }}>
          Penghapusan bersifat permanen dan tidak menghapus child data secara otomatis.
        </div>

        {dependencies === null ? (
          <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'var(--color-bg)', color: 'var(--color-muted)', textAlign: 'center', fontSize: 13 }}>
            Memeriksa dependency workspace…
          </div>
        ) : (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: blocked ? '#fef2f2' : '#f0fdf4', border: `1px solid ${blocked ? '#fca5a5' : '#86efac'}`, color: blocked ? '#991b1b' : '#166534', fontSize: 13, lineHeight: 1.45 }}>
              {blocked
                ? `Delete diblokir. Ditemukan ${dependencyCount} dependency yang masih terkait.`
                : 'Tidak ada dependency yang menghalangi penghapusan.'}
            </div>
            {dependencies.items.length > 0 && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                {dependencies.items.map((item) => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 12px', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    <strong style={{ color: item.blocksDelete ? '#dc2626' : 'var(--color-text)', flexShrink: 0 }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!blocked && dependencies && (
          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
              Ketik <code style={{ background: 'var(--color-bg)', padding: '1px 5px', borderRadius: 4 }}>{workspace.workspace_name}</code> untuk konfirmasi:
            </label>
            <input autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} disabled={loading} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${matches ? '#86efac' : 'var(--color-border)'}`, background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14 }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: 11, background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>Batal</button>
          <button onClick={onConfirm} disabled={loading || !dependencies || blocked || !matches} style={{ flex: 1, padding: 11, background: !loading && dependencies && !blocked && matches ? '#dc2626' : '#fca5a5', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: !loading && dependencies && !blocked && matches ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Memproses…' : 'Hapus Permanen'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDismiss }: { msg: string; ok: boolean; onDismiss: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 'calc(var(--top-app-bar-height) + 8px)', left: 0, right: 0, zIndex: 600, display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none' }}>
      <div style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%', pointerEvents: 'all' }}>
        <span style={{ fontSize: 16, color: ok ? '#166534' : '#dc2626', flexShrink: 0 }}>{ok ? '✓' : '⚠'}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ok ? '#166534' : '#991b1b' }}>{msg}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: ok ? '#166534' : '#dc2626', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 48 }}>🔍</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Workspace tidak ditemukan</div>
      <button onClick={() => navigate('/profile/workspace')} style={{ padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Kembali</button>
    </div>
  );
}

// ─── Subscription Section ──────────────────────────────────────────────────────

function SubscriptionSection() {
  const { plan: currentPlan } = useSubscription();
  const currentCfg = PLAN_CONFIG[currentPlan] ?? PLAN_CONFIG.Free;
  const [changeOpen, setChangeOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<WorkspacePlan | null>(null);

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const canUpgrade = currentIdx < PLAN_ORDER.length - 1;
  const canDowngrade = currentIdx > 0;

  function handleRequestChange(plan: WorkspacePlan) {
    setTargetPlan(plan);
    setChangeOpen(true);
  }

  function handleConfirmChange() {
    if (!targetPlan) return;
    alert(`Permintaan perubahan paket ke ${PLAN_CONFIG[targetPlan].label} telah dicatat. Hubungi administrator platform untuk proses selanjutnya.`);
    setChangeOpen(false);
    setTargetPlan(null);
  }

  return (
    <>
      <SectionCard title="LANGGANAN & PAKET">
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current Plan */}
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

          {/* Actions */}
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

          {/* All Plans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 8 }}>
            ℹ️ Perubahan paket dilakukan oleh administrator platform. Hubungi admin untuk upgrade atau downgrade paket Workspace ini.
          </div>
        </div>
      </SectionCard>

      {/* Plan Change Confirmation Dialog */}
      {changeOpen && targetPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setChangeOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Konfirmasi Perubahan Paket</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Anda akan mengajukan perubahan paket dari <strong>{currentCfg.label}</strong> ke <strong>{PLAN_CONFIG[targetPlan].label}</strong>.
              <br /><br />
              Perubahan paket hanya dapat dilakukan oleh administrator platform. Hubungi admin untuk melanjutkan.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setChangeOpen(false)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleConfirmChange} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Ajukan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileWorkspaceDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    workspaces,
    activeWorkspace,
    saveWorkspace,
    deleteWorkspace,
    getWorkspaceDependencies,
  } = useWorkspace();

  const [editOpen,       setEditOpen]       = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [dependencies,   setDependencies]   = useState<WorkspaceDependencies | null>(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  }

  if (!id) return <NotFound navigate={navigate} />;

  const wsFound = workspaces.find((w) => w.workspace_uuid === id) ?? null;
  if (!wsFound) return <NotFound navigate={navigate} />;
  // Capture as non-optional const so TypeScript narrows correctly in async closures.
  const ws = wsFound;
  const { can, canArchive } = useWorkspacePermission(ws.workspace_uuid);
  const canUpdate = can('workspaceSettings', 'update');
  const canViewMembers = can('memberManagement', 'view');

  const isActive   = ws.workspace_uuid === activeWorkspace?.workspace_uuid;
  const isArchived = ws.workspace_status === 'Archived';
  const members    = getMembersByWorkspace(ws.workspace_uuid);
  const icon       = TYPE_ICON[ws.workspace_type] ?? '🏢';

  // Status badge styling
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    Active:   { color: '#166534', bg: '#dcfce7', border: '#86efac' },
    Inactive: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
    Archived: { color: '#6b7280', bg: '#f1f5f9', border: '#cbd5e1' },
  };
  const sc = statusColors[ws.workspace_status] ?? statusColors.Active;
  const pc = PLAN_CONFIG[ws.workspace_plan] ?? PLAN_CONFIG.Free;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleEdit(patch: WorkspaceUpdateInput) {
    if (!canUpdate) {
      showToast('Anda tidak memiliki izin untuk memperbarui workspace.', false);
      return;
    }
    setSaving(true);
    const result = await saveWorkspace(ws.workspace_uuid, patch);
    setSaving(false);
    if (result.ok) {
      setEditOpen(false);
      showToast('Workspace berhasil diperbarui.', true);
    } else {
      const msg = result.errors.map((e) => e.message).join(' · ');
      showToast(msg || 'Gagal menyimpan.', false);
    }
  }

  async function handleArchive() {
    if (!canArchive) {
      showToast('Anda tidak memiliki izin untuk mengarsipkan workspace.', false);
      return;
    }
    // Guard: cannot archive the currently active workspace — user must switch first.
    if (isActive) {
      setArchiveConfirm(false);
      showToast('Workspace ini sedang aktif. Pindah ke workspace lain terlebih dahulu sebelum mengarsipkannya.', false);
      return;
    }
    const result = await saveWorkspace(ws.workspace_uuid, { workspace_status: 'Archived' });
    if (result.ok) { setArchiveConfirm(false); showToast(`"${ws.workspace_name}" diarsipkan.`, true); }
    else showToast('Gagal mengarsipkan workspace.', false);
  }

  async function handleRestore() {
    if (!canArchive) {
      showToast('Anda tidak memiliki izin untuk memulihkan workspace.', false);
      return;
    }
    const result = await saveWorkspace(ws.workspace_uuid, { workspace_status: 'Active' });
    if (result.ok) { showToast(`"${ws.workspace_name}" dipulihkan.`, true); }
    else showToast('Gagal memulihkan workspace.', false);
  }

  async function openDeleteDialog() {
    if (!can('workspaceSettings', 'delete')) {
      showToast('Anda tidak memiliki izin untuk menghapus workspace.', false);
      return;
    }
    setDeleteOpen(true);
    setDependencies(null);
    try {
      setDependencies(await getWorkspaceDependencies(ws.workspace_uuid));
    } catch (error) {
      setDeleteOpen(false);
      showToast(error instanceof Error ? error.message : 'Gagal membaca dependency workspace.', false);
    }
  }

  async function handleDelete() {
    if (!dependencies || dependencies.hasDeleteBlockers) return;
    setDeleteLoading(true);
    const result = await deleteWorkspace(ws.workspace_uuid, dependencies);
    setDeleteLoading(false);
    if (result.ok && result.data.deleted) {
      setDeleteOpen(false);
      navigate('/profile/workspace');
      return;
    }
    if (!result.ok && result.dependencies) setDependencies(result.dependencies);
    showToast(result.ok ? 'Workspace tidak ditemukan.' : result.errors.map((error) => error.message).join(' · '), false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingTop: 16, paddingBottom: 40, paddingLeft: 16, paddingRight: 16, minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box', maxWidth: 720, margin: '0 auto' }}>
      <style>{`@keyframes pwd-spin { to { transform: rotate(360deg); } }`}</style>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={() => setToast(null)} />}

      {/* Banner + Header Card */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 16px)', border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`, overflow: 'hidden', boxShadow: isActive ? '0 0 0 3px var(--color-primary-light)' : 'var(--shadow-sm)' }}>
        {/* Banner */}
        <div style={{ height: 100, background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.85 }}>
          {icon}
        </div>
        {/* Logo + name */}
        <div style={{ padding: '0 20px 20px', position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-md, 12px)', background: 'var(--color-primary-light)', border: `3px solid ${isActive ? 'var(--color-primary)' : 'var(--color-surface)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginTop: -36, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {icon}
          </div>
          {isActive && (
            <div style={{ position: 'absolute', top: -16, right: 20, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 10, padding: '2px 8px' }}>
              ● WORKSPACE AKTIF
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{ws.workspace_name}</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>
              {icon} {WORKSPACE_TYPE_LABEL[ws.workspace_type] ?? ws.workspace_type}
              {ws.city ? ` · ${ws.city}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 10, padding: '2px 8px' }}>
                {WORKSPACE_PLAN_LABEL[ws.workspace_plan] ?? ws.workspace_plan}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: '2px 8px' }}>
                {WORKSPACE_STATUS_LABEL[ws.workspace_status] ?? ws.workspace_status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
                👥 {members.length} anggota
              </span>
            </div>
          </div>
          {ws.description && (
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>{ws.description}</div>
          )}
        </div>
      </div>

      {/* Info Workspace */}
      <SectionCard title="INFORMASI WORKSPACE">
        <InfoRow label="Tipe"          value={`${icon} ${WORKSPACE_TYPE_LABEL[ws.workspace_type] ?? ws.workspace_type}`} />
        <InfoRow label="Status"        value={WORKSPACE_STATUS_LABEL[ws.workspace_status] ?? ws.workspace_status} />
        <InfoRow label="Plan"          value={WORKSPACE_PLAN_LABEL[ws.workspace_plan] ?? ws.workspace_plan} />
        <InfoRow label="Slug"          value={ws.workspace_slug} mono />
        <InfoRow label="Dibuat"        value={new Date(ws.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
        {isArchived && ws.archived_at && (
          <InfoRow label="Diarsipkan"  value={new Date(ws.archived_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
        )}
      </SectionCard>

      <SubscriptionSection />

      {/* Lokasi & Kontak */}
      <SectionCard title="LOKASI & KONTAK">
        <InfoRow label="Negara"    value={ws.country} />
        <InfoRow label="Provinsi"  value={ws.province} />
        <InfoRow label="Kota"      value={ws.city} />
        <InfoRow label="Alamat"    value={ws.address} />
        <InfoRow label="Telepon"   value={ws.phone} />
        <InfoRow label="Email"     value={ws.email} />
        <InfoRow label="Website"   value={ws.website} />
      </SectionCard>

      {/* ID Workspace */}
      <SectionCard title="ID WORKSPACE">
        <div style={{ padding: '13px 16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-muted)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '5px 8px', wordBreak: 'break-all' }}>
            {ws.workspace_uuid}
          </div>
        </div>
      </SectionCard>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canViewMembers && <button onClick={() => navigate('/workspace/settings/members')} style={{ width: '100%', padding: '13px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          👥 Kelola Anggota
        </button>}
        {canUpdate && <button onClick={() => setEditOpen(true)} style={{ width: '100%', padding: '13px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          ✏️ Edit Workspace
        </button>}
        {canArchive && isArchived ? (
          <button onClick={handleRestore} style={{ width: '100%', padding: '13px', background: 'transparent', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ♻️ Pulihkan Workspace
          </button>
        ) : canArchive && (
          <button onClick={() => setArchiveConfirm(true)} style={{ width: '100%', padding: '13px', background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📦 Arsipkan Workspace
          </button>
        )}
        {can('workspaceSettings', 'delete') && (
          <button onClick={() => void openDeleteDialog()} style={{ width: '100%', padding: '13px', background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🗑️ Hapus Workspace
          </button>
        )}
      </div>

      {isActive && (
        <div style={{ padding: '10px 14px', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 10, fontSize: 12, color: 'var(--color-primary)', lineHeight: 1.5 }}>
          💡 Ini adalah workspace aktif Anda saat ini. Untuk berpindah workspace, gunakan menu di bagian atas layar.
        </div>
      )}

      {editOpen && (
        <EditWorkspaceSheet ws={ws} onSave={handleEdit} onClose={() => setEditOpen(false)} saving={saving} />
      )}
      {archiveConfirm && (
        <ArchiveConfirmDialog wsName={ws.workspace_name} onConfirm={handleArchive} onClose={() => setArchiveConfirm(false)} />
      )}
      {deleteOpen && (
        <DeleteWorkspaceDialog
          workspace={ws}
          dependencies={dependencies}
          loading={deleteLoading}
          onConfirm={() => void handleDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
