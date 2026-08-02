// ─── Admin Reports — P0-005-003B-3 ───────────────────────────────────────────
// BUG-003 fix: removed all disabled buttons, implemented Generate Laporan,
// Export CSV, and Export JSON using live in-memory data stores.
// Export uses the same blob+anchor pattern as masterObatImportExport.ts (BUG-001).

import { useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_REPORT_LIST,
  REPORT_STATUS_CONFIG,
  REPORT_TYPE_CONFIG,
  REPORT_FORMAT_CONFIG,
  filterReports,
  type ReportStatus,
  type ReportType,
  type ReportFormat,
  type AdminReportRecord,
} from '../../../data/adminReportsData';
import {
  downloadReportCSV,
  downloadReportJSON,
  getReportData,
  type ReportModule,
} from '../../../utils/reportExport';

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: ReportStatus }) {
  const c = REPORT_STATUS_CONFIG[status] ?? REPORT_STATUS_CONFIG['Completed'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: ReportType }) {
  const c = REPORT_TYPE_CONFIG[type] ?? { icon: '📊', color: '#64748b' };
  return <span style={{ fontSize: 11.5, color: c.color }}>{c.icon} {type}</span>;
}

function FormatBadge({ format }: { format: ReportFormat }) {
  const c = REPORT_FORMAT_CONFIG[format] ?? { color: '#64748b', bg: '#f1f5f9' };
  return <span style={{ padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>{format}</span>;
}

// ─── Module config ────────────────────────────────────────────────────────────

const REPORT_MODULES: { module: ReportModule; icon: string; color: string }[] = [
  { module: 'Livestock',        icon: '🐄', color: '#10b981' },
  { module: 'Stok Pakan',       icon: '🌾', color: '#f59e0b' },
  { module: 'Formula Pakan',    icon: '🧪', color: '#8b5cf6' },
  { module: 'Produk Komersial', icon: '📦', color: '#3b82f6' },
];

// ─── Session-generated report records ────────────────────────────────────────

interface SessionReport {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  periodLabel: string;
  requestedBy: string;
  requestedAt: string;
  completedAt: string;
  rowCount: number;
  fileSizeKb: number;
}

let sessionCounter = 1;

function buildSessionReport(module: ReportModule, format: ReportFormat, rowCount: number): SessionReport {
  const now = new Date();
  const ts = now.toISOString().slice(0, 16).replace('T', ' ');
  const date = now.toISOString().slice(0, 10);
  const typeMap: Record<ReportModule, ReportType> = {
    'Livestock':        'Livestock',
    'Stok Pakan':       'Platform Summary',
    'Formula Pakan':    'Platform Summary',
    'Produk Komersial': 'Platform Summary',
  };
  return {
    id: `RPT-SESSION-${String(sessionCounter++).padStart(3, '0')}`,
    title: `Laporan ${module} — ${date}`,
    type: typeMap[module],
    format,
    status: 'Completed',
    periodLabel: date,
    requestedBy: 'Admin (Sesi ini)',
    requestedAt: ts,
    completedAt: ts,
    rowCount,
    fileSizeKb: Math.max(1, Math.round(rowCount * 0.3)),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportsModule() {
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | ReportStatus>('All');
  const [filterType, setFilterType]   = useState<'All' | ReportType>('All');

  const [selectedModule, setSelectedModule] = useState<ReportModule>('Livestock');
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [toast, setToast]                   = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleExportCSV() {
    const count = downloadReportCSV(selectedModule);
    const record = buildSessionReport(selectedModule, 'CSV', count);
    setSessionReports(prev => [record, ...prev]);
    showToast(`✅ CSV berhasil diunduh — ${count} baris (${selectedModule})`);
  }

  function handleExportJSON() {
    const count = downloadReportJSON(selectedModule);
    const record = buildSessionReport(selectedModule, 'JSON', count);
    setSessionReports(prev => [record, ...prev]);
    showToast(`✅ JSON berhasil diunduh — ${count} baris (${selectedModule})`);
  }

  function handleGenerate() {
    // Generate = produce + download a JSON report for selected module
    handleExportJSON();
  }

  // Stats from ADMIN_REPORT_LIST
  const total     = ADMIN_REPORT_LIST.length + sessionReports.length;
  const selesai   = ADMIN_REPORT_LIST.filter(r => r.status === 'Completed').length + sessionReports.filter(r => r.status === 'Completed').length;
  const proses    = ADMIN_REPORT_LIST.filter(r => r.status === 'Generating').length;
  const gagal     = ADMIN_REPORT_LIST.filter(r => r.status === 'Failed').length;

  // Filtered list: seed data + session-generated
  const filtered = filterReports(ADMIN_REPORT_LIST, {
    keyword: search || undefined,
    type:    filterType   !== 'All' ? filterType   : undefined,
    status:  filterStatus !== 'All' ? filterStatus : undefined,
  });

  const filteredSession = sessionReports.filter(r => {
    const kw = search.toLowerCase();
    if (kw && !r.title.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw)) return false;
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (filterType   !== 'All' && r.type   !== filterType)   return false;
    return true;
  });

  const combinedList = [...filteredSession, ...filtered];

  // Row count preview for selected module
  const preview = getReportData(selectedModule);

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Laporan</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📊 Manajemen Laporan</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Generate dan ekspor laporan data platform dalam format CSV atau JSON.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Laporan"  value={total}   icon="📊" color="#3b82f6" />
          <StatCard label="Selesai"        value={selesai} icon="✅" color="#10b981" />
          <StatCard label="Sedang Proses"  value={proses}  icon="⚙️" color="#f59e0b" />
          <StatCard label="Gagal"          value={gagal}   icon="❌" color="#ef4444" />
        </div>

        {/* Generate & Export Panel */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #f1f5f9', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>📋 Generate & Ekspor Laporan</div>

          {/* Module selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Pilih Modul</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REPORT_MODULES.map(({ module, icon, color }) => {
                const active = selectedModule === module;
                return (
                  <button
                    key={module}
                    onClick={() => setSelectedModule(module)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: `1.5px solid ${active ? color : '#e2e8f0'}`,
                      background: active ? `${color}15` : '#f8fafc',
                      color: active ? color : '#64748b',
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <span>{icon}</span> {module}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row count info */}
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, display: 'inline-block' }}>
            {preview.hasData
              ? `${preview.rowCount} baris data tersedia untuk modul ${selectedModule}`
              : `Tidak ada data tersedia untuk modul ${selectedModule} saat ini`}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerate}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid #3b82f6', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡ Generate Laporan
            </button>
            <button
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid #d97706', background: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              📄 Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid #7c3aed', background: '#ede9fe', color: '#5b21b6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              🗂️ Export JSON
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Laporan</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nama atau ID laporan…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'All' | ReportStatus)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="All">Semua Status</option>
              <option value="Completed">Selesai</option>
              <option value="Generating">Sedang Dibuat</option>
              <option value="Scheduled">Terjadwal</option>
              <option value="Failed">Gagal</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as 'All' | ReportType)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="All">Semua Tipe</option>
              <option value="Platform Summary">Ringkasan Platform</option>
              <option value="User Analytics">Analitik Pengguna</option>
              <option value="Subscription">Subscription</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Livestock">Livestock</option>
              <option value="Financial">Keuangan</option>
              <option value="Audit Log">Log Audit</option>
            </select>
          </label>
        </div>

        {/* Report history table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Riwayat Laporan</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{combinedList.length} laporan</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama Laporan', 'Tipe', 'Format', 'Status', 'Periode', 'Dibuat', 'Baris', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {combinedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tidak ada laporan yang cocok</div>
                      Coba ubah filter atau generate laporan baru.
                    </td>
                  </tr>
                ) : combinedList.map((r: AdminReportRecord | SessionReport) => {
                  const isSession = 'rowCount' in r && !('parameters' in r);
                  const rowCount = isSession ? (r as SessionReport).rowCount : (r as AdminReportRecord).rowCount;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: '#0f172a', fontWeight: 500, maxWidth: 260 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.id}</div>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.type} /></td>
                      <td style={{ padding: '11px 14px' }}><FormatBadge format={r.format} /></td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{r.periodLabel}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{r.requestedAt}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                        {rowCount != null ? rowCount.toLocaleString('id-ID') : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {r.status === 'Completed' && (
                          <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Selesai</span>
                        )}
                        {r.status !== 'Completed' && (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
