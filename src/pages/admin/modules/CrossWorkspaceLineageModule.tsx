// ─── Admin Cross-Workspace Lineage — ADMIN-003 ───────────────────────────────
// ADMIN-003: All dummy/seed data removed. Shows empty state.
// Backend integration pending — no hardcoded values.

import { useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  CWL_VERIFICATION_CONFIG,
  CWL_SPECIES_CONFIG,
  CWL_WORKSPACE_TYPE_CONFIG,
  type CWLVerificationStatus,
  type CWLSpecies,
  type CWLWorkspaceType,
} from '../../../data/adminCrossWorkspaceLineageData';

void CWL_WORKSPACE_TYPE_CONFIG;
type _WsType = CWLWorkspaceType; void (0 as unknown as _WsType);

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

function VerifBadge({ status }: { status: CWLVerificationStatus }) {
  const c = CWL_VERIFICATION_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>;
}

function SpeciesBadge({ species }: { species: CWLSpecies }) {
  const c = CWL_SPECIES_CONFIG[species];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{species}</span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>{c.icon} {species}</span>;
}

export default function CrossWorkspaceLineageModule() {
  const [search, setSearch] = useState('');
  const [filterVerif, setFilterVerif] = useState('All');
  const [filterSpecies, setFilterSpecies] = useState('All');
  void VerifBadge; void SpeciesBadge; void search; void filterVerif; void filterSpecies;

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Silsilah Lintas Workspace</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🧬 Silsilah Lintas Workspace</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Silsilah ternak lintas workspace seluruh platform — integrasi backend belum tersedia.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Silsilah"  value="—" icon="🧬" color="#3b82f6" />
          <StatCard label="Terverifikasi"   value="—" icon="✅" color="#10b981" />
          <StatCard label="Menunggu Tinjauan" value="—" icon="⏳" color="#f59e0b" />
          <StatCard label="Tautan Lintas WS"  value="—" icon="🔗" color="#8b5cf6" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Ternak</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama, kode, atau ID ternak…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status Verifikasi</span>
            <select value={filterVerif} onChange={e => setFilterVerif(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua</option>
              <option value="Verified">Terverifikasi</option>
              <option value="Partially Verified">Terverifikasi Sebagian</option>
              <option value="Unverified">Belum Terverifikasi</option>
              <option value="Disputed">Disengketakan</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Spesies</span>
            <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua</option>
              <option value="Sapi">🐄 Sapi</option>
              <option value="Kambing">🐐 Kambing</option>
              <option value="Domba">🐑 Domba</option>
              <option value="Kerbau">🦬 Kerbau</option>
              <option value="Babi">🐷 Babi</option>
              <option value="Ayam">🐔 Ayam</option>
            </select>
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Cross-Workspace Lineage</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ternak', 'Spesies', 'Workspace Asal', 'Induk (Dam)', 'Pejantan (Sire)', 'Keturunan', 'Verifikasi', 'Silsilah Lintas WS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🧬</div>
                    <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Belum ada data cross-workspace lineage</div>
                    Backend belum tersedia.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
