// ─── Admin User Management — ADM-003 / ADMIN-003 ─────────────────────────────
// ADMIN-003: All dummy data removed. Data sourced from Supabase `user_profiles` table.
// Shows 0 / empty state when no data. No hardcoded values.

import { useState, useMemo, useEffect } from 'react';
const PAGE_SIZE = 20;
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  USER_STATUS_CONFIG,
  type AdminUserRecord,
  type UserStatus,
} from '../../../data/adminUsersData';

// ─── Supabase row shape (user_profiles, DB-001A) ─────────────────────────────
// Note: email and is_admin are NOT in user_profiles; they live in auth.users.
// The browser anon key cannot join auth.users, so email shows as '—'.

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
  const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#0ea5e9'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return {
    id: p.id,
    fullName: name,
    email: '—',          // not available from user_profiles; requires auth.users join
    phone: p.phone_number ?? '—',
    avatarInitials: initials,
    avatarColor: color,
    status: 'Active' as UserStatus,   // user_profiles has no status column
    isAdmin: false,                   // cannot determine without JWT/auth.users
    totalWorkspaces: 0,
    workspaces: [],
    registeredAt: p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—',
    lastActiveAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—',
    lastActiveDaysAgo: p.updated_at ? Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000) : 999,
    notes: undefined,
  };
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error || count === null) return 0;
  return count;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5 }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const c = USER_STATUS_CONFIG[status] ?? USER_STATUS_CONFIG['Active'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}


function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function InputField({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', outline: 'none' }} />
    </label>
  );
}

function SkeletonBox({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />;
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDetailDrawer({ user, onClose }: { user: AdminUserRecord; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(15,23,42,0.15)', animation: 'slideInRight 0.22s ease' }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } } @keyframes adm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar initials={user.avatarInitials} color={user.avatarColor} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{user.fullName}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{user.email}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={user.status} />
              {user.isAdmin && (
                <span style={{ padding: '3px 9px', borderRadius: 20, background: '#fef3c7', color: '#b45309', fontSize: 11.5, fontWeight: 600 }}>Admin</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>Informasi Akun</SectionLabel>
          <InfoRow label="User ID" value={<code style={{ fontSize: 11.5, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{user.id}</code>} />
          <InfoRow label="Nama Lengkap" value={user.fullName} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Telepon" value={user.phone || '—'} />
          <InfoRow label="Status" value={<StatusBadge status={user.status} />} />
          <InfoRow label="Admin" value={user.isAdmin ? 'Ya' : 'Tidak'} />
          <InfoRow label="Terdaftar" value={user.registeredAt} />
          <InfoRow label="Terakhir Aktif" value={user.lastActiveAt} />
          {user.notes && (
            <>
              <SectionLabel>Catatan</SectionLabel>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fefce8', border: '1px solid #fef08a', fontSize: 12, color: '#713f12', lineHeight: 1.6 }}>
                {user.notes}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersModule() {
  const [rows, setRows]         = useState<AdminUserRecord[]>([]);
  const [totalCount, setTotal]  = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [keyword, setKeyword]           = useState('');
  const [emailQ, setEmailQ]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);

  // ── Load from Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [total, { data, error: fetchErr }] = await Promise.all([
          fetchCount('user_profiles'),
          supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(200),
        ]);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
        setTotal(total);
        setRows((data ?? []).map(adaptProfile));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = rows;
    if (keyword) {
      const q = keyword.toLowerCase();
      r = r.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    if (emailQ) r = r.filter(u => u.email.toLowerCase().includes(emailQ.toLowerCase()));
    if (filterStatus !== 'All') r = r.filter(u => u.status === filterStatus);
    return r;
  }, [rows, keyword, emailQ, filterStatus]);

  const hasActiveFilter = keyword || emailQ || filterStatus !== 'All';
  const resetFilters = () => { setKeyword(''); setEmailQ(''); setFilterStatus('All'); setCurrentPage(1); };

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Users',  value: totalCount.toLocaleString(), icon: '👥', color: '#3b82f6', delta: 'Semua user terdaftar' },
    { label: 'Ditampilkan',  value: rows.length.toLocaleString(), icon: '📋', color: '#10b981', delta: 'Dimuat dari Supabase' },
    { label: 'Filter Aktif', value: filtered.length.toLocaleString(), icon: '🔍', color: '#8b5cf6', delta: 'Setelah filter' },
  ];

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pengguna</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>👤 Manajemen Pengguna</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Observasi pengguna platform — data langsung dari Supabase <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>user_profiles</code> table.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
              </div>
              {loading ? <SkeletonBox height={28} /> : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: loading ? 8 : 0 }}>{card.delta}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🔍 Cari Pengguna</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <InputField label="Kata Kunci" placeholder="Nama, email, atau ID…" value={keyword} onChange={setKeyword} />
            <InputField label="Email" placeholder="user@example.com" value={emailQ} onChange={setEmailQ} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🗂 Filter</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <SelectField label="Status" value={filterStatus} onChange={setFilterStatus} options={[
              { value: 'All', label: 'Semua Status' },
              { value: 'Active', label: '✅ Aktif' },
              { value: 'Suspended', label: '🚫 Ditangguhkan' },
              { value: 'Pending', label: '⏳ Menunggu' },
            ]} />
            {hasActiveFilter && (
              <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Pengguna</span>
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>
                {loading ? '…' : `${filtered.length} dari ${totalCount}`}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat…' : 'Data dari Supabase · Klik baris untuk detail'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Pengguna', 'Email', 'Status', 'Admin', 'Terdaftar', 'Terakhir Aktif'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: '12px 14px' }}><SkeletonBox height={18} /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                      {hasActiveFilter
                        ? 'Tidak ada user yang sesuai filter.'
                        : rows.length === 0
                          ? 'Belum ada user terdaftar di Supabase.'
                          : 'Tidak ada hasil.'}
                      {hasActiveFilter && (
                        <button onClick={resetFilters} style={{ display: 'block', margin: '10px auto 0', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                          Hapus Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((user, idx) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={user.avatarInitials} color={user.avatarColor} size={32} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{user.fullName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{user.id.substring(0, 16)}…</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={user.status} /></td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: user.isAdmin ? '#b45309' : '#94a3b8', fontWeight: user.isAdmin ? 600 : 400 }}>{user.isAdmin ? 'Ya' : 'Tidak'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{user.registeredAt}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 12 }}>
                        <span style={{ color: user.lastActiveDaysAgo <= 7 ? '#059669' : '#94a3b8' }}>{user.lastActiveAt}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {loading ? '…' : `Menampilkan ${filtered.length === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '…' ? (
                    <span key={`e-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p as number)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: p === safePage ? '#3b82f6' : '#fff', color: p === safePage ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedUser && <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </AdminLayout>
  );
}
