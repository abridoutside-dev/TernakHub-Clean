// ─── Shared Bobot UI Primitives (CB-SYNC-002) ───────────────────────────────
// Scoped fix for CB-M1 (aiInsightBobotData duplication): CatatBobot.tsx and
// RiwayatBobot.tsx previously each defined their own copy of SectionLabel,
// Card, and a static Pro/Free AiInsightCard placeholder. This file centralizes
// those primitives plus a generic, real-data InsightCard renderer so both
// pages consume one implementation.
//
// Note: this consolidation is intentionally scoped to the Catat Bobot module
// (the two files above). Other modules (Batch, Mutasi, Reproduksi, Pemberian
// Pakan, Kesehatan Hewan) each still define their own local ModuleHeader /
// SectionLabel / Card — that is a pre-existing, project-wide pattern outside
// this task's scope (see docs/CB_SYNC_001_REPORT.md, CB-N4).
//
// LS-FIX-001: SectionLabel extended with optional `count` prop so Livestock.tsx
// can import from here instead of defining its own local variant (MIN-002).

import type React from 'react';
import type { InsightItem, InsightLevel } from '../data/aiInsightBobotData';

export function SectionLabel({ title, count }: { title: string; count?: number }) {
  return (
    <h2 style={{
      margin: '0 0 10px', fontSize: 12, fontWeight: 700,
      color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
      display: 'flex', alignItems: 'baseline', gap: 6,
    }}>
      {title}
      {typeof count === 'number' && (
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0 }}>({count})</span>
      )}
    </h2>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

const LEVEL_CFG: Record<InsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

/**
 * Generic, read-only AI Insight renderer. No Pro/Free gate — every insight is
 * real, rule-based output from the data layer (see 03_AI_CONSTITUTION.md).
 */
export function InsightCard({
  icon, title, items, analyzedAt, confidenceStatus,
}: {
  icon: string;
  title: string;
  items: InsightItem[];
  analyzedAt: string;
  confidenceStatus?: string;
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>
          🤖 AI Insight
        </h2>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>
          {new Date(analyzedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
          {confidenceStatus && (
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>
              {confidenceStatus}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center' }}>
            Belum ada insight untuk ditampilkan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.slice(0, 3).map((item, i) => {
              const cfg = LEVEL_CFG[item.level];
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < Math.min(items.length, 3) - 1 ? '1px solid var(--color-border)' : 'none',
                    borderLeft: `3px solid ${cfg.border}`,
                    background: cfg.bg,
                    display: 'flex', flexDirection: 'column', gap: 3,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>
                    {item.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
