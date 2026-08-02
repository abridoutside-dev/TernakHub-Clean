/**
 * IntegrasiPengobatan.tsx  (KH-006)
 * ─────────────────────────────────────────────────────────────────
 * Integrasi Stok Obat — fifth step in the health workflow.
 * Route: /kesehatan-hewan/integrasi/:id  (id = pengobatanSesiId)
 *
 * This page is the trigger point for the atomic integration.
 * It shows a review of all pengobatan items, then on "Selesaikan
 * Pengobatan" calls executeIntegrasiPengobatan() which:
 *   1. Validates all items (stock, expiry, quantity).
 *   2. Atomically deducts stock, creates Riwayat Obat + Riwayat Kesehatan.
 *   3. Marks the sesi as 'Pengobatan Selesai'.
 *   4. On any error → full rollback (nothing is persisted).
 *
 * On success → navigate to /kesehatan-hewan/kontrol/:tindakanSesiId (KH-007).
 */

import { useState, useMemo }   from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  getPengobatanSesi,
  getPengobatanItemsBySesi,
  type PengobatanItem,
} from '../data/pengobatanKesehatanData';
import { getTindakanSesi }  from '../data/tindakanKesehatanData';
import { getDiagnosa }      from '../data/diagnosaKesehatanData';
import { getPemeriksaan }   from '../data/pemeriksaanKesehatanData';
import { getStokObatById, getStatusStok } from '../data/stokObatData';
import {
  executeIntegrasiPengobatan,
  validateIntegrasiPengobatan,
  type IntegrasiResult,
} from '../services/integrasiPengobatanService';
import { getRiwayatKesehatanByPengobatanSesi } from '../data/riwayatKesehatanData';
import { useWorkspace }    from '../contexts/WorkspaceContext';
import { useStokObat }     from '../hooks/useStokObat';
import { recordTreatment } from '../services/healthService';
import { addStokKeluar }   from '../services/stokObatService';

// ─── Style constants ──────────────────────────────────────────────────────────

const STATUS_STOK_COLOR: Record<string, { bg: string; color: string }> = {
  Tersedia:       { bg: '#e8f5e9', color: '#2e7d32' },
  'Hampir Habis': { bg: '#fff3e0', color: '#e65100' },
  Habis:          { bg: '#ffebee', color: '#c62828' },
  Expired:        { bg: '#fce4ec', color: '#ad1457' },
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
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </section>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)' }} />;
}

// ─── Review item card ─────────────────────────────────────────────────────────

function ReviewItemCard({
  item,
  index,
  warningMsg,
}: {
  item: PengobatanItem;
  index: number;
  warningMsg?: string;
}) {
  const stok       = getStokObatById(item.stokObatUuid);
  const statusStok = stok ? getStatusStok(stok) : 'Habis';
  const sc         = STATUS_STOK_COLOR[statusStok] ?? STATUS_STOK_COLOR['Habis'];

  return (
    <div style={{
      padding: '14px 16px',
      background: warningMsg ? '#fff8e1' : 'var(--color-surface)',
      borderLeft: warningMsg ? '3px solid #f9a825' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Index bubble */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: warningMsg ? '#f9a825' : 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{index + 1}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>
              {item.namaProduk}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0 }}>
              {statusStok}
            </span>
          </div>

          {/* Generik */}
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 6 }}>
            {item.namaGenerik} · {item.brand} · {item.bentukSediaan}
          </div>

          {/* Treatment details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px', marginBottom: stok ? 4 : 0 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>
              💉 {item.dosis} {item.satuanDosis}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.frekuensi}</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.lamaPemberian}</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.caraPemberian}</span>
          </div>

          {/* Stock availability */}
          {stok && (
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: item.catatan ? 4 : 0 }}>
              Stok saat ini: <strong>{stok.jumlah} {stok.satuan}</strong>
              {stok.lokasiPenyimpanan && ` · 📍 ${stok.lokasiPenyimpanan}`}
            </div>
          )}

          {/* Catatan */}
          {item.catatan && (
            <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '3px 0 0', lineHeight: 1.5 }}>
              {item.catatan}
            </p>
          )}

          {/* Warning */}
          {warningMsg && (
            <p style={{ fontSize: 11.5, color: '#e65100', fontWeight: 700, margin: '5px 0 0' }}>
              ⚠ {warningMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView({
  itemCount,
  riwayatObatCount,
  riwayatKesCount,
  onLanjut,
}: {
  itemCount: number;
  riwayatObatCount: number;
  riwayatKesCount: number;
  onLanjut: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* Success banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1b7a43 0%, #2e7d32 100%)',
        borderRadius: 'var(--radius-lg)', padding: '28px 24px', textAlign: 'center', color: '#fff',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
          Pengobatan Selesai!
        </h2>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0, lineHeight: 1.6 }}>
          Integrasi stok berhasil dilakukan secara atomik.<br />
          Semua data tersimpan dan terhubung.
        </p>
      </div>

      {/* Stats */}
      <SectionCard title="Ringkasan Integrasi">
        {[
          { icon: '💊', label: 'Obat diproses',       value: `${itemCount} item` },
          { icon: '📦', label: 'Stok dikurangi',      value: `${riwayatObatCount} record` },
          { icon: '🩺', label: 'Riwayat Kesehatan',   value: `${riwayatKesCount} record` },
        ].map((row, i, arr) => (
          <div key={row.label}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{row.icon}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{row.value}</span>
            </div>
            {i < arr.length - 1 && <Divider />}
          </div>
        ))}
      </SectionCard>

      {/* Linked records */}
      <div style={{
        background: '#e8f5e9', border: '1.5px solid #a5d6a7',
        borderRadius: 'var(--radius-md)', padding: '12px 16px',
        fontSize: 12.5, color: '#2e7d32', lineHeight: 1.7,
      }}>
        <strong>✓ Atomic transaction berhasil</strong><br />
        Riwayat Stok dan Riwayat Kesehatan saling terhubung via UUID referensi.<br />
        <strong>✓ Rollback tidak diperlukan</strong> — semua {itemCount} item diproses tanpa error.
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onLanjut}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Lanjut ke Kontrol ›
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrasiPengobatan() {
  const { id: sesiId } = useParams<{ id: string }>();
  const navigate       = useNavigate();

  const { activeWorkspace }          = useWorkspace();
  const { refresh: refreshStokObat } = useStokObat();

  const sesi      = sesiId ? getPengobatanSesi(sesiId) : null;
  const tindakan  = sesi   ? getTindakanSesi(sesi.tindakanSesiId) : null;
  const diagnosa  = tindakan ? getDiagnosa(tindakan.diagnosaId) : null;
  const pemeriksaan = sesi  ? getPemeriksaan(sesi.pemeriksaanId) : null;

  const items = useMemo(
    () => (sesiId ? getPengobatanItemsBySesi(sesiId) : []),
    [sesiId],
  );

  // Check if already completed (page revisit guard)
  const alreadyDone = sesi?.status === 'Pengobatan Selesai';
  const existingRiwayat = useMemo(
    () => (sesiId && alreadyDone ? getRiwayatKesehatanByPengobatanSesi(sesiId) : []),
    [sesiId, alreadyDone],
  );

  const [result,   setResult]   = useState<IntegrasiResult | null>(null);
  const [loading,  setLoading]  = useState(false);

  // Pre-validate items to show inline warnings
  const validationError = useMemo(
    () => (sesiId ? validateIntegrasiPengobatan(sesiId) : null),
    [sesiId],
  );

  function handleSelesaikan() {
    if (!sesiId) return;
    setLoading(true);
    try {
      const res = executeIntegrasiPengobatan(sesiId);
      setResult(res);

      // ── Supabase dual-write (fire-and-forget) ─────────────────────────────────
      // Phase 1 (in-memory) already executed above. Phase 2 persists to Supabase.
      // Failure of any individual item is logged but never blocks UI — the user
      // has already received success feedback from the in-memory result.
      //
      // Write sequence per item (sequential, not parallel):
      //   recordTreatment  → health_treatments row  → returns treatmentDbRow.id
      //   addStokKeluar    → stok_obat_keluar row    → treatment_id FK populated
      //   DB trigger deduct_stok_obat auto-decrements stok_obat.quantity
      if (res.ok && activeWorkspace?.workspace_uuid) {
        const wsId    = activeWorkspace.workspace_uuid;
        const sesi    = getPengobatanSesi(sesiId)!;
        const items   = getPengobatanItemsBySesi(sesiId);
        const pem     = getPemeriksaan(sesi.pemeriksaanId);
        const tanggal = pem?.tanggal ?? new Date().toISOString().split('T')[0];
        const livestockId = pem?.livestockId ?? null;

        void (async () => {
          for (const item of items) {
            try {
              // Step 1 — health_treatments
              const treatResult = await recordTreatment(wsId, {
                livestockId:   livestockId ?? '',
                // Use supabaseCheckupId (server UUID) not local pemeriksaanId —
                // the DB row was created with a server-generated UUID.
                checkupId:     pem?.supabaseCheckupId ?? null,
                tanggal,
                tipe:          'Pengobatan',
                namaObat:      item.namaProduk,
                dosis:         item.dosis
                                 ? `${item.dosis} ${item.satuanDosis}`.trim()
                                 : null,
                caraPemberian: item.caraPemberian || null,
                lamaPemberian: item.lamaPemberian
                                 ? (parseInt(item.lamaPemberian, 10) || null)
                                 : null,
                catatan:       item.catatan || null,
              });
              if (!treatResult.ok) {
                console.error(
                  '[IntegrasiPengobatan] recordTreatment failed:',
                  item.namaProduk, treatResult.error,
                );
                continue;
              }

              // Step 2 — stok_obat_keluar (needs treatment_id FK from Step 1)
              const stok = getStokObatById(item.stokObatUuid);
              if (!stok) {
                console.error(
                  '[IntegrasiPengobatan] stok not found, skipping keluar:',
                  item.stokObatUuid,
                );
                continue;
              }
              // Re-derive deduction using same formula as executeIntegrasiPengobatan
              const dosisNum  = parseFloat(item.dosis);
              const deduction = (
                !isNaN(dosisNum) && dosisNum > 0 && item.satuanDosis === stok.satuan
              ) ? dosisNum : 1;

              const keluarResult = await addStokKeluar(wsId, stok.uuid, {
                jumlah:        deduction,
                tanggalKeluar: tanggal,
                alasan:        'Penggunaan Pengobatan',
                livestockId,
                treatmentId:   treatResult.data.id,
                catatan:       item.catatan || null,
              });
              if (!keluarResult.ok) {
                console.error(
                  '[IntegrasiPengobatan] addStokKeluar failed:',
                  item.namaProduk, keluarResult.error,
                );
              }
            } catch (err) {
              console.error(
                '[IntegrasiPengobatan] Supabase dual-write error for item:',
                item.namaProduk, err,
              );
            }
          }
          // Sync in-memory STOK_OBAT_ITEMS with Supabase after all writes
          refreshStokObat();
        })();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLanjut() {
    if (tindakan) {
      navigate(`/kesehatan-hewan/kontrol/${tindakan.id}`);
    } else {
      navigate('/kesehatan-hewan');
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!sesi || !tindakan || !pemeriksaan) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Data Pengobatan Tidak Ditemukan
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Pastikan Anda mengakses halaman ini melalui proses Pengobatan yang benar.
        </p>
        <button type="button" onClick={() => navigate('/kesehatan-hewan')}
          style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          Kembali ke Kesehatan Hewan
        </button>
      </div>
    );
  }

  const diagnosaNama = diagnosa?.sumber === 'master_penyakit'
    ? (diagnosa.namaPenyakit ?? 'Penyakit tidak diketahui')
    : (diagnosa?.namaDiagnosa ?? 'Diagnosa Manual');

  // ── Already done (page revisit) ───────────────────────────────────────────────
  if (alreadyDone && !result) {
    return (
      <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <WorkflowBreadcrumb done />
        <div style={{
          background: '#e8f5e9', border: '1.5px solid #a5d6a7',
          borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2e7d32', marginBottom: 6 }}>
            Pengobatan Sudah Selesai
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
            Integrasi stok sudah dilakukan. {existingRiwayat.length} riwayat tersimpan.
          </p>
          <button type="button" onClick={handleLanjut}
            style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
            Lanjut ke Kontrol ›
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (result?.ok) {
    return (
      <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <WorkflowBreadcrumb done />
        <SuccessView
          itemCount={result.itemCount}
          riwayatObatCount={result.riwayatObatUuids.length}
          riwayatKesCount={result.riwayatKesehatanUuids.length}
          onLanjut={handleLanjut}
        />
      </div>
    );
  }

  // ── Review + execute view ─────────────────────────────────────────────────────
  const failedIdx = result && !result.ok ? result.failedItemIndex : -1;

  return (
    <div style={{ padding: '20px 16px 110px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Breadcrumb */}
      <WorkflowBreadcrumb done={false} />

      {/* Context banner */}
      <div style={{
        background: 'var(--color-primary-light)', border: '1.5px solid var(--color-primary)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔗</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Integrasi Stok Obat</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: 'var(--color-primary)', color: '#fff', marginLeft: 'auto',
          }}>
            {pemeriksaan.mode === 'individu' ? 'Individu' : 'Batch'}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{diagnosaNama}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text)' }}>📅 <strong>{pemeriksaan.tanggal}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--color-text)' }}>👤 <strong>{pemeriksaan.petugas}</strong></span>
          <span style={{ fontSize: 12, color: 'var(--color-text)' }}>💊 <strong>{items.length} obat</strong></span>
        </div>
      </div>

      {/* Pre-validation warning */}
      {validationError && (
        <div style={{
          background: '#fff3e0', border: '1.5px solid #ffb74d',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 13, color: '#e65100', fontWeight: 600, lineHeight: 1.5,
        }}>
          ⚠ {validationError.reason}
          <div style={{ fontSize: 11.5, fontWeight: 400, marginTop: 4 }}>
            Perbaiki masalah di atas sebelum melanjutkan.
          </div>
        </div>
      )}

      {/* Error result from failed execution */}
      {result && !result.ok && (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>
            ❌ Integrasi Gagal — Rollback Dilakukan
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--color-danger)', margin: 0, lineHeight: 1.6 }}>
            {result.reason}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: '6px 0 0' }}>
            Tidak ada stok yang dikurangi. Tidak ada riwayat yang tersimpan. Data kembali seperti semula.
          </p>
        </div>
      )}

      {/* Review items */}
      <SectionCard title={`Review Obat (${items.length} item)`}>
        {items.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            Tidak ada item pengobatan.
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id}>
              <ReviewItemCard
                item={item}
                index={idx}
                warningMsg={idx === failedIdx && result && !result.ok ? result.reason : undefined}
              />
              {idx < items.length - 1 && <Divider />}
            </div>
          ))
        )}
      </SectionCard>

      {/* What will happen info box */}
      {!result && (
        <div style={{
          background: '#e3f2fd', border: '1.5px solid #90caf9',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          fontSize: 12.5, color: '#1565c0', lineHeight: 1.8,
        }}>
          <strong>Saat Anda menekan "Selesaikan Pengobatan":</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            <li>Semua {items.length} item divalidasi ulang secara bersamaan.</li>
            <li>Stok dikurangi sesuai dosis secara atomik (all-or-nothing).</li>
            <li>Riwayat Stok & Riwayat Kesehatan dibuat dan saling terhubung.</li>
            <li>Jika ada yang gagal → rollback otomatis, tidak ada yang tersimpan.</li>
          </ul>
        </div>
      )}

      {/* Execute button */}
      {sesi.status !== 'Pengobatan Selesai' && (
        <button
          type="button"
          onClick={handleSelesaikan}
          disabled={loading || !!validationError || items.length === 0}
          style={{
            width: '100%', padding: '15px',
            background: loading || !!validationError || items.length === 0
              ? 'var(--color-muted)'
              : 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 700,
            cursor: loading || !!validationError || items.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Memproses…' : `✅ Selesaikan Pengobatan (${items.length} obat)`}
        </button>
      )}

    </div>
  );
}

// ─── Workflow breadcrumb ──────────────────────────────────────────────────────

function WorkflowBreadcrumb({ done }: { done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', overflowX: 'auto', paddingBottom: 2 }}>
      {[
        { label: 'Pemeriksaan', active: false, done: true },
        { label: 'Diagnosa',    active: false, done: true },
        { label: 'Tindakan',    active: false, done: true },
        { label: 'Pengobatan',  active: false, done: true },
        { label: 'Integrasi',   active: !done, done },
        { label: 'Selesai',     active: false, done: false },
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
  );
}
