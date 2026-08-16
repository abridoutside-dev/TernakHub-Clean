// ─── AI Insight Card — Reusable UI Component ───────────────────────────────────
// Used by FeedStoreOperational and FeedStoreDashboard to display module/
// dashboard-specific insight items.

import React from 'react';

export interface AiInsightItem {
  icon: string;
  text: string;
  color?: string;
}

export interface AiInsightCardProps {
  title: string;
  icon: string;
  items: AiInsightItem[];
  emptyMessage?: string;
}

export function AiInsightCard({ title, icon, items, emptyMessage = 'Belum ada data yang dapat dianalisis.' }: AiInsightCardProps): React.ReactElement {
  if (items.length === 0) {
    return (
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{title}</span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11 }}>{item.icon}</span>
            <p style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: item.color ?? '#334155' }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
