// ─── Admin Notifications — P0-005-018B ───────────────────────────────────────
// Wired to adminNotificationsData.ts (28 records). Mark-all-read is functional.

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  SOURCE_CONFIG,
  TYPE_CONFIG,
  READ_STATUS_CONFIG,
  PRIORITY_CONFIG,
  filterNotifications,
  type NotificationRecord,
  type NotificationReadStatus,
  type NotificationPriority,
} from '../../../data/adminNotificationsData';
import {
  getAdminNotifications,
  markAllAdminNotificationsRead,
} from '../../../services/globalNotificationService';

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

export default function NotificationsModule() {
  const [list, setList] = useState<NotificationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterRead, setFilterRead] = useState<NotificationReadStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | ''>('');

  useEffect(() => {
    let cancelled = false;
    getAdminNotifications()
      .then((records) => {
        if (!cancelled) setList(records);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('[NotificationsModule] Failed to load notifications:', error);
          setList([]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const unreadCount = useMemo(() => list.filter(r => r.readStatus === 'Unread').length, [list]);
  const highPriorityCount = useMemo(() => list.filter(r => r.priority === 'High').length, [list]);
  const systemCount = useMemo(() => list.filter(r => r.source === 'System').length, [list]);

  const filtered = useMemo(
    () => filterNotifications(list, { keyword: search, source: 'All', type: 'All', readStatus: filterRead || 'All', priority: filterPriority || 'All' }),
    [list, search, filterRead, filterPriority],
  );

  async function handleMarkAllRead() {
    try {
      await markAllAdminNotificationsRead();
      setList((current) => current.map((record) => (
        record.readStatus === 'Unread'
          ? { ...record, readStatus: 'Read' }
          : record
      )));
    } catch (error) {
      console.error('[NotificationsModule] Failed to mark notifications as read:', error);
    }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Notifikasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🔔 Pusat Notifikasi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Notifikasi admin platform — {list.length} entri ditampilkan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Platform"   value={list.length.toLocaleString('id-ID')} icon="🔔" color="#3b82f6" />
          <StatCard label="Belum Dibaca"     value={unreadCount} icon="🔴" color="#ef4444" />
          <StatCard label="Prioritas Tinggi" value={highPriorityCount} icon="⚠️" color="#f59e0b" />
          <StatCard label="Sistem"           value={systemCount} icon="⚙️" color="#8b5cf6" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Notifikasi</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Judul atau konten…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status Baca</span>
            <select value={filterRead} onChange={e => setFilterRead(e.target.value as NotificationReadStatus | '')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua</option>
              <option value="Unread">Belum Dibaca</option>
              <option value="Read">Sudah Dibaca</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Prioritas</span>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as NotificationPriority | '')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua</option>
              <option value="High">Tinggi</option>
              <option value="Normal">Normal</option>
              <option value="Low">Rendah</option>
            </select>
          </label>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#0f172a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              ✓ Tandai Semua Dibaca ({unreadCount})
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Notifikasi</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['', 'Judul', 'Sumber', 'Tipe', 'Prioritas', 'Status Baca', 'Waktu'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada notifikasi yang cocok</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => {
                  const srcConf  = SOURCE_CONFIG[r.source]   ?? { icon: '📬', color: '#64748b' };
                  const typeConf = TYPE_CONFIG[r.type]       ?? { icon: 'ℹ️',  color: '#3b82f6', bg: '#eff6ff' };
                  const readConf = READ_STATUS_CONFIG[r.readStatus];
                  const priConf  = PRIORITY_CONFIG[r.priority];
                  const isUnread = r.readStatus === 'Unread';
                  return (
                    <tr key={r.id} style={{ background: isUnread ? '#fffbeb' : (i % 2 === 0 ? '#fff' : '#fafafa'), borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', width: 20, verticalAlign: 'middle' }}>
                        {isUnread && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                      </td>
                      <td style={{ padding: '10px 14px', minWidth: 200, verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: '#0f172a' }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.excerpt}</div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 13 }}>{srcConf.icon}</span>
                        <span style={{ marginLeft: 4, fontSize: 11.5, color: '#475569' }}>{r.source}</span>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: typeConf.bg, color: typeConf.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {typeConf.icon} {r.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: priConf.bg, color: priConf.color, fontSize: 11, fontWeight: 600 }}>{r.priority}</span>
                      </td>
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: readConf.bg, color: readConf.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{readConf.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
