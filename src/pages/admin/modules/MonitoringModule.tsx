// ─── Admin Monitoring Center — P0-005-018B ────────────────────────────────────
// Wired to adminMonitoringData.ts — real stats, health panels, events, charts.

import { useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  MONITORING_CENTER_STATS,
  HEALTH_PANELS,
  RECENT_MONITORING_EVENTS,
  ACTIVITY_CHART_DATASETS,
  ADMIN_SERVICE_LIST,
  SERVICE_STATUS_CONFIG,
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
} from '../../../data/adminMonitoringData';

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
    </div>
  );
}

const S = MONITORING_CENTER_STATS;
const dbService = ADMIN_SERVICE_LIST.find(s => s.id === 'SVC-002');

export default function MonitoringModule() {
  const [activeChart, setActiveChart] = useState(0);

  const chartDataset = ACTIVITY_CHART_DATASETS[activeChart];
  const maxVal = Math.max(...(chartDataset?.values ?? [1]));

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pusat Pemantauan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📡 Pusat Pemantauan</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 700 }}>
              🟢 {S.systemStatus}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Kesehatan, performa, dan event platform — diperbarui: {S.lastUpdated}
          </p>
        </div>

        {/* System Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Pengguna Aktif"       value={S.activeUsers.toLocaleString('id-ID')} sub={S.activeUsersDelta} icon="👥" color="#3b82f6" />
          <StatCard label="Workspace Aktif"      value={S.activeWorkspaces.toLocaleString('id-ID')} sub={S.activeWorkspacesDelta} icon="🏢" color="#8b5cf6" />
          <StatCard label="Transaksi Hari Ini"   value={S.marketplaceTransactionsToday} sub={S.marketplaceTransactionsDelta} icon="🛒" color="#10b981" />
          <StatCard label="Skor Kesehatan"       value={`${S.systemHealthScore}%`} icon="❤️" color="#f59e0b" />
          <StatCard label="Jobs Berjalan"        value={S.backgroundJobsRunning} sub={`${S.backgroundJobsPending} menunggu · ${S.backgroundJobsFailed} gagal`} icon="⚙️" color="#0ea5e9" />
        </div>

        {/* Health Panels + Recent Events */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Health Panels */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9' }}>
            <SectionHeader title="Kesehatan Sistem" icon="❤️" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HEALTH_PANELS.map(panel => {
                const statusConf = SERVICE_STATUS_CONFIG[panel.status];
                return (
                  <div key={panel.key} style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{panel.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{panel.label}</span>
                        <span style={{ padding: '1px 7px', borderRadius: 20, background: statusConf.bg, color: statusConf.color, fontSize: 11, fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusConf.dot, marginRight: 4, verticalAlign: 'middle' }} />
                          {statusConf.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{panel.detail}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{panel.uptimePercent}%</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{panel.latencyDisplay}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Events */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9' }}>
            <SectionHeader title="Kejadian Terbaru" icon="🕐" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RECENT_MONITORING_EVENTS.map(ev => {
                const sevConf = EVENT_SEVERITY_CONFIG[ev.severity];
                const stConf  = EVENT_STATUS_CONFIG[ev.status];
                return (
                  <div key={ev.eventId} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${sevConf.border}`, background: sevConf.bg }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 14, flexShrink: 0, lineHeight: '20px' }}>{ev.moduleIcon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: sevConf.color }}>{ev.severity.toUpperCase()}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>·</span>
                          <span style={{ padding: '1px 6px', borderRadius: 12, background: stConf.bg, color: stConf.color, fontSize: 10, fontWeight: 600 }}>{ev.status}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>{ev.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Charts */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 28 }}>
          <SectionHeader title="Grafik Aktivitas (7 Hari Terakhir)" icon="📈" />
          {/* Dataset selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {ACTIVITY_CHART_DATASETS.map((ds, idx) => (
              <button key={ds.key} onClick={() => setActiveChart(idx)} style={{
                padding: '5px 12px', borderRadius: 8, border: `1px solid ${idx === activeChart ? ds.color : '#e2e8f0'}`,
                background: idx === activeChart ? `${ds.color}18` : '#f8fafc',
                color: idx === activeChart ? ds.color : '#64748b',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {ds.icon} {ds.label}
              </button>
            ))}
          </div>
          {chartDataset && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                {chartDataset.values.map((v, i) => {
                  const pct = maxVal > 0 ? (v / maxVal) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: chartDataset.color }}>{v.toLocaleString('id-ID')}</div>
                      <div style={{ width: '100%', borderRadius: 4, background: chartDataset.color, height: `${Math.max(pct, 4)}%`, maxHeight: 72, transition: 'height 0.3s' }} />
                      <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{chartDataset.labels[i]}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 11.5, color: '#64748b' }}>Satuan: {chartDataset.unit} · Modul: {chartDataset.module}</div>
            </div>
          )}
        </div>

        {/* Database Metrics */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 28 }}>
          <SectionHeader title="Metrik Database" icon="🗄️" />
          {dbService ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {[
                { label: 'Connections', value: `${dbService.connectionPoolUsed}/${dbService.connectionPoolMax}` },
                { label: 'Query Time (p50)', value: `${dbService.responseTimeMs} ms` },
                { label: 'Query Time (p99)', value: `${dbService.p99ResponseTimeMs} ms` },
                { label: 'Req/min', value: dbService.requestsPerMin.toLocaleString('id-ID') },
                { label: 'Replication Lag', value: `${dbService.replicationLagMs} ms` },
                { label: 'Error Rate', value: `${dbService.errorRatePercent}%` },
              ].map(m => (
                <div key={m.label} style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{m.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Tidak ada data database tersedia.</div>
          )}
        </div>

        {/* Queue & Workers — from service list */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 32 }}>
          <SectionHeader title="Antrian & Proses Latar" icon="⚙️" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {ADMIN_SERVICE_LIST.filter(s => s.type === 'Queue' || s.type === 'Scheduler').map(s => {
              const stConf = SERVICE_STATUS_CONFIG[s.status];
              return (
                <div key={s.id} style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{s.name.includes('Queue') ? '📨' : s.name.includes('Scheduler') ? '⏰' : '⚙️'}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', flex: 1 }}>{s.name}</span>
                    <span style={{ padding: '1px 7px', borderRadius: 20, background: stConf.bg, color: stConf.color, fontSize: 10, fontWeight: 600 }}>{stConf.label}</span>
                  </div>
                  {s.queueDepth !== undefined && (
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>
                      Depth: <b style={{ color: '#0f172a' }}>{s.queueDepth.toLocaleString('id-ID')}</b> · Rate: <b style={{ color: '#0f172a' }}>{s.queueProcessingRate?.toLocaleString('id-ID')}/min</b>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Uptime: {s.uptimePercent}% · v{s.version}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
