import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildAllMasterPakanPickerItems } from '../data/masterPakanPickerData';
import { KATEGORI_INDUK } from '../data/masterPakanKategoriData';
import { getProdukKomersialList, type ProdukKomersialItem } from '../data/produkKomersialData';
import { getPKKategoriNama, getPKKategoriIcon, PK_KATEGORI_NAMA } from '../data/produkKomersialKategoriNama';
import { addInventarisFromTambahStok, type InventarisSumber } from '../data/stokInventarisData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { recordTambahStok } from '../services/stokInventarisService';

// ─── Reference type ───────────────────────────────────────────────────────────

interface SelectedRef {
  referensiId: string;
  nama: string;
  kategori: string;
  subKategori?: string;
  satuan: string;
  sumber: InventarisSumber;
  brand?: string;
  icon: string;
  namaLain?: string;   // alias / nama alternatif (search only)
  produsen?: string;   // produsen / manufacturer (search only, Produk Komersial)
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '16px 16px 4px' }}>{children}</div>;
}

function FieldLabel({ children, htmlFor, optional }: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>
      )}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

// ─── Reference Picker Sheet ───────────────────────────────────────────────────

type CatalogSumber = 'Master Pakan' | 'Produk Komersial';

function buildMasterItems(): SelectedRef[] {
  return buildAllMasterPakanPickerItems().map(item => ({
    referensiId: item.referensiId,
    nama:        item.nama,
    kategori:    item.kategori,
    subKategori: item.subKategori,
    satuan:      item.satuan,
    sumber:      'Master Pakan' as InventarisSumber,
    icon:        item.icon,
    ...(item.namaLain ? { namaLain: item.namaLain } : {}),
  }));
}

function buildKomersialItems(): SelectedRef[] {
  return getProdukKomersialList().map((item: ProdukKomersialItem) => ({
    referensiId: item.id,
    nama: item.nama,
    kategori: item.jenisProduk ?? getPKKategoriNama(item.kategoriSlug ?? ''),
    satuan: item.satuanDefault ?? 'Kg',
    sumber: 'Produk Komersial' as InventarisSumber,
    brand: item.merek,
    icon: getPKKategoriIcon(item.kategoriSlug ?? ''),
    ...(item.produsen ? { produsen: item.produsen } : {}),
  }));
}

// ─── Category option shape ────────────────────────────────────────────────────

interface KategoriOption {
  slug: string;   // used as key; '' = "Semua Kategori"
  nama: string;   // display label — always a proper name, never a slug
}

/** Derive official category list from the master reference for the active source. */
function buildKategoriOptions(sumber: CatalogSumber): KategoriOption[] {
  if (sumber === 'Master Pakan') {
    return KATEGORI_INDUK.map(k => ({ slug: k.slug, nama: k.nama }));
  }
  // Produk Komersial — PK_KATEGORI_NAMA is the official SSOT; slug → nama
  return Object.entries(PK_KATEGORI_NAMA).map(([slug, nama]) => ({ slug, nama }));
}

function ReferensiPickerSheet({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (ref: SelectedRef) => void;
}) {
  const [activeSumber, setActiveSumber] = useState<CatalogSumber>('Master Pakan');
  const [query, setQuery] = useState('');
  // '' means "Semua Kategori" (show all); non-empty means filter to that kategori nama
  const [activeKategori, setActiveKategori] = useState('');

  const allItems = activeSumber === 'Master Pakan' ? buildMasterItems() : buildKomersialItems();
  const q = query.toLowerCase();
  // Filter pipeline: category first, then search within the category results
  const filtered = allItems
    .filter(item => !activeKategori || item.kategori === activeKategori)
    .filter(item =>
      !q ||
      item.nama.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q) ||
      (item.subKategori  && item.subKategori.toLowerCase().includes(q)) ||
      (item.brand        && item.brand.toLowerCase().includes(q)) ||
      (item.namaLain     && item.namaLain.toLowerCase().includes(q)) ||
      (item.produsen     && item.produsen.toLowerCase().includes(q))
    );

  const kategoriOptions = buildKategoriOptions(activeSumber);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Pilih Referensi Pakan</span>
            <button type="button" onClick={onClose}
              style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>
              ✕
            </button>
          </div>

          {/* Source chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['Master Pakan', 'Produk Komersial'] as CatalogSumber[]).map((s) => {
              const active = activeSumber === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setActiveSumber(s); setQuery(''); setActiveKategori(''); }}
                  style={{
                    padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-muted)',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Category filter — horizontal scroll, sourced from official category reference */}
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10,
            // Hide scrollbar visually but keep it functional
            scrollbarWidth: 'none',
          }}>
            {/* "Semua Kategori" — always first */}
            <button
              type="button"
              onClick={() => setActiveKategori('')}
              style={{
                flexShrink: 0,
                padding: '6px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: !activeKategori
                  ? '1.5px solid var(--color-primary)'
                  : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: !activeKategori ? 'var(--color-primary-light)' : 'var(--color-bg)',
                color: !activeKategori ? 'var(--color-primary)' : 'var(--color-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              Semua Kategori
            </button>

            {kategoriOptions.map((opt) => {
              const isActive = activeKategori === opt.nama;
              return (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => setActiveKategori(opt.nama)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: isActive
                      ? '1.5px solid var(--color-primary)'
                      : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: isActive ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.nama}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <input
              type="text"
              placeholder={`Cari ${activeSumber === 'Master Pakan' ? 'bahan pakan...' : 'produk komersial...'}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', color: 'var(--color-text)' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', padding: '0 16px 32px', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              fontSize: 13, color: 'var(--color-muted)',
            }}>
              {query ? 'Tidak ditemukan.' : `Belum ada data ${activeSumber}.`}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.referensiId}
                type="button"
                onClick={() => { onSelect(item); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', textAlign: 'left',
                  padding: '13px 0',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                    {item.nama}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--color-primary)',
                      background: 'var(--color-primary-light)', borderRadius: 20, padding: '2px 8px',
                    }}>
                      {item.kategori}
                    </span>
                    {item.subKategori && item.subKategori !== item.kategori && (
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.subKategori}</span>
                    )}
                    {item.brand && (
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.brand}</span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TambahStokPakan() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const today = new Date().toISOString().split('T')[0];

  // Step 1: Reference picker
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [selectedRef, setSelectedRef]   = useState<SelectedRef | null>(null);

  // Step 2: Detail fields (all controlled)
  const [jumlah,             setJumlah]             = useState('');
  const [hargaTotal,         setHargaTotal]         = useState('');
  const [supplier,           setSupplier]           = useState('');
  const [tanggalMasuk,       setTanggalMasuk]       = useState(today);
  const [lokasiPenyimpanan,  setLokasiPenyimpanan]  = useState('');
  const [catatan,            setCatatan]            = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  function handleSimpan() {
    if (!selectedRef) {
      setErrorMsg('Pilih referensi pakan terlebih dahulu.');
      return;
    }
    const qty = parseFloat(jumlah);
    if (!jumlah || isNaN(qty) || qty <= 0) {
      setErrorMsg('Masukkan jumlah stok yang valid (lebih dari 0).');
      return;
    }
    setErrorMsg('');

    const harga = hargaTotal ? parseFloat(hargaTotal) : undefined;
    const hargaBeli = harga && qty > 0 ? Math.round(harga / qty) : undefined;

    const newItem = addInventarisFromTambahStok({
      referensiId: selectedRef.referensiId,
      nama: selectedRef.nama,
      brand: selectedRef.brand,
      kategori: selectedRef.kategori,
      sumber: selectedRef.sumber,
      jumlahStok: qty,
      satuan: selectedRef.satuan,
      hargaBeli,
      supplier: supplier.trim() || undefined,
      lokasiPenyimpanan: lokasiPenyimpanan.trim() || undefined,
      tanggalMasuk,
      catatan: catatan.trim() || undefined,
    });

    // Phase 2: fire-and-forget Supabase dual-write
    if (activeWorkspace?.workspace_uuid) {
      void recordTambahStok(activeWorkspace.workspace_uuid, {
        itemId:       newItem.id,
        itemName:     selectedRef.nama,
        sumber:       selectedRef.sumber,
        unit:         selectedRef.satuan,
        jumlah:       qty,
        tanggal:      tanggalMasuk,
        referensiId:  selectedRef.referensiId,
        hargaBeli,
        brand:        selectedRef.brand,
        supplier:     supplier.trim() || undefined,
        catatan:      catatan.trim() || undefined,
        kategori:     selectedRef.kategori,
      }).then((r) => { if (!r.ok) console.warn('[TambahStokPakan] dual-write:', r.error); });
    }

    navigate('/stok-pakan');
  }

  const icon = selectedRef?.icon ?? null;

  return (
    <>
      <div style={{
        padding: '20px 16px 120px',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* ── Referensi Pakan ──────────────────────────────────────────────── */}
        <SectionCard title="Referensi Pakan">
          <div style={{ padding: '16px' }}>
            <FieldLabel>
              Pilih Pakan dari Katalog <span style={{ color: 'var(--color-danger)' }}>*</span>
            </FieldLabel>

            {selectedRef ? (
              /* Selected state */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--color-primary-light)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2, marginBottom: 4 }}>
                    {selectedRef.nama}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: 'var(--color-primary)', background: '#fff',
                      borderRadius: 20, padding: '2px 8px',
                      border: '1px solid var(--color-primary)',
                    }}>
                      {selectedRef.kategori}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', opacity: 0.8 }}>
                      {selectedRef.sumber}
                    </span>
                    {selectedRef.brand && (
                      <span style={{ fontSize: 11, color: 'var(--color-primary)', opacity: 0.8 }}>
                        • {selectedRef.brand}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                    background: '#fff', color: 'var(--color-primary)', flexShrink: 0,
                  }}
                >
                  Ganti
                </button>
              </div>
            ) : (
              /* Empty state — open picker */
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', textAlign: 'left',
                  padding: '14px 16px',
                  background: 'var(--color-bg)',
                  border: '1.5px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  🌿
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 2 }}>
                    Pilih dari Katalog
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', opacity: 0.7 }}>
                    Master Pakan atau Produk Komersial
                  </div>
                </div>
              </button>
            )}

            {/* Auto-filled fields: Kategori + Satuan */}
            {selectedRef && (
              <>
                <div style={{ height: 12 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
                      Kategori
                    </div>
                    <div style={{
                      padding: '10px 12px', fontSize: 13, fontWeight: 600,
                      background: 'var(--color-bg)',
                      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-muted)',
                    }}>
                      {selectedRef.kategori}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
                      Satuan
                    </div>
                    <div style={{
                      padding: '10px 12px', fontSize: 13, fontWeight: 600,
                      background: 'var(--color-bg)',
                      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-muted)',
                    }}>
                      {selectedRef.satuan}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* ── Stok Masuk ──────────────────────────────────────────────────── */}
        <SectionCard title="Stok Masuk">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="jumlah">
                Jumlah <span style={{ color: 'var(--color-danger)' }}>*</span>
              </FieldLabel>
              <input
                id="jumlah"
                type="number"
                min="0"
                step="0.01"
                placeholder={`Contoh: 50${selectedRef ? ` (${selectedRef.satuan})` : ''}`}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
              />
            </div>
          </FieldWrap>
        </SectionCard>

        {/* ── Sumber ──────────────────────────────────────────────────────── */}
        <SectionCard title="Sumber">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="supplier" optional>Supplier / Asal</FieldLabel>
              <input
                id="supplier"
                type="text"
                placeholder="Contoh: Toko Pakan Maju, Pak Budi"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          </FieldWrap>
        </SectionCard>

        {/* ── Tanggal ─────────────────────────────────────────────────────── */}
        <SectionCard title="Tanggal">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="tanggal-masuk">Tanggal Masuk</FieldLabel>
              <input
                id="tanggal-masuk"
                type="date"
                value={tanggalMasuk}
                onChange={(e) => setTanggalMasuk(e.target.value)}
              />
            </div>
          </FieldWrap>
        </SectionCard>

        {/* ── Harga ───────────────────────────────────────────────────────── */}
        <SectionCard title="Harga">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="harga-total" optional>Harga Total</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, fontWeight: 600, color: 'var(--color-muted)', pointerEvents: 'none',
                }}>
                  Rp
                </span>
                <input
                  id="harga-total"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={hargaTotal}
                  onChange={(e) => setHargaTotal(e.target.value)}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>
          </FieldWrap>
        </SectionCard>

        {/* ── Lokasi Penyimpanan ──────────────────────────────────────────── */}
        <SectionCard title="Lokasi">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="lokasi" optional>Lokasi Penyimpanan</FieldLabel>
              <input
                id="lokasi"
                type="text"
                placeholder="Contoh: Gudang A, Lemari Pakan"
                value={lokasiPenyimpanan}
                onChange={(e) => setLokasiPenyimpanan(e.target.value)}
              />
            </div>
          </FieldWrap>
        </SectionCard>

        {/* ── Catatan ─────────────────────────────────────────────────────── */}
        <SectionCard title="Catatan">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="catatan" optional>Catatan</FieldLabel>
              <textarea
                id="catatan"
                placeholder="Contoh: Pakan dari supplier baru, kualitas baik..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>
          </FieldWrap>
        </SectionCard>

        {/* Error message */}
        {errorMsg && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: '#ffebee', border: '1.5px solid #ef9a9a',
            fontSize: 13, fontWeight: 600, color: '#c62828',
          }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* ── Bottom Buttons ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)', color: 'var(--color-muted)',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSimpan}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: 'none',
            background: selectedRef ? 'var(--color-primary)' : 'var(--color-muted)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Simpan
        </button>
      </div>

      {/* ── Reference Picker Sheet ───────────────────────────────────────────── */}
      {pickerOpen && (
        <ReferensiPickerSheet
          onClose={() => setPickerOpen(false)}
          onSelect={(ref) => {
            // Terapkan referensi yang dipilih, lalu bersihkan seluruh field detail
            // agar tidak ada sisa data dari item sebelumnya (BUG-008).
            // tanggalMasuk sengaja dipertahankan — pengguna mungkin mencatat beberapa
            // item pada tanggal penerimaan yang sama.
            setSelectedRef(ref);
            setJumlah('');
            setHargaTotal('');
            setSupplier('');
            setLokasiPenyimpanan('');
            setCatatan('');
            setErrorMsg('');
          }}
        />
      )}
    </>
  );
}
