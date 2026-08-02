import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KATEGORI_PRODUK_KOMERSIAL, type KategoriProdukKomersial,
  getKategoriProdukCount, getTotalReferensiProduk, getJumlahMerek,
  getJumlahProdusen, getTerakhirDiperbarui,
} from '../data/produkKomersialData';

// ─── AI Insight (Produk Komersial) ────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeProdukKomersialInsights(): Insight[] {
  const totalKategori = KATEGORI_PRODUK_KOMERSIAL.length;

  const insights: Insight[] = [
    {
      icon: '🏷️', color: '#1b7a43', bg: '#e8f5ee',
      text: `Produk Komersial adalah database referensi produk pakan JADI dari perusahaan, koperasi, UMKM, atau produsen pakan — mencakup ${totalKategori} kategori seperti konsentrat, premix, mineral mix, hingga feed additive.`,
    },
    {
      icon: '🔍', color: '#0277bd', bg: '#e1f5fe',
      text: 'Perbedaan: Master Pakan berisi bahan mentah/referensi nutrisi, Formula berisi ransum yang diracik sendiri dari bahan Master Pakan, sedangkan Produk Komersial berisi produk jadi yang dibeli langsung dari produsen.',
    },
    {
      icon: '⏱️', color: '#e65100', bg: '#fff3e0',
      text: 'Gunakan Produk Komersial saat butuh pakan siap pakai dengan cepat, tidak memiliki fasilitas pencampuran sendiri, atau ingin kualitas dan kandungan nutrisi yang sudah terstandarisasi produsen.',
    },
    {
      icon: '✅', color: '#6a1b9a', bg: '#f3e5f5',
      text: 'Kelebihan dibanding meracik sendiri: praktis, konsisten mutu antar batch, tidak perlu alat pencampur, dan cocok untuk peternak skala kecil yang belum punya akses ke seluruh bahan Master Pakan.',
    },
  ];

  return insights;
}

export function ProdukKomersialAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeProdukKomersialInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Produk Komersial</span>
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

export function ProdukKomersialRingkasanCards() {
  const cards = [
    { label: 'Total Referensi Produk', value: String(getTotalReferensiProduk()),        icon: '📦', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Total Kategori',         value: String(KATEGORI_PRODUK_KOMERSIAL.length), icon: '🏷️', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Jumlah Merek',           value: String(getJumlahMerek()),                 icon: '™️', bg: '#f3e5f5', color: '#6a1b9a' },
    { label: 'Jumlah Produsen',        value: String(getJumlahProdusen()),              icon: '🏭', bg: '#fff8e1', color: '#7b5e2a' },
    { label: 'Terakhir Diperbarui',    value: getTerakhirDiperbarui(),                  icon: '🕒', bg: '#eceff1', color: '#37474f' },
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

function KategoriCard({ kategori, onLihat }: { kategori: KategoriProdukKomersial; onLihat: () => void }) {
  const jumlahProduk = getKategoriProdukCount(kategori.slug);
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
              {jumlahProduk} produk
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

        {/* Lihat */}
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
          Lihat →
        </button>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
// PK-001: Halaman utama Produk Komersial saja. Halaman Sub Kategori Produk
// Komersial (dibuka lewat tombol "Lihat") BELUM dikerjakan pada fase ini —
// tombol "Lihat" sengaja tidak melakukan navigasi, hanya menampilkan notifikasi
// sementara, agar tidak menambah routing baru di luar scope PK-001.
//
// PK-002: Kategori "Konsentrat" SEKARANG memiliki halaman sub kategori sendiri
// (/stok-pakan/komersial/konsentrat) — tombol "Lihat" pada kategori ini
// menavigasi ke halaman tersebut. Kategori lain TIDAK diubah, tetap
// menampilkan notifikasi sementara seperti sebelumnya.

export default function ProdukKomersialTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = KATEGORI_PRODUK_KOMERSIAL.filter(k =>
    k.nama.toLowerCase().includes(query.toLowerCase()) ||
    k.deskripsi.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Search — by Nama Produk, Nama Merek, Nama Produsen (via kategori for now) */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari produk, merek, atau produsen..."
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

      {/* Result count + Kelola Database (Admin) */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {KATEGORI_PRODUK_KOMERSIAL.length} kategori
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/dashboard')}
            style={{
              border: '1.5px solid var(--color-primary)', background: 'var(--color-primary)',
              color: '#fff', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📊 Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/kelola')}
            style={{
              border: '1.5px solid var(--color-primary)', background: 'transparent',
              color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🛠️ Kelola Database
          </button>
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/knowledge-base')}
            style={{
              border: '1.5px solid #0277bd', background: 'transparent',
              color: '#0277bd', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📚 Knowledge Base
          </button>
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/ai-readiness')}
            style={{
              border: '1.5px solid #6a1b9a', background: 'transparent',
              color: '#6a1b9a', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🤖 AI Readiness
          </button>
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/referensi')}
            style={{
              border: '1.5px solid #7b5e2a', background: 'transparent',
              color: '#7b5e2a', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📋 Referensi
          </button>
        </div>
      </div>

      {/* Notice (Lihat not yet implemented) */}
      {notice && (
        <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff8e1', border: '1.5px solid #f9a825', borderRadius: 'var(--radius-sm)',
            padding: '10px 12px', fontSize: 12, color: '#7b5e2a', fontWeight: 600,
          }}>
            <span>ℹ️</span>
            <span style={{ flex: 1 }}>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} style={{ border: 'none', background: 'none', color: '#7b5e2a', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🏷️</span>
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
              onLihat={() => {
                if (k.slug === 'konsentrat') {
                  navigate('/stok-pakan/komersial/konsentrat');
                } else {
                  setNotice(`Halaman sub kategori "${k.nama}" belum tersedia — akan hadir pada tahap berikutnya.`);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
