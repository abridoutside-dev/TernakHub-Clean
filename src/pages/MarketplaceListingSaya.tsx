import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { usePaginatedList } from '../utils/usePaginatedList';
import { getActiveWorkspace } from '../components/TopAppBar';
import { useMarketplace } from '../hooks/useMarketplace';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  getAllListing,
  getPlaceholderJumlahDilihat,
  getEfektifStatusListing,
  type ListingItem,
  type ListingStatus,
} from '../data/marketplaceListingData';
import { getStokFisikLive, resolveNamaAset } from '../data/marketplaceAsetWorkspaceData';
import { getStokPakanOverQuotaWarning } from '../data/marketplaceStokPakanIntegrationData';
import { getStokObatOverQuotaWarning } from '../data/marketplaceStokObatIntegrationData';

// ─── Listing Saya (MPK-008) ───────────────────────────────────────────────────
// Halaman ini HANYA mengelola Listing Marketplace milik Workspace aktif —
// bukan aset. Layout: Header → Ringkasan → Search → Filter → Sort → Daftar
// Listing. Memilih satu listing membuka Kelola Listing
// (/marketplace/listing-saya/:uuid) tempat aksi (Edit/Ubah Status/Tutup/
// Arsipkan/Hapus Draft) sesungguhnya dilakukan.

type FilterStatus = 'Semua' | ListingStatus;
type SortMode = 'terbaru' | 'terlama' | 'harga-rendah' | 'harga-tinggi';

const FILTER_OPTIONS: FilterStatus[] = ['Semua', 'Draft', 'Aktif', 'Ditahan', 'Terjual', 'Ditutup', 'Diarsipkan'];
const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'terlama', label: 'Terlama' },
  { key: 'harga-rendah', label: 'Harga Terendah' },
  { key: 'harga-tinggi', label: 'Harga Tertinggi' },
];

const STATUS_COLOR: Record<ListingStatus | 'Stok Habis', { color: string; bg: string }> = {
  Draft:       { color: '#7a6b1c', bg: '#fdf3d0' },
  Aktif:       { color: '#1b7a43', bg: '#e2f5ea' },
  Ditahan:     { color: '#8a5a12', bg: '#fbe8d0' },
  Terjual:     { color: '#1a4d8a', bg: '#e1ecfb' },
  Ditutup:     { color: '#5c5c5c', bg: '#ececec' },
  Diarsipkan:  { color: '#7a2020', bg: '#f8dede' },
  'Stok Habis': { color: '#a02020', bg: '#fbe1e1' },
};

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      flex: 1, minWidth: 78, background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
      padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function ListingCard({ listing, onOpen }: { listing: ListingItem; onOpen: () => void }) {
  const stokFisik = getStokFisikLive(listing.sumber.modul, listing.sumber.sumberId);
  const efektif = getEfektifStatusListing(listing, stokFisik);
  const statusStyle = STATUS_COLOR[efektif] ?? STATUS_COLOR[listing.status];
  const dilihat = getPlaceholderJumlahDilihat(listing);
  // MPK-022/MPK-023: tag ringkas saat Qty Listing melebihi Qty Tersedia Untuk Listing.
  const overQuota = Boolean(getStokPakanOverQuotaWarning(listing) ?? getStokObatOverQuotaWarning(listing));

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'flex', gap: 12, textAlign: 'left', width: '100%',
        padding: 12, borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {listing.media.thumbnail}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{listing.judul}</span>
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
            color: statusStyle.color, background: statusStyle.bg, height: 'fit-content',
          }}>
            {efektif}
          </span>
        </div>
        {overQuota && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#a02020', marginTop: 4 }}>
            ⚠️ Qty melebihi stok tersedia
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
          {formatRupiah(listing.harga)} <span style={{ color: 'var(--color-muted)', fontWeight: 500, fontSize: 11 }}>/ {listing.satuanHarga}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span>Qty: {listing.qtyDijual}</span>
          <span>·</span>
          <span>{listing.publishedAt ? `Publish: ${listing.publishedAt}` : 'Belum dipublikasikan'}</span>
          <span>·</span>
          <span>👁 {dilihat} dilihat</span>
        </div>
      </div>
    </button>
  );
}

function EmptyListingSaya({ onBuatListing }: { onBuatListing: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>🗂️</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
        Belum Ada Listing
      </h3>
      <p style={{ fontSize: 12.5, color: 'var(--color-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
        Workspace aktif belum memiliki listing di Marketplace. Buat listing pertama dari aset yang sudah dimiliki.
      </p>
      <button
        type="button"
        onClick={onBuatListing}
        style={{
          padding: '11px 22px', borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--color-primary)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
        }}
      >
        ➕ Buat Listing
      </button>
    </div>
  );
}

export default function MarketplaceListingSaya() {
  useMarketplace(); // FLOW-003M27: hydrate listings from Supabase on mount
  const navigate = useNavigate();
  const ws = getActiveWorkspace();
  const { activeWorkspace } = useWorkspace();

  const [inputSearch, setInputSearch] = useState('');
  const search = useDebounce(inputSearch, 300);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('Semua');
  const [sortMode, setSortMode] = useState<SortMode>('terbaru');

  // After DB hydration, listing.workspaceId = workspace_uuid (Supabase UUID).
  // Use workspace_uuid as primary filter, with legacy id as fallback for seed data.
  const wsFilter = activeWorkspace?.workspace_uuid ?? ws.id;
  const myListing = useMemo(
    () => getAllListing().filter((l) => l.workspaceId === wsFilter || l.workspaceId === ws.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wsFilter, ws.id],
  );

  const ringkasan = useMemo(() => ({
    total: myListing.length,
    aktif: myListing.filter((l) => l.status === 'Aktif').length,
    draft: myListing.filter((l) => l.status === 'Draft').length,
    terjual: myListing.filter((l) => l.status === 'Terjual').length,
    ditutup: myListing.filter((l) => l.status === 'Ditutup').length,
  }), [myListing]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myListing;
    return myListing.filter((l) => {
      const namaAset = resolveNamaAset(l.sumber.modul, l.sumber.sumberId, l.jenisListing);
      return (
        l.judul.toLowerCase().includes(q) ||
        l.uuid.toLowerCase().includes(q) ||
        namaAset.toLowerCase().includes(q) ||
        l.lokasi.toLowerCase().includes(q)
      );
    });
  }, [myListing, search]);

  const filtered = useMemo(() => {
    if (statusFilter === 'Semua') return searched;
    return searched.filter((l) => l.status === statusFilter);
  }, [searched, statusFilter]);

  const sorted = useMemo(() => {
    const list = filtered.slice();
    switch (sortMode) {
      case 'terlama': return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case 'harga-rendah': return list.sort((a, b) => a.harga - b.harga);
      case 'harga-tinggi': return list.sort((a, b) => b.harga - a.harga);
      case 'terbaru':
      default: return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }, [filtered, sortMode]);

  const { visible: paginatedSorted, hasMore: hasMoreSorted, sentinelRef: sortedSentinel } = usePaginatedList(sorted);

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 480, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Listing Saya</h2>
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ws.icon} {ws.name} ({ws.type})
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketplace/buat')}
          style={{
            flexShrink: 0, padding: '9px 14px', borderRadius: 'var(--radius-md)', border: 'none',
            background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ➕ Buat Listing
        </button>
      </div>

      {myListing.length === 0 ? (
        <EmptyListingSaya onBuatListing={() => navigate('/marketplace/buat')} />
      ) : (
        <>
          {/* ── Ringkasan ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatBox label="Total Listing" value={ringkasan.total} />
            <StatBox label="Listing Aktif" value={ringkasan.aktif} />
            <StatBox label="Draft" value={ringkasan.draft} />
            <StatBox label="Terjual" value={ringkasan.terjual} />
            <StatBox label="Ditutup" value={ringkasan.ditutup} />
          </div>

          {/* ── Search ───────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
            <input
              type="text"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Cari judul, UUID, nama aset, lokasi..."
              style={{
                width: '100%', padding: '10px 12px 10px 34px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-text)', fontSize: 13,
              }}
            />
          </div>

          {/* ── Filter ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  flexShrink: 0, padding: '7px 13px', borderRadius: 999,
                  border: statusFilter === f ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  background: statusFilter === f ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: statusFilter === f ? '#fff' : 'var(--color-muted)',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ── Sort ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSortMode(s.key)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  border: sortMode === s.key ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: sortMode === s.key ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  color: sortMode === s.key ? 'var(--color-primary)' : 'var(--color-muted)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* ── Daftar Listing ───────────────────────────────────────────── */}
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
              Tidak ada listing yang cocok dengan pencarian/filter ini.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paginatedSorted.map((l) => (
                  <ListingCard key={l.uuid} listing={l} onOpen={() => navigate(`/marketplace/listing-saya/${l.uuid}`)} />
                ))}
              </div>
              {hasMoreSorted && (
                <div ref={sortedSentinel} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
