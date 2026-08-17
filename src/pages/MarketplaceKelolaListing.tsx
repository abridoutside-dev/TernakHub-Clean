import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMarketplace } from '../hooks/useMarketplace';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  getListingByUuid,
  getListingBySlug,
  updateListing,
  updateListingStatus,
  deleteDraftListing,
  getEfektifStatusListing,
  getPlaceholderJumlahDilihat,
  type ListingStatus,
} from '../data/marketplaceListingData';
import { getStokFisikLive, getQtyTersediaAset, resolveNamaAset } from '../data/marketplaceAsetWorkspaceData';
import { getStokPakanOverQuotaWarning } from '../data/marketplaceStokPakanIntegrationData';
import { getStokObatOverQuotaWarning } from '../data/marketplaceStokObatIntegrationData';

// ─── Kelola Listing (MPK-008) ─────────────────────────────────────────────────
// Halaman aksi untuk SATU listing: Lihat Detail, Edit Listing, Ubah Status,
// Tutup Listing, Arsipkan Listing, Hapus Draft. Field yang boleh diubah lewat
// Edit Listing: harga, qtyDijual, deskripsi, thumbnail, gallery, lokasi
// penyerahan, status. Aset sumber (Livestock/Stok Pakan/Stok Obat/Layanan)
// TIDAK PERNAH disentuh — hanya etalase listing yang berubah.

const STATUS_OPTIONS: ListingStatus[] = ['Draft', 'Aktif', 'Ditahan', 'Terjual', 'Ditutup', 'Diarsipkan'];

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3, marginBottom: 10, textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 5 }}>{children}</label>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
  color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
};

const EMOJI_CHOICES = ['📦', '🐑', '🐐', '🌾', '💊', '🚚', '👨‍⚕️', '🏥', '🧰', '🌱', '⚖️'];

export default function MarketplaceKelolaListing() {
  useMarketplace(); // FLOW-003M27: hydrate listings from Supabase on mount
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [, forceRerender] = useState(0);

  const listing = uuid ? (getListingByUuid(uuid) ?? getListingBySlug(uuid)) : undefined;

  const [editing, setEditing] = useState(false);
  const [fHarga, setFHarga] = useState('');
  const [fQty, setFQty] = useState('');
  const [fDeskripsi, setFDeskripsi] = useState('');
  const [fKabupaten, setFKabupaten] = useState('');
  const [fProvinsi, setFProvinsi] = useState('');
  const [fThumbnail, setFThumbnail] = useState('📦');
  const [fGalleryText, setFGalleryText] = useState('');
  const [error, setError] = useState('');

  const tersedia = useMemo(() => {
    if (!listing) return null;
    return getQtyTersediaAset(listing.sumber.modul, listing.sumber.sumberId, listing.uuid);
  }, [listing]);

  if (!uuid || !listing) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Listing tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => navigate('/marketplace/listing-saya')}
          style={{ marginTop: 12, padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Kembali ke Listing Saya
        </button>
      </div>
    );
  }

  if (listing.workspaceId !== activeWorkspace?.workspace_uuid) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🚫</div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          Listing ini bukan milik Workspace aktif ({activeWorkspace?.workspace_name ?? '—'}).
        </p>
        <button
          type="button"
          onClick={() => navigate('/marketplace/listing-saya')}
          style={{ marginTop: 12, padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Kembali ke Listing Saya
        </button>
      </div>
    );
  }

  const stokFisik = getStokFisikLive(listing.sumber.modul, listing.sumber.sumberId);
  const efektif = getEfektifStatusListing(listing, stokFisik);
  // MPK-022/MPK-023: peringatan (bukan koreksi otomatis) saat Qty Listing
  // melebihi Qty Tersedia Untuk Listing terkini akibat perubahan Stok Pakan
  // atau Stok Obat. Masing-masing fungsi hanya mengembalikan non-null untuk
  // modul sumbernya sendiri.
  const overQuotaWarning = getStokPakanOverQuotaWarning(listing) ?? getStokObatOverQuotaWarning(listing);
  const statusStyle = STATUS_COLOR[efektif] ?? STATUS_COLOR[listing.status];
  const namaAset = resolveNamaAset(listing.sumber.modul, listing.sumber.sumberId, listing.jenisListing, listing.workspaceId);
  const dilihat = getPlaceholderJumlahDilihat(listing);
  const maksQty = tersedia === null ? null : tersedia + listing.qtyDijual;

  function startEdit() {
    setFHarga(String(listing!.harga));
    setFQty(String(listing!.qtyDijual));
    setFDeskripsi(listing!.deskripsi);
    setFKabupaten(listing!.kabupaten);
    setFProvinsi(listing!.provinsi);
    setFThumbnail(listing!.media.thumbnail);
    setFGalleryText(listing!.media.gallery.join(' '));
    setError('');
    setEditing(true);
  }

  function saveEdit() {
    const harga = Number(fHarga);
    const qty = Number(fQty);
    if (!fHarga || Number.isNaN(harga) || harga <= 0) { setError('Harga harus lebih dari 0.'); return; }
    if (!fQty || Number.isNaN(qty) || qty <= 0) { setError('Qty Listing harus lebih dari 0.'); return; }
    if (maksQty !== null && qty > maksQty) {
      setError(`Qty Listing tidak boleh melebihi Qty tersedia (maks ${maksQty}).`);
      return;
    }
    if (!fDeskripsi.trim()) { setError('Deskripsi tidak boleh kosong.'); return; }
    if (!fKabupaten.trim()) { setError('Kabupaten/Kota tidak boleh kosong.'); return; }

    const gallery = fGalleryText.split(/\s+/).map((g) => g.trim()).filter(Boolean);
    updateListing(listing!.uuid, {
      harga,
      qtyDijual: qty,
      deskripsi: fDeskripsi.trim(),
      kabupaten: fKabupaten.trim(),
      provinsi: fProvinsi.trim(),
      media: { thumbnail: fThumbnail, gallery: gallery.length ? gallery : [fThumbnail] },
    });
    setEditing(false);
    forceRerender((n) => n + 1);
  }

  function changeStatus(status: ListingStatus) {
    updateListingStatus(listing!.uuid, status);
    forceRerender((n) => n + 1);
  }

  function tutupListing() {
    if (!window.confirm('Tutup listing ini? Listing tidak akan tampil lagi di Marketplace, tapi tetap tersimpan sebagai riwayat.')) return;
    changeStatus('Ditutup');
  }

  function arsipkanListing() {
    if (!window.confirm('Arsipkan listing ini? Listing akan dipindahkan ke arsip dan tidak tampil di Marketplace.')) return;
    changeStatus('Diarsipkan');
  }

  function hapusDraft() {
    if (!window.confirm('Hapus draft ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    if (deleteDraftListing(listing!.uuid)) {
      navigate('/marketplace/listing-saya');
    }
  }

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 480, margin: '0 auto' }}>
      {/* ── Header listing ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          {listing.media.thumbnail}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{listing.judul}</div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
              color: statusStyle.color, background: statusStyle.bg,
            }}>
              {efektif}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{listing.uuid.slice(0, 8)}…</span>
          </div>
        </div>
      </div>

      {/* ── Peringatan MPK-022: Qty Listing melebihi Qty Tersedia ──────────── */}
      {overQuotaWarning && (
        <div style={{
          background: '#fbe1e1', border: '1.5px solid #f0b8b8', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', marginBottom: 14, fontSize: 11.5, color: '#7a2020', lineHeight: 1.6,
        }}>
          ⚠️ {overQuotaWarning}
        </div>
      )}

      {/* ── Ringkasan ────────────────────────────────────────────────────── */}
      <SectionCard title="Ringkasan Listing">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Harga</div><div style={{ fontWeight: 700 }}>{formatRupiah(listing.harga)} / {listing.satuanHarga}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Qty Listing</div><div style={{ fontWeight: 700 }}>{listing.qtyDijual}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Nama Aset</div><div style={{ fontWeight: 700 }}>{namaAset}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Stok Fisik Aset</div><div style={{ fontWeight: 700 }}>{stokFisik === null ? '— (jasa)' : stokFisik}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Lokasi</div><div style={{ fontWeight: 700 }}>{listing.lokasi}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Kondisi</div><div style={{ fontWeight: 700 }}>{listing.kondisi ?? '—'}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Tanggal Publish</div><div style={{ fontWeight: 700 }}>{listing.publishedAt ?? 'Belum dipublikasikan'}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Dibuat / Diubah</div><div style={{ fontWeight: 700 }}>{listing.createdAt} / {listing.updatedAt}</div></div>
          <div><div style={{ color: 'var(--color-muted)', fontSize: 10.5 }}>Jumlah Dilihat</div><div style={{ fontWeight: 700 }}>👁 {dilihat} (placeholder)</div></div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10, lineHeight: 1.5 }}>{listing.deskripsi}</p>
      </SectionCard>

      {/* ── Aksi ─────────────────────────────────────────────────────────── */}
      {!editing && (
        <SectionCard title="Aksi Listing">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" onClick={() => navigate(`/marketplace/${listing.kategoriSlug}/${listing.slug}`)} style={actionBtnStyle('var(--color-surface)', 'var(--color-text)')}>
              🔎 Lihat Detail
            </button>
            <button type="button" onClick={startEdit} style={actionBtnStyle('var(--color-primary-light)', 'var(--color-primary)')}>
              ✏️ Edit Listing
            </button>

            <div>
              <FieldLabel>Ubah Status</FieldLabel>
              <select
                value={listing.status}
                onChange={(e) => changeStatus(e.target.value as ListingStatus)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {listing.status !== 'Ditutup' && (
              <button type="button" onClick={tutupListing} style={actionBtnStyle('var(--color-bg)', '#5c5c5c')}>
                🔒 Tutup Listing
              </button>
            )}
            {listing.status !== 'Diarsipkan' && (
              <button type="button" onClick={arsipkanListing} style={actionBtnStyle('#f8dede', '#7a2020')}>
                🗄️ Arsipkan Listing
              </button>
            )}
            {listing.status === 'Draft' && (
              <button type="button" onClick={hapusDraft} style={actionBtnStyle('#fbe1e1', '#a02020')}>
                🗑️ Hapus Draft
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Edit Listing ─────────────────────────────────────────────────── */}
      {editing && (
        <SectionCard title="Edit Listing">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <FieldLabel>Harga Jual (Rp)</FieldLabel>
              <input type="number" value={fHarga} onChange={(e) => setFHarga(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Qty Listing {maksQty !== null && <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(maks {maksQty})</span>}</FieldLabel>
              <input type="number" value={fQty} onChange={(e) => setFQty(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Deskripsi</FieldLabel>
              <textarea value={fDeskripsi} onChange={(e) => setFDeskripsi(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <FieldLabel>Thumbnail</FieldLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFThumbnail(e)}
                    style={{
                      width: 38, height: 38, fontSize: 18, borderRadius: 'var(--radius-sm)',
                      border: fThumbnail === e ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: 'var(--color-bg)', cursor: 'pointer',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Gallery <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(pisahkan dengan spasi)</span></FieldLabel>
              <input type="text" value={fGalleryText} onChange={(e) => setFGalleryText(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <FieldLabel>Kabupaten/Kota</FieldLabel>
                <input type="text" value={fKabupaten} onChange={(e) => setFKabupaten(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Provinsi</FieldLabel>
                <input type="text" value={fProvinsi} onChange={(e) => setFProvinsi(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {error && <div style={{ fontSize: 11.5, color: '#a02020', fontWeight: 600 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setEditing(false)} style={{ ...actionBtnStyle('var(--color-surface)', 'var(--color-muted)'), flex: 1 }}>
                Batal
              </button>
              <button type="button" onClick={saveEdit} style={{ ...actionBtnStyle('var(--color-primary)', '#fff'), flex: 1, border: 'none' }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      <button
        type="button"
        onClick={() => navigate('/marketplace/listing-saya')}
        style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
      >
        ← Kembali ke Listing Saya
      </button>
    </div>
  );
}

function actionBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)',
    background: bg, color, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
  };
}
