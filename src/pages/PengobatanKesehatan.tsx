/**
 * PengobatanKesehatan.tsx  (KH-005)
 * ─────────────────────────────────────────────────────────────────
 * Pengobatan page — fourth step in the health workflow.
 * Route: /kesehatan-hewan/pengobatan/:id  (id = tindakanSesiId)
 *
 * Workflow: Pemeriksaan → Diagnosa → Tindakan → [Pengobatan] → Kontrol → Selesai
 *
 * Rules:
 *  - Obat ONLY from Stok Obat (not Master Obat / Produk Komersial)
 *  - Empty stok → info + navigate to /stok-obat/tambah
 *  - Validate: stok > 0, not expired, dosis ≤ stok.jumlah
 *  - Does NOT reduce stock (that's KH-006)
 *  - On save → navigate to /kesehatan-hewan/integrasi/:sesiId (KH-006)
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate }        from 'react-router-dom';
import { useWorkspace }                  from '../contexts/WorkspaceContext';
import { recordTreatments }              from '../services/healthService';

import { getTindakanSesi }          from '../data/tindakanKesehatanData';
import { getDiagnosa }              from '../data/diagnosaKesehatanData';
import { getPemeriksaan }           from '../data/pemeriksaanKesehatanData';
import {
  CARA_PEMBERIAN_OPTIONS,
  FREKUENSI_OPTIONS,
  LAMA_PEMBERIAN_OPTIONS,
  createPengobatanSesi,
  getPengobatanSesiByTindakan,
  addPengobatanItem,
  removePengobatanItem,
  finishPengobatanSesi,
  getPengobatanItemsBySesi,
  type PengobatanItem,
  type PengobatanSesi,
} from '../data/pengobatanKesehatanData';
import {
  STOK_OBAT_ITEMS,
  getStatusStok,
  type StokObatItem,
} from '../data/stokObatData';
import { getObatByUuid } from '../data/obatData';

// ─── Style constants ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const INPUT_ERR: React.CSSProperties  = { ...INPUT_STYLE, border: '1.5px solid var(--color-danger)' };
const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, minHeight: 72, resize: 'vertical', lineHeight: 1.6 };
const SELECT_STYLE: React.CSSProperties  = { ...INPUT_STYLE, cursor: 'pointer' };
const SELECT_ERR: React.CSSProperties   = { ...SELECT_STYLE, border: '1.5px solid var(--color-danger)' };

const STATUS_STOK_COLOR: Record<string, { bg: string; color: string }> = {
  Tersedia:     { bg: '#e8f5e9', color: '#2e7d32' },
  'Hampir Habis': { bg: '#fff3e0', color: '#e65100' },
  Habis:        { bg: '#ffebee', color: '#c62828' },
  Expired:      { bg: '#fce4ec', color: '#ad1457' },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px' }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

function ErrorHint({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 11.5, color: 'var(--color-danger)', fontWeight: 600, margin: '4px 0 8px' }}>
      ⚠ {msg}
    </p>
  );
}

function FieldLabel({ children, htmlFor, optional, required }: {
  children: React.ReactNode; htmlFor?: string; optional?: boolean; required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>}
      {required && <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 700 }}>*</span>}
    </label>
  );
}

// ─── Context banner ───────────────────────────────────────────────────────────

function ContextBanner({ tanggal, petugas, diagnosaNama, mode }: {
  tanggal: string; petugas: string; diagnosaNama: string; mode: string;
}) {
  return (
    <div style={{
      background: 'var(--color-primary-light)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>💊</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Pengobatan Untuk</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--color-primary)', color: '#fff', marginLeft: 'auto' }}>
          {mode === 'individu' ? 'Individu' : 'Batch'}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{diagnosaNama}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>📅 <strong>{tanggal}</strong></span>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>👤 <strong>{petugas}</strong></span>
      </div>
    </div>
  );
}

// ─── Stok Obat card (selectable) ──────────────────────────────────────────────

function StokCard({
  item, namaGenerik, statusStok, selected, selectable, onSelect,
}: {
  item: StokObatItem;
  namaGenerik: string;
  statusStok: string;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const sc = STATUS_STOK_COLOR[statusStok] ?? STATUS_STOK_COLOR['Tersedia'];
  const isDisabled = !selectable;

  const expiredDate = item.tanggalExpired
    ? new Date(item.tanggalExpired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      disabled={isDisabled}
      style={{
        width: '100%', textAlign: 'left',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        padding: '12px 14px',
        background: selected ? 'var(--color-primary-light)'
          : isDisabled ? '#fafafa' : 'var(--color-surface)',
        border: selected
          ? '2px solid var(--color-primary)'
          : isDisabled ? '1.5px solid #eee' : '1.5px solid transparent',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        opacity: isDisabled ? 0.6 : 1,
        transition: 'background 0.1s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        💊
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: isDisabled ? 'var(--color-muted)' : 'var(--color-text)' }}>
            {item.namaProduk}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0 }}>
            {statusStok}
          </span>
        </div>

        {/* Generik name */}
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 5, fontStyle: 'italic' }}>
          {namaGenerik} · {item.brand} · {item.bentukSediaan}
        </div>

        {/* Details grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px' }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-text)' }}>
            📦 <strong>{item.jumlah} {item.satuan}</strong>
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
            {item.kemasan}
          </span>
          {item.tanggalExpired && (
            <span style={{ fontSize: 11.5, color: statusStok === 'Expired' ? 'var(--color-danger)' : 'var(--color-muted)' }}>
              Exp: {expiredDate}
            </span>
          )}
          {item.lokasiPenyimpanan && (
            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
              📍 {item.lokasiPenyimpanan}
            </span>
          )}
        </div>
      </div>

      {selected && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#fff', lineHeight: 1 }}>✓</span>
        </div>
      )}
    </button>
  );
}

// ─── Added pengobatan item card ───────────────────────────────────────────────

function PengobatanCard({
  item, index, onRemove,
}: {
  item: PengobatanItem; index: number; onRemove: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{index + 1}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
          {item.namaProduk}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 5 }}>
          {item.namaGenerik} · {item.brand} · {item.bentukSediaan}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px', marginBottom: item.catatan ? 5 : 0 }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-text)' }}>
            💉 <strong>{item.dosis} {item.satuanDosis}</strong>
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{item.frekuensi}</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{item.lamaPemberian}</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>{item.caraPemberian}</span>
        </div>
        {item.catatan && (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>
            {item.catatan}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 14, color: 'var(--color-danger)',
        }}
        title="Hapus obat"
      >
        ×
      </button>
    </div>
  );
}

// ─── Penggunaan form ──────────────────────────────────────────────────────────

type ObatDraft = {
  dosis: string;
  satuanDosis: string;
  frekuensi: string;
  frekuensiCustom: string;
  lamaPemberian: string;
  lamaPemberianCustom: string;
  caraPemberian: string;
  caraPemberianCustom: string;
  catatan: string;
};

function emptyDraft(satuan: string): ObatDraft {
  return {
    dosis: '', satuanDosis: satuan,
    frekuensi: '', frekuensiCustom: '',
    lamaPemberian: '', lamaPemberianCustom: '',
    caraPemberian: '', caraPemberianCustom: '',
    catatan: '',
  };
}

function PenggunaanForm({
  stokItem,
  namaGenerik,
  onAdd,
  onCancel,
}: {
  stokItem: StokObatItem;
  namaGenerik: string;
  onAdd: (draft: ObatDraft) => string | null; // returns error msg or null
  onCancel: () => void;
}) {
  const [draft,     setDraft]     = useState<ObatDraft>(() => emptyDraft(stokItem.satuan));
  const [submitted, setSubmitted] = useState(false);
  const [extError,  setExtError]  = useState<string | null>(null);

  const resolvedFrekuensi     = draft.frekuensi === 'Lainnya'     ? draft.frekuensiCustom.trim()     : draft.frekuensi;
  const resolvedLama          = draft.lamaPemberian === 'Lainnya'  ? draft.lamaPemberianCustom.trim()  : draft.lamaPemberian;
  const resolvedCara          = draft.caraPemberian === 'Lainnya'  ? draft.caraPemberianCustom.trim()  : draft.caraPemberian;

  const errDosis    = submitted && !draft.dosis.trim();
  const errFrekuensi= submitted && !resolvedFrekuensi;
  const errLama     = submitted && !resolvedLama;
  const errCara     = submitted && !resolvedCara;

  const set = (k: keyof ObatDraft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [k]: e.target.value }));

  function handleAdd() {
    setSubmitted(true);
    setExtError(null);
    if (!draft.dosis.trim() || !resolvedFrekuensi || !resolvedLama || !resolvedCara) return;

    const finalDraft: ObatDraft = {
      ...draft,
      frekuensi:     resolvedFrekuensi,
      lamaPemberian: resolvedLama,
      caraPemberian: resolvedCara,
    };

    const err = onAdd(finalDraft);
    if (err) {
      setExtError(err);
    }
  }

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '2px dashed var(--color-primary)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--color-primary-light)',
        borderBottom: '1.5px solid var(--color-primary)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>Obat dipilih:</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
          {stokItem.namaProduk}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          {namaGenerik} · Stok: {stokItem.jumlah} {stokItem.satuan}
        </div>
      </div>

      {/* Dosis + Satuan */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel htmlFor="dosis-input" required>Dosis</FieldLabel>
            <input
              id="dosis-input" type="number" min="0.01" step="0.01"
              value={draft.dosis} onChange={set('dosis')}
              placeholder={`Maks ${stokItem.jumlah}`}
              style={errDosis ? INPUT_ERR : INPUT_STYLE}
            />
            {errDosis && <ErrorHint msg="Dosis wajib diisi." />}
          </div>
          <div>
            <FieldLabel htmlFor="satuan-input" required>Satuan</FieldLabel>
            <input
              id="satuan-input" type="text"
              value={draft.satuanDosis} onChange={set('satuanDosis')}
              placeholder="mL, mg, Botol…"
              style={INPUT_STYLE}
            />
          </div>
        </div>
        {extError && <ErrorHint msg={extError} />}
      </div>

      <Divider />

      {/* Frekuensi */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="frekuensi-select" required>Frekuensi</FieldLabel>
        <select id="frekuensi-select" value={draft.frekuensi} onChange={set('frekuensi')}
          style={errFrekuensi && !draft.frekuensiCustom ? SELECT_ERR : SELECT_STYLE}>
          <option value="">— Pilih frekuensi —</option>
          {FREKUENSI_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          <option value="Lainnya">Lainnya (isi manual)</option>
        </select>
        {draft.frekuensi === 'Lainnya' && (
          <input type="text" value={draft.frekuensiCustom} onChange={set('frekuensiCustom')}
            placeholder="Masukkan frekuensi…" style={{ ...INPUT_STYLE, marginTop: 8 }} />
        )}
        {errFrekuensi && <ErrorHint msg="Frekuensi wajib diisi." />}
      </div>

      <Divider />

      {/* Lama Pemberian */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="lama-select" required>Lama Pemberian</FieldLabel>
        <select id="lama-select" value={draft.lamaPemberian} onChange={set('lamaPemberian')}
          style={errLama && !draft.lamaPemberianCustom ? SELECT_ERR : SELECT_STYLE}>
          <option value="">— Pilih durasi —</option>
          {LAMA_PEMBERIAN_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          <option value="Lainnya">Lainnya (isi manual)</option>
        </select>
        {draft.lamaPemberian === 'Lainnya' && (
          <input type="text" value={draft.lamaPemberianCustom} onChange={set('lamaPemberianCustom')}
            placeholder="Masukkan durasi…" style={{ ...INPUT_STYLE, marginTop: 8 }} />
        )}
        {errLama && <ErrorHint msg="Lama pemberian wajib diisi." />}
      </div>

      <Divider />

      {/* Cara Pemberian */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="cara-select" required>Cara Pemberian</FieldLabel>
        <select id="cara-select" value={draft.caraPemberian} onChange={set('caraPemberian')}
          style={errCara && !draft.caraPemberianCustom ? SELECT_ERR : SELECT_STYLE}>
          <option value="">— Pilih cara —</option>
          {CARA_PEMBERIAN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {draft.caraPemberian === 'Lainnya' && (
          <input type="text" value={draft.caraPemberianCustom} onChange={set('caraPemberianCustom')}
            placeholder="Masukkan cara pemberian…" style={{ ...INPUT_STYLE, marginTop: 8 }} />
        )}
        {errCara && <ErrorHint msg="Cara pemberian wajib diisi." />}
      </div>

      <Divider />

      {/* Catatan */}
      <div style={{ padding: '14px 16px 4px' }}>
        <FieldLabel htmlFor="catatan-obat" optional>Catatan</FieldLabel>
        <textarea id="catatan-obat" value={draft.catatan} onChange={set('catatan')}
          placeholder="Instruksi khusus, observasi, dll…" style={TEXTAREA_STYLE} />
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
            background: 'var(--color-surface)', color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}>
          Batal
        </button>
        <button type="button" onClick={handleAdd}
          style={{
            flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}>
          ✓ Tambah Obat Ini
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PengobatanKesehatan() {
  const { id: tindakanSesiId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  const tindakanSesi = tindakanSesiId ? getTindakanSesi(tindakanSesiId) : null;
  const diagnosa     = tindakanSesi   ? getDiagnosa(tindakanSesi.diagnosaId) : null;
  const pemeriksaan  = diagnosa       ? getPemeriksaan(diagnosa.pemeriksaanId) : null;

  // ── Get-or-create pengobatan sesi ─────────────────────────────────────────────
  const [sesi, setSesi] = useState<PengobatanSesi | null>(null);
  useEffect(() => {
    if (!tindakanSesi) return;
    const existing = getPengobatanSesiByTindakan(tindakanSesi.id);
    if (existing) {
      setSesi(existing);
    } else {
      const created = createPengobatanSesi({
        tindakanSesiId: tindakanSesi.id,
        diagnosaId:     tindakanSesi.diagnosaId,
        pemeriksaanId:  tindakanSesi.pemeriksaanId,
      });
      setSesi(created);
    }
  }, [tindakanSesi?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stok list ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // Build stok list with generik names
  const stokWithGenerik = useMemo(() => {
    return STOK_OBAT_ITEMS.map((item) => {
      const obat = getObatByUuid(item.masterObatUuid);
      return {
        item,
        namaGenerik: obat?.namaGenerik ?? '—',
        statusStok:  getStatusStok(item),
      };
    });
  }, []);

  const usableStok = useMemo(
    () => stokWithGenerik.filter((s) => s.statusStok !== 'Habis' && s.statusStok !== 'Expired'),
    [stokWithGenerik],
  );

  const filteredStok = useMemo(() => {
    if (!searchQuery.trim()) return stokWithGenerik;
    const q = searchQuery.toLowerCase();
    return stokWithGenerik.filter(
      (s) =>
        s.item.namaProduk.toLowerCase().includes(q) ||
        s.namaGenerik.toLowerCase().includes(q) ||
        s.item.brand.toLowerCase().includes(q),
    );
  }, [stokWithGenerik, searchQuery]);

  // ── Selection & form state ────────────────────────────────────────────────────
  const [selectedStokUuid, setSelectedStokUuid] = useState<string | null>(null);
  const [showForm,         setShowForm]         = useState(false);

  // ── Items list (tick-driven refresh) ─────────────────────────────────────────
  const [tick,      setTick]      = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const items = useMemo(
    () => (sesi ? getPengobatanItemsBySesi(sesi.id) : []),
    [sesi, tick], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hasItems  = items.length > 0;
  const errNoItem = submitted && !hasItems;

  // ── Select stok card ──────────────────────────────────────────────────────────
  function handleSelectStok(uuid: string) {
    if (selectedStokUuid === uuid && showForm) {
      setSelectedStokUuid(null);
      setShowForm(false);
    } else {
      setSelectedStokUuid(uuid);
      setShowForm(true);
    }
  }

  // ── Add obat item ─────────────────────────────────────────────────────────────
  function handleAddObat(draft: ObatDraft): string | null {
    if (!sesi || !selectedStokUuid) return 'Pilih obat terlebih dahulu.';

    const stokEntry = stokWithGenerik.find((s) => s.item.uuid === selectedStokUuid);
    if (!stokEntry) return 'Obat tidak ditemukan.';

    const { item, namaGenerik, statusStok } = stokEntry;

    // Validate: not expired
    if (statusStok === 'Expired') return 'Obat sudah expired. Pilih obat lain.';

    // Validate: stock available
    if (item.jumlah <= 0) return 'Stok habis. Pilih obat lain.';

    // Validate: dosis <= stok.jumlah
    const dosisNum = parseFloat(draft.dosis);
    if (!isNaN(dosisNum) && draft.satuanDosis === item.satuan && dosisNum > item.jumlah) {
      return `Dosis (${dosisNum} ${item.satuan}) melebihi stok tersedia (${item.jumlah} ${item.satuan}).`;
    }

    addPengobatanItem({
      sesiId:         sesi.id,
      tindakanSesiId: sesi.tindakanSesiId,
      diagnosaId:     sesi.diagnosaId,
      pemeriksaanId:  sesi.pemeriksaanId,
      stokObatUuid:   item.uuid,
      namaProduk:     item.namaProduk,
      namaGenerik,
      brand:          item.brand,
      bentukSediaan:  item.bentukSediaan,
      dosis:          draft.dosis.trim(),
      satuanDosis:    draft.satuanDosis.trim(),
      frekuensi:      draft.frekuensi,
      lamaPemberian:  draft.lamaPemberian,
      caraPemberian:  draft.caraPemberian,
      catatan:        draft.catatan.trim(),
    });

    setTick((t) => t + 1);
    setSelectedStokUuid(null);
    setShowForm(false);
    return null;
  }

  // ── Remove item ───────────────────────────────────────────────────────────────
  function handleRemoveItem(itemId: string) {
    removePengobatanItem(itemId);
    setTick((t) => t + 1);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSimpan() {
    setSubmitted(true);
    if (!hasItems || !sesi) return;

    setSaving(true);
    try {
      finishPengobatanSesi(sesi.id);

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────
      // Only individu mode has a livestock_id row in health_treatments.
      if (
        pemeriksaan?.mode === 'individu' &&
        pemeriksaan.livestockId &&
        activeWorkspace?.workspace_uuid &&
        items.length > 0
      ) {
        recordTreatments(
          activeWorkspace.workspace_uuid,
          items.map((item) => ({
            livestockId:   pemeriksaan.livestockId!,
            // Use supabaseCheckupId (server UUID) not local id — the DB row was
            // created with a server-generated UUID by repoInsertCheckup().
            checkupId:     pemeriksaan?.supabaseCheckupId ?? null,
            tanggal:       pemeriksaan.tanggal,
            tipe:          'Pengobatan',
            namaObat:      item.namaProduk,
            dosis:         `${item.dosis} ${item.satuanDosis}`,
            caraPemberian: item.caraPemberian,
            catatan:       item.catatan || null,
          })),
        ).then((result) => {
          if (!result.ok) console.error('[KH-005] Supabase recordTreatments failed:', result.error);
        }).catch((err) => {
          console.error('[KH-005] Supabase recordTreatments error:', err);
        });
      }

      navigate(`/kesehatan-hewan/integrasi/${sesi.id}`);
    } catch (err) {
      console.error('[KH-005] finishPengobatanSesi failed:', err);
      setSaving(false);
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!tindakanSesi || !diagnosa || !pemeriksaan) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Data Tindakan Tidak Ditemukan</h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Pastikan Anda mengakses halaman ini melalui proses Tindakan yang benar.
        </p>
        <button type="button" onClick={() => navigate('/kesehatan-hewan')}
          style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          Kembali ke Kesehatan Hewan
        </button>
      </div>
    );
  }

  const diagnosaNama = diagnosa.sumber === 'master_penyakit'
    ? (diagnosa.namaPenyakit ?? 'Penyakit tidak diketahui')
    : (diagnosa.namaDiagnosa ?? 'Diagnosa Manual');

  const selectedStok = selectedStokUuid
    ? stokWithGenerik.find((s) => s.item.uuid === selectedStokUuid) ?? null
    : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Workflow breadcrumb ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { label: 'Pemeriksaan', done: true },
          { label: 'Diagnosa',    done: true },
          { label: 'Tindakan',    done: true },
          { label: 'Pengobatan',  done: false, active: true },
          { label: 'Selesai',     done: false },
        ].map((step, i) => (
          <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            {i > 0 && <span style={{ margin: '0 4px', color: 'var(--color-border)' }}>›</span>}
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: step.active ? 'var(--color-primary)' : step.done ? 'var(--color-primary-light)' : 'transparent',
              color: step.active ? '#fff' : step.done ? 'var(--color-primary)' : 'var(--color-muted)',
            }}>
              {step.done ? '✓ ' : ''}{step.label}
            </span>
          </span>
        ))}
      </div>

      {/* ── Context banner ──────────────────────────────────────────────────────── */}
      <ContextBanner
        tanggal={pemeriksaan.tanggal}
        petugas={pemeriksaan.petugas}
        diagnosaNama={diagnosaNama}
        mode={pemeriksaan.mode}
      />

      {/* ── Added items ─────────────────────────────────────────────────────────── */}
      {hasItems && (
        <SectionCard title={`Obat Ditambahkan (${items.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 10px' }}>
            {items.map((item, idx) => (
              <PengobatanCard key={item.id} item={item} index={idx}
                onRemove={() => handleRemoveItem(item.id)} />
            ))}
          </div>
          {!showForm && (
            <div style={{ padding: '0 12px 12px' }}>
              <button type="button"
                onClick={() => { setSelectedStokUuid(null); setShowForm(true); }}
                style={{
                  width: '100%', padding: '10px', fontSize: 13, fontWeight: 700,
                  background: 'var(--color-surface)', color: 'var(--color-primary)',
                  border: '2px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                }}>
                + Tambah Obat Lain
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {errNoItem && <ErrorHint msg="Minimal satu obat harus ditambahkan." />}

      {/* ══════════════════════════════════════════════════════════════════════════
          STOK OBAT SECTION — show when form is needed
          ══════════════════════════════════════════════════════════════════════════ */}
      {(!hasItems || showForm) && (
        <>
          {/* Empty stok state */}
          {usableStok.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: '32px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                Stok Obat Tidak Tersedia
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Semua stok obat habis atau sudah expired. Tambahkan stok obat terlebih dahulu melalui Dashboard.
              </p>
              <button type="button" onClick={() => navigate('/stok-obat/tambah')}
                style={{
                  padding: '11px 24px', fontSize: 13, fontWeight: 700,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                }}>
                💊 Tambah Stok Obat
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <SectionCard title="Pilih Obat dari Stok">
                <div style={{ padding: '12px 14px 8px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Cari nama produk atau nama generik…"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedStokUuid(null); setShowForm(false); }}
                      style={{ ...INPUT_STYLE, paddingLeft: 36 }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
                  </div>
                </div>

                {/* Stok info hint */}
                <div style={{ padding: '0 14px 10px', fontSize: 11.5, color: 'var(--color-muted)' }}>
                  {usableStok.length} dari {STOK_OBAT_ITEMS.length} item tersedia · Pilih untuk mengisi detail penggunaan
                </div>

                <Divider />

                {/* Stok list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 10px' }}>
                  {filteredStok.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                      Tidak ada obat yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredStok.map(({ item, namaGenerik, statusStok }) => {
                      const selectable = statusStok !== 'Habis' && statusStok !== 'Expired';
                      return (
                        <StokCard
                          key={item.uuid}
                          item={item}
                          namaGenerik={namaGenerik}
                          statusStok={statusStok}
                          selected={selectedStokUuid === item.uuid}
                          selectable={selectable}
                          onSelect={() => handleSelectStok(item.uuid)}
                        />
                      );
                    })
                  )}
                </div>
              </SectionCard>

              {/* Penggunaan form — shown when a stok item is selected */}
              {showForm && selectedStok && (
                <PenggunaanForm
                  stokItem={selectedStok.item}
                  namaGenerik={selectedStok.namaGenerik}
                  onAdd={handleAddObat}
                  onCancel={() => { setSelectedStokUuid(null); setShowForm(false); }}
                />
              )}

              {/* Hint when stok selected but form not open */}
              {!showForm && selectedStokUuid && (
                <div style={{
                  background: 'var(--color-primary-light)',
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', fontSize: 13, color: 'var(--color-primary)', fontWeight: 600,
                }}>
                  💡 Pilih obat di atas untuk mengisi detail penggunaan.
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Save button ─────────────────────────────────────────────────────────── */}
      {hasItems && !showForm && (
        <button type="button" onClick={handleSimpan} disabled={saving}
          style={{
            width: '100%', padding: '14px',
            background: saving ? 'var(--color-muted)' : 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}>
          {saving ? 'Menyimpan…' : '✅ Simpan Pengobatan & Lanjut ke Integrasi Stok'}
        </button>
      )}

    </div>
  );
}
