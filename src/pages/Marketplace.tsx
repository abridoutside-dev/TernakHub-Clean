// ─── Marketplace — Halaman Utama (MPK-001 → MPK-025) ─────────────────────────
// Explorer Listing: search, filter kategori, listing grid dari data layer.
// Shortcut: Buat Listing, Listing Saya, Wishlist, Chat — navigasi ke sub-halaman.
// FAB "Buat Listing" → /marketplace/buat.
// Notifikasi → /marketplace/notifikasi.
// Listing card → /marketplace/:kategoriSlug/:slug.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../hooks/useMarketplace';
import { getActiveWorkspace } from '../components/TopAppBar';
import { getAllListing, type ListingItem } from '../data/marketplaceListingData';
import { KATEGORI_MARKETPLACE } from '../data/marketplaceKategoriData';
import { applyMarketplaceFilter, DEFAULT_MARKETPLACE_FILTER } from '../data/marketplaceFilterData';
import { searchMarketplace } from '../data/marketplaceSearchData';
import {
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../data/marketplaceWishlistData';
import { getNotifikasi } from '../data/marketplaceNotifikasiData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtHarga(harga: number): string {
  if (harga >= 1_000_000) {
    const juta = harga / 1_000_000;
    return 'Rp ' + (Number.isInteger(juta) ? juta : juta.toFixed(1)) + ' jt';
  }
  if (harga >= 1_000) {
    const ribu = harga / 1_000;
    return 'Rp ' + (Number.isInteger(ribu) ? ribu : ribu.toFixed(0)) + 'rb';
  }
  return 'Rp ' + harga.toLocaleString('id-ID');
}

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  'ternak':          { bg: '#e8f5ee', color: '#1b7a43' },
  'pakan':           { bg: '#fff8e1', color: '#7b5e2a' },
  'obat-kesehatan':  { bg: '#e8f5e9', color: '#2a7b4f' },
  'peralatan':       { bg: '#efebe9', color: '#5d4037' },
  'transportasi':    { bg: '#e3f2fd', color: '#1565c0' },
  'dokter-hewan':    { bg: '#e1f5fe', color: '#0277bd' },
  'klinik-hewan':    { bg: '#e0f7fa', color: '#00838f' },
  'bibit-hijauan':   { bg: '#f1f8e9', color: '#558b2f' },
  'jasa-peternakan': { bg: '#efebe9', color: '#8d6e63' },
  'lainnya':         { bg: '#f5f5f5', color: '#616161' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShortcutCard({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 8px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-text)',
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {label}
      </span>
    </div>
  );
}

function ListingCard({
  item,
  workspaceId,
  tick,
  onToggleFav,
  onClick,
}: {
  item: ListingItem;
  workspaceId: string;
  tick: number;
  onToggleFav: (uuid: string) => void;
  onClick: () => void;
}) {
  const fav = useMemo(
    () => isInWishlist(workspaceId, item.uuid),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, item.uuid, tick],
  );
  const badge = BADGE_COLORS[item.kategoriSlug] ?? { bg: '#f5f5f5', color: '#616161' };
  const kategori = KATEGORI_MARKETPLACE.find((k) => k.slug === item.kategoriSlug);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Photo area */}
      <div style={{
        width: '100%',
        paddingTop: '56%',
        position: 'relative',
        background: badge.bg,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52,
        }}>
          {item.media.thumbnail}
        </div>

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: badge.bg,
          color: badge.color,
          fontSize: 10, fontWeight: 700,
          borderRadius: 20,
          padding: '3px 9px',
          border: `1px solid ${badge.color}22`,
        }}>
          {kategori?.nama ?? item.kategoriSlug}
        </div>

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(item.uuid);
          }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.88)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          aria-label={fav ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          {fav ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info area */}
      <div style={{ padding: '12px 12px 14px' }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: 'var(--color-text)',
          lineHeight: 1.35,
          marginBottom: 5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.judul}
        </div>

        <div style={{
          fontSize: 15, fontWeight: 800,
          color: 'var(--color-primary)',
          marginBottom: 8,
        }}>
          {fmtHarga(item.harga)}
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 3 }}>
            /{item.satuanHarga}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11 }}>📍</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>
              {item.lokasi}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11 }}>🏪</span>
            <span style={{
              fontSize: 11, color: 'var(--color-muted)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.penjual}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Marketplace() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  useMarketplace(); // FLOW-003M27: hydrate listings from Supabase on mount
  const ws = getActiveWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [tick, setTick] = useState(0);

  // Unread notification count
  const unreadCount = useMemo(() => {
    const notifs = getNotifikasi(ws.id);
    return notifs.filter((n) => !n.dibaca).length;
  }, [ws.id]);

  // All active listings from data layer
  const allListings = useMemo(() => {
    return getAllListing().filter((l) => l.status === 'Aktif');
  }, []);

  // Apply category filter then search
  const displayedListings = useMemo(() => {
    let items = allListings;

    // Category filter
    if (activeCategory !== 'semua') {
      items = applyMarketplaceFilter(items, {
        ...DEFAULT_MARKETPLACE_FILTER,
        kategoriSlug: activeCategory as Parameters<typeof applyMarketplaceFilter>[1]['kategoriSlug'],
      });
    }

    // Search — uses debounced value to avoid filtering on every keystroke
    if (debouncedSearchQuery.trim()) {
      const results = searchMarketplace(items, debouncedSearchQuery);
      items = results.map((r) => r.listing);
    }

    return items;
  }, [allListings, activeCategory, debouncedSearchQuery]);

  function handleToggleFav(uuid: string) {
    // PLATFORM-001: guests must log in before using wishlist
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/marketplace' } } });
      return;
    }
    if (isInWishlist(ws.id, uuid)) {
      removeFromWishlist(ws.id, uuid);
    } else {
      addToWishlist(ws.id, uuid);
    }
    setTick((t) => t + 1);
  }

  function handleListingClick(item: ListingItem) {
    navigate(`/marketplace/${item.kategoriSlug}/${item.slug}`);
  }

  // Category tabs: "Semua" + semua kategori dari data layer
  const categoryTabs = [
    { id: 'semua', icon: '🏪', label: 'Semua' },
    ...KATEGORI_MARKETPLACE.map((k) => ({
      id: k.slug,
      icon: k.icon,
      label: k.nama,
    })),
  ];

  return (
    <>

      {/* ── Search + Notification ────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ternak, pakan, obat, jasa..."
            style={{
              paddingLeft: 36, paddingRight: 12,
              height: 42,
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              width: '100%',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketplace/notifikasi')}
          style={{
            width: 42, height: 42, flexShrink: 0,
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-label="Notifikasi Marketplace"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-danger)',
              border: '1.5px solid var(--color-surface)',
            }} />
          )}
        </button>
      </div>

      {/* ── Shortcut Cards ───────────────────────────────────────────────── */}
      <div style={{
        padding: '4px 16px 16px',
        display: 'flex', gap: 10,
      }}>
        <ShortcutCard icon="➕" label="Buat Listing" onClick={() => navigate('/marketplace/buat')} />
        <ShortcutCard icon="📋" label="Listing Saya" onClick={() => navigate('/marketplace/listing-saya')} />
        <ShortcutCard icon="❤️" label="Wishlist"     onClick={() => navigate('/marketplace/wishlist')} />
        <ShortcutCard icon="🛡️" label="Escrow"       onClick={() => navigate('/marketplace/escrow-info')} />
        <ShortcutCard icon="💬" label="Chat"          onClick={() => navigate('/marketplace/chat')} />
        <ShortcutCard icon="📜" label="Riwayat"      onClick={() => navigate('/marketplace/riwayat')} />
      </div>

      {/* ── Category Chips ───────────────────────────────────────────────── */}
      <div style={{
        overflowX: 'auto',
        padding: '0 16px 14px',
        display: 'flex',
        gap: 8,
        scrollbarWidth: 'none',
      }}>
        {categoryTabs.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px',
                borderRadius: 20,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                boxShadow: active ? 'none' : 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Section header ───────────────────────────────────────────────── */}
      <div style={{
        padding: '0 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--color-muted)',
          letterSpacing: 0.8, textTransform: 'uppercase',
          margin: 0,
        }}>
          {searchQuery.trim()
            ? `Hasil Pencarian "${searchQuery.trim()}"`
            : activeCategory === 'semua'
              ? 'Listing Terbaru'
              : `Kategori: ${KATEGORI_MARKETPLACE.find((k) => k.slug === activeCategory)?.nama ?? activeCategory}`}
        </h2>
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          {displayedListings.length} item
        </span>
      </div>

      {/* ── Listing Grid ─────────────────────────────────────────────────── */}
      {displayedListings.length > 0 ? (
        <div style={{
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          {displayedListings.map((item) => (
            <ListingCard
              key={item.uuid}
              item={item}
              workspaceId={ws.id}
              tick={tick}
              onToggleFav={handleToggleFav}
              onClick={() => handleListingClick(item)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '48px 32px',
          textAlign: 'center',
          color: 'var(--color-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            Tidak ada listing ditemukan
          </div>
          <div style={{ fontSize: 13 }}>
            {searchQuery.trim()
              ? `Tidak ada hasil untuk "${searchQuery.trim()}"`
              : 'Belum ada listing pada kategori ini'}
          </div>
        </div>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/buat')}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 18px',
          borderRadius: 28,
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          fontSize: 14, fontWeight: 700,
          boxShadow: 'var(--shadow-fab)',
          cursor: 'pointer',
          zIndex: 50,
          letterSpacing: 0.2,
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Buat Listing"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>➕</span>
        Buat Listing
      </button>
    </>
  );
}
