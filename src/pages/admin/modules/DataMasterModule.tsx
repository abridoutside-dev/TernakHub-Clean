// ─── Admin Data Master — P0-005-018B ─────────────────────────────────────────
// Wired to adminDataMasterData.ts (30 entries, live filter, category counts).

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_MASTER_LIST,
  MASTER_STATUS_CONFIG,
  MASTER_CATEGORY_CONFIG,
  filterMasterEntries,
  type MasterStatus,
  type MasterCategory,
} from '../../../data/adminDataMasterData';

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

function StatusBadge({ status }: { status: MasterStatus }) {
  const c = MASTER_STATUS_CONFIG[status] ?? MASTER_STATUS_CONFIG['Aktif'];
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>;
}

const CATEGORIES: { key: MasterCategory; label: string }[] = [
  { key: 'Spesies Ternak',  label: 'Spesies Ternak' },
  { key: 'Ras Ternak',      label: 'Ras Ternak' },
  { key: 'Kategori Pakan',  label: 'Kategori Pakan' },
  { key: 'Kategori Obat',   label: 'Kategori Obat' },
  { key: 'Tipe Workspace',  label: 'Tipe Workspace' },
  { key: 'Tipe Kandang',    label: 'Tipe Kandang' },
  { key: 'Satuan Berat',    label: 'Satuan Berat' },
  { key: 'Alasan Arsip',    label: 'Alasan Arsip' },
];

export default function DataMasterModule() {
  const [activeView, setActiveView] = useState<'kategori' | 'entri'>('kategori');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MasterStatus | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<MasterCategory | 'All'>('All');

  const aktifCount   = useMemo(() => ADMIN_MASTER_LIST.filter(r => r.status === 'Aktif').length, []);
  const tidakAktifCount = useMemo(() => ADMIN_MASTER_LIST.filter(r => r.status === 'Tidak Aktif').length, []);

  const filtered = useMemo(
    () => filterMasterEntries(ADMIN_MASTER_LIST, {
      keyword:  search,
      kategori: filterCategory === 'All' ? undefined : filterCategory,
      status:   filterStatus   === 'All' ? undefined : filterStatus,
    }),
    [search, filterStatus, filterCategory],
  );

  const countByCategory = (cat: MasterCategory) => ADMIN_MASTER_LIST.filter(r => r.kategori === cat).length;

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Data Master</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🗃️ Data Master</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Manajemen data referensi platform — {ADMIN_MASTER_LIST.length} entri dari {CATEGORIES.length} kategori.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Kategori" value={CATEGORIES.length}          icon="🗃️" color="#3b82f6" />
          <StatCard label="Total Entri"    value={ADMIN_MASTER_LIST.length}   icon="📋" color="#10b981" />
          <StatCard label="Aktif"          value={aktifCount}                  icon="✅" color="#059669" />
          <StatCard label="Tidak Aktif"    value={tidakAktifCount}             icon="⏸️" color="#f59e0b" />
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid #e2e8f0' }}>
          {(['kategori', 'entri'] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              padding: '7px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: activeView === v ? '#fff' : 'transparent',
              color: activeView === v ? '#0f172a' : '#94a3b8',
              boxShadow: activeView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
              {v === 'kategori' ? '📂 Kategori' : '📋 Semua Entri'}
            </button>
          ))}
        </div>

        {activeView === 'kategori' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
            {CATEGORIES.map(cat => {
              const icon  = MASTER_CATEGORY_CONFIG[cat.key]?.icon ?? '📂';
              const color = MASTER_CATEGORY_CONFIG[cat.key]?.color ?? '#64748b';
              const count = countByCategory(cat.key);
              return (
                <div key={cat.key}
                  onClick={() => { setFilterCategory(cat.key); setActiveView('entri'); }}
                  style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                >
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{count} entri</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari entri…"
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12.5, outline: 'none', minWidth: 180 }} />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as MasterCategory | 'All')}
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12.5, background: '#fff', cursor: 'pointer' }}>
                <option value="All">Semua Kategori</option>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as MasterStatus | 'All')}
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12.5, background: '#fff', cursor: 'pointer' }}>
                <option value="All">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{filtered.length} entri</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama', 'Kode', 'Kategori', 'Scope', 'Status', 'Digunakan', 'Terakhir Update'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🗃️</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const catConf = MASTER_CATEGORY_CONFIG[r.kategori];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.nama}</div>
                        {r.namaEn && <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.namaEn}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11.5, color: '#64748b', verticalAlign: 'middle' }}>{r.kode}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 13 }}>{catConf?.icon}</span>
                        <span style={{ marginLeft: 4, fontSize: 11.5, color: '#475569' }}>{r.kategori}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.scope}</td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {r.jumlahPenggunaan.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
