import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardEvents,
  getDashboardNews,
  type DashboardEventCard,
  type DashboardNewsCard,
} from '../../data/dashboardNewsEventData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-008 — Dashboard News & Event Widget
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md dan
// docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md.
//
// 1 Card Widget dengan 2 Tab (News/Event) — BUKAN halaman News, BUKAN
// halaman Event. Default tab: Event (lebih time-sensitive). Maksimal 2 item
// per tab. Komponen ini murni presenter — seluruh data dibaca live oleh
// src/data/dashboardNewsEventData.ts, tidak ada logic bisnis di sini.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'Event' | 'News';

const STATUS_LABEL_COLOR: Record<DashboardEventCard['statusLabel'], { bg: string; color: string }> = {
  'Hari Ini': { bg: '#e8f5ee', color: '#1b7a43' },
  Segera: { bg: '#fff8e1', color: '#7b5e2a' },
  Membuka: { bg: '#e3f2fd', color: '#1565c0' },
};

function StatusBadge({ label }: { label: DashboardEventCard['statusLabel'] }) {
  const c = STATUS_LABEL_COLOR[label];
  return (
    <span
      style={{
        fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
        background: c.bg, color: c.color, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function EventRow({ item, isLast }: { item: DashboardEventCard; isLast: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex', gap: 10, paddingTop: 12, paddingBottom: isLast ? 0 : 12,
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 24,
        }}
      >
        {item.poster}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div
            style={{
              fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
          >
            {item.title}
          </div>
          <StatusBadge label={item.statusLabel} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
          📅 {item.tanggal} • 📍 {item.lokasi}
        </div>
        <button
          type="button"
          onClick={() => navigate(item.route)}
          style={{
            marginTop: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          Lihat &gt;
        </button>
      </div>
    </div>
  );
}

function NewsRow({ item, isLast }: { item: DashboardNewsCard; isLast: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex', gap: 10, paddingTop: 12, paddingBottom: isLast ? 0 : 12,
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 24,
        }}
      >
        {item.thumbnail}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
          🏷️ {item.kategori} • 📅 {item.tanggal}
        </div>
        <button
          type="button"
          onClick={() => navigate(item.route)}
          style={{
            marginTop: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          Baca &gt;
        </button>
      </div>
    </div>
  );
}

function WidgetEmptyState({ pesan }: { pesan: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 8px' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>🗞️</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-muted)' }}>{pesan}</div>
    </div>
  );
}

function WidgetErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 8px' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        Gagal memuat News & Event.
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

function TabButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, fontSize: 13, fontWeight: 700, padding: '10px 0', cursor: 'pointer',
        background: 'none', border: 'none',
        color: active ? 'var(--color-primary)' : 'var(--color-muted)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      }}
    >
      {icon} {label}
    </button>
  );
}

/**
 * Widget News & Event pada Dashboard — 1 Card dengan 2 Tab (News/Event),
 * default Event karena lebih time-sensitive. Maksimal 2 item per tab.
 * Seluruh data dibaca live via getDashboardEvents()/getDashboardNews();
 * widget ini tidak menyimpan/menghitung data apapun.
 */
export default function NewsEventWidgetSection() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Event');
  const [, forceRerender] = useState(0);
  const now = useMemo(() => new Date(), []);

  const eventResult = getDashboardEvents(now);
  const newsResult = getDashboardNews();

  const hasError = tab === 'Event' ? eventResult.state === 'error' : newsResult.state === 'error';

  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        <TabButton label="Event" icon="📅" active={tab === 'Event'} onClick={() => setTab('Event')} />
        <TabButton label="News" icon="📰" active={tab === 'News'} onClick={() => setTab('News')} />
      </div>

      <div style={{ padding: 16 }}>
        {hasError ? (
          <WidgetErrorState onRetry={() => forceRerender((t) => t + 1)} />
        ) : tab === 'Event' ? (
          eventResult.items.length === 0 ? (
            <WidgetEmptyState pesan="Belum ada event." />
          ) : (
            eventResult.items.map((item, idx) => (
              <EventRow key={item.id} item={item} isLast={idx === eventResult.items.length - 1} />
            ))
          )
        ) : newsResult.items.length === 0 ? (
          <WidgetEmptyState pesan="Belum ada berita." />
        ) : (
          newsResult.items.map((item, idx) => (
            <NewsRow key={item.id} item={item} isLast={idx === newsResult.items.length - 1} />
          ))
        )}

        <button
          type="button"
          onClick={() => navigate('/news-event')}
          style={{
            marginTop: 14, background: 'none', border: 'none', color: 'var(--color-primary)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '10px 0 0',
            width: '100%', textAlign: 'center', borderTop: '1px solid var(--color-border)',
          }}
        >
          Lihat Semua &gt;&gt;
        </button>
      </div>
    </div>
  );
}
