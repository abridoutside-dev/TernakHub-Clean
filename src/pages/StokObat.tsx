import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MasterObatTab from './MasterObatTab';
import ProdukKomersialObatTab from './ProdukKomersialObatTab';
import MasterPenyakitTab from './MasterPenyakitTab';
import RiwayatObatTab from './RiwayatObatTab';
import {
  getActiveStokObatList,
  getStatusStok,
  type StokObatItem,
  type StatusStok,
} from '../data/stokObatData';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getStatusBadge(status: StatusStok) {
  if (status === 'Tersedia')     return { label: '🟢 Tersedia',     color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43' };
  if (status === 'Hampir Habis') return { label: '🟡 Hampir Habis', color: '#e65100', bg: '#fff3e0', accent: '#fb8c00' };
  if (status === 'Expired')      return { label: '⛔ Expired',      color: '#6a1b9a', bg: '#f3e5f5', accent: '#8e24aa' };
  return                              { label: '🔴 Habis',       color: '#c62828', bg: '#ffebee', accent: '#e53935' };
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── AI Insight Card ────────────────────────────────────────────────────────────

function computeInsights() {
  const activeItems = getActiveStokObatList();
  const habis   = activeItems.filter((m) => getStatusStok(m) === 'Habis');
  const expired = activeItems.filter((m) => getStatusStok(m) === 'Expired');

  const insights: { icon: string; color: string; bg: string; text: string }[] = [];

  if (habis.length > 0) {
    insights.push({
      icon: '🔴', color: '#c62828', bg: '#ffebee',
      text: `${habis.map((m) => m.namaProduk).join(', ')} habis — segera lakukan restock sebelum dibutuhkan.`,
    });
  }
  if (expired.length > 0) {
    insights.push({
      icon: '⏰', color: '#6a1b9a', bg: '#f3e5f5',
      text: `${expired.map((m) => m.namaProduk).join(', ')} sudah expired — perlu dimusnahkan sesuai SOP.`,
    });
  }
  insights.push({
    icon: '🛒', color: '#1b7a43', bg: '#e8f5ee',
    text: `Estimasi kebutuhan restock bulan ini: ${habis.length} jenis obat berdasarkan tren penggunaan.`,
  });

  return insights;
}

function AiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeInsights();
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Stok Obat</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>
          BETA
        </span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.5 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
          fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan ──────────────────────────────────────────────────────────────────

function RingkasanCards() {
  const activeItems = getActiveStokObatList();
  const totalJenis  = activeItems.length;
  const totalStok   = activeItems.reduce((sum, m) => sum + m.jumlah, 0);
  // "Tersedia" di Ringkasan mencakup Tersedia + Hampir Habis (masih ada fisiknya);
  // "Habis" mencakup Habis + Expired (tidak bisa dipakai) — selaras dengan
  // pengelompokan dua-seksi pada daftar di bawah (SO-005.2).
  const tersediaCount = activeItems.filter((m) => {
    const s = getStatusStok(m);
    return s === 'Tersedia' || s === 'Hampir Habis';
  }).length;
  const habisCount = activeItems.filter((m) => {
    const s = getStatusStok(m);
    return s === 'Habis' || s === 'Expired';
  }).length;

  const cards = [
    { label: 'Total Jenis Obat', value: String(totalJenis),    icon: '💊', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Total Stok',       value: String(totalStok),     icon: '📦', bg: '#fff8e1', color: '#7b5e2a' },
    { label: 'Stok Tersedia',    value: String(tersediaCount), icon: '✅', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Stok Habis',       value: String(habisCount),    icon: '🔴', bg: '#ffebee', color: '#c62828' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 20 }}>{card.icon}</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2 }}>
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

// ─── Mode Selector ──────────────────────────────────────────────────────────────

type Mode = 'master' | 'komersial' | 'stok' | 'penyakit' | 'riwayat';

function ModeSelector({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  const modes: { key: Mode; label: string }[] = [
    { key: 'master',    label: 'Master Obat' },
    { key: 'komersial', label: 'Produk Komersial' },
    { key: 'stok',      label: 'Stok' },
    { key: 'penyakit',  label: 'Penyakit' },
    { key: 'riwayat',   label: 'Riwayat' },
  ];
  return (
    <div style={{
      display: 'flex', background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
      padding: 4, gap: 4,
    }}>
      {modes.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            style={{
              flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700,
              border: 'none', borderRadius: 'calc(var(--radius-md) - 4px)',
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--color-muted)',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Filter Sederhana (Stok) ────────────────────────────────────────────────────
// SO-005.3 memperkenalkan 4 status (Tersedia/Hampir Habis/Habis/Expired) —
// filter mengikuti persis status yang sama, plus "Semua". Belum perlu filter
// lanjutan (kategori/bentuk/satuan) pada tahap ini.

type StokFilterKey = 'Semua' | StatusStok;

const STOK_FILTER_TABS: { key: StokFilterKey; label: string }[] = [
  { key: 'Semua',        label: 'Semua' },
  { key: 'Tersedia',     label: 'Tersedia' },
  { key: 'Hampir Habis', label: 'Hampir Habis' },
  { key: 'Habis',        label: 'Habis' },
  { key: 'Expired',      label: 'Kedaluwarsa' },
];

// ─── Section Label ──────────────────────────────────────────────────────────────

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {title}
      </h2>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
        {count} jenis
      </span>
    </div>
  );
}

// ─── Medicine Card ────────────────────────────────────────────────────────────
// Menampilkan: Nama Produk, Brand, Bentuk Sediaan, Kemasan, Jumlah Stok, Satuan,
// Lokasi Penyimpanan (jika tersedia), Status. Halaman Stok sendiri tidak punya
// tombol tambah/ubah/hapus (lihat komentar filosofi di stokObatData.ts) — namun
// mengklik kartu ini membuka Penyesuaian Stok (SO-005.4), satu-satunya transaksi
// yang boleh dilakukan langsung dari halaman ini.

function MedicineCard({ item }: { item: StokObatItem }) {
  const navigate = useNavigate();
  const status = getStatusStok(item);
  const badge = getStatusBadge(status);

  return (
    <button
      type="button"
      onClick={() => navigate(`/stok-obat/stok/${item.uuid}/penyesuaian`)}
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        width: '100%', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit',
      }}
    >
      <div style={{ width: 4, background: badge.accent, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            💊
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 5,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.namaProduk}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)' }}>
              🏷️ {item.brand}
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', color: badge.color, background: badge.bg, borderRadius: 20, padding: '3px 8px', flexShrink: 0 }}>
            {badge.label}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Jumlah Stok</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {item.jumlah.toLocaleString('id-ID')}
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3 }}>{item.satuan}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Bentuk Sediaan</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
              {item.bentukSediaan}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>
            📦 {item.kemasan}
          </span>
          {item.lokasiPenyimpanan && (
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>
              📍 {item.lokasiPenyimpanan}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            📅 Masuk {formatTanggal(item.tanggalMasuk)}
          </span>
          {item.tanggalExpired && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: status === 'Expired' ? '#6a1b9a' : 'var(--color-muted)',
            }}>
              ⏳ Kadaluarsa {formatTanggal(item.tanggalExpired)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function StokObat() {
  const [mode, setMode] = useState<Mode>('master');

  // Stock mode state
  const [stockQuery, setStockQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StokFilterKey>('Semua');

  // ── Stock mode data ──────────────────────────────────────────────────────────
  // Always call getActiveStokObatList() fresh each render so archived items are
  // excluded immediately and newly-added items (after TambahStokObat) appear on
  // navigation-back without needing a tick counter.
  const filteredItems = getActiveStokObatList().filter((item) => {
    const q = stockQuery.toLowerCase();
    const matchSearch = !q ||
      item.namaProduk.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q);
    const status = getStatusStok(item);
    const matchFilter = stockFilter === 'Semua' || stockFilter === status;
    return matchSearch && matchFilter;
  });
  // Dua seksi tampilan (SO-005.2) tetap dipertahankan: "Tersedia" mencakup
  // status Tersedia + Hampir Habis (masih ada fisiknya), "Habis" mencakup
  // Habis + Expired (tidak bisa dipakai). Badge per-kartu tetap menampilkan
  // status granular yang sebenarnya.
  const tersedia = filteredItems.filter((item) => {
    const s = getStatusStok(item);
    return s === 'Tersedia' || s === 'Hampir Habis';
  });
  const habis = filteredItems.filter((item) => {
    const s = getStatusStok(item);
    return s === 'Habis' || s === 'Expired';
  });

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── AI Insight + Ringkasan (above Mode Selector) ───────────────────── */}
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AiInsightCard />
        <RingkasanCards />
      </div>

      {/* ── Mode Selector ───────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* ── Master Obat Mode ────────────────────────────────────────────────── */}
      {mode === 'master' && <MasterObatTab />}

      {/* ── Produk Komersial Mode ───────────────────────────────────────────── */}
      {mode === 'komersial' && <ProdukKomersialObatTab />}

      {/* ── Penyakit Mode ───────────────────────────────────────────────────── */}
      {mode === 'penyakit' && <MasterPenyakitTab />}

      {/* ── Stok Mode ────────────────────────────────────────────────────────── */}
      {/* Halaman ini HANYA membaca data stok. Sesuai filosofi Stok Obat (lihat
          komentar di atas file), tab ini TIDAK BOLEH memiliki tombol "Tambah
          Stok", "Tambah Obat", "Tambah Produk", atau Floating Action Button —
          penambahan stok hanya lewat Dashboard → Tambah Stok Obat atau
          Marketplace → Barang Diterima. Jangan tambahkan tombol tersebut di sini. */}
      {mode === 'stok' && (
        <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama produk atau brand..."
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
            />
            {stockQuery.length > 0 && (
              <button type="button" onClick={() => setStockQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* Filter: Semua / Tersedia / Hampir Habis / Habis / Expired */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {STOK_FILTER_TABS.map((tab) => {
              const active = stockFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStockFilter(tab.key)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-muted)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Section 1: Stock Tersedia */}
          {tersedia.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel title="Stok Tersedia" count={tersedia.length} />
              {tersedia.map((item) => <MedicineCard key={item.uuid} item={item} />)}
            </div>
          )}

          {/* Section 2: Stock Habis */}
          {habis.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel title="Stok Habis" count={habis.length} />
              {habis.map((item) => <MedicineCard key={item.uuid} item={item} />)}
            </div>
          )}

          {/* Empty state */}
          {tersedia.length === 0 && habis.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '60px 24px' }}>
              <span style={{ fontSize: 64 }}>💊</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                  Tidak ada hasil.
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  Coba ubah kata kunci pencarian atau hapus filter.
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Riwayat Mode ─────────────────────────────────────────────────────── */}
      {mode === 'riwayat' && <RiwayatObatTab />}
    </div>
  );
}
