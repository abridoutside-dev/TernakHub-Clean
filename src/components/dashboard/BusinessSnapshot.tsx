import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  getBusinessSnapshot,
  type BusinessSnapshotMetric,
  type TrendIndicator,
} from '../../data/dashboardBusinessSnapshotData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-009 — Dashboard Business Snapshot
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md dan bagian
// "BUSINESS INSIGHT" pada docs/architecture/PROFILE_MODULE_CONSTITUTION.md.
//
// 100% READ ONLY — bukan halaman laporan/analitik/laporan keuangan lengkap.
// Komponen ini murni presenter: seluruh nilai dibaca live oleh
// src/data/dashboardBusinessSnapshotData.ts, tidak ada perhitungan atau
// penyimpanan data di sini. Tidak ada Edit/Export/Delete — hanya navigasi
// ke halaman Business Insight.
// ─────────────────────────────────────────────────────────────────────────────

const TREND_ICON: Record<NonNullable<TrendIndicator>, string> = {
  Naik: '🟢',
  Stabil: '🟡',
  Turun: '🔴',
};

function MetricTile({ metric }: { metric: BusinessSnapshotMetric }) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minHeight: 84,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>{metric.icon}</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{metric.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {metric.indicator && <span style={{ fontSize: 13 }}>{TREND_ICON[metric.indicator]}</span>}
        <span
          style={{
            fontSize: metric.value.length > 10 ? 14 : 17,
            fontWeight: 700,
            color: metric.belumTersedia ? 'var(--color-muted)' : 'var(--color-text)',
            lineHeight: 1.2,
          }}
        >
          {metric.value}
        </span>
      </div>
    </div>
  );
}

function SnapshotEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 8px' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
        Business Insight belum tersedia.
      </div>
    </div>
  );
}

function SnapshotErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 8px' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        Gagal memuat Business Snapshot.
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
          background: 'var(--color-primary-light)', border: 'none', borderRadius: 20, padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        Coba Lagi
      </button>
    </div>
  );
}

/**
 * Widget Business Snapshot — 1 Card, maksimal 6 informasi, 100% read-only
 * dari Business Insight (+ Batch Module untuk Batch Aktif). Tidak ada
 * Edit/Export/Delete — hanya tombol "Lihat Business Insight".
 */
export default function BusinessSnapshotSection() {
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);
  const { activeWorkspace } = useWorkspace();
  const result = getBusinessSnapshot(activeWorkspace?.workspace_uuid, activeWorkspace?.workspace_type);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 16,
      }}
    >
      {result.state === 'error' ? (
        <SnapshotErrorState onRetry={() => forceRerender((t) => t + 1)} />
      ) : result.state === 'empty' ? (
        <SnapshotEmptyState />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
          className="business-snapshot-grid"
        >
          {result.metrics.map((metric) => (
            <MetricTile key={metric.id} metric={metric} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/profile/business-insight')}
        style={{
          marginTop: 14,
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          padding: '10px 0 0',
          width: '100%',
          textAlign: 'center',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        Lihat Business Insight &gt;&gt;
      </button>
    </div>
  );
}
