// ─── Profile About — Roadmap (PROFILE-010) ────────────────────────────────────
// Menampilkan roadmap TernakHub: Selesai / Sedang Berjalan / Direncanakan.
// Tab "Direncanakan" menampilkan empty state bila belum ada roadmap resmi.

import { useState } from 'react';
import {
  ROADMAP,
  ROADMAP_STATUS_CONFIG,
  type RoadmapStatus,
  type RoadmapItem,
} from '../data/profileAboutData';

const TABS: RoadmapStatus[] = ['Selesai', 'Sedang Berjalan', 'Direncanakan'];

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const cfg = ROADMAP_STATUS_CONFIG[item.status];
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '14px 16px',
      boxShadow: 'var(--shadow-sm)',
      borderLeft: `4px solid ${cfg.warna}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
          textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          {item.fase}
        </div>
        <span style={{
          background: cfg.bg, color: cfg.warna,
          border: `1px solid ${cfg.warna}33`,
          borderRadius: 20, padding: '2px 10px',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {cfg.ikon} {item.status}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
        {item.judul}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 8 }}>
        {item.deskripsi}
      </div>
      <div style={{ fontSize: 12, color: cfg.warna, fontWeight: 600 }}>
        🗓️ {item.periode}
      </div>
    </div>
  );
}

export default function ProfileAboutRoadmap() {
  const [activeTab, setActiveTab] = useState<RoadmapStatus>('Sedang Berjalan');
  const items = ROADMAP.filter(r => r.status === activeTab);

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const count = ROADMAP.filter(r => r.status === t).length;
          const cfg   = ROADMAP_STATUS_CONFIG[t];
          return (
            <div key={t} style={{
              background: cfg.bg, borderRadius: 8, padding: '6px 12px',
              display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 80,
              border: `1px solid ${cfg.warna}44`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: cfg.warna }}>{count}</span>
              <span style={{ fontSize: 11, color: cfg.warna, fontWeight: 600 }}>{t}</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10, overflow: 'hidden',
        marginBottom: 16,
      }}>
        {TABS.map((t) => {
          const cfg = ROADMAP_STATUS_CONFIG[t];
          const active = t === activeTab;
          return (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px 4px',
              background: active ? cfg.warna : 'transparent',
              color: active ? '#fff' : 'var(--color-muted)',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all .15s',
              borderRight: '1px solid var(--color-border)',
            }}>
              {cfg.ikon} {t === 'Sedang Berjalan' ? 'Berjalan' : t === 'Direncanakan' ? 'Direncanakan' : t}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 13 }}>
          Belum ada roadmap yang ditetapkan.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => <RoadmapCard key={item.id} item={item} />)}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: 24,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '12px 16px',
        fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6,
      }}>
        📌 Roadmap bersifat indikatif dan dapat berubah sesuai perkembangan kebutuhan pengguna dan prioritas tim.
      </div>
    </div>
  );
}
