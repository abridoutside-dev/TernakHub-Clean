// ─── Tambah Stok Obat ─────────────────────────────────────────────────────────
// Recovery RECOVERY-HOME-ADD-MEDICINE-STOCK-001
// Findings fixed: A-001, A-002, A-003, F-001, F-002
//
// Alur 2-langkah:
//   Step 1 (picker) — Pilih produk dari katalog Produk Komersial Obat.
//   Step 2 (form)   — Isi detail batch stok (jumlah, satuan, tanggal, lokasi).
//   Simpan          — Validasi → addStokObatItem() → navigate('/stok-obat').

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getObatProdukKomersialList,
  type ObatProdukKomersial,
} from '../services/drugCommercialProductService';
import { addStokObatItem } from '../data/stokObatData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { addStokItem, addStokMasuk } from '../services/stokObatService';
import { useStokObat } from '../hooks/useStokObat';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const SATUAN_OPTIONS = [
  'Botol', 'Vial', 'Ampul', 'Sachet',
  'Strip', 'Tablet', 'Kapsul',
  'kg', 'gram', 'liter', 'mL',
];

/** Default satuan berdasarkan bentukSediaan produk. */
function guessDefaultSatuan(bentukSediaan: string): string {
  const b = bentukSediaan.toLowerCase();
  if (b.includes('injeksi') || b.includes('cair'))   return 'Botol';
  if (b.includes('serbuk'))                           return 'Sachet';
  if (b.includes('tablet'))                           return 'Tablet';
  if (b.includes('kapsul'))                           return 'Kapsul';
  if (b.includes('vial'))                             return 'Vial';
  if (b.includes('ampul'))                            return 'Ampul';
  return 'Botol';
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

function FieldLabel({
  children, htmlFor, optional,
}: {
  children: React.ReactNode; htmlFor?: string; optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && (
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>(opsional)</span>
      )}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--color-danger, #c62828)', fontWeight: 600, marginTop: 6 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

// ─── Step 1: Produk Picker ────────────────────────────────────────────────────

function ProdukPickerStep({
  onSelect,
}: {
  onSelect: (produk: ObatProdukKomersial) => void;
}) {
  const [query, setQuery] = useState('');
  const [katalog, setKatalog] = useState<ObatProdukKomersial[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadKatalog() {
      try {
        const products = await getObatProdukKomersialList();
        if (cancelled) return;
        setKatalog(products.filter((p) => p.status === 'aktif'));
      } catch {
        if (!cancelled) setKatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadKatalog();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return katalog;
    const q = query.toLowerCase();
    return katalog.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.brandNama.toLowerCase().includes(q) ||
        p.bentukSediaan.toLowerCase().includes(q) ||
        (p.namaKomersial?.toLowerCase().includes(q)),
    );
  }, [katalog, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Search bar */}
      <div style={{
        position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 90,
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama produk, brand, bentuk sediaan…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                border: 'none', outline: 'none', flex: 1, fontSize: 14,
                color: 'var(--color-text)', background: 'transparent',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          fontSize: 12, color: 'var(--color-muted)', fontWeight: 500,
          background: 'var(--color-primary-light, #e8f0fe)',
          borderRadius: 'var(--radius-sm)', padding: '8px 12px',
          border: '1px solid var(--color-border)',
        }}>
          💊 Pilih produk dari katalog Produk Komersial Obat. Detail stok diisi di langkah berikutnya.
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '10px 16px 120px', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1 }}>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Produk tidak ditemukan
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Coba kata kunci lain atau cek ejaan.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>
              {filtered.length} produk aktif ditemukan
            </div>
            {filtered.map((produk) => (
              <button
                key={produk.uuid}
                type="button"
                onClick={() => onSelect(produk)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {/* Icon badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: 'var(--color-primary-light, #e8f0fe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  💊
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
                    {produk.nama}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
                    🏷️ {produk.brandNama}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#1565c0', background: '#e3f2fd',
                      borderRadius: 20, padding: '2px 7px',
                    }}>
                      {produk.bentukSediaan}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#37474f', background: '#eceff1',
                      borderRadius: 20, padding: '2px 7px',
                    }}>
                      {produk.kemasan}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Detail Form ──────────────────────────────────────────────────────

interface FormState {
  jumlah: string;
  satuan: string;
  tanggalMasuk: string;
  tanggalExpired: string;
  lokasiPenyimpanan: string;
  nomorBatch: string;
}

function DetailFormStep({
  produk,
  onBack,
}: {
  produk: ObatProdukKomersial;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { refresh: refreshStokObat } = useStokObat();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>({
    jumlah: '',
    satuan: guessDefaultSatuan(produk.bentukSediaan),
    tanggalMasuk: today,
    tanggalExpired: '',
    lokasiPenyimpanan: '',
    nomorBatch: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): Partial<Record<keyof FormState, string>> {
    const errs: Partial<Record<keyof FormState, string>> = {};
    const jumlahNum = Number(form.jumlah);
    if (form.jumlah.trim() === '' || Number.isNaN(jumlahNum) || jumlahNum <= 0) {
      errs.jumlah = 'Jumlah harus lebih dari 0.';
    }
    if (!form.satuan) {
      errs.satuan = 'Satuan wajib dipilih.';
    }
    if (!form.tanggalMasuk) {
      errs.tanggalMasuk = 'Tanggal Masuk wajib diisi.';
    }
    return errs;
  }

  function handleSimpan() {
    setFormError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      addStokObatItem({
        workspaceUuid: activeWorkspace?.workspace_uuid ?? '',
        produkKomersialUuid: produk.uuid,
        masterObatUuid: produk.masterObatUuid ?? '',
        brand: produk.brandNama,
        namaProduk: produk.nama,
        bentukSediaan: produk.bentukSediaan,
        kemasan: produk.kemasan,
        jumlah: Number(form.jumlah),
        satuan: form.satuan,
        tanggalMasuk: form.tanggalMasuk,
        tanggalExpired: form.tanggalExpired || null,
        lokasiPenyimpanan: form.lokasiPenyimpanan || undefined,
        nomorBatch: form.nomorBatch || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/stok-obat'), 900);

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────
      // Phase 1 (in-memory) already executed above. Phase 2 persists to Supabase.
      // Failures are logged but never block the UI — user already sees success.
      if (activeWorkspace?.workspace_uuid) {
        const wsId = activeWorkspace.workspace_uuid;
        const jumlahNum = Number(form.jumlah);
        addStokItem(wsId, {
          namaProduk:          produk.nama,
          brand:               produk.brandNama,
          bentukSediaan:       produk.bentukSediaan,
          kemasan:             produk.kemasan,
          produkKomersialUuid: produk.uuid,
          masterObatUuid:      produk.masterObatUuid ?? '',
          satuan:              form.satuan,
          tanggalMasuk:        form.tanggalMasuk,
          tanggalExpired:      form.tanggalExpired || null,
          lokasiPenyimpanan:   form.lokasiPenyimpanan || undefined,
          nomorBatch:          form.nomorBatch || undefined,
        }).then((result) => {
          if (!result.ok) {
            console.error('[TambahStokObat] Supabase addStokItem failed:', result.error);
            return Promise.resolve(null);
          }
          return addStokMasuk(wsId, result.data.id, {
            jumlah:       jumlahNum,
            tanggalMasuk: form.tanggalMasuk,
          });
        }).then((result) => {
          if (result && !result.ok) {
            console.error('[TambahStokObat] Supabase addStokMasuk failed:', result.error);
          } else {
            refreshStokObat();
          }
        }).catch((err) => {
          console.error('[TambahStokObat] Supabase dual-write error:', err);
        });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan stok obat.');
    }
  }

  return (
    <div style={{
      padding: '20px 16px 120px', maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>

      {/* ── Ringkasan Produk Terpilih ── */}
      <SectionCard title="Produk Dipilih">
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary-light, #e8f0fe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>
            💊
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              {produk.nama}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
              🏷️ {produk.brandNama}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#1565c0', background: '#e3f2fd',
                borderRadius: 20, padding: '2px 7px',
              }}>
                {produk.bentukSediaan}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#37474f', background: '#eceff1',
                borderRadius: 20, padding: '2px 7px',
              }}>
                {produk.kemasan}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              color: 'var(--color-primary)', background: 'none',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Ganti
          </button>
        </div>
      </SectionCard>

      {/* ── Detail Stok ── */}
      <SectionCard title="Detail Stok">

        {/* Jumlah + Satuan */}
        <FieldWrap>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 12 }}>
            <div>
              <FieldLabel htmlFor="jumlah">
                Jumlah <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
              </FieldLabel>
              <input
                id="jumlah"
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 10"
                value={form.jumlah}
                onChange={(e) => set('jumlah', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: `1.5px solid ${errors.jumlah ? 'var(--color-danger, #c62828)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.jumlah && <ErrorText>{errors.jumlah}</ErrorText>}
            </div>

            <div>
              <FieldLabel htmlFor="satuan">
                Satuan <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
              </FieldLabel>
              <select
                id="satuan"
                value={form.satuan}
                onChange={(e) => set('satuan', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: `1.5px solid ${errors.satuan ? 'var(--color-danger, #c62828)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', outline: 'none', appearance: 'none', cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="" disabled>— Pilih —</option>
                {SATUAN_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.satuan && <ErrorText>{errors.satuan}</ErrorText>}
            </div>
          </div>
        </FieldWrap>

        <Divider />

        {/* Tanggal Masuk + Tanggal Kedaluwarsa */}
        <FieldWrap>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 12 }}>
            <div>
              <FieldLabel htmlFor="tanggal-masuk">
                Tanggal Masuk <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
              </FieldLabel>
              <input
                id="tanggal-masuk"
                type="date"
                value={form.tanggalMasuk}
                onChange={(e) => set('tanggalMasuk', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: `1.5px solid ${errors.tanggalMasuk ? 'var(--color-danger, #c62828)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.tanggalMasuk && <ErrorText>{errors.tanggalMasuk}</ErrorText>}
            </div>

            <div>
              <FieldLabel htmlFor="tanggal-expired" optional>
                Tgl. Kedaluwarsa
              </FieldLabel>
              <input
                id="tanggal-expired"
                type="date"
                value={form.tanggalExpired}
                onChange={(e) => set('tanggalExpired', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </FieldWrap>

        <Divider />

        {/* Lokasi Penyimpanan */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="lokasi" optional>Lokasi Penyimpanan</FieldLabel>
            <input
              id="lokasi"
              type="text"
              placeholder="Contoh: Lemari Obat A, Gudang Cadangan…"
              value={form.lokasiPenyimpanan}
              onChange={(e) => set('lokasiPenyimpanan', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </FieldWrap>

        <Divider />

        {/* Nomor Batch */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="nomor-batch" optional>Nomor Batch Produksi</FieldLabel>
            <input
              id="nomor-batch"
              type="text"
              placeholder="Contoh: OXY-2026-07A"
              value={form.nomorBatch}
              onChange={(e) => set('nomorBatch', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
                color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </FieldWrap>
      </SectionCard>

      {/* Error banner */}
      {formError && (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          fontSize: 13, fontWeight: 600, color: '#c62828',
        }}>
          {formError}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div style={{
          background: '#e8f5ee', border: '1.5px solid #a5d6b7',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          fontSize: 13, fontWeight: 600, color: '#1b7a43',
        }}>
          ✅ Stok obat berhasil ditambahkan.
        </div>
      )}

      {/* Bottom buttons */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
        padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={success}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-muted)', fontSize: 15, fontWeight: 600,
            cursor: success ? 'default' : 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSimpan}
          disabled={success}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)', border: 'none',
            background: success ? 'var(--color-muted)' : 'var(--color-primary)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: success ? 'default' : 'pointer',
          }}
        >
          Simpan
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TambahStokObat() {
  const [step, setStep] = useState<'picker' | 'form'>('picker');
  const [selectedProduk, setSelectedProduk] = useState<ObatProdukKomersial | null>(null);

  function handleSelectProduk(produk: ObatProdukKomersial) {
    setSelectedProduk(produk);
    setStep('form');
  }

  function handleBackToPicker() {
    setStep('picker');
    setSelectedProduk(null);
  }

  if (step === 'form' && selectedProduk) {
    return (
      <DetailFormStep
        produk={selectedProduk}
        onBack={handleBackToPicker}
      />
    );
  }

  return <ProdukPickerStep onSelect={handleSelectProduk} />;
}
