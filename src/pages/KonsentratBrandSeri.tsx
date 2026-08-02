// ─── Produk Komersial — Konsentrat — Seri / Varian Produk Brand ───────────────
// PK-003: Halaman daftar seri/varian produk milik suatu brand konsentrat.
// Dibuka dari PK-002 saat pengguna menekan "Lihat Produk" pada sebuah brand.
//
// Navigasi ke detail produk (PK-004) belum dibangun — tombol "Lihat Detail"
// menavigasi ke /stok-pakan/komersial/konsentrat/:brandSlug/:seriSlug
// yang akan diisi konten pada PK-004.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import {
  KONSENTRAT_MEREK_LIST,
  KONSENTRAT_MEREK_UUID,
  type KonsentratMerek,
} from '../data/konsentratMerekData';
import {
  getSeriByBrandId,
  getTerakhirDiperbaruiBrand,
  type KonsentratSeri,
  type StatusProduksi,
} from '../data/konsentratSeriData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBentukIcon(bentuk: string): string {
  const map: Record<string, string> = {
    Mash: '🌾', Pellet: '🔵', Crumble: '🟤', Cube: '🟫',
    Liquid: '💧', Powder: '⚗️',
  };
  return map[bentuk] ?? '📦';
}

function getStatusStyle(status: StatusProduksi) {
  if (status === 'Aktif') return { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' };
  return { color: '#c62828', bg: '#ffebee', label: '⏸ Tidak Diproduksi' };
}

// ─── AI Insight (dinamis dari data seri brand) ────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeBrandInsights(merek: KonsentratMerek, seriList: KonsentratSeri[]): Insight[] {
  const targets = [...new Set(seriList.map(s => s.targetTernak))];
  const bentukList = [...new Set(seriList.map(s => s.bentukProduk))];
  const aktif = seriList.filter(s => s.statusProduksi === 'Aktif').length;

  const insights: Insight[] = [
    {
      icon: '™️', color: merek.color, bg: merek.bg,
      text: `${merek.nama} adalah merek dari ${merek.produsen} (${merek.negaraAsal}). ${merek.deskripsi}`,
    },
  ];

  if (seriList.length > 1) {
    insights.push({
      icon: '📋', color: '#0277bd', bg: '#e1f5fe',
      text: `Tersedia ${seriList.length} seri produk (${aktif} aktif diproduksi). Setiap seri diformulasikan untuk fase dan target ternak yang berbeda — pilih seri sesuai fase produksi dan jenis ternak Anda.`,
    });
  }

  if (targets.length > 0) {
    insights.push({
      icon: '🐄', color: '#1b7a43', bg: '#e8f5ee',
      text: `Target ternak yang didukung: ${targets.join(' • ')}. Pastikan memilih seri yang sesuai jenis dan fase ternak Anda untuk hasil optimal.`,
    });
  }

  if (bentukList.length > 0) {
    const bentukDesc: Record<string, string> = {
      Mash: 'tepung/bubuk kasar', Pellet: 'butiran kompak',
      Crumble: 'butiran kasar', Cube: 'balok padat',
      Liquid: 'cairan', Powder: 'bubuk halus',
    };
    const desc = bentukList.map(b => `${b} (${bentukDesc[b] ?? b})`).join(', ');
    insights.push({
      icon: '📦', color: '#6a1b9a', bg: '#f3e5f5',
      text: `Bentuk produk tersedia: ${desc}. Pilih bentuk yang sesuai dengan preferensi ternak dan fasilitas pencampuran Anda.`,
    });
  }

  // Cek apakah ada seri dengan fase progression (Starter → Grower → Finisher)
  const hasProgression = seriList.some(s =>
    /starter|grower|finisher|awal|tengah|akhir|s18|s20|s22|s25/i.test(s.namaSeri + s.targetTernak)
  );
  if (hasProgression) {
    insights.push({
      icon: '📈', color: '#e65100', bg: '#fff3e0',
      text: 'Seri produk ini tersusun berurutan mengikuti fase produksi ternak. Ganti seri sesuai fase untuk memastikan kebutuhan nutrisi terpenuhi di setiap tahap — jangan gunakan satu seri untuk semua fase.',
    });
  }

  insights.push({
    icon: '⚠️', color: '#37474f', bg: '#eceff1',
    text: 'Konsentrat ini harus dicampur dengan hijauan (rumput, jerami, silase) sebelum diberikan. Jangan berikan konsentrat sendirian tanpa sumber serat kasar — dapat menyebabkan masalah rumen.',
  });

  return insights;
}

function BrandAiInsightCard({ merek, seriList }: { merek: KonsentratMerek; seriList: KonsentratSeri[] }) {
  const [expanded, setExpanded] = useState(false);
  const insights = computeBrandInsights(merek, seriList);
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: `1.5px solid ${merek.color}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: merek.color, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — {merek.nama}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: merek.color, background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
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
      {insights.length > 2 && (
        <button type="button" onClick={() => setExpanded(v => !v)} style={{
          width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
          fontSize: 12, fontWeight: 700, color: merek.color, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
          <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function BrandRingkasan({ merek, seriList, brandSlug }: { merek: KonsentratMerek; seriList: KonsentratSeri[]; brandSlug: string }) {
  const terakhir = getTerakhirDiperbaruiBrand(brandSlug);
  const cards = [
    { label: 'Total Seri Produk', value: String(seriList.length), icon: '📦', bg: merek.bg,   color: merek.color },
    { label: 'Produsen',          value: merek.produsen,          icon: '🏭', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Negara Asal',       value: merek.negaraAsal,        icon: '🌍', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Terakhir Diperbarui', value: terakhir,              icon: '🕒', bg: '#eceff1', color: '#37474f' },
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
            fontSize: card.value.length > 12 ? 11 : card.value.length > 6 ? 13 : 22,
            fontWeight: 800, color: card.color, lineHeight: 1.2, marginTop: 2,
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

// ─── Seri Card ────────────────────────────────────────────────────────────────

function SeriCard({ seri, merek, onLihatDetail }: {
  seri: KonsentratSeri;
  merek: KonsentratMerek;
  onLihatDetail: () => void;
}) {
  const status = getStatusStyle(seri.statusProduksi);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: merek.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: nama seri + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 2 }}>
              {seri.namaSeri}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.3 }}>
              {seri.namaProduk}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: status.color, background: status.bg,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {status.label}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Attributes grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          <AttrRow icon="🐄" label="Target Ternak"   value={seri.targetTernak} span />
          <AttrRow icon={getBentukIcon(seri.bentukProduk)} label="Bentuk Produk" value={seri.bentukProduk} />
          <AttrRow icon="⚖️"  label="Kemasan"         value={seri.beratKemasan} />
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Deskripsi */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {seri.deskripsi}
        </p>

        {/* Lihat Detail */}
        <button
          type="button"
          onClick={onLihatDetail}
          style={{
            alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${merek.color}`, background: 'transparent', color: merek.color,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

function AttrRow({ icon, label, value, span }: { icon: string; label: string; value: string; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function KonsentratBrandSeri() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // Lookup brand
  const merek = KONSENTRAT_MEREK_LIST.find(m => m.slug === brandSlug);
  const brandId = brandSlug ? KONSENTRAT_MEREK_UUID[brandSlug] : undefined;

  // Not found state
  if (!merek || !brandId || !brandSlug) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 56 }}>🌰</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Brand Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Slug brand tidak dikenali. Kembali ke halaman Konsentrat.
          </div>
        </div>
      </div>
    );
  }

  const allSeri = getSeriByBrandId(brandId);

  const filtered = debouncedQuery
    ? allSeri.filter(s =>
        s.namaSeri.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        s.namaProduk.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        s.targetTernak.toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : allSeri;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: merek.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${merek.color}44`,
          }}>
            {merek.logo}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Konsentrat · Seri Produk
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {merek.nama}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {allSeri.length} seri/varian produk tersedia
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <BrandAiInsightCard merek={merek} seriList={allSeri} />

        {/* Ringkasan */}
        <BrandRingkasan merek={merek} seriList={allSeri} brandSlug={brandSlug} />
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
            placeholder="Cari nama seri atau nama produk..."
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
          {filtered.length} dari {allSeri.length} seri produk
        </div>
      </div>

      {/* Seri list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>{merek.logo}</span>
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
          filtered.map(seri => (
            <SeriCard
              key={seri.slug}
              seri={seri}
              merek={merek}
              onLihatDetail={() => navigate(`/stok-pakan/komersial/konsentrat/${brandSlug}/${seri.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
