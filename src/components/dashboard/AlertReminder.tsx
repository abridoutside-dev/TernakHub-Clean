import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardAlerts,
  ALERT_PRIORITY_META,
  type AlertItem,
} from '../../data/alertReminderData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-006 — Dashboard Alert & Reminder
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard hanya menampilkan RINGKASAN Alert (maksimal 3, lihat
// src/data/alertReminderData.ts → getDashboardAlerts). Alert TERPISAH dari
// AI Insight — Alert murni peringatan/pengingat berbasis kondisi data, bukan
// analisis/rekomendasi AI. Setiap Card hanya: Icon, Judul, Ringkasan singkat,
// Priority Badge, tombol "Buka Modul" — tidak ada deskripsi panjang/info
// teknis/log (Constitution → CARD).
//
// Komponen ini TIDAK mengubah data modul manapun — "Buka Modul" hanya
// navigasi, logic bisnis tetap berada di modul asal. Alert tidak dapat
// di-dismiss permanen (Constitution → ALERT).
// ─────────────────────────────────────────────────────────────────────────────

function AlertRow({ item, onOpen, isLast }: { item: AlertItem; onOpen: (item: AlertItem) => void; isLast: boolean }) {
  const priorityMeta = ALERT_PRIORITY_META[item.priority];
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
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
            {priorityMeta.label}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{item.summary}</div>
      </div>
      <button
        type="button"
        onClick={() => onOpen(item)}
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-primary)',
          background: 'var(--color-primary-light)',
          border: 'none',
          borderRadius: 20,
          padding: '6px 10px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Buka Modul
      </button>
    </div>
  );
}

function AlertEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px', textAlign: 'center',
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
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px', textAlign: 'center',
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
 * Section Alert & Reminder (ringkas) — Dashboard hanya menampilkan
 * maksimal 3 Alert prioritas tertinggi (Critical → High → Reminder).
 * Daftar Alert lengkap ada di halaman terpisah, dibuka lewat
 * "Lihat Semua Alert" (lihat DashboardAlertReminder.tsx).
 */
export default function AlertReminderSection() {
  const navigate = useNavigate();
  const [, forceRerender] = useState(0);
  const result = getDashboardAlerts();

  const handleOpen = (item: AlertItem) => {
    navigate(item.action.route);
  };

  if (result.state === 'error') {
    return <AlertErrorState onRetry={() => forceRerender((t) => t + 1)} />;
  }

  if (result.items.length === 0) {
    return <AlertEmptyState />;
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
        <AlertRow key={item.id} item={item} onOpen={handleOpen} isLast={idx === result.items.length - 1} />
      ))}

      <button
        type="button"
        onClick={() => navigate('/dashboard/alert')}
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
        Lihat Semua Alert &gt;&gt;
      </button>
    </div>
  );
}
