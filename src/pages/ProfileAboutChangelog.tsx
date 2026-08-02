// ─── Profile About — Changelog (PROFILE-010) ─────────────────────────────────
// Riwayat pembaruan versi TernakHub.

import { useState } from 'react';
import {
  CHANGELOG,
  CHANGELOG_JENIS_CONFIG,
  CHANGELOG_KATEGORI_CONFIG,
  type ChangelogEntry,
} from '../data/profileAboutData';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const jenis = CHANGELOG_JENIS_CONFIG[entry.jenis];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '14px 16px',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {/* Version badge */}
        <div style={{
          background: jenis.bg, color: jenis.warna,
          border: `1px solid ${jenis.warna}44`,
          borderRadius: 8, padding: '4px 10px', flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>v{entry.versi}</div>
          <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{entry.jenis}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
            {entry.ringkasan}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            🗓️ {formatDate(entry.tanggal)}
          </div>
        </div>

        <span style={{
          color: 'var(--color-muted)', fontSize: 18,
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform .2s',
          display: 'inline-block',
        }}>›</span>
      </button>

      {/* Detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entry.perubahan.map((p, i) => {
              const cfg = CHANGELOG_KATEGORI_CONFIG[p.kategori] ?? { ikon: '•', warna: 'var(--color-muted)' };
              return (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{cfg.ikon}</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.warna, marginRight: 6 }}>
                      [{p.kategori}]
                    </span>
                    <span style={{ color: 'var(--color-muted)' }}>{p.deskripsi}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileAboutChangelog() {
  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
      }}>
        {Object.entries(CHANGELOG_KATEGORI_CONFIG).map(([k, v]) => (
          <span key={k} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, color: v.warna, fontWeight: 600,
          }}>
            {v.ikon} {k}
          </span>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CHANGELOG.map(e => <ChangelogCard key={e.id} entry={e} />)}
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 12, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6,
      }}>
        📬 Ketuk setiap versi untuk melihat daftar perubahan detail.
      </div>
    </div>
  );
}
