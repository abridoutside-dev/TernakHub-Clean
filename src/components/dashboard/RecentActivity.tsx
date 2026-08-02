import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardRecentActivities,
  type RecentActivityItem,
} from '../../data/recentActivityData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-007 — Dashboard Recent Activity
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Recent Activity = ringkasan aktivitas TERBARU lintas modul (bisa kemarin
// atau beberapa hari lalu) — BUKAN Today's Activity, BUKAN Audit Trail,
// BUKAN Log Sistem. Dashboard hanya menampilkan maksimal 5 item, urut
// Terbaru → Terlama, TANPA filter (Constitution → FILTER). Filter kategori +
// "Muat Lebih Banyak" lengkap ada di halaman "Lihat Semua Aktivitas"
// (/dashboard/recent-activity), lihat DashboardRecentActivity.tsx.
//
// Komponen ini murni presenter — tidak ada data store sendiri, tidak ada
// logic bisnis, tidak mengubah data modul manapun.
// ─────────────────────────────────────────────────────────────────────────────

import { formatRelativeTimeWithNow as formatRelativeTime } from '../../utils/relativeTime';

function ActivityRow({ item, now, isLast }: { item: RecentActivityItem; now: Date; isLast: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        paddingTop: 12,
        paddingBottom: isLast ? 0 : 12,
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {formatRelativeTime(item.timestamp, now)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{item.summary}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span
            style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3,
              color: 'var(--color-muted)', background: 'var(--color-bg)', borderRadius: 20, padding: '2px 8px',
            }}
          >
            {item.sourceModule}
          </span>
          <button
            type="button"
            onClick={() => navigate(item.action.route)}
            style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            {item.action.label} &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentActivityEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>🗒️</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada aktivitas.</div>
    </div>
  );
}

function RecentActivityErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        Gagal memuat aktivitas.
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
 * Section Recent Activity (ringkas) — Dashboard hanya menampilkan maksimal 5
 * aktivitas terbaru lintas modul, tanpa filter kategori. Daftar lengkap +
 * filter ada di halaman terpisah, dibuka lewat "Lihat Semua Aktivitas".
 */
export default function RecentActivitySection() {
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);
  const now = useMemo(() => new Date(), []);
  const result = getDashboardRecentActivities();

  if (result.state === 'error') {
    return <RecentActivityErrorState onRetry={() => forceRerender((t) => t + 1)} />;
  }

  if (result.items.length === 0) {
    return <RecentActivityEmptyState />;
  }

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
      {result.items.map((item, idx) => (
        <ActivityRow key={item.id} item={item} now={now} isLast={idx === result.items.length - 1} />
      ))}

      <button
        type="button"
        onClick={() => navigate('/dashboard/recent-activity')}
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
        Lihat Semua Aktivitas &gt;&gt;
      </button>
    </div>
  );
}
