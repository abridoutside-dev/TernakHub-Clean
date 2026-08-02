import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProduksiRecords, type ProduksiBatchRecord } from '../data/produksiFormulaData';
import { useFormula } from '../hooks/useFormula';

// ─── RiwayatProduksiFormula (FP-006) ────────────────────────────────────────────
// Tab Riwayat Produksi — histori PRODUKSI, bukan histori stok.
// Sumber data HANYA dari proses Produksi Formula (produksiFormulaData.ts).
// Halaman ini murni baca (read-only): tidak ada aksi yang membuat produksi baru,
// mengubah stok, formula, master pakan, produk komersial, atau livestock.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRp(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function fmtKg(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

function fmtWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Minggu
  const diff = (day === 0 ? 6 : day - 1); // Senin sebagai awal minggu
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterKey = 'semua' | 'hari-ini' | 'minggu-ini' | 'bulan-ini' | 'formula';

// ─── Sub-komponen UI ──────────────────────────────────────────────────────────

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

function BatchCard({ record, onOpen }: { record: ProduksiBatchRecord; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', overflow: 'hidden', cursor: 'pointer',
      }}
    >
      <div style={{ width: 4, background: '#1b7a43', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, padding: '13px 14px 11px' }}>
        {/* Row 1: nomor batch + waktu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
            borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap',
          }}>
            🏭 {record.nomorBatch}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
            {fmtWaktu(record.waktuProduksi)}
          </span>
        </div>

        {/* Row 2: nama formula + hasil produksi */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
          {record.namaHasilProduksi}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
          Formula: {record.formulaNama} · {record.targetTernak}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 0 8px' }} />

        {/* Row 3: jumlah, biaya, HPP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1b7a43' }}>
              +{fmtKg(record.jumlahProduksi)} kg
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Jumlah Produksi</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {fmtRp(record.totalBiayaProduksi)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
              HPP {fmtRp(record.hppPerKg)}/kg
            </div>
          </div>
        </div>

        {/* Operator */}
        {record.operator && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-muted)' }}>
            Oleh: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{record.operator}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: '60px 24px',
    }}>
      <span style={{ fontSize: 56 }}>🏭</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {filtered ? 'Tidak ada riwayat produksi ditemukan.' : 'Belum Ada Riwayat Produksi'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {filtered
            ? 'Coba ubah kata kunci atau filter yang digunakan.'
            : 'Jalankan Produksi dari halaman Detail Formula untuk mulai mencatat riwayat.'}
        </div>
      </div>
    </div>
  );
}

// ─── Halaman ──────────────────────────────────────────────────────────────────

export default function RiwayatProduksiFormula() {
  const navigate = useNavigate();

  // ── Supabase dual-read: hydrate RIWAYAT_PRODUKSI from DB (FLOW-003M20) ──────
  useFormula();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('semua');
  const [formulaFilter, setFormulaFilter] = useState<string>('semua');

  const allRecords = getAllProduksiRecords();

  const formulaOptions = useMemo(() => {
    const map = new Map<string, string>();
    allRecords.forEach((r) => map.set(r.formulaId, r.formulaNama));
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [allRecords]);

  const now = useMemo(() => new Date(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = allRecords.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchSearch = q === '' ||
      r.formulaNama.toLowerCase().includes(q) ||
      r.namaHasilProduksi.toLowerCase().includes(q) ||
      r.nomorBatch.toLowerCase().includes(q);

    let matchFilter = true;
    const waktu = new Date(r.waktuProduksi);
    if (filter === 'hari-ini') {
      matchFilter = waktu >= startOfDay(now);
    } else if (filter === 'minggu-ini') {
      matchFilter = waktu >= startOfWeek(now);
    } else if (filter === 'bulan-ini') {
      matchFilter = waktu >= startOfMonth(now);
    } else if (filter === 'formula') {
      matchFilter = formulaFilter === 'semua' || r.formulaId === formulaFilter;
    }

    return matchSearch && matchFilter;
  });

  const isFiltered = query.trim() !== '' || filter !== 'semua';

  const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: 'semua',       label: 'Semua' },
    { key: 'hari-ini',    label: 'Hari Ini' },
    { key: 'minggu-ini',  label: 'Minggu Ini' },
    { key: 'bulan-ini',   label: 'Bulan Ini' },
    { key: 'formula',     label: 'Formula' },
  ];

  return (
    <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nomor batch, formula, atau hasil produksi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 14, color: 'var(--color-text)', background: 'transparent',
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                flexShrink: 0,
                padding: '7px 14px', fontSize: 12, fontWeight: 700,
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

      {/* ── Sub-filter Formula (muncul saat tab "Formula" aktif) ───────── */}
      {filter === 'formula' && formulaOptions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setFormulaFilter('semua')}
            style={{
              flexShrink: 0, padding: '6px 12px', fontSize: 11, fontWeight: 700,
              border: formulaFilter === 'semua' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 20,
              background: formulaFilter === 'semua' ? 'var(--color-primary-light)' : 'var(--color-bg)',
              color: formulaFilter === 'semua' ? 'var(--color-primary)' : 'var(--color-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Semua Formula
          </button>
          {formulaOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormulaFilter(f.id)}
              style={{
                flexShrink: 0, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                border: formulaFilter === f.id ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: formulaFilter === f.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                color: formulaFilter === f.id ? 'var(--color-primary)' : 'var(--color-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {f.nama}
            </button>
          ))}
        </div>
      )}

      {/* ── Jumlah hasil ─────────────────────────────────────────────── */}
      {isFiltered && filtered.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} batch produksi ditemukan
        </div>
      )}

      {/* ── Timeline Produksi ────────────────────────────────────────── */}
      <div>
        <SectionLabel title="Timeline Produksi" />
        {filtered.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((r) => (
              <BatchCard key={r.id} record={r} onOpen={() => navigate(`/stok-pakan/formula/riwayat/${r.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
