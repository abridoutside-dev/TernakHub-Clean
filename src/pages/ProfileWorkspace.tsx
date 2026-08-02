// ─── Profile Workspace Management — PROFILE-002 (revised) ─────────────────────
//
// Mengelola daftar workspace milik pengguna.
// BUKAN Workspace Switcher — switching tetap di Global Header.
//
// Data source: WorkspaceContext (Supabase via workspaceRepository → workspaceService).
// "Tambah" redirects to /workspace/create (the canonical creation flow).
// Archive/Restore/Edit go through saveWorkspace() from WorkspaceContext.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import {
  WORKSPACE_TYPE_LABEL,
  WORKSPACE_PLAN_LABEL,
  type WorkspaceRecord,
  type WorkspaceUpdateInput,
} from '../types/workspace';
// LEGACY — scheduled removal after production migration.
// workspace_members is not yet in Supabase; member data served from in-memory store.
import { getMembersByWorkspace } from '../data/workspaceMembersData';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';

// ─── Type → icon mapping ───────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  Farm:       '🐄',
  FeedStore:  '🌾',
  Veterinary: '🩺',
  Transport:  '🚚',
};

function wsIcon(ws: WorkspaceRecord): string {
  return TYPE_ICON[ws.workspace_type] ?? '🏢';
}

// ─── Status / plan badge helpers ───────────────────────────────────────────────

const STATUS_CONFIG = {
  Active:   { label: '● Aktif',      color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Inactive: { label: '○ Nonaktif',   color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Archived: { label: '📦 Diarsipkan', color: '#6b7280', bg: '#f1f5f9', border: '#cbd5e1' },
} as const;

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Free:       { label: 'Free',       color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
  Pro:        { label: '⭐ Pro',      color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  Enterprise: { label: '🏆 Enterprise', color: '#7e22ce', bg: '#ede9fe', border: '#c4b5fd' },
};

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '48px 24px', textAlign: 'center',
      background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 16px)',
      border: '1px dashed var(--color-border)',
    }}>
      <span style={{ fontSize: 48 }}>🏢</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada workspace</div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', maxWidth: 260 }}>
        Buat workspace pertama Anda untuk mulai mengelola peternakan.
      </div>
      <button
        onClick={onAdd}
        style={{
          marginTop: 4, padding: '10px 24px',
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Buat Workspace
      </button>
    </div>
  );
}

// ─── Workspace Card ────────────────────────────────────────────────────────────

function WorkspaceCard({
  ws,
  isActive,
  memberCount,
  onDetail,
  onEdit,
  onMembers,
  onArchive,
  onRestore,
}: {
  ws: WorkspaceRecord;
  isActive: boolean;
  memberCount: number;
  onDetail: () => void;
  onEdit: (allowed: boolean) => void;
  onMembers: () => void;
  onArchive: (allowed: boolean) => void;
  onRestore: (allowed: boolean) => void;
}) {
  const { can, canArchive, loading } = useWorkspacePermission(ws.workspace_uuid);
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[ws.workspace_status] ?? STATUS_CONFIG.Active;
  const planCfg   = PLAN_CONFIG[ws.workspace_plan] ?? PLAN_CONFIG.Free;
  const icon      = wsIcon(ws);
  const isArchived = ws.workspace_status === 'Archived';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md, 12px)',
      overflow: 'hidden',
      boxShadow: isActive ? '0 0 0 3px var(--color-primary-light)' : 'var(--shadow-sm)',
      position: 'relative',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px' }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-sm, 8px)',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>
          {icon}
        </div>

        {/* Name + type */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180,
            }}>
              {ws.workspace_name}
            </span>
            {isActive && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--color-primary)',
                background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)',
                borderRadius: 10, padding: '1px 6px', flexShrink: 0,
              }}>
                ● AKTIF
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            {icon} {WORKSPACE_TYPE_LABEL[ws.workspace_type] ?? ws.workspace_type}
            {ws.city ? ` · ${ws.city}` : ''}
          </div>
        </div>

        {/* ⋮ Menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, lineHeight: 1,
            }}
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
              <div style={{
                position: 'absolute', top: '100%', right: 0,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 201, minWidth: 170, overflow: 'hidden',
              }}>
                {[
                  can('workspaceSettings', 'view') && { label: '🔍 Lihat Detail', action: () => { setMenuOpen(false); onDetail(); } },
                  !loading && can('workspaceSettings', 'update') && { label: '✏️ Edit Workspace', action: () => { setMenuOpen(false); onEdit(can('workspaceSettings', 'update')); } },
                  !loading && can('memberManagement', 'view') && { label: '👥 Kelola Anggota', action: () => { setMenuOpen(false); onMembers(); } },
                  !loading && canArchive && (isArchived
                    ? { label: '♻️ Pulihkan', action: () => { setMenuOpen(false); onRestore(canArchive); } }
                    : { label: '📦 Arsipkan', action: () => { setMenuOpen(false); onArchive(canArchive); } }),
                ].filter((item): item is { label: string; action: () => void } => Boolean(item)).map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      display: 'block', width: '100%', padding: '11px 16px',
                      background: 'none', border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'left', fontSize: 13, fontWeight: 500,
                      color: item.label.startsWith('📦') ? '#dc2626' : 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Plan */}
        <span style={{
          fontSize: 11, fontWeight: 700, color: planCfg.color,
          background: planCfg.bg, border: `1px solid ${planCfg.border}`,
          borderRadius: 10, padding: '2px 8px',
        }}>
          {planCfg.label}
        </span>

        {/* Status */}
        <span style={{
          fontSize: 11, fontWeight: 600, color: statusCfg.color,
          background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
          borderRadius: 10, padding: '2px 8px',
        }}>
          {statusCfg.label}
        </span>

        {/* Member count */}
        <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}>
          👥 {memberCount} anggota
        </span>
      </div>

      {/* Clickable overlay for detail nav */}
      <button
        onClick={onDetail}
        aria-label={`Lihat detail ${ws.workspace_name}`}
        style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 0 }}
      />
    </div>
  );
}

// ─── Workspace Edit Sheet ──────────────────────────────────────────────────────

function WorkspaceEditSheet({
  ws,
  onSave,
  onClose,
  saving,
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
  const [country,     setCountry]     = useState(ws.country ?? '');
  const [province,    setProvince]    = useState(ws.province ?? '');
  const [city,        setCity]        = useState(ws.city ?? '');
  const [address,     setAddress]     = useState(ws.address ?? '');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 14,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };
  const fieldErr = (f: string): React.CSSProperties =>
    errors[f] ? { ...fieldStyle, borderColor: '#dc2626' } : fieldStyle;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim())             e.name = 'Nama workspace tidak boleh kosong.';
    else if (name.trim().length < 2) e.name = 'Nama minimal 2 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const patch: WorkspaceUpdateInput = {
      logo_url:       logoUrl.trim() || null,
      workspace_name: name.trim(),
      description:    description.trim() || null,
      phone:          phone.trim()       || null,
      email:          email.trim()       || null,
      country:        country.trim()     || null,
      province:       province.trim()    || null,
      city:           city.trim()        || null,
      address:        address.trim()     || null,
    };
    onSave(patch);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        zIndex: 401, maxHeight: '92vh', overflow: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 14px', borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Edit Workspace</span>
          <button onClick={onClose} style={{
            background: 'var(--color-bg)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer',
          }}>✕</button>
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
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={fieldStyle}
              disabled={saving}
            />
          </div>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Nama Workspace <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Contoh: Berkah Farm Garut"
              style={fieldErr('name')} disabled={saving} />
            {errors.name && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.name}</span>}
          </div>

          {/* Type — read-only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Tipe Workspace</label>
            <div style={{ ...fieldStyle, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{TYPE_ICON[ws.workspace_type] ?? '🏢'}</span>
              <span>{WORKSPACE_TYPE_LABEL[ws.workspace_type] ?? ws.workspace_type}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-border)' }}>🔒 read-only</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Deskripsi singkat workspace Anda..."
              style={{ ...fieldStyle, resize: 'none' }} disabled={saving} />
          </div>

          {/* Location */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
            Lokasi
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Provinsi</label>
              <input value={province} onChange={(e) => setProvince(e.target.value)}
                placeholder="Jawa Barat" style={fieldStyle} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Kota / Kabupaten</label>
              <input value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Garut" style={fieldStyle} disabled={saving} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Negara</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="Indonesia" style={fieldStyle} disabled={saving} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Alamat</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)}
              rows={2} placeholder="Alamat lengkap..."
              style={{ ...fieldStyle, resize: 'none' }} disabled={saving} />
          </div>

          {/* Contact */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
            Kontak
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Telepon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812-3456-7890" style={fieldStyle} disabled={saving} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="workspace@example.com" style={fieldStyle} disabled={saving} />
          </div>
        </div>

        <div style={{ padding: '8px 20px 16px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '13px',
              background: saving ? 'var(--color-border)' : 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? (
              <>
                <span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pw-spin 0.7s linear infinite' }} />
                Menyimpan…
              </>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Archive Confirm Dialog ────────────────────────────────────────────────────

function ArchiveConfirmDialog({
  wsName,
  onConfirm,
  onClose,
  saving,
}: {
  wsName: string;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg, 16px)',
        padding: '24px 20px', zIndex: 501, width: 'min(340px, 90vw)',
        textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Arsipkan Workspace?
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Workspace <strong>"{wsName}"</strong> akan diarsipkan. Data tetap tersimpan dan dapat dipulihkan kapan saja.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={{
            flex: 1, padding: '10px', background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)', borderRadius: 10,
            fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer',
          }}>Batal</button>
          <button onClick={onConfirm} disabled={saving} style={{
            flex: 1, padding: '10px', background: saving ? '#fca5a5' : '#dc2626',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {saving
              ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pw-spin 0.7s linear infinite' }} />
              : 'Arsipkan'}
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
      <div style={{
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%', pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 16, color: ok ? '#166534' : '#dc2626', flexShrink: 0 }}>{ok ? '✓' : '⚠'}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ok ? '#166534' : '#991b1b' }}>{msg}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: ok ? '#166534' : '#dc2626', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type WorkspaceActionTarget = {
  workspace: WorkspaceRecord;
  allowed: boolean;
};

export default function ProfileWorkspace() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workspaces, activeWorkspace, saveWorkspace, refreshWorkspaces } = useWorkspace();

  const currentUserId = currentUser?.id ?? '';

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [editTarget,    setEditTarget]    = useState<WorkspaceActionTarget | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceActionTarget | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  }

  // ── Derived lists ─────────────────────────────────────────────────────────────
  // Show workspaces the current user owns (by owner_user_uuid) or is a member of
  const myWorkspaces = workspaces.filter(
    (w) => w.owner_user_uuid === currentUserId || getMembersByWorkspace(w.workspace_uuid).some((m) => m.user_id === currentUserId)
  );
  const activeList   = myWorkspaces.filter((w) => w.workspace_status !== 'Archived');
  const arsipList    = myWorkspaces.filter((w) => w.workspace_status === 'Archived');

  // ── Edit handler ──────────────────────────────────────────────────────────────
  async function handleEdit(ws: WorkspaceRecord, patch: WorkspaceUpdateInput, allowed: boolean) {
    if (!allowed) {
      showToast('Anda tidak memiliki izin untuk memperbarui workspace.', false);
      return;
    }
    // The card performs the resolved check; keep this boundary defensive.
    if (getMembersByWorkspace(ws.workspace_uuid).every((member) => member.user_id !== currentUserId)) {
      showToast('Anda bukan anggota workspace ini.', false);
      return;
    }
    setSaving(true);
    const result = await saveWorkspace(ws.workspace_uuid, patch);
    setSaving(false);
    if (result.ok) {
      setEditTarget(null);
      refreshWorkspaces();
      showToast('Workspace berhasil diperbarui.', true);
    } else {
      const msg = result.errors.map((e) => e.message).join(' · ');
      showToast(msg || 'Gagal menyimpan perubahan.', false);
    }
  }

  // ── Archive handler ───────────────────────────────────────────────────────────
  async function handleArchive(ws: WorkspaceRecord, allowed: boolean) {
    if (!allowed) {
      showToast('Anda tidak memiliki izin untuk mengarsipkan workspace.', false);
      return;
    }
    if (getMembersByWorkspace(ws.workspace_uuid).every((member) => member.user_id !== currentUserId)) {
      showToast('Anda bukan anggota workspace ini.', false);
      return;
    }
    // Guard: cannot archive the currently active workspace — user must switch first.
    if (ws.workspace_uuid === activeWorkspace?.workspace_uuid) {
      setArchiveTarget(null);
      showToast('Workspace ini sedang aktif. Pindah ke workspace lain terlebih dahulu sebelum mengarsipkannya.', false);
      return;
    }
    setSaving(true);
    const result = await saveWorkspace(ws.workspace_uuid, { workspace_status: 'Archived' });
    setSaving(false);
    setArchiveTarget(null);
    if (result.ok) {
      refreshWorkspaces();
      showToast(`"${ws.workspace_name}" berhasil diarsipkan.`, true);
    } else {
      const msg = result.errors.map((e) => e.message).join(' · ');
      showToast(msg || 'Gagal mengarsipkan workspace.', false);
    }
  }

  // ── Restore handler ───────────────────────────────────────────────────────────
  async function handleRestore(ws: WorkspaceRecord, allowed: boolean) {
    if (!allowed) {
      showToast('Anda tidak memiliki izin untuk memulihkan workspace.', false);
      return;
    }
    if (getMembersByWorkspace(ws.workspace_uuid).every((member) => member.user_id !== currentUserId)) {
      showToast('Anda bukan anggota workspace ini.', false);
      return;
    }
    const result = await saveWorkspace(ws.workspace_uuid, { workspace_status: 'Active' });
    if (result.ok) {
      refreshWorkspaces();
      showToast(`"${ws.workspace_name}" berhasil dipulihkan.`, true);
    } else {
      const msg = result.errors.map((e) => e.message).join(' · ');
      showToast(msg || 'Gagal memulihkan workspace.', false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      paddingTop: 16, paddingBottom: 40, paddingLeft: 16, paddingRight: 16,
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column', gap: 20,
      boxSizing: 'border-box', maxWidth: 720, margin: '0 auto',
    }}>
      <style>{`@keyframes pw-spin { to { transform: rotate(360deg); } }`}</style>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={() => setToast(null)} />}

      {/* Header info */}
      <div style={{
        padding: '14px 16px', background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
            {myWorkspaces.length} Workspace
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            {activeList.length} aktif · {arsipList.length} diarsipkan
          </div>
        </div>
        <button
          onClick={() => navigate('/workspace/create')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          + Buat Baru
        </button>
      </div>

      {/* Workspace Aktif */}
      {activeList.length === 0 && arsipList.length === 0 ? (
        <EmptyState onAdd={() => navigate('/workspace/create')} />
      ) : activeList.length === 0 ? null : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10, paddingLeft: 4 }}>
            AKTIF ({activeList.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeList.map((ws) => (
              <WorkspaceCard
                key={ws.workspace_uuid}
                ws={ws}
                isActive={ws.workspace_uuid === activeWorkspace?.workspace_uuid}
                memberCount={getMembersByWorkspace(ws.workspace_uuid).length}
                onDetail={() => navigate(`/profile/workspace/${ws.workspace_uuid}`)}
                onEdit={(allowed) => { if (allowed) setEditTarget({ workspace: ws, allowed }); }}
                onMembers={() => navigate(`/profile/workspace/${ws.workspace_uuid}/members`)}
                onArchive={(allowed) => { if (allowed) setArchiveTarget({ workspace: ws, allowed }); }}
                onRestore={(allowed) => { void handleRestore(ws, allowed); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Arsip */}
      {arsipList.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10, paddingLeft: 4 }}>
            DIARSIPKAN ({arsipList.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {arsipList.map((ws) => (
              <WorkspaceCard
                key={ws.workspace_uuid}
                ws={ws}
                isActive={false}
                memberCount={getMembersByWorkspace(ws.workspace_uuid).length}
                onDetail={() => navigate(`/profile/workspace/${ws.workspace_uuid}`)}
                onEdit={(allowed) => { if (allowed) setEditTarget({ workspace: ws, allowed }); }}
                onMembers={() => navigate(`/profile/workspace/${ws.workspace_uuid}/members`)}
                onArchive={(allowed) => { if (allowed) setArchiveTarget({ workspace: ws, allowed }); }}
                onRestore={(allowed) => { void handleRestore(ws, allowed); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plan info section */}
      <div style={{
        padding: '12px 14px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: 10,
        fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>Plan Workspace</div>
        {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
            <span style={{ fontSize: 11 }}>{(WORKSPACE_PLAN_LABEL as Record<string, string>)[key] ?? key}</span>
          </div>
        ))}
      </div>

      {/* Note — bukan workspace switcher */}
      <div style={{
        padding: '12px 14px', background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)', borderRadius: 10,
        fontSize: 12, color: 'var(--color-primary)', lineHeight: 1.5,
      }}>
        💡 <strong>Info:</strong> Untuk berpindah workspace aktif, gunakan tombol workspace di bagian atas layar (Global Header).
      </div>

      {/* Edit Sheet */}
      {editTarget && (
        <WorkspaceEditSheet
          ws={editTarget.workspace}
          onSave={(patch) => handleEdit(editTarget.workspace, patch, editTarget.allowed)}
          onClose={() => setEditTarget(null)}
          saving={saving}
        />
      )}

      {/* Archive Confirm */}
      {archiveTarget && (
        <ArchiveConfirmDialog
          wsName={archiveTarget.workspace.workspace_name}
          onConfirm={() => handleArchive(archiveTarget.workspace, archiveTarget.allowed)}
          onClose={() => setArchiveTarget(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
