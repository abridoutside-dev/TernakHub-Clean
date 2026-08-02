// ─── Users Sub-Pages ─────────────────────────────────────────────────────────
import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  USER_STATUS_CONFIG,
  type AdminUserRecord,
  type UserStatus,
} from '../../../data/adminUsersData';
import {
  ACTIVITY_LIST,
  SEVERITY_CONFIG,
  RESULT_CONFIG,
  MODULE_CONFIG,
  ACTIVITY_SUMMARY,
  type ActivityRecord,
  type ActivitySeverity,
  type ActivityResult,
} from '../../../data/adminActivityData';

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

// ─── Supabase row shape (user_profiles, DB-001A) ─────────────────────────────
// Note: email and is_admin are NOT in user_profiles; they live in auth.users.
interface ProfileRow {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function adaptProfile(p: ProfileRow): AdminUserRecord {
  const name = p.full_name ?? p.display_name ?? '—';
  const initials = name !== '—' ? name.substring(0, 2).toUpperCase() : 'U?';
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return {
    id: p.id,
    fullName: name,
    email: '—',        // not available from user_profiles; requires auth.users join
    phone: p.phone_number ?? '—',
    avatarInitials: initials,
    avatarColor: color,
    status: 'Active' as UserStatus,  // user_profiles has no status column
    isAdmin: false,                  // cannot determine without JWT/auth.users
    totalWorkspaces: 0,
    workspaces: [],
    registeredAt: p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    lastActiveAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    lastActiveDaysAgo: p.updated_at ? Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000) : 999,
    notes: undefined,
  };
}

// ─── Export 1: UsersRolesPage ─────────────────────────────────────────────────
export function UsersRolesPage() {
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchErr } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
        setRows((data ?? []).map(adaptProfile));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [rows, search]);

  const totalAdmin = rows.filter(u => u.isAdmin).length;
  const totalRegular = rows.filter(u => !u.isAdmin).length;
  const totalSuspended = rows.filter(u => u.status === 'Suspended').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Pengguna</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Peran & Hak Akses</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>👤 Peran & Hak Akses</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Distribusi peran pengguna platform — data dari Supabase user_profiles.</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>⚠️ {error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Pengguna" value={loading ? '…' : rows.length} icon="👥" color="#3b82f6" />
          <StatCard label="Admin Platform" value={loading ? '…' : totalAdmin} icon="⚙️" color="#ef4444" />
          <StatCard label="Pengguna Reguler" value={loading ? '…' : totalRegular} icon="👤" color="#10b981" />
          <StatCard label="Suspended" value={loading ? '…' : totalSuspended} icon="🚫" color="#f59e0b" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Pengguna</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Nama atau email…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Pengguna & Peran</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama', 'Email', 'Peran', 'Status', 'Terdaftar'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>Memuat data…</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data</td></tr>
                ) : pageRows.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{u.fullName}</td>
                    <td style={{ padding: '10px 14px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 20, background: u.isAdmin ? '#fee2e2' : '#f1f5f9', color: u.isAdmin ? '#b91c1c' : '#475569', fontSize: 11.5, fontWeight: 600 }}>
                        {u.isAdmin ? 'Admin' : 'Reguler'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {(() => { const c = USER_STATUS_CONFIG[u.status] ?? USER_STATUS_CONFIG['Active']; return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
                        </span>
                      ); })()}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{u.registeredAt}</td>
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
    </AdminLayout>
  );
}

// ─── Export 2: UsersActivityPage ──────────────────────────────────────────────
export function UsersActivityPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const sorted = [...ACTIVITY_LIST].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (!search) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(r => r.actorName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.action.toLowerCase().includes(q));
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const critical = ACTIVITY_LIST.filter(r => r.severity === 'Critical').length;
  const warnings = ACTIVITY_LIST.filter(r => r.severity === 'Warning').length;
  const failed = ACTIVITY_LIST.filter(r => r.result === 'Failed').length;

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Pengguna</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Log Aktivitas</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📋 Log Aktivitas</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Riwayat aktivitas platform — {ACTIVITY_LIST.length} event tersedia.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Event" value={ACTIVITY_SUMMARY.totalToday.toLocaleString('id-ID')} icon="📊" color="#3b82f6" />
          <StatCard label="Critical" value={critical} icon="🔴" color="#ef4444" />
          <StatCard label="Warning" value={warnings} icon="⚠️" color="#f59e0b" />
          <StatCard label="Failed" value={failed} icon="❌" color="#dc2626" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Aktivitas</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Nama aktor atau deskripsi aksi…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Log Aktivitas Platform</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Waktu', 'Modul', 'Aktor', 'Aksi', 'Severity', 'Hasil'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada hasil</td></tr>
                ) : pageRows.map((r: ActivityRecord, i) => {
                  const mc = MODULE_CONFIG[r.module];
                  const sc = SEVERITY_CONFIG[r.severity as ActivitySeverity];
                  const rc = RESULT_CONFIG[r.result as ActivityResult];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 11.5 }}>
                        {new Date(r.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13 }}>{mc?.icon ?? '📌'}</span>{' '}
                        <span style={{ fontSize: 12, color: mc?.color ?? '#64748b', fontWeight: 600 }}>{r.module}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.actorName}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />{sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, background: rc.bg, color: rc.color, fontSize: 11.5, fontWeight: 600 }}>{rc.label}</span>
                      </td>
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
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
