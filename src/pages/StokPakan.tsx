import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MasterPakanTab, { MasterAiInsightCard, MasterRingkasanCards } from './MasterPakanTab';
import ProdukKomersialTab, { ProdukKomersialAiInsightCard, ProdukKomersialRingkasanCards } from './ProdukKomersialTab';
import FormulaTab, { FormulaAiInsightCard, FormulaProAiCard, FormulaRingkasanCards } from './FormulaTab';
import { getInventarisList, getAmbangMenipis, type InventarisItem } from '../data/stokInventarisData';
import { useStokInventaris } from '../hooks/useStokInventaris';
import { useFormula } from '../hooks/useFormula';
import { computeStokAiInsights, type StokInsight } from '../utils/stokInsight';
import { getAllRiwayatEntries, type RiwayatEntry } from '../data/riwayatStokPakanData';

// ─── Category helpers ─────────────────────────────────────────────────────────

const KATEGORI_ICON: Record<string, string> = {
  'Hijauan':          '🌿',
  'Konsentrat':       '🫘',
  'Serat':            '🌾',
  'Mineral':          '🧂',
  'Vitamin':          '💊',
  'Premix':           '🧩',
  'Hasil Produksi':   '🏭',
  'Limbah Pertanian': '♻️',
  'By Product':       '🏭',
  'Fermentasi':       '🧫',
  'Silase':           '🌽',
  'Complete Feed':    '🧩',
  'Lainnya':          '📦',
};

function getKategoriIcon(kategori: string): string {
  return KATEGORI_ICON[kategori] ?? '📦';
}

function getCategoryStyle(cat: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    'Hijauan':          { color: '#1b7a43', bg: '#e8f5ee' },
    'Konsentrat':       { color: '#7b5e2a', bg: '#fff8e1' },
    'Serat':            { color: '#5d4037', bg: '#efebe9' },
    'Mineral':          { color: '#0277bd', bg: '#e1f5fe' },
    'Vitamin':          { color: '#6a1b9a', bg: '#f3e5f5' },
    'Premix':           { color: '#00695c', bg: '#e0f2f1' },
    'Hasil Produksi':   { color: '#00695c', bg: '#e0f2f1' },
    'Limbah Pertanian': { color: '#558b2f', bg: '#f1f8e9' },
    'Lainnya':          { color: '#546e7a', bg: '#eceff1' },
  };
  return map[cat] ?? { color: '#546e7a', bg: '#eceff1' };
}

function getStatusBadge(status: string) {
  if (status === 'Normal') return { label: '🟢 Aman',    color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43' };
  if (status === 'Menipis') return { label: '🟡 Menipis', color: '#e65100', bg: '#fff3e0', accent: '#fb8c00' };
  return                          { label: '🔴 Habis',   color: '#c62828', bg: '#ffebee', accent: '#e53935' };
}

// ─── Riwayat helpers ──────────────────────────────────────────────────────────

type TxType = 'masuk' | 'keluar' | 'penyesuaian';

const TX_CONFIG: Record<TxType, { icon: string; color: string; bg: string; accent: string; label: string; sign: '+' | '-' | '±' }> = {
  masuk:       { icon: '⬆️', color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43', label: 'Stok Masuk',  sign: '+' },
  keluar:      { icon: '⬇️', color: '#e65100', bg: '#fff3e0', accent: '#ef6c00', label: 'Stok Keluar', sign: '-' },
  penyesuaian: { icon: '🔄', color: '#0277bd', bg: '#e1f5fe', accent: '#0288d1', label: 'Penyesuaian', sign: '±' },
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

const RIWAYAT_FILTER_TABS = [
  { key: 'all',         label: 'Semua' },
  { key: 'masuk',       label: 'Stok Masuk' },
  { key: 'keluar',      label: 'Stok Keluar' },
  { key: 'penyesuaian', label: 'Penyesuaian' },
];

// ─── AI Insight Card (Live) ───────────────────────────────────────────────────

function AiInsightCard() {
  const insights: StokInsight[] = computeStokAiInsights();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        background: 'var(--color-primary)', padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Stok Pakan</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>
          LIVE
        </span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.5 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%', border: 'none', background: 'none',
            padding: '10px 14px 12px', fontSize: 12, fontWeight: 700,
            color: 'var(--color-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
          <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  );
}

// ─── Mode Selector ────────────────────────────────────────────────────────────

type Mode = 'stok' | 'master' | 'komersial' | 'formula' | 'riwayat';

function ModeSelector({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  const modes: { key: Mode; label: string }[] = [
    { key: 'master',    label: 'Master Pakan' },
    { key: 'komersial', label: 'Produk Komersial' },
    { key: 'stok',      label: 'Stok' },
    { key: 'formula',   label: 'Formula' },
    { key: 'riwayat',   label: 'Riwayat' },
  ];
  return (
    <div style={{
      display: 'flex', background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 4, gap: 4,
    }}>
      {modes.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            style={{
              flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700,
              border: 'none', borderRadius: 'calc(var(--radius-md) - 4px)',
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--color-muted)',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Feed Card (Live — InventarisItem) ────────────────────────────────────────

function FeedCard({ item, onClick }: { item: InventarisItem; onClick: () => void }) {
  const badge = getStatusBadge(item.status);
  const cat   = getCategoryStyle(item.kategori);
  const icon  = getKategoriIcon(item.kategori);
  const ambang = getAmbangMenipis();

  return (
    <div
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden', cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div style={{ width: 4, background: badge.accent, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {/* Row 1: icon + name + category + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: cat.bg,
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
              marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.nama}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: cat.bg, borderRadius: 20, padding: '2px 8px' }}>
              {item.kategori}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
            color: badge.color, background: badge.bg, borderRadius: 20, padding: '3px 8px', flexShrink: 0,
          }}>
            {badge.label}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Row 2: stock numbers */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Stok saat ini</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {item.jumlahStok.toLocaleString('id-ID')}
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3 }}>{item.satuan}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Stok minimum</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-muted)', lineHeight: 1 }}>
              {ambang}
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3 }}>{item.satuan}</span>
            </div>
          </div>
        </div>

        {/* Row 3: location + updated */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>
            📍 {item.lokasiPenyimpanan ?? '—'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Diperbarui {item.terakhirDiperbarui}
          </span>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 14px', borderLeft: '1px solid var(--color-border)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, color: 'var(--color-muted)', lineHeight: 1 }}>›</span>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {title}
      </h2>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{count} jenis</span>
    </div>
  );
}

// ─── Riwayat Filter Sheet ─────────────────────────────────────────────────────

const SUMBER_OPTIONS = [
  { value: 'Tambah Stok',      label: 'Tambah Stok',      icon: '⬆️' },
  { value: 'Marketplace',      label: 'Marketplace',      icon: '🛒' },
  { value: 'Produksi Formula', label: 'Produksi Formula', icon: '🏭' },
  { value: 'Perubahan Stok',   label: 'Perubahan Stok',   icon: '⬇️' },
  { value: 'Pemberian Pakan',  label: 'Pemberian Pakan',  icon: '🌿' },
  { value: 'Penyesuaian Stok', label: 'Penyesuaian',      icon: '🔄' },
  { value: 'Pindah Gudang',    label: 'Pindah Gudang',    icon: '📦' },
];

interface RiwayatFilterSheetProps {
  onClose: () => void;
  sumber: string;
  setSumber: (v: string) => void;
  tanggalDari: string;
  setTanggalDari: (v: string) => void;
  tanggalSampai: string;
  setTanggalSampai: (v: string) => void;
  onReset: () => void;
}

function RiwayatFilterSheet({
  onClose, sumber, setSumber, tanggalDari, setTanggalDari, tanggalSampai, setTanggalSampai, onReset,
}: RiwayatFilterSheetProps) {
  // Local draft state so user can preview without live-applying on every keystroke
  const [draftSumber,       setDraftSumber]       = useState(sumber);
  const [draftTanggalDari,  setDraftTanggalDari]  = useState(tanggalDari);
  const [draftTanggalSampai,setDraftTanggalSampai] = useState(tanggalSampai);

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
          <button type="button" onClick={handleReset} style={{
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
  const cfg    = TX_CONFIG[txType];
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StokPakan() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('master');

  // ── Supabase dual-read: populate in-memory RAW_INVENTARIS from DB ────────────
  // Runs on mount + workspace change. Falls back to seed data on error/empty.
  useStokInventaris();

  // ── Supabase dual-read: populate in-memory FORMULA_LIST + RIWAYAT_PRODUKSI ──
  // FLOW-003M20: hydrates formula data on mount / workspace change.
  useFormula();

  // Stock mode state
  const [stockQuery, setStockQuery] = useState('');

  // Riwayat mode state
  const [riwayatQuery,        setRiwayatQuery]       = useState('');
  const [riwayatFilter,       setRiwayatFilter]      = useState('all');
  const [showRiwayatFilter,   setShowRiwayatFilter]  = useState(false);
  // Advanced filter state (managed by RiwayatFilterSheet)
  const [riwayatSumber,       setRiwayatSumber]      = useState('');
  const [riwayatTanggalDari,  setRiwayatTanggalDari] = useState('');
  const [riwayatTanggalSampai,setRiwayatTanggalSampai] = useState('');

  // ── Live Stock data (called directly each render — no useMemo freeze) ───────
  const allItems = getInventarisList();
  const filteredItems = allItems.filter((item) =>
    item.nama.toLowerCase().includes(stockQuery.toLowerCase()) ||
    item.kategori.toLowerCase().includes(stockQuery.toLowerCase())
  );
  const tersedia = filteredItems.filter((item) => item.jumlahStok > 0);
  const habis    = filteredItems.filter((item) => item.jumlahStok <= 0);

  // Summary cards (live)
  const totalJenis    = allItems.length;
  const totalStok     = allItems.reduce((s, i) => s + i.jumlahStok, 0);
  const menipisCount  = allItems.filter((i) => i.status === 'Menipis').length;
  const habisCount    = allItems.filter((i) => i.status === 'Habis').length;
  const pricedItems   = allItems.filter((i) => i.hargaBeli && i.hargaBeli > 0);
  const nilaiPersediaan = pricedItems.length > 0
    ? 'Rp ' + Math.round(pricedItems.reduce((s, i) => s + i.jumlahStok * (i.hargaBeli!), 0)).toLocaleString('id-ID')
    : '—';

  const summaryCards = [
    { label: 'Total Jenis Pakan', value: String(totalJenis),                       icon: '🌿', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Total Stok',        value: totalStok.toLocaleString('id-ID') + ' Kg', icon: '⚖️', bg: '#fff8e1', color: '#7b5e2a' },
    { label: 'Hampir Habis',      value: String(menipisCount + habisCount),         icon: '⚠️', bg: '#fff3e0', color: '#e65100' },
    { label: 'Nilai Persediaan',  value: nilaiPersediaan,                           icon: '💰', bg: '#f3e5f5', color: '#7b1fa2' },
  ];

  // ── Live Riwayat data ───────────────────────────────────────────────────────
  const allRiwayat = getAllRiwayatEntries();
  const filteredRiwayat = allRiwayat.filter((entry) => {
    const q = riwayatQuery.toLowerCase();
    const matchSearch = entry.namaPakan.toLowerCase().includes(q) || entry.kategoriPakan.toLowerCase().includes(q);
    const matchType =
      riwayatFilter === 'all'         ? true :
      riwayatFilter === 'masuk'       ? (entry.kategori === 'Masuk' && entry.sumber !== 'Penyesuaian Stok') :
      riwayatFilter === 'keluar'      ? entry.kategori === 'Keluar' :
      riwayatFilter === 'penyesuaian' ? entry.sumber === 'Penyesuaian Stok' :
      true;
    const matchSumber = !riwayatSumber || entry.sumber === riwayatSumber;
    // Compare dates using the ISO date portion of entry.waktu (YYYY-MM-DD)
    const entryDate = entry.waktu.slice(0, 10);
    const matchDari   = !riwayatTanggalDari   || entryDate >= riwayatTanggalDari;
    const matchSampai = !riwayatTanggalSampai || entryDate <= riwayatTanggalSampai;
    return matchSearch && matchType && matchSumber && matchDari && matchSampai;
  });
  const hasAdvancedFilter = !!riwayatSumber || !!riwayatTanggalDari || !!riwayatTanggalSampai;

  return (
    <>

      {/* ── Master: AI Insight + Ringkasan ───────────────────────────────── */}
      {mode === 'master' && (
        <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MasterAiInsightCard />
          <MasterRingkasanCards />
        </div>
      )}

      {/* ── Produk Komersial: AI Insight + Ringkasan ─────────────────────── */}
      {mode === 'komersial' && (
        <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProdukKomersialAiInsightCard />
          <ProdukKomersialRingkasanCards />
        </div>
      )}

      {/* ── Formula: AI Insight + Ringkasan ──────────────────────────────── */}
      {mode === 'formula' && (
        <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormulaAiInsightCard />
          <FormulaProAiCard />
          <FormulaRingkasanCards />
        </div>
      )}

      {/* ── Stok: AI Insight (above ModeSelector) ────────────────────────── */}
      {mode === 'stok' && (
        <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto' }}>
          <AiInsightCard />
        </div>
      )}

      {/* ── Mode Selector ─────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* ── Master Pakan Mode ─────────────────────────────────────────────── */}
      {mode === 'master' && <MasterPakanTab />}

      {/* ── Produk Komersial Mode ─────────────────────────────────────────── */}
      {mode === 'komersial' && <ProdukKomersialTab />}

      {/* ── Formula Mode ──────────────────────────────────────────────────── */}
      {mode === 'formula' && <FormulaTab />}

      {/* ── Stock Mode ────────────────────────────────────────────────────── */}
      {mode === 'stok' && (
        <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {summaryCards.map((card) => (
              <div key={card.label} style={{
                background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
                borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontSize: 20 }}>{card.icon}</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                placeholder="Cari nama pakan..."
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
              />
              {stockQuery.length > 0 && (
                <button type="button" onClick={() => setStockQuery('')}
                  style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Stock Tersedia */}
          {tersedia.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel title="Stok Tersedia" count={tersedia.length} />
              {tersedia.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/stok-pakan/inventaris/${item.id}`)}
                />
              ))}
            </div>
          )}

          {/* Section 2: Stock Habis */}
          {habis.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel title="Stok Habis" count={habis.length} />
              {habis.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/stok-pakan/inventaris/${item.id}`)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {tersedia.length === 0 && habis.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 14, padding: '60px 24px',
            }}>
              <span style={{ fontSize: 64 }}>🌾</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                  {stockQuery ? 'Tidak ada hasil.' : 'Belum ada stok pakan.'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  {stockQuery ? 'Coba ubah kata kunci pencarian.' : 'Tambah stok pakan pertama via Quick Action.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Riwayat Mode ──────────────────────────────────────────────────── */}
      {mode === 'riwayat' && (
        <>
          {/* Sticky search + filter bar */}
          <div style={{
            position: 'sticky', top: 'var(--top-app-bar-height)', zIndex: 90,
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
                  value={riwayatQuery}
                  onChange={(e) => setRiwayatQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
                />
                {riwayatQuery.length > 0 && (
                  <button type="button" onClick={() => setRiwayatQuery('')}
                    style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowRiwayatFilter(true)}
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
              {RIWAYAT_FILTER_TABS.map((tab) => {
                const active = riwayatFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRiwayatFilter(tab.key)}
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

          {/* History list */}
          <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredRiwayat.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>
                {filteredRiwayat.length} transaksi ditemukan
              </div>
            )}
            {filteredRiwayat.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                }}>
                  📋
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum Ada Riwayat</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Belum ada riwayat stok pakan.</div>
                </div>
              </div>
            ) : (
              filteredRiwayat.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
            )}
          </div>

          {showRiwayatFilter && (
            <RiwayatFilterSheet
              onClose={() => setShowRiwayatFilter(false)}
              sumber={riwayatSumber}
              setSumber={setRiwayatSumber}
              tanggalDari={riwayatTanggalDari}
              setTanggalDari={setRiwayatTanggalDari}
              tanggalSampai={riwayatTanggalSampai}
              setTanggalSampai={setRiwayatTanggalSampai}
              onReset={() => {
                setRiwayatSumber('');
                setRiwayatTanggalDari('');
                setRiwayatTanggalSampai('');
              }}
            />
          )}
        </>
      )}
    </>
  );
}
