// ─── Admin Transport Module — ADMIN-SYNC-008 ──────────────────────────────────
// Dashboard utama Domain Workspace Transport.
// Sumber data LIVE:
//   LIVE → workspaces (type='Transport')
//   LIVE → marketplace_listings (workspace_id IN transport workspaces)
//   LIVE → marketplace_transactions (seller_workspace_id IN transport workspaces)
//
// Widget status:
//   Dashboard        → LIVE (workspaces + marketplace data)
//   Kendaraan        → BLOCKED (tidak ada tabel transport_vehicles)
//   Driver           → BLOCKED (tidak ada tabel transport_drivers)
//   Pengiriman/Transaksi → LIVE (marketplace_transactions)
//   Jadwal           → BLOCKED (tidak ada tabel transport_schedules)
//   Tracking         → BLOCKED (tidak ada tabel transport_tracking)
//   Laporan          → LIVE (aggregate dari marketplace data)
//   AI Insight       → NOT_IMPLEMENTED (AI backend belum tersedia)

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransportWsRow {
  id: string;
  name: string | null;
  status: string | null;
  owner_id: string | null;
  metadata: { plan?: string } | null;
  province: string | null;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TransportStats {
  workspaceCount: number;
  listingCount: number;
  transactionCount: number;
  activeListingCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SkeletonBox({ height = 20, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite',
    }} />
  );
}

function StatCard({ label, value, icon, color, loading }: {
  label: string; value: number; icon: string; color: string; loading: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      {loading ? <SkeletonBox height={28} /> : (
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value.toLocaleString('id-ID')}</div>
      )}
    </div>
  );
}

function BlockedBanner({ title, reason, dependency, priority }: {
  title: string; reason: string; dependency: string; priority: 'high' | 'medium' | 'low';
}) {
  const cfg = {
    high:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    medium: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    low:    { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  }[priority];
  return (
    <div style={{ padding: 16, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>🚫</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase' }}>{priority}</span>
      </div>
      <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}><strong>Alasan:</strong> {reason}</div>
      <div style={{ fontSize: 12, color: '#475569' }}><strong>Dependency:</strong> <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{dependency}</code></div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: '20px 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{children}</h3>;
}

function LiveBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>LIVE</span>;
}

function NotImplementedBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'rgba(71,85,105,0.12)', color: '#475569' }}>N/I</span>;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function TransportModule() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<TransportWsRow[]>([]);
  const [stats,      setStats]      = useState<TransportStats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastSync,   setLastSync]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1 · Transport workspaces
        const { data: wsData, count: wsCount, error: e1 } = await supabase
          .from('workspaces')
          .select('id,name,status,owner_id,metadata,province,city,created_at,updated_at', { count: 'exact' })
          .eq('type', 'Transport')
          .order('created_at', { ascending: false });
        if (e1) throw e1;

        const wsRows   = (wsData ?? []) as TransportWsRow[];
        const wsIds    = wsRows.map((w) => w.id);

        let listingCount       = 0;
        let activeListingCount = 0;
        let transactionCount   = 0;

        if (wsIds.length > 0) {
          // 2 · Marketplace listings for these workspaces
          const [listingRes, activeListingRes, txRes] = await Promise.all([
            supabase
              .from('marketplace_listings')
              .select('*', { count: 'exact', head: true })
              .in('workspace_id', wsIds),
            supabase
              .from('marketplace_listings')
              .select('*', { count: 'exact', head: true })
              .in('workspace_id', wsIds)
              .eq('status', 'Aktif'),
            supabase
              .from('marketplace_transactions')
              .select('*', { count: 'exact', head: true })
              .in('seller_workspace_id', wsIds),
          ]);

          listingCount       = listingRes.count       ?? 0;
          activeListingCount = activeListingRes.count  ?? 0;
          transactionCount   = txRes.count             ?? 0;
        }

        if (!cancelled) {
          setWorkspaces(wsRows);
          setStats({
            workspaceCount:   wsCount ?? 0,
            listingCount,
            activeListingCount,
            transactionCount,
          });
          setLastSync(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const planLabel = (meta: TransportWsRow['metadata']): string => meta?.plan ?? 'Free';

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>🚛 Workspace Transport</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Admin domain — Jasa Transportasi Ternak &amp; Logistik
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && <span style={{ fontSize: 11, color: '#94a3b8' }}>Sync: {lastSync}</span>}
            <LiveBadge />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>
            ⚠️ Error loading data: {error}
          </div>
        )}

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Workspace Transport"    value={stats?.workspaceCount   ?? 0} icon="🏢" color="#f59e0b" loading={loading} />
          <StatCard label="Total Listing"          value={stats?.listingCount     ?? 0} icon="📋" color="#3b82f6" loading={loading} />
          <StatCard label="Listing Aktif"          value={stats?.activeListingCount ?? 0} icon="✅" color="#16a34a" loading={loading} />
          <StatCard label="Transaksi Marketplace"  value={stats?.transactionCount ?? 0} icon="💰" color="#8b5cf6" loading={loading} />
        </div>

        {/* ── Workspace List ──────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Workspace Transport</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <LiveBadge />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Sumber: workspaces (type=Transport)</span>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <SkeletonBox key={i} height={36} />)}
            </div>
          ) : workspaces.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚛</div>
              <div>Belum ada workspace Transport terdaftar.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Data akan muncul setelah workspace Transport dibuat.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Workspace', 'Status', 'Plan', 'Lokasi', 'Bergabung', 'Action'].map((h) => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((ws) => (
                    <tr key={ws.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{ws.name ?? '—'}</div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>{ws.id.substring(0, 18)}…</div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <StatusBadge status={ws.status ?? 'Nonaktif'} />
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>
                          {planLabel(ws.metadata)}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 12, color: '#475569' }}>
                        {[ws.city, ws.province].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 12, color: '#475569' }}>
                        {ws.created_at ? new Date(ws.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <button
                          onClick={() => navigate(`/admin/workspaces`)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Navigation to Sub-Sections ──────────────────────────────────── */}
        <SectionTitle>Sub-Domain Transport</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pengiriman & Transaksi', icon: '📦', path: '/admin/transport/delivery', badge: 'live',    desc: 'Dari marketplace_transactions' },
            { label: 'Laporan',                 icon: '📊', path: '/admin/transport/reports',  badge: 'live',    desc: 'Aggregate marketplace data' },
            { label: 'Kendaraan',               icon: '🚚', path: '/admin/transport/vehicles', badge: 'blocked', desc: 'Tabel transport_vehicles belum ada' },
            { label: 'Driver',                  icon: '👷', path: '/admin/transport/drivers',  badge: 'blocked', desc: 'Tabel transport_drivers belum ada' },
            { label: 'Jadwal',                  icon: '📅', path: '/admin/transport/schedule', badge: 'blocked', desc: 'Tabel transport_schedules belum ada' },
            { label: 'Rute & Tracking',          icon: '🗺️', path: '/admin/transport/route',    badge: 'blocked', desc: 'Tabel transport_routes & GPS belum ada' },
            { label: 'AI Insight',              icon: '🤖', path: '/admin/transport/ai-insight', badge: 'ni',   desc: 'AI backend belum tersedia' },
          ].map(({ label, icon, path, badge, desc }) => (
            <div
              key={path}
              onClick={() => navigate(path)}
              style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #f1f5f9', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                {badge === 'live'    && <LiveBadge />}
                {badge === 'blocked' && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>BLOCKED</span>}
                {badge === 'ni'      && <NotImplementedBadge />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ── Blocked Modules Panel ───────────────────────────────────────── */}
        <SectionTitle>Blocked Modules Panel</SectionTitle>
        <BlockedBanner
          title="Kendaraan (Fleet Management)"
          reason="Tabel transport_vehicles belum tersedia di Supabase. Saat ini data kendaraan ada di in-memory store (src/data/transportWorkspaceData.ts)."
          dependency="transport_vehicles (workspace_id, jenis_kendaraan, nomor_polisi, kapasitas_kg, status, tahun_beli, jenis_layanan)"
          priority="high"
        />
        <BlockedBanner
          title="Driver Management"
          reason="Tabel transport_drivers belum tersedia di Supabase. Data driver ada di in-memory store."
          dependency="transport_drivers (workspace_id, nama, nomor_sim, kategori_sim, kendaraan_id, status, pengalaman_tahun)"
          priority="high"
        />
        <BlockedBanner
          title="Jadwal Transport"
          reason="Tabel transport_schedules belum tersedia di Supabase."
          dependency="transport_schedules (workspace_id, rute, tanggal, status, driver_id, kendaraan_id)"
          priority="medium"
        />
        <BlockedBanner
          title="Tracking / Live Route"
          reason="Platform tidak memiliki GPS tracking backend. Fitur live tracking bukan bagian dari roadmap saat ini."
          dependency="transport_tracking atau integrasi GPS third-party"
          priority="low"
        />
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(71,85,105,0.06)', border: '1px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>AI Insight Transport</span>
            <NotImplementedBadge />
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            AI Insight adalah consumer terhadap data platform. Backend AI belum diintegrasikan. Widget tersedia dengan status <code>not_implemented</code> — tidak ada blocker palsu.
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

// ─── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    Aktif:      { color: '#166534', bg: '#dcfce7', dot: '#16a34a', label: 'Aktif' },
    Nonaktif:   { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Nonaktif' },
    Diarsipkan: { color: '#92400e', bg: '#fef3c7', dot: '#d97706', label: 'Diarsipkan' },
    Pending:    { color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6', label: 'Pending' },
    Active:     { color: '#166534', bg: '#dcfce7', dot: '#16a34a', label: 'Aktif' },
    Inactive:   { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Nonaktif' },
  };
  const c = cfg[status] ?? { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
    </span>
  );
}
