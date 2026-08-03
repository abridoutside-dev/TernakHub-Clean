// ─── Farm Dashboard — ADMIN-SYNC-004 ─────────────────────────────────────────
// Aggregate dashboard for Workspace Farm domain.
// Reads live counts from: livestock, batches, health_checkups, health_treatments,
// livestock_weight_entries, pemberian_pakan, stok_inventaris, stok_obat,
// feed_formulas, reproduksi_programs, livestock_transfers.

import { useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface FarmStats {
  livestock: number;
  batches: number;
  checkups: number;
  treatments: number;
  weightEntries: number;
  feedRecords: number;
  stokPakan: number;
  stokObat: number;
  formulas: number;
  reproduksi: number;
  transfers: number;
}

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 6,
        background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'adm-shimmer 1.4s infinite',
      }}
    />
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  path,
  loading,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  path: string;
  loading: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <SkeletonBox height={28} />
      ) : (
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {value.toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );
}

export default function FarmDashboardModule() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FarmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          livestock,
          batches,
          checkups,
          treatments,
          weightEntries,
          feedRecords,
          stokPakan,
          stokObat,
          formulas,
          reproduksi,
          transfers,
        ] = await Promise.all([
          supabase.from('livestock').select('*', { count: 'exact', head: true }),
          supabase.from('batches').select('*', { count: 'exact', head: true }),
          supabase.from('health_checkups').select('*', { count: 'exact', head: true }),
          supabase.from('health_treatments').select('*', { count: 'exact', head: true }),
          supabase.from('livestock_weight_entries').select('*', { count: 'exact', head: true }),
          supabase.from('pemberian_pakan').select('*', { count: 'exact', head: true }),
          supabase.from('stok_inventaris').select('*', { count: 'exact', head: true }),
          supabase.from('stok_obat').select('*', { count: 'exact', head: true }),
          supabase.from('feed_formulas').select('*', { count: 'exact', head: true }),
          supabase.from('reproduksi_programs').select('*', { count: 'exact', head: true }),
          supabase.from('livestock_transfers').select('*', { count: 'exact', head: true }),
        ]);

        if (cancelled) return;

        const firstError = [livestock, batches, checkups, treatments, weightEntries, feedRecords, stokPakan, stokObat, formulas, reproduksi, transfers]
          .find((r) => r.error);
        if (firstError?.error) {
          setError(firstError.error.message);
          setLoading(false);
          return;
        }

        setStats({
          livestock:     livestock.count    ?? 0,
          batches:       batches.count       ?? 0,
          checkups:      checkups.count      ?? 0,
          treatments:    treatments.count    ?? 0,
          weightEntries: weightEntries.count ?? 0,
          feedRecords:   feedRecords.count   ?? 0,
          stokPakan:     stokPakan.count     ?? 0,
          stokObat:      stokObat.count      ?? 0,
          formulas:      formulas.count      ?? 0,
          reproduksi:    reproduksi.count    ?? 0,
          transfers:     transfers.count     ?? 0,
        });
        setLastSync(new Date().toISOString());
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const CARDS = stats
    ? [
        { label: 'Livestock',        value: stats.livestock,     icon: '🐄', color: '#3b82f6', path: '/admin/livestock' },
        { label: 'Batch',            value: stats.batches,       icon: '📦', color: '#8b5cf6', path: '/admin/farm/batch' },
        { label: 'Pemeriksaan',      value: stats.checkups,      icon: '🩺', color: '#10b981', path: '/admin/farm/kesehatan-hewan' },
        { label: 'Treatment',        value: stats.treatments,    icon: '💉', color: '#f59e0b', path: '/admin/farm/kesehatan-hewan' },
        { label: 'Catat Bobot',      value: stats.weightEntries, icon: '⚖️', color: '#0ea5e9', path: '/admin/farm/catat-bobot' },
        { label: 'Pemberian Pakan',  value: stats.feedRecords,   icon: '🌾', color: '#84cc16', path: '/admin/farm/pemberian-pakan' },
        { label: 'Stok Pakan',       value: stats.stokPakan,     icon: '🏪', color: '#f97316', path: '/admin/farm/stok-pakan' },
        { label: 'Stok Obat',        value: stats.stokObat,      icon: '💊', color: '#ec4899', path: '/admin/farm/stok-obat' },
        { label: 'Formula Pakan',    value: stats.formulas,      icon: '🧪', color: '#6366f1', path: '/admin/farm/formula-pakan' },
        { label: 'Reproduksi',       value: stats.reproduksi,    icon: '🔬', color: '#14b8a6', path: '/admin/farm/reproduksi' },
        { label: 'Mutasi / Transfer',value: stats.transfers,     icon: '🔀', color: '#64748b', path: '/admin/farm/mutasi' },
      ]
    : [];

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Workspace Farm</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            🐄 Farm Dashboard
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Ikhtisar seluruh modul Workspace Farm — data langsung dari Supabase.
            {lastSync && (
              <span style={{ marginLeft: 8, fontSize: 11.5, color: '#94a3b8' }}>
                Last sync: {new Date(lastSync).toLocaleTimeString('id-ID')}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 32,
          }}
        >
          {loading
            ? Array.from({ length: 11 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
                  <SkeletonBox height={28} />
                </div>
              ))
            : CARDS.map((card) => (
                <StatCard key={card.label} {...card} loading={false} />
              ))}
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '20px 24px',
            border: '1px solid #f1f5f9',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
            🔗 Navigasi Cepat Modul Farm
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Livestock', path: '/admin/livestock', icon: '🐄' },
              { label: 'Batch', path: '/admin/farm/batch', icon: '📦' },
              { label: 'Catat Bobot', path: '/admin/farm/catat-bobot', icon: '⚖️' },
              { label: 'Pemberian Pakan', path: '/admin/farm/pemberian-pakan', icon: '🌾' },
              { label: 'Stok Pakan', path: '/admin/farm/stok-pakan', icon: '🏪' },
              { label: 'Master Pakan', path: '/admin/farm/master-pakan', icon: '📚' },
              { label: 'Formula Pakan', path: '/admin/farm/formula-pakan', icon: '🧪' },
              { label: 'Stok Obat', path: '/admin/farm/stok-obat', icon: '💊' },
              { label: 'Kesehatan Hewan', path: '/admin/farm/kesehatan-hewan', icon: '🩺' },
              { label: 'Reproduksi', path: '/admin/farm/reproduksi', icon: '🔬' },
              { label: 'Mutasi', path: '/admin/farm/mutasi', icon: '🔀' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#374151',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#78350f' }}>
          ℹ️ Modul <strong>Master Obat</strong>, <strong>AI Insight Farm</strong>, dan <strong>Riwayat Aktivitas Farm</strong> belum tersedia (tidak ada backend yang diperlukan). Lihat Blocked Modules Panel di Control Plane.
        </div>
      </div>
    </AdminLayout>
  );
}
