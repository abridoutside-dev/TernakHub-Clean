import { useParams, useNavigate } from 'react-router-dom';
import { getProduksiRecordById } from '../data/produksiFormulaData';
import { useFormula } from '../hooks/useFormula';

// ─── RiwayatProduksiFormulaDetail (FP-006) ──────────────────────────────────────
// Detail satu batch produksi — READ ONLY. Menampilkan snapshot lengkap kondisi
// saat produksi dijalankan: bahan, harga, HPP, nutrisi hasil, dan catatan.
// Tidak ada aksi mutasi apa pun di halaman ini.

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

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      padding: '11px 16px',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor ?? 'var(--color-text)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function RowDivider() {
  return <div style={{ height: 1, background: 'var(--color-border)', marginLeft: 16, marginRight: 16 }} />;
}

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
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

export default function RiwayatProduksiFormulaDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  // Hydrate in-memory store from Supabase on hard refresh (FLOW-003M25).
  // produksiFormulaData is populated by populateProduksiFormulaFromDb inside useFormula.
  const { loading } = useFormula();

  const record = batchId ? getProduksiRecordById(batchId) : undefined;

  // While DB fetch is in-flight, show loader to avoid false NotFound flash.
  if (!record && loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
        background: 'var(--color-bg)', padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Memuat riwayat produksi…</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
        background: 'var(--color-bg)', padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Riwayat produksi tidak ditemukan</div>
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

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 32 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Ringkasan Batch ──────────────────────────────────────────── */}
        <div>
          <SectionLabel title="Ringkasan Batch" />
          <Card>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#e8f5ee', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>
                🏭
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
                  {record.nomorBatch}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                  {fmtWaktu(record.waktuProduksi)}
                </div>
              </div>
            </div>
            <InfoRow label="Nama Formula" value={record.formulaNama} />
            <RowDivider />
            <InfoRow label="Jenis Formula" value={record.formulaJenis} />
            <RowDivider />
            <InfoRow label="Target Ternak" value={record.targetTernak} />
            <RowDivider />
            <InfoRow label="Nama Hasil Produksi" value={record.namaHasilProduksi} />
            <RowDivider />
            <InfoRow label="Jumlah Produksi" value={`${fmtKg(record.jumlahProduksi)} kg`} valueColor="#1b7a43" />
            <RowDivider />
            <InfoRow label="Total Berat Bahan" value={`${fmtKg(record.totalBerat)} kg`} />
            <RowDivider />
            <InfoRow label="Operator" value={record.operator ?? '—'} />
          </Card>
        </div>

        {/* ── Komposisi Bahan / Bahan yang Dipakai ────────────────────── */}
        <div>
          <SectionLabel title="Komposisi & Bahan yang Dipakai" />
          <Card style={{ padding: '4px 16px' }}>
            {record.bahanDigunakan.map((b, i) => (
              <div key={b.referensiId + i} style={{
                padding: '11px 0',
                borderBottom: i < record.bahanDigunakan.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                    {b.nama}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    {b.proporsi}% formula
                  </div>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 4, fontSize: 12, color: 'var(--color-muted)',
                }}>
                  <span>Dipakai: <strong style={{ color: 'var(--color-text)' }}>{fmtKg(b.jumlah)} {b.satuan}</strong></span>
                  <span>@ {fmtRp(b.hargaSaatProduksi)}/{b.satuan}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#1b7a43', marginTop: 2 }}>
                  Subtotal: {fmtRp(b.subtotalBiaya)}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Nutrisi Hasil Produksi ───────────────────────────────────── */}
        <div>
          <SectionLabel title="Nutrisi Hasil Produksi" />
          <Card style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Protein Kasar (PK)', value: record.estimasiNutrisiHasil.pk, color: '#1b7a43' },
                { label: 'Serat Kasar (SK)', value: record.estimasiNutrisiHasil.sk, color: '#7b5e2a' },
                { label: 'TDN', value: record.estimasiNutrisiHasil.tdn, color: '#0277bd' },
              ].map((n) => (
                <div key={n.label} style={{ textAlign: 'center', background: 'var(--color-bg)', borderRadius: 8, padding: '10px 6px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: n.color }}>{n.value}%</div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>{n.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Biaya Produksi ───────────────────────────────────────────── */}
        <div>
          <SectionLabel title="Biaya Produksi" />
          <Card>
            <InfoRow label="Total Biaya Produksi" value={fmtRp(record.totalBiayaProduksi)} valueColor="var(--color-primary)" />
            <RowDivider />
            <InfoRow label="HPP per Kg" value={fmtRp(record.hppPerKg)} valueColor="var(--color-primary)" />
          </Card>
        </div>

        {/* ── Catatan Produksi ─────────────────────────────────────────── */}
        <div>
          <SectionLabel title="Catatan Produksi" />
          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
              {record.catatanProduksi || 'Tidak ada catatan untuk batch ini.'}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
