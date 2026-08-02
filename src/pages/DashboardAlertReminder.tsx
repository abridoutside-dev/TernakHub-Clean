import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAlerts,
  ALERT_PRIORITY_META,
  ALERT_CATEGORY_META,
  type AlertItem,
} from '../data/alertReminderData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-006 — "Lihat Semua Alert" (halaman terpisah dari Dashboard)
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard (Control Center) HANYA menampilkan ringkasan (maksimal 3 Alert
// prioritas tertinggi) — lihat src/components/dashboard/AlertReminder.tsx.
// Halaman ini menampilkan SELURUH Alert yang sedang aktif, dikelompokkan per
// Priority (Critical → High → Reminder), agar Dashboard tidak menjadi
// "halaman daftar Alert" (Constitution → TUJUAN). Halaman ini tetap TIDAK
// mengubah data modul manapun — "Buka Modul" hanya navigasi.
// ─────────────────────────────────────────────────────────────────────────────

function AlertCard({ item, onOpen }: { item: AlertItem; onOpen: (item: AlertItem) => void }) {
  const priorityMeta = ALERT_PRIORITY_META[item.priority];
  const categoryMeta = ALERT_CATEGORY_META[item.category];

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{categoryMeta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                color: priorityMeta.color,
                background: priorityMeta.bg,
                borderRadius: 20,
                padding: '2px 8px',
              }}
            >
              {priorityMeta.icon} {priorityMeta.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {categoryMeta.label}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.5 }}>{item.summary}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>Sumber: {item.sourceModule}</div>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={() => onOpen(item)}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'var(--color-primary-light)',
            border: 'none',
            borderRadius: 20,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {item.action.label}
        </button>
      </div>
    </div>
  );
}

function AlertEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
        Semua kondisi dalam keadaan baik.
      </div>
    </div>
  );
}

function AlertErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        Gagal memuat Alert.
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
 * Halaman "Lihat Semua Alert" — daftar Alert lengkap dikelompokkan per
 * Priority (Critical → High → Reminder), dibuka dari Dashboard.
 */
export default function DashboardAlertReminder() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const result = getAlerts();

  const handleAction = (item: AlertItem) => {
    navigate(item.action.route);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      {result.state === 'error' ? (
        <AlertErrorState onRetry={() => setRefreshKey((k) => k + 1)} />
      ) : result.items.length === 0 ? (
        <AlertEmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.items.map((item) => (
            <AlertCard key={item.id} item={item} onOpen={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
