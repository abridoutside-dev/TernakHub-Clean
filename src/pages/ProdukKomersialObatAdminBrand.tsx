// ─── Admin Produk Komersial Obat — Kelola Brand (PKO-004) ─────────────────────
// Struktur & style identik dengan MasterObatSubKategori.tsx (Kelola Sub
// Kategori Master Obat): search, filter status, tambah/edit via bottom sheet,
// nonaktifkan/aktifkan via card menu, soft delete (status, tidak pernah
// dihapus dari data).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getObatBrandListLive,
  addObatBrand,
  updateObatBrand,
  softDeleteObatBrand,
  restoreObatBrand,
  canDeactivateObatBrand,
  type ObatBrand,
  type StatusProdukObat,
} from '../services/drugCommercialProductService';
import {
  SectionCard, FieldWrap, FieldLabel, ErrorText, BottomSheetShell, inputStyle,
  StatusFilterChips, type StatusFilterValue,
  CardMenuButton, CardMenuDropdown, TambahButton,
} from '../components/MasterObatCrudUI';
import { Snackbar, type SnackbarTone } from '../components/ImportExportUI';
import { validateObatBrandInput } from '../utils/produkKomersialObatAdminValidation';

function toFilterValue(status: StatusProdukObat): StatusFilterValue {
  return status === 'aktif' ? 'Aktif' : 'Nonaktif';
}

// ─── Tambah / Edit Brand Form Sheet ────────────────────────────────────────────

function BrandFormSheet({ brand, onClose, onSaved }: {
  brand?: ObatBrand; onClose: () => void; onSaved: () => void;
}) {
  const [nama, setNama] = useState(brand?.nama ?? '');
  const [logo, setLogo] = useState(brand?.logo ?? '');
  const [deskripsi, setDeskripsi] = useState(brand?.deskripsi ?? '');
  const [status, setStatus] = useState<StatusProdukObat>(brand?.status ?? 'aktif');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = nama.trim();
    const check = await validateObatBrandInput(trimmed, brand?.uuid);
    if (!check.valid) {
      setError(check.error ?? 'Data tidak valid.');
      return;
    }
    if (brand) {
      if (brand.status === 'aktif' && status === 'nonaktif') {
        const guard = await canDeactivateObatBrand(brand.uuid);
        if (!guard.ok) {
          setError(guard.error ?? 'Brand tidak dapat dinonaktifkan.');
          return;
        }
      }
      await updateObatBrand(brand.uuid, { nama: trimmed, logo, deskripsi, status });
    } else {
      await addObatBrand({ nama: trimmed, logo, deskripsi });
    }
    onSaved();
    onClose();
  };

  return (
    <BottomSheetShell
      title={brand ? 'Edit Brand' : 'Tambah Brand'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <SectionCard title="Informasi Brand">
        <FieldWrap>
          <FieldLabel htmlFor="nama-brand-obat">
            Nama Brand <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="nama-brand-obat"
            type="text"
            value={nama}
            onChange={(e) => { setNama(e.target.value); setError(''); }}
            placeholder="Contoh: Fertilife"
            style={inputStyle}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="logo-brand-obat" optional>Logo</FieldLabel>
          <input
            id="logo-brand-obat"
            type="text"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="Emoji atau URL logo (contoh: 💊)"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="deskripsi-brand-obat" optional>Deskripsi</FieldLabel>
          <textarea
            id="deskripsi-brand-obat"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan brand ini secara singkat..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </FieldWrap>
        {brand && (
          <FieldWrap>
            <FieldLabel htmlFor="status-brand-obat">Status</FieldLabel>
            <select
              id="status-brand-obat"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusProdukObat)}
              style={inputStyle}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </FieldWrap>
        )}
      </SectionCard>
    </BottomSheetShell>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

function BrandCard({ brand, onEdit, onToggleStatus }: {
  brand: ObatBrand; onEdit: () => void; onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAktif = brand.status === 'aktif';

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'stretch', overflow: 'hidden',
          opacity: isAktif ? 1 : 0.6,
        }}
      >
        <div style={{ width: 4, background: brand.color, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '13px 12px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {brand.logo || '💊'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.2 }}>
              {brand.nama}
            </div>
            {brand.deskripsi && (
              <p style={{
                margin: '0 0 6px', fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {brand.deskripsi}
              </p>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, color: brand.color, background: brand.bg,
              borderRadius: 20, padding: '2px 8px', marginRight: 6,
            }}>
              {brand.jumlahProduk} produk
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isAktif ? '#2e7d32' : '#9e9e9e', background: isAktif ? '#e8f5e9' : '#f5f5f5',
              borderRadius: 20, padding: '2px 8px',
            }}>
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <CardMenuButton open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
        </div>
      </div>

      {menuOpen && (
        <CardMenuDropdown
          onClose={() => setMenuOpen(false)}
          items={[
            { label: 'Edit', icon: '✏️', onClick: onEdit },
            isAktif
              ? { label: 'Nonaktifkan', icon: '🚫', danger: true, onClick: onToggleStatus }
              : { label: 'Aktifkan', icon: '✅', onClick: onToggleStatus },
          ]}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdukKomersialObatAdminBrand() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('Semua');
  const [allBrand, setAllBrand] = useState<ObatBrand[]>([]);
  const [, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ObatBrand | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: SnackbarTone } | undefined>(undefined);

  const refresh = async () => {
    try {
      setLoading(true);
      const brands = await getObatBrandListLive();
      setAllBrand(brands);
    } catch {
      setSnackbar({ message: 'Gagal memuat data brand.', tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = allBrand.filter((b) => {
    const matchesQuery =
      b.nama.toLowerCase().includes(query.toLowerCase()) ||
      (b.deskripsi ?? '').toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || toFilterValue(b.status) === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/stok-obat/komersial/admin')}
          style={{ border: 'none', background: 'none', padding: 0, marginBottom: 4, color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Admin Produk Komersial Obat
        </button>
        <h1 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
          Kelola Brand
        </h1>
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
            placeholder="Cari brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {allBrand.length} brand
        </div>
      </div>

      {/* Tambah Brand */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <TambahButton label="Tambah Brand" onClick={() => { setEditing(undefined); setFormOpen(true); }} />
      </div>

      {/* Brand list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allBrand.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>™️</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada Brand.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🔍</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Tidak Ada Hasil</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Coba ubah kata kunci atau filter.</div>
            </div>
          </div>
        ) : (
          filtered.map((b) => (
            <BrandCard
              key={b.uuid}
              brand={b}
              onEdit={() => { setEditing(b); setFormOpen(true); }}
              onToggleStatus={async () => {
                if (b.status === 'aktif') {
                  const result = await softDeleteObatBrand(b.uuid);
                  if (!result.ok) {
                    setSnackbar({ message: result.error ?? 'Brand tidak dapat dinonaktifkan.', tone: 'error' });
                    return;
                  }
                } else {
                  await restoreObatBrand(b.uuid);
                }
                refresh();
              }}
            />
          ))
        )}
      </div>

      {formOpen && (
        <BrandFormSheet
          brand={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}

      {snackbar && (
        <Snackbar message={snackbar.message} tone={snackbar.tone} onClose={() => setSnackbar(undefined)} />
      )}
    </div>
  );
}
