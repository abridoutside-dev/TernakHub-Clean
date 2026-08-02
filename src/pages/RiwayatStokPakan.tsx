import { useState } from 'react';
import { getAllRiwayatEntries, type RiwayatEntry } from '../data/riwayatStokPakanData';

// ─── Type config ──────────────────────────────────────────────────────────────

type TxType = 'masuk' | 'keluar' | 'penyesuaian';

const TYPE_CONFIG: Record<TxType, { icon: string; color: string; bg: string; accent: string; label: string; sign: '+' | '-' | '±' }> = {
  masuk:       { icon: '⬆️', color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43', label: 'Stok Masuk',   sign: '+' },
  keluar:      { icon: '⬇️', color: '#e65100', bg: '#fff3e0', accent: '#ef6c00', label: 'Stok Keluar',  sign: '-' },
  penyesuaian: { icon: '🔄', color: '#0277bd', bg: '#e1f5fe', accent: '#0288d1', label: 'Penyesuaian',  sign: '±' },
};

function entryTxType(entry: RiwayatEntry): TxType {
  if (entry.sumber === 'Penyesuaian Stok') return 'penyesuaian';
  return entry.kategori === 'Masuk' ? 'masuk' : 'keluar';
}

function fmtDatetime(isoTs: string): string {
  try {
    const d = new Date(isoTs);
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()];
    const tgl = String(d.getDate()).padStart(2, '0');
    const jam = String(d.getHours()).padStart(2, '0');
    const mnt = String(d.getMinutes()).padStart(2, '0');
    return `${tgl} ${bulan} ${d.getFullYear()}, ${jam}:${mnt}`;
  } catch {
    return isoTs;
  }
}

const FILTER_TABS = [
  { key: 'all',         label: 'Semua' },
  { key: 'masuk',       label: 'Stok Masuk' },
  { key: 'keluar',      label: 'Stok Keluar' },
  { key: 'penyesuaian', label: 'Penyesuaian' },
];

const SUMBER_OPTIONS = [
  { value: 'Tambah Stok',      label: 'Tambah Stok',      icon: '⬆️' },
  { value: 'Marketplace',      label: 'Marketplace',      icon: '🛒' },
  { value: 'Produksi Formula', label: 'Produksi Formula', icon: '🏭' },
  { value: 'Perubahan Stok',   label: 'Perubahan Stok',   icon: '⬇️' },
  { value: 'Pemberian Pakan',  label: 'Pemberian Pakan',  icon: '🌿' },
  { value: 'Penyesuaian Stok', label: 'Penyesuaian',      icon: '🔄' },
  { value: 'Pindah Gudang',    label: 'Pindah Gudang',    icon: '📦' },
];

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

interface FilterSheetProps {
  onClose: () => void;
  sumber: string;
  setSumber: (v: string) => void;
  tanggalDari: string;
  setTanggalDari: (v: string) => void;
  tanggalSampai: string;
  setTanggalSampai: (v: string) => void;
  onReset: () => void;
}

function FilterSheet({
  onClose, sumber, setSumber, tanggalDari, setTanggalDari, tanggalSampai, setTanggalSampai, onReset,
}: FilterSheetProps) {
  // Local draft state — apply only on "Terapkan"
  const [draftSumber,        setDraftSumber]        = useState(sumber);
  const [draftTanggalDari,   setDraftTanggalDari]   = useState(tanggalDari);
  const [draftTanggalSampai, setDraftTanggalSampai] = useState(tanggalSampai);

  function handleReset() {
    setDraftSumber('');
    setDraftTanggalDari('');
    setDraftTanggalSampai('');
  }

  function handleTerapkan() {
    setSumber(draftSumber);
    setTanggalDari(draftTanggalDari);
    setTanggalSampai(draftTanggalSampai);
    onClose();
  }

  function handleFullReset() {
    handleReset();
    onReset();
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 16px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        maxWidth: 480, margin: '0 auto',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Filter Riwayat</span>
          <button type="button" onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Sumber Filter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Sumber Transaksi
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => setDraftSumber('')}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700,
                border: !draftSumber ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: !draftSumber ? 'var(--color-primary)' : 'var(--color-surface)',
                color: !draftSumber ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              Semua
            </button>
            {SUMBER_OPTIONS.map((opt) => {
              const active = draftSumber === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftSumber(active ? '' : opt.value)}
                  style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-muted)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Filter */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
            Rentang Tanggal
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Dari</div>
              <input
                type="date"
                value={draftTanggalDari}
                onChange={(e) => setDraftTanggalDari(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 13,
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ paddingTop: 18, color: 'var(--color-muted)', fontWeight: 700 }}>—</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Sampai</div>
              <input
                type="date"
                value={draftTanggalSampai}
                onChange={(e) => setDraftTanggalSampai(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 13,
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleFullReset} style={{
            flex: 1, padding: '13px', fontSize: 14, fontWeight: 700,
            border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
            background: 'none', color: 'var(--color-primary)', cursor: 'pointer',
          }}>Reset</button>
          <button type="button" onClick={handleTerapkan} style={{
            flex: 2, padding: '13px', fontSize: 14, fontWeight: 700,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}>Terapkan Filter</button>
        </div>
      </div>
    </>
  );
}

// ─── History Card (Live — RiwayatEntry) ───────────────────────────────────────

function HistoryCard({ entry }: { entry: RiwayatEntry }) {
  const txType = entryTxType(entry);
  const cfg    = TYPE_CONFIG[txType];
  const penerima = entry.sumber === 'Pemberian Pakan'
    ? (entry.sumberDetail.grupTernak ? 'batch' : (entry.sumberDetail.namaTernak ? 'individu' : null))
    : null;

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', overflow: 'hidden',
    }}>
      <div style={{ width: 4, background: cfg.accent, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, padding: '13px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {cfg.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>
              {entry.namaPakan}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{fmtDatetime(entry.waktu)}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, color: cfg.color, marginBottom: 3 }}>
              {cfg.sign}{entry.jumlah.toLocaleString('id-ID')} <span style={{ fontSize: 10, fontWeight: 600 }}>{entry.satuan}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
              Sisa: {entry.stokSesudah.toLocaleString('id-ID')} {entry.satuan}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '10px 0 8px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 8px' }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500, borderLeft: '1px solid var(--color-border)', paddingLeft: 6 }}>
            {entry.aktivitas}
          </span>
          {penerima && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#5d4037', background: '#efebe9', borderRadius: 20, padding: '3px 8px' }}>
              {penerima === 'individu' ? '🐑 Individu' : '📦 Batch'}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Oleh: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
              {entry.sumberDetail.namaOperator ?? '—'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
      }}>
        📋
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {hasFilter ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {hasFilter ? 'Tidak ada transaksi yang cocok dengan filter saat ini.' : 'Belum ada riwayat stok pakan.'}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatStokPakan() {
  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilter,   setShowFilter]   = useState(false);

  // Advanced filter state (applied by FilterSheet on "Terapkan")
  const [sumber,        setSumber]        = useState('');
  const [tanggalDari,   setTanggalDari]   = useState('');
  const [tanggalSampai, setTanggalSampai] = useState('');

  const hasAdvancedFilter = !!sumber || !!tanggalDari || !!tanggalSampai;

  // Live data — called directly each render
  const allEntries = getAllRiwayatEntries();

  const filtered = allEntries.filter((entry) => {
    const q = query.toLowerCase();
    const matchesSearch =
      entry.namaPakan.toLowerCase().includes(q) ||
      entry.kategoriPakan.toLowerCase().includes(q);

    const matchesType =
      activeFilter === 'all'         ? true :
      activeFilter === 'masuk'       ? (entry.kategori === 'Masuk' && entry.sumber !== 'Penyesuaian Stok') :
      activeFilter === 'keluar'      ? entry.kategori === 'Keluar' :
      activeFilter === 'penyesuaian' ? entry.sumber === 'Penyesuaian Stok' :
      true;

    const matchesSumber = !sumber || entry.sumber === sumber;

    const entryDate = entry.waktu.slice(0, 10);
    const matchesDari   = !tanggalDari   || entryDate >= tanggalDari;
    const matchesSampai = !tanggalSampai || entryDate <= tanggalSampai;

    return matchesSearch && matchesType && matchesSumber && matchesDari && matchesSampai;
  });

  const anyFilter = hasAdvancedFilter || activeFilter !== 'all' || !!query;

  return (
    <>
      {/* ── Sticky search + filter bar ───────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 100,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px 0',
      }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama pakan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
            />
            {query.length > 0 && (
              <button type="button" onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', flexShrink: 0,
              border: hasAdvancedFilter ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: hasAdvancedFilter ? 'var(--color-primary-light)' : 'var(--color-surface)',
              fontSize: 13, fontWeight: 700,
              color: hasAdvancedFilter ? 'var(--color-primary)' : 'var(--color-text)',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span>⚙️</span> Filter
            {hasAdvancedFilter && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--color-primary)', border: '1.5px solid var(--color-bg)',
              }} />
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  flexShrink: 0, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                  border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  borderRadius: 20,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: active ? '#fff' : 'var(--color-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── History List ─────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>
            {filtered.length} transaksi ditemukan
          </div>
        )}
        {filtered.length === 0
          ? <EmptyState hasFilter={anyFilter} />
          : filtered.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
        }
      </div>

      {showFilter && (
        <FilterSheet
          onClose={() => setShowFilter(false)}
          sumber={sumber}
          setSumber={setSumber}
          tanggalDari={tanggalDari}
          setTanggalDari={setTanggalDari}
          tanggalSampai={tanggalSampai}
          setTanggalSampai={setTanggalSampai}
          onReset={() => {
            setSumber('');
            setTanggalDari('');
            setTanggalSampai('');
          }}
        />
      )}
    </>
  );
}
