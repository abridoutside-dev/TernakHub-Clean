// ─── Marketplace — Wishlist (MPK-015) ────────────────────────────────────────
// Menampilkan Listing yang disimpan pengguna. Bukan keranjang belanja —
// tidak ada transaksi otomatis, tidak ada pengurangan stok.
//
// Layout: Header → Ringkasan → Search → Filter → Sort → Daftar Wishlist.
// Data: getWishlistByWorkspace() → join getListingByUuid() (read-only).
// Mutasi satu-satunya: removeFromWishlist() (hapus dari wishlist).

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { usePaginatedList } from '../utils/usePaginatedList';
import { getActiveWorkspace } from '../components/TopAppBar';
import { useMarketplace } from '../hooks/useMarketplace';
import {
  getWishlistByWorkspace,
  removeFromWishlist,
  type WishlistItem,
} from '../data/marketplaceWishlistData';
import {
  getListingByUuid,
  type ListingItem,
  type ListingStatus,
} from '../data/marketplaceListingData';
import { getVerifikasiBadge } from '../data/marketplaceWorkspaceVerifikasiData';
import { getKategoriMarketplaceBySlug } from '../data/marketplaceKategoriData';

// ─── Tipe gabungan (wishlist record + listing live) ───────────────────────────

interface WishlistRow {
  wish: WishlistItem;
  listing: ListingItem;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ListingStatus, { bg: string; color: string; label: string }> = {
  Draft:      { bg: '#f5f5f5', color: '#616161', label: 'Draft' },
  Aktif:      { bg: '#e8f5ee', color: '#1b7a43', label: 'Aktif' },
  Ditahan:    { bg: '#fff8e1', color: '#7b5e2a', label: 'Ditahan' },
  Terjual:    { bg: '#e3f2fd', color: '#1565c0', label: 'Terjual' },
  Ditutup:    { bg: '#ffebee', color: '#c62828', label: 'Ditutup' },
  Diarsipkan: { bg: '#efebe9', color: '#5d4037', label: 'Diarsipkan' },
};

type FilterSlug = 'semua' | 'ternak' | 'pakan' | 'obat-kesehatan' | 'transportasi'
  | 'dokter-hewan' | 'klinik-hewan' | 'peralatan' | 'bibit-hijauan' | 'jasa-peternakan'
  | 'lainnya';

const FILTER_CHIPS: { slug: FilterSlug; label: string; icon: string }[] = [
  { slug: 'semua',           label: 'Semua',           icon: '🏪' },
  { slug: 'ternak',          label: 'Ternak',          icon: '🐑' },
  { slug: 'pakan',           label: 'Pakan',           icon: '🌾' },
  { slug: 'obat-kesehatan',  label: 'Obat',            icon: '💊' },
  { slug: 'transportasi',    label: 'Transport',       icon: '🚚' },
  { slug: 'dokter-hewan',    label: 'Dokter Hewan',    icon: '👨‍⚕️' },
  { slug: 'klinik-hewan',    label: 'Klinik Hewan',   icon: '🏥' },
  { slug: 'peralatan',       label: 'Peralatan',       icon: '🧰' },
  { slug: 'bibit-hijauan',   label: 'Bibit & Hijauan', icon: '🌱' },
  { slug: 'jasa-peternakan', label: 'Jasa Peternakan', icon: '🧑‍🌾' },
  { slug: 'lainnya',         label: 'Lainnya',         icon: '📦' },
];

type SortMode = 'terbaru' | 'terlama' | 'harga-terendah' | 'harga-tertinggi' | 'terdekat';

const SORT_OPTIONS: { mode: SortMode; label: string; active: boolean }[] = [
  { mode: 'terbaru',        label: 'Terbaru Ditambahkan', active: true },
  { mode: 'terlama',        label: 'Terlama',             active: true },
  { mode: 'harga-terendah', label: 'Harga Terendah',      active: true },
  { mode: 'harga-tertinggi', label: 'Harga Tertinggi',    active: true },
  { mode: 'terdekat',       label: 'Terdekat',            active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHarga(harga: number, satuan: string): string {
  return `Rp ${harga.toLocaleString('id-ID')} / ${satuan}`;
}

function formatAddedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function applySort(rows: WishlistRow[], mode: SortMode): WishlistRow[] {
  const r = rows.slice();
  switch (mode) {
    case 'terbaru':        return r.sort((a, b) => b.wish.addedAt.localeCompare(a.wish.addedAt));
    case 'terlama':        return r.sort((a, b) => a.wish.addedAt.localeCompare(b.wish.addedAt));
    case 'harga-terendah': return r.sort((a, b) => a.listing.harga - b.listing.harga);
    case 'harga-tertinggi': return r.sort((a, b) => b.listing.harga - a.listing.harga);
    case 'terdekat':       return r; // lokasi pengguna belum tersedia
    default:               return r;
  }
}

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 44 }}>🔖</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '12px 0 6px' }}>
        Wishlist masih kosong
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 20 }}>
        Simpan listing yang menarik dari Marketplace untuk dilihat nanti.
      </div>
      <button
        type="button"
        onClick={onBrowse}
        style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Jelajahi Marketplace
      </button>
    </div>
  );
}

function EmptySearch() {
  return (
    <div style={{ padding: '36px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 36 }}>🔎</span>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '10px 0 4px' }}>
        Tidak ada hasil
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        Coba kata kunci atau filter lain.
      </div>
    </div>
  );
}

interface WishlistCardProps {
  row: WishlistRow;
  onLihat: () => void;
  onHapus: () => void;
  onNegosiasi: () => void;
}

function WishlistCard({ row, onLihat, onHapus, onNegosiasi }: WishlistCardProps) {
  const { listing } = row;
  const [menuOpen, setMenuOpen] = useState(false);
  const kategori = getKategoriMarketplaceBySlug(listing.kategoriSlug);
  const verifikasi = getVerifikasiBadge(listing.workspaceId);
  const statusBadge = STATUS_BADGE[listing.status] ?? STATUS_BADGE['Ditutup'];
  const isClosed = listing.status === 'Terjual' || listing.status === 'Ditutup' || listing.status === 'Diarsipkan';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1.5px solid ${isClosed ? '#e0e0e0' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 10,
      opacity: isClosed ? 0.82 : 1,
      position: 'relative',
    }}>
      {/* Thumbnail + Info */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Thumbnail */}
        <div style={{
          width: 88, flexShrink: 0,
          background: kategori?.bg ?? '#f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, minHeight: 88,
        }}>
          {listing.media.thumbnail}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '10px 12px 8px', minWidth: 0 }}>
          {/* Status baris atas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            {/* Kategori badge */}
            {kategori && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 20, background: kategori.bg, color: kategori.color,
              }}>
                {kategori.icon} {kategori.nama}
              </span>
            )}
            {/* Status listing */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 20, background: statusBadge.bg, color: statusBadge.color,
            }}>
              {statusBadge.label}
            </span>
          </div>

          {/* Judul */}
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            marginBottom: 3, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.judul}
          </div>

          {/* Harga */}
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>
            {formatHarga(listing.harga, listing.satuanHarga)}
          </div>

          {/* Lokasi */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
            📍 {listing.lokasi}
          </div>

          {/* Workspace + Verifikasi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text)', fontWeight: 600 }}>
              🏪 {listing.workspaceNama}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px',
              borderRadius: 20, background: verifikasi.bg, color: verifikasi.color,
            }}>
              {verifikasi.icon} {verifikasi.label}
            </span>
          </div>

          {/* Ditambahkan */}
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 4 }}>
            Ditambahkan {formatAddedAt(row.wish.addedAt)}
          </div>
        </div>

        {/* Menu ⋮ */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              background: 'none', border: 'none', padding: '10px 12px',
              fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer',
            }}
            aria-label="Menu aksi"
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 200 }}
                onClick={() => setMenuOpen(false)}
              />
              <div style={{
                position: 'absolute', right: 4, top: 36,
                background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 210, minWidth: 172, overflow: 'hidden',
              }}>
                {[
                  { icon: '🔍', label: 'Lihat Detail', action: () => { setMenuOpen(false); onLihat(); } },
                  { icon: '🤝', label: 'Mulai Negosiasi', action: () => { setMenuOpen(false); onNegosiasi(); } },
                  { icon: '📤', label: 'Bagikan', action: () => setMenuOpen(false) },
                  { icon: '🗑️', label: 'Hapus dari Wishlist', action: () => { setMenuOpen(false); onHapus(); }, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '11px 14px', background: 'none', border: 'none',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      color: item.danger ? '#c62828' : 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Aksi bawah */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px 10px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <button
          type="button"
          onClick={onLihat}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          🔍 Lihat Detail
        </button>
        <button
          type="button"
          onClick={onNegosiasi}
          disabled={isClosed}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: isClosed ? 'var(--color-muted)' : 'var(--color-text)',
            border: '1.5px solid var(--color-border)',
            fontSize: 12, fontWeight: 700, cursor: isClosed ? 'not-allowed' : 'pointer',
          }}
        >
          🤝 Negosiasi
        </button>
        <button
          type="button"
          onClick={onHapus}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: '#c62828',
            border: '1.5px solid #ffcdd2',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
          aria-label="Hapus dari wishlist"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceWishlist() {
  useMarketplace(); // FLOW-003M27: hydrate listings from Supabase on mount
  const navigate = useNavigate();
  const activeWs = getActiveWorkspace();

  const [tick, setTick] = useState(0);
  const [inputSearch, setInputSearch] = useState('');
  const search = useDebounce(inputSearch, 300);
  const [filter, setFilter] = useState<FilterSlug>('semua');
  const [sort, setSort] = useState<SortMode>('terbaru');

  // Ambil wishlist + join listing (live setiap render + tick)
  const allRows: WishlistRow[] = useMemo(() => {
    const wishes = getWishlistByWorkspace(activeWs.id);
    return wishes.flatMap((w) => {
      const listing = getListingByUuid(w.listingUuid);
      if (!listing) return [];
      return [{ wish: w, listing }];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs.id, tick]);

  // Ringkasan (dari seluruh wishlist, sebelum filter/search)
  const ringkasan = useMemo(() => ({
    total: allRows.length,
    aktif: allRows.filter(r => r.listing.status === 'Aktif').length,
    terjual: allRows.filter(r => r.listing.status === 'Terjual').length,
    ditutup: allRows.filter(r => r.listing.status === 'Ditutup' || r.listing.status === 'Diarsipkan').length,
  }), [allRows]);

  // Filter + Search + Sort
  const filteredRows = useMemo(() => {
    let rows = allRows;

    // Filter kategori
    if (filter !== 'semua') {
      rows = rows.filter(r => r.listing.kategoriSlug === filter);
    }

    // Search (uses debounced value)
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r => {
        const l = r.listing;
        return (
          l.judul.toLowerCase().includes(q) ||
          l.workspaceNama.toLowerCase().includes(q) ||
          (getKategoriMarketplaceBySlug(l.kategoriSlug)?.nama ?? '').toLowerCase().includes(q) ||
          (l.subKategoriSlug ?? '').toLowerCase().includes(q) ||
          l.lokasi.toLowerCase().includes(q) ||
          l.kabupaten.toLowerCase().includes(q) ||
          l.provinsi.toLowerCase().includes(q)
        );
      });
    }

    return applySort(rows, sort);
  }, [allRows, filter, search, sort]);

  const { visible: visibleRows, hasMore: wishHasMore, sentinelRef: wishSentinel, total: wishTotal } = usePaginatedList(filteredRows);

  function handleHapus(workspaceId: string, listingUuid: string) {
    removeFromWishlist(workspaceId, listingUuid);
    setTick(t => t + 1);
  }

  function handleLihat(listing: ListingItem) {
    navigate(`/marketplace/${listing.kategoriSlug}/${listing.slug}`);
  }

  function handleNegosiasi(listing: ListingItem) {
    // MPK-R04: arahkan langsung ke Form Penawaran Awal (Buat Negosiasi),
    // yang membuat Draft Negosiasi lalu masuk ke Modul Negosiasi yang sudah ada.
    navigate(`/marketplace/negosiasi/buat?listingUuid=${listing.uuid}`);
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 32px' }}>

      {/* ── Header Info Workspace ── */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{activeWs.icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {activeWs.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Workspace Aktif</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-muted)', textAlign: 'right' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', display: 'block' }}>
            {ringkasan.total}
          </span>
          item tersimpan
        </div>
      </div>

      {/* ── Ringkasan ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14,
      }}>
        {[
          { label: 'Total', value: ringkasan.total, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
          { label: 'Aktif', value: ringkasan.aktif, color: '#1b7a43', bg: '#e8f5ee' },
          { label: 'Terjual', value: ringkasan.terjual, color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Ditutup', value: ringkasan.ditutup, color: '#c62828', bg: '#ffebee' },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 'var(--radius-md)',
            padding: '10px 6px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          fontSize: 15, pointerEvents: 'none', color: 'var(--color-muted)',
        }}>🔎</span>
        <input
          type="text"
          placeholder="Cari judul, workspace, kategori, lokasi..."
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 36px 10px 34px',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)',
            boxSizing: 'border-box', outline: 'none',
          }}
        />
        {inputSearch && (
          <button
            type="button"
            onClick={() => setInputSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', fontSize: 14, cursor: 'pointer',
              color: 'var(--color-muted)', padding: 2,
            }}
          >✕</button>
        )}
      </div>

      {/* ── Filter Kategori ── */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8,
      }}>
        {FILTER_CHIPS.map((chip) => {
          const active = filter === chip.slug;
          return (
            <button
              key={chip.slug}
              type="button"
              onClick={() => setFilter(chip.slug)}
              style={{
                flexShrink: 0, padding: '6px 11px',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-text)',
                fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                border: active ? 'none' : '1.5px solid var(--color-border)',
              } as React.CSSProperties}
            >
              <span style={{ fontSize: 13 }}>{chip.icon}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Sort ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', flexShrink: 0 }}>Urutkan:</span>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                disabled={!opt.active}
                onClick={() => opt.active && setSort(opt.mode)}
                style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: 20,
                  background: active ? '#1b7a43' : (opt.active ? 'var(--color-surface)' : '#f5f5f5'),
                  color: active ? '#fff' : (opt.active ? 'var(--color-text)' : 'var(--color-muted)'),
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  cursor: opt.active ? 'pointer' : 'not-allowed',
                  border: active ? 'none' : '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                } as React.CSSProperties}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hasil ── */}
      {allRows.length === 0 ? (
        <EmptyState onBrowse={() => navigate('/marketplace')} />
      ) : filteredRows.length === 0 ? (
        <EmptySearch />
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 10 }}>
            Menampilkan <strong style={{ color: 'var(--color-text)' }}>{wishTotal}</strong> dari {allRows.length} item
          </div>
          {visibleRows.map((row) => (
            <WishlistCard
              key={row.wish.id}
              row={row}
              onLihat={() => handleLihat(row.listing)}
              onHapus={() => handleHapus(activeWs.id, row.listing.uuid)}
              onNegosiasi={() => handleNegosiasi(row.listing)}
            />
          ))}
          {wishHasMore && (
            <div ref={wishSentinel} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
