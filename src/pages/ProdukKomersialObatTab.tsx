// ─── Produk Komersial Obat ─────────────────────────────────────────────────────
// PKO-002: Halaman utama Produk Komersial Obat. Struktur identik dengan Produk
// Komersial Pakan: Header → Ringkasan → Mode (Brand/Produk) → Search & Filter →
// Daftar Data.
//
// Produk Komersial adalah database PRODUK DAGANG (bukan database referensi
// seperti Master Obat). CRUD via Admin (PKO-004), Import/Export (PKO-007),
// dan Detail Produk (PKO-006) sudah tersedia.
//
// Search dan Filter Status bekerja secara client-side: search mencocokkan
// nama brand/produk, filter mencocokkan status aktif/nonaktif pada kedua mode.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import {
  getObatBrandListLive,
  getObatProdukKomersialList,
  getTotalBrandObat,
  getTotalProdukObat,
  getTotalProdukAktifObat,
  getTotalProdukNonaktifObat,
  type ObatBrand,
  type ObatProdukKomersial,
} from '../services/drugCommercialProductService';

// ─── Ringkasan ────────────────────────────────────────────────────────────────

interface RingkasanData {
  totalBrand: number;
  totalProduk: number;
  totalAktif: number;
  totalNonaktif: number;
}

function RingkasanCards({ data }: { data: RingkasanData | null }) {
  const cards = [
    { label: 'Total Brand',       value: String(data?.totalBrand ?? '—'),          icon: '™️', bg: '#f3e5f5', color: '#6a1b9a' },
    { label: 'Total Produk',      value: String(data?.totalProduk ?? '—'),         icon: '📦', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Produk Aktif',      value: String(data?.totalAktif ?? '—'),          icon: '✅', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Produk Nonaktif',   value: String(data?.totalNonaktif ?? '—'),       icon: '⛔', bg: '#ffebee', color: '#c62828' },
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

// ─── Mode Selector ────────────────────────────────────────────────────────────

type Mode = 'brand' | 'produk';

function ModeSelector({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  const modes: { key: Mode; label: string }[] = [
    { key: 'brand',  label: 'Brand' },
    { key: 'produk', label: 'Produk' },
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

// ─── Filter Chips (filter status Aktif/Nonaktif — bekerja terhadap data) ─────

type FilterKey = 'semua' | 'aktif' | 'nonaktif';

function FilterChips({ value, onChange }: { value: FilterKey; onChange: (v: FilterKey) => void }) {
  const options: { key: FilterKey; label: string }[] = [
    { key: 'semua',    label: 'Semua' },
    { key: 'aktif',    label: 'Aktif' },
    { key: 'nonaktif', label: 'Nonaktif' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 20,
              background: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? '#fff' : 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'aktif' | 'nonaktif' }) {
  const cfg = status === 'aktif'
    ? { label: '🟢 Aktif', color: '#1b7a43', bg: '#e8f5ee' }
    : { label: '⛔ Nonaktif', color: '#c62828', bg: '#ffebee' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg,
      borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

function BrandCard({ brand, onClick }: { brand: ObatBrand; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden',
        cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%', font: 'inherit',
      }}
    >
      <div style={{ width: 4, background: brand.color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '13px 12px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {brand.logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.2 }}>
            {brand.nama}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: brand.color, background: brand.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {brand.jumlahProduk} produk
          </span>
        </div>
        <StatusBadge status={brand.status} />
        <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
      </div>
    </button>
  );
}

// ─── Produk Card ──────────────────────────────────────────────────────────────

function ProdukCard({ produk, onClick }: { produk: ObatProdukKomersial; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', overflow: 'hidden',
        cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%', font: 'inherit',
      }}
    >
      <div style={{ width: 4, background: 'var(--color-primary)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, padding: '13px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
              {produk.nama}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{produk.brandNama}</div>
          </div>
          <StatusBadge status={produk.status} />
          <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Bentuk Sediaan</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{produk.bentukSediaan}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Kemasan</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{produk.kemasan}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
      <span style={{ fontSize: 56 }}>🏷️</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Tidak Ada Data
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdukKomersialObatTab() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('brand');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [filter, setFilter] = useState<FilterKey>('semua');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [brandList, setBrandList] = useState<ObatBrand[]>([]);
  const [produkList, setProdukList] = useState<ObatProdukKomersial[]>([]);
  const [stats, setStats] = useState<RingkasanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const [brands, products, totalBrand, totalProduk, totalAktif, totalNonaktif] = await Promise.all([
          getObatBrandListLive(),
          getObatProdukKomersialList(),
          getTotalBrandObat(),
          getTotalProdukObat(),
          getTotalProdukAktifObat(),
          getTotalProdukNonaktifObat(),
        ]);
        if (cancelled) return;
        setBrandList(brands);
        setProdukList(products);
        setStats({ totalBrand, totalProduk, totalAktif, totalNonaktif });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const hasActiveFilter = normalizedQuery.length > 0 || filter !== 'semua';

  const filteredBrandList = brandList.filter((brand) => {
    if (filter !== 'semua' && brand.status !== filter) return false;
    if (normalizedQuery && !brand.nama.toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });

  const produkListBase = selectedBrand
    ? produkList.filter(p => p.brandId === selectedBrand)
    : produkList;
  const filteredProdukList = produkListBase.filter((produk) => {
    if (filter !== 'semua' && produk.status !== filter) return false;
    if (normalizedQuery && !(
      produk.nama.toLowerCase().includes(normalizedQuery) ||
      produk.brandNama.toLowerCase().includes(normalizedQuery)
    )) return false;
    return true;
  });

  function handleModeChange(next: Mode) {
    setMode(next);
    if (next === 'brand') setSelectedBrand(null);
  }

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
            Produk Komersial Obat
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
            Database produk obat berdasarkan merek dagang.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat/komersial/admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)',
            color: 'var(--color-primary)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ⚙️ Admin
        </button>
      </div>

      {/* ── Ringkasan ────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <RingkasanCards data={stats} />
      </div>

      {/* ── Mode Selector ────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <ModeSelector value={mode} onChange={handleModeChange} />
      </div>

      {/* ── Search & Filter ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
          />
          {query.length > 0 && (
            <button type="button" onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>
        <FilterChips value={filter} onChange={setFilter} />
      </div>

      {/* ── Daftar Data ──────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <EmptyState label="Memuat data..." />
        ) : error ? (
          <EmptyState label={`Error: ${error}`} />
        ) : mode === 'brand' ? (
          filteredBrandList.length === 0 ? (
            <EmptyState label={hasActiveFilter ? 'Tidak ada brand yang cocok dengan pencarian/filter.' : 'Belum ada brand yang terdaftar.'} />
          ) : (
            filteredBrandList.map((brand) => (
              <BrandCard
                key={brand.slug}
                brand={brand}
                onClick={() => { setSelectedBrand(brand.uuid); setMode('produk'); }}
              />
            ))
          )
        ) : (
          filteredProdukList.length === 0 ? (
            <EmptyState label={hasActiveFilter ? 'Tidak ada produk yang cocok dengan pencarian/filter.' : 'Belum ada produk yang terdaftar.'} />
          ) : (
            filteredProdukList.map((produk) => (
              <ProdukCard
                key={produk.slug}
                produk={produk}
                onClick={() => navigate(`/stok-obat/komersial/produk/${produk.slug}`)}
              />
            ))
          )
        )}
      </div>

    </div>
  );
}
