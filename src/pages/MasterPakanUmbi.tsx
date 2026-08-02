// ─── Master Pakan — Umbi-umbian ────────────────────────────────────────────────
// MP-014: Sub-category list page for Umbi-umbian (root/tuber feed ingredients).
// Raw material references only — excludes all Formula Pakan / processed products
// (Tepung Singkong, Gaplek Fermentasi, Silase Umbi, Umbi Fermentasi, Complete Feed,
// Konsentrat, TMR, Campuran Umbi, dll.).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUmbiDetailItems, computeUmbiRingkasan } from '../data/umbiDetailData';

// ─── Accent constants (from KATEGORI_INDUK for umbi-umbian) ──────────────────

const UMBI_COLOR = '#bf360c';
const UMBI_BG    = '#fbe9e7';

// ─── AI Insight ─────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeUmbiInsights(): Insight[] {
  const items = getAllUmbiDetailItems();
  const priced = items.filter(i => i.harga.estimasiAI !== null);
  const termurah = [...priced].sort((a, b) => (a.harga.estimasiAI ?? 0) - (b.harga.estimasiAI ?? 0))[0];
  const termahal = [...priced].sort((a, b) => (b.harga.estimasiAI ?? 0) - (a.harga.estimasiAI ?? 0))[0];
  const energiTinggi = items.filter(i => (i.nutrisi.tdn ?? 0) >= 75).length;

  return [
    {
      icon: '🍠', color: UMBI_COLOR, bg: UMBI_BG,
      text: `Umbi-umbian adalah sumber energi non-serat (karbohidrat mudah dicerna) yang dapat menggantikan sebagian jagung dalam ransum — cocok sebagai bahan baku murah saat harga biji-bijian tinggi.`,
    },
    {
      icon: '⚡', color: '#e65100', bg: '#fff3e0',
      text: `${energiTinggi} dari ${items.length} referensi memiliki TDN ≥75% BK — setara atau mendekati jagung sebagai sumber energi utama ransum penggemukan.`,
    },
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Rentang harga cukup lebar: ${termurah ? `${termurah.nama} (Rp ${termurah.harga.estimasiAI!.toLocaleString('id-ID')}/kg)` : '—'} hingga ${termahal ? `${termahal.nama} (Rp ${termahal.harga.estimasiAI!.toLocaleString('id-ID')}/kg)` : '—'} — sebagian besar tersedia murah dari petani lokal.`,
    },
    {
      icon: '⚠️', color: '#c62828', bg: '#ffebee',
      text: `Beberapa umbi (Singkong, Gadung, Uwi) mengandung HCN atau senyawa toksik alami dan wajib diolah (direbus/dijemur) sebelum diberikan agar aman untuk ternak.`,
    },
    {
      icon: '🔗', color: '#0277bd', bg: '#e1f5fe',
      text: `Karena protein umbi umumnya rendah, kombinasikan dengan sumber protein (leguminosa, bungkil) dan mineral premix agar ransum tetap seimbang.`,
    },
  ];
}

function UmbiAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeUmbiInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: `1.5px solid ${UMBI_COLOR}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        background: UMBI_COLOR, padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Umbi</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: UMBI_COLOR,
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
          color: UMBI_COLOR, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function UmbiRingkasan() {
  const r = computeUmbiRingkasan();

  const cards = [
    {
      label: 'Total Referensi Umbi',
      value: String(r.totalReferensi),
      icon: '🍠',
      bg: UMBI_BG,
      color: UMBI_COLOR,
    },
    {
      label: 'Harga Rata-rata',
      value: r.hargaRataRata !== null ? `Rp ${r.hargaRataRata.toLocaleString('id-ID')}` : '—',
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

function UmbiItemCard({
  item,
  onDetail,
}: {
  item: ReturnType<typeof getAllUmbiDetailItems>[number];
  onDetail: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: UMBI_COLOR, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: icon + name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
            background: UMBI_BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            🍠
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
              {item.nama}
            </div>
            {item.namaLatin && (
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                {item.namaLatin}
              </div>
            )}
          </div>
          {item.harga.estimasiAI != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>EST. HARGA</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7b5e2a' }}>
                Rp {item.harga.estimasiAI.toLocaleString('id-ID')}<span style={{ fontSize: 9, fontWeight: 600 }}>/kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Deskripsi singkat */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.deskripsi}
        </p>

        {/* Footer: badge + Lihat Detail */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#1b7a43',
            background: '#e8f5ee', borderRadius: 20,
            padding: '2px 8px', border: '1px solid #a5d6a7',
          }}>
            ✅ Data Lengkap
          </span>
          <button
            type="button"
            onClick={onDetail}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${UMBI_COLOR}`,
              background: 'transparent', color: UMBI_COLOR,
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterPakanUmbi() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getAllUmbiDetailItems();
  const filtered = query
    ? allItems.filter(item =>
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        (item.namaLatin ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        padding: '16px 16px 0',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: UMBI_BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${UMBI_COLOR}44`,
          }}>
            🍠
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4,
            }}>
              Kategori Induk · Master Pakan
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              Umbi
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {allItems.length} referensi bahan baku umbi
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <UmbiAiInsightCard />

        {/* Ringkasan */}
        <UmbiRingkasan />

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
            placeholder="Cari nama umbi..."
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

      {/* List */}
      <div style={{
        padding: '10px 16px 0',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🍠</span>
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
          filtered.map(item => (
            <UmbiItemCard
              key={item.id}
              item={item}
              onDetail={() => navigate(`/stok-pakan/master/umbi-umbian/${item.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
