import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  addFormula,
  updateFormula,
  getFormulaById,
  FORMULA_JENIS_LIST,
  FORMULA_BATCH_SIZE_KG,
  type BahanFormula,
  type FormulaJenis,
  type FormulaStatus,
  type SumberBahan,
  type EstimasiNutrisi,
  type AddFormulaInput,
} from '../data/formulaData';
import { getMasterPakanById, getMasterPakanByName } from '../data/masterPakanData';
import { getFormulaSelectableProdukKomersial, type FormulaProdukKomersialRef } from '../data/formulaProdukKomersialData';
import { getAllFormulaMasterPakan, type FormulaMasterPakanRef } from '../data/formulaMasterPakanData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import {
  recordCreateFormula,
  recordUpdateFormula,
  recordCreateFormulaIngredients,
} from '../services/formulaService';
import { useFormula } from '../hooks/useFormula';

// ─── FormulaEditor (FP-004) ──────────────────────────────────────────────────
// Halaman Tambah dan Edit Formula. Formula adalah TEMPLATE — tidak ada
// perubahan stok, tidak ada produksi.
// Mode ditentukan dari URL:
//   /stok-pakan/formula/tambah  → mode 'add'
//   /stok-pakan/formula/:id/edit → mode 'edit'

// ─── Tipe lokal ──────────────────────────────────────────────────────────────

interface BahanDraft extends BahanFormula {
  _key: string; // unique key for React list
}

type PickerStep =
  | { step: 'closed' }
  | { step: 'sumber'; editIndex?: number }
  | { step: 'item'; sumber: SumberBahan; editIndex?: number }
  | { step: 'detail'; sumber: SumberBahan; ref: ReferensiOption; editIndex?: number };

interface ReferensiOption {
  referensiId: string;
  sumberBahan: SumberBahan;
  nama: string;
  brand?: string;
  kategori: string;
  icon: string;
  estimasiHarga: number;
  /** Nama alternatif untuk search (namaLain / alias dari sumber data). */
  alias: string;
  /** Nilai nutrisi dari Master Pakan — null jika tidak tersedia */
  pk: number | null;
  sk: number | null;
  tdn: number | null;
}

interface DetailDraft {
  proporsi: string;
  satuan: string;
  hargaEstimasiPerKg: string;
  catatan: string;
}

interface FormErrors {
  nama?: string;
  targetTernak?: string;
  bahan?: string;
  bahan_proporsi?: string;
  bahan_duplikat?: string;
}

// ─── Auto-calculation ────────────────────────────────────────────────────────

function computeNutrisi(bahan: BahanDraft[]): EstimasiNutrisi {
  let pk = 0, sk = 0, tdn = 0;
  for (const b of bahan) {
    // Treat undefined sumberBahan as 'Master Pakan' (legacy seed data)
    if ((b.sumberBahan ?? 'Master Pakan') !== 'Master Pakan') continue;
    // Try ID lookup first; fall back to name lookup for picker IDs not in masterPakanData
    const item = getMasterPakanById(b.referensiId) ?? getMasterPakanByName(b.nama);
    if (!item) continue;
    const w = b.proporsi / 100;
    pk  += w * (item.proteinKasar ?? 0);
    sk  += w * (item.seratKasar   ?? 0);
    tdn += w * (item.tdn          ?? 0);
  }
  return {
    pk:  Math.round(pk  * 10) / 10,
    sk:  Math.round(sk  * 10) / 10,
    tdn: Math.round(tdn * 10) / 10,
  };
}

function computeHPP(bahan: BahanDraft[]): number {
  let hpp = 0;
  for (const b of bahan) {
    hpp += (b.proporsi / 100) * b.hargaEstimasiPerKg;
  }
  return Math.round(hpp);
}

/** Total berat Formula (kg) — dihitung dari proporsi bahan terhadap ukuran batch standar. */
function computeTotalBerat(bahan: BahanDraft[]): number {
  return bahan.reduce((s, b) => s + (b.proporsi / 100) * FORMULA_BATCH_SIZE_KG, 0);
}

/** Total biaya bahan baku (Rp) untuk satu batch standar. */
function computeTotalBiaya(bahan: BahanDraft[]): number {
  return bahan.reduce((s, b) => s + (b.proporsi / 100) * FORMULA_BATCH_SIZE_KG * b.hargaEstimasiPerKg, 0);
}

function bahanKey(sumberBahan: SumberBahan | undefined, referensiId: string): string {
  return `${sumberBahan ?? 'Master Pakan'}::${referensiId}`;
}

/** Menemukan referensiId+sumber yang muncul lebih dari sekali (bahan duplikat). */
function findDuplikatBahan(bahan: BahanDraft[]): Set<string> {
  const seen = new Map<string, number>();
  for (const b of bahan) {
    const key = bahanKey(b.sumberBahan, b.referensiId);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const dup = new Set<string>();
  for (const [key, count] of seen) {
    if (count > 1) dup.add(key);
  }
  return dup;
}

// ─── Primitif UI ─────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{
      margin: '0 0 10px', fontSize: 12, fontWeight: 700,
      color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
    }}>
      {title}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '14px 16px 12px' }}>{children}</div>;
}

function FieldLabel({ label, htmlFor, optional, hint }: {
  label: string; htmlFor?: string; optional?: boolean; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
        {optional && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>(opsional)</span>}
      </label>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function TextInput({ id, value, onChange, placeholder, multiline }: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    fontSize: 14, color: 'var(--color-text)', background: 'var(--color-bg)',
    outline: 'none', boxSizing: 'border-box',
  };
  if (multiline) {
    return (
      <textarea
        id={id} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...base, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
    );
  }
  return (
    <input
      id={id} type="text" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={base}
    />
  );
}

function SelectInput({ id, value, onChange, options }: {
  id?: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      id={id} value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        fontSize: 14, color: 'var(--color-text)', background: 'var(--color-bg)',
        outline: 'none', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        paddingRight: 32,
      }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 12, color: '#c62828', marginTop: 5, fontWeight: 600 }}>⚠ {msg}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)' }} />;
}

// ─── Bahan Picker ─────────────────────────────────────────────────────────────

function buildMasterPakanOptions(): ReferensiOption[] {
  return getAllFormulaMasterPakan().map((item: FormulaMasterPakanRef) => ({
    referensiId: item.id,
    sumberBahan: 'Master Pakan' as const,
    nama: item.nama,
    alias: item.alias,
    kategori: item.kategoriParent + (item.kategoriItem ? ` · ${item.kategoriItem}` : ''),
    icon: item.icon,
    estimasiHarga: item.estimasiHarga,
    pk: null,
    sk: null,
    tdn: null,
  }));
}

function buildPKOptions(): ReferensiOption[] {
  return getFormulaSelectableProdukKomersial().map((item: FormulaProdukKomersialRef) => ({
    referensiId: item.uuid,
    sumberBahan: 'Produk Komersial' as const,
    nama: item.namaProduk,
    brand: item.brandNama,
    alias: item.jenisProduk,
    kategori: item.jenisProduk,
    icon: '📦',
    estimasiHarga: 0,
    pk: null, sk: null, tdn: null,
  }));
}

const SATUAN_OPTIONS = ['kg', 'g', 'liter', 'ml', 'butir', 'sachet'];

function BahanPickerModal({
  picker, existingBahan, onClose, onSave,
}: {
  picker: PickerStep;
  existingBahan: BahanDraft[];
  onClose: () => void;
  onSave: (bahan: Omit<BahanDraft, '_key'>, editIndex?: number) => void;
}) {
  const [itemQuery, setItemQuery] = useState('');
  const [detail, setDetail] = useState<DetailDraft>({ proporsi: '', satuan: 'kg', hargaEstimasiPerKg: '', catatan: '' });
  const [detailError, setDetailError] = useState('');
  const [itemError, setItemError] = useState('');

  const mpOptions = useMemo(() => buildMasterPakanOptions(), []);
  const pkOptions = useMemo(() => buildPKOptions(), []);

  useEffect(() => {
    if (picker.step !== 'item') setItemError('');
  }, [picker.step]);

  if (picker.step === 'closed') return null;

  function isAlreadyAdded(ref: ReferensiOption, editIndex?: number): boolean {
    return existingBahan.some((b, i) =>
      i !== editIndex && bahanKey(b.sumberBahan, b.referensiId) === bahanKey(ref.sumberBahan, ref.referensiId),
    );
  }

  const handleSelectItem = (ref: ReferensiOption) => {
    if (isAlreadyAdded(ref, picker.step === 'item' ? picker.editIndex : undefined)) {
      setItemError(`"${ref.nama}" sudah ada dalam komposisi. Satu bahan hanya boleh ditambahkan sekali — edit bahan yang sudah ada jika ingin mengubah jumlahnya.`);
      return;
    }
    setItemError('');
    setDetail({
      proporsi: '',
      satuan: 'kg',
      hargaEstimasiPerKg: ref.estimasiHarga > 0 ? String(ref.estimasiHarga) : '',
      catatan: '',
    });
    setDetailError('');
    // advance to detail step — caller handles by re-rendering via picker state
    // We signal via a special local callback
    onSave({ referensiId: ref.referensiId, sumberBahan: ref.sumberBahan, nama: ref.nama,
      proporsi: 0, satuan: 'kg', hargaEstimasiPerKg: ref.estimasiHarga,
      _temp_ref: ref } as unknown as Omit<BahanDraft, '_key'>, picker.editIndex);
  };

  if (picker.step === 'sumber') {
    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Pilih Sumber Bahan</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>Bahan wajib dipilih dari katalog.</div>
          {([['Master Pakan', '🌿', 'Bahan pakan terstandarisasi dengan data nutrisi lengkap.'],
            ['Produk Komersial', '📦', 'Konsentrat, premix, dan produk komersial lainnya.']] as const).map(([sumber, icon, desc]) => (
            <button
              key={sumber} type="button"
              onClick={() => onSave({ _step: 'to-item', sumber } as unknown as Omit<BahanDraft, '_key'>, picker.editIndex)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                textAlign: 'left', padding: '14px 16px', marginBottom: 10,
                background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 26 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{sumber}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Overlay>
    );
  }

  if (picker.step === 'item') {
    const options = picker.sumber === 'Master Pakan' ? mpOptions : pkOptions;
    const q = itemQuery.toLowerCase();
    const filtered = q === '' ? options : options.filter((o) =>
      o.nama.toLowerCase().includes(q) ||
      o.alias.toLowerCase().includes(q) ||
      o.kategori.toLowerCase().includes(q) ||
      (o.brand ?? '').toLowerCase().includes(q),
    );

    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => onSave({ _step: 'back-to-sumber' } as unknown as Omit<BahanDraft, '_key'>, picker.editIndex)}
              style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', padding: 0, color: 'var(--color-muted)' }}>‹</button>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
              {picker.sumber === 'Master Pakan' ? '🌿 Pilih Master Pakan' : '📦 Pilih Produk Komersial'}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-bg)', marginBottom: 12,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>🔍</span>
            <input type="text" placeholder="Cari nama, kategori..." value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', color: 'var(--color-text)' }} />
            {itemQuery && (
              <button type="button" onClick={() => setItemQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 12, cursor: 'pointer', color: 'var(--color-muted)', padding: 0 }}>✕</button>
            )}
          </div>
          {itemError && (
            <div style={{
              marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: '#ffebee', fontSize: 12, color: '#c62828', fontWeight: 600, lineHeight: 1.5,
            }}>
              ⚠ {itemError}
            </div>
          )}
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 320, padding: '0 16px 16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-muted)', fontSize: 13 }}>
              Tidak ada bahan ditemukan.
            </div>
          ) : filtered.map((opt) => {
            const added = isAlreadyAdded(opt, picker.step === 'item' ? picker.editIndex : undefined);
            return (
              <button
                key={`${opt.sumberBahan}::${opt.kategori}::${opt.referensiId}`}
                type="button"
                onClick={() => handleSelectItem(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  textAlign: 'left', padding: '11px 12px', marginBottom: 4,
                  background: added ? 'var(--color-bg)' : 'var(--color-surface)',
                  border: added ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', opacity: added ? 0.65 : 1,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.nama}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {opt.brand ? `${opt.brand} · ` : ''}{opt.kategori}
                    {opt.pk !== null ? ` · PK ${opt.pk}%` : ''}
                  </div>
                </div>
                {added ? (
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', flexShrink: 0, textAlign: 'right' }}>
                    ✓ Ditambahkan
                  </div>
                ) : opt.estimasiHarga > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', flexShrink: 0, textAlign: 'right' }}>
                    Rp {opt.estimasiHarga.toLocaleString('id-ID')}/kg
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Overlay>
    );
  }

  if (picker.step === 'detail') {
    const ref = picker.ref;
    const handleSave = () => {
      const p = parseFloat(detail.proporsi);
      if (isNaN(p) || p <= 0) { setDetailError('Proporsi harus lebih dari 0.'); return; }
      if (p < 0) { setDetailError('Proporsi tidak boleh negatif.'); return; }
      const h = parseFloat(detail.hargaEstimasiPerKg.replace(/[^0-9.]/g, ''));
      if (isNaN(h) || h < 0) { setDetailError('Harga tidak boleh negatif.'); return; }
      setDetailError('');
      onSave({
        referensiId: ref.referensiId,
        sumberBahan: ref.sumberBahan,
        nama: ref.nama,
        proporsi: p,
        satuan: detail.satuan,
        hargaEstimasiPerKg: h,
        catatan: detail.catatan.trim() || undefined,
      }, picker.editIndex);
    };

    return (
      <Overlay onClose={onClose}>
        <div style={{ padding: '16px 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button type="button" onClick={() => onSave({ _step: 'back-to-item', sumber: ref.sumberBahan } as unknown as Omit<BahanDraft, '_key'>, picker.editIndex)}
              style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', padding: 0, color: 'var(--color-muted)' }}>‹</button>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{ref.nama}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{ref.sumberBahan} · {ref.kategori}</div>
            </div>
          </div>

          {/* Proporsi */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel label="Proporsi (%)" hint="Persentase bahan ini dalam formula keseluruhan." />
            <input
              type="number" min="0.01" max="100" step="0.1"
              placeholder="mis. 35"
              value={detail.proporsi}
              onChange={(e) => setDetail(d => ({ ...d, proporsi: e.target.value }))}
              style={{
                width: '100%', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '10px 12px', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-bg)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Satuan */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel label="Satuan" />
            <SelectInput value={detail.satuan} onChange={(v) => setDetail(d => ({ ...d, satuan: v }))} options={SATUAN_OPTIONS} />
          </div>

          {/* Harga */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel label="Estimasi Harga" hint="Rp per kg — untuk perhitungan HPP." optional />
            <input
              type="number" min="0" step="1"
              placeholder={ref.estimasiHarga > 0 ? `Prefill: ${ref.estimasiHarga}` : 'mis. 5000'}
              value={detail.hargaEstimasiPerKg}
              onChange={(e) => setDetail(d => ({ ...d, hargaEstimasiPerKg: e.target.value }))}
              style={{
                width: '100%', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '10px 12px', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-bg)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Catatan */}
          <div style={{ marginBottom: 16 }}>
            <FieldLabel label="Catatan" optional />
            <TextInput value={detail.catatan} onChange={(v) => setDetail(d => ({ ...d, catatan: v }))}
              placeholder="mis. gunakan kualitas grade A..." multiline />
          </div>

          {detailError && <ErrorMsg msg={detailError} />}

          <button
            type="button" onClick={handleSave}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--color-primary)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {picker.editIndex !== undefined ? 'Perbarui Bahan' : 'Tambah Bahan'}
          </button>
        </div>
      </Overlay>
    );
  }

  return null;
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
      }} />
      {/* Sheet */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--color-surface)',
        borderRadius: '16px 16px 0 0',
        maxWidth: 480, width: '100%', margin: '0 auto',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Status Selector ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: FormulaStatus; label: string; color: string; bg: string; desc: string }[] = [
  { value: 'Draft',  label: '🔵 Draft',  color: '#0277bd', bg: '#e1f5fe', desc: 'Belum selesai, tidak bisa diproduksi.' },
  { value: 'Aktif',  label: '🟢 Aktif',  color: '#1b7a43', bg: '#e8f5ee', desc: 'Siap digunakan untuk produksi.' },
  { value: 'Arsip',  label: '⚫ Arsip',  color: '#546e7a', bg: '#eceff1', desc: 'Tidak aktif, disimpan sebagai referensi.' },
];

// ─── Ringkasan Otomatis ───────────────────────────────────────────────────────

function RingkasanOtomatis({ bahan }: { bahan: BahanDraft[] }) {
  const totalProporsi = bahan.reduce((s, b) => s + b.proporsi, 0);
  const nutrisi       = useMemo(() => computeNutrisi(bahan), [bahan]);
  const hpp           = useMemo(() => computeHPP(bahan), [bahan]);
  const hasMPBahan    = bahan.some((b) => (b.sumberBahan ?? 'Master Pakan') === 'Master Pakan');
  const isOver100     = totalProporsi > 100.05;
  const isUnder100    = totalProporsi < 99.95 && totalProporsi > 0;

  return (
    <Card>
      {/* Total Berat */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Total Proporsi</span>
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: isOver100 ? '#c62828' : (isUnder100 ? '#e65100' : '#1b7a43'),
        }}>
          {totalProporsi.toFixed(1)}%
          {isOver100 && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6 }}>⚠ Melebihi 100%</span>}
          {isUnder100 && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6 }}>≠ 100%</span>}
        </span>
      </div>
      <Divider />

      {/* Nutrisi */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10 }}>ESTIMASI NUTRISI</div>
        {!hasMPBahan ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            Nutrisi hanya dihitung untuk bahan dari Master Pakan.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'PK', value: nutrisi.pk, color: '#1b7a43', bg: '#e8f5ee' },
              { label: 'SK', value: nutrisi.sk, color: '#7b5e2a', bg: '#fff8e1' },
              { label: 'TDN', value: nutrisi.tdn, color: '#0277bd', bg: '#e1f5fe' },
            ].map((n) => (
              <div key={n.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 18, fontWeight: 900, color: n.color, lineHeight: 1,
                  background: n.bg, borderRadius: 20, padding: '4px 10px',
                }}>{n.value}%</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 700, marginTop: 3 }}>{n.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Divider />

      {/* HPP */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Estimasi HPP</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>berdasarkan harga estimasi per bahan</div>
        </div>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#1b7a43' }}>
          Rp {hpp.toLocaleString('id-ID')}/kg
        </span>
      </div>
    </Card>
  );
}

// ─── Preview Formula ───────────────────────────────────────────────────────────

function PreviewFormula({ bahan }: { bahan: BahanDraft[] }) {
  const totalBahan = bahan.length;
  const totalBerat = computeTotalBerat(bahan);
  const totalBiaya = computeTotalBiaya(bahan);
  const hppPerKg   = computeHPP(bahan);
  const nutrisi    = useMemo(() => computeNutrisi(bahan), [bahan]);
  const hasMPBahan = bahan.some((b) => (b.sumberBahan ?? 'Master Pakan') === 'Master Pakan');

  const rows: { label: string; value: string }[] = [
    { label: 'Total Bahan', value: `${totalBahan} bahan` },
    { label: 'Total Berat', value: `${totalBerat.toFixed(1)} kg` },
    { label: 'Total Biaya', value: `Rp ${Math.round(totalBiaya).toLocaleString('id-ID')}` },
    { label: 'HPP per Kg',  value: `Rp ${hppPerKg.toLocaleString('id-ID')}/kg` },
  ];

  return (
    <Card>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>👁</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Pratinjau Formula — sebelum disimpan</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.label}>
          <div style={{ padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{r.value}</span>
          </div>
          {i < rows.length - 1 && <Divider />}
        </div>
      ))}
      <Divider />
      <div style={{ padding: '11px 16px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10 }}>RINGKASAN NUTRISI</div>
        {!hasMPBahan ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            Nutrisi hanya dihitung untuk bahan dari Master Pakan.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'PK', value: nutrisi.pk, color: '#1b7a43', bg: '#e8f5ee' },
              { label: 'SK', value: nutrisi.sk, color: '#7b5e2a', bg: '#fff8e1' },
              { label: 'TDN', value: nutrisi.tdn, color: '#0277bd', bg: '#e1f5fe' },
            ].map((n) => (
              <div key={n.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 18, fontWeight: 900, color: n.color, lineHeight: 1,
                  background: n.bg, borderRadius: 20, padding: '4px 10px',
                }}>{n.value}%</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 700, marginTop: 3 }}>{n.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function FormulaEditor() {
  const { id }       = useParams<{ id: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();
  const isEdit       = location.pathname.endsWith('/edit') && !!id;

  // Hydrate in-memory store from Supabase on hard refresh so that edit mode
  // resolves the formula correctly (FLOW-003M25).
  const { loading: formulaLoading } = useFormula();

  const existing     = isEdit ? getFormulaById(id!) : undefined;

  // ── Form state ───────────────────────────────────────────────────────
  const [nama,             setNama]             = useState(existing?.nama ?? '');
  const [jenis,            setJenis]            = useState<FormulaJenis>(existing?.jenis ?? 'Complete Feed');
  const [targetTernak,     setTargetTernak]     = useState(existing?.targetTernak ?? '');
  const [fasePemeliharaan, setFasePemeliharaan] = useState(existing?.fasePemeliharaan ?? '');
  const [tujuan,           setTujuan]           = useState(existing?.tujuan ?? '');
  const [deskripsi,        setDeskripsi]        = useState(existing?.deskripsi ?? '');
  const [status,           setStatus]           = useState<FormulaStatus>(existing?.status ?? 'Draft');
  const [bahan,            setBahan]            = useState<BahanDraft[]>(() =>
    (existing?.bahan ?? []).map((b, i) => ({ ...b, _key: `existing-${i}` })),
  );
  const [errors, setErrors]  = useState<FormErrors>({});
  const [picker, setPicker]  = useState<PickerStep>({ step: 'closed' });
  const [saved,  setSaved]   = useState(false);

  // ── Keyed counter for new bahan ─────────────────────────────────────
  const [_keyCount, setKeyCount] = useState(0);
  function nextKey() {
    const k = `bahan-${Date.now()}-${_keyCount}`;
    setKeyCount((c) => c + 1);
    return k;
  }

  // ── Picker handler ───────────────────────────────────────────────────
  // We reuse the onSave callback to handle multiple picker steps by using
  // a sentinel _step value in the draft to signal navigation between steps.
  function handlePickerSave(draft: Omit<BahanDraft, '_key'>, editIndex?: number) {
    const d = draft as Record<string, unknown>;

    if (d['_step'] === 'to-item') {
      setPicker({ step: 'item', sumber: d['sumber'] as SumberBahan, editIndex });
      return;
    }
    if (d['_step'] === 'back-to-sumber') {
      setPicker({ step: 'sumber', editIndex });
      return;
    }
    if (d['_step'] === 'back-to-item') {
      setPicker({ step: 'item', sumber: d['sumber'] as SumberBahan, editIndex });
      return;
    }
    // Selecting an item from list → advance to detail
    if (d['_temp_ref']) {
      const ref = d['_temp_ref'] as ReferensiOption;
      setPicker({ step: 'detail', sumber: ref.sumberBahan, ref, editIndex });
      return;
    }
    // Saving detail form → add/update bahan
    const newBahan: BahanDraft = { ...(draft as BahanFormula), _key: nextKey() };
    setBahan((prev) => {
      if (editIndex !== undefined) {
        const next = [...prev];
        next[editIndex] = { ...newBahan, _key: prev[editIndex]._key };
        return next;
      }
      return [...prev, newBahan];
    });
    setPicker({ step: 'closed' });
    setErrors((e) => ({ ...e, bahan: undefined, bahan_proporsi: undefined }));
  }

  function removeBahan(index: number) {
    setBahan((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBahan(index: number, dir: 'up' | 'down') {
    setBahan((prev) => {
      const next = [...prev];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // ── Validation ───────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!nama.trim()) errs.nama = 'Nama Formula wajib diisi.';
    if (!targetTernak.trim()) errs.targetTernak = 'Target Ternak wajib diisi.';
    if (bahan.length === 0) errs.bahan = 'Minimal 1 bahan harus ditambahkan.';
    const hasInvalidJumlah = bahan.some((b) => !(b.proporsi > 0));
    if (hasInvalidJumlah) errs.bahan_proporsi = 'Setiap bahan harus memiliki jumlah lebih dari 0.';
    const duplikat = findDuplikatBahan(bahan);
    if (duplikat.size > 0) errs.bahan_duplikat = 'Terdapat bahan duplikat — setiap bahan hanya boleh muncul sekali dalam komposisi.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ─────────────────────────────────────────────────────────────
  function handleSave() {
    if (!validate()) return;

    const nutrisi = computeNutrisi(bahan);
    const hpp     = computeHPP(bahan);

    const input: AddFormulaInput = {
      nama, jenis, targetTernak,
      fasePemeliharaan: fasePemeliharaan || undefined,
      tujuan:           tujuan    || undefined,
      deskripsi:        deskripsi || undefined,
      status,
      bahan: bahan.map(({ _key: _k, ...rest }) => rest),
      estimasiNutrisi: nutrisi,
      estimasiHPP: hpp,
    };

    const workspaceId = activeWorkspace?.workspace_uuid ?? '';
    const userId      = currentUser?.id ?? null;

    let targetId: string;
    if (isEdit && existing) {
      const updated = updateFormula(existing.id, input);
      targetId = updated?.id ?? existing.id;
      void recordUpdateFormula(existing.id, input).catch((err) =>
        console.error('[FormulaEditor] recordUpdateFormula failed:', err),
      );
    } else {
      const added = addFormula(input);
      targetId = added.id;
      // Chain: ingredients require the formula's Supabase UUID to be stored
      // in FORMULA_SUPABASE_ID_MAP first — only fire after formula insert resolves ok.
      void recordCreateFormula(added.id, workspaceId, userId, added)
        .then((result) => {
          if (result.ok) {
            void recordCreateFormulaIngredients(added.id, added.bahan ?? []).catch(
              (err) => console.error('[FormulaEditor] recordCreateFormulaIngredients failed:', err),
            );
          }
        })
        .catch((err) => console.error('[FormulaEditor] recordCreateFormula failed:', err));
    }

    setSaved(true);
    // Navigate to detail page after short feedback delay
    setTimeout(() => navigate(`/stok-pakan/formula/${targetId}`, { replace: true }), 300);
  }

  // ── Not-found guard (edit mode only) ─────────────────────────────────
  if (isEdit && !existing) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Formula tidak ditemukan.</div>
        <button type="button" onClick={() => navigate(-1)}
          style={{ marginTop: 20, padding: '10px 20px', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', fontSize: 14 }}>
          Kembali
        </button>
      </div>
    );
  }

  const totalProporsi  = bahan.reduce((s, b) => s + b.proporsi, 0);
  const duplikatBahan  = findDuplikatBahan(bahan);

  return (
    <>
      {/* Bahan Picker Modal */}
      <BahanPickerModal picker={picker} existingBahan={bahan} onClose={() => setPicker({ step: 'closed' })} onSave={handlePickerSave} />

      <div style={{ padding: '14px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Informasi Dasar ──────────────────────────────────────── */}
        <section>
          <SectionLabel title="Informasi Dasar" />
          <Card>
            {/* Nama Formula */}
            <FieldWrap>
              <FieldLabel label="Nama Formula" htmlFor="f-nama" />
              <TextInput id="f-nama" value={nama} onChange={setNama} placeholder="mis. Ransum Sapi Laktasi" />
              <ErrorMsg msg={errors.nama} />
            </FieldWrap>
            <Divider />

            {/* Jenis Formula */}
            <FieldWrap>
              <FieldLabel label="Jenis Formula" htmlFor="f-jenis" />
              <SelectInput id="f-jenis" value={jenis} onChange={(v) => setJenis(v as FormulaJenis)} options={FORMULA_JENIS_LIST} />
            </FieldWrap>
            <Divider />

            {/* Target Ternak */}
            <FieldWrap>
              <FieldLabel label="Target Ternak" htmlFor="f-target" hint="Spesies atau kategori ternak tujuan." />
              <TextInput id="f-target" value={targetTernak} onChange={setTargetTernak} placeholder="mis. Sapi Perah, Domba, Kambing" />
              <ErrorMsg msg={errors.targetTernak} />
            </FieldWrap>
            <Divider />

            {/* Fase Pemeliharaan */}
            <FieldWrap>
              <FieldLabel label="Fase Pemeliharaan" htmlFor="f-fase" optional hint="Fase ternak target formula ini." />
              <TextInput id="f-fase" value={fasePemeliharaan} onChange={setFasePemeliharaan} placeholder="mis. Laktasi, Finisher, Bunting Akhir" />
            </FieldWrap>
            <Divider />

            {/* Tujuan */}
            <FieldWrap>
              <FieldLabel label="Tujuan Penggunaan" htmlFor="f-tujuan" optional hint="Sub-label singkat yang muncul di daftar formula." />
              <TextInput id="f-tujuan" value={tujuan} onChange={setTujuan} placeholder="mis. Mendukung produksi susu dan kondisi tubuh sapi laktasi" multiline />
            </FieldWrap>
            <Divider />

            {/* Deskripsi */}
            <FieldWrap>
              <FieldLabel label="Deskripsi" htmlFor="f-deskripsi" optional />
              <TextInput id="f-deskripsi" value={deskripsi} onChange={setDeskripsi} placeholder="Catatan tambahan tentang formula ini..." multiline />
            </FieldWrap>
            <Divider />

            {/* Status */}
            <FieldWrap>
              <FieldLabel label="Status" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt.value;
                  return (
                    <button
                      key={opt.value} type="button"
                      onClick={() => setStatus(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        padding: '11px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        border: active ? `2px solid ${opt.color}` : '1.5px solid var(--color-border)',
                        background: active ? opt.bg : 'var(--color-bg)',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: opt.color, flex: 1 }}>{opt.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{opt.desc}</span>
                      {active && <span style={{ fontSize: 14, color: opt.color }}>✔</span>}
                    </button>
                  );
                })}
              </div>
            </FieldWrap>
          </Card>
        </section>

        {/* ── Komposisi Bahan ───────────────────────────────────────── */}
        <section>
          <SectionLabel title="Komposisi Bahan" />

          {bahan.length > 0 && (
            <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bahan.map((b, idx) => {
                const sumberLabel = (b.sumberBahan ?? 'Master Pakan') === 'Master Pakan' ? '🌿' : '📦';
                const isDup = duplikatBahan.has(bahanKey(b.sumberBahan, b.referensiId));
                return (
                  <div key={b._key} style={{
                    background: isDup ? '#ffebee' : 'var(--color-surface)',
                    border: isDup ? '1.5px solid #ef9a9a' : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  }}>
                    {/* Proporsi bar */}
                    <div style={{ height: 3, background: 'var(--color-bg)' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, b.proporsi)}%`,
                        background: 'var(--color-primary)', opacity: 0.6,
                      }} />
                    </div>
                    <div style={{ padding: '12px 12px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        background: '#e8f5ee', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1b7a43', lineHeight: 1 }}>
                          {b.proporsi}%
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sumberLabel} {b.nama}
                        </div>
                        <div style={{ fontSize: 11, color: isDup ? '#c62828' : 'var(--color-muted)', marginTop: 2, fontWeight: isDup ? 700 : 400 }}>
                          {isDup ? '⚠ Duplikat — ' : ''}{b.satuan}
                          {b.hargaEstimasiPerKg > 0 ? ` · Rp ${b.hargaEstimasiPerKg.toLocaleString('id-ID')}/kg` : ''}
                          {b.catatan ? ` · ${b.catatan}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button type="button" onClick={() => moveBahan(idx, 'up')} disabled={idx === 0}
                          style={{ border: 'none', background: 'none', fontSize: 14, cursor: idx === 0 ? 'default' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 1, color: 'var(--color-muted)', padding: '4px 6px' }}>▲</button>
                        <button type="button" onClick={() => moveBahan(idx, 'down')} disabled={idx === bahan.length - 1}
                          style={{ border: 'none', background: 'none', fontSize: 14, cursor: idx === bahan.length - 1 ? 'default' : 'pointer',
                            opacity: idx === bahan.length - 1 ? 0.3 : 1, color: 'var(--color-muted)', padding: '4px 6px' }}>▼</button>
                        <button type="button"
                          onClick={() => {
                            const ref: ReferensiOption = {
                              referensiId: b.referensiId,
                              sumberBahan: b.sumberBahan ?? 'Master Pakan',
                              nama: b.nama, kategori: '', icon: '', alias: '',
                              estimasiHarga: b.hargaEstimasiPerKg,
                              pk: null, sk: null, tdn: null,
                            };
                            setPicker({ step: 'detail', sumber: b.sumberBahan ?? 'Master Pakan', ref, editIndex: idx });
                          }}
                          style={{ border: 'none', background: 'none', fontSize: 13, cursor: 'pointer',
                            color: 'var(--color-primary)', padding: '4px 6px', fontWeight: 700 }}>✏</button>
                        <button type="button" onClick={() => removeBahan(idx)}
                          style={{ border: 'none', background: 'none', fontSize: 14, cursor: 'pointer',
                            color: '#c62828', padding: '4px 6px' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total display */}
          {bahan.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: totalProporsi > 100.05 ? '#ffebee' : totalProporsi < 99.95 ? '#fff3e0' : '#e8f5ee',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
                Total proporsi: <strong style={{ color: totalProporsi > 100.05 ? '#c62828' : totalProporsi < 99.95 ? '#e65100' : '#1b7a43' }}>
                  {totalProporsi.toFixed(1)}%
                </strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{bahan.length} bahan</span>
            </div>
          )}

          {errors.bahan && <ErrorMsg msg={errors.bahan} />}
          {errors.bahan_proporsi && <ErrorMsg msg={errors.bahan_proporsi} />}
          {errors.bahan_duplikat && <ErrorMsg msg={errors.bahan_duplikat} />}

          {/* Tambah Bahan button */}
          <button
            type="button"
            onClick={() => setPicker({ step: 'sumber' })}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--color-primary)',
              background: 'var(--color-primary-light, #e8f5ee)',
              color: 'var(--color-primary)', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
            Tambah Bahan
          </button>
        </section>

        {/* ── Analisis Formula ─────────────────────────────────────── */}
        {bahan.length > 0 && (
          <section>
            <SectionLabel title="Analisis Formula" />
            <RingkasanOtomatis bahan={bahan} />
          </section>
        )}

        {/* ── Preview Formula ──────────────────────────────────────── */}
        {bahan.length > 0 && (
          <section>
            <SectionLabel title="Pratinjau Formula" />
            <PreviewFormula bahan={bahan} />
          </section>
        )}

        {/* ── Info banner ───────────────────────────────────────────── */}
        <div style={{
          padding: '12px 14px', borderRadius: 'var(--radius-sm)',
          background: '#e8f5ee', border: '1px solid #c8e6c9',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
          <div style={{ fontSize: 12, color: '#1b7a43', lineHeight: 1.55, fontWeight: 600 }}>
            Formula yang disimpan adalah <strong>TEMPLATE resep pakan</strong> — tidak membuat produksi,
            tidak mengubah stok bahan baku, dan tidak menambah stok pakan.
          </div>
        </div>

      </div>

      {/* ── Sticky bottom bar ───────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: 'none', background: saved ? '#b0bec5' : 'var(--color-primary)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: saved ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saved ? '✔ Tersimpan…' : (isEdit ? '💾 Simpan Perubahan' : '💾 Simpan Formula')}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', marginTop: 5 }}>
          Menyimpan formula tidak mengubah stok.
        </div>
      </div>
    </>
  );
}
