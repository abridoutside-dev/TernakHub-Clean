import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { getMembersByUserId } from '../data/workspaceMembersData';
import { countUnread } from '../services/globalNotificationService';
import { subscribe } from '../utils/notifSignal';
import type { WorkspaceRecord } from '../types/workspace';

// ─── Legacy exports — kept for backward compatibility ──────────────────────────
// Marketplace components still import these. Do NOT remove until Marketplace
// is migrated to use WorkspaceContext directly.

export type WorkspaceJenis =
  | 'Peternakan'
  | 'Toko Pakan'
  | 'Toko Obat'
  | 'Transporter'
  | 'Dokter Hewan'
  | 'Klinik Hewan';

/**
 * Renders page-specific actions inside the shared TopAppBar.
 *
 * Page actions must not recreate the fixed header themselves: the app shell
 * owns the header geometry, while this slot owns only the action controls.
 */
export function HeaderActionPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('top-app-bar-actions'));
  }, []);

  return target ? createPortal(children, target) : null;
}

export interface WorkspacePlaceholder {
  id: string;
  icon: string;
  name: string;
  type: WorkspaceJenis;
  active: boolean;
}

export const WORKSPACES: WorkspacePlaceholder[] = [
  { id: 'w1', icon: '🐑', name: 'Berkah Farm Garut',      type: 'Peternakan',   active: true  },
  { id: 'w2', icon: '🐑', name: 'Berkah Farm Tasik',      type: 'Peternakan',   active: false },
  { id: 'w3', icon: '🌾', name: 'Toko Pakan Berkah',      type: 'Toko Pakan',   active: false },
  { id: 'w4', icon: '🚚', name: 'Berkah Transport',        type: 'Transporter',  active: false },
  { id: 'w5', icon: '👨‍⚕️', name: 'drh. Amelia Putri',    type: 'Dokter Hewan',  active: false },
  { id: 'w6', icon: '🏥', name: 'Klinik Hewan Sejahtera', type: 'Klinik Hewan', active: false },
];

export function getActiveWorkspace(): WorkspacePlaceholder {
  return WORKSPACES.find((w) => w.active) ?? WORKSPACES[0];
}

export function setActiveWorkspace(id: string): void {
  WORKSPACES.forEach((ws) => { ws.active = ws.id === id; });
}

// ─── Workspace type → display icon ────────────────────────────────────────────

function getWorkspaceIcon(ws: WorkspaceRecord): string {
  if (ws.logo_url) return ws.logo_url; // future: render as <img>
  switch (ws.workspace_type) {
    case 'Farm':       return '🐑';
    case 'FeedStore':  return '🌾';
    case 'Veterinary': return '🩺';
    case 'DrugStore':  return '💊';
    case 'Transport':  return '🚚';
    default:           return '🏢';
  }
}

// ─── Workspace Switcher Bottom Sheet ──────────────────────────────────────────

function WorkspaceSwitcher({
  workspaces,
  activeUuid,
  onClose,
  onSwitch,
}: {
  workspaces: WorkspaceRecord[];
  activeUuid: string | null;
  onClose: () => void;
  onSwitch: (uuid: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          zIndex: 300,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.13)',
          zIndex: 301,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            Pilih Workspace
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'var(--color-bg)', border: 'none',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Workspace list */}
        <div style={{ padding: '8px 0', maxHeight: '55vh', overflowY: 'auto' }}>
          {workspaces.map((ws) => {
            const isActive = ws.workspace_uuid === activeUuid;
            const icon     = getWorkspaceIcon(ws);
            return (
              <div
                key={ws.workspace_uuid}
                onClick={() => {
                  if (!isActive) { onSwitch(ws.workspace_uuid); onClose(); }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 20px',
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {ws.workspace_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                    {ws.workspace_type}
                    {ws.city ? ` · ${ws.city}` : ''}
                  </div>
                </div>

                {/* Active check */}
                {isActive && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>
                  </div>
                )}
              </div>
            );
          })}

          {workspaces.length === 0 && (
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
              Belum ada workspace.
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 20px' }} />

        {/* Buat Workspace Baru */}
        <div style={{ padding: '6px 0 12px' }}>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/workspace/create'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '13px 20px',
              background: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
              color: 'var(--color-primary)',
            }}>
              ＋
            </div>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: 'var(--color-primary)',
            }}>
              Buat Workspace Baru
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Top App Bar ───────────────────────────────────────────────────────────────

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  /** Show back button on the left AND the Workspace Switcher on the right simultaneously */
  showBackWithSwitcher?: boolean;
}

export default function TopAppBar({ title = 'TernakHub', showBack = false, showBackWithSwitcher = false }: TopAppBarProps) {
  const navigate = useNavigate();
  const [wsOpen, setWsOpen] = useState(false);

  // ── Reactive unread badge — async, re-loads on every store change ───────────
  const [unreadBadge, setUnreadBadge] = useState(0);
  const loadUnread = useCallback(async () => {
    try {
      const count = await countUnread();
      setUnreadBadge(count);
    } catch {
      // Not authenticated or network error — show no badge
      setUnreadBadge(0);
    }
  }, []);
  useEffect(() => {
    loadUnread();
    return subscribe(() => { loadUnread(); });
  }, [loadUnread]);

  // ── Real workspace data from context ─────────────────────────────────────────
  const { workspaces, activeWorkspace, setActiveWorkspaceUuid } = useWorkspace();
  const { currentUser } = useAuth();

  const memberships = currentUser ? getMembersByUserId(currentUser.id) : [];
  const memberWorkspaceIds = new Set(memberships.map((m) => m.workspace_uuid));
  const visibleWorkspaces = workspaces.filter(
    (w) => w.owner_user_uuid === currentUser?.id || memberWorkspaceIds.has(w.workspace_uuid),
  );

  const hasBack     = showBack || showBackWithSwitcher;
  const hasSwitcher = !showBack || showBackWithSwitcher;

  // Navigate back safely
  const handleBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  // Display values for the switcher button
  const activeIcon = activeWorkspace ? getWorkspaceIcon(activeWorkspace) : '🏢';
  const activeName = activeWorkspace?.workspace_name ?? 'TernakHub';

  return (
    <>
      {/* Outer header absorbs safe-area-inset-top; inner row is always 56px of usable space */}
      <header
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 'var(--top-app-bar-row-height)',
            minHeight: 'var(--top-app-bar-row-height)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: hasBack ? 4 : 16,
            paddingRight: 12,
            gap: 4,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
        {/* Back button */}
        {hasBack && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: 'none', border: 'none',
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-primary)',
              fontSize: 20, lineHeight: 1,
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
            aria-label="Kembali"
          >
            ←
          </button>
        )}

        {/* Title */}
        <span
          style={{
            fontSize: hasBack ? 17 : 18,
            fontWeight: 700,
            color: 'var(--color-primary)',
            flex: '1 1 auto',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: (hasBack && !hasSwitcher) ? 'left' : (hasBack ? 'left' : 'center'),
          }}
        >
          {title}
        </span>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label="Notifikasi"
          style={{
            position: 'relative',
            background: 'none', border: 'none',
            minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 20, lineHeight: 1, flexShrink: 0,
            color: 'var(--color-muted)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          🔔
          {unreadBadge > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              minWidth: 16, height: 16,
              borderRadius: 8, padding: '0 4px',
              background: '#ef4444', color: '#fff',
              fontSize: 9, fontWeight: 800, lineHeight: '16px',
              textAlign: 'center',
              border: '1.5px solid var(--color-surface)',
              boxSizing: 'border-box',
            }}>
              {unreadBadge > 99 ? '99+' : unreadBadge}
            </span>
          )}
        </button>

        {/* Workspace Switcher */}
        {hasSwitcher && (
          <button
            type="button"
            onClick={() => setWsOpen(true)}
            aria-label="Pilih workspace"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              minHeight: 44,
              background: 'var(--color-primary-light)',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 20,
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: 0,
              maxWidth: 'clamp(104px, 32vw, 180px)',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{activeIcon}</span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: 'var(--color-primary)',
              minWidth: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              flex: '1 1 auto',
            }}>
              {activeName}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-primary)', lineHeight: 1, flexShrink: 0 }}>▼</span>
          </button>
        )}

        {/* Page-specific actions share the same header row and geometry. */}
        <div
          id="top-app-bar-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            flexShrink: 0,
          }}
        />
        </div>
      </header>

      {/* Workspace Switcher Bottom Sheet */}
      {wsOpen && (
        <WorkspaceSwitcher
          workspaces={visibleWorkspaces}
          activeUuid={activeWorkspace?.workspace_uuid ?? null}
          onClose={() => setWsOpen(false)}
          onSwitch={(uuid) => { setActiveWorkspaceUuid(uuid); setWsOpen(false); }}
        />
      )}
    </>
  );
}
