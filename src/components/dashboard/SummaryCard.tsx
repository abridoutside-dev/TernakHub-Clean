import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSummaryCards, type SummaryCardData } from '../../data/dashboardSummaryData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-004 — Dashboard Summary Card
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Summary Card BUKAN tempat menghitung/menyimpan data — komponen ini HANYA
// merender apa yang sudah dibaca live oleh src/data/dashboardSummaryData.ts.
// getSummaryCards() dipanggil langsung di body komponen (bukan di dalam
// useMemo) sehingga setiap render selalu membaca kondisi terbaru dari modul
// asal — konsisten dengan pola Dashboard Livestock (lihat QuickAction/
// AiInsight) yang menghindari nilai "beku".
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCardTile({ card, onRetry }: { card: SummaryCardData; onRetry: () => void }) {
  const navigate = useNavigate();

  if (card.state === 'error') {
    return (
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span style={{ fontSize: 20 }}>{card.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{card.title}</span>
        <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>Gagal memuat data.</span>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'var(--color-primary-light)',
            borderRadius: 20,
            padding: '6px 10px',
            alignSelf: 'flex-start',
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20 }}>{card.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {card.lastUpdated}
        </span>
      </div>
      <span
        style={{
          fontSize: card.value.length > 8 ? 18 : 24,
          fontWeight: 700,
          color: card.state === 'empty' ? 'var(--color-muted)' : 'var(--color-text)',
          lineHeight: 1.15,
        }}
      >
        {card.value}
      </span>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>{card.title}</span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>{card.subtitle}</span>
      <button
        type="button"
        onClick={() => navigate(card.action.route)}
        style={{
          marginTop: 4,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-primary)',
          background: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        {card.action.label} &gt;
      </button>
    </div>
  );
}

function SummaryCardEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px',
        textAlign: 'center',
        gridColumn: '1 / -1',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada data.</div>
    </div>
  );
}

/**
 * Section Summary Card — grid ringkasan lintas modul (Livestock, Feed,
 * Medicine, Health, Business Insight). Seluruh nilai dibaca live via
 * getSummaryCards(); komponen ini tidak menghitung ataupun menyimpan data.
 */
export default function SummaryCardSection() {
  // Tick lokal hanya untuk memicu re-render saat "Coba Lagi" ditekan — tidak
  // menyimpan data apapun, karena getSummaryCards() selalu membaca ulang
  // dari modul asal setiap kali dipanggil.
  const [, forceRerender] = useState(0);
  const cards = getSummaryCards();

  if (cards.length === 0) {
    return <SummaryCardEmptyState />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="summary-card-grid">
      {cards.map((card) => (
        <SummaryCardTile key={card.id} card={card} onRetry={() => forceRerender((t) => t + 1)} />
      ))}
    </div>
  );
}
