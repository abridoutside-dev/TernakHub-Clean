import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLeguminosaList, computeLeguminosaRingkasan,
  KATEGORI_LEGUMINOSA_STYLE, LEGUMINOSA_KATEGORI_ALL,
  type LeguminosaItem, type KategoriLeguminosa,
} from '../data/leguminosaData';

// ─── AI Insight ────────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeLeguminosaInsights(): Insight[] {
  const items    = getLeguminosaList();
  const pohon    = items.filter(i => i.kategoriItem === 'Pohon & Perdu').length;
  const herba    = items.filter(i => i.kategoriItem === 'Herba & Cover Crop').length;
  const kacang   = items.filter(i => i.kategoriItem === 'Daun Kacang-kacangan').length;
  const priced   = items.filter(i => i.estimasiHarga !== null);
  const termurah = [...priced].sort((a, b) => a.estimasiHarga! - b.estimasiHarga!)[0];
  const termahal = [...priced].sort((a, b) => b.estimasiHarga! - a.estimasiHarga!)[0];

  return [
    {
      icon: '🍀', color: '#1b6b3a', bg: '#d4edda',
      text: `Leguminosa adalah sumber protein hijauan terbaik untuk ruminansia — kandungan protein kasar (PK) berkisar 12–29% BK, jauh di atas rumput (6–14% BK). Penambahan 20–30% leguminosa dalam ransum hijauan dapat meningkatkan pertambahan bobot badan 15–40%.`,
    },
    {
      icon: '⭐', color: '#1b6b3a', bg: '#d4edda',
      text: `${pohon} jenis Pohon & Perdu (Lamtoro, Indigofera, Kaliandra, Gamal, Turi, Daun Kelor, Daun Singkong) menghasilkan daun sepanjang tahun tanpa perlu lahan khusus — cocok untuk sistem zero-grazing dan bank hijauan perkarangan.`,
    },
    {
      icon: '🌱', color: '#2e7d32', bg: '#e8f5e9',
      text: `${herba} jenis Herba & Cover Crop (Alfalfa, Centro, Stylo, Kacang Tanah, Desmodium) unggul dalam sistem penggembalaan campuran bersama rumput — meningkatkan kesuburan tanah melalui fiksasi nitrogen biologis sekaligus menyediakan pakan berkualitas.`,
    },
    {
      icon: '🥬', color: '#388e3c', bg: '#f1f8e9',
      text: `${kacang} jenis Daun Kacang-kacangan (Kacang Panjang, Kacang Hijau, Kacang Tunggak) merupakan hasil samping pertanian yang bernilai tinggi — mudah didapat saat musim panen dengan protein 12–19% BK dan palatabilitas baik untuk kambing dan domba.`,
    },
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Rentang harga leguminosa sangat lebar: ${termurah ? `${termurah.nama} (Rp ${termurah.estimasiHarga!.toLocaleString('id-ID')}/kg)` : '—'} hingga ${termahal ? `${termahal.nama} (Rp ${termahal.estimasiHarga!.toLocaleString('id-ID')}/kg hay impor)` : '—'}. Leguminosa lokal seperti Gamal dan Centro dapat dibudidayakan sendiri hampir tanpa biaya.`,
    },
    {
      icon: '⚠️', color: '#c62828', bg: '#ffebee',
      text: `Catatan antinutrisi: Lamtoro mengandung mimosin (batas aman <30% ransum); Daun Singkong mengandung HCN (wajib dilayukan 24 jam atau dikukus sebelum diberikan); Kaliandra mengandung tanin terkondensasi (batasi <20% BK untuk sapi perah).`,
    },
  ];
}

function LeguminosaAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeLeguminosaInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid #2e7d32',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        background: '#2e7d32', padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Leguminosa</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#2e7d32',
          background: '#fff', borderRadius: 20, padding: '2px 8px',
        }}>BETA</span>
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
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', border: 'none', background: 'none',
          padding: '10px 14px 12px', fontSize: 12, fontWeight: 700,
          color: '#2e7d32', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan ─────────────────────────────────────────────────────────────────

function LeguminosaRingkasan() {
  const r = computeLeguminosaRingkasan();

  const cards = [
    {
      label: 'Total Referensi Leguminosa',
      value: String(r.totalReferensi),
      icon: '🍀',
      bg: '#e8f5e9',
      color: '#2e7d32',
    },
    {
      label: 'Harga Rata-rata',
      value: r.hargaRataRata !== null
        ? `Rp ${r.hargaRataRata.toLocaleString('id-ID')}`
        : '—',
      icon: '💰',
      bg: '#fff8e1',
      color: '#7b5e2a',
    },
    {
      label: 'Terakhir Diperbarui',
      value: r.terakhirUpdate,
      icon: '🕒',
      bg: '#e1f5fe',
      color: '#0277bd',
    },
    {
      label: 'Data Nutrisi Lengkap',
      value: r.dataLengkap > 0 ? `${r.dataLengkap} item` : 'Segera Hadir',
      icon: '✅',
      bg: '#e8f5ee',
      color: '#1b7a43',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            background: card.bg,
            border: '1.5px solid rgba(0,0,0,0.06)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>{card.icon}</span>
          <div
            style={{
              fontSize: card.value.startsWith('Rp') || card.value.length > 8 ? 13 : 22,
              fontWeight: 800,
              color: card.color,
              lineHeight: 1.1,
              marginTop: 2,
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: card.color,
              opacity: 0.78,
              lineHeight: 1.3,
            }}
          >
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({
  label,
  count,
}: {
  label: KategoriLeguminosa;
  count: number;
}) {
  const style = KATEGORI_LEGUMINOSA_STYLE[label];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: style.color,
          background: style.bg,
          borderRadius: 20,
          padding: '3px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        {label} · {count}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  );
}

// ─── Item Card ─────────────────────────────────────────────────────────────────

function LeguminosaItemCard({
  item,
  onDetail,
}: {
  item: LeguminosaItem;
  onDetail: () => void;
}) {
  const style = KATEGORI_LEGUMINOSA_STYLE[item.kategoriItem];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'stretch',
      overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: style.color, flexShrink: 0 }} />

      <div style={{
        flex: 1,
        padding: '13px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        minWidth: 0,
      }}>

        {/* Row 1: icon + name + kategori badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-sm)',
            background: style.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            🍀
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800,
              color: 'var(--color-text)',
              marginBottom: 3, lineHeight: 1.2,
            }}>
              {item.nama}
            </div>
            {item.namaLatin && (
              <div style={{
                fontSize: 10, color: 'var(--color-muted)',
                marginBottom: 5, fontStyle: 'italic',
              }}>
                {item.namaLatin}
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
                Rp {item.estimasiHarga.toLocaleString('id-ID')}
                <span style={{ fontSize: 9, fontWeight: 600 }}>/kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Deskripsi singkat */}
        <p style={{
          margin: 0, fontSize: 12,
          color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.deskripsiSingkat}
        </p>

        {/* Footer: badge + Lihat Detail */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43',
                background: '#e8f5ee', borderRadius: 20,
                padding: '2px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onDetail}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${style.color}`,
              background: 'transparent',
              color: style.color,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Lihat Detail →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MasterPakanLeguminosa() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getLeguminosaList();
  const filtered = query
    ? allItems.filter(
        item =>
          item.nama.toLowerCase().includes(query.toLowerCase()) ||
          (item.namaLain ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (item.namaLatin ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  // Group by kategoriItem preserving defined order
  const grouped = LEGUMINOSA_KATEGORI_ALL.map(kat => ({
    kat,
    items: filtered.filter(i => i.kategoriItem === kat),
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        padding: '16px 16px 0',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>

        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: '#e8f5e9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '1.5px solid #a5d6a744',
          }}>
            🍀
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--color-muted)',
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4,
            }}>
              Kategori Induk · Master Pakan
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: 'var(--color-text)', lineHeight: 1.1,
            }}>
              Leguminosa
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {allItems.length} referensi bahan baku leguminosa
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <LeguminosaAiInsightCard />

        {/* Ringkasan */}
        <LeguminosaRingkasan />

      </div>

      {/* Search */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama leguminosa..."
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
          {filtered.length} dari {allItems.length} referensi
        </div>
      </div>

      {/* Grouped list */}
      <div style={{
        padding: '10px 16px 0',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '60px 24px', gap: 14,
          }}>
            <span style={{ fontSize: 56 }}>🍀</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 6,
              }}>
                Tidak Ada Hasil
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          grouped.map(({ kat, items }) => (
            <div
              key={kat}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <SectionLabel label={kat} count={items.length} />
              {items.map(item => (
                <LeguminosaItemCard
                  key={item.id}
                  item={item}
                  onDetail={() =>
                    navigate(`/stok-pakan/master/leguminosa/${item.id}`)
                  }
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
