// ─── Admin Produk Komersial Obat — Kelola Produk (PKO-004) ────────────────────
// Struktur & style identik dengan MasterObatDetail.tsx (Kelola Detail Obat):
// search, filter status, tambah/edit via bottom sheet, nonaktifkan/aktifkan
// via card menu. Setiap Produk WAJIB terhubung ke Brand dan ke Master Obat
// (dipilih via MasterObatPickerField — tidak boleh diketik manual).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getObatBrandListLive, OBAT_PRODUK_LIST,
  addObatProdukKomersial, updateObatProdukKomersial,
  softDeleteObatProdukKomersial, restoreObatProdukKomersial,
  type ObatProdukKomersial, type StatusProdukObat,
} from '../data/produkKomersialObatData';
import { getObatByUuid, type ObatItem } from '../data/obatData';
import {
  SectionCard, FieldWrap, FieldLabel, ErrorText, BottomSheetShell, inputStyle,
  StatusFilterChips, type StatusFilterValue,
  CardMenuButton, CardMenuDropdown, TambahButton,
} from '../components/MasterObatCrudUI';
import { Snackbar, type SnackbarTone } from '../components/ImportExportUI';
import { MasterObatPickerField } from '../components/MasterObatPicker';
import { validateObatProdukInput } from '../utils/produkKomersialObatAdminValidation';

function toFilterValue(status: StatusProdukObat): StatusFilterValue {
  return status === 'aktif' ? 'Aktif' : 'Nonaktif';
}

// ─── Tambah / Edit Produk Form Sheet ───────────────────────────────────────────

function ProdukFormSheet({ produk, onClose, onSaved }: {
  produk?: ObatProdukKomersial; onClose: () => void; onSaved: () => void;
}) {
  const brandList = getObatBrandListLive();
  const [brandId, setBrandId] = useState(produk?.brandId ?? '');
  const [masterObatUuid, setMasterObatUuid] = useState(produk?.masterObatUuid ?? '');
  const [nama, setNama] = useState(produk?.nama ?? '');
  const [namaKomersial, setNamaKomersial] = useState(produk?.namaKomersial ?? '');
  const [bentukSediaan, setBentukSediaan] = useState(produk?.bentukSediaan ?? '');
  const [kemasan, setKemasan] = useState(produk?.kemasan ?? '');
  const [produsen, setProdusen] = useState(produk?.produsen ?? '');
  const [distributor, setDistributor] = useState(produk?.distributor ?? '');
  const [nomorRegistrasi, setNomorRegistrasi] = useState(produk?.nomorRegistrasi ?? '');
  const [fotoProduk, setFotoProduk] = useState(produk?.fotoProduk ?? '');
  const [catatan, setCatatan] = useState(produk?.catatan ?? '');
  const [status, setStatus] = useState<StatusProdukObat>(produk?.status ?? 'aktif');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedNama = nama.trim();
    const check = validateObatProdukInput({ brandId, masterObatUuid, nama: trimmedNama }, produk?.uuid);
    if (!check.valid) {
      setError(check.error ?? 'Data tidak valid.');
      return;
    }
    if (!namaKomersial.trim()) { setError('Nama Komersial wajib diisi.'); return; }
    if (!bentukSediaan.trim()) { setError('Bentuk Sediaan wajib diisi.'); return; }
    if (!kemasan.trim()) { setError('Kemasan wajib diisi.'); return; }
    if (!produsen.trim()) { setError('Produsen wajib diisi.'); return; }

    const payload = {
      brandId, masterObatUuid, nama: trimmedNama, namaKomersial, bentukSediaan, kemasan, produsen,
      distributor, nomorRegistrasi, fotoProduk, catatan,
    };

    if (produk) {
      updateObatProdukKomersial(produk.uuid, { ...payload, status });
    } else {
      addObatProdukKomersial(payload);
    }
    onSaved();
    onClose();
  };

  return (
    <BottomSheetShell
      title={produk ? 'Edit Produk' : 'Tambah Produk'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <SectionCard title="Relasi">
        <FieldWrap>
          <FieldLabel htmlFor="brand-produk-obat">
            Brand <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <select
            id="brand-produk-obat"
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setError(''); }}
            style={inputStyle}
          >
            <option value="">Pilih Brand...</option>
            {brandList.map((b) => (
              <option key={b.uuid} value={b.uuid}>{b.nama}</option>
            ))}
          </select>
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="master-obat-produk">
            Master Obat <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <MasterObatPickerField
            value={masterObatUuid}
            onChange={(item: ObatItem) => { setMasterObatUuid(item.uuid); setError(''); }}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FieldWrap>
      </SectionCard>

      <SectionCard title="Informasi Produk">
        <FieldWrap>
          <FieldLabel htmlFor="nama-produk-obat">
            Nama Produk <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="nama-produk-obat"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Oxytet LA Fertilife"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="nama-komersial-produk">
            Nama Komersial <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="nama-komersial-produk"
            type="text"
            value={namaKomersial}
            onChange={(e) => setNamaKomersial(e.target.value)}
            placeholder="Nama yang tercetak pada kemasan"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="bentuk-sediaan-produk">
            Bentuk Sediaan <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="bentuk-sediaan-produk"
            type="text"
            value={bentukSediaan}
            onChange={(e) => setBentukSediaan(e.target.value)}
            placeholder="Contoh: Injeksi, Oral, Serbuk"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="kemasan-produk">
            Kemasan <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="kemasan-produk"
            type="text"
            value={kemasan}
            onChange={(e) => setKemasan(e.target.value)}
            placeholder="Contoh: 100 ml"
            style={inputStyle}
          />
        </FieldWrap>
      </SectionCard>

      <SectionCard title="Produsen & Distribusi">
        <FieldWrap>
          <FieldLabel htmlFor="produsen-produk">
            Produsen <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="produsen-produk"
            type="text"
            value={produsen}
            onChange={(e) => setProdusen(e.target.value)}
            placeholder="Nama perusahaan produsen"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="distributor-produk" optional>Distributor</FieldLabel>
          <input
            id="distributor-produk"
            type="text"
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="no-registrasi-produk" optional>Nomor Registrasi</FieldLabel>
          <input
            id="no-registrasi-produk"
            type="text"
            value={nomorRegistrasi}
            onChange={(e) => setNomorRegistrasi(e.target.value)}
            placeholder="Contoh: DEPTAN RI No. ..."
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="foto-produk" optional>Foto Produk (URL)</FieldLabel>
          <input
            id="foto-produk"
            type="text"
            value={fotoProduk}
            onChange={(e) => setFotoProduk(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="catatan-produk" optional>Catatan</FieldLabel>
          <textarea
            id="catatan-produk"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
          />
        </FieldWrap>
        {produk && (
          <FieldWrap>
            <FieldLabel htmlFor="status-produk-obat">Status</FieldLabel>
            <select
              id="status-produk-obat"
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

// ─── Produk Card ──────────────────────────────────────────────────────────────

function ProdukCard({ produk, onEdit, onToggleStatus }: {
  produk: ObatProdukKomersial; onEdit: () => void; onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAktif = produk.status === 'aktif';
  const masterObat = getObatByUuid(produk.masterObatUuid);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', overflow: 'hidden', opacity: isAktif ? 1 : 0.6,
      }}>
        <div style={{ width: 4, background: 'var(--color-primary)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, padding: '13px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
                {produk.nama}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{produk.brandNama}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isAktif ? '#2e7d32' : '#9e9e9e', background: isAktif ? '#e8f5e9' : '#f5f5f5',
              borderRadius: 20, padding: '3px 9px', flexShrink: 0,
            }}>
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </span>
            <CardMenuButton open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Bentuk Sediaan</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{produk.bentukSediaan}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Kemasan</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{produk.kemasan}</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Master Obat: <strong style={{ color: 'var(--color-text)' }}>{masterObat?.namaGenerik ?? '—'}</strong>
          </div>
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

export default function ProdukKomersialObatAdminProduk() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('Semua');
  const [, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ObatProdukKomersial | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: SnackbarTone } | undefined>(undefined);

  const refresh = () => setTick((t) => t + 1);

  const brandList = getObatBrandListLive();
  const allProduk = OBAT_PRODUK_LIST;
  const filtered = allProduk.filter((p) => {
    const matchesQuery =
      p.nama.toLowerCase().includes(query.toLowerCase()) ||
      p.brandNama.toLowerCase().includes(query.toLowerCase()) ||
      (p.namaKomersial ?? '').toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || toFilterValue(p.status) === statusFilter;
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
          Kelola Produk
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
            placeholder="Cari produk atau brand..."
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
          {filtered.length} dari {allProduk.length} produk
        </div>
      </div>

      {/* Tambah Produk */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        {brandList.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '10px 0' }}>
            Tambahkan minimal satu Brand terlebih dahulu sebelum menambah Produk.
          </div>
        ) : (
          <TambahButton label="Tambah Produk" onClick={() => { setEditing(undefined); setFormOpen(true); }} />
        )}
      </div>

      {/* Produk list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allProduk.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>💊</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Belum ada Produk.</div>
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
          filtered.map((p) => (
            <ProdukCard
              key={p.uuid}
              produk={p}
              onEdit={() => { setEditing(p); setFormOpen(true); }}
              onToggleStatus={() => {
                if (p.status === 'aktif') {
                  const result = softDeleteObatProdukKomersial(p.uuid);
                  if (!result.ok) {
                    setSnackbar({ message: result.error ?? 'Produk tidak dapat dinonaktifkan.', tone: 'error' });
                    return;
                  }
                } else {
                  restoreObatProdukKomersial(p.uuid);
                }
                refresh();
              }}
            />
          ))
        )}
      </div>

      {formOpen && (
        <ProdukFormSheet
          produk={editing}
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
