import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLimbahIndustriList, computeLimbahIndustriRingkasan, LIMBAH_INDUSTRI_KATEGORI_ORDER,
  KATEGORI_ITEM_STYLE,
  type LimbahIndustriItem,
} from '../data/limbahIndustriPanganData';
import type { KategoriItem } from '../data/jagungData';

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeLimbahIndustriInsights(): Insight[] {
  const items    = getLimbahIndustriList();
  const priced   = items.filter(i => i.estimasiHarga !== null);
  const termurah = [...priced].sort((a, b) => a.estimasiHarga! - b.estimasiHarga!)[0];
  const serealia = items.filter(i => i.kategoriItem === 'By-product Serealia').length;
  const protein  = items.filter(i => i.kategoriItem === 'Ampas Protein Nabati').length;

  return [
    {
      icon: '🏭', color: '#546e7a', bg: '#eceff1',
      text: `${items.length} bahan baku tunggal hasil samping industri pangan terdokumentasi — semuanya merupakan by-product proses pengolahan, bukan campuran atau formula. Kategori ini adalah referensi untuk diversifikasi pakan berbasis limbah industri lokal yang tersedia melimpah di Indonesia.`,
    },
    {
      icon: '🌾', color: '#6d4c41', bg: '#efebe9',
      text: `${serealia} by-product industri penggilingan serealia (gandum & jagung) tersedia — Pollard, Wheat Bran, CGF, CGM, dan DDGS adalah bahan berkandungan protein ±14–60% BK. CGM (Corn Gluten Meal) dengan protein ±60% BK adalah sumber protein paling pekat di kategori ini, setara bungkil kedelai dalam kandungan protein kasar.`,
    },
    {
      icon: '🫘', color: '#1b7a43', bg: '#e8f5ee',
      text: `${protein} ampas protein nabati (tahu, tempe, kecap) — Ampas Tahu (Okara) adalah sumber protein lokal paling berlimpah dengan protein ±25–28% BK dan harga sangat terjangkau. Tersedia setiap hari dari ribuan pengrajin tahu di seluruh Indonesia; kuncinya adalah pengelolaan kadar air dan fermentasi untuk umur simpan lebih panjang.`,
    },
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `${termurah ? `${termurah.nama} (Rp ${termurah.estimasiHarga!.toLocaleString('id-ID')}/kg)` : 'Ampas Kopi'} adalah bahan termurah di kategori ini. Banyak limbah industri pangan bisa diperoleh hampir gratis atau biaya minimal langsung dari pabrik tahu, bakeri lokal, pabrik mi, atau kebun kopi terdekat — menjadikannya peluang efisiensi biaya pakan yang signifikan.`,
    },
    {
      icon: '⚠️', color: '#c0392b', bg: '#fdecea',
      text: `Perhatian khusus tiga bahan: (1) Ampas Kecap — kadar garam ±5–8% BK, batasi ≤5% ransum dan sediakan air minum cukup. (2) Ampas Teh — tanin ±10–15% BK mengurangi kecernaan protein, kombinasikan dengan molases atau PEG untuk netralisasi. (3) Ampas Mi Instan — cuci bumbu/garam berlebih sebelum diberikan.`,
    },
    {
      icon: '🧪', color: '#00695c', bg: '#e0f2f1',
      text: `Ragi Roti Bekas (Spent Yeast, Saccharomyces cerevisiae) adalah bahan premium di kategori ini: protein sel tunggal ±40–50% BK, kaya vitamin B kompleks, dan β-glukan imunostimulan. Tersedia dari pabrik roti dan industri bir; sangat efektif sebagai suplemen protein dan imunomodulator alami dalam ransum unggas dan babi.`,
    },
  ];
}

function LimbahIndustriAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeLimbahIndustriInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Limbah Industri Pangan</span>
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

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function LimbahIndustriRingkasan() {
  const r = computeLimbahIndustriRingkasan();

  const cards = [
    {
      label: 'Total Referensi Limbah Industri Pangan',
      value: String(r.totalReferensi),
      icon: '🏭',
      bg: '#eceff1', color: '#546e7a',
    },
    {
      label: 'Harga Rata-rata',
      value: r.hargaRataRata !== null ? `Rp ${r.hargaRataRata.toLocaleString('id-ID')}` : '—',
      icon: '💰',
      bg: '#fff8e1', color: '#7b5e2a',
    },
    {
      label: 'Terakhir Diperbarui',
      value: r.terakhirUpdate,
      icon: '🕒',
      bg: '#e1f5fe', color: '#0277bd',
    },
    {
      label: 'Data Nutrisi Lengkap',
      value: `${r.dataLengkap} item`,
      icon: '✅',
      bg: '#e8f5ee', color: '#1b7a43',
    },
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
            fontSize: card.value.startsWith('Rp') || card.value.length > 8 ? 13 : 22,
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

// ─── Item Card ────────────────────────────────────────────────────────────────

function LimbahIndustriItemCard({ item, onDetail }: { item: LimbahIndustriItem; onDetail: () => void }) {
  const style = KATEGORI_ITEM_STYLE[item.kategoriItem];

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: style.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: name + badge + harga */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 3, lineHeight: 1.2,
            }}>
              {item.nama}
            </div>
            {item.namaLatin && (
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 5, fontStyle: 'italic' }}>
                {item.namaLatin}
              </div>
            )}
            {!item.namaLatin && item.namaLain && (
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 5, fontStyle: 'italic' }}>
                {item.namaLain.split(',')[0]}
              </div>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: style.color, background: style.bg,
              borderRadius: 20, padding: '2px 9px',
            }}>
              {item.kategoriItem}
            </span>
          </div>
          {item.estimasiHarga !== null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>EST. HARGA</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7b5e2a' }}>
                Rp {item.estimasiHarga.toLocaleString('id-ID')}<span style={{ fontSize: 9, fontWeight: 600 }}>/kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Description */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.deskripsi}
        </p>

        {/* Lihat Detail */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '2px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onDetail}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${style.color}`,
              background: 'transparent', color: style.color,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}
          >
            Lihat Detail →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: KategoriItem; count: number }) {
  const style = KATEGORI_ITEM_STYLE[label];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
        color: style.color, background: style.bg,
        borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
      }}>
        {label} · {count}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterPakanLimbahIndustriPangan() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getLimbahIndustriList();
  const filtered = query
    ? allItems.filter(item =>
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.namaLain.toLowerCase().includes(query.toLowerCase()) ||
        (item.namaLatin ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Group by kategoriItem in defined order
  const grouped = LIMBAH_INDUSTRI_KATEGORI_ORDER
    .map(kat => ({
      kat,
      items: filtered.filter(i => i.kategoriItem === kat),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: '#eceff1', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '1.5px solid #546e7a44',
          }}>
            🏭
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Kategori Induk · Master Pakan
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              Limbah Industri Pangan
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {allItems.length} referensi bahan baku limbah industri pangan
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <LimbahIndustriAiInsightCard />

        {/* Ringkasan */}
        <LimbahIndustriRingkasan />

      </div>

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
            placeholder="Cari nama bahan limbah industri pangan..."
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
          {filtered.length} dari {allItems.length} referensi
        </div>
      </div>

      {/* Grouped list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🏭</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Tidak Ada Hasil
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          grouped.map(({ kat, items }) => (
            <div key={kat} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel label={kat} count={items.length} />
              {items.map(item => (
                <LimbahIndustriItemCard
                  key={item.id}
                  item={item}
                  onDetail={() => navigate(`/stok-pakan/master/limbah-industri-pangan/${item.id}`)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
