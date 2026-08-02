// ─── Admin Dashboard — ADM-001 / ADM-002 / ADMIN-002 / P0-003C / P0-003D ──────
// P0-003C : fetchCount() returns number|null — null = backend unavailable.
//           PlatformSummary shows "Backend belum tersedia" for null counts.
// P0-003D : Final verification (2026-07-21).  All widgets audited:
//
//   Widget                  Source              Status
//   ──────────────────────  ──────────────────  ──────────────────────────────
//   AdminHeader             useAuth / env       ✔ Production Data (Supabase auth)
//   PlatformSummary         fetchCount()        ✔ Production Data: workspaces
//                                               ✔ Backend belum tersedia: 7 tables
//   SystemHealth — DB       pingDatabase()      ✔ Production Data (platform_config)
//   SystemHealth — others   —                   ✔ Backend belum tersedia
//   QuickActions            adminNavData.ts     ✔ Navigation only (no counters)
//   RecentActivities        —                   ✔ Empty State (no activity_log)
//   PlatformStatistics      —                   ✔ Empty State (no history table)
//
//   Forbidden markers scan: 0 TODO / FIXME / HACK / MOCK / DUMMY found.
//   TypeScript: 0 errors.  Production build: ✓ success.
//
// ADMIN-002: All dummy/fake stats replaced with real Supabase queries.
// Every number shown is queried live. Missing tables → null → empty state.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  STATUS_CONFIG,
  QUICK_ACTIONS,
  PLATFORM_STAT_DEFS,
  type SystemStatus,
} from '../../data/adminDashboardData';
import AdminControlPlane from './AdminControlPlane';

// ─── Quick-action key → route ─────────────────────────────────────────────────

const QUICK_ACTION_ROUTES: Record<string, string> = {
  users:        '/admin/users',
  workspaces:   '/admin/workspaces',
  marketplace:  '/admin/marketplace',
  livestock:    '/admin/livestock',
  feed:         '/admin/feed',
  medicine:     '/admin/medicine',
  subscription: '/admin/subscription',
  announcement: '/admin/announcements',
  monitoring:   '/admin/monitoring',
  reports:      '/admin/reports',
};

// ─── Supabase helpers ─────────────────────────────────────────────────────────

/**
 * Count rows in a Supabase table.
 * Returns the live count (including 0 for an empty table) when the table exists.
 * Returns null when the table does not exist or is otherwise unavailable —
 * callers should render an empty-state indicator instead of a number.
 */
async function fetchCount(table: string): Promise<number | null> {
  if (!table) return null;
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error || count === null) return null;
  return count;
}

/** Ping platform_config and return real latency + online status. */
async function pingDatabase(): Promise<{ latencyMs: number; online: boolean }> {
  const t0 = performance.now();
  const { error } = await supabase
    .from('platform_config')
    .select('key')
    .limit(1);
  const latencyMs = Math.round(performance.now() - t0);
  return { latencyMs, online: !error };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbStatus {
  latencyMs: number;
  online: boolean;
  status: SystemStatus;
}

interface DashboardData {
  counts: Record<string, number | null>;
  db: DbStatus;
  loadedAt: Date;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
    </div>
  );
}

function SkeletonBox({ width = '100%', height = 28 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'adm-shimmer 1.4s infinite',
    }} />
  );
}

function StatusDot({ status }: { status: SystemStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cfg.dot,
        display: 'inline-block',
        boxShadow: status === 'Operational' ? `0 0 0 2px ${cfg.dot}33` : undefined,
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}

// ─── Platform Header ──────────────────────────────────────────────────────────

function AdminHeader({ adminName }: { adminName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 18 ? 'Selamat Siang' : 'Selamat Malam';
  const env = import.meta.env.MODE === 'production' ? 'Production' : 'Development';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%)',
      borderRadius: 16, padding: '24px 28px', color: '#fff',
      marginBottom: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>{greeting} 👋</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, marginBottom: 16, lineHeight: 1.2 }}>
          {adminName}
        </div>
        <div className="adm-header-grid">
          {[
            { label: 'Platform',    value: 'TernakHub', icon: '🐄' },
            { label: 'Environment', value: env,          icon: '🌐' },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 10,
              padding: '10px 14px', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: 10, color: '#93c5fd', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.icon} {item.label}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f1f5f9' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Platform Summary ─────────────────────────────────────────────────────────

function PlatformSummary({ counts, loading }: { counts: Record<string, number | null>; loading: boolean }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeading title="Ringkasan Platform" subtitle="Hitungan langsung dari Supabase" />
      <div className="adm-stats-grid">
        {PLATFORM_STAT_DEFS.map((def) => {
          // null  → table not available (backend not ready)
          // 0..n  → real live count from Supabase
          const count = counts[def.key] ?? null;
          const available = !loading && count !== null;
          const unavailable = !loading && count === null;

          return (
            <div key={def.key} style={{
              background: '#fff', borderRadius: 12, padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              border: `1px solid ${unavailable ? '#f1f5f9' : '#f1f5f9'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{def.label}</span>
                <span style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: unavailable ? '#f8fafc' : `${def.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {def.icon}
                </span>
              </div>

              {loading && <SkeletonBox height={28} width={80} />}

              {available && (
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {count.toLocaleString('id-ID')}
                </div>
              )}

              {unavailable && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#cbd5e1', lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 5, fontStyle: 'italic' }}>
                    Backend belum tersedia
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── System Health ────────────────────────────────────────────────────────────

function SystemHealth({ db, loading }: { db: DbStatus; loading: boolean }) {
  const cfg = STATUS_CONFIG[db.status];

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionHeading title="Kesehatan Sistem" subtitle="Koneksi Supabase — diukur langsung" />
        {!loading && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, alignSelf: 'flex-start' }}>
            {db.online ? '✓ Database Online' : '✗ Database Offline'}
          </span>
        )}
      </div>
      <div className="adm-health-grid">

        {/* ── Supabase DB — real ping ───────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 18px',
          border: `1px solid ${db.online ? '#f1f5f9' : '#fca5a555'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🗄️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Supabase (PostgreSQL)</div>
              {loading ? <SkeletonBox height={14} width={90} /> : <StatusDot status={db.status} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 1 }}>Latency</div>
              {loading
                ? <SkeletonBox height={18} width={50} />
                : <div style={{ fontSize: 13, fontWeight: 700, color: db.latencyMs > 500 ? '#f59e0b' : '#0f172a' }}>
                    {db.online ? `${db.latencyMs}ms` : '—'}
                  </div>
              }
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 1 }}>Sumber</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>platform_config</div>
            </div>
          </div>
        </div>

        {/* ── Other services — belum dikonfigurasi ─────────────── */}
        {[
          { key: 'storage', label: 'Object Storage', icon: '📦' },
          { key: 'queue',   label: 'Message Queue',  icon: '📨' },
          { key: 'ai',      label: 'AI Service',     icon: '🤖' },
        ].map((svc) => (
          <div key={svc.key} style={{
            background: '#fff', borderRadius: 12, padding: '16px 18px',
            border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{svc.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{svc.label}</div>
                <StatusDot status="Unknown" />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
              Belum dikonfigurasi
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeading title="Tindakan Cepat" subtitle="Pintasan modul Admin" />
      <div className="adm-actions-grid">
        {QUICK_ACTIONS.map((action) => {
          const route = QUICK_ACTION_ROUTES[action.key];
          return (
            <div
              key={action.key}
              onClick={() => route && navigate(route)}
              role={route ? 'button' : undefined}
              tabIndex={route ? 0 : undefined}
              onKeyDown={route ? (e) => { if (e.key === 'Enter' || e.key === ' ') navigate(route); } : undefined}
              style={{
                background: '#fff', borderRadius: 12, padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
                cursor: route ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'box-shadow 0.15s, transform 0.1s', userSelect: 'none',
              }}
              onMouseEnter={e => { if (route) { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: 24 }}>{action.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{action.label}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>{action.description}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Recent Activities — empty state (no activity table yet) ─────────────────

function RecentActivities({ loadedAt }: { loadedAt: Date | null }) {
  return (
    <section style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Aktivitas Terbaru</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Linimasa kejadian platform</div>
        </div>
        {loadedAt && (
          <span style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8', padding: '3px 10px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            Updated {loadedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
      {/* Empty state — no activity_log table yet */}
      <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 36 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Belum tersedia</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8', maxWidth: 280, lineHeight: 1.55 }}>
          Tabel <code style={{ fontSize: 11, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>activity_log</code> belum tersedia di Supabase.
        </div>
      </div>
    </section>
  );
}

// ─── Platform Statistics — empty state (no historical data yet) ───────────────

function PlatformStatistics() {
  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Statistik Platform</div>
        <div style={{ fontSize: 11.5, color: '#64748b' }}>Tren pertumbuhan</div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 36 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Belum ada data historis</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8', maxWidth: 300, lineHeight: 1.55 }}>
          Grafik pertumbuhan akan muncul setelah tabel statistik tersedia di Supabase.
        </div>
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const adminName = currentUser?.user_metadata?.full_name
    || currentUser?.email
    || 'System Administrator';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // ── Fetch all counts + DB ping in parallel ───────────────────────────
      const [dbResult, ...countResults] = await Promise.all([
        pingDatabase(),
        ...PLATFORM_STAT_DEFS.map((def) => fetchCount(def.table)),
      ]);

      const counts: Record<string, number | null> = {};
      PLATFORM_STAT_DEFS.forEach((def, i) => { counts[def.key] = countResults[i]; });

      const dbStatus: SystemStatus = !dbResult.online
        ? 'Outage'
        : dbResult.latencyMs > 1000
        ? 'Degraded'
        : 'Operational';

      setData({
        counts,
        db: { ...dbResult, status: dbStatus },
        loadedAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {/* Shimmer animation */}
      <style>{`
        @keyframes adm-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <AdminLayout>
        <AdminHeader adminName={adminName} />
        <PlatformSummary counts={data?.counts ?? {}} loading={loading} />
        <SystemHealth db={data?.db ?? { latencyMs: 0, online: false, status: 'Unknown' }} loading={loading} />
        <QuickActions navigate={navigate} />
        <div className="adm-bottom-row">
          <RecentActivities loadedAt={data?.loadedAt ?? null} />
          <PlatformStatistics />
        </div>
        <AdminControlPlane />
      </AdminLayout>
    </>
  );
}
