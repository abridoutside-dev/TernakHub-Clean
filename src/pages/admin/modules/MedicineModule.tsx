// ─── Admin Medicine — P0-005-018B / ADMIN-SYNC-001 ───────────────────────────
// ADMIN-SYNC-001: Switched from dummy adminMedicineData seed list to live
// Supabase query on `stok_obat` table (same source as production medicine module).
// RLS: admin sees medicine stock from workspaces they belong to.

import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  MED_TYPE_CONFIG,
  MED_STOCK_STATUS_CONFIG,
  filterMedicine,
  type AdminMedRecord,
  type MedType,
  type MedStockStatus,
} from '../../../data/adminMedicineData';

// ─── Supabase row shape (stok_obat) ──────────────────────────────────────────

interface StokObatRow {
  id: string;
  workspace_id: string;
  drug_name: string;
  quantity: number;
  unit: string;
  min_stock?: number | null;
  expiry_date?: string | null;
  batch_number?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  workspaces?: {
    name?: string | null;
    type?: string | null;
    owner_id?: string | null;
    owner_name?: string | null;
    plan?: string | null;
  } | null;
}

function deriveMedStockStatus(row: StokObatRow): MedStockStatus {
  if (row.status === 'Kadaluarsa') return 'Expired';
  if (row.status === 'Habis' || row.quantity === 0) return 'Habis';
  if (row.min_stock != null && row.quantity <= row.min_stock) return 'Rendah';
  return 'Tersedia';
}

function adaptStokObat(row: StokObatRow): AdminMedRecord {
  const stockStatus = deriveMedStockStatus(row);
  const ws = row.workspaces;

  // Determine expiry date status for display
  const isExpired = row.expiry_date
    ? new Date(row.expiry_date) < new Date()
    : false;

  return {
    id: row.id,
    name: row.drug_name,
    type: 'Produk Komersial' as MedType,
    category: 'Antibiotik' as AdminMedRecord['category'],
    stockStatus: isExpired ? 'Expired' : stockStatus,
    stockQty: row.quantity,
    stockUnit: row.unit,
    minStock: row.min_stock ?? 0,
    expiryDate: row.expiry_date ?? null,
    batchNumber: row.batch_number ?? null,
    photoColor: '#fef3c7',
    photoEmoji: '💊',
    indication: '—',
    dosage: '—',
    species: [],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 0,
    totalTreatments: 0,
    lastUsed: null,
    workspaceId: row.workspace_id,
    workspaceName: ws?.name ?? '—',
    workspaceType: ws?.type ?? '—',
    workspacePlan: ws?.plan ?? '—',
    workspaceLocation: '—',
    ownerId: ws?.owner_id ?? '—',
    ownerName: ws?.owner_name ?? '—',
    ownerAvatarInitials: (ws?.owner_name ?? 'U?').substring(0, 2).toUpperCase(),
    ownerAvatarColor: '#8b5cf6',
    registeredAt: new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    updatedAt: new Date(row.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeline: [],
    notes: row.notes ?? null,
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

function TypeBadge({ type }: { type: MedType }) {
  const c = MED_TYPE_CONFIG[type] ?? { icon: '📦', color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {type}
    </span>
  );
}

function StockBadge({ status }: { status: MedStockStatus }) {
  const c = MED_STOCK_STATUS_CONFIG[status] ?? { label: status, color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
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

function MedDrawer({ record, onClose }: { record: AdminMedRecord; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: record.photoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{record.photoEmoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{record.name}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 6 }}>{record.id}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <TypeBadge type={record.type} />
              <StockBadge status={record.stockStatus} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>Klinis</SectionLabel>
          <InfoRow label="Indikasi" value={record.indication} />
          <InfoRow label="Dosis" value={record.dosage} />
          <InfoRow label="Spesies" value={record.species.join(', ')} />
          <SectionLabel>Stok</SectionLabel>
          <InfoRow label="Stok Saat Ini" value={`${record.stockQty} ${record.stockUnit}`} />
          <InfoRow label="Stok Minimum" value={`${record.minStock} ${record.stockUnit}`} />
          <InfoRow label="Tgl. Kedaluwarsa" value={record.expiryDate ?? '—'} />
          <InfoRow label="Nomor Batch" value={record.batchNumber ?? '—'} />
          <SectionLabel>Pemakaian</SectionLabel>
          <InfoRow label="Bulan Ini" value={`${record.treatmentsThisMonth.toLocaleString('id-ID')} treatment`} />
          <InfoRow label="Total" value={`${record.totalTreatments.toLocaleString('id-ID')} treatment`} />
          <InfoRow label="Terakhir Dipakai" value={record.lastUsed ?? '—'} />
          <SectionLabel>Workspace</SectionLabel>
          <InfoRow label="Workspace" value={record.workspaceName} />
          <InfoRow label="Tipe" value={record.workspaceType} />
          <InfoRow label="Lokasi" value={record.workspaceLocation} />
          <InfoRow label="Owner" value={record.ownerName} />
          {record.notes && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#78350f' }}>📝 {record.notes}</div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedicineModule() {
  const [rows, setRows]        = useState<AdminMedRecord[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MedType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<MedStockStatus | 'All'>('All');
  const [selected, setSelected] = useState<AdminMedRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Load from Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [countResult, dataResult] = await Promise.all([
          supabase.from('stok_obat').select('*', { count: 'exact', head: true }),
          supabase.from('stok_obat')
            .select('*, workspaces(name, type, owner_id, owner_name, plan)')
            .order('created_at', { ascending: false })
            .limit(500),
        ]);
        if (cancelled) return;
        if (dataResult.error) { setError(dataResult.error.message); setLoading(false); return; }
        setTotal(countResult.count ?? 0);
        setRows((dataResult.data ?? []).map(adaptStokObat));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Computed platform stats from live data
  const platformStats = useMemo(() => ({
    total:    rows.length,
    inStock:  rows.filter(r => r.stockStatus === 'Tersedia').length,
    lowStock: rows.filter(r => r.stockStatus === 'Rendah').length,
    expired:  rows.filter(r => r.stockStatus === 'Expired').length,
  }), [rows]);

  const filtered = useMemo(() => filterMedicine(rows, {
    keyword: search || undefined,
    type: filterType !== 'All' ? filterType : 'All',
    stockStatus: filterStatus !== 'All' ? filterStatus : 'All',
  }), [rows, search, filterType, filterStatus]);

  const hasFilter = search || filterType !== 'All' || filterStatus !== 'All';
  const resetFilters = () => { setSearch(''); setFilterType('All'); setFilterStatus('All'); setCurrentPage(1); };

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
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Obat</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>💊 Manajemen Obat</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Ringkasan stok obat seluruh platform — data langsung dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>stok_obat</code> table.
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
              <StatCard label="Total Item Obat" value={totalCount.toLocaleString('id-ID')} icon="💊" color="#3b82f6" />
              <StatCard label="Tersedia"        value={platformStats.inStock.toLocaleString('id-ID')} icon="✅" color="#10b981" />
              <StatCard label="Stok Rendah"     value={platformStats.lowStock.toLocaleString('id-ID')} icon="⚠️" color="#f59e0b" />
              <StatCard label="Kedaluwarsa"     value={platformStats.expired.toLocaleString('id-ID')} icon="🚫" color="#ef4444" />
            </>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Obat</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama obat atau ID…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value as MedType | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Tipe</option>
              <option value="Master Obat">Master Obat</option>
              <option value="Produk Komersial">Produk Komersial</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status Stok</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as MedStockStatus | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Rendah">Rendah</option>
              <option value="Habis">Habis</option>
              <option value="Expired">Kedaluwarsa</option>
            </select>
          </label>
          {hasFilter && (
            <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>✕ Reset</button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Stok Obat (Seluruh Platform)</span>
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
                  {['Nama Obat', 'Tipe', 'Kategori', 'Stok', 'Status Stok', 'Tgl. Kedaluwarsa', 'Workspace', 'Pemakaian/Bulan'].map(h => (
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
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>
                        {rows.length === 0 ? 'Belum ada stok obat di Supabase.' : 'Tidak ada hasil yang cocok'}
                      </div>
                      {hasFilter && <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>}
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{r.photoEmoji}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.type} /></td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.category}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f172a' }}>{r.stockQty} {r.stockUnit}</td>
                    <td style={{ padding: '10px 14px' }}><StockBadge status={r.stockStatus} /></td>
                    <td style={{ padding: '10px 14px', color: r.stockStatus === 'Expired' ? '#dc2626' : '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{r.expiryDate ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12.5, color: '#0f172a' }}>{r.workspaceName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaceType}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>{r.treatmentsThisMonth.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
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
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {selected && <MedDrawer record={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
