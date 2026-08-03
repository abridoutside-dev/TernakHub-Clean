// ─── Workspaces Sub-Pages — DB-001B-3 / ADMIN-SYNC-003 ──────────────────────
// DB-001B-3: ADMIN_WORKSPACE_LIST dummy data removed.
// Data sourced from Supabase `workspaces` table via workspaceRepository.
// ADMIN-SYNC-003: BlockedWorkspacesPage (workspaces WHERE status=Suspended|Archived)
//                 PendingRequestsPage (workspace_invitations WHERE status=Pending, RLS-limited)
// Shows empty state when no data — no hardcoded values.

import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { getAllWorkspaces } from '../../../services/workspaceService';
import type { WorkspaceRecord } from '../../../types/workspace';
import {
  WS_PLAN_CONFIG,
  WS_STATUS_CONFIG,
  WS_TYPE_CONFIG,
  type AdminWorkspaceRecord,
  type WorkspaceStatus,
  type WorkspacePlanTier,
} from '../../../data/adminWorkspacesData';

const PAGE_SIZE = 20;

// ─── Type helpers ─────────────────────────────────────────────────────────────

type WsTypeDisplay = keyof typeof WS_TYPE_CONFIG;

const TYPE_MAP: Record<string, WsTypeDisplay> = {
  Farm:              'Farm',
  FeedStore:         'FeedStore',
  VeterinaryClinic:  'VeterinaryClinic',
  VeterinaryDoctor:  'VeterinaryDoctor',
  Transport:         'Transport',
  Marketplace:       'Marketplace',
  // Legacy aliases from old workspace service types
  Veterinary:        'VeterinaryClinic',
};

const STATUS_MAP: Record<string, WorkspaceStatus> = {
  Active:   'Active',
  Inactive: 'Suspended',
  Archived: 'Archived',
};

const VALID_PLANS: WorkspacePlanTier[] = ['Free', 'Basic', 'Pro', 'Enterprise'];

function adaptWorkspaceRecord(w: WorkspaceRecord): AdminWorkspaceRecord {
  const wsType: WsTypeDisplay  = TYPE_MAP[w.workspace_type]    ?? 'Farm';
  const wsStatus: WorkspaceStatus = STATUS_MAP[w.workspace_status] ?? 'Active';
  const wsPlan: WorkspacePlanTier =
    VALID_PLANS.includes(w.workspace_plan as WorkspacePlanTier)
      ? (w.workspace_plan as WorkspacePlanTier)
      : 'Free';
  return {
    id:           w.workspace_uuid,
    name:         w.workspace_name,
    slug:         w.workspace_slug,
    type:         wsType,
    status:       wsStatus,
    plan:         wsPlan,
    ownerId:      w.owner_user_uuid,
    ownerName:    w.email      ?? '—',
    ownerEmail:   w.email      ?? '—',
    ownerPhone:   w.phone      ?? '—',
    memberCount:  0,
    livestockCount: 0,
    createdAt: w.created_at
      ? new Date(w.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    lastActiveAt: w.updated_at
      ? new Date(w.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    lastActiveDaysAgo: w.updated_at
      ? Math.floor((Date.now() - new Date(w.updated_at).getTime()) / 86400000)
      : 999,
    notes:       undefined,
    members:     [],
    subscriptionSummary: {
      plan: wsPlan, billingStatus: 'N/A', renewalDate: '—', featuresUsed: 0, featuresTotal: 0,
    },
    livestockSummary:   { total: 0, active: 0, archived: 0, species: [] },
    marketplaceSummary: { activeListings: 0, completedTransactions: 0, totalRevenueMillion: 0 },
    recentActivity:     [],
  };
}

// ─── Shared hook ──────────────────────────────────────────────────────────────

function useAdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceRecord[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getAllWorkspaces()
      .then((records) => setWorkspaces(records.map(adaptWorkspaceRecord)))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  return { workspaces, loading };
}

// ─── Shared components ────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: string; color: string;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
      <div>Memuat data workspace…</div>
    </div>
  );
}

// ─── Export 1: WorkspacesPlansPage ────────────────────────────────────────────

export function WorkspacesPlansPage() {
  const { workspaces, loading } = useAdminWorkspaces();
  const [search,      setSearch]      = useState('');
  const [filterPlan,  setFilterPlan]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return workspaces.filter((w) => {
      if (filterPlan && w.plan !== filterPlan) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !w.ownerName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [workspaces, search, filterPlan]);

  const freeCnt = workspaces.filter((w) => w.plan === 'Free').length;
  const proCnt  = workspaces.filter((w) => w.plan === 'Pro').length;
  const entCnt  = workspaces.filter((w) => w.plan === 'Enterprise').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const hasFilter   = search || filterPlan;
  const resetFilters = () => { setSearch(''); setFilterPlan(''); setCurrentPage(1); };

  const plans: WorkspacePlanTier[] = ['Free', 'Basic', 'Pro', 'Enterprise'];

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Distribusi Paket</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            🏢 Distribusi Paket Workspace
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Distribusi paket langganan workspace — {workspaces.length} workspace ditampilkan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Free"       value={freeCnt}          icon="🆓" color="#64748b" />
          <StatCard label="Pro"        value={proCnt}           icon="⭐" color="#7c3aed" />
          <StatCard label="Enterprise" value={entCnt}           icon="🏆" color="#b45309" />
          <StatCard label="Total"      value={workspaces.length} icon="🏢" color="#3b82f6" />
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 20px',
          border: '1px solid #f1f5f9', marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Workspace</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Nama workspace atau pemilik…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Paket</span>
            <select
              value={filterPlan}
              onChange={(e) => { setFilterPlan(e.target.value); setCurrentPage(1); }}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Semua Paket</option>
              {plans.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {hasFilter && (
            <button
              onClick={resetFilters}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Workspace</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Workspace', 'Paket', 'Tipe', 'Status', 'Anggota', 'Pemilik'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><LoadingState /></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                      <div>Tidak ada hasil</div>
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                          Hapus Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((w, i) => {
                  const pc = WS_PLAN_CONFIG[w.plan] ?? WS_PLAN_CONFIG['Free'];
                  const sc = WS_STATUS_CONFIG[w.status];
                  const tc = WS_TYPE_CONFIG[w.type];
                  return (
                    <tr key={w.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{w.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, background: pc.bg, color: pc.color, fontSize: 11.5, fontWeight: 600 }}>
                          {w.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: tc.bg, color: tc.color, fontSize: 11.5, fontWeight: 600 }}>
                          {tc.icon} {w.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', textAlign: 'center' }}>{w.memberCount}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{w.ownerName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Export 2: WorkspacesVerificationPage ────────────────────────────────────

export function WorkspacesVerificationPage() {
  const { workspaces, loading } = useAdminWorkspaces();
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);

  const filtered = useMemo(() => {
    return workspaces.filter((w) => {
      if (filterStatus && w.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !w.ownerName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [workspaces, search, filterStatus]);

  const activeCnt    = workspaces.filter((w) => w.status === 'Active').length;
  const suspendedCnt = workspaces.filter((w) => w.status === 'Suspended').length;
  const archivedCnt  = workspaces.filter((w) => w.status === 'Archived').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const hasFilter    = search || filterStatus;
  const resetFilters = () => { setSearch(''); setFilterStatus(''); setCurrentPage(1); };

  const statuses: WorkspaceStatus[] = ['Active', 'Suspended', 'Archived'];

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Status & Verifikasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            ✅ Status & Verifikasi Workspace
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Status operasional seluruh workspace platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Aktif"     value={activeCnt}       icon="✅" color="#10b981" />
          <StatCard label="Suspended" value={suspendedCnt}    icon="🚫" color="#ef4444" />
          <StatCard label="Archived"  value={archivedCnt}     icon="📁" color="#64748b" />
          <StatCard label="Total"     value={workspaces.length} icon="🏢" color="#3b82f6" />
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 20px',
          border: '1px solid #f1f5f9', marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Nama workspace atau pemilik…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Semua Status</option>
              {statuses.map((s) => <option key={s} value={s}>{WS_STATUS_CONFIG[s].label}</option>)}
            </select>
          </label>
          {hasFilter && (
            <button
              onClick={resetFilters}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Status Workspace</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {filtered.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Workspace', 'Tipe', 'Status', 'Paket', 'Anggota', 'Ternak', 'Dibuat'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><LoadingState /></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                      <div>Tidak ada hasil</div>
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                          Hapus Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((w, i) => {
                  const sc = WS_STATUS_CONFIG[w.status];
                  const pc = WS_PLAN_CONFIG[w.plan] ?? WS_PLAN_CONFIG['Free'];
                  const tc = WS_TYPE_CONFIG[w.type];
                  return (
                    <tr key={w.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{w.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 13 }}>{tc.icon}</span>{' '}
                        <span style={{ fontSize: 12, color: tc.color }}>{w.type}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, background: pc.bg, color: pc.color, fontSize: 11.5, fontWeight: 600 }}>
                          {w.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', textAlign: 'center' }}>{w.memberCount}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', textAlign: 'center' }}>{w.livestockCount}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{w.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Export 3: BlockedWorkspacesPage — ADMIN-SYNC-003 ────────────────────────
// Data from Supabase `workspaces` table — filters status IN (Suspended, Archived).
// No RLS barrier: admin anon key can read all workspaces (same as WorkspacesModule).

export function BlockedWorkspacesPage() {
  const { workspaces: allWorkspaces, loading } = useAdminWorkspaces();
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState<WorkspaceStatus | ''>('');
  const [currentPage,   setCurrentPage]   = useState(1);

  const blocked = useMemo(
    () => allWorkspaces.filter(w => w.status === 'Suspended' || w.status === 'Archived'),
    [allWorkspaces],
  );

  const filtered = useMemo(() => {
    return blocked.filter(w => {
      if (filterStatus && w.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !w.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [blocked, search, filterStatus]);

  const suspendedCnt = blocked.filter(w => w.status === 'Suspended').length;
  const archivedCnt  = blocked.filter(w => w.status === 'Archived').length;

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const pageRows    = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const hasFilter   = search || filterStatus;
  const resetFilters = () => { setSearch(''); setFilterStatus(''); setCurrentPage(1); };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Terblokir</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            🚫 Workspace Terblokir
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Workspace dengan status <em>Suspended</em> atau <em>Archived</em> — data real dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>workspaces</code>.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Suspended"     value={loading ? '…' : suspendedCnt}    icon="🚫" color="#ef4444" />
          <StatCard label="Archived"      value={loading ? '…' : archivedCnt}     icon="📁" color="#64748b" />
          <StatCard label="Total Blocked" value={loading ? '…' : blocked.length}  icon="⛔" color="#b91c1c" />
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 20px',
          border: '1px solid #f1f5f9', marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Workspace</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Nama atau ID workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as WorkspaceStatus | ''); setCurrentPage(1); }}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Semua Status Blocked</option>
              <option value="Suspended">🚫 Suspended</option>
              <option value="Archived">📁 Archived</option>
            </select>
          </label>
          {hasFilter && (
            <button onClick={resetFilters}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              ✕ Reset
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Workspace Terblokir</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c' }}>
              {loading ? '…' : filtered.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Workspace', 'Tipe', 'Status', 'Paket', 'Owner', 'Dibuat'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><LoadingState /></td></tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
                      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                        {blocked.length === 0
                          ? 'Tidak ada workspace yang diblokir.'
                          : 'Tidak ada hasil sesuai filter.'}
                      </div>
                      {blocked.length === 0 && (
                        <div style={{ fontSize: 12 }}>Semua workspace berstatus Active.</div>
                      )}
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                          Hapus Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((w, i) => {
                  const sc = WS_STATUS_CONFIG[w.status];
                  const pc = WS_PLAN_CONFIG[w.plan] ?? WS_PLAN_CONFIG['Free'];
                  const tc = WS_TYPE_CONFIG[w.type as WsTypeDisplay];
                  return (
                    <tr key={w.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{w.id.slice(0, 16)}…</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{tc?.icon ?? '🏢'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 700 }}>{w.plan}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.ownerName}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{w.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Export 4: PendingRequestsPage — ADMIN-SYNC-003 ──────────────────────────
// Data from Supabase `workspace_invitations` WHERE status = 'Pending'.
// RLS: workspace_invitations_manage_admin → FOR ALL USING is_workspace_member(...['Owner','Admin']).
// Shows RLS notice — returns 0 rows if admin is not Owner/Admin in any workspace.

interface InvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  workspaces: { name: string | null } | null;
}

export function PendingRequestsPage() {
  const [rows, setRows]       = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const { data, error: fetchErr } = await supabase
          .from('workspace_invitations')
          .select('id, workspace_id, email, phone, role, status, expires_at, created_at, workspaces(name)')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(200);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
        setRows((data ?? []) as unknown as InvitationRow[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.email.toLowerCase().includes(q) ||
      (r.workspaces?.name?.toLowerCase().includes(q) ?? false) ||
      r.id.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const expiredSoon = useMemo(() => {
    const cutoff = Date.now() + 3 * 86400000;
    return rows.filter(r => r.expires_at && new Date(r.expires_at).getTime() < cutoff).length;
  }, [rows]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const pageRows    = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const ROLE_COLOR: Record<string, string> = {
    Owner: '#b91c1c', Admin: '#1d4ed8', Staff: '#059669', Viewer: '#64748b',
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Permintaan Pending</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            ⏳ Permintaan Pending
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Undangan workspace dengan status <em>Pending</em> — data real dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>workspace_invitations</code>.
          </p>
        </div>

        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <div>
            <strong>Akses dibatasi RLS:</strong> Menampilkan hanya undangan dari workspace
            di mana akun admin terdaftar sebagai <em>Owner</em> atau <em>Admin</em>.
            Agregasi lintas-workspace platform memerlukan <code>service_role</code> key (server-side).
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Pending"     value={loading ? '…' : rows.length}     icon="⏳" color="#f59e0b" />
          <StatCard label="Segera Kadaluarsa" value={loading ? '…' : expiredSoon}      icon="⌛" color="#dc2626" />
          <StatCard label="Ditampilkan"       value={loading ? '…' : filtered.length}  icon="🔍" color="#3b82f6" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 380 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari (Email / Workspace / ID)</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Email undangan atau nama workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Undangan Pending</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>
              {loading ? '…' : filtered.length}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat dari Supabase…' : 'Data real · workspace_invitations'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Email Diundang', 'Workspace', 'Peran', 'Telepon', 'Dibuat', 'Berakhir'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: '12px 14px' }}>
                        <div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%' }} />
                      </td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                      {rows.length === 0 ? (
                        <>
                          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tidak ada undangan pending yang dapat diakses</div>
                          <div style={{ fontSize: 12 }}>RLS membatasi akses — akun ini bukan Owner/Admin di workspace manapun, atau tidak ada undangan pending.</div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil sesuai pencarian.</div>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => {
                  const isExpiringSoon = r.expires_at && new Date(r.expires_at).getTime() < Date.now() + 3 * 86400000;
                  const roleColor = ROLE_COLOR[r.role ?? ''] ?? '#64748b';
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>{r.email}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.id.slice(0, 14)}…</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                        {r.workspaces?.name ?? <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {r.role ? (
                          <span style={{ padding: '3px 9px', borderRadius: 20, background: `${roleColor}18`, color: roleColor, fontSize: 11.5, fontWeight: 600 }}>
                            {r.role}
                          </span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{r.phone ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.expires_at ? (
                          <span style={{ color: isExpiringSoon ? '#dc2626' : '#64748b', fontWeight: isExpiringSoon ? 700 : 400 }}>
                            {isExpiringSoon ? '⌛ ' : ''}{new Date(r.expires_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
