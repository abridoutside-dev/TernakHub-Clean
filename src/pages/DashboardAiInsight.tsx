import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAiGeneratedSummary,
  getAiInsights,
  groupInsightsBySection,
  PRIORITY_META,
  CATEGORY_META,
  formatRelativeTime,
  type AiInsightItem,
  type InsightAction,
} from '../data/aiInsightData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-003R / HOME-002 — "Lihat Semua Insight" (halaman terpisah dari Dashboard)
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard (Control Center) HANYA menampilkan ringkasan (AI Generated
// Summary + maksimal 3 Insight Prioritas) — lihat
// src/components/dashboard/AiInsight.tsx. Daftar Insight LENGKAP (seluruh
// priority: Critical/Warning/Recommendation/Information, dengan detail
// badge/source/timestamp/aksi) dipindahkan ke halaman ini agar Dashboard
// tidak menjadi "halaman AI". Halaman ini tetap TIDAK mengubah data modul
// manapun — "Tandai Sudah Dibaca" hanya state UI lokal per sesi.
//
// formatRelativeTime diambil dari data layer (tidak duplikat) dan selalu
// menggunakan Date.now() — tidak ada hardcoded timestamp.
// ─────────────────────────────────────────────────────────────────────────────

function AiSummaryPanel() {
  const summary = getAiGeneratedSummary();
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          ✨
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>AI Generated Summary</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Dianalisis {formatRelativeTime(summary.generatedAt)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ringkasan</div>
          <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>{summary.summaryText}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Prediksi (AI Prediction)</div>
          <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>{summary.predictionText}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Rekomendasi (AI Recommendation)</div>
          <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>{summary.recommendationText}</div>
        </div>
      </div>
    </div>
  );
}

function InsightActionButton({ action, isRead, onRun }: { action: InsightAction; isRead: boolean; onRun: (action: InsightAction) => void }) {
  const isMarkRead = action.type === 'tandai-dibaca';
  return (
    <button
      type="button"
      onClick={() => onRun(action)}
      disabled={isMarkRead && isRead}
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: isMarkRead && isRead ? 'var(--color-muted)' : 'var(--color-primary)',
        background: isMarkRead && isRead ? 'var(--color-bg)' : 'var(--color-primary-light)',
        border: 'none',
        borderRadius: 20,
        padding: '6px 12px',
        cursor: isMarkRead && isRead ? 'default' : 'pointer',
      }}
    >
      {isMarkRead && isRead ? 'Sudah Dibaca' : action.label}
    </button>
  );
}

function InsightCard({ item, isRead, onAction }: { item: AiInsightItem; isRead: boolean; onAction: (item: AiInsightItem, action: InsightAction) => void }) {
  const priorityMeta = PRIORITY_META[item.priority];
  const categoryMeta = CATEGORY_META[item.category];

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 14,
        opacity: isRead ? 0.65 : 1,
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
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>Sumber: {item.sourceModule}</span>
            <span>•</span>
            <span>{formatRelativeTime(item.timestamp)}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {item.actions.map((action) => (
          <InsightActionButton key={action.type} action={action} isRead={isRead} onRun={(a) => onAction(item, a)} />
        ))}
      </div>
    </div>
  );
}

function AiInsightEmptyState() {
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
        Tidak ada Insight yang memerlukan perhatian.
      </div>
    </div>
  );
}

/**
 * Halaman "Lihat Semua Insight" — daftar Insight lengkap dikelompokkan per
 * Section (Critical → Warning → Recommendation → Information), dibuka dari
 * Dashboard. Seluruh data adalah dummy/placeholder (belum ada AI Engine).
 */
export default function DashboardAiInsight() {
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const insights = useMemo(() => getAiInsights(), []);
  const groups = useMemo(() => groupInsightsBySection(insights), [insights]);

  const handleAction = (item: AiInsightItem, action: InsightAction) => {
    if (action.type === 'buka-modul' || action.type === 'lihat-detail') {
      if (action.to) navigate(action.to);
      return;
    }
    if (action.type === 'tandai-dibaca') {
      setReadIds((prev) => new Set(prev).add(item.id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <AiSummaryPanel />

      {groups.length === 0 ? (
        <AiInsightEmptyState />
      ) : (
        groups.map((group) => (
          <div key={group.section} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {group.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((item) => (
                <InsightCard key={item.id} item={item} isRead={readIds.has(item.id)} onAction={handleAction} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
