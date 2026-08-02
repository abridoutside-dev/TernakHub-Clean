import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRecentActivities,
  filterRecentActivities,
  RECENT_ACTIVITY_FILTER_LIST,
  RECENT_ACTIVITY_DEFAULT_LIMIT,
  type RecentActivityItem,
  type RecentActivityFilter,
} from '../data/recentActivityData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-007 — "Lihat Semua Aktivitas" (halaman terpisah dari Dashboard)
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard (Control Center) HANYA menampilkan ringkasan (maksimal 5
// aktivitas terbaru, tanpa filter) — lihat
// src/components/dashboard/RecentActivity.tsx. Filter kategori dan
// "Muat Lebih Banyak" (daftar lengkap) dipindahkan ke halaman ini
// (Constitution → FILTER: "Filter hanya ada di halaman Recent Activity").
// Tetap read-only, tidak ada data store sendiri — getRecentActivities()
// dibaca ulang setiap render.
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_LABEL: Record<RecentActivityFilter, string> = {
  All: 'Semua',
  Livestock: 'Livestock',
  Feed: 'Feed',
  Medicine: 'Medicine',
  Health: 'Health',
  Marketplace: 'Marketplace',
  News: 'News',
  Event: 'Event',
};

import { formatRelativeTimeWithNow as formatRelativeTime } from '../utils/relativeTime';

function FilterChips({ active, onChange }: { active: RecentActivityFilter; onChange: (f: RecentActivityFilter) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
      {RECENT_ACTIVITY_FILTER_LIST.map((f) => {
        const isActive = f === active;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 20,
              border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {FILTER_LABEL[f]}
          </button>
        );
      })}
    </div>
  );
}

function ActivityRow({ item, now, isLast }: { item: RecentActivityItem; now: Date; isLast: boolean }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}
        >
          {item.icon}
        </div>
        {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--color-border)', marginTop: 4, marginBottom: 4 }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {formatRelativeTime(item.timestamp, now)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.5 }}>{item.summary}</div>
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
 * Halaman "Lihat Semua Aktivitas" — daftar Recent Activity lengkap dengan
 * filter kategori dan "Muat Lebih Banyak", dibuka dari Dashboard.
 */
export default function DashboardRecentActivity() {
  const [, forceRerender] = useState(0);
  const [filter, setFilter] = useState<RecentActivityFilter>('All');
  const [visibleCount, setVisibleCount] = useState(RECENT_ACTIVITY_DEFAULT_LIMIT);

  const now = useMemo(() => new Date(), []);
  const result = getRecentActivities();

  return (
    <div style={{ width: '100%' }}>
      {result.state === 'error' ? (
        <RecentActivityErrorState onRetry={() => forceRerender((t) => t + 1)} />
      ) : (
        <>
          <FilterChips
            active={filter}
            onChange={(f) => {
              setFilter(f);
              setVisibleCount(RECENT_ACTIVITY_DEFAULT_LIMIT);
            }}
          />

          {(() => {
            const filtered = filterRecentActivities(result.items, filter);
            if (filtered.length === 0) return <RecentActivityEmptyState />;
            return (
              <div
                style={{
                  background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '16px 16px 0',
                }}
              >
                {filtered.slice(0, visibleCount).map((item, idx) => (
                  <ActivityRow
                    key={item.id}
                    item={item}
                    now={now}
                    isLast={idx === Math.min(filtered.length, visibleCount) - 1}
                  />
                ))}

                {visibleCount < filtered.length && (
                  <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + RECENT_ACTIVITY_DEFAULT_LIMIT)}
                      style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
                        background: 'var(--color-primary-light)', border: 'none', borderRadius: 20,
                        padding: '8px 16px', cursor: 'pointer',
                      }}
                    >
                      Muat Lebih Banyak ({filtered.length - visibleCount} lagi)
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
