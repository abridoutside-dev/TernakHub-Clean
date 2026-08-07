// ─── Workspace Settings — Roles & Permissions — AUTH-001B ────────────────────
//
// Route: /workspace/settings/roles
//
// Two tabs:
//   1. Built-in Roles — read-only permission matrix for the 5 system roles
//   2. Custom Roles   — Owner-only CRUD for workspace-scoped roles
//
// Custom role permissions are stored as a sparse jsonb map; unset = denied.

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
import {
  getWorkspaceRoles,
  getWorkspaceRole,
  addWorkspaceRole,
  editWorkspaceRole,
  updateWorkspaceRoleStatus,
  getWorkspaceRoleRemovalPreflight,
  removeWorkspaceRole,
  resolveWorkspaceRolePermissions,
} from '../services/workspaceService';
import type {
  BuiltinRoleRecord,
  CustomRoleRecord,
  CustomRolePermissions,
  WorkspaceRoleRemovalPreflight,
} from '../types/customRole';
import {
  MEMBER_ROLES,
  ROLE_LABEL,
  ROLE_COLOR,
  ROLE_DESCRIPTION,
  MODULE_LABEL,
  ACTION_LABEL,
  type MemberRole,
  type PermissionModule,
  type PermissionAction,
} from '../types/workspacePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULES: PermissionModule[] = [
  'dashboard', 'livestock', 'feed', 'medicine', 'marketplace',
  'workspaceSettings', 'memberManagement', 'reports', 'ai', 'adminFeatures',
];

const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PermCell({ allowed }: { allowed: boolean }) {
  return (
    <td style={{
      textAlign: 'center', padding: '6px 10px',
      color: allowed ? '#166534' : '#9ca3af',
      fontSize: 14,
    }}>
      {allowed ? '✓' : '—'}
    </td>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.8, textTransform: 'uppercase',
      padding: '18px 0 8px',
    }}>
      {children}
    </div>
  );
}

// ─── Built-in Roles Tab ───────────────────────────────────────────────────────

function BuiltinRolesTab({ roles, loading }: {
  roles: BuiltinRoleRecord[];
  loading: boolean;
}) {
  const [expandedRole, setExpandedRole] = useState<MemberRole | null>(null);

  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        5 role bawaan TernakHub tidak dapat diubah. Setiap role memiliki hak akses yang berbeda di setiap modul.
      </p>

      {/* Role cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {MEMBER_ROLES.map((role) => {
          const c = ROLE_COLOR[role];
          const isExpanded = expandedRole === role;
          const roleRecord = roles.find((candidate) => candidate.name === role);
          const permissions = roleRecord
            ? resolveWorkspaceRolePermissions(roleRecord)
            : null;
          return (
            <div
              key={role}
              style={{
                border: `1.5px solid ${isExpanded ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpandedRole(isExpanded ? null : role)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'var(--color-surface)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  background: c.bg, color: c.text,
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 14,
                  flexShrink: 0,
                }}>
                  {ROLE_LABEL[role]}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-muted)', flex: 1 }}>
                  {ROLE_DESCRIPTION[role]}
                </span>
                <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && loading && (
                <p style={{ padding: '12px 14px 14px', margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
                  Memuat permission dari Supabase…
                </p>
              )}

              {isExpanded && !loading && !permissions && (
                <p style={{ padding: '12px 14px 14px', margin: 0, fontSize: 13, color: '#991b1b' }}>
                  Permission role tidak dapat dimuat.
                </p>
              )}

              {isExpanded && permissions && (
                <div style={{ overflowX: 'auto', padding: '0 14px 14px' }}>
                  <table style={{ borderCollapse: 'collapse', minWidth: 420, fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px 6px 0', color: 'var(--color-muted)', fontWeight: 600, fontSize: 11 }}>
                          Modul
                        </th>
                        {ACTIONS.map((a) => (
                          <th key={a} style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--color-muted)', fontWeight: 600, fontSize: 11, width: 56 }}>
                            {ACTION_LABEL[a]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod) => (
                        <tr key={mod} style={{ borderTop: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '6px 10px 6px 0', fontSize: 12, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                            {MODULE_LABEL[mod]}
                          </td>
                          {ACTIONS.map((action) => (
                            <PermCell
                              key={action}
                               allowed={permissions[mod][action] === true}
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom Role Editor (Create / Edit) ───────────────────────────────────────

interface RoleEditorProps {
  initial:    Partial<CustomRoleRecord> | null;  // null = create mode
  onSave:     (name: string, description: string, permissions: CustomRolePermissions) => void;
  onCancel:   () => void;
  saving:     boolean;
}

function RoleEditor({ initial, onSave, onCancel, saving }: RoleEditorProps) {
  const [name,        setName]        = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [perms, setPerms]             = useState<CustomRolePermissions>(initial?.permissions ?? {});
  const [nameErr, setNameErr]         = useState('');

  function togglePerm(mod: PermissionModule, action: PermissionAction) {
    setPerms((prev) => {
      const current = prev[mod]?.[action] ?? false;
      return {
        ...prev,
        [mod]: {
          ...prev[mod],
          [action]: !current,
        },
      };
    });
  }

  function handleSave() {
    const n = name.trim();
    if (!n || n.length < 2) { setNameErr('Nama role minimal 2 karakter.'); return; }
    if (n.length > 40)       { setNameErr('Nama role maksimal 40 karakter.'); return; }
    setNameErr('');
    onSave(n, description.trim(), perms);
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
        width: '100%', maxWidth: 560,
        maxHeight: '92dvh',
        overflowY: 'auto',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            {initial ? 'Edit Custom Role' : 'Buat Custom Role'}
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
            Nama Role *
          </label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setNameErr(''); }}
            placeholder="Cth: Supervisor Kandang"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: `1.5px solid ${nameErr ? '#dc2626' : 'var(--color-border)'}`,
              fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
          {nameErr && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{nameErr}</p>}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
            Deskripsi (opsional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan tanggung jawab role ini"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid var(--color-border)',
              fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>

        {/* Permissions matrix */}
        <SectionHeader>Hak Akses</SectionHeader>
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 380, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 10px 6px 0', fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Modul</th>
                {ACTIONS.map((a) => (
                  <th key={a} style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 54 }}>
                    {ACTION_LABEL[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '7px 10px 7px 0', fontSize: 13, color: 'var(--color-text)' }}>
                    {MODULE_LABEL[mod]}
                  </td>
                  {ACTIONS.map((action) => {
                    const allowed = perms[mod]?.[action] === true;
                    return (
                      <td key={action} style={{ textAlign: 'center', padding: '7px 8px' }}>
                        <button
                          onClick={() => togglePerm(mod, action)}
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: allowed ? '#dcfce7' : 'var(--color-bg)',
                            border: `1.5px solid ${allowed ? '#86efac' : 'var(--color-border)'}`,
                            color: allowed ? '#166534' : '#9ca3af',
                            cursor: 'pointer', fontSize: 14, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {allowed ? '✓' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: 48, borderRadius: 12,
            background: saving ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Menyimpan…' : (initial ? 'Simpan Perubahan' : 'Buat Role')}
        </button>
      </div>
    </div>
  );
}

// ─── Custom Roles Tab ─────────────────────────────────────────────────────────

function CustomRolesTab({
  workspaceId,
  roles,
  loading,
  onReload,
  canCreate,
  canUpdate,
  canDelete,
}: {
  workspaceId:   string;
  roles:         CustomRoleRecord[];
  loading:       boolean;
  onReload:      () => Promise<void>;
  canCreate:     boolean;
  canUpdate:     boolean;
  canDelete:     boolean;
}) {
  const [editing, setEditing] = useState<CustomRoleRecord | null | 'new'>(null); // null=none, 'new'=create, record=edit
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomRoleRecord | null>(null);
  const [detail, setDetail] = useState<CustomRoleRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [preflight, setPreflight] = useState<WorkspaceRoleRemovalPreflight | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  function showToast(kind: 'success' | 'error', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function openDetail(role: CustomRoleRecord) {
    setDetailLoading(true);
    try {
      const result = await getWorkspaceRole(role.id, workspaceId, 'custom');
      if (result?.role_kind === 'custom') {
        setDetail(result);
      } else {
        showToast('error', 'Detail role tidak ditemukan.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Detail role tidak dapat dimuat.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSave(name: string, description: string, permissions: CustomRolePermissions) {
    if (editing === 'new' && !canCreate) {
      showToast('error', 'Anda tidak memiliki izin untuk membuat custom role.');
      return;
    }
    if (editing && editing !== 'new' && !canUpdate) {
      showToast('error', 'Anda tidak memiliki izin untuk memperbarui custom role.');
      return;
    }
    setSaving(true);
    if (editing === 'new') {
       const result = await addWorkspaceRole({
        workspace_id: workspaceId,
        name,
        description: description || null,
        permissions,
      });
      if (result.ok) {
        showToast('success', `Role "${name}" berhasil dibuat.`);
        setEditing(null);
         await onReload();
      } else {
        showToast('error', result.error.message);
      }
    } else if (editing) {
      const result = await editWorkspaceRole(
        editing.id,
        workspaceId,
        { name, description: description || null, permissions },
      );
      if (result.ok) {
        showToast('success', `Role "${name}" berhasil diperbarui.`);
        setEditing(null);
        await onReload();
      } else {
        showToast('error', result.error.message);
      }
    }
    setSaving(false);
  }

  async function openDeletePreflight(role: CustomRoleRecord) {
    if (!canDelete) {
      showToast('error', 'Anda tidak memiliki izin untuk menghapus custom role.');
      return;
    }
    setPreflightLoading(true);
    const result = await getWorkspaceRoleRemovalPreflight(role.id, workspaceId);
    setPreflightLoading(false);
    if (!result) {
      showToast('error', 'Role tidak ditemukan.');
      return;
    }
    setPreflight(result);
    setConfirmDelete(role);
  }

  async function handleDelete(role: CustomRoleRecord) {
    if (!preflight || preflight.role.id !== role.id) {
      showToast('error', 'Pre-check penghapusan wajib dilakukan.');
      return;
    }
    const result = await removeWorkspaceRole(role.id, workspaceId, preflight);
    if (result.ok) {
      showToast('success', `Role "${role.name}" dihapus.`);
      setConfirmDelete(null);
      setPreflight(null);
      await onReload();
    } else {
      showToast('error', result.error.message);
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 'calc(var(--top-app-bar-height) + 8px)',
          left: 0, right: 0, zIndex: 300,
          display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none',
        }}>
          <div style={{
            background: toast.kind === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1.5px solid ${toast.kind === 'success' ? '#86efac' : '#fca5a5'}`,
            color: toast.kind === 'success' ? '#166534' : '#991b1b',
            borderRadius: 10, padding: '10px 16px',
            fontSize: 14, fontWeight: 600, pointerEvents: 'all',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}>
            {toast.kind === 'success' ? '✓ ' : '⚠ '}{toast.msg}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0, lineHeight: 1.6 }}>
          Buat role kustom dengan hak akses yang dapat dikonfigurasi sepenuhnya.
        </p>
        {canCreate && (
          <button
            onClick={() => setEditing('new')}
            style={{
              flexShrink: 0, marginLeft: 12,
              height: 36, padding: '0 14px', borderRadius: 10,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Buat Role
          </button>
        )}
      </div>

      {(!canCreate || !canUpdate || !canDelete) && (
        <div style={{
          padding: '12px 14px', borderRadius: 10,
          background: '#fef3c7', border: '1px solid #fde68a',
          fontSize: 13, color: '#92400e', marginBottom: 16,
        }}>
          ⚠ Hak akses Anda membatasi sebagian aksi custom role pada workspace ini.
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: 'var(--color-muted)', textAlign: 'center', padding: '32px 0' }}>
          Memuat…
        </p>
      ) : roles.length === 0 ? (
        <div style={{
          padding: '32px 20px', textAlign: 'center',
          border: '2px dashed var(--color-border)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎭</div>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>
            Belum ada custom role. {canCreate ? 'Klik "+ Buat Role" untuk memulai.' : ''}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roles.map((role) => {
            const grantedCount = MODULES.reduce(
              (acc, mod) => acc + ACTIONS.filter((a) => role.permissions[mod]?.[a] === true).length,
              0,
            );
            return (
              <div
                key={role.id}
                style={{
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 12, padding: '14px 16px',
                  background: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                      {role.name}
                    </div>
                    {role.description && (
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, lineHeight: 1.5 }}>
                        {role.description}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      {grantedCount} izin diberikan
                    </div>
                  </div>

                  {(canUpdate || canDelete) && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => void openDetail(role)}
                        disabled={detailLoading}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                          cursor: 'pointer',
                        }}
                      >
                        {detailLoading ? 'Memuat…' : 'Detail'}
                      </button>
                      {canUpdate && <button
                        onClick={() => setEditing(role)}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>}
                      {canUpdate && <button
                        onClick={() => void updateWorkspaceRoleStatus(
                          role.id,
                          workspaceId,
                          role.status === 'Active' ? 'Inactive' : 'Active',
                        ).then(async (result) => {
                          if (result.ok) {
                            showToast('success', `Role "${role.name}" ${role.status === 'Active' ? 'dinonaktifkan' : 'diaktifkan'}.`);
                            await onReload();
                          } else {
                            showToast('error', result.error.message);
                          }
                        })}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: role.status === 'Active' ? '#fff7ed' : '#f0fdf4',
                          border: `1px solid ${role.status === 'Active' ? '#fdba74' : '#86efac'}`,
                          fontSize: 12, fontWeight: 600,
                          color: role.status === 'Active' ? '#c2410c' : '#166534',
                          cursor: 'pointer',
                        }}
                      >
                        {role.status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>}
                      {canDelete && <button
                        onClick={() => void openDeletePreflight(role)}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: '#fef2f2',
                          border: '1px solid #fca5a5',
                          fontSize: 12, fontWeight: 600, color: '#dc2626',
                          cursor: 'pointer',
                        }}
                      >
                        Hapus
                      </button>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role editor sheet */}
      {editing !== null && (
        <RoleEditor
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            padding: '24px', width: '100%', maxWidth: 360,
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Hapus Custom Role?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Role <strong>"{confirmDelete.name}"</strong> akan dihapus permanen.
              {preflightLoading ? ' Memeriksa dependency…' : ` ${preflight?.dependencies[0]?.count ?? 0} member menggunakan role ini.`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: 'var(--color-bg)',
                  border: '1.5px solid var(--color-border)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Batal
              </button>
               <button
                 onClick={() => void handleDelete(confirmDelete)}
                 disabled={preflightLoading || !preflight}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: '#dc2626', border: 'none',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 550,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            padding: 24, width: '100%', maxWidth: 420,
            maxHeight: '82dvh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{detail.name}</h3>
                <span style={{
                  display: 'inline-block', marginTop: 6, padding: '3px 8px', borderRadius: 8,
                  background: detail.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                  color: detail.status === 'Active' ? '#166534' : '#475569',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {detail.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            {detail.description && (
              <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                {detail.description}
              </p>
            )}
            <SectionHeader>Hak Akses</SectionHeader>
            <div style={{ display: 'grid', gap: 8 }}>
              {MODULES.map((module) => {
                const allowed = ACTIONS.filter((action) => detail.permissions[module]?.[action] === true);
                return (
                  <div key={module} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 7 }}>
                    <span style={{ fontSize: 13 }}>{MODULE_LABEL[module]}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'right' }}>
                      {allowed.length ? allowed.map((action) => ACTION_LABEL[action]).join(', ') : 'Tidak ada'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsRoles() {
  const { activeWorkspace }  = useWorkspace();
  const { can }              = useWorkspacePermission();
  const canCreate = can('memberManagement', 'create');
  const canUpdate = can('memberManagement', 'update');
  const canDelete = can('memberManagement', 'delete');
  const [tab, setTab]        = useState<'builtin' | 'custom'>('builtin');
  const [roles, setRoles] = useState<import('../types/customRole').WorkspaceRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');

  const workspaceId  = activeWorkspace?.workspace_uuid ?? '';

  const reloadRoles = useCallback(async () => {
    if (!workspaceId) return;
    setRolesLoading(true);
    setRolesError('');
    try {
      setRoles(await getWorkspaceRoles(workspaceId));
    } catch (error) {
      setRolesError(error instanceof Error ? error.message : 'Role tidak dapat dimuat.');
    } finally {
      setRolesLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void reloadRoles(); }, [reloadRoles]);

  const builtinRoles = roles.filter(
    (role): role is BuiltinRoleRecord => role.role_kind === 'builtin',
  );
  const customRoles = roles.filter(
    (role): role is CustomRoleRecord => role.role_kind === 'custom',
  );

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 20,
        }}>
          {(['builtin', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: tab === t ? 'var(--color-primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--color-muted)',
                border: 'none', fontSize: 14, fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {t === 'builtin' ? 'Role Bawaan' : 'Custom Role'}
              {t === 'custom' && canCreate && (
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 700,
                  background: '#fef3c7', color: '#92400e',
                  padding: '2px 6px', borderRadius: 8,
                }}>
                  Owner
                </span>
              )}
            </button>
          ))}
        </div>

         {rolesError && (
           <div style={{ padding: '12px 14px', marginBottom: 16, borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
             {rolesError}
             <button onClick={() => void reloadRoles()} style={{ marginLeft: 10, cursor: 'pointer' }}>Coba lagi</button>
           </div>
         )}

         {tab === 'builtin'
           ? <BuiltinRolesTab roles={builtinRoles} loading={rolesLoading} />
          : (
            <CustomRolesTab
              workspaceId={workspaceId}
               roles={customRoles}
               loading={rolesLoading}
               onReload={reloadRoles}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )
        }
      </div>
    </div>
  );
}
