import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTodayActivities,
  TODAY_ACTIVITY_DASHBOARD_LIMIT,
  type TodayActivityItem,
} from '../../data/todayActivityData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-005 — Dashboard Today's Activity
// DB-003R — Revisi: Dashboard bukan halaman daftar — dibatasi maksimal 5
// aktivitas terbaru, tanpa filter kategori/"Muat Lebih Banyak" di sini.
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Komponen ini HANYA merender apa yang sudah dibaca live oleh
// src/data/todayActivityData.ts — tidak ada data store sendiri, tidak ada
// logic bisnis. Filter lengkap + "Muat Lebih Banyak" dipindahkan ke halaman
// "Lihat Semua" (/dashboard/aktivitas), lihat DashboardTodayActivity.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import { formatRelativeTimeWithNow as formatRelativeTime } from '../../utils/relativeTime';

function ActivityRow({ item, now, isLast }: { item: TodayActivityItem; now: Date; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}
        >
          {item.icon}
        </div>
        {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--color-border)', marginTop: 4, marginBottom: 4 }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {formatRelativeTime(item.timestamp, now)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{item.summary}</div>
      </div>
    </div>
  );
}

function TodayActivityEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada aktivitas hari ini.</div>
    </div>
  );
}

function TodayActivityErrorState({ onRetry }: { onRetry: () => void }) {
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
 * Section Today's Activity (ringkas) — Dashboard bukan halaman daftar,
 * sehingga hanya menampilkan maksimal 5 aktivitas terbaru (tanpa filter/
 * load-more). Daftar lengkap + filter kategori ada di halaman terpisah,
 * dibuka lewat "Lihat Semua".
 */
export default function TodayActivitySection() {
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);
  const now = useMemo(() => new Date(), []);
  const result = getTodayActivities(now);

  if (result.state === 'error') {
    return <TodayActivityErrorState onRetry={() => forceRerender((t) => t + 1)} />;
  }

  const items = result.items.slice(0, TODAY_ACTIVITY_DASHBOARD_LIMIT);

  if (items.length === 0) {
    return <TodayActivityEmptyState />;
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px 16px 4px',
      }}
    >
      {items.map((item, idx) => (
        <ActivityRow key={item.id} item={item} now={now} isLast={idx === items.length - 1} />
      ))}

      <button
        type="button"
        onClick={() => navigate('/dashboard/aktivitas')}
        style={{
          background: 'none', border: 'none', color: 'var(--color-primary)',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '10px 0 12px',
          width: '100%', textAlign: 'center', borderTop: '1px solid var(--color-border)',
        }}
      >
        Lihat Semua &gt;&gt;
      </button>
    </div>
  );
}
