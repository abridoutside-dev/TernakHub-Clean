// ─── Admin Livestock — ADMIN-003 / P0-005-018B / ADMIN-SYNC-001 ──────────────
// ADMIN-SYNC-001: Switched from dummy adminLivestockData seed list to live
// Supabase query on the `livestock` table (same source as production module).
// RLS: admin sees livestock from workspaces they belong to.
// Empty state shown when no data is accessible.

import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  LIVESTOCK_STATUS_CONFIG,
  LIVESTOCK_SPECIES_CONFIG,
  filterLivestock,
  type AdminLivestockRecord,
  type LivestockAdminStatus,
  type LivestockSpecies,
} from '../../../data/adminLivestockData';

// ─── Supabase row shape ───────────────────────────────────────────────────────

interface LivestockRow {
  id: string;
  workspace_id: string;
  name?: string | null;
  species: string;
  breed?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  current_weight_kg?: number | null;
  health_status: string;
  location_status: string;
  archive_reason?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  workspaces?: {
    name?: string | null;
    type?: string | null;
    owner_id?: string | null;
    owner_name?: string | null;
    owner_email?: string | null;
    plan?: string | null;
  } | null;
}

const VALID_SPECIES: LivestockSpecies[] = ['Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda'];
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

function adaptLivestock(row: LivestockRow): AdminLivestockRecord {
  let status: LivestockAdminStatus = 'Aktif';
  if (row.location_status === 'Arsip') {
    if (row.archive_reason === 'Terjual') status = 'Terjual';
    else if (row.archive_reason === 'Mati') status = 'Mati';
    else status = 'Arsip';
  }

  const species: LivestockSpecies = VALID_SPECIES.includes(row.species as LivestockSpecies)
    ? (row.species as LivestockSpecies)
    : 'Sapi';

  const sc = LIVESTOCK_SPECIES_CONFIG[species] ?? LIVESTOCK_SPECIES_CONFIG['Sapi'];
  const ws = row.workspaces;

  let age = '—';
  if (row.birth_date) {
    const months = Math.floor((Date.now() - new Date(row.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.5));
    age = months < 24 ? `${months} bln` : `${Math.floor(months / 12)} thn`;
  }

  const displayName = row.name ?? `${species}-${row.id.substring(0, 6)}`;
  const avatarColor = AVATAR_COLORS[row.id.charCodeAt(0) % AVATAR_COLORS.length];

  return {
    id: row.id,
    name: displayName,
    species,
    breed: row.breed ?? '—',
    gender: (row.sex === 'Jantan' || row.sex === 'Betina' ? row.sex : 'Jantan') as 'Jantan' | 'Betina',
    age,
    birthDate: row.birth_date ?? '—',
    weight: row.current_weight_kg != null ? `${row.current_weight_kg} kg` : '—',
    color: '—',
    status,
    healthStatus: row.health_status ?? '—',
    vaccinated: false,
    lastCheckup: null,
    treatmentCount: 0,
    photoColor: sc.bg ?? '#f1f5f9',
    photoEmoji: sc.icon ?? '🐄',
    ownerId: ws?.owner_id ?? '—',
    ownerName: ws?.owner_name ?? '—',
    ownerEmail: ws?.owner_email ?? '—',
    ownerPhone: '—',
    ownerAvatarInitials: displayName.substring(0, 2).toUpperCase(),
    ownerAvatarColor: avatarColor,
    workspaceId: row.workspace_id,
    workspaceName: ws?.name ?? '—',
    workspaceType: ws?.type ?? '—',
    workspacePlan: ws?.plan ?? '—',
    workspaceLocation: '—',
    registeredAt: new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    updatedAt: new Date(row.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeline: [],
    archiveReason: row.archive_reason ?? null,
    archiveDate: row.archived_at ? new Date(row.archived_at).toLocaleDateString('id-ID') : null,
    notes: null,
  };
}

function SkeletonBox({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />;
}

const PAGE_SIZE = 20;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: LivestockAdminStatus }) {
  const c = LIVESTOCK_STATUS_CONFIG[status] ?? LIVESTOCK_STATUS_CONFIG['Aktif'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function SpeciesBadge({ species }: { species: LivestockSpecies }) {
  const c = LIVESTOCK_SPECIES_CONFIG[species] ?? LIVESTOCK_SPECIES_CONFIG['Sapi'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {species}
    </span>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function LivestockDrawer({ record, onClose }: { record: AdminLivestockRecord; onClose: () => void }) {
  const sc = LIVESTOCK_SPECIES_CONFIG[record.species] ?? LIVESTOCK_SPECIES_CONFIG['Sapi'];
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{record.photoEmoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{record.name}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace' }}>{record.id}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={record.status} />
              <SpeciesBadge species={record.species} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>Identitas</SectionLabel>
          <InfoRow label="ID" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{record.id}</code>} />
          <InfoRow label="Nama" value={record.name} />
          <InfoRow label="Ras" value={record.breed} />
          <InfoRow label="Jenis Kelamin" value={record.gender} />
          <InfoRow label="Umur" value={record.age} />
          <InfoRow label="Berat" value={record.weight} />
          <InfoRow label="Warna" value={record.color} />
          <SectionLabel>Kesehatan</SectionLabel>
          <InfoRow label="Status Kesehatan" value={record.healthStatus} />
          <InfoRow label="Vaksinasi" value={record.vaccinated ? '✓ Sudah' : '✗ Belum'} />
          <InfoRow label="Pemeriksaan Terakhir" value={record.lastCheckup ?? '—'} />
          <InfoRow label="Jumlah Treatment" value={record.treatmentCount} />
          <SectionLabel>Workspace</SectionLabel>
          <InfoRow label="Workspace" value={record.workspaceName} />
          <InfoRow label="Tipe" value={record.workspaceType} />
          <InfoRow label="Plan" value={record.workspacePlan} />
          <InfoRow label="Lokasi" value={record.workspaceLocation} />
          <InfoRow label="Owner" value={record.ownerName} />
          <SectionLabel>Tanggal</SectionLabel>
          <InfoRow label="Terdaftar" value={record.registeredAt} />
          <InfoRow label="Diperbarui" value={record.updatedAt} />
          {record.notes && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#78350f' }}>
              📝 {record.notes}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LivestockModule() {
  const [rows, setRows]       = useState<AdminLivestockRecord[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LivestockAdminStatus | 'All'>('All');
  const [filterSpecies, setFilterSpecies] = useState<LivestockSpecies | 'All'>('All');
  const [selected, setSelected] = useState<AdminLivestockRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Load from Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [countResult, dataResult] = await Promise.all([
          supabase.from('livestock').select('*', { count: 'exact', head: true }),
          supabase.from('livestock')
            .select('*, workspaces(name, type, owner_id, owner_name, owner_email, plan)')
            .order('created_at', { ascending: false })
            .limit(500),
        ]);
        if (cancelled) return;
        if (dataResult.error) { setError(dataResult.error.message); setLoading(false); return; }
        setTotal(countResult.count ?? 0);
        setRows((dataResult.data ?? []).map(adaptLivestock));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const uniqueWorkspaces = useMemo(() => new Set(rows.map(r => r.workspaceId)).size, [rows]);

  // Computed platform stats from live data
  const platformStats = useMemo(() => ({
    total:  rows.length,
    active: rows.filter(r => r.status === 'Aktif').length,
    sold:   rows.filter(r => r.status === 'Terjual').length,
  }), [rows]);

  const filtered = useMemo(() => filterLivestock(rows, {
    keyword: search || undefined,
    species: filterSpecies !== 'All' ? filterSpecies : 'All',
    status:  filterStatus  !== 'All' ? filterStatus  : 'All',
  }), [rows, search, filterStatus, filterSpecies]);

  const hasFilter = search || filterStatus !== 'All' || filterSpecies !== 'All';
  const resetFilters = () => { setSearch(''); setFilterStatus('All'); setFilterSpecies('All'); setCurrentPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Ternak</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🐄 Ikhtisar Ternak</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Data ternak seluruh platform — data langsung dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>livestock</code> table.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
                <SkeletonBox height={28} />
              </div>
            ))
          ) : (
            <>
              <StatCard label="Total Ternak" value={totalCount.toLocaleString('id-ID')} icon="🐄" color="#3b82f6" />
              <StatCard label="Aktif"        value={platformStats.active.toLocaleString('id-ID')} icon="✅" color="#10b981" />
              <StatCard label="Terjual"      value={platformStats.sold.toLocaleString('id-ID')} icon="💰" color="#f59e0b" />
              <StatCard label="Workspace"    value={uniqueWorkspaces.toLocaleString('id-ID')} icon="🏢" color="#8b5cf6" />
            </>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Ternak</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama, ID, atau kode…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as LivestockAdminStatus | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua</option>
              <option value="Aktif">Aktif</option>
              <option value="Terjual">Terjual</option>
              <option value="Mati">Mati</option>
              <option value="Arsip">Arsip</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Spesies</span>
            <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value as LivestockSpecies | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua</option>
              <option value="Domba">🐑 Domba</option>
              <option value="Kambing">🐐 Kambing</option>
              <option value="Sapi">🐄 Sapi</option>
              <option value="Kerbau">🦬 Kerbau</option>
              <option value="Kuda">🐴 Kuda</option>
            </select>
          </label>
          {hasFilter && (
            <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              ✕ Reset
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Ternak (Seluruh Platform)</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {loading ? '…' : `${filtered.length} dari ${totalCount}`}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat dari Supabase…' : 'Data dari Supabase · Klik baris untuk detail'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ternak', 'Workspace', 'Spesies', 'Ras', 'Umur', 'Berat', 'Status', 'Terdaftar'].map(h => (
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
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🐄</div>
                      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                        {rows.length === 0 ? 'Belum ada ternak terdaftar di Supabase.' : 'Tidak ada hasil yang cocok'}
                      </div>
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => {
                  const sc = LIVESTOCK_SPECIES_CONFIG[r.species] ?? LIVESTOCK_SPECIES_CONFIG['Sapi'];
                  return (
                    <tr key={r.id} onClick={() => setSelected(r)}
                      style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{r.photoEmoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, color: '#0f172a' }}>{r.workspaceName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaceLocation}</div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: sc.color, fontWeight: 600, fontSize: 12.5 }}>{sc.icon} {r.species}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12.5 }}>{r.breed}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: 12.5 }}>{r.age}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap', fontSize: 12.5 }}>{r.weight}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{r.registeredAt}</td>
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
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {selected && <LivestockDrawer record={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
