// ─── Workspace Selector — WS-005 / AUTH-002B ─────────────────────────────────
//
// Route: /workspace/select
// resolveMeta: { hideTopBar: true, hideNav: true }
//
// ALWAYS shown after login and after creating the first workspace — even when
// the user has exactly 1 workspace. This is the mandatory selection checkpoint.
//
// Flow: show list → user picks → validate → setActiveWorkspaceUuid → navigate('/')
//
// Validation:
//   - Archived workspace  → block with error toast
//   - Inactive membership → block with error toast
//
// Recently Used:
//   - Tracked in localStorage via recentWorkspaces.ts (up to 5 entries)
//   - Shown as a "Recently Used" section at the top of the list
//
// Empty state:
//   - 0 accessible workspaces → show empty state + "Create Workspace"

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLogo from '../../components/auth/AuthLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
// LEGACY — scheduled removal after production migration.
// workspace_members is not yet in Supabase; member data served from in-memory store.
import { getMembersByUserId } from '../../data/workspaceMembersData';
import { getRecentWorkspaceUuids } from '../../utils/recentWorkspaces';
import {
  WORKSPACE_TYPE_LABEL,
  WORKSPACE_PLAN_LABEL,
  type WorkspaceType,
} from '../../types/workspace';
import { ROLE_LABEL, ROLE_COLOR } from '../../types/workspacePermissions';
import type { WorkspaceRecord } from '../../types/workspace';
// LEGACY — scheduled removal after production migration (type only).
import type { WorkspaceMemberRecord } from '../../data/workspaceMembersData';

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<WorkspaceType, string> = {
  Farm:       '🐄',
  FeedStore:  '🌾',
  Veterinary: '🩺',
  Transport:  '🚚',
};

const TYPE_COLOR: Record<WorkspaceType, { bg: string; text: string }> = {
  Farm:       { bg: '#e8f5ee', text: '#1b7a43' },
  FeedStore:  { bg: '#fff8e1', text: '#f57c00' },
  Veterinary: { bg: '#fce4ec', text: '#ad1457' },
  Transport:  { bg: '#f3e5f5', text: '#6a1b9a' },
};

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  Free:       { bg: '#f1f5f9', text: '#475569' },
  Pro:        { bg: '#dcfce7', text: '#166534' },
  Enterprise: { bg: '#ede9fe', text: '#5b21b6' },
};

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortKey = 'name_asc' | 'name_desc' | 'type' | 'recent' | 'plan';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name_asc',  label: 'Nama A → Z'      },
  { value: 'name_desc', label: 'Nama Z → A'      },
  { value: 'type',      label: 'Tipe'             },
  { value: 'plan',      label: 'Paket'            },
  { value: 'recent',    label: 'Terakhir Dipakai' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { kind: 'error' | 'info'; message: string }

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const isErr = toast.kind === 'error';
  return (
    <div style={{
      position: 'fixed', top: 16, left: 0, right: 0, zIndex: 400,
      display: 'flex', justifyContent: 'center', padding: '0 16px', pointerEvents: 'none',
    }}>
      <div style={{
        background: isErr ? '#fef2f2' : '#eff6ff',
        border: `1.5px solid ${isErr ? '#fca5a5' : '#93c5fd'}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: 460, width: '100%', pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 16, color: isErr ? '#dc2626' : '#1d4ed8', flexShrink: 0 }}>
          {isErr ? '⚠' : 'ℹ'}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isErr ? '#991b1b' : '#1e3a8a' }}>
          {toast.message}
        </span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: isErr ? '#dc2626' : '#1d4ed8', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Workspace card ───────────────────────────────────────────────────────────

interface CardProps {
  workspace:  WorkspaceRecord;
  membership: WorkspaceMemberRecord;
  isActive:   boolean;
  isBlocked:  boolean;
  blockReason?: string;
  loading:    boolean;
  onSelect:   () => void;
}

function WorkspaceCard({ workspace: ws, membership, isActive, isBlocked, blockReason, loading, onSelect }: CardProps) {
  const tc = TYPE_COLOR[ws.workspace_type] ?? { bg: '#f1f5f9', text: '#475569' };
  const rc = ROLE_COLOR[membership.role];
  const pc = PLAN_COLOR[ws.workspace_plan] ?? PLAN_COLOR.Free;
  const isArchived = ws.workspace_status === 'Archived';

  return (
    <div
      onClick={() => !loading && onSelect()}
      style={{
        position: 'relative', cursor: loading ? 'wait' : (isBlocked ? 'not-allowed' : 'pointer'),
        background: 'var(--color-surface)',
        border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 12, padding: '14px 14px 12px',
        boxShadow: isActive ? '0 0 0 3px rgba(27,122,67,0.10)' : 'var(--shadow-sm)',
        opacity: isBlocked ? 0.6 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
      }}
    >
      {/* Active top stripe */}
      {isActive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-primary)', borderRadius: '10px 10px 0 0' }} />
      )}

      {/* Card body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Type icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, border: `1px solid ${tc.text}22`,
        }}>
          {ws.logo_url
            ? <img src={ws.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
            : TYPE_ICON[ws.workspace_type]
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
              {ws.workspace_name}
            </span>
            {isActive && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--color-primary)', borderRadius: 99, padding: '2px 8px', letterSpacing: 0.3 }}>
                AKTIF
              </span>
            )}
            {isArchived && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', borderRadius: 99, padding: '2px 8px' }}>
                🔒 DIARSIPKAN
              </span>
            )}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.text }}>
              {WORKSPACE_TYPE_LABEL[ws.workspace_type]}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: rc.bg, color: rc.text }}>
              {ROLE_LABEL[membership.role]}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: pc.bg, color: pc.text }}>
              {WORKSPACE_PLAN_LABEL[ws.workspace_plan]}
            </span>
          </div>

          {/* Location + status */}
          {(ws.city || ws.province) && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              📍 {[ws.city, ws.province].filter(Boolean).join(', ')}
            </div>
          )}

          {membership.status === 'Inactive' && (
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
              ⚠ Keanggotaan Anda tidak aktif
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!loading) onSelect(); }}
        disabled={loading}
        style={{
          width: '100%', height: 38,
          fontSize: 13, fontWeight: 700,
          border: `1.5px solid ${isBlocked ? 'var(--color-border)' : 'var(--color-primary)'}`,
          borderRadius: 8, cursor: loading ? 'wait' : (isBlocked ? 'not-allowed' : 'pointer'),
          background: isActive
            ? 'var(--color-primary)'
            : (isBlocked ? 'var(--color-bg)' : 'var(--color-primary-light)'),
          color: isActive ? '#fff' : (isBlocked ? 'var(--color-muted)' : 'var(--color-primary)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s',
        }}
      >
        {loading ? (
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(27,122,67,0.3)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'ws-spin 0.7s linear infinite' }} />
        ) : isBlocked ? (
          blockReason === 'archived' ? '🔒 Diarsipkan — Tidak Dapat Dipilih' : '⚠ Keanggotaan Tidak Aktif'
        ) : isActive ? (
          '✓ Sedang Aktif'
        ) : (
          'Pilih Workspace Ini →'
        )}
      </button>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.8, paddingLeft: 2 }}>
      {children}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: 52 }}>🏚️</span>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Tidak Ada Workspace</p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5, maxWidth: 280 }}>
        Kamu belum menjadi anggota workspace manapun. Buat satu untuk memulai.
      </p>
      <Link
        to="/workspace/create"
        style={{ marginTop: 8, height: 42, padding: '0 24px', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--color-primary)', borderRadius: 10, textDecoration: 'none' }}
      >
        + Buat Workspace
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSelect() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  // FLOW-001F: refreshWorkspaces is retained only for the error-retry button.
  // It is NO LONGER called inside handleSelect (which caused an unnecessary
  // re-fetch race during navigation).
  const { workspaces, activeWorkspace, isLoading: wsLoading, wsError, setActiveWorkspaceUuid, refreshWorkspaces } = useWorkspace();

  const currentUserId = currentUser?.id ?? '';

  // ── FLOW-001F: Auto-navigate when exactly 1 non-blocked workspace ─────────
  // Requirement: WorkspaceSelect should only be shown when the user has
  // MORE than one workspace OR has no active workspace yet.
  // When there is exactly one workspace and it is accessible, skip the
  // selection step — auto-select it and go straight to the dashboard.
  const [autoNavigated, setAutoNavigated] = useState(false);

  // ── Build the user's workspace list ──────────────────────────────────────
  const memberships = useMemo(() => getMembersByUserId(currentUserId), [currentUserId]);

  // Pairs of (workspace, membership) for workspaces the user belongs to.
  //
  // FLOW-001D: owner fallback — `getMembersByUserId` reads the in-memory
  // members cache which is populated lazily from Supabase.  Immediately after
  // `WorkspaceCreate` the cache may not yet contain the owner row for the new
  // workspace.  We supplement with workspaces where `owner_user_uuid` matches
  // the current user so the selector is never blank right after creation.
  const userWorkspaces = useMemo(() => {
    // Primary path: cross-reference in-memory membership cache (legacy + synced)
    const fromMemberships = memberships
      .map((m) => {
        const ws = workspaces.find((w) => w.workspace_uuid === m.workspace_uuid);
        return ws ? { workspace: ws, membership: m } : null;
      })
      .filter((x): x is { workspace: WorkspaceRecord; membership: WorkspaceMemberRecord } => x !== null);

    // Fallback: newly-created Supabase workspaces owned by the current user
    // where the async member-sync hasn't run yet (timing gap after create).
    const seenUuids = new Set(fromMemberships.map((e) => e.workspace.workspace_uuid));
    const ownerFallback = workspaces
      .filter((w) => w.owner_user_uuid === currentUserId && !seenUuids.has(w.workspace_uuid))
      .map((w): { workspace: WorkspaceRecord; membership: WorkspaceMemberRecord } => ({
        workspace: w,
        membership: {
          member_uuid:    `owner-bootstrap-${w.workspace_uuid}`,
          workspace_uuid: w.workspace_uuid,
          user_id:        currentUserId,
          name:           '',
          email:          null,
          phone:          null,
          avatar_url:     null,
          role:           'Owner',
          status:         'Active',
          joined_at:      w.created_at,
        },
      }));

    return [...fromMemberships, ...ownerFallback];
  }, [memberships, workspaces, currentUserId]);

  // ── FLOW-001F: Auto-navigate for single-workspace users ───────────────────
  // If the user has exactly one non-blocked workspace, skip the selector and
  // go straight to the dashboard.  The selector only needs to be shown when
  // there are 2+ workspaces (real choice required) or 0 workspaces (empty state).
  useEffect(() => {
    if (autoNavigated) return;
    if (authLoading || wsLoading) return;
    if (wsError) return;
    if (userWorkspaces.length !== 1) return;

    const { workspace: ws, membership: mem } = userWorkspaces[0];
    // Don't auto-navigate into a blocked workspace — let the user see why.
    if (ws.workspace_status === 'Archived' || mem.status === 'Inactive') return;

    setAutoNavigated(true);
    setActiveWorkspaceUuid(ws.workspace_uuid);
    navigate('/dashboard', { replace: true });
  }, [autoNavigated, authLoading, wsLoading, wsError, userWorkspaces, setActiveWorkspaceUuid, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recently used ─────────────────────────────────────────────────────────
  const [recentUuids] = useState<string[]>(() => getRecentWorkspaceUuids());

  const recentEntries = useMemo(() => {
    return recentUuids
      .map((uuid) => userWorkspaces.find((e) => e.workspace.workspace_uuid === uuid))
      .filter((e): e is NonNullable<typeof e> => e != null); // find() returns undefined (not null) when not found; != catches both
  }, [recentUuids, userWorkspaces]);

  // ── Search / sort ─────────────────────────────────────────────────────────
  const [query,   setQuery]   = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');

  const sorted = useMemo(() => {
    let list = [...userWorkspaces];

    // Filter by query
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(({ workspace: w, membership: m }) =>
        w.workspace_name.toLowerCase().includes(q) ||
        WORKSPACE_TYPE_LABEL[w.workspace_type].toLowerCase().includes(q) ||
        (w.city ?? '').toLowerCase().includes(q) ||
        (w.province ?? '').toLowerCase().includes(q) ||
        ROLE_LABEL[m.role].toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      const wa = a.workspace; const wb = b.workspace;
      if (sortKey === 'name_asc')  return wa.workspace_name.localeCompare(wb.workspace_name);
      if (sortKey === 'name_desc') return wb.workspace_name.localeCompare(wa.workspace_name);
      if (sortKey === 'type')      return wa.workspace_type.localeCompare(wb.workspace_type);
      if (sortKey === 'plan') {
        const order = { Enterprise: 0, Pro: 1, Free: 2 };
        return (order[wa.workspace_plan] ?? 3) - (order[wb.workspace_plan] ?? 3);
      }
      if (sortKey === 'recent') {
        const ia = recentUuids.indexOf(wa.workspace_uuid);
        const ib = recentUuids.indexOf(wb.workspace_uuid);
        if (ia === -1 && ib === -1) return wa.workspace_name.localeCompare(wb.workspace_name);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return 0;
    });

    return list;
  }, [userWorkspaces, query, sortKey, recentUuids]);

  // ── Switch handler ────────────────────────────────────────────────────────
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(kind: ToastState['kind'], message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4500);
  }

  function getBlockReason(ws: WorkspaceRecord, mem: WorkspaceMemberRecord): string | null {
    if (ws.workspace_status === 'Archived') return 'archived';
    if (mem.status === 'Inactive')           return 'inactive';
    return null;
  }

  function handleSelect(ws: WorkspaceRecord, mem: WorkspaceMemberRecord) {
    // Already switching?
    if (switchingId) return;

    // Already active?
    if (activeWorkspace?.workspace_uuid === ws.workspace_uuid) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Validation
    const reason = getBlockReason(ws, mem);
    if (reason === 'archived') {
      showToast('error', `"${ws.workspace_name}" diarsipkan dan tidak dapat diakses. Hubungi pemilik workspace.`);
      return;
    }
    if (reason === 'inactive') {
      showToast('error', `Keanggotaan Anda di "${ws.workspace_name}" tidak aktif. Hubungi pemilik workspace untuk mengaktifkan kembali.`);
      return;
    }

    // Switch — FLOW-001F: removed refreshWorkspaces() call here.
    // Calling it during navigation caused an unnecessary re-fetch race where
    // the fetch could complete after the component unmounted, resetting activeUuid.
    setSwitchingId(ws.workspace_uuid);
    setActiveWorkspaceUuid(ws.workspace_uuid);
    setTimeout(() => {
      setSwitchingId(null);
      navigate('/dashboard', { replace: true });
    }, 160); // brief pause so active state propagates
  }

  // P0-006 / FLOW-001F: Show loading while auth OR workspace data is in-flight.
  // Without the authLoading check, a fresh login would flash EmptyState briefly
  // before onAuthStateChange fires and WorkspaceContext starts its own fetch.
  if (authLoading || wsLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ width: 36, height: 36, border: '3.5px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'ws-spin 0.7s linear infinite' }} />
        <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (wsError) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--color-bg)', gap: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Gagal Memuat Workspace</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', maxWidth: 320, lineHeight: 1.6 }}>{wsError}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>Periksa koneksi internet Anda, lalu coba lagi.</p>
        <button onClick={refreshWorkspaces} style={{ marginTop: 8, height: 44, padding: '0 28px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 16px 48px',
      background: 'var(--color-bg)', gap: 0,
    }}>
      <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        <AuthLogo size={52} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.3px' }}>TernakHub</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>Platform Manajemen Peternakan Modern</p>
      </div>

      {/* Panel */}
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>

        {/* Panel header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Pilih Workspace</h2>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.4 }}>
            {userWorkspaces.length > 0
              ? `Kamu terdaftar di ${userWorkspaces.length} workspace${userWorkspaces.length > 1 ? '' : ''}. Pilih satu untuk melanjutkan.`
              : 'Kamu belum menjadi anggota workspace manapun.'}
          </p>
        </div>

        {/* Empty state */}
        {userWorkspaces.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Search + Sort */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari workspace…"
                  style={{
                    width: '100%', padding: '9px 10px 9px 34px', borderRadius: 9,
                    border: '1.5px solid var(--color-border)', fontSize: 13,
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{ padding: '8px 10px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Recently Used section */}
            {recentEntries.length > 0 && !query && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel>🕐 Terakhir Dipakai</SectionLabel>
                {recentEntries.slice(0, 3).map(({ workspace: ws, membership: mem }) => (
                  <WorkspaceCard
                    key={ws.workspace_uuid}
                    workspace={ws}
                    membership={mem}
                    isActive={activeWorkspace?.workspace_uuid === ws.workspace_uuid}
                    isBlocked={getBlockReason(ws, mem) !== null}
                    blockReason={getBlockReason(ws, mem) ?? undefined}
                    loading={switchingId === ws.workspace_uuid}
                    onSelect={() => handleSelect(ws, mem)}
                  />
                ))}
              </div>
            )}

            {/* All workspaces section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentEntries.length > 0 && !query && (
                <SectionLabel>🏢 Semua Workspace ({sorted.length})</SectionLabel>
              )}

              {sorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)', fontSize: 14 }}>
                  Tidak ada workspace yang cocok dengan "{query}".
                </div>
              ) : (
                sorted.map(({ workspace: ws, membership: mem }) => (
                  <WorkspaceCard
                    key={ws.workspace_uuid}
                    workspace={ws}
                    membership={mem}
                    isActive={activeWorkspace?.workspace_uuid === ws.workspace_uuid}
                    isBlocked={getBlockReason(ws, mem) !== null}
                    blockReason={getBlockReason(ws, mem) ?? undefined}
                    loading={switchingId === ws.workspace_uuid}
                    onSelect={() => handleSelect(ws, mem)}
                  />
                ))
              )}
            </div>

          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Link
          to="/workspace/create"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
        >
          + Buat Workspace Baru
        </Link>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--color-border)', textAlign: 'center' }}>
        © {new Date().getFullYear()} TernakHub. Hak cipta dilindungi.
      </p>
    </div>
  );
}
