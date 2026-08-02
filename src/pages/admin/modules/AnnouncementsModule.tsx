// ─── Admin Announcements — P0-005-018B ────────────────────────────────────────
// Wired to adminAnnouncementsData.ts (20 records, live filter, real stats).

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_ANNOUNCEMENT_LIST,
  ANNOUNCEMENT_PLATFORM_STATS,
  ANN_STATUS_CONFIG,
  ANN_TYPE_CONFIG,
  PRIORITY_CONFIG,
  type AnnouncementStatus,
  type AnnouncementAudience,
} from '../../../data/adminAnnouncementsData';

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

function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const c = ANN_STATUS_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {c.label}
    </span>
  );
}

const AUDIENCE_OPTIONS: AnnouncementAudience[] = [
  'All Users',
  'Workspace Owners',
  'Farm Workspace',
  'Veterinary Workspace',
  'Feed Store Workspace',
  'Transport Workspace',
  'Platform Admin',
];

export default function AnnouncementsModule() {
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState<AnnouncementStatus | 'All'>('All');
  const [filterAudience, setAudience] = useState<AnnouncementAudience | 'All'>('All');

  const stats = ANNOUNCEMENT_PLATFORM_STATS;
  const total = stats.published + stats.draft + stats.scheduled + stats.archived + stats.expired;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ADMIN_ANNOUNCEMENT_LIST.filter(r => {
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;
      if (filterAudience !== 'All' && r.audience !== filterAudience) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.authorName.toLowerCase().includes(q) && !r.excerpt.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterStatus, filterAudience]);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pengumuman</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📢 Manajemen Pengumuman</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Pengumuman platform — {ADMIN_ANNOUNCEMENT_LIST.length} entri ditampilkan dari {total.toLocaleString('id-ID')} total.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total"       value={total.toLocaleString('id-ID')} icon="📢" color="#3b82f6" />
          <StatCard label="Diterbitkan" value={stats.published} icon="✅" color="#10b981" />
          <StatCard label="Draf"        value={stats.draft}     icon="✏️" color="#8b5cf6" />
          <StatCard label="Terjadwal"   value={stats.scheduled} icon="📅" color="#f59e0b" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Judul</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Judul atau penulis…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select value={filterStatus} onChange={e => setStatus(e.target.value as AnnouncementStatus | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Status</option>
              <option value="Draft">Draf</option>
              <option value="Published">Diterbitkan</option>
              <option value="Scheduled">Terjadwal</option>
              <option value="Archived">Diarsipkan</option>
              <option value="Expired">Kedaluwarsa</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Audiens</span>
            <select value={filterAudience} onChange={e => setAudience(e.target.value as AnnouncementAudience | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Audiens</option>
              {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Pengumuman</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Judul', 'Tipe', 'Audiens', 'Prioritas', 'Status', 'Dibuat Oleh', 'Tanggal', 'Views'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const typeConf = ANN_TYPE_CONFIG[r.category];
                  const priConf = PRIORITY_CONFIG[r.priority];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', minWidth: 200, verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {r.isPinned && <span title="Disematkan" style={{ fontSize: 11 }}>📌</span>}
                          <span>{r.title}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.excerpt}</div>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13 }}>{typeConf?.icon}</span>
                        <span style={{ marginLeft: 4, fontSize: 11.5, color: '#475569' }}>{r.category}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.audience}</td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: priConf?.bg, color: priConf?.color, fontSize: 11, fontWeight: 600 }}>{r.priority}</span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <StatusBadge status={r.status} />
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 12, color: '#0f172a' }}>{r.authorName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.authorEmail}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {r.publishedAt ?? r.scheduledAt ?? r.createdAt}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {r.views.toLocaleString('id-ID')}
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
