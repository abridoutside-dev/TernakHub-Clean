// ─── FormulaProduksi (FP-005) ───────────────────────────────────────────────────
// Mengubah Formula (template) menjadi hasil produksi nyata.
// Akses: FormulaDetail → Tombol Produksi → /stok-pakan/formula/:id/produksi
//
// ATURAN KERAS:
//  • Tidak mengubah Formula, Master Pakan, Produk Komersial, atau Livestock.
//  • Perubahan stok HANYA terjadi saat pengguna menekan tombol konfirmasi.
//  • Pengurangan bahan baku: addPerubahanStok (sumberPerubahan: 'Produksi Formula')
//  • Penambahan hasil: addInventarisFromProduksi (merge-by-formulaId jika sudah ada)

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormula } from '../hooks/useFormula';
import {
  getFormulaById,
  updateFormula,
  type BahanFormula,
  type FormulaRecord,
} from '../data/formulaData';
import {
  getInventarisList,
  addPerubahanStok,
  addInventarisFromProduksi,
  type InventarisItem,
} from '../data/stokInventarisData';
import { addProduksiRecord, type BahanDigunakan } from '../data/produksiFormulaData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { recordCreateProduction } from '../services/formulaService';
import { recordPerubahanStok, recordTambahStok } from '../services/stokInventarisService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalisasi nama untuk pencocokan inventaris ↔ bahan formula. */
function normNama(s: string) {
  return s.trim().toLowerCase();
}

/** Cari item inventaris berdasarkan nama (case-insensitive). */
function findInvByNama(nama: string, list: InventarisItem[]): InventarisItem | undefined {
  return list.find((inv) => normNama(inv.nama) === normNama(nama));
}

/** Format angka ribuan Rupiah singkat (misal: 3.480 → "3.480"). */
function fmtRp(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

/** Format angka desimal 1 tempat jika ada, tanpa jika bulat. */
function fmtKg(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

function isoToday() {
  return new Date().toISOString().split('T')[0];
}

// ─── Tipe Bantu ───────────────────────────────────────────────────────────────

interface BahanInfo {
  bahan: BahanFormula;
  inv: InventarisItem | undefined;
  /** Stok saat ini (0 jika tidak ditemukan). */
  stokTersedia: number;
  /** Kebutuhan untuk jumlah produksi yang dipilih (kg). */
  kebutuhan: number;
  /** true jika stok mencukupi untuk kebutuhan. */
  cukup: boolean;
  /** true jika item inventaris ditemukan (bisa 0 stok). */
  ditemukan: boolean;
}

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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      padding: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Ketersediaan Bahan ────────────────────────────────────────────────────────

function BahanRow({ info }: { info: BahanInfo }) {
  const { bahan, inv, stokTersedia, kebutuhan, cukup, ditemukan } = info;

  let icon: string;
  let iconColor: string;
  if (!ditemukan) {
    icon = '✗'; iconColor = '#e53935';
  } else if (!cukup && kebutuhan > 0) {
    icon = '⚠'; iconColor = '#f57c00';
  } else if (stokTersedia === 0) {
    icon = '⚠'; iconColor = '#f57c00';
  } else {
    icon = '✔'; iconColor = '#388e3c';
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 16, minWidth: 20, textAlign: 'center',
        color: iconColor, fontWeight: 700, paddingTop: 2,
      }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
          {bahan.nama}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
          {ditemukan
            ? `${fmtKg(stokTersedia)} ${inv?.satuan ?? bahan.satuan} tersedia`
            : 'Tidak ditemukan di stok'}
          {' · '}
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {bahan.proporsi}% dari formula
          </span>
        </div>
        {!cukup && kebutuhan > 0 && ditemukan && (
          <div style={{ fontSize: 11, color: '#f57c00', marginTop: 3 }}>
            Butuh {fmtKg(kebutuhan)} {bahan.satuan} — kurang {fmtKg(kebutuhan - stokTersedia)} {bahan.satuan}
          </div>
        )}
        {!ditemukan && (
          <div style={{ fontSize: 11, color: '#e53935', marginTop: 3 }}>
            Tambahkan bahan ini ke stok terlebih dahulu.
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-muted)', minWidth: 60 }}>
        {kebutuhan > 0 ? (
          <span style={{ color: cukup ? '#388e3c' : '#e53935', fontWeight: 600 }}>
            -{fmtKg(kebutuhan)} {bahan.satuan}
          </span>
        ) : (
          <span style={{ color: 'var(--color-muted)' }}>—</span>
        )}
      </div>
    </div>
  );
}

// ─── Konfirmasi Modal ──────────────────────────────────────────────────────────

function KonfirmasiModal({
  formula,
  jumlah,
  bahanInfos,
  onConfirm,
  onCancel,
  loading,
}: {
  formula: FormulaRecord;
  jumlah: number;
  bahanInfos: BahanInfo[];
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px 32px',
        width: '100%', maxWidth: 480,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-text)' }}>
            Konfirmasi Produksi
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 6 }}>
            Proses ini akan mengubah stok secara permanen.
          </div>
        </div>

        <div style={{
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 16,
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--color-muted)' }}>Formula</span>
            <span style={{ fontWeight: 600 }}>{formula.nama}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Jumlah Produksi</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {fmtKg(jumlah)} kg
            </span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>
          {bahanInfos.length} bahan baku akan dikurangi · Hasil produksi akan ditambah ke Tab Stok.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-text)',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--color-primary)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Memproses…' : '✓ Ya, Produksi Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Sukses ───────────────────────────────────────────────────────────

function HalamanSukses({
  formula,
  jumlah,
  onKembali,
  onLihatStok,
}: {
  formula: FormulaRecord;
  jumlah: number;
  onKembali: () => void;
  onLihatStok: () => void;
}) {
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{
        fontWeight: 800, fontSize: 22, color: 'var(--color-text)', marginBottom: 8,
      }}>
        Produksi Berhasil!
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-muted)', maxWidth: 280, lineHeight: 1.5 }}>
        <strong>{fmtKg(jumlah)} kg</strong> hasil produksi dari formula{' '}
        <em>{formula.nama}</em> telah ditambahkan ke Tab Stok.
      </div>

      <div style={{
        margin: '24px 0 32px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        width: '100%', maxWidth: 320,
        fontSize: 13, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-muted)' }}>Formula</span>
          <span style={{ fontWeight: 600 }}>{formula.nama}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-muted)' }}>Hasil</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            +{fmtKg(jumlah)} kg
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted)' }}>Tanggal</span>
          <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        <button
          type="button"
          onClick={onLihatStok}
          style={{
            padding: '13px 0', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Lihat Tab Stok
        </button>
        <button
          type="button"
          onClick={onKembali}
          style={{
            padding: '13px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Kembali ke Detail Formula
        </button>
      </div>
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────

export default function FormulaProduksi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();

  // Hydrate in-memory store from Supabase on hard refresh (FLOW-003M25).
  const { loading: formulaLoading } = useFormula();

  const formula = id ? getFormulaById(id) : undefined;

  // jumlahProduksi: string agar bisa kosong sementara user mengetik
  const [jumlahStr, setJumlahStr] = useState<string>('');
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [berhasil, setBerhasil] = useState(false);
  const [hasilJumlah, setHasilJumlah] = useState(0);
  // tick untuk force-read inventaris setelah mutasi
  const [tick, setTick] = useState(0);

  // Live inventaris — dibaca ulang setiap kali tick berubah
  const inventaris = useMemo(() => getInventarisList(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const jumlah = parseFloat(jumlahStr) || 0;

  // ── Info per-bahan ─────────────────────────────────────────────────────────
  const bahanInfos: BahanInfo[] = useMemo(() => {
    if (!formula) return [];
    return formula.bahan.map((b) => {
      const inv = findInvByNama(b.nama, inventaris);
      const stokTersedia = inv ? inv.jumlahStok : 0;
      const ditemukan = inv !== undefined;
      // kebutuhan = proporsi% dari jumlah produksi
      const kebutuhan = jumlah > 0 ? (b.proporsi / 100) * jumlah : 0;
      const cukup = ditemukan && stokTersedia >= kebutuhan;
      return { bahan: b, inv, stokTersedia, kebutuhan, cukup, ditemukan };
    });
  }, [formula, inventaris, jumlah]);

  // ── Maksimum produksi ─────────────────────────────────────────────────────
  const maxProduksi = useMemo(() => {
    if (!formula || formula.bahan.length === 0) return 0;
    const limits = formula.bahan.map((b) => {
      const inv = findInvByNama(b.nama, inventaris);
      if (!inv || b.proporsi === 0) return 0;
      return inv.jumlahStok / (b.proporsi / 100);
    });
    const raw = Math.min(...limits);
    return Math.floor(raw * 10) / 10; // satu desimal ke bawah
  }, [formula, inventaris]);

  // ── Faktor pembatas ────────────────────────────────────────────────────────
  const faktorPembatas = useMemo(() => {
    if (!formula || maxProduksi === 0) return undefined;
    // bahan mana yang membatasi?
    const limits = formula.bahan.map((b) => {
      const inv = findInvByNama(b.nama, inventaris);
      const stok = inv ? inv.jumlahStok : 0;
      const kapasitas = b.proporsi > 0 ? stok / (b.proporsi / 100) : Infinity;
      return { nama: b.nama, kapasitas };
    });
    const minKap = Math.min(...limits.map((l) => l.kapasitas));
    return limits.find((l) => Math.abs(l.kapasitas - minKap) < 0.001)?.nama;
  }, [formula, inventaris, maxProduksi]);

  // ── Validasi ───────────────────────────────────────────────────────────────
  const semuaDitemukan = bahanInfos.every((bi) => bi.ditemukan);
  const semuaCukup = jumlah > 0 && bahanInfos.every((bi) => bi.cukup);
  const bolehProduksi = jumlah > 0 && jumlah <= maxProduksi && semuaCukup && semuaDitemukan;

  // ── HPP preview ────────────────────────────────────────────────────────────
  const hppPerKg = formula?.estimasiHPP ?? 0;
  const totalNilai = hppPerKg * jumlah;

  // ── Proses produksi ────────────────────────────────────────────────────────
  function prosesProduksi() {
    if (!formula || !bolehProduksi) return;
    setLoading(true);
    try {
      const today = isoToday();

      // 1. Validasi ulang stok (re-read dari store)
      const freshInv = getInventarisList();
      for (const bi of bahanInfos) {
        const freshItem = findInvByNama(bi.bahan.nama, freshInv);
        if (!freshItem) {
          throw new Error(`Stok "${bi.bahan.nama}" tidak ditemukan.`);
        }
        const kebutuhan = (bi.bahan.proporsi / 100) * jumlah;
        if (freshItem.jumlahStok < kebutuhan) {
          throw new Error(
            `Stok "${bi.bahan.nama}" tidak mencukupi. Tersedia: ${freshItem.jumlahStok} ${freshItem.satuan}.`
          );
        }
      }

      // 2. Kurangi stok bahan baku (in-memory first, then fire-and-forget DB write)
      for (const bi of bahanInfos) {
        const freshItem = findInvByNama(bi.bahan.nama, freshInv)!;
        const kebutuhan = (bi.bahan.proporsi / 100) * jumlah;
        const stokSebelum = freshItem.jumlahStok;
        addPerubahanStok({
          inventarisId: freshItem.id,
          jenis: 'Lainnya',
          jumlah: kebutuhan,
          satuan: freshItem.satuan,
          tanggal: today,
          catatan: `Dipakai untuk produksi formula: ${formula.nama} (${fmtKg(jumlah)} kg)`,
          sumberPerubahan: 'Produksi Formula',
        });

        if (activeWorkspace?.workspace_uuid) {
          void recordPerubahanStok(activeWorkspace.workspace_uuid, {
            itemId:            freshItem.id,
            itemName:          freshItem.nama,
            sumber:            freshItem.sumber,
            unit:              freshItem.satuan,
            jumlah:            kebutuhan,
            jumlahStokSebelum: stokSebelum,
            tanggal:           today,
            jenis:             'Produksi Formula',
            catatan:           `Dipakai untuk produksi formula: ${formula.nama} (${fmtKg(jumlah)} kg)`,
            referensiId:       freshItem.referensiId,
            kategori:          freshItem.kategori,
          }).then((r) => { if (!r.ok) console.warn('[FormulaProduksi] bahan baku dual-write:', r.error); });
        }
      }

      // 3. Tambah / merge stok hasil produksi
      const hasilItem = addInventarisFromProduksi({
        formulaId: formula.id,
        formulaNama: formula.nama,
        nama: formula.nama,
        kategori: formula.jenis,
        jumlahHasil: jumlah,
        satuan: 'Kg',
        tanggalProduksi: today,
        catatan: `Hasil produksi formula ${formula.jenis} — target: ${formula.targetTernak}`,
      });

      // Phase 2: dual-write hasil produksi → stok_inventaris + stok_inventaris_transactions
      // Note: source_type='Formula' requires formula_id FK lookup — FUTURE FEATURE (FLOW-003M16).
      // The call will fail gracefully (console.warn) until formula UUID lookup is implemented.
      if (activeWorkspace?.workspace_uuid) {
        void recordTambahStok(activeWorkspace.workspace_uuid, {
          itemId:      hasilItem.id,
          itemName:    formula.nama,
          sumber:      hasilItem.sumber,
          unit:        hasilItem.satuan ?? 'Kg',
          jumlah:      jumlah,
          tanggal:     today,
          catatan:     `Hasil produksi formula ${formula.jenis}: ${fmtKg(jumlah)} kg`,
          kategori:    hasilItem.kategori,
          referensiId: hasilItem.referensiId,
        }).then((r) => { if (!r.ok) console.warn('[FormulaProduksi] hasil produksi dual-write:', r.error); });
      }

      // 4. Tandai formula terakhir digunakan
      updateFormula(formula.id, { terakhirDigunakan: today } as Parameters<typeof updateFormula>[1]);

      // 5. Catat batch ke Riwayat Produksi (FP-006) — snapshot bahan, harga, HPP saat ini.
      const bahanDigunakan: BahanDigunakan[] = bahanInfos.map((bi) => {
        const hargaSaatProduksi = bi.bahan.hargaEstimasiPerKg;
        const jumlahDipakai = bi.kebutuhan;
        return {
          referensiId: bi.bahan.referensiId,
          nama: bi.bahan.nama,
          satuan: bi.inv?.satuan ?? bi.bahan.satuan,
          jumlah: jumlahDipakai,
          proporsi: bi.bahan.proporsi,
          hargaSaatProduksi,
          subtotalBiaya: jumlahDipakai * hargaSaatProduksi,
        };
      });
      const prodRecord = addProduksiRecord({
        formulaId: formula.id,
        formulaNama: formula.nama,
        formulaJenis: formula.jenis,
        targetTernak: formula.targetTernak,
        namaHasilProduksi: formula.nama,
        jumlahProduksi: jumlah,
        bahanDigunakan,
        estimasiNutrisiHasil: formula.estimasiNutrisi,
        totalBiayaProduksi: totalNilai,
        hppPerKg,
        catatanProduksi: `Hasil produksi formula ${formula.jenis} — target: ${formula.targetTernak}`,
      });

      void recordCreateProduction(
        formula.id,
        activeWorkspace?.workspace_uuid ?? '',
        currentUser?.id ?? null,
        prodRecord,
      ).catch((err) => console.error('[FormulaProduksi] recordCreateProduction failed:', err));

      setHasilJumlah(jumlah);
      setBerhasil(true);
      setTick((t) => t + 1);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
      setShowKonfirmasi(false);
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!formula && formulaLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
        background: 'var(--color-bg)', padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Memuat formula…</div>
      </div>
    );
  }

  if (!formula) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
        background: 'var(--color-bg)', padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Formula tidak ditemukan</div>
        <button type="button" onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)', background: 'transparent',
            color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  // ── Halaman sukses ────────────────────────────────────────────────────────
  if (berhasil) {
    return (
      <HalamanSukses
        formula={formula}
        jumlah={hasilJumlah}
        onKembali={() => navigate(`/stok-pakan/formula/${formula.id}`)}
        onLihatStok={() => navigate('/stok-pakan?tab=stok')}
      />
    );
  }

  const statusFormula = formula.status;
  const hanyaBacaSaja = statusFormula !== 'Aktif';

  // ── Render utama ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      paddingBottom: 100,
    }}>
      {/* ─── Banner peringatan jika bukan Aktif ──── */}
      {hanyaBacaSaja && (
        <div style={{
          background: '#fff3e0', borderBottom: '1px solid #ffe0b2',
          padding: '10px 16px', textAlign: 'center',
          fontSize: 13, color: '#e65100', fontWeight: 600,
        }}>
          ⚠ Formula berstatus "{statusFormula}" — Produksi tidak dapat dijalankan.
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── 1. Informasi Formula ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel title="Informasi Formula" />
          <Card>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--color-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                📋
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
                  {formula.nama}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                  {formula.jenis} · {formula.targetTernak}
                </div>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {[
                { label: 'Jenis', value: formula.jenis },
                { label: 'Target Ternak', value: formula.targetTernak },
                { label: 'Total Bahan', value: `${formula.jumlahBahan} bahan` },
                { label: 'Est. HPP', value: fmtRp(formula.estimasiHPP) + '/kg' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--color-bg)',
                  borderRadius: 8, padding: '8px 10px',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── 2. Ketersediaan Bahan ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel title="Ketersediaan Bahan" />
          <Card style={{ padding: '4px 16px' }}>
            {bahanInfos.map((bi) => (
              <BahanRow key={bi.bahan.referensiId} info={bi} />
            ))}
            {bahanInfos.length === 0 && (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                Formula tidak memiliki bahan.
              </div>
            )}
          </Card>
          {!semuaDitemukan && (
            <div style={{
              marginTop: 8, padding: '10px 12px', borderRadius: 8,
              background: '#fce4ec', color: '#c62828', fontSize: 12, fontWeight: 600,
            }}>
              ✗ Beberapa bahan tidak ditemukan di stok. Tambahkan terlebih dahulu sebelum produksi.
            </div>
          )}
        </div>

        {/* ── 3. Jumlah Produksi ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel title="Jumlah Produksi" />
          <Card>
            {/* Maksimum info */}
            <div style={{
              background: maxProduksi > 0 ? '#e8f5e9' : '#fce4ec',
              borderRadius: 8, padding: '10px 12px', marginBottom: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: 12, color: maxProduksi > 0 ? '#2e7d32' : '#c62828',
                  fontWeight: 600, marginBottom: 2,
                }}>
                  {maxProduksi > 0 ? '✔ Maksimum yang dapat diproduksi' : '✗ Tidak dapat diproduksi'}
                </div>
                {maxProduksi > 0 ? (
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20' }}>
                    {fmtKg(maxProduksi)} kg
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#c62828' }}>
                    Stok bahan tidak mencukupi.
                  </div>
                )}
                {faktorPembatas && maxProduksi > 0 && (
                  <div style={{ fontSize: 11, color: '#388e3c', marginTop: 2 }}>
                    Faktor pembatas: {faktorPembatas}
                  </div>
                )}
              </div>
              {maxProduksi > 0 && (
                <button
                  type="button"
                  onClick={() => setJumlahStr(String(maxProduksi))}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: '1.5px solid #388e3c', background: '#fff',
                    color: '#388e3c', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Maksimum
                </button>
              )}
            </div>

            {/* Input jumlah */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Jumlah yang akan diproduksi (kg)
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                max={maxProduksi}
                step={1}
                value={jumlahStr}
                onChange={(e) => setJumlahStr(e.target.value)}
                placeholder="Masukkan jumlah…"
                disabled={hanyaBacaSaja || maxProduksi === 0}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 8,
                  border: `1.5px solid ${jumlah > maxProduksi && jumlah > 0 ? '#e53935' : 'var(--color-border)'}`,
                  fontSize: 16, fontWeight: 600,
                  background: hanyaBacaSaja || maxProduksi === 0 ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: 14, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>kg</span>
            </div>
            {jumlah > maxProduksi && jumlah > 0 && (
              <div style={{ fontSize: 12, color: '#e53935', marginTop: 6, fontWeight: 600 }}>
                Melebihi kapasitas maksimum ({fmtKg(maxProduksi)} kg).
              </div>
            )}
          </Card>
        </div>

        {/* ── 4. Preview Perubahan Stok (hanya jika jumlah > 0 & valid) ── */}
        {jumlah > 0 && jumlah <= maxProduksi && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel title="Preview Perubahan Stok" />
            <Card>
              {/* Bahan yang akan berkurang */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#c62828',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Bahan yang akan berkurang
                </div>
                {bahanInfos.map((bi) => {
                  const kebutuhan = bi.kebutuhan;
                  return (
                    <div key={bi.bahan.referensiId} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--color-text)' }}>{bi.bahan.nama}</span>
                      <span style={{ color: '#e53935', fontWeight: 700 }}>
                        -{fmtKg(kebutuhan)} {bi.inv?.satuan ?? bi.bahan.satuan}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px dashed var(--color-border)', margin: '4px 0 14px' }} />

              {/* Hasil yang akan bertambah */}
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#388e3c',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Hasil yang akan bertambah
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: 13,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{formula.nama}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                      Sumber: Hasil Produksi · {formula.jenis}
                    </div>
                  </div>
                  <span style={{ color: '#388e3c', fontWeight: 700 }}>
                    +{fmtKg(jumlah)} kg
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── 5. Ringkasan Produksi ─────────────────────────────────────── */}
        {jumlah > 0 && jumlah <= maxProduksi && (
          <div style={{ marginBottom: 8 }}>
            <SectionLabel title="Ringkasan Produksi" />
            <Card>
              {[
                { label: 'Jumlah Produksi', value: `${fmtKg(jumlah)} kg`, highlight: true },
                { label: 'Est. HPP per kg', value: fmtRp(hppPerKg) },
                { label: 'Total Nilai Produksi', value: fmtRp(totalNilai) },
                { label: 'Tanggal Produksi', value: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                  <span style={{
                    fontWeight: 700,
                    color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
                  }}>{value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      {/* ── Tombol Produksi (fixed bottom) ──────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          disabled={!bolehProduksi || hanyaBacaSaja}
          onClick={() => setShowKonfirmasi(true)}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: 'none',
            background: bolehProduksi && !hanyaBacaSaja ? 'var(--color-primary)' : '#b0bec5',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: bolehProduksi && !hanyaBacaSaja ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: bolehProduksi && !hanyaBacaSaja ? 1 : 0.6,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>🏭</span>
          {hanyaBacaSaja
            ? `Produksi tidak tersedia (${statusFormula})`
            : bolehProduksi
              ? `Proses Produksi ${fmtKg(jumlah)} kg`
              : 'Isi jumlah produksi yang valid'
          }
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
          Produksi mengurangi stok bahan baku dan menambah stok hasil produksi.
        </div>
      </div>

      {/* ── Modal Konfirmasi ─────────────────────────────────────────────── */}
      {showKonfirmasi && (
        <KonfirmasiModal
          formula={formula}
          jumlah={jumlah}
          bahanInfos={bahanInfos}
          onConfirm={prosesProduksi}
          onCancel={() => setShowKonfirmasi(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
