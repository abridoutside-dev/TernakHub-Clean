// ─── Produk Komersial — Konsentrat ────────────────────────────────────────────
// PK-002: Halaman sub kategori "Konsentrat". Menampilkan daftar MEREK/PRODUSEN
// konsentrat komersial (bukan daftar produk langsung). Pengguna memilih merek
// dulu, baru pada PK-003 akan masuk ke daftar seri produk milik merek tersebut.
//
// Bukan Master Pakan, bukan Formula Pakan — ini murni referensi Produk
// Komersial. Tombol "Lihat Produk" menavigasi ke
// /stok-pakan/komersial/konsentrat/:brandSlug (diisi konten pada PK-003).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KONSENTRAT_MEREK_LIST, type KonsentratMerek,
  getTotalMerekKonsentrat, getTotalProdukKonsentrat,
  getTotalProdusenKonsentrat, getTerakhirDiperbaruiKonsentrat,
} from '../data/konsentratMerekData';

const KONSENTRAT_COLOR = '#7b5e2a';
const KONSENTRAT_BG    = '#fff8e1';

// ─── AI Insight ────────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeKonsentratInsights(): Insight[] {
  return [
    {
      icon: '🌰', color: KONSENTRAT_COLOR, bg: KONSENTRAT_BG,
      text: 'Konsentrat adalah pakan penguat berenergi/protein tinggi produksi pabrikan yang dicampur dengan hijauan (rumput, jerami) untuk melengkapi ransum harian ternak — bukan pakan lengkap yang bisa diberikan sendirian.',
    },
    {
      icon: '🔍', color: '#0277bd', bg: '#e1f5fe',
      text: 'Perbedaan dengan Complete Feed: Konsentrat WAJIB dicampur hijauan karena kadar serat kasarnya rendah, sedangkan Complete Feed sudah memenuhi seluruh kebutuhan nutrisi harian tanpa perlu tambahan hijauan.',
    },
    {
      icon: '📋', color: '#1b7a43', bg: '#e8f5ee',
      text: 'Cara penggunaan: dicampur dengan hijauan pada rasio tertentu (umumnya 30–60% dari total ransum, tergantung fase produksi dan jenis ternak), diberikan 2 kali sehari mengikuti jadwal pemberian pakan.',
    },
    {
      icon: '✅', color: '#6a1b9a', bg: '#f3e5f5',
      text: 'Kelebihan: kandungan nutrisi terstandarisasi produsen, praktis tanpa perlu meracik sendiri, dan kualitas konsisten antar kemasan/batch produksi.',
    },
    {
      icon: '⚠️', color: '#c62828', bg: '#ffebee',
      text: 'Kekurangan: harga per kg umumnya lebih mahal dibanding meracik sendiri dari Master Pakan, dan formulasi tetap (tidak bisa disesuaikan bahan per peternak) kecuali membeli varian lain.',
    },
    {
      icon: '🔗', color: '#00695c', bg: '#e0f2f1',
      text: 'Cocok dipadukan dengan hijauan segar (rumput, leguminosa), silase, atau hay sebagai sumber serat kasar utama — konsentrat mengisi kekurangan energi/protein yang tidak dipenuhi hijauan.',
    },
    {
      icon: '🐄', color: '#37474f', bg: '#eceff1',
      text: 'Jenis ternak yang sesuai: umumnya diformulasikan khusus per jenis — sapi perah (laktasi), sapi potong (penggemukan), kambing/domba, hingga unggas, sehingga pemilihan seri produk harus disesuaikan target ternak.',
    },
  ];
}

function KonsentratAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeKonsentratInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: `1.5px solid ${KONSENTRAT_COLOR}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: KONSENTRAT_COLOR, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Konsentrat</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: KONSENTRAT_COLOR, background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
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
        fontSize: 12, fontWeight: 700, color: KONSENTRAT_COLOR, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function KonsentratRingkasan() {
  const cards = [
    { label: 'Total Merek',         value: String(getTotalMerekKonsentrat()),        icon: '™️', bg: '#f3e5f5', color: '#6a1b9a' },
    { label: 'Total Produk',        value: String(getTotalProdukKonsentrat()),       icon: '📦', bg: KONSENTRAT_BG, color: KONSENTRAT_COLOR },
    { label: 'Total Produsen',      value: String(getTotalProdusenKonsentrat()),     icon: '🏭', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Terakhir Diperbarui', value: getTerakhirDiperbaruiKonsentrat(),         icon: '🕒', bg: '#eceff1', color: '#37474f' },
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
          <div style={{ fontSize: card.value.length > 8 ? 13 : 22, fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2 }}>
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

// ─── Brand Card ────────────────────────────────────────────────────────────────

function MerekCard({ merek, onLihatProduk }: { merek: KonsentratMerek; onLihatProduk: () => void }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      <div style={{ width: 4, background: merek.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: logo + nama merek + produsen */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: merek.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {merek.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
              {merek.nama}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>
              {merek.produsen}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              🌍 {merek.negaraAsal}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: merek.color, background: merek.bg,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {merek.jumlahSeri} seri
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {merek.deskripsi}
        </p>

        <button
          type="button"
          onClick={onLihatProduk}
          style={{
            alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${merek.color}`, background: 'transparent', color: merek.color,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Lihat Produk →
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProdukKomersialKonsentrat() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = query
    ? KONSENTRAT_MEREK_LIST.filter(m =>
        m.nama.toLowerCase().includes(query.toLowerCase()) ||
        m.produsen.toLowerCase().includes(query.toLowerCase()),
      )
    : KONSENTRAT_MEREK_LIST;

  function handleLihatProduk(slug: string) {
    navigate(`/stok-pakan/komersial/konsentrat/${slug}`);
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: KONSENTRAT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${KONSENTRAT_COLOR}44`,
          }}>
            🌰
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Kategori · Produk Komersial
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              Konsentrat
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {KONSENTRAT_MEREK_LIST.length} merek/produsen konsentrat komersial
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <KonsentratAiInsightCard />

        {/* Ringkasan */}
        <KonsentratRingkasan />
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
            placeholder="Cari nama merek atau produsen..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {KONSENTRAT_MEREK_LIST.length} merek/produsen
        </div>
      </div>

      {/* Brand list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🌰</span>
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
          filtered.map(m => (
            <MerekCard
              key={m.slug}
              merek={m}
              onLihatProduk={() => handleLihatProduk(m.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
}
