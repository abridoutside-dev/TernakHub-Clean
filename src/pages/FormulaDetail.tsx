import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getFormulaById,
  archiveFormula,
  unarchiveFormula,
  FORMULA_BATCH_SIZE_KG,
  type FormulaRecord,
  type BahanFormula,
} from '../data/formulaData';
import { getInventarisList, getAllRiwayatMasuk, type InventarisItem } from '../data/stokInventarisData';
import FeatureGate from '../components/subscription/FeatureGate';
import { recordArchiveFormula, recordUnarchiveFormula } from '../services/formulaService';
import { useFormula } from '../hooks/useFormula';

// ─── FormulaDetail (FP-004 Revisi) ──────────────────────────────────────────────
// Halaman baca saja — menampilkan semua informasi satu Formula secara lengkap.
// Formula bukan Produksi. Tidak ada perubahan stok di halaman ini — hanya membaca
// data ketersediaan (getInventarisList) dan riwayat stok masuk (getAllRiwayatMasuk)
// yang sudah diekspor oleh modul Stok, tanpa memodifikasi modul Stok itu sendiri.
// Back button ditangani oleh TopAppBar (App.tsx route meta).
// Tombol Produksi adalah Floating Action Button yang membuka Halaman Produksi (FP-005).

const BATCH_SIZE_KG = FORMULA_BATCH_SIZE_KG; // ukuran batch standar (kg) — sumber tunggal di formulaData.ts

// ─── Primitif UI (pola dari StokInventarisDetail) ─────────────────────────────

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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function InfoRow({
  label, value, valueColor, mono,
}: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      padding: '11px 16px',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: valueColor ?? 'var(--color-text)',
        textAlign: 'right',
        fontFamily: mono ? 'monospace' : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}

function RowDivider() {
  return <div style={{ height: 1, background: 'var(--color-border)', marginLeft: 16, marginRight: 16 }} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function getStatusBadge(status: FormulaRecord['status']) {
  if (status === 'Aktif') return { label: '🟢 Aktif', color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43' };
  if (status === 'Draft') return { label: '🔵 Draft', color: '#0277bd', bg: '#e1f5fe', accent: '#0288d1' };
  return                         { label: '⚫ Arsip', color: '#546e7a', bg: '#eceff1', accent: '#607d8b' };
}

function getJenisBadge(jenis: FormulaRecord['jenis']) {
  const map: Record<string, { color: string; bg: string }> = {
    'Complete Feed':  { color: '#1b7a43', bg: '#e8f5ee' },
    'Konsentrat':     { color: '#7b5e2a', bg: '#fff8e1' },
    'TMR':            { color: '#0277bd', bg: '#e1f5fe' },
    'Suplemen':       { color: '#6a1b9a', bg: '#f3e5f5' },
    'Ransum Hijauan': { color: '#2e7d32', bg: '#e8f5e9' },
    'Lainnya':        { color: '#546e7a', bg: '#eceff1' },
  };
  return map[jenis] ?? { color: '#546e7a', bg: '#eceff1' };
}

// ─── Ketersediaan & Produksi ───────────────────────────────────────────────────

interface KetersediaanBahan {
  bahan: BahanFormula;
  kebutuhanPerBatch: number;   // kg per 1 batch (BATCH_SIZE_KG)
  stokTersedia: number;        // kg di inventaris
  maxBatch: number;            // berapa batch bisa dibuat dari stok ini saja
  status: 'cukup' | 'kurang' | 'habis';
  ditemukan: boolean;          // apakah ada di inventaris
}

function matchInventaris(bahan: BahanFormula, inventaris: InventarisItem[]): InventarisItem | undefined {
  const key = bahan.nama.toLowerCase().trim();
  return inventaris.find((i) => i.nama.toLowerCase().trim() === key);
}

function computeKetersediaan(formula: FormulaRecord, inventaris: InventarisItem[]): KetersediaanBahan[] {
  return formula.bahan.map((bahan) => {
    const kebutuhanPerBatch = (bahan.proporsi / 100) * BATCH_SIZE_KG;
    const inv = matchInventaris(bahan, inventaris);
    const stokTersedia = inv?.jumlahStok ?? 0;
    const ditemukan = inv !== undefined;

    let maxBatch: number;
    if (kebutuhanPerBatch === 0) maxBatch = 9999;
    else if (stokTersedia === 0) maxBatch = 0;
    else maxBatch = Math.floor(stokTersedia / kebutuhanPerBatch);

    const status: KetersediaanBahan['status'] =
      stokTersedia === 0 ? 'habis'
      : stokTersedia < kebutuhanPerBatch ? 'kurang'
      : 'cukup';

    return { bahan, kebutuhanPerBatch, stokTersedia, maxBatch, status, ditemukan };
  });
}

interface HasilProduksi {
  maxBatch: number;
  maxKg: number;
  faktorPembatas: string[];
}

function computeMaxProduksi(ketersediaan: KetersediaanBahan[]): HasilProduksi {
  const finite = ketersediaan.filter((k) => k.maxBatch < 9999);
  if (finite.length === 0) return { maxBatch: 0, maxKg: 0, faktorPembatas: [] };

  const minBatch = Math.min(...finite.map((k) => k.maxBatch));
  const faktorPembatas = finite
    .filter((k) => k.maxBatch === minBatch)
    .map((k) => k.bahan.nama);

  return { maxBatch: minBatch, maxKg: minBatch * BATCH_SIZE_KG, faktorPembatas };
}

// ─── Riwayat Penggunaan Formula ────────────────────────────────────────────────
// Dibangun murni dari pembacaan getAllRiwayatMasuk() (getter baca-saja yang sudah
// diekspor modul Stok) — tidak ada perubahan pada data/berkas Stok.

interface RiwayatPenggunaan {
  totalProduksi: number;
  produksiTerakhir: string | undefined; // ISO date
  totalHasilProduksi: number;           // kg
}

function computeRiwayatPenggunaan(formula: FormulaRecord): RiwayatPenggunaan {
  const records = getAllRiwayatMasuk().filter(
    (r) => r.sumber === 'Produksi Formula' && r.formulaId === formula.id,
  );
  const totalHasilProduksi = records.reduce((s, r) => s + r.jumlah, 0);
  // records dari getAllRiwayatMasuk() sudah terbaru di atas (reverse chronological)
  const produksiTerakhir = records[0]?.tanggal ?? formula.terakhirDigunakan;
  return { totalProduksi: records.length, produksiTerakhir, totalHasilProduksi };
}

// ─── HPP Breakdown ────────────────────────────────────────────────────────────

interface HPPBaris {
  nama: string;
  jumlahKg: number;
  hargaPerKg: number;
  subtotal: number;
}

function computeHPPBreakdown(formula: FormulaRecord): { baris: HPPBaris[]; totalPerBatch: number; totalPerKg: number } {
  const baris: HPPBaris[] = formula.bahan.map((b) => {
    const jumlahKg = (b.proporsi / 100) * BATCH_SIZE_KG;
    const subtotal = jumlahKg * b.hargaEstimasiPerKg;
    return { nama: b.nama, jumlahKg, hargaPerKg: b.hargaEstimasiPerKg, subtotal };
  });
  const totalPerBatch = baris.reduce((acc, b) => acc + b.subtotal, 0);
  const totalPerKg = totalPerBatch / BATCH_SIZE_KG;
  return { baris, totalPerBatch, totalPerKg };
}

// ─── Progress Bar Nutrisi ─────────────────────────────────────────────────────

function NutrisiBar({
  label, value, maxValue, color, bg,
}: { label: string; value: number; maxValue: number; color: string; bg: string }) {
  const pct = Math.min(100, (value / maxValue) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', width: 32, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--color-bg)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{
        fontSize: 13, fontWeight: 800, color, width: 44, textAlign: 'right', flexShrink: 0,
        background: bg, borderRadius: 20, padding: '2px 8px',
      }}>
        {value}%
      </div>
    </div>
  );
}

// ─── 404 ──────────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '80px 24px', textAlign: 'center',
    }}>
      <span style={{ fontSize: 56 }}>❓</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Formula tidak ditemukan.</div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
        Formula mungkin telah dihapus atau id tidak valid.
      </div>
    </div>
  );
}

// ─── AI Insight card untuk detail ─────────────────────────────────────────────

function FormulaDetailInsight({ formula }: { formula: FormulaRecord }) {
  const [expanded, setExpanded] = useState(false);

  const nutrisiKosong = formula.estimasiNutrisi.pk === 0 && formula.estimasiNutrisi.tdn === 0;

  const insights: { icon: string; color: string; bg: string; text: string }[] = [
    {
      icon: '📋', color: '#1b7a43', bg: '#e8f5ee',
      text: `Formula "${formula.nama}" bertipe ${formula.jenis} — dirancang khusus untuk ${formula.targetTernak}. ${formula.tujuan ?? ''}`,
    },
    ...(nutrisiKosong ? [] : [{
      icon: '🧪', color: '#0277bd', bg: '#e1f5fe',
      text: `Estimasi nutrisi: PK ${formula.estimasiNutrisi.pk}%, SK ${formula.estimasiNutrisi.sk}%, TDN ${formula.estimasiNutrisi.tdn}%. ${
        formula.estimasiNutrisi.pk >= 16
          ? 'Kadar protein cukup tinggi — cocok untuk fase produksi atau pertumbuhan cepat.'
          : 'Kadar protein moderat — sesuai untuk fase pemeliharaan atau bunting.'
      }`,
    }]),
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Estimasi HPP ${formatRupiah(formula.estimasiHPP)}/kg untuk batch ${BATCH_SIZE_KG} kg. Harga aktual dapat berbeda tergantung kondisi pasar bahan baku.`,
    },
    {
      icon: '⚠️', color: '#c62828', bg: '#ffebee',
      text: 'Ketersediaan bahan dihitung dari stok inventaris saat ini. Selalu verifikasi stok sebelum menjalankan produksi.',
    },
    ...(formula.status === 'Draft' ? [{
      icon: '🔵', color: '#0277bd', bg: '#e1f5fe',
      text: 'Formula ini berstatus Draft dan belum siap untuk diproduksi. Selesaikan komposisi dan review sebelum mengubah status menjadi Aktif.',
    }] : []),
    ...(formula.status === 'Arsip' ? [{
      icon: '⚫', color: '#546e7a', bg: '#eceff1',
      text: 'Formula ini telah diarsipkan. Kontennya dapat dilihat sebagai referensi, tetapi tidak dapat digunakan untuk produksi.',
    }] : []),
  ];

  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <Card>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Formula Ini</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.55 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button type="button" onClick={() => setExpanded(v => !v)} style={{
          width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
          fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
          <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </Card>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────

export default function FormulaDetail() {
  const { id }  = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Hydrate in-memory store from Supabase on hard refresh (FLOW-003M25).
  const { loading } = useFormula();

  const formula = id ? getFormulaById(id) : undefined;

  // While DB fetch is in-flight, show a neutral loader so that formulas that
  // exist in Supabase but aren't in the seed don't flash NotFound.
  if (!formula && loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12, padding: '80px 24px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 32 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Memuat formula…</div>
      </div>
    );
  }

  if (!formula) return <NotFound />;

  const inventaris     = getInventarisList();
  const ketersediaan   = computeKetersediaan(formula, inventaris);
  const hasil          = computeMaxProduksi(ketersediaan);
  const hpp            = computeHPPBreakdown(formula);
  const riwayat        = computeRiwayatPenggunaan(formula);
  const statusBadge    = getStatusBadge(formula.status);
  const jenisBadge     = getJenisBadge(formula.jenis);
  const nutrisiKosong  = formula.estimasiNutrisi.pk === 0 && formula.estimasiNutrisi.tdn === 0;

  return (
    <div style={{ padding: '14px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {/* Status accent bar */}
        <div style={{ height: 4, background: statusBadge.accent }} />
        <div style={{ padding: '16px 16px 14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }}>
            📋
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, lineHeight: 1.2 }}>
              {formula.nama}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: jenisBadge.color, background: jenisBadge.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {formula.jenis}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: statusBadge.color, background: statusBadge.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>
        {formula.tujuan && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)', marginLeft: 16 }} />
            <div style={{ padding: '10px 16px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4 }}>TUJUAN</div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.55 }}>{formula.tujuan}</div>
            </div>
          </>
        )}
      </div>

      {/* ── AI Insight ──────────────────────────────────────────── */}
      <FormulaDetailInsight formula={formula} />

      {/* ── Ringkasan Formula ───────────────────────────────────── */}
      <div>
        <SectionLabel title="Ringkasan Formula" />
        <Card>
          <InfoRow label="Nama Formula"    value={formula.nama} />
          <RowDivider />
          <InfoRow label="Jenis Formula"   value={formula.jenis} />
          <RowDivider />
          <InfoRow label="Target Ternak"   value={formula.targetTernak} />
          <RowDivider />
          <InfoRow label="Fase Pemeliharaan" value={formula.fasePemeliharaan || formula.rekomendasi?.fasePemeliharaan || '—'} />
          <RowDivider />
          <InfoRow label="Tujuan Penggunaan" value={formula.tujuan || '—'} />
          <RowDivider />
          <InfoRow label="Status"          value={statusBadge.label} valueColor={statusBadge.color} />
          <RowDivider />
          <InfoRow label="Total Bahan"     value={`${formula.jumlahBahan} bahan`} />
          <RowDivider />
          <InfoRow label="Total Berat Formula" value={`${BATCH_SIZE_KG} kg`} />
          <RowDivider />
          <InfoRow label="Terakhir Diperbarui" value={formatTanggal(formula.diperbarui)} />
          <RowDivider />
          <InfoRow label="Dibuat Pada"     value={formatTanggal(formula.dibuatPada)} />
          {formula.terakhirDigunakan && (
            <>
              <RowDivider />
              <InfoRow label="Terakhir Diproduksi" value={formatTanggal(formula.terakhirDigunakan)} />
            </>
          )}
        </Card>
      </div>

      {/* ── Komposisi Bahan ─────────────────────────────────────── */}
      <div>
        <SectionLabel title="Komposisi Bahan" />
        <Card>
          {formula.bahan.map((bahan, idx) => (
            <div key={bahan.referensiId}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Proporsi bar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: '#e8f5ee', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1b7a43', lineHeight: 1 }}>{bahan.proporsi}%</div>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                    {bahan.nama}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 700,
                      color: (bahan.sumberBahan ?? 'Master Pakan') === 'Master Pakan' ? '#1b7a43' : '#6a4fb3',
                    }}>
                      {(bahan.sumberBahan ?? 'Master Pakan') === 'Master Pakan' ? '🌿 Master Pakan' : '📦 Produk Komersial'}
                    </span>
                    <span>· {(bahan.proporsi / 100 * BATCH_SIZE_KG).toFixed(0)} {bahan.satuan} ({bahan.proporsi}%) per {BATCH_SIZE_KG} kg batch</span>
                  </div>
                </div>
                {/* Harga */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                    {formatRupiah(bahan.hargaEstimasiPerKg)}/kg
                  </div>
                </div>
              </div>
              {/* Proporsi bar visual */}
              <div style={{ height: 3, background: 'var(--color-bg)', marginLeft: 16, marginRight: 16, borderRadius: 2, marginBottom: 4 }}>
                <div style={{
                  height: '100%', width: `${bahan.proporsi}%`, borderRadius: 2,
                  background: '#1b7a43', opacity: 0.7,
                }} />
              </div>
              {idx < formula.bahan.length - 1 && <div style={{ height: 6 }} />}
              {idx < formula.bahan.length - 1 && <RowDivider />}
            </div>
          ))}
          <div style={{
            padding: '12px 16px', background: 'var(--color-bg)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1.5px solid var(--color-border)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
              TOTAL ({formula.bahan.reduce((s, b) => s + b.proporsi, 0)}%)
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
              {BATCH_SIZE_KG} kg per batch
            </span>
          </div>
        </Card>
      </div>

      {/* ── Analisis Nutrisi ─────────────────────────────────────── */}
      <div>
        <SectionLabel title="Analisis Nutrisi" />
        <Card>
          {nutrisiKosong ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Kandungan nutrisi tidak berlaku untuk jenis formula ini.
            </div>
          ) : (
            <>
              <NutrisiBar label="PK"  value={formula.estimasiNutrisi.pk}  maxValue={25}  color="#1b7a43" bg="#e8f5ee" />
              <RowDivider />
              <NutrisiBar label="SK"  value={formula.estimasiNutrisi.sk}  maxValue={40}  color="#7b5e2a" bg="#fff8e1" />
              <RowDivider />
              <NutrisiBar label="TDN" value={formula.estimasiNutrisi.tdn} maxValue={100} color="#0277bd" bg="#e1f5fe" />
              <div style={{
                padding: '10px 16px 12px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  PK = Protein Kasar &nbsp;·&nbsp; SK = Serat Kasar &nbsp;·&nbsp; TDN = Total Digestible Nutrients
                  <br />Nilai berdasarkan estimasi komposisi bahan pada formula ini.
                  <br />Lemak, Abu, Kalsium, dan Fosfor belum tersedia pada model data formula saat ini.
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Analisis Nutrisi Lengkap (PRO) ──────────────────────── */}
      {!nutrisiKosong && (
        <div>
          <SectionLabel title="Analisis Nutrisi Lengkap (Pro)" />
          <FeatureGate
            feature="formula_nutrition_complete"
            featureLabel="Analisis Nutrisi Formula Lengkap"
          >
            {/* Shown to Pro/Enterprise: extended nutrition panel */}
            <Card>
              {(
                [
                  { label: 'Bahan Kering (DM)', value: null },
                  { label: 'Protein Kasar (PK)', value: formula.estimasiNutrisi.pk, unit: '%' },
                  { label: 'Serat Kasar (SK)',   value: formula.estimasiNutrisi.sk,  unit: '%' },
                  { label: 'TDN',                value: formula.estimasiNutrisi.tdn, unit: '%' },
                  { label: 'Lemak Kasar (LK)',   value: null },
                  { label: 'Abu (Ash)',           value: null },
                  { label: 'Kalsium (Ca)',        value: null },
                  { label: 'Fosfor (P)',          value: null },
                  { label: 'NDF',                value: null },
                  { label: 'ADF',                value: null },
                  { label: 'NFC',                value: null },
                  { label: 'Energi (ME)',         value: null },
                ] as { label: string; value: number | null; unit?: string }[]
              ).map(({ label, value, unit }, idx, arr) => (
                <div key={label}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{label}</span>
                    {value !== null ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                        {value}{unit ?? ''}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: 'var(--color-muted)', background: 'var(--color-bg)',
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        Belum tersedia
                      </span>
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />
                  )}
                </div>
              ))}
              <div style={{
                padding: '10px 16px 12px', borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  Nilai berdasarkan estimasi komposisi bahan. Bidang bertanda "Belum tersedia"
                  membutuhkan model data formula yang lebih lengkap (akan hadir di update mendatang).
                </div>
              </div>
            </Card>
          </FeatureGate>
        </div>
      )}

      {/* ── Analisis Biaya ──────────────────────────────────────── */}
      <div>
        <SectionLabel title="Analisis Biaya" />
        <Card>
          {hpp.baris.map((b, idx) => (
            <div key={b.nama}>
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{b.nama}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                    {b.jumlahKg.toFixed(0)} kg × {formatRupiah(b.hargaPerKg)}/kg
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', flexShrink: 0 }}>
                  {formatRupiah(b.subtotal)}
                </div>
              </div>
              {idx < hpp.baris.length - 1 && <RowDivider />}
            </div>
          ))}
          {/* Total row */}
          <div style={{
            padding: '12px 16px',
            borderTop: '2px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Biaya per Batch ({BATCH_SIZE_KG} kg)</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-text)' }}>{formatRupiah(hpp.totalPerBatch)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>HPP per Kg</span>
              <span style={{
                fontSize: 15, fontWeight: 900, color: '#1b7a43',
                background: '#e8f5ee', borderRadius: 20, padding: '3px 12px',
              }}>
                {formatRupiah(Math.round(hpp.totalPerKg))}/kg
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Ketersediaan Bahan ──────────────────────────────────── */}
      <div>
        <SectionLabel title="Ketersediaan Bahan" />
        <Card>
          {ketersediaan.map((k, idx) => {
            const icon  = k.status === 'cukup' ? '✔' : k.status === 'kurang' ? '⚠' : '✕';
            const color = k.status === 'cukup' ? '#1b7a43' : k.status === 'kurang' ? '#e65100' : '#c62828';
            const bg    = k.status === 'cukup' ? '#e8f5ee' : k.status === 'kurang' ? '#fff3e0' : '#ffebee';
            const keterangan =
              !k.ditemukan
                ? 'Tidak ditemukan di inventaris'
                : k.status === 'habis'
                ? '0 kg tersedia'
                : `${k.stokTersedia.toLocaleString('id-ID')} kg tersedia`;
            const subKeterangan =
              k.status === 'kurang'
                ? `Perlu ${k.kebutuhanPerBatch.toFixed(0)} kg per batch — kurang ${(k.kebutuhanPerBatch - k.stokTersedia).toFixed(0)} kg`
                : k.status === 'habis'
                ? `Perlu ${k.kebutuhanPerBatch.toFixed(0)} kg per batch — stok kosong`
                : k.ditemukan
                ? `Cukup untuk ${k.maxBatch} batch (${(k.maxBatch * BATCH_SIZE_KG).toLocaleString('id-ID')} kg)`
                : undefined;

            return (
              <div key={k.bahan.referensiId}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color, fontWeight: 800, flexShrink: 0, marginTop: 1,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                      {k.bahan.nama}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color }}>{keterangan}</div>
                    {subKeterangan && (
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{subKeterangan}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>
                      kebutuhan
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                      {k.kebutuhanPerBatch.toFixed(0)} kg
                    </div>
                  </div>
                </div>
                {idx < ketersediaan.length - 1 && <RowDivider />}
              </div>
            );
          })}
        </Card>
      </div>

      {/* ── Estimasi Produksi ───────────────────────────────────── */}
      <div>
        <SectionLabel title="Estimasi Produksi" />
        <Card>
          <div style={{ padding: '16px' }}>
            {/* Max produksi */}
            <div style={{
              background: hasil.maxBatch === 0 ? '#ffebee' : '#e8f5ee',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 32 }}>{hasil.maxBatch === 0 ? '🚫' : '🏭'}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: hasil.maxBatch === 0 ? '#c62828' : '#1b7a43', lineHeight: 1 }}>
                  {hasil.maxBatch === 0 ? '0 batch' : `${hasil.maxBatch} batch`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>
                  {hasil.maxBatch === 0
                    ? 'Stok tidak mencukupi untuk 1 batch pun'
                    : `Maks. ${(hasil.maxKg).toLocaleString('id-ID')} kg dapat diproduksi saat ini`}
                </div>
              </div>
            </div>

            {/* Detail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--color-muted)' }}>Ukuran 1 batch</span>
                <span style={{ fontWeight: 700 }}>{BATCH_SIZE_KG} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--color-muted)' }}>Total dapat diproduksi</span>
                <span style={{ fontWeight: 700 }}>{(hasil.maxKg).toLocaleString('id-ID')} kg</span>
              </div>
              {hasil.faktorPembatas.length > 0 && (
                <div style={{
                  marginTop: 4, padding: '10px 12px',
                  background: '#fff3e0', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e65100', marginBottom: 3 }}>
                      FAKTOR PEMBATAS
                    </div>
                    <div style={{ fontSize: 12, color: '#7b4a00', lineHeight: 1.5 }}>
                      {hasil.faktorPembatas.join(', ')}
                    </div>
                  </div>
                </div>
              )}
              {hasil.maxBatch === 0 && ketersediaan.some(k => !k.ditemukan) && (
                <div style={{
                  padding: '10px 12px', background: '#ffebee',
                  borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
                  <div style={{ fontSize: 12, color: '#c62828', lineHeight: 1.5 }}>
                    Beberapa bahan tidak ditemukan di inventaris. Tambahkan stok bahan yang diperlukan terlebih dahulu.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Rekomendasi Penggunaan ──────────────────────────────── */}
      {formula.rekomendasi && (
        <div>
          <SectionLabel title="Rekomendasi Penggunaan" />
          <Card>
            <div style={{ padding: '12px 16px 6px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8 }}>
                COCOK UNTUK
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {formula.rekomendasi.cocokUntuk.map((c) => (
                  <span key={c} style={{
                    fontSize: 12, fontWeight: 600,
                    color: '#1b7a43', background: '#e8f5ee',
                    borderRadius: 20, padding: '4px 10px',
                  }}>
                    🐄 {c}
                  </span>
                ))}
              </div>
            </div>
            <RowDivider />
            <InfoRow label="Fase Pemeliharaan" value={formula.rekomendasi.fasePemeliharaan} />
            {formula.rekomendasi.kelebihan && formula.rekomendasi.kelebihan.length > 0 && (
              <>
                <RowDivider />
                <div style={{ padding: '12px 16px 6px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8 }}>
                    KELEBIHAN FORMULA
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {formula.rekomendasi.kelebihan.map((k, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#1b7a43', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {formula.rekomendasi.catatan && (
              <>
                <RowDivider />
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6 }}>CATATAN PENGGUNAAN</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                    {formula.rekomendasi.catatan}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Riwayat Penggunaan Formula ───────────────────────────── */}
      <div>
        <SectionLabel title="Riwayat Penggunaan Formula" />
        <Card>
          <InfoRow label="Total Produksi" value={`${riwayat.totalProduksi}×`} />
          <RowDivider />
          <InfoRow
            label="Produksi Terakhir"
            value={riwayat.produksiTerakhir ? formatTanggal(riwayat.produksiTerakhir) : 'Belum pernah diproduksi'}
          />
          <RowDivider />
          <InfoRow label="Total Hasil Produksi" value={`${riwayat.totalHasilProduksi.toLocaleString('id-ID')} kg`} />
          {riwayat.totalProduksi === 0 && (
            <div style={{ padding: '10px 16px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>
                Belum ada riwayat produksi untuk formula ini. Ringkasan ini tidak menampilkan detail per-batch.
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Edit Formula — aksi sekunder, bukan FAB ─────────────── */}
      {formula.status !== 'Arsip' && (
        <button
          type="button"
          onClick={() => navigate(`/stok-pakan/formula/${formula.id}/edit`)}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-primary)',
            background: 'transparent',
            color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>✏️</span>
          Edit Formula
        </button>
      )}

      {/* ── Arsipkan / Aktifkan kembali Formula ─────────────────── */}
      {!archiveConfirm ? (
        <button
          type="button"
          onClick={() => setArchiveConfirm(true)}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 'var(--radius-md)',
            border: `1.5px solid ${formula.status === 'Arsip' ? 'var(--color-primary)' : '#e65100'}`,
            background: 'transparent',
            color: formula.status === 'Arsip' ? 'var(--color-primary)' : '#e65100',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{formula.status === 'Arsip' ? '🔄' : '📁'}</span>
          {formula.status === 'Arsip' ? 'Aktifkan Kembali' : 'Arsipkan Formula'}
        </button>
      ) : (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-md)',
          border: '1.5px solid #e65100', background: '#fff3e0',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e65100', marginBottom: 10 }}>
            {formula.status === 'Arsip'
              ? 'Aktifkan kembali formula ini?'
              : 'Arsipkan formula ini?'}
          </div>
          <div style={{ fontSize: 12, color: '#7b4a00', marginBottom: 14, lineHeight: 1.55 }}>
            {formula.status === 'Arsip'
              ? 'Formula akan dikembalikan ke status Aktif dan dapat digunakan untuk produksi.'
              : 'Formula akan diarsipkan dan tidak bisa digunakan untuk produksi. Kontennya tetap tersimpan sebagai referensi.'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setArchiveConfirm(false)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)', background: 'transparent',
                fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (formula.status === 'Arsip') {
                  unarchiveFormula(formula.id);
                  void recordUnarchiveFormula(formula.id).catch((err) =>
                    console.error('[FormulaDetail] recordUnarchiveFormula failed:', err),
                  );
                } else {
                  archiveFormula(formula.id);
                  void recordArchiveFormula(formula.id).catch((err) =>
                    console.error('[FormulaDetail] recordArchiveFormula failed:', err),
                  );
                }
                setArchiveConfirm(false);
                setTick(t => t + 1);
                // Navigate back to list so the updated status is visible
                navigate('/stok-pakan', { replace: false });
              }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: formula.status === 'Arsip' ? 'var(--color-primary)' : '#e65100',
                fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}
            >
              {formula.status === 'Arsip' ? 'Aktifkan' : 'Arsipkan'}
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Action Button — Produksi (membuka FP-005) ──── */}
      <button
        type="button"
        onClick={() => {
          if (formula.status !== 'Aktif') return;
          navigate(`/stok-pakan/formula/${formula.id}/produksi`);
        }}
        title={formula.status === 'Aktif' ? 'Produksi' : `Produksi tidak tersedia — formula berstatus ${formula.status}`}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: 28, border: 'none',
          background: formula.status === 'Aktif' ? 'var(--color-primary)' : '#b0bec5',
          color: '#fff', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-fab)',
          cursor: formula.status === 'Aktif' ? 'pointer' : 'not-allowed',
          zIndex: 100,
        }}
      >
        🏭
      </button>

    </div>
  );
}
