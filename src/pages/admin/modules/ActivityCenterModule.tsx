// ─── Admin Activity Center — P0-005-018B ──────────────────────────────────────
// Wired to adminActivityData.ts (30 records, real filter, real stats).

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ACTIVITY_LIST,
  ACTIVITY_SUMMARY,
  MODULE_CONFIG,
  SEVERITY_CONFIG,
  RESULT_CONFIG,
  MODULE_OPTIONS,
  SEVERITY_OPTIONS,
  RESULT_OPTIONS,
  filterActivities,
  type ActivityModule,
  type ActivitySeverity,
  type ActivityResult,
} from '../../../data/adminActivityData';

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

function ResultBadge({ result }: { result: ActivityResult }) {
  const c = RESULT_CONFIG[result];
  return <span style={{ padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11, fontWeight: 600 }}>{c.label}</span>;
}

function SeverityDot({ severity }: { severity: ActivitySeverity }) {
  const c = SEVERITY_CONFIG[severity];
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} title={c.label} />;
}

function ModuleBadge({ module }: { module: ActivityModule }) {
  const c = MODULE_CONFIG[module] ?? { icon: '📋', color: '#64748b' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${c.color}18`, color: c.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {module}
    </span>
  );
}

function formatTimestamp(iso: string): { time: string; date: string } {
  try {
    const d = new Date(iso);
    return {
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    };
  } catch {
    return { time: iso, date: '' };
  }
}

export default function ActivityCenterModule() {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<ActivityModule | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<ActivitySeverity | ''>('');
  const [filterResult, setFilterResult] = useState<ActivityResult | ''>('');

  const filtered = useMemo(
    () => filterActivities(ACTIVITY_LIST, { search, module: filterModule, severity: filterSeverity, result: filterResult }),
    [search, filterModule, filterSeverity, filterResult],
  );

  const errorCount = useMemo(
    () => ACTIVITY_LIST.filter(r => r.result === 'Failed' || r.severity === 'Critical').length,
    [],
  );

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pusat Aktivitas</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📋 Pusat Aktivitas</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Log aktivitas platform — {ACTIVITY_LIST.length} catatan terbaru ditampilkan.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total (Hari Ini)"  value={ACTIVITY_SUMMARY.totalToday.toLocaleString('id-ID')} icon="📋" color="#3b82f6" />
          <StatCard label="Aktivitas User"    value={ACTIVITY_SUMMARY.userActivities.toLocaleString('id-ID')} icon="👤" color="#10b981" />
          <StatCard label="Marketplace"       value={ACTIVITY_SUMMARY.marketplaceActivities.toLocaleString('id-ID')} icon="🛒" color="#8b5cf6" />
          <StatCard label="Error / Critical"  value={errorCount} icon="⚠️" color="#ef4444" />
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Aktivitas</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="User, aksi, atau IP…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Modul</span>
            <select value={filterModule} onChange={e => setFilterModule(e.target.value as ActivityModule | '')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua Modul</option>
              {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Severity</span>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as ActivitySeverity | '')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua</option>
              {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Hasil</span>
            <select value={filterResult} onChange={e => setFilterResult(e.target.value as ActivityResult | '')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua</option>
              {RESULT_OPTIONS.map(r => <option key={r} value={r}>{RESULT_CONFIG[r].label}</option>)}
            </select>
          </label>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Log Aktivitas</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['', 'Waktu', 'User / Workspace', 'Modul', 'Aksi', 'IP Address', 'Hasil'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const ts = formatTimestamp(r.timestamp);
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', width: 20, verticalAlign: 'middle' }}>
                        <SeverityDot severity={r.severity} />
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{ts.time}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{ts.date}</div>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.actorName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaceName !== '—' ? r.workspaceName : r.actorId}</div>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <ModuleBadge module={r.module} />
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{r.action}</div>
                        <div style={{ fontSize: 11, color: '#64748b', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.ip}</td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <ResultBadge result={r.result} />
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
