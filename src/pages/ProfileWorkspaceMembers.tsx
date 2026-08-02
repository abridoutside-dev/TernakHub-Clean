// ─── Profile Workspace Members — AUTH-002D ────────────────────────────────────
//
// Route: /profile/workspace/:id/members
//
// Menampilkan dan mengelola seluruh anggota sebuah workspace, termasuk:
//   • Anggota aktif (status Aktif)
//   • Anggota diarsipkan / nonaktif (status Diarsipkan)
//   • Undangan tertunda (status Menunggu Undangan)
//   • Undangan ditolak (status Ditolak)
//
// Fitur:
//   • Pencarian anggota (nama / email)
//   • Filter berdasarkan Role
//   • Filter berdasarkan Status
//   • Ubah role anggota (Owner/Admin via permission resolver)
//   • Hapus anggota (Owner/Admin via permission resolver)
//   • Kirim ulang undangan (Owner/Admin via permission resolver)
//   • Batalkan undangan (Owner/Admin via permission resolver)
//   • Undang anggota baru (Owner/Admin via permission resolver)
//
// Data:
//   - workspaceMembersData.ts (member store)
//   - invitationService.ts (invitation store via Supabase)
//   - useWorkspacePermission (permission resolver — NO hardcoded role checks)

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
import {
  getMembersByWorkspace,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
  type WorkspaceMemberRecord,
} from '../data/workspaceMembersData';
import {
  MEMBER_ROLES,
  ROLE_LABEL,
  ROLE_COLOR,
  ROLE_DESCRIPTION,
  type MemberRole,
} from '../types/workspacePermissions';
import {
  sendInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  type SendInvitationResult,
} from '../services/invitationService';
import type { WorkspaceInvitationRecord } from '../services/invitationService';

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#fee2e2', text: '#991b1b' },
  { bg: '#e0f2fe', text: '#075985' },
  { bg: '#fdf4ff', text: '#6b21a8' },
];

function avatarStyle(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return (p[0][0] ?? '?').toUpperCase();
  return ((p[0][0] ?? '') + (p[p.length - 1][0] ?? '')).toUpperCase();
}

function MemberAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const s = avatarStyle(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: s.bg, color: s.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700,
      border: `1.5px solid ${s.text}22`,
    }}>
      {initials(name)}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  const c = ROLE_COLOR[role];
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, display: 'inline-block', lineHeight: 1.6,
    }}>
      {ROLE_LABEL[role]}
    </span>
  );
}

type DisplayStatus = 'Aktif' | 'Diarsipkan' | 'Menunggu Undangan' | 'Ditolak';

const STATUS_STYLE: Record<DisplayStatus, { bg: string; text: string; border: string }> = {
  'Aktif':              { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  'Diarsipkan':         { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' },
  'Menunggu Undangan':  { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  'Ditolak':            { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
};

function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      background: s.bg, color: s.text,
      fontSize: 11, fontWeight: 600, padding: '2px 9px',
      borderRadius: 20, display: 'inline-block', lineHeight: 1.6,
      border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { kind: 'success' | 'error'; message: string }

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const ok = toast.kind === 'success';
  return (
    <div style={{ position: 'fixed', top: 'calc(var(--top-app-bar-height, 56px) + 8px)', left: 0, right: 0, zIndex: 400, display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none' }}>
      <div style={{
        background: ok ? '#f0fdf4' : '#fef2f2',
        border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%',
        pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 16, color: ok ? '#166534' : '#991b1b', flexShrink: 0 }}>{ok ? '✓' : '⚠'}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ok ? '#166534' : '#991b1b' }}>{toast.message}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: ok ? '#166534' : '#991b1b', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title, body, confirmLabel, confirmColor = '#dc2626', onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string;
  confirmColor?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 42, background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={onConfirm} style={{ flex: 1, height: 42, background: confirmColor, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Change Sheet ─────────────────────────────────────────────────────────

function RoleChangeSheet({
  member, onSave, onClose,
}: {
  member: WorkspaceMemberRecord; onSave: (role: MemberRole) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<MemberRole>(member.role);
  const changeable = MEMBER_ROLES.filter((r) => r !== 'Owner');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 520, boxShadow: '0 -8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Ubah Peran</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{member.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {changeable.map((role) => {
            const c = ROLE_COLOR[role];
            const active = selected === role;
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                  background: active ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>{ROLE_LABEL[role]}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{ROLE_DESCRIPTION[role]}</div>
                </div>
                {active && <span style={{ color: 'var(--color-primary)', fontSize: 16, flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onSave(selected)}
          disabled={selected === member.role}
          style={{
            width: '100%', height: 46,
            background: selected === member.role ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700,
            cursor: selected === member.role ? 'not-allowed' : 'pointer',
          }}
        >
          Simpan Peran
        </button>
      </div>
    </div>
  );
}

// ─── Invite Sheet ──────────────────────────────────────────────────────────────

const ASSIGNABLE_ROLES: MemberRole[] = ['Admin', 'Manager', 'Staff', 'Viewer'];

function InviteSheet({
  workspaceId, invitedBy, onClose, onSuccess,
}: {
  workspaceId: string; invitedBy: string;
  onClose: () => void; onSuccess: (token: string) => void;
}) {
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contact,     setContact]     = useState('');
  const [role,        setRole]        = useState<MemberRole>('Staff');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  async function handleSend() {
    setError('');
    if (!contact.trim()) { setError('Email atau nomor HP wajib diisi.'); return; }
    setSubmitting(true);
    const result = await sendInvitation({
      workspace_id: workspaceId,
      invited_by:   invitedBy,
      email:  contactType === 'email' ? contact.trim() : null,
      phone:  contactType === 'phone' ? contact.trim() : null,
      role,
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.message); return; }
    onSuccess(result.data.token);
  }

  const fs: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
    fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 520, boxShadow: '0 -8px 32px rgba(0,0,0,0.2)', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Undang Anggota</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Contact type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['email', 'phone'] as const).map((t) => (
            <button key={t} onClick={() => { setContactType(t); setContact(''); setError(''); }}
              style={{
                flex: 1, height: 36, borderRadius: 10,
                background: contactType === t ? 'var(--color-primary)' : 'var(--color-bg)',
                color: contactType === t ? '#fff' : 'var(--color-muted)',
                border: '1.5px solid ' + (contactType === t ? 'var(--color-primary)' : 'var(--color-border)'),
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t === 'email' ? '✉ Email' : '📞 Nomor HP'}
            </button>
          ))}
        </div>

        {/* Contact field */}
        <div style={{ marginBottom: 16 }}>
          <input
            type={contactType === 'email' ? 'email' : 'tel'}
            value={contact}
            onChange={(e) => { setContact(e.target.value); setError(''); }}
            placeholder={contactType === 'email' ? 'nama@email.com' : '08xxxxxxxxxx'}
            style={fs}
          />
          {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
        </div>

        {/* Role picker */}
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', margin: '0 0 10px', letterSpacing: 0.5 }}>PERAN</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {ASSIGNABLE_ROLES.map((r) => {
            const c = ROLE_COLOR[r];
            const on = role === r;
            return (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, textAlign: 'left', width: '100%',
                  background: on ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  border: `1.5px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--color-primary)' : 'var(--color-text)' }}>{ROLE_LABEL[r]}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{ROLE_DESCRIPTION[r]}</div>
                </div>
                {on && <span style={{ color: 'var(--color-primary)', fontSize: 14 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button onClick={handleSend} disabled={submitting}
          style={{
            width: '100%', height: 48, borderRadius: 12,
            background: submitting ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Membuat Undangan…' : 'Kirim Undangan'}
        </button>
      </div>
    </div>
  );
}

// ─── Invite Link Sheet ─────────────────────────────────────────────────────────

function InviteLinkSheet({ token, onClose }: { token: string; onClose: () => void }) {
  const link = `${window.location.origin}/invite/${token}`;
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 520, boxShadow: '0 -8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>🎉 Undangan Dibuat</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.6 }}>
          Bagikan tautan ini kepada orang yang diundang. Tautan berlaku selama <strong>7 hari</strong>.
        </p>
        <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: 'var(--color-text)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {link}
        </div>
        <button onClick={copyLink}
          style={{
            width: '100%', height: 48, borderRadius: 12,
            background: copied ? '#166534' : 'var(--color-primary)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✓ Tautan Disalin!' : 'Salin Tautan'}
        </button>
      </div>
    </div>
  );
}

// ─── Member Action Menu ────────────────────────────────────────────────────────

function MemberActionMenu({
  member, isSelf, canUpdate, canDelete,
  onChangeRole, onToggleArchive, onRemove, onClose,
}: {
  member: WorkspaceMemberRecord; isSelf: boolean;
  canUpdate: boolean; canDelete: boolean;
  onChangeRole: () => void; onToggleArchive: () => void;
  onRemove: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = member.role === 'Owner';
  const isArchived = member.status === 'Inactive';

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function Item({ label, icon, onClick, disabled = false, danger = false }: {
    label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean;
  }) {
    return (
      <button
        onClick={() => { if (!disabled) { onClose(); onClick(); } }}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '11px 14px',
          background: 'none', border: 'none', textAlign: 'left',
          fontSize: 14, fontWeight: 500,
          color: disabled ? 'var(--color-border)' : danger ? '#dc2626' : 'var(--color-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>{label}
      </button>
    );
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 300,
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
      minWidth: 210, overflow: 'hidden', marginTop: 4,
    }}>
      {canUpdate && <Item label="Ubah Peran" icon="👤" onClick={onChangeRole} disabled={isOwner} />}
      {canUpdate && (
        <Item
          label={isArchived ? 'Aktifkan Anggota' : 'Arsipkan Anggota'}
          icon={isArchived ? '🔔' : '📦'}
          onClick={onToggleArchive}
          disabled={isOwner}
        />
      )}
      {canDelete && (
        <>
          <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
          <Item
            label={isSelf ? 'Keluar dari Workspace' : 'Hapus Anggota'}
            icon="🗑️"
            onClick={onRemove}
            disabled={isOwner}
            danger
          />
        </>
      )}
    </div>
  );
}

// ─── Invitation Action Menu ────────────────────────────────────────────────────

function InvitationActionMenu({
  invitation, canCreate, canDelete,
  onResend, onCancel, onClose,
}: {
  invitation: WorkspaceInvitationRecord; canCreate: boolean; canDelete: boolean;
  onResend: () => void; onCancel: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function Item({ label, icon, onClick, disabled = false, danger = false }: {
    label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean;
  }) {
    return (
      <button
        onClick={() => { if (!disabled) { onClose(); onClick(); } }}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '11px 14px',
          background: 'none', border: 'none', textAlign: 'left',
          fontSize: 14, fontWeight: 500,
          color: disabled ? 'var(--color-border)' : danger ? '#dc2626' : 'var(--color-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>{label}
      </button>
    );
  }

  const isPending = invitation.status === 'Pending';

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 300,
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
      minWidth: 220, overflow: 'hidden', marginTop: 4,
    }}>
      {canCreate && <Item label="Kirim Ulang Undangan" icon="🔄" onClick={onResend} />}
      {canDelete && isPending && (
        <>
          <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
          <Item label="Batalkan Undangan" icon="✕" onClick={onCancel} danger />
        </>
      )}
    </div>
  );
}

// ─── Unified display types ─────────────────────────────────────────────────────

type DisplayEntry =
  | { kind: 'member';     data: WorkspaceMemberRecord }
  | { kind: 'invitation'; data: WorkspaceInvitationRecord };

function entryDisplayStatus(e: DisplayEntry): DisplayStatus {
  if (e.kind === 'member') {
    return e.data.status === 'Active' ? 'Aktif' : 'Diarsipkan';
  }
  return e.data.status === 'Pending' ? 'Menunggu Undangan' : 'Ditolak';
}

function entryName(e: DisplayEntry): string {
  if (e.kind === 'member') return e.data.name;
  const contact = e.data.email ?? '';
  return contact.startsWith('phone:') ? contact.slice(6) : contact;
}

function entryContact(e: DisplayEntry): string | null {
  if (e.kind === 'member') return e.data.email;
  const contact = e.data.email ?? '';
  return contact.startsWith('phone:') ? null : contact;
}

function entryRole(e: DisplayEntry): MemberRole {
  return e.kind === 'member' ? e.data.role : e.data.role;
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 48 }}>🔍</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Workspace tidak ditemukan</div>
      <button onClick={() => navigate('/profile/workspace')} style={{ padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Kembali
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterStatus = DisplayStatus | '';

const STATUS_FILTER_OPTIONS: FilterStatus[] = ['', 'Aktif', 'Menunggu Undangan', 'Ditolak', 'Diarsipkan'];

export default function ProfileWorkspaceMembers() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workspaces }  = useWorkspace();

  if (!id) return <NotFound navigate={navigate} />;
  const ws = workspaces.find((w) => w.workspace_uuid === id) ?? null;
  if (!ws) return <NotFound navigate={navigate} />;

  const currentUserId = currentUser?.id ?? '00000000-0000-0000-0000-000000000001';

  // Permission resolver — NO hardcoded role checks anywhere below.
  const { can } = useWorkspacePermission(id);
  const canCreate = can('memberManagement', 'create');
  const canUpdate = can('memberManagement', 'update');
  const canDelete = can('memberManagement', 'delete');

  // ── Reactive member list ─────────────────────────────────────────────────────
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  // ── Invitation list ──────────────────────────────────────────────────────────
  const [invitations,     setInvitations]     = useState<WorkspaceInvitationRecord[]>([]);
  const [inviteLoading,   setInviteLoading]   = useState(false);

  const loadInvitations = useCallback(async () => {
    if (!canCreate && !canUpdate && !canDelete) return;
    setInviteLoading(true);
    const list = await listInvitations(id);
    // Show only Pending and Rejected (Accepted/Expired/Revoked are irrelevant here)
    setInvitations(list.filter((inv) => inv.status === 'Pending' || inv.status === 'Rejected'));
    setInviteLoading(false);
  }, [id, canCreate, canUpdate, canDelete]);

  useEffect(() => { void loadInvitations(); }, [loadInvitations]);

  // ── Members ──────────────────────────────────────────────────────────────────
  const members = useMemo(() => {
    void tick;
    return getMembersByWorkspace(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tick]);

  // ── Search + filter ──────────────────────────────────────────────────────────
  const [query,        setQuery]        = useState('');
  const [filterRole,   setFilterRole]   = useState<MemberRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');

  // Build unified display list
  const allEntries = useMemo<DisplayEntry[]>(() => {
    const m: DisplayEntry[] = members.map((d) => ({ kind: 'member', data: d }));
    const i: DisplayEntry[] = invitations.map((d) => ({ kind: 'invitation', data: d }));
    return [...m, ...i];
  }, [members, invitations]);

  const displayed = useMemo<DisplayEntry[]>(() => {
    const q = query.trim().toLowerCase();
    return allEntries.filter((e) => {
      const name    = entryName(e).toLowerCase();
      const contact = (entryContact(e) ?? '').toLowerCase();
      const role    = entryRole(e);
      const status  = entryDisplayStatus(e);

      if (q && !name.includes(q) && !contact.includes(q)) return false;
      if (filterRole   && role   !== filterRole)   return false;
      if (filterStatus && status !== filterStatus) return false;
      return true;
    });
  }, [allEntries, query, filterRole, filterStatus]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [openMenuId,     setOpenMenuId]     = useState<string | null>(null);
  const [roleSheetId,    setRoleSheetId]    = useState<string | null>(null);
  const [confirmState,   setConfirmState]   = useState<
    | { action: 'remove' | 'archive' | 'unarchive' | 'cancelInvite'; id: string }
    | null
  >(null);
  const [showInvite,     setShowInvite]     = useState(false);
  const [inviteToken,    setInviteToken]    = useState<string | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(kind: Toast['kind'], message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleRoleSave(memberId: string, newRole: MemberRole) {
    if (!canUpdate) { showToast('error', 'Anda tidak memiliki izin untuk mengubah peran.'); return; }
    const result = updateMemberRole(memberId, newRole);
    setRoleSheetId(null);
    if (result.ok) { showToast('success', `Peran berhasil diubah menjadi ${ROLE_LABEL[newRole]}.`); refresh(); }
    else           { showToast('error', result.error.message); }
  }

  function handleToggleArchive(member: WorkspaceMemberRecord) {
    if (!canUpdate) { showToast('error', 'Anda tidak memiliki izin untuk mengubah status anggota.'); return; }
    const next = member.status === 'Active' ? 'Inactive' : 'Active';
    if (next === 'Inactive') {
      setConfirmState({ action: 'archive', id: member.member_uuid });
    } else {
      const result = updateMemberStatus(member.member_uuid, 'Active');
      if (result.ok) { showToast('success', `${member.name} berhasil diaktifkan kembali.`); refresh(); }
      else           { showToast('error', result.error.message); }
    }
  }

  function handleRemoveMember(member: WorkspaceMemberRecord) {
    if (!canDelete) { showToast('error', 'Anda tidak memiliki izin untuk menghapus anggota.'); return; }
    setConfirmState({ action: 'remove', id: member.member_uuid });
  }

  function handleCancelInvite(inv: WorkspaceInvitationRecord) {
    if (!canDelete) { showToast('error', 'Anda tidak memiliki izin untuk membatalkan undangan.'); return; }
    setConfirmState({ action: 'cancelInvite', id: inv.id });
  }

  async function handleResendInvite(inv: WorkspaceInvitationRecord) {
    if (!canCreate) { showToast('error', 'Anda tidak memiliki izin untuk mengirim ulang undangan.'); return; }
    const result = await resendInvitation(inv, currentUserId);
    if (result.ok) {
      showToast('success', 'Undangan berhasil dikirim ulang.');
      setInviteToken((result as { ok: true; data: SendInvitationResult }).data.token);
      void loadInvitations();
    } else {
      showToast('error', result.message);
    }
  }

  function executeConfirm() {
    if (!confirmState) return;
    const { action, id: targetId } = confirmState;
    setConfirmState(null);

    if (action === 'remove') {
      const member = members.find((m) => m.member_uuid === targetId);
      if (!member) return;
      const result = removeMember(targetId, currentUserId);
      if (result.ok) { showToast('success', `${member.name} dihapus dari workspace.`); refresh(); }
      else           { showToast('error', result.error.message); }
    } else if (action === 'archive') {
      const member = members.find((m) => m.member_uuid === targetId);
      if (!member) return;
      const result = updateMemberStatus(targetId, 'Inactive');
      if (result.ok) { showToast('success', `${member.name} telah diarsipkan.`); refresh(); }
      else           { showToast('error', result.error.message); }
    } else if (action === 'cancelInvite') {
      revokeInvitation(targetId).then((result) => {
        if (result.ok) { showToast('success', 'Undangan berhasil dibatalkan.'); void loadInvitations(); }
        else           { showToast('error', result.message); }
      });
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const roleModalMember = roleSheetId ? members.find((m) => m.member_uuid === roleSheetId) ?? null : null;
  const confirmMember   = confirmState?.action === 'remove' || confirmState?.action === 'archive'
    ? members.find((m) => m.member_uuid === confirmState.id) ?? null : null;
  const confirmInv = confirmState?.action === 'cancelInvite'
    ? invitations.find((inv) => inv.id === confirmState.id) ?? null : null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10,
    border: '1.5px solid var(--color-border)', fontSize: 14,
    background: 'var(--color-surface)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ paddingTop: 16, paddingBottom: 80, paddingLeft: 16, paddingRight: 16, minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box', maxWidth: 720, margin: '0 auto' }}>

        {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}

        {/* ── Workspace header strip ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🏢
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ws.workspace_name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>
              {members.length} anggota
              {invitations.length > 0 && ` · ${invitations.filter((i) => i.status === 'Pending').length} undangan tertunda`}
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowInvite(true)}
              style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Undang
            </button>
          )}
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau email…"
            style={inp}
          />
        </div>

        {/* ── Role filter chips ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {(['', ...MEMBER_ROLES] as (MemberRole | '')[]).map((r) => {
            const active = filterRole === r;
            const label  = r === '' ? 'Semua Peran' : ROLE_LABEL[r];
            const c      = r ? ROLE_COLOR[r] : null;
            return (
              <button key={r || 'all'} onClick={() => setFilterRole(r)}
                style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: active ? (c ? c.bg : 'var(--color-primary-light)') : 'var(--color-surface)',
                  color:      active ? (c ? c.text : 'var(--color-primary)') : 'var(--color-muted)',
                  outline: active ? `1.5px solid ${c ? c.text : 'var(--color-primary)'}` : '1px solid var(--color-border)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Status filter chips ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {STATUS_FILTER_OPTIONS.map((s) => {
            const active = filterStatus === s;
            const label  = s === '' ? 'Semua Status' : s;
            const sc     = s ? STATUS_STYLE[s] : null;
            return (
              <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                style={{
                  flexShrink: 0, padding: '4px 11px', borderRadius: 16,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: active ? (sc ? sc.bg : 'var(--color-text)') : 'var(--color-surface)',
                  color:      active ? (sc ? sc.text : 'var(--color-surface)') : 'var(--color-muted)',
                  outline: active ? `1.5px solid ${sc ? sc.border : 'transparent'}` : '1px solid var(--color-border)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Results count ── */}
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          {displayed.length} dari {allEntries.length} entri
          {(query || filterRole || filterStatus) ? ' (difilter)' : ''}
          {inviteLoading && ' · Memuat undangan…'}
        </div>

        {/* ── Unified list ── */}
        {displayed.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 24px', background: 'var(--color-surface)', borderRadius: 12, border: '1px dashed var(--color-border)', textAlign: 'center' }}>
            <span style={{ fontSize: 44 }}>👥</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Tidak ada hasil</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Coba ubah pencarian atau filter yang dipilih.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map((entry) => {
              const key      = entry.kind === 'member' ? entry.data.member_uuid : entry.data.id;
              const name     = entryName(entry);
              const contact  = entryContact(entry);
              const role     = entryRole(entry);
              const status   = entryDisplayStatus(entry);
              const isMenuOpen = openMenuId === key;
              const isSelf   = entry.kind === 'member' && entry.data.user_id === currentUserId;
              const isOwner  = role === 'Owner';
              const showMenu = (canUpdate || canDelete) && !isOwner;

              return (
                <div key={key} style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: '14px 14px 12px', position: 'relative',
                  opacity: status === 'Diarsipkan' ? 0.72 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar */}
                    {entry.kind === 'invitation' ? (
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        border: '1.5px solid #fcd34d',
                      }}>
                        ✉
                      </div>
                    ) : (
                      <MemberAvatar name={name} />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                          {name}
                        </span>
                        {isSelf && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 7px', borderRadius: 10 }}>Anda</span>
                        )}
                      </div>

                      {contact && (
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ✉ {contact}
                        </div>
                      )}
                      {entry.kind === 'member' && entry.data.phone && (
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>
                          📞 {entry.data.phone}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        <RoleBadge role={role} />
                        <StatusBadge status={status} />
                      </div>

                      {entry.kind === 'member' && (
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                          Bergabung {new Date(entry.data.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      {entry.kind === 'invitation' && entry.data.expires_at && (
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                          {new Date(entry.data.expires_at) < new Date()
                            ? '⚠ Kadaluarsa'
                            : `Berlaku hingga ${new Date(entry.data.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                        </div>
                      )}
                    </div>

                    {/* ⋮ Menu trigger */}
                    {showMenu && (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setOpenMenuId(isMenuOpen ? null : key)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: isMenuOpen ? 'var(--color-bg)' : 'none',
                            border: '1px solid ' + (isMenuOpen ? 'var(--color-border)' : 'transparent'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer',
                          }}
                          aria-label="Aksi anggota"
                        >
                          ⋯
                        </button>

                        {isMenuOpen && entry.kind === 'member' && (
                          <MemberActionMenu
                            member={entry.data}
                            isSelf={isSelf}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onChangeRole={() => setRoleSheetId(entry.data.member_uuid)}
                            onToggleArchive={() => handleToggleArchive(entry.data)}
                            onRemove={() => handleRemoveMember(entry.data)}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}

                        {isMenuOpen && entry.kind === 'invitation' && (
                          <InvitationActionMenu
                            invitation={entry.data}
                            canCreate={canCreate}
                            canDelete={canDelete}
                            onResend={() => handleResendInvite(entry.data)}
                            onCancel={() => handleCancelInvite(entry.data)}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB — Undang Anggota ── */}
      {canCreate && (
        <button
          onClick={() => setShowInvite(true)}
          style={{
            position: 'fixed', bottom: 24, right: 20,
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', fontSize: 26, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          }}
          aria-label="Undang anggota"
        >
          +
        </button>
      )}

      {/* ── Role change sheet ── */}
      {roleModalMember && (
        <RoleChangeSheet
          member={roleModalMember}
          onSave={(role) => handleRoleSave(roleModalMember.member_uuid, role)}
          onClose={() => setRoleSheetId(null)}
        />
      )}

      {/* ── Confirm dialogs ── */}
      {confirmState?.action === 'remove' && confirmMember && (
        <ConfirmDialog
          title="Hapus Anggota?"
          body={`"${confirmMember.name}" akan dihapus dan kehilangan seluruh akses workspace secara permanen.`}
          confirmLabel="Hapus"
          confirmColor="#dc2626"
          onConfirm={executeConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {confirmState?.action === 'archive' && confirmMember && (
        <ConfirmDialog
          title="Arsipkan Anggota?"
          body={`"${confirmMember.name}" tidak dapat mengakses workspace hingga diaktifkan kembali.`}
          confirmLabel="Arsipkan"
          confirmColor="#d97706"
          onConfirm={executeConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {confirmState?.action === 'cancelInvite' && confirmInv && (
        <ConfirmDialog
          title="Batalkan Undangan?"
          body={`Undangan untuk "${entryName({ kind: 'invitation', data: confirmInv })}" akan dibatalkan.`}
          confirmLabel="Batalkan Undangan"
          confirmColor="#dc2626"
          onConfirm={executeConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* ── Invite sheet ── */}
      {showInvite && (
        <InviteSheet
          workspaceId={id}
          invitedBy={currentUserId}
          onClose={() => setShowInvite(false)}
          onSuccess={(token) => {
            setShowInvite(false);
            setInviteToken(token);
            void loadInvitations();
          }}
        />
      )}

      {/* ── Invite link sheet ── */}
      {inviteToken && (
        <InviteLinkSheet
          token={inviteToken}
          onClose={() => setInviteToken(null)}
        />
      )}
    </>
  );
}
