import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KATEGORI_INDUK, type KategoriInduk } from '../data/masterPakanKategoriData';
import { getKategoriItemCount, getTotalAllKategoriCount } from '../data/masterPakanCounts';

// ─── AI Insight (Master Pakan — kategori-level) ───────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeMasterInsights(): Insight[] {
  const total   = KATEGORI_INDUK.length;
  const refs    = getTotalAllKategoriCount();

  const insights: Insight[] = [
    {
      icon: '📚', color: '#1b7a43', bg: '#e8f5ee',
      text: `Database Master Pakan mencakup ${total} kategori induk — dari hijauan, serealia, hingga mineral dan feed additive — sebagai referensi lengkap formulasi ransum ternak.`,
    },
    {
      icon: '🌱', color: '#2e7d32', bg: '#e8f5e9',
      text: `Saat ini tersedia ${refs} referensi bahan pakan aktif. Setiap bahan dapat digunakan sebagai acuan untuk Stock Pakan, Formula, dan Catat Pemberian Pakan.`,
    },
    {
      icon: '🏗️', color: '#e65100', bg: '#fff3e0',
      text: `Sub kategori untuk masing-masing dari ${total} kategori induk sedang disiapkan. Struktur bertingkat memungkinkan pencarian bahan yang lebih presisi dan efisien.`,
    },
    {
      icon: '🔗', color: '#0277bd', bg: '#e1f5fe',
      text: `Master Pakan menjadi sumber data terpusat untuk modul Stock, Formula, AI Nutrisi, dan Marketplace — pastikan data referensi selalu mutakhir untuk rekomendasi akurat.`,
    },
    {
      icon: '💡', color: '#6a1b9a', bg: '#f3e5f5',
      text: `Lengkapi sub kategori setiap kelompok bahan untuk mengaktifkan rekomendasi AI berbasis kandungan nutrisi, harga pasar, dan ketersediaan musiman.`,
    },
  ];

  return insights;
}

export function MasterAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeMasterInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Master Pakan</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.5 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setExpanded(v => !v)} style={{
        width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan (kategori-level) ───────────────────────────────────────────────

export function MasterRingkasanCards() {
  const totalKategori  = KATEGORI_INDUK.length;
  // Aggregate the real total across all 18 per-category data modules — NOT the
  // legacy masterPakanData.ts flat DB (which is a separate pre-category dataset).
  const totalReferensi = getTotalAllKategoriCount();

  const cards = [
    { label: 'Total Kategori',        value: String(totalKategori),  icon: '🏷️', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Total Referensi Bahan', value: String(totalReferensi), icon: '🌿', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Terakhir Diperbarui',   value: 'Per Kategori',         icon: '🕒', bg: '#fff8e1', color: '#7b5e2a' },
    { label: 'Status Database',        value: 'Aktif',               icon: '✅', bg: '#e8f5e9', color: '#2e7d32' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
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

// ─── Category Card ─────────────────────────────────────────────────────────────

function KategoriCard({ kategori, onLihat }: { kategori: KategoriInduk; onLihat: () => void }) {
  const jumlahItem = getKategoriItemCount(kategori.slug);
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: kategori.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

        {/* Row 1: icon + name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: kategori.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {kategori.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {kategori.nama}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: kategori.color, background: kategori.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {jumlahItem} item
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Description */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {kategori.deskripsi}
        </p>

        {/* Lihat Selengkapnya */}
        <button
          type="button"
          onClick={onLihat}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${kategori.color}`,
            background: 'transparent', color: kategori.color,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Lihat Selengkapnya →
        </button>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function MasterPakanTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = KATEGORI_INDUK.filter(k =>
    k.nama.toLowerCase().includes(query.toLowerCase()) ||
    k.deskripsi.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Search */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari kategori pakan..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {KATEGORI_INDUK.length} kategori
        </div>
      </div>

      {/* Category list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🌿</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Kategori Tidak Ditemukan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          filtered.map(k => (
            <KategoriCard
              key={k.slug}
              kategori={k}
              onLihat={() => navigate(`/stok-pakan/master/${k.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
