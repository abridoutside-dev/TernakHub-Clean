// ─── Admin Workspace Management — ADM-004 / ADMIN-003 ────────────────────────
// ADMIN-003: All dummy data removed. Data sourced from Supabase `workspaces` table.
// Shows 0 / empty state when no data. No hardcoded values.

import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
const PAGE_SIZE = 20;
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  WS_STATUS_CONFIG,
  WS_PLAN_CONFIG,
  WS_TYPE_CONFIG,
  type AdminWorkspaceRecord,
  type WorkspaceStatus,
  type WorkspacePlanTier,
  type WsType,
} from '../../../data/adminWorkspacesData';
import { getSubscriptionPackages } from '../../../services/workspaceService';
import type { SubscriptionPackage } from '../../../types/subscriptionAdmin';

// ─── Supabase row shape ───────────────────────────────────────────────────────

interface WorkspaceRow {
  id: string;
  name?: string | null;
  slug?: string | null;
  type?: string | null;
  status?: string | null;
  plan?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  member_count?: number | null;
  livestock_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
}

const VALID_TYPES: WsType[] = ['Farm', 'FeedStore', 'VeterinaryClinic', 'VeterinaryDoctor', 'Transport', 'Marketplace'];
const VALID_STATUSES: WorkspaceStatus[] = ['Active', 'Suspended', 'Archived'];
const VALID_PLANS: WorkspacePlanTier[] = ['Free', 'Basic', 'Pro', 'Enterprise'];

function adaptWorkspace(w: WorkspaceRow): AdminWorkspaceRecord {
  const wsType: WsType = VALID_TYPES.includes(w.type as WsType) ? (w.type as WsType) : 'Farm';
  const wsStatus: WorkspaceStatus = VALID_STATUSES.includes(w.status as WorkspaceStatus) ? (w.status as WorkspaceStatus) : 'Active';
  const wsPlan: WorkspacePlanTier = VALID_PLANS.includes(w.plan as WorkspacePlanTier) ? (w.plan as WorkspacePlanTier) : 'Free';
  return {
    id: w.id,
    name: w.name ?? '—',
    slug: w.slug ?? w.id,
    type: wsType,
    status: wsStatus,
    plan: wsPlan,
    ownerId: w.owner_id ?? '—',
    ownerName: w.owner_name ?? '—',
    ownerEmail: w.owner_email ?? '—',
    ownerPhone: w.owner_phone ?? '—',
    memberCount: w.member_count ?? 0,
    livestockCount: w.livestock_count ?? 0,
    createdAt: w.created_at ? new Date(w.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    lastActiveAt: w.updated_at ? new Date(w.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    lastActiveDaysAgo: w.updated_at ? Math.floor((Date.now() - new Date(w.updated_at).getTime()) / 86400000) : 999,
    notes: w.notes ?? undefined,
    members: [],
    subscriptionSummary: { plan: wsPlan, billingStatus: 'N/A', renewalDate: '—', featuresUsed: 0, featuresTotal: 0 },
    livestockSummary: { total: w.livestock_count ?? 0, active: 0, archived: 0, species: [] },
    marketplaceSummary: { activeListings: 0, completedTransactions: 0, totalRevenueMillion: 0 },
    recentActivity: [],
  };
}

async function fetchCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error || count === null) return 0;
  return count;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkspaceStatus }) {
  const c = WS_STATUS_CONFIG[status] ?? WS_STATUS_CONFIG['Active'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: WorkspacePlanTier }) {
  const c = WS_PLAN_CONFIG[plan] ?? WS_PLAN_CONFIG['Free'];
  return <span style={{ padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>{plan}</span>;
}

function TypeBadge({ type }: { type: WsType }) {
  const c = WS_TYPE_CONFIG[type] ?? WS_TYPE_CONFIG['Farm'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {c.label}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}


function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function InputField({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', outline: 'none' }} />
    </label>
  );
}

function SkeletonBox({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />;
}

// ─── Workspace Detail Drawer ──────────────────────────────────────────────────

function WorkspaceDetailDrawer({ ws, onClose }: { ws: AdminWorkspaceRecord; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const tc = WS_TYPE_CONFIG[ws.type] ?? WS_TYPE_CONFIG['Farm'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(15,23,42,0.15)', animation: 'slideInRight 0.22s ease' }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{tc.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6 }}>{ws.id.substring(0, 20)}…</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={ws.status} />
              <PlanBadge plan={ws.plan} />
              <TypeBadge type={ws.type} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>1 · Informasi Workspace</SectionLabel>
          <InfoRow label="Workspace ID" value={<code style={{ fontSize: 11.5, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{ws.id}</code>} />
          <InfoRow label="Nama" value={ws.name} />
          <InfoRow label="Tipe" value={<TypeBadge type={ws.type} />} />
          <InfoRow label="Status" value={<StatusBadge status={ws.status} />} />
          <InfoRow label="Plan" value={<PlanBadge plan={ws.plan} />} />
          <InfoRow label="Dibuat" value={ws.createdAt} />
          <InfoRow label="Terakhir Aktif" value={ws.lastActiveAt} />
          {ws.notes && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              ⚠️ {ws.notes}
            </div>
          )}
          <SectionLabel>2 · Owner</SectionLabel>
          <InfoRow label="Owner ID" value={ws.ownerId || '—'} />
          <InfoRow label="Nama" value={ws.ownerName || '—'} />
          <InfoRow label="Email" value={ws.ownerEmail || '—'} />
          <InfoRow label="Phone" value={ws.ownerPhone || '—'} />
          <SectionLabel>3 · Ringkasan</SectionLabel>
          <InfoRow label="Anggota" value={ws.memberCount.toLocaleString()} />
          <InfoRow label="Ternak" value={ws.livestockCount.toLocaleString()} />
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacesModule() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState<AdminWorkspaceRecord[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);

  const [nameQ, setNameQ]           = useState('');
  const [filterStatus, setStatus]   = useState('All');
  const [filterPlan, setPlan]       = useState('All');
  const [filterType, setType]       = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [total, { data, error: fetchErr }, pkgs] = await Promise.all([
          fetchCount('workspaces'),
          supabase.from('workspaces').select('*').order('created_at', { ascending: false }).limit(200),
          getSubscriptionPackages(),
        ]);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
        setTotal(total);
        setRows((data ?? []).map(adaptWorkspace));
        setPackages(pkgs);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (nameQ) { const q = nameQ.toLowerCase(); r = r.filter(w => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)); }
    if (filterStatus !== 'All') r = r.filter(w => w.status === filterStatus);
    if (filterPlan !== 'All') r = r.filter(w => w.plan === filterPlan);
    if (filterType !== 'All') r = r.filter(w => w.type === filterType);
    return r;
  }, [rows, nameQ, filterStatus, filterPlan, filterType]);

  const hasFilter = nameQ || filterStatus !== 'All' || filterPlan !== 'All' || filterType !== 'All';
  const resetFilters = () => { setNameQ(''); setStatus('All'); setPlan('All'); setType('All'); setCurrentPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const typeBreakdown = useMemo(() => {
    const m: Partial<Record<WsType, number>> = {};
    rows.forEach(r => { m[r.type] = (m[r.type] ?? 0) + 1; });
    return m;
  }, [rows]);

  const statCards = [
    { label: 'Total Workspaces',    value: totalCount.toLocaleString(),                             icon: '🏢', color: '#3b82f6', delta: 'Semua workspace' },
    { label: 'Dimuat',              value: rows.length.toLocaleString(),                             icon: '📋', color: '#10b981', delta: 'Dari Supabase' },
    { label: 'Filter Aktif',        value: filtered.length.toLocaleString(),                         icon: '🔍', color: '#8b5cf6', delta: 'Setelah filter' },
    { label: 'Peternakan',          value: (typeBreakdown['Farm']             ?? 0).toLocaleString(), icon: '🐄', color: '#059669', delta: 'Farm' },
    { label: 'Toko Pakan',          value: (typeBreakdown['FeedStore']        ?? 0).toLocaleString(), icon: '🌾', color: '#d97706', delta: 'FeedStore' },
    { label: 'Klinik Hewan',        value: (typeBreakdown['VeterinaryClinic'] ?? 0).toLocaleString(), icon: '🏥', color: '#0ea5e9', delta: 'VeterinaryClinic' },
    { label: 'Dokter Hewan',        value: (typeBreakdown['VeterinaryDoctor'] ?? 0).toLocaleString(), icon: '👨‍⚕️', color: '#8b5cf6', delta: 'VeterinaryDoctor' },
    { label: 'Transportasi',        value: (typeBreakdown['Transport']        ?? 0).toLocaleString(), icon: '🚛', color: '#f59e0b', delta: 'Transport' },
    { label: 'Marketplace',         value: (typeBreakdown['Marketplace']      ?? 0).toLocaleString(), icon: '🛒', color: '#ec4899', delta: 'Marketplace' },
  ];

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Workspaces</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🏢 Manajemen Workspace</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Observasi workspace tingkat platform — data langsung dari Supabase <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>workspaces</code> table.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
              </div>
              {loading ? <SkeletonBox height={28} /> : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: loading ? 8 : 0 }}>{card.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🔍 Cari Workspace</div>
          <InputField label="Nama / ID Workspace" placeholder="Nama atau ID…" value={nameQ} onChange={setNameQ} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🗂 Filter</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <SelectField label="Status" value={filterStatus} onChange={setStatus} options={[
              { value: 'All', label: 'Semua Status' }, { value: 'Active', label: '✅ Aktif' },
              { value: 'Suspended', label: '🚫 Ditangguhkan' }, { value: 'Archived', label: '📦 Diarsipkan' },
            ]} />
            <SelectField label="Plan" value={filterPlan} onChange={setPlan} options={[
              { value: 'All', label: 'Semua Paket' },
              ...packages.map(p => ({ value: p.plan_key, label: p.name })),
            ]} />
            <SelectField label="Tipe" value={filterType} onChange={setType} options={[
              { value: 'All',               label: 'Semua Tipe' },
              { value: 'Farm',              label: '🐄 Peternakan' },
              { value: 'FeedStore',         label: '🌾 Toko Pakan' },
              { value: 'VeterinaryClinic',  label: '🏥 Klinik Hewan' },
              { value: 'VeterinaryDoctor',  label: '👨‍⚕️ Dokter Hewan' },
              { value: 'Transport',         label: '🚛 Transportasi' },
              { value: 'Marketplace',       label: '🛒 Marketplace' },
            ]} />
            {hasFilter && <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>✕ Reset</button>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Workspace</span>
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>
                {loading ? '…' : `${filtered.length} dari ${totalCount}`}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{loading ? 'Memuat…' : 'Data dari Supabase · Klik baris untuk detail'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Workspace', 'Tipe', 'Owner', 'Plan', 'Anggota', 'Ternak', 'Dibuat', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: '12px 14px' }}><SkeletonBox height={18} /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                      {hasFilter ? 'Tidak ada workspace yang sesuai filter.' : rows.length === 0 ? 'Belum ada workspace terdaftar di Supabase.' : 'Tidak ada hasil.'}
                      {hasFilter && <button onClick={resetFilters} style={{ display: 'block', margin: '10px auto 0', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>}
                    </td>
                  </tr>
                ) : pageRows.map((ws, idx) => {
                  const tc = WS_TYPE_CONFIG[ws.type] ?? WS_TYPE_CONFIG['Farm'];
                  return (
                    <tr key={ws.id} onClick={() => navigate(`/admin/workspaces/${ws.id}`)}
                      style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{ws.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{ws.id.substring(0, 16)}…</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: tc.color, fontWeight: 600 }}>{tc.icon}</span>
                        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{ws.type}</div>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 160 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.ownerName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.ownerEmail}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}><PlanBadge plan={ws.plan} /></td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: ws.memberCount === 0 ? '#94a3b8' : '#0f172a' }}>{ws.memberCount}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: ws.livestockCount === 0 ? '#94a3b8' : '#0f172a', fontWeight: ws.livestockCount > 0 ? 700 : 400 }}>
                        {ws.livestockCount > 0 ? ws.livestockCount.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{ws.createdAt}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={ws.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {loading ? '…' : `Menampilkan ${filtered.length === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '…' ? (
                    <span key={`e-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p as number)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: p === safePage ? '#3b82f6' : '#fff', color: p === safePage ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
