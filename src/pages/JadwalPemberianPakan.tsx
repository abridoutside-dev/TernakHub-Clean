// ─── Jadwal Pemberian Pakan — LP-004 ──────────────────────────────────────────
// Jadwal adalah PENGINGAT/template — TIDAK PERNAH mengurangi Stok Pakan dan
// TIDAK PERNAH membuat Riwayat. Realisasi tetap lewat modul Pemberian Pakan
// (LP-002/LP-003) via tombol "Laksanakan Jadwal", yang membawa data jadwal ke
// sana untuk diperiksa/diedit pengguna sebelum benar-benar disimpan.
//
// Pakan pada jadwal WAJIB berasal dari Stok Pakan (stokInventarisData.ts) —
// tidak pernah dari Master Pakan / Produk Komersial / Formula secara langsung.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import {
  buildIndividuList, buildBatchList,
  type IndividuRow, type BatchRow, type Mode,
  type PrefillFromJadwal,
} from './PemberianPakan';
import { getInventarisList, type InventarisItem } from '../data/stokInventarisData';
import {
  addJadwalPemberian, getJadwalList, getJadwalHariIni, cancelJadwal, getEffectiveStatus,
  type JadwalPemberianRecord, type JadwalPemberianItem, type JadwalPemberianJenis, type JadwalPemberianStatus,
} from '../data/jadwalPemberianPakanData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIsoDate(iso?: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const HARI_LABEL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getTargetLabel(item: IndividuRow | BatchRow): string {
  return item.name ?? item.id;
}

const STATUS_CONFIG: Record<JadwalPemberianStatus, { color: string; bg: string; label: string }> = {
  'Terjadwal':  { color: '#0277bd', bg: '#e3f2fd', label: '🗓️ Terjadwal' },
  'Terlewat':   { color: '#c62828', bg: '#ffebee', label: '⚠ Terlewat' },
  'Selesai':    { color: '#1a7a4a', bg: '#e8f5e9', label: '✅ Selesai' },
  'Dibatalkan': { color: '#546e7a', bg: '#eceff1', label: '🚫 Dibatalkan' },
};

const JENIS_CONFIG: Record<JadwalPemberianJenis, { icon: string; label: string }> = {
  'Sekali':   { icon: '1️⃣', label: 'Sekali' },
  'Harian':   { icon: '🔁', label: 'Harian' },
  'Mingguan': { icon: '📆', label: 'Mingguan' },
  'Kustom':   { icon: '⚙️', label: 'Kustom' },
};

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function EmptyState({ emoji = '📭', title, message }: { emoji?: string; title?: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{title}</div>}
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>{message}</div>
    </div>
  );
}

type ToastState = { message: string; type: 'success' | 'error' };

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useState(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t); });
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
      display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 30,
      background: toast.type === 'success' ? '#1a7a4a' : '#c62828', color: '#fff',
      fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '90vw',
    }}>
      <span style={{ fontSize: 16 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  );
}

function SegmentedControl({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 3 }}>
      {(['individu', 'batch'] as Mode[]).map((m) => (
        <button
          key={m} type="button" onClick={() => onChange(m)}
          style={{
            flex: 1, padding: '9px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: value === m ? 'var(--color-surface)' : 'transparent',
            color: value === m ? 'var(--color-primary)' : 'var(--color-muted)',
            fontWeight: 700, fontSize: 13, boxShadow: value === m ? 'var(--shadow-sm)' : 'none',
          }}
        >
          {m === 'individu' ? 'Individu' : 'Batch'}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RINGKASAN ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function RingkasanJadwal({ tick }: { tick: number }) {
  const all = getJadwalList();
  const today = todayIso();
  const hariIni = getJadwalHariIni(today).length;
  const counts = {
    Terjadwal: 0, Terlewat: 0, Selesai: 0, Dibatalkan: 0,
  } as Record<JadwalPemberianStatus, number>;
  all.forEach((r) => { counts[getEffectiveStatus(r, today)]++; });

  const cards = [
    { label: 'Jadwal Hari Ini', value: hariIni, icon: '📅', color: '#0277bd', bg: '#e3f2fd' },
    { label: 'Total Terjadwal', value: counts.Terjadwal, icon: '🗓️', color: '#1a7a4a', bg: '#e8f5e9' },
    { label: 'Terlewat',        value: counts.Terlewat,  icon: '⚠',  color: '#c62828', bg: '#ffebee' },
    { label: 'Selesai',         value: counts.Selesai,   icon: '✅', color: '#546e7a', bg: '#eceff1' },
  ];

  return (
    <section>
      <SectionLabel title="Ringkasan" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, background: bg, borderRadius: 'var(--radius-sm)', padding: '4px 10px', display: 'inline-block', minWidth: 40, textAlign: 'center' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TAB: BUAT JADWAL (pilih target) ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function TargetCard({ item, mode, onBuatJadwal }: { item: IndividuRow | BatchRow; mode: Mode; onBuatJadwal: () => void }) {
  const isIndividu = mode === 'individu';
  const sub = isIndividu ? (item as IndividuRow).type : `${(item as BatchRow).total} ekor · ${(item as BatchRow).program}`;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: item.typeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {item.icon || (isIndividu ? '🐄' : '📦')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{getTargetLabel(item)}</div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2, fontFamily: isIndividu ? 'monospace' : undefined }}>{sub}</div>
      </div>
      <button type="button" onClick={onBuatJadwal} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        + Buat Jadwal
      </button>
    </div>
  );
}

function BuatJadwalTab({
  mode, onChangeMode, onPickTarget,
}: {
  mode: Mode;
  onChangeMode: (m: Mode) => void;
  onPickTarget: (target: { kind: Mode; item: IndividuRow | BatchRow }) => void;
}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const ALL_INDIVIDU = buildIndividuList();
  const ALL_BATCH    = buildBatchList();

  const list: (IndividuRow | BatchRow)[] = mode === 'individu' ? ALL_INDIVIDU : ALL_BATCH;
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((item) => item.id.toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, list.length, mode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={onChangeMode} />
      </div>

      <div>
        <SectionLabel title="Cari Target" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', padding: '10px 12px' }}>
          <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder={mode === 'individu' ? 'Cari ID ternak atau nama...' : 'Cari ID batch atau nama...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }}
          />
          {query && <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>✕</button>}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel title={mode === 'individu' ? 'Daftar Ternak' : 'Daftar Batch'} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>{filtered.length} data</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState message="Tidak ada ternak/batch yang sesuai dengan pencarian." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((item) => (
              <TargetCard key={item.id} item={item} mode={mode} onBuatJadwal={() => onPickTarget({ kind: mode, item })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── JADWAL SHEET — 3 langkah: Pilih Pakan → Atur Jadwal → Konfirmasi ──────────
// ═══════════════════════════════════════════════════════════════════════════════

type SheetStep = 1 | 2 | 3;
type ItemDetail = { jumlah: string };

function StockRow({ item, selected, onToggle }: { item: InventarisItem; selected: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '12px 14px', cursor: 'pointer',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, border: selected ? 'none' : '2px solid var(--color-border)', background: selected ? 'var(--color-primary)' : 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <span style={{ fontSize: 11, color: '#fff', lineHeight: 1 }}>✓</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{item.nama}</div>
        {item.brand && <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>{item.brand}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>📦 {item.sumber}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: item.jumlahStok > 0 ? 'var(--color-primary)' : '#c62828' }}>⚖️ {item.jumlahStok} {item.satuan} tersedia</span>
        </div>
      </div>
    </div>
  );
}

function JadwalSheet({
  target, onClose, onSaved,
}: {
  target: { kind: Mode; item: IndividuRow | BatchRow };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep]               = useState<SheetStep>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [details, setDetails]         = useState<Record<string, ItemDetail>>({});
  const [stockQuery, setStockQuery]   = useState('');
  const [tanggal, setTanggal]         = useState(todayIso());
  const [jam, setJam]                 = useState('07:00');
  const [jenis, setJenis]             = useState<JadwalPemberianJenis>('Harian');
  const [hariMingguan, setHariMingguan] = useState<number>(new Date().getDay());
  const [intervalHari, setIntervalHari] = useState('3');
  const [catatan, setCatatan]         = useState('');
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [saveError, setSaveError]     = useState('');

  const allStock = getInventarisList();
  const filteredStock = useMemo(() => {
    const q = stockQuery.toLowerCase().trim();
    if (!q) return allStock;
    return allStock.filter((item) => item.nama.toLowerCase().includes(q) || (item.brand ?? '').toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockQuery, allStock.length]);

  const selectedItems = allStock.filter((i) => selectedIds.has(i.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setDetails((d) => { const nd = { ...d }; delete nd[id]; return nd; }); }
      else next.add(id);
      return next;
    });
  }

  function goToStep2() {
    if (selectedIds.size === 0) return;
    setDetails((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) if (!next[id]) next[id] = { jumlah: '' };
      return next;
    });
    setErrors({});
    setStep(2);
  }

  function goToStep3() {
    const newErrors: Record<string, string> = {};
    for (const item of selectedItems) {
      const raw = details[item.id]?.jumlah ?? '';
      const num = parseFloat(raw);
      if (!raw || isNaN(num) || num <= 0) newErrors[item.id] = 'Jumlah harus lebih dari 0.';
    }
    if (!tanggal) newErrors['__tanggal'] = 'Tanggal wajib diisi.';
    if (!jam) newErrors['__jam'] = 'Jam wajib diisi.';
    if (jenis === 'Kustom' && (!intervalHari || parseInt(intervalHari, 10) <= 0)) newErrors['__interval'] = 'Interval hari wajib diisi.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setStep(3);
  }

  function handleSave() {
    setSaveError('');
    try {
      const items: JadwalPemberianItem[] = selectedItems.map((inv) => ({
        inventarisId: inv.id,
        namaPakan: inv.nama,
        brand: inv.brand,
        kategori: inv.kategori,
        sumber: inv.sumber,
        jumlahRencana: parseFloat(details[inv.id]?.jumlah ?? '0'),
        satuan: inv.satuan,
      }));

      addJadwalPemberian({
        targetKind: target.kind,
        targetId: target.item.id,
        targetName: target.item.name,
        targetIcon: target.item.icon || '📦',
        targetTypeBg: target.item.typeBg || 'var(--color-bg)',
        tanggal,
        jam,
        jenis,
        hariMingguan: jenis === 'Mingguan' ? hariMingguan : undefined,
        intervalHari: jenis === 'Kustom' ? parseInt(intervalHari, 10) : undefined,
        items,
        catatan: catatan || undefined,
      });

      onClose();
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal.');
    }
  }

  const stepLabel = step === 1 ? 'Pilih Pakan' : step === 2 ? 'Atur Jadwal' : 'Konfirmasi';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,0.13)', zIndex: 301, maxHeight: '92vh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step > 1 && <button type="button" onClick={() => setStep((s) => (s - 1) as SheetStep)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-muted)', padding: 0, lineHeight: 1 }}>‹</button>}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{stepLabel}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{getTargetLabel(target.item)} · Langkah {step}/3</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--color-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '8px 20px 0', flexShrink: 0 }}>
          {([1, 2, 3] as const).map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>

        {/* ── Step 1: Pilih Pakan ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', padding: '9px 12px' }}>
                <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
                <input type="text" placeholder="Cari nama pakan..." value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--color-text)', background: 'transparent' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>{filteredStock.length} item stok · Pilih satu atau lebih pakan rencana</div>
            </div>
            <div style={{ overflowY: 'auto', padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {filteredStock.length === 0 ? (
                <EmptyState emoji="🔍" title="Tidak Ditemukan" message="Tidak ada item stok yang sesuai." />
              ) : (
                filteredStock.map((item) => <StockRow key={item.id} item={item} selected={selectedIds.has(item.id)} onToggle={() => toggleSelect(item.id)} />)
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              <button type="button" onClick={goToStep2} disabled={selectedIds.size === 0} style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: selectedIds.size > 0 ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed' }}>
                Berikutnya — {selectedIds.size} item dipilih
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Atur Jadwal ─────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Jumlah Rencana Per Pakan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedItems.map((item) => {
                    const err = errors[item.id];
                    const detail = details[item.id] ?? { jumlah: '' };
                    return (
                      <div key={item.id} style={{ background: 'var(--color-bg)', border: err ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.nama}</div>
                            {item.brand && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.brand}</div>}
                          </div>
                          <button type="button" onClick={() => toggleSelect(item.id)} style={{ border: 'none', background: 'none', fontSize: 16, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }} aria-label="Hapus item">✕</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number" min="0.1" step="0.1"
                            placeholder="Jumlah rencana"
                            value={detail.jumlah}
                            onChange={(e) => {
                              setDetails((d) => ({ ...d, [item.id]: { jumlah: e.target.value } }));
                              if (errors[item.id]) setErrors((er) => { const ne = { ...er }; delete ne[item.id]; return ne; });
                            }}
                            style={{ flex: 1, padding: '9px 12px', border: err ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>{item.satuan}</span>
                        </div>
                        {err && <div style={{ marginTop: 5, fontSize: 11, color: '#c62828' }}>⚠ {err}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Tanggal Mulai</div>
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: errors['__tanggal'] ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Jam</div>
                  <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: errors['__jam'] ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>Jenis Jadwal</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(Object.keys(JENIS_CONFIG) as JadwalPemberianJenis[]).map((j) => {
                    const isActive = jenis === j;
                    return (
                      <button key={j} type="button" onClick={() => setJenis(j)} style={{ padding: '10px 8px', borderRadius: 'var(--radius-md)', border: isActive ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)', color: isActive ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                        {JENIS_CONFIG[j].icon} {JENIS_CONFIG[j].label}
                      </button>
                    );
                  })}
                </div>

                {jenis === 'Mingguan' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Ulangi setiap hari:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {HARI_LABEL.map((label, i) => (
                        <button key={i} type="button" onClick={() => setHariMingguan(i)} style={{ padding: '7px 10px', borderRadius: 20, border: hariMingguan === i ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: hariMingguan === i ? 'var(--color-primary-light)' : 'var(--color-surface)', color: hariMingguan === i ? 'var(--color-primary)' : 'var(--color-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {label.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {jenis === 'Kustom' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Ulangi Setiap (hari)</div>
                    <input type="number" min="1" step="1" value={intervalHari} onChange={(e) => setIntervalHari(e.target.value)} placeholder="Contoh: 3" style={{ width: '100%', padding: '10px 12px', border: errors['__interval'] ? '1.5px solid #c62828' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
                  </div>
                )}

                {(errors['__tanggal'] || errors['__jam'] || errors['__interval']) && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#c62828' }}>⚠ {errors['__tanggal'] || errors['__jam'] || errors['__interval']}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Catatan (opsional)</div>
                <textarea placeholder="Tambahkan catatan untuk jadwal ini..." value={catatan} onChange={(e) => setCatatan(e.target.value)} style={{ width: '100%', minHeight: 70, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Kembali</button>
              <button type="button" onClick={goToStep3} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Konfirmasi →</button>
            </div>
          </>
        )}

        {/* ── Step 3: Konfirmasi ─────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Target</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: target.item.typeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{target.item.icon || '📦'}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{getTargetLabel(target.item)}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{target.kind === 'individu' ? 'Individu' : 'Batch'} · {target.item.id}</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Pakan ({selectedItems.length} item)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedItems.map((item) => (
                    <div key={item.id} style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.nama}</div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>{details[item.id]?.jumlah || '0'}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.satuan}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Mulai</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{formatIsoDate(tanggal)} · {jam}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Jenis</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                    {JENIS_CONFIG[jenis].icon} {JENIS_CONFIG[jenis].label}
                    {jenis === 'Mingguan' && ` · ${HARI_LABEL[hariMingguan]}`}
                    {jenis === 'Kustom' && ` · tiap ${intervalHari} hari`}
                  </span>
                </div>
                {catatan && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Catatan</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{catatan}</div>
                  </div>
                )}
              </div>

              <div style={{ padding: '10px 14px', background: '#e3f2fd', borderRadius: 'var(--radius-sm)', fontSize: 11.5, color: '#0277bd', lineHeight: 1.5 }}>
                ℹ️ Jadwal hanya pengingat — stok pakan belum dikurangi. Stok akan dikurangi hanya saat kamu menekan "Laksanakan Jadwal" dan menyimpannya lewat Pemberian Pakan.
              </div>

              {saveError && <div style={{ padding: '10px 14px', background: '#ffebee', border: '1.5px solid #c62828', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#c62828', fontWeight: 600 }}>⚠ {saveError}</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Kembali</button>
              <button type="button" onClick={handleSave} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>💾 Simpan Jadwal</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TAB: DAFTAR JADWAL ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_FILTER_OPTS: ('Semua' | JadwalPemberianStatus)[] = ['Semua', 'Terjadwal', 'Terlewat', 'Selesai', 'Dibatalkan'];

function JadwalCard({
  record, onLaksanakan, onBatalkan,
}: {
  record: JadwalPemberianRecord;
  onLaksanakan: () => void;
  onBatalkan: () => void;
}) {
  const status = getEffectiveStatus(record);
  const badge = STATUS_CONFIG[status];
  const canAct = status === 'Terjadwal' || status === 'Terlewat';
  const pakanNames = record.items.map((i) => i.namaPakan).join(', ');

  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: record.targetTypeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{record.targetIcon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>{record.targetName ?? record.targetId}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{record.targetKind === 'individu' ? 'Individu' : 'Batch'} · {record.targetId}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap' }}>{badge.label}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        🌿 {pakanNames}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: canAct ? 10 : 0 }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{JENIS_CONFIG[record.jenis].icon} {JENIS_CONFIG[record.jenis].label}</span>
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>⏰ {record.jam}</span>
        <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>📅 {formatIsoDate(record.tanggal)}</span>
        {record.jenis === 'Mingguan' && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>({HARI_LABEL[record.hariMingguan ?? new Date(`${record.tanggal}T00:00:00`).getDay()]})</span>}
        {record.jenis === 'Kustom' && <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>(tiap {record.intervalHari} hari)</span>}
      </div>

      {canAct && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onLaksanakan} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            ▶ Laksanakan Jadwal
          </button>
          <button type="button" onClick={onBatalkan} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            Batalkan
          </button>
        </div>
      )}
    </div>
  );
}

function DaftarJadwalTab({
  tick, onLaksanakan, onBatalkan,
}: {
  tick: number;
  onLaksanakan: (record: JadwalPemberianRecord) => void;
  onBatalkan: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'Semua' | JadwalPemberianStatus>('Semua');
  const all = getJadwalList();
  const filtered = statusFilter === 'Semua' ? all : all.filter((r) => getEffectiveStatus(r) === statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {STATUS_FILTER_OPTS.map((opt) => {
          const isActive = statusFilter === opt;
          return (
            <button key={opt} type="button" onClick={() => setStatusFilter(opt)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: isActive ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)', color: isActive ? 'var(--color-primary)' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {opt}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="📋" title="Belum Ada Jadwal" message="Jadwal pemberian pakan yang kamu buat akan muncul di sini." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => (
            <JadwalCard key={r.id} record={r} onLaksanakan={() => onLaksanakan(r)} onBatalkan={() => onBatalkan(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE ──────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

type PageTab = 'buat' | 'daftar';

export default function JadwalPemberianPakan() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PageTab>('daftar');
  const [mode, setMode] = useState<Mode>('individu');
  const [sheetTarget, setSheetTarget] = useState<{ kind: Mode; item: IndividuRow | BatchRow } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [tick, setTick] = useState(0);

  function handleSaved() {
    setTick((t) => t + 1);
    setToast({ message: 'Jadwal pemberian pakan berhasil dibuat.', type: 'success' });
    setTab('daftar');
  }

  function handleBatalkan(id: string) {
    cancelJadwal(id);
    setTick((t) => t + 1);
    setToast({ message: 'Jadwal dibatalkan.', type: 'success' });
  }

  function handleLaksanakan(record: JadwalPemberianRecord) {
    const prefill: PrefillFromJadwal = {
      jadwalId: record.id,
      targetKind: record.targetKind,
      targetId: record.targetId,
      items: record.items.map((i) => ({ inventarisId: i.inventarisId, jumlah: String(i.jumlahRencana) })),
      jam: record.jam,
      catatan: record.catatan ? `Dari Jadwal Pemberian — ${record.catatan}` : 'Dari Jadwal Pemberian Pakan',
    };
    navigate('/pemberian-pakan', { state: { prefillFromJadwal: prefill } });
  }

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      <RingkasanJadwal tick={tick} />

      <section>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)' }}>
          {([
            { key: 'daftar', label: 'Daftar Jadwal' },
            { key: 'buat',   label: 'Buat Jadwal' },
          ] as { key: PageTab; label: string }[]).map(({ key, label }) => {
            const isActive = tab === key;
            return (
              <button key={key} type="button" onClick={() => setTab(key)} style={{ flex: 1, padding: '10px 0', border: 'none', borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2, background: 'none', color: isActive ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ paddingTop: 20 }}>
          {tab === 'daftar' && (
            <DaftarJadwalTab tick={tick} onLaksanakan={handleLaksanakan} onBatalkan={handleBatalkan} />
          )}
          {tab === 'buat' && (
            <BuatJadwalTab mode={mode} onChangeMode={setMode} onPickTarget={setSheetTarget} />
          )}
        </div>
      </section>

      {sheetTarget && (
        <JadwalSheet target={sheetTarget} onClose={() => setSheetTarget(null)} onSaved={handleSaved} />
      )}

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
