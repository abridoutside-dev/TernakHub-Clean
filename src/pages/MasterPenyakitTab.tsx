// ─── Master Penyakit Tab ─────────────────────────────────────────────────────
// SP-001 (Revisi): Rekonstruksi halaman Master Penyakit.
// Alur dimulai dari Jenis Ternak → Kategori Penyakit (belum dibuat).
// Layout: Ringkasan → Search → Grid (tanpa AI Insight duplikat).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  JENIS_TERNAK_PENYAKIT,
  type JenisTernakPenyakit,
} from '../data/jenisTernakPenyakitData';
import { getKategoriByTernakSlug } from '../data/kategoriPenyakitData';
import { getAllPenyakit } from '../data/daftarPenyakitData';

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function RingkasanCards() {
  const totalJenis = JENIS_TERNAK_PENYAKIT.length;
  const totalKategori = JENIS_TERNAK_PENYAKIT.reduce(
    (sum, j) => sum + getKategoriByTernakSlug(j.slug, j.uuid).length,
    0,
  );
  const totalPenyakit = getAllPenyakit().filter((p) => p.status === 'Aktif').length;

  const cards = [
    { label: 'Total Jenis Ternak', value: String(totalJenis),    icon: '🐾', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Total Kategori',     value: String(totalKategori), icon: '🏷️', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Total Penyakit',     value: String(totalPenyakit), icon: '🩺', bg: '#ffebee', color: '#c62828' },
    { label: 'Terakhir Diperbarui', value: 'Jul 2026',           icon: '📅', bg: '#eceff1', color: '#546e7a' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: card.bg,
          border: '1.5px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 20 }}>{card.icon}</span>
          <div style={{
            fontSize: card.value.length > 6 ? 13 : 22,
            fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Jenis Ternak Card ────────────────────────────────────────────────────────

function JenisTernakCard({ item, kategoriCount, onClick }: { item: JenisTernakPenyakit; kategoriCount: number; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 12px 16px',
        gap: 10,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4, background: item.color,
      }} />

      {/* Icon */}
      <div style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-md)',
        background: item.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36,
        flexShrink: 0,
      }}>
        {item.icon}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 15, fontWeight: 800,
        color: 'var(--color-text)',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {item.nama}
      </div>

      {/* Category count badge */}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: item.color, background: item.bg,
        borderRadius: 20, padding: '3px 10px',
      }}>
        {kategoriCount} kategori
      </span>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: 'var(--color-border)' }} />

      {/* CTA */}
      <span style={{
        fontSize: 11, color: 'var(--color-primary)',
        fontWeight: 700, textAlign: 'center',
      }}>
        Lihat Kategori →
      </span>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function MasterPenyakitTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = JENIS_TERNAK_PENYAKIT.filter((j) =>
    j.nama.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Ringkasan */}
      <div style={{
        padding: '14px 16px 0',
        maxWidth: 480, margin: '0 auto',
      }}>
        <RingkasanCards />
      </div>

      {/* Search */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari jenis ternak..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                border: 'none', background: 'none',
                fontSize: 14, color: 'var(--color-muted)',
                cursor: 'pointer', padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {JENIS_TERNAK_PENYAKIT.length} jenis ternak
        </div>
      </div>

      {/* Jenis Ternak grid */}
      <div style={{
        padding: '10px 16px 0',
        maxWidth: 480, margin: '0 auto',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '60px 24px', gap: 14,
          }}>
            <span style={{ fontSize: 56 }}>🐾</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Jenis Ternak Tidak Ditemukan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((item) => (
              <JenisTernakCard
                key={item.uuid}
                item={item}
                kategoriCount={getKategoriByTernakSlug(item.slug, item.uuid).length}
                onClick={() => navigate(`/stok-obat/penyakit/${item.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
