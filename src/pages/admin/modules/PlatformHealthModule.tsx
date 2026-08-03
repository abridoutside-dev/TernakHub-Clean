// ─── Admin Platform Health — ADMIN-PLATFORM-002 / CORE-PLATFORM-001 ──────────
// Sinkronisasi data kesehatan platform dengan sumber data NYATA dari Supabase.
//
// Widget status:
//   LIVE → Workspace Overview     (workspaces — count by type & status)
//   LIVE → Marketplace Health     (marketplace_listings, marketplace_transactions)
//   LIVE → Recent Activity        (activity_log)
//   LIVE → System Services Health (real-time probes — DB, Storage, API, Env, Version)
//   BLOCKED → Auth Stats          (auth.users RLS-blocked dari client)
//   BLOCKED → Background Jobs     (tidak ada tabel job_queue)
//   N/I  → AI Service Status      (AI backend belum diintegrasikan)

import { useEffect, useState, type ReactNode } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  fetchSystemServicesHealth,
  type SystemServicesHealth,
  type ServiceStatus,
} from '../../../repositories/systemHealthRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceStats {
  total: number;
  aktif: number;
  nonaktif: number;
  pending: number;
  byType: Record<string, number>;
}

interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
}

interface ActivityRow {
  id: string;
  action_type: string | null;
  description: string | null;
  severity: string | null;
  domain: string | null;
  created_at: string;
  workspace_id: string | null;
}

interface PlatformData {
  workspaces: WorkspaceStats;
  marketplace: MarketplaceStats;
  recentActivity: ActivityRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>
      LIVE
    </span>
  );
}

function BlockedBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>
      BLOCKED
    </span>
  );
}

function NIBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(71,85,105,0.12)', color: '#475569' }}>
      N/I
    </span>
  );
}

function SkeletonBox({ height = 20, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'ph-shimmer 1.4s infinite',
    }} />
  );
}

function SectionCard({ title, icon, badge, children }: {
  title: string; icon: string; badge: ReactNode; children: ReactNode;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', flex: 1 }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function StatTile({ label, value, icon, color, loading }: {
  label: string; value: string | number; icon: string; color: string; loading: boolean;
}) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 16, width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </div>
      {loading
        ? <SkeletonBox height={26} />
        : <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</div>
      }
    </div>
  );
}

function BlockedWidget({ title, reason, dependency, priority }: {
  title: string; reason: string; dependency: string; priority: 'high' | 'medium' | 'low';
}) {
  const cfg = {
    high:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: 'HIGH' },
    medium: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', label: 'MEDIUM' },
    low:    { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', label: 'LOW' },
  }[priority];

  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15 }}>🚫</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, flex: 1 }}>{title}</span>
        <BlockedBadge />
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, color: cfg.color, background: '#fff', border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}><strong>Alasan:</strong> {reason}</div>
      <div style={{ fontSize: 12, color: '#475569' }}><strong>Dependency:</strong> <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{dependency}</code></div>
    </div>
  );
}

// ─── System Services Health Widget ────────────────────────────────────────────

const SERVICE_ICONS: Record<string, string> = {
  Database:         '🗄️',
  Storage:          '📦',
  API:              '⚡',
  Environment:      '🔧',
  Platform:         '🏷️',
};

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  operational:     { label: 'operational',     color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#16a34a' },
  degraded:        { label: 'degraded',        color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  down:            { label: 'down',            color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
  not_implemented: { label: 'not_implemented', color: '#475569', bg: 'rgba(71,85,105,0.07)', border: 'rgba(71,85,105,0.15)', dot: '#94a3b8' },
};

function ServiceRow({
  name, status, latency_ms, message, loading,
}: {
  name: string;
  status: ServiceStatus;
  latency_ms: number | null;
  message: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: 8 }}>
        <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{SERVICE_ICONS[name] ?? '🔵'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 110 }}>{name}</span>
        <div style={{ flex: 1 }}><SkeletonBox height={16} /></div>
      </div>
    );
  }

  const cfg = STATUS_CFG[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 9,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      marginBottom: 8,
    }}>
      {/* Dot indicator */}
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
        boxShadow: status === 'operational' ? `0 0 0 3px ${cfg.dot}28` : 'none',
      }} />
      {/* Icon + name */}
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>
        {SERVICE_ICONS[name] ?? '🔵'}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 100, flexShrink: 0 }}>
        {name}
      </span>
      {/* Status badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
        background: '#fff', color: cfg.color,
        border: `1px solid ${cfg.border}`,
        flexShrink: 0,
      }}>
        {cfg.label}
      </span>
      {/* Message */}
      <span style={{ fontSize: 12, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {message}
      </span>
      {/* Latency */}
      {latency_ms !== null && (
        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {latency_ms}ms
        </span>
      )}
    </div>
  );
}

function SystemServicesHealthWidget({ health, loading }: {
  health: SystemServicesHealth | null;
  loading: boolean;
}) {
  const services = health
    ? [
        health.database,
        health.storage,
        health.api,
        health.environment,
        health.platform_version,
      ]
    : [
        { name: 'Database', status: 'operational' as ServiceStatus, latency_ms: null, message: '', checked_at: '' },
        { name: 'Storage',  status: 'operational' as ServiceStatus, latency_ms: null, message: '', checked_at: '' },
        { name: 'API',      status: 'operational' as ServiceStatus, latency_ms: null, message: '', checked_at: '' },
        { name: 'Environment',      status: 'operational' as ServiceStatus, latency_ms: null, message: '', checked_at: '' },
        { name: 'Platform', status: 'operational' as ServiceStatus, latency_ms: null, message: '', checked_at: '' },
      ];

  return (
    <div>
      {services.map((svc) => (
        <ServiceRow
          key={svc.name}
          name={svc.name}
          status={svc.status}
          latency_ms={svc.latency_ms}
          message={svc.message}
          loading={loading}
        />
      ))}
      {!loading && health && (
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
          Diperiksa: {new Date(health.database.checked_at).toLocaleTimeString('id-ID')}
        </div>
      )}
    </div>
  );
}

// ─── Workspace type labels (DB enum → UI) ─────────────────────────────────────

const WS_TYPE_LABELS: Record<string, string> = {
  Farm:              'Farm',
  FeedStore:         'Toko Pakan',
  VeterinaryClinic:  'Klinik Hewan',
  VeterinaryDoctor:  'Dokter Hewan',
  Transport:         'Transport',
  Marketplace:       'Marketplace',
};

const WS_TYPE_ICONS: Record<string, string> = {
  Farm:              '🐄',
  FeedStore:         '🌾',
  VeterinaryClinic:  '🏥',
  VeterinaryDoctor:  '👨‍⚕️',
  Transport:         '🚛',
  Marketplace:       '🛒',
};

const SEVERITY_CFG: Record<string, { color: string; bg: string }> = {
  info:     { color: '#1d4ed8', bg: '#dbeafe' },
  warning:  { color: '#d97706', bg: '#fef3c7' },
  error:    { color: '#dc2626', bg: '#fee2e2' },
  critical: { color: '#7c3aed', bg: '#ede9fe' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlatformHealthModule() {
  const [data,     setData]     = useState<PlatformData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [systemHealth,        setSystemHealth]        = useState<SystemServicesHealth | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(true);

  // ── Platform data (workspaces, marketplace, activity) ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Workspace stats
        const { data: wsRows, error: wsErr } = await supabase
          .from('workspaces')
          .select('id,type,status');
        if (wsErr) throw wsErr;

        const ws = (wsRows ?? []) as { id: string; type: string; status: string }[];

        const byType: Record<string, number> = {};
        for (const w of ws) {
          byType[w.type] = (byType[w.type] ?? 0) + 1;
        }

        const workspaces: WorkspaceStats = {
          total:     ws.length,
          aktif:     ws.filter((w) => w.status === 'Aktif').length,
          nonaktif:  ws.filter((w) => w.status === 'Nonaktif').length,
          pending:   ws.filter((w) => w.status === 'Pending').length,
          byType,
        };

        // 2. Marketplace stats
        const [listingRes, txRes] = await Promise.all([
          supabase.from('marketplace_listings').select('id,status'),
          supabase.from('marketplace_transactions').select('id,status'),
        ]);
        if (listingRes.error) throw listingRes.error;
        if (txRes.error)      throw txRes.error;

        const listings = (listingRes.data ?? []) as { id: string; status: string }[];
        const txs      = (txRes.data ?? [])      as { id: string; status: string }[];

        const marketplace: MarketplaceStats = {
          totalListings:         listings.length,
          activeListings:        listings.filter((l) => l.status === 'Aktif').length,
          totalTransactions:     txs.length,
          completedTransactions: txs.filter((t) => t.status === 'Selesai').length,
          pendingTransactions:   txs.filter((t) => ['Menunggu', 'Diproses', 'Negosiasi'].includes(t.status)).length,
        };

        // 3. Recent activity
        const { data: actData, error: actErr } = await supabase
          .from('activity_log')
          .select('id,action_type,description,severity,domain,created_at,workspace_id')
          .order('created_at', { ascending: false })
          .limit(15);
        if (actErr) throw actErr;

        if (!cancelled) {
          setData({ workspaces, marketplace, recentActivity: (actData ?? []) as ActivityRow[] });
          setLastSync(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── System services health probes ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSystemHealthLoading(true);
      try {
        const health = await fetchSystemServicesHealth();
        if (!cancelled) setSystemHealth(health);
      } catch {
        // Individual checks already handle their own errors; this is a safety net.
      } finally {
        if (!cancelled) setSystemHealthLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout>
      <style>{`@keyframes ph-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>Platform Health</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>❤️ Platform Health</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Status kesehatan platform — data langsung dari Supabase
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && <span style={{ fontSize: 11, color: '#94a3b8' }}>Sync: {lastSync}</span>}
            <LiveBadge />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 20 }}>
            ⚠️ Error: {error}
          </div>
        )}

        {/* ── 1. Workspace Overview ───────────────────────────────────────────── */}
        <SectionCard title="Workspace Overview" icon="🏢" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: workspaces</span></>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatTile label="Total Workspace" value={data?.workspaces.total ?? 0} icon="🏢" color="#3b82f6" loading={loading} />
            <StatTile label="Aktif"           value={data?.workspaces.aktif ?? 0} icon="✅" color="#16a34a" loading={loading} />
            <StatTile label="Nonaktif"        value={data?.workspaces.nonaktif ?? 0} icon="⏸️" color="#64748b" loading={loading} />
            <StatTile label="Pending"         value={data?.workspaces.pending ?? 0} icon="⏳" color="#f59e0b" loading={loading} />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Distribusi per Tipe</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => <SkeletonBox key={i} height={28} />)}
              </div>
            ) : Object.keys(data?.workspaces.byType ?? {}).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                Belum ada workspace terdaftar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(data!.workspaces.byType).map(([type, count]) => {
                  const pct = data!.workspaces.total > 0
                    ? Math.round((count / data!.workspaces.total) * 100)
                    : 0;
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{WS_TYPE_ICONS[type] ?? '🏢'}</span>
                      <span style={{ fontSize: 12, color: '#374151', minWidth: 130 }}>{WS_TYPE_LABELS[type] ?? type}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: '#3b82f6', width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', minWidth: 28, textAlign: 'right' }}>{count}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 36 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 2. Marketplace Health ───────────────────────────────────────────── */}
        <SectionCard title="Marketplace Health" icon="🛒" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: marketplace_listings · marketplace_transactions</span></>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <StatTile label="Total Listing"       value={data?.marketplace.totalListings ?? 0}         icon="📋" color="#8b5cf6" loading={loading} />
            <StatTile label="Listing Aktif"       value={data?.marketplace.activeListings ?? 0}        icon="✅" color="#16a34a" loading={loading} />
            <StatTile label="Total Transaksi"     value={data?.marketplace.totalTransactions ?? 0}     icon="💰" color="#3b82f6" loading={loading} />
            <StatTile label="Transaksi Selesai"   value={data?.marketplace.completedTransactions ?? 0} icon="🏁" color="#059669" loading={loading} />
            <StatTile label="Transaksi Berjalan"  value={data?.marketplace.pendingTransactions ?? 0}   icon="🔄" color="#f59e0b" loading={loading} />
          </div>
        </SectionCard>

        {/* ── 3. System Services Health ───────────────────────────────────────── */}
        <SectionCard
          title="System Services Health"
          icon="🖥️"
          badge={
            <>
              <LiveBadge />
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
                Sumber: real-time probes
              </span>
            </>
          }
        >
          <SystemServicesHealthWidget
            health={systemHealth}
            loading={systemHealthLoading}
          />
        </SectionCard>

        {/* ── 4. Recent Platform Activity ─────────────────────────────────────── */}
        <SectionCard title="Aktivitas Platform Terbaru" icon="📋" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: activity_log</span></>}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => <SkeletonBox key={i} height={48} />)}
            </div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div>Belum ada aktivitas tercatat di platform.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data!.recentActivity.map((act) => {
                const sev = act.severity ?? 'info';
                const sevCfg = SEVERITY_CFG[sev] ?? SEVERITY_CFG['info'];
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 12, background: sevCfg.bg, color: sevCfg.color, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                      {sev.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.description ?? act.action_type ?? '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        {act.domain && (
                          <span style={{ fontSize: 10.5, color: '#64748b' }}>#{act.domain}</span>
                        )}
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                          {new Date(act.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── 5. Remaining Blocked Widgets ────────────────────────────────────── */}
        <SectionCard title="Blocked Widgets" icon="🚫" badge={<BlockedBadge />}>
          <BlockedWidget
            title="User Authentication Stats"
            reason="auth.users tidak dapat diakses dari client-side Supabase (RLS). Statistik pengguna (total, aktif, baru) membutuhkan query server-side atau Supabase admin API."
            dependency="Admin-level auth API endpoint (server-side) atau tabel user_profiles yang disinkronkan dengan auth.users via trigger"
            priority="medium"
          />
          <BlockedWidget
            title="Background Job Queue"
            reason="Tidak ada tabel job_queue di platform. Antrian proses latar (email notifikasi, batch export, dll.) belum diimplementasikan sebagai persistent queue."
            dependency="job_queue (id, type, status, payload, created_at, processed_at, retries) + queue worker backend"
            priority="medium"
          />

          {/* AI — not implemented */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(71,85,105,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15 }}>🤖</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', flex: 1 }}>AI Service Status</span>
              <NIBadge />
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              AI Insight adalah consumer terhadap data platform. Backend AI belum diintegrasikan. Widget akan aktif setelah AI service platform tersedia. Status: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>not_implemented</code>
            </div>
          </div>
        </SectionCard>

      </div>
    </AdminLayout>
  );
}
