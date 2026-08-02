// ─── Workspace Members Management — WS-004 ───────────────────────────────────
//
// Route: /workspace/settings/members
//
// Shows all members of the active workspace with search, filter, and sort.
// Supports: Change Role, Activate, Deactivate, Remove Member.
// Requires confirmation for destructive actions (Remove, Deactivate).
//
// Uses:
//   - workspaceMembersData.ts (member store + mutations)
//   - workspacePermissions.ts (role types + permission matrix)
//   - useWorkspace() for active workspace UUID
//   - useAuth() for current user identity (self-removal guard)
//
// Excluded: Invitation flow, Workspace Archive, Workspace Delete, Switching.

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
// LEGACY — scheduled removal after production migration.
// workspace_members is not yet in Supabase; member data served from in-memory store.
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
  MODULE_LABEL,
  ACTION_LABEL,
  ROLE_PERMISSION_MATRIX,
  type MemberRole,
  type PermissionModule,
  type PermissionAction,
} from '../types/workspacePermissions';
import {
  sendInvitation,
  listPendingInvitations,
  revokeInvitation,
  type InvitationDetails,
} from '../services/invitationService';
import type { WorkspaceInvitationRecord } from '../services/invitationService';

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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

function getAvatarStyle(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberAvatar({ name, size = 42 }: { name: string; size?: number }) {
  const style = getAvatarStyle(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: style.bg, color: style.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      border: `1.5px solid ${style.text}22`,
    }}>
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: MemberRole }) {
  const c = ROLE_COLOR[role];
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, display: 'inline-block', lineHeight: 1.6,
      letterSpacing: 0.2,
    }}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  const active = status === 'Active';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: active ? '#f0fdf4' : '#f8fafc',
      color:      active ? '#166534' : '#64748b',
      border: `1px solid ${active ? '#86efac' : '#cbd5e1'}`,
      display: 'inline-block', lineHeight: 1.6,
    }}>
      {active ? '● Active' : '○ Inactive'}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { kind: 'success' | 'error'; message: string }

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const ok     = toast.kind === 'success';
  const bg     = ok ? '#f0fdf4' : '#fef2f2';
  const border = ok ? '#86efac' : '#fca5a5';
  const color  = ok ? '#166534' : '#991b1b';
  return (
    <div style={{ position: 'fixed', top: 'calc(var(--top-app-bar-height) + 8px)', left: 0, right: 0, zIndex: 300, display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none' }}>
      <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%', pointerEvents: 'all' }}>
        <span style={{ fontSize: 16, color, flexShrink: 0 }}>{ok ? '✓' : '⚠'}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color }}>{toast.message}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ title, body, confirmLabel, confirmColor = '#dc2626', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 42, background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, height: 42, background: confirmColor, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Change Modal ────────────────────────────────────────────────────────

function RoleChangeModal({
  member,
  onSave,
  onCancel,
}: {
  member: WorkspaceMemberRecord;
  onSave: (role: MemberRole) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<MemberRole>(member.role);
  const changeable = MEMBER_ROLES.filter((r) => r !== 'Owner'); // Owner is immutable

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 520, boxShadow: '0 -8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Ubah Peran</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{member.name}</p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
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
                  transition: 'border-color 0.15s',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>{ROLE_LABEL[role]}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{ROLE_DESCRIPTION[role]}</div>
                </div>
                {active && <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: 16, flexShrink: 0 }}>✓</span>}
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
          Save Role
        </button>
      </div>
    </div>
  );
}

// ─── Action Menu (per member) ─────────────────────────────────────────────────

function ActionMenu({
  member,
  isCurrentUser,
  canUpdate,
  canDelete,
  onChangeRole,
  onToggleStatus,
  onRemove,
  onClose,
}: {
  member: WorkspaceMemberRecord;
  isCurrentUser: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = member.role === 'Owner';

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const menuItem = (
    label: string,
    icon: string,
    onClick: () => void,
    disabled = false,
    danger = false,
  ) => (
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
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 200,
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
      minWidth: 210, overflow: 'hidden', marginTop: 4,
    }}>
      {canUpdate && menuItem('Ubah Peran', '👤', onChangeRole, isOwner)}
      {member.status === 'Active'
        ? canUpdate && menuItem('Nonaktifkan', '🔕', onToggleStatus, isOwner)
        : canUpdate && menuItem('Aktifkan', '🔔', onToggleStatus, isOwner)
      }
      {canDelete && (
        <>
          <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
          {menuItem(
            isCurrentUser ? 'Keluar dari Workspace' : 'Hapus Anggota',
            '🗑️',
            onRemove,
            isOwner,
            true,
          )}
        </>
      )}
    </div>
  );
}

// ─── Permissions Reference ────────────────────────────────────────────────────

const ALL_MODULES = Object.keys(MODULE_LABEL) as PermissionModule[];
const ALL_ACTIONS = Object.keys(ACTION_LABEL) as PermissionAction[];

function PermissionsReference({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>🔑 Role Permission Matrix</span>
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {expanded && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 580 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Module</th>
                {MEMBER_ROLES.map((role) => (
                  <th key={role} style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700, color: ROLE_COLOR[role].text, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {ROLE_LABEL[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((mod, i) => (
                <tr key={mod} style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}>
                  <td style={{ padding: '7px 12px', fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {MODULE_LABEL[mod]}
                  </td>
                  {MEMBER_ROLES.map((role) => {
                    const perms = ROLE_PERMISSION_MATRIX[role][mod];
                    const actions = ALL_ACTIONS.filter((a) => perms[a]);
                    const display = actions.length === 4 ? 'Full' : actions.length === 0 ? '—' : actions.map((a) => a[0].toUpperCase()).join('');
                    const isNone = actions.length === 0;
                    const isFull = actions.length === 4;
                    return (
                      <td key={role} style={{
                        padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid var(--color-border)',
                        color: isNone ? 'var(--color-border)' : isFull ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: isFull ? 700 : 500,
                      }}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
            V = View · C = Create · U = Update · D = Delete · Full = VCUD · — = No access
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invite Sheet ─────────────────────────────────────────────────────────────

function InviteSheet({
  workspaceId,
  invitedBy,
  canCreate,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  invitedBy:   string;
  canCreate:   boolean;
  onClose:     () => void;
  onSuccess:   (token: string) => void;
}) {
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contact,     setContact]     = useState('');
  const [role,        setRole]        = useState<MemberRole>('Staff');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  async function handleSend() {
    if (!canCreate) {
      setError('Anda tidak memiliki izin untuk mengundang anggota.');
      return;
    }
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
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSuccess(result.data.token);
  }

  const changeable = MEMBER_ROLES.filter((r) => r !== 'Owner');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px',
        width: '100%', maxWidth: 520,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Undang Anggota</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Contact type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['email', 'phone'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setContactType(t); setContact(''); setError(''); }}
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
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: `1.5px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
              fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
          {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
        </div>

        {/* Role picker */}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', margin: '0 0 10px' }}>PERAN</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {changeable.map((r) => {
            const c  = ROLE_COLOR[r];
            const on = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left', width: '100%',
                  background: on ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  border: `1.5px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {ROLE_LABEL[r]}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{ROLE_DESCRIPTION[r]}</div>
                </div>
                {on && <span style={{ color: 'var(--color-primary)', fontSize: 14 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSend}
          disabled={submitting}
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

// ─── Invite Link Sheet ────────────────────────────────────────────────────────

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px',
        width: '100%', maxWidth: 520,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            🎉 Undangan Dibuat
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.6 }}>
          Bagikan tautan ini kepada orang yang diundang. Tautan berlaku selama <strong>7 hari</strong>.
        </p>
        <div style={{
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          borderRadius: 10, padding: '10px 12px', marginBottom: 14,
          fontSize: 12, color: 'var(--color-text)', wordBreak: 'break-all',
          fontFamily: 'monospace',
        }}>
          {link}
        </div>
        <button
          onClick={copyLink}
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

// ─── Sort + filter types ──────────────────────────────────────────────────────

type SortKey = 'name' | 'role' | 'joined' | 'status';
type SortDir = 'asc' | 'desc';

const ROLE_ORDER: Record<MemberRole, number> = {
  Owner: 0, Admin: 1, Manager: 2, Staff: 3, Viewer: 4,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsMembers() {
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const { can } = useWorkspacePermission();
  const canInvite = can('memberManagement', 'create');
  const canUpdate = can('memberManagement', 'update');
  const canRemove = can('memberManagement', 'delete');
  const currentUserId = currentUser?.id ?? '00000000-0000-0000-0000-000000000001';

  // ── Reactive member list ───────────────────────────────────────────────────
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  // ── Invite state ───────────────────────────────────────────────────────────
  const [showInviteSheet,  setShowInviteSheet]  = useState(false);
  const [inviteToken,      setInviteToken]      = useState<string | null>(null);
  const [pendingInvites,   setPendingInvites]   = useState<WorkspaceInvitationRecord[]>([]);
  const [invitesLoading,   setInvitesLoading]   = useState(false);

  const loadPendingInvites = useCallback(async () => {
    if (!activeWorkspace || !canInvite) return;
    setInvitesLoading(true);
    const list = await listPendingInvitations(activeWorkspace.workspace_uuid);
    setPendingInvites(list);
    setInvitesLoading(false);
  }, [activeWorkspace, canInvite]);

  useEffect(() => { loadPendingInvites(); }, [loadPendingInvites]);

  const allMembers = useMemo(() => {
    if (!activeWorkspace) return [];
    return getMembersByWorkspace(activeWorkspace.workspace_uuid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.workspace_uuid, tick]);

  // ── Search / filter / sort ────────────────────────────────────────────────
  const [query,        setQuery]       = useState('');
  const [filterRole,   setFilterRole]  = useState<MemberRole | ''>('');
  const [filterStatus, setFilterStatus]= useState<'Active' | 'Inactive' | ''>('');
  const [sortKey,      setSortKey]     = useState<SortKey>('role');
  const [sortDir,      setSortDir]     = useState<SortDir>('asc');

  const displayed = useMemo(() => {
    let list = [...allMembers];

    // Search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
      );
    }

    // Role filter
    if (filterRole) list = list.filter((m) => m.role === filterRole);

    // Status filter
    if (filterStatus) list = list.filter((m) => m.status === filterStatus);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'role')   cmp = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      if (sortKey === 'joined') cmp = a.joined_at.localeCompare(b.joined_at);
      if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allMembers, query, filterRole, filterStatus, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  // ── Modal state ────────────────────────────────────────────────────────────
  const [openMenuId,    setOpenMenuId]    = useState<string | null>(null);
  const [roleModalId,   setRoleModalId]   = useState<string | null>(null);
  const [confirmState,  setConfirmState]  = useState<
    | { action: 'remove' | 'deactivate'; memberId: string }
    | null
  >(null);
  const [showPerms, setShowPerms] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(kind: Toast['kind'], message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleRoleSave(memberId: string, newRole: MemberRole) {
    if (!canUpdate) {
      showToast('error', 'Anda tidak memiliki izin untuk mengubah peran.');
      return;
    }
    const result = updateMemberRole(memberId, newRole);
    setRoleModalId(null);
    if (result.ok) {
      showToast('success', `Role updated to ${ROLE_LABEL[newRole]}.`);
      refresh();
    } else {
      showToast('error', result.error.message);
    }
  }

  function handleToggleStatus(member: WorkspaceMemberRecord) {
    if (!canUpdate) {
      showToast('error', 'Anda tidak memiliki izin untuk mengubah status anggota.');
      return;
    }
    const next = member.status === 'Active' ? 'Inactive' : 'Active';
    if (next === 'Inactive') {
      setConfirmState({ action: 'deactivate', memberId: member.member_uuid });
    } else {
      const result = updateMemberStatus(member.member_uuid, 'Active');
      if (result.ok) { showToast('success', `${member.name} has been activated.`); refresh(); }
      else           { showToast('error', result.error.message); }
    }
  }

  function handleRemove(member: WorkspaceMemberRecord) {
    if (!canRemove) {
      showToast('error', 'Anda tidak memiliki izin untuk menghapus anggota.');
      return;
    }
    setConfirmState({ action: 'remove', memberId: member.member_uuid });
  }

  function executeConfirm() {
    if (!confirmState) return;
    const { action, memberId } = confirmState;
    const member = allMembers.find((m) => m.member_uuid === memberId);
    setConfirmState(null);
    if (!member) return;

    if (action === 'deactivate') {
      const result = updateMemberStatus(memberId, 'Inactive');
      if (result.ok) { showToast('success', `${member.name} has been deactivated.`); refresh(); }
      else           { showToast('error', result.error.message); }
    } else {
      const result = removeMember(memberId, currentUserId);
      if (result.ok) { showToast('success', `${member.name} has been removed.`); refresh(); }
      else           { showToast('error', result.error.message); }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const roleModalMember = roleModalId ? allMembers.find((m) => m.member_uuid === roleModalId) ?? null : null;
  const confirmMember   = confirmState ? allMembers.find((m) => m.member_uuid === confirmState.memberId) ?? null : null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10,
    border: '1.5px solid var(--color-border)', fontSize: 14,
    background: 'var(--color-surface)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };

  if (!activeWorkspace) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
        No workspace selected.
      </div>
    );
  }

  return (
    <>
    <div style={{ paddingTop: 8, paddingBottom: 40, background: 'var(--color-bg)', minHeight: '100dvh' }}>

      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}

      {/* Role change modal */}
      {roleModalMember && (
        <RoleChangeModal
          member={roleModalMember}
          onSave={(role) => handleRoleSave(roleModalMember.member_uuid, role)}
          onCancel={() => setRoleModalId(null)}
        />
      )}

      {/* Confirm dialog */}
      {confirmState && confirmMember && (
        <ConfirmDialog
          title={confirmState.action === 'remove' ? 'Hapus Anggota' : 'Nonaktifkan Anggota'}
          body={
            confirmState.action === 'remove'
              ? `Hapus ${confirmMember.name} dari workspace ini? Mereka akan kehilangan semua akses segera.`
              : `Nonaktifkan ${confirmMember.name}? Mereka tidak dapat mengakses workspace hingga diaktifkan kembali.`
          }
          confirmLabel={confirmState.action === 'remove' ? 'Hapus' : 'Nonaktifkan'}
          confirmColor={confirmState.action === 'remove' ? '#dc2626' : '#d97706'}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Workspace info strip ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
          <span style={{ fontSize: 20 }}>🏢</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeWorkspace.workspace_name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{allMembers.length} member{allMembers.length !== 1 ? 's' : ''}</div>
          </div>
          {canInvite && (
            <button
              onClick={() => setShowInviteSheet(true)}
              style={{
                flexShrink: 0, height: 34, padding: '0 12px', borderRadius: 10,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Undang
            </button>
          )}
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau peran…"
            style={inp}
          />
        </div>

        {/* ── Filters + Sort ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Role filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {(['', ...MEMBER_ROLES] as (MemberRole | '')[]).map((r) => {
              const active = filterRole === r;
              const label  = r === '' ? 'All Roles' : ROLE_LABEL[r];
              const c      = r ? ROLE_COLOR[r] : null;
              return (
                <button
                  key={r || 'all'}
                  onClick={() => setFilterRole(r)}
                  style={{
                    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
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

          {/* Status filter + Sort row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Status chips */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['', 'Active', 'Inactive'] as const).map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: filterStatus === s ? 'var(--color-text)' : 'var(--color-surface)',
                    color:      filterStatus === s ? 'var(--color-surface)' : 'var(--color-muted)',
                    outline: filterStatus === s ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {s === '' ? 'All' : s}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', flexShrink: 0 }}>Urut</span>
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value as SortKey); setSortDir('asc'); }}
                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer' }}
              >
                <option value="role">Peran</option>
                <option value="name">Nama</option>
                <option value="joined">Bergabung</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 12, cursor: 'pointer' }}
                title={sortDir === 'asc' ? 'Naik' : 'Turun'}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          {displayed.length} of {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
          {(query || filterRole || filterStatus) ? ' (filtered)' : ''}
        </div>

        {/* ── Member list ── */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>No members found</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isMenuOpen    = openMenuId === member.member_uuid;

              return (
                <div
                  key={member.member_uuid}
                  style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 12, padding: '14px 14px 12px',
                    position: 'relative',
                    opacity: member.status === 'Inactive' ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Avatar */}
                    <MemberAvatar name={member.name} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{member.name}</span>
                        {isCurrentUser && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 7px', borderRadius: 10 }}>You</span>
                        )}
                      </div>

                      {member.email && (
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ✉ {member.email}
                        </div>
                      )}
                      {member.phone && (
                        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>
                          📞 {member.phone}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        <RoleBadge role={member.role} />
                        <StatusBadge status={member.status} />
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Joined {new Date(member.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* ⋮ menu trigger */}
                    {(canUpdate || canRemove) && <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : member.member_uuid)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isMenuOpen ? 'var(--color-bg)' : 'none',
                          border: '1px solid ' + (isMenuOpen ? 'var(--color-border)' : 'transparent'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer',
                        }}
                        aria-label="Member actions"
                      >
                        ⋯
                      </button>

                      {isMenuOpen && (
                          <ActionMenu
                          member={member}
                          isCurrentUser={isCurrentUser}
                          canUpdate={canUpdate}
                          canDelete={canRemove}
                          onChangeRole={() => setRoleModalId(member.member_uuid)}
                          onToggleStatus={() => handleToggleStatus(member)}
                          onRemove={() => handleRemove(member)}
                          onClose={() => setOpenMenuId(null)}
                        />
                      )}
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pending invitations ── */}
        {canInvite && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
            }}>
              Undangan Tertunda {pendingInvites.length > 0 && `(${pendingInvites.length})`}
            </div>

            {invitesLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted)', padding: '8px 0' }}>Memuat…</p>
            ) : pendingInvites.length === 0 ? (
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                border: '1.5px dashed var(--color-border)',
                textAlign: 'center', fontSize: 13, color: 'var(--color-muted)',
              }}>
                Tidak ada undangan aktif
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingInvites.map((inv) => {
                  const display = inv.email?.startsWith('phone:')
                    ? `📞 ${inv.email.slice(6)}`
                    : `✉ ${inv.email}`;
                  const expired = inv.expires_at && new Date(inv.expires_at) < new Date();
                  return (
                    <div
                      key={inv.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 12,
                        background: 'var(--color-surface)',
                        border: '1.5px solid var(--color-border)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {display}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <RoleBadge role={inv.role} />
                          {expired && (
                            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Kadaluarsa</span>
                          )}
                          {inv.expires_at && !expired && (
                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                              Berlaku hingga {new Date(inv.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      {canRemove && (
                        <button
                          onClick={async () => {
                            await revokeInvitation(inv.id);
                            loadPendingInvites();
                            showToast('success', 'Undangan dibatalkan.');
                          }}
                          style={{
                            flexShrink: 0, padding: '5px 10px', borderRadius: 8,
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer',
                          }}
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Permissions reference ── */}
        <PermissionsReference expanded={showPerms} onToggle={() => setShowPerms((v) => !v)} />

      </div>
    </div>

    {/* ── Invite sheet ── */}
    {showInviteSheet && activeWorkspace && (
      <InviteSheet
        workspaceId={activeWorkspace.workspace_uuid}
        invitedBy={currentUserId}
          canCreate={canInvite}
        onClose={() => setShowInviteSheet(false)}
        onSuccess={(token) => {
          setShowInviteSheet(false);
          setInviteToken(token);
          loadPendingInvites();
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
