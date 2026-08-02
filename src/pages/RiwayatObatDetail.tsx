// ─── Riwayat Obat Detail (SO-006) ────────────────────────────────────────────
// Halaman detail read-only untuk satu record riwayat stok obat.
// Route: /stok-obat/riwayat/:id

import { useParams, useNavigate } from 'react-router-dom';
import { getRiwayatObatById, AKTIVITAS_CONFIG } from '../data/riwayatObatData';
import { getStokObatById } from '../data/stokObatData';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderBottom: '1.5px solid var(--color-border)',
      borderLeft: `4px solid ${color}`,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: 0.2 }}>
        {title}
      </span>
    </div>
  );
}

function InfoRow({
  label, value, mono, last,
}: {
  label: string; value: React.ReactNode; mono?: boolean; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderBottom: last ? 'none' : '1px solid var(--color-border)',
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, minWidth: 128 }}>
        {label}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
        textAlign: 'right', lineHeight: 1.5,
        fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all',
      }}>
        {value ?? <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>—</span>}
      </span>
    </div>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatObatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const record = id ? getRiwayatObatById(id) : undefined;

  if (!record) {
    return (
      <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Record Tidak Ditemukan
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Record riwayat ini mungkin sudah dihapus atau ID tidak valid.
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat')}
          style={{
            marginTop: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700,
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}
        >
          Kembali ke Stok Obat
        </button>
      </div>
    );
  }

  const cfg = AKTIVITAS_CONFIG[record.jenisAktivitas];
  const stokItem = getStokObatById(record.stokObatUuid);

  const qtyChange = record.jumlahPerubahan;
  const absQty = Math.abs(qtyChange);
  const isPositive = qtyChange > 0;
  const isNeutral = qtyChange === 0;

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Hero Card ─────────────────────────────────────────────────────── */}
      <div style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.accent}40`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        textAlign: 'center',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {cfg.icon}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
            {record.namaProduk}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {record.brand}
          </div>
        </div>

        {/* Qty Delta */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: '#fff', borderRadius: 'var(--radius-sm)',
          padding: '12px 24px', width: '100%', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>Sebelum</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
              {record.jumlahSebelum.toLocaleString('id-ID')}
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', marginLeft: 3 }}>{record.satuan}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>Perubahan</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isNeutral ? 'var(--color-muted)' : cfg.color, lineHeight: 1 }}>
              {isNeutral ? '—' : `${cfg.sign}${absQty}`}
              <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 3 }}>{record.satuan}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>Sesudah</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
              {record.jumlahSesudah.toLocaleString('id-ID')}
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', marginLeft: 3 }}>{record.satuan}</span>
            </div>
          </div>
        </div>

        {/* Read-only badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
          background: 'var(--color-border)', borderRadius: 20, padding: '3px 10px',
        }}>
          🔒 Riwayat — Hanya Baca
        </div>
      </div>

      {/* ── Informasi Transaksi ───────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader icon="📋" title="Informasi Transaksi" color={cfg.accent} />
        <InfoRow label="Jenis Aktivitas"    value={<span style={{ color: cfg.color, fontWeight: 800 }}>{record.jenisAktivitas}</span>} />
        <InfoRow label="Waktu"              value={formatTimestamp(record.timestamp)} />
        <InfoRow label="Alasan"             value={record.alasan} />
        <InfoRow label="Modul Sumber"       value={record.modulSumber} />
        <InfoRow label="Operator"           value={record.pengguna} />
        <InfoRow label="Catatan"            value={record.catatan} last />
      </SectionCard>

      {/* ── Detail Produk ─────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader icon="💊" title="Detail Produk" color="#0277bd" />
        <InfoRow label="Nama Produk"        value={record.namaProduk} />
        <InfoRow label="Brand"              value={record.brand} />
        <InfoRow label="Nomor Batch"        value={record.nomorBatch} mono />
        <InfoRow label="Tanggal Expired"    value={record.tanggalExpired ? formatDate(record.tanggalExpired) : undefined} />
        <InfoRow label="Satuan"             value={record.satuan} />
        {stokItem && (
          <InfoRow label="Lokasi Penyimpanan" value={stokItem.lokasiPenyimpanan ?? '—'} last />
        )}
      </SectionCard>

      {/* ── Perubahan Stok ────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader icon="📊" title="Perubahan Stok" color={cfg.accent} />
        <InfoRow label="Stok Sebelum"       value={`${record.jumlahSebelum.toLocaleString('id-ID')} ${record.satuan}`} />
        <InfoRow
          label="Perubahan"
          value={
            isNeutral
              ? <span style={{ color: 'var(--color-muted)' }}>Tidak ada perubahan</span>
              : <span style={{ color: cfg.color, fontWeight: 800 }}>
                  {cfg.sign}{absQty.toLocaleString('id-ID')} {record.satuan}
                </span>
          }
        />
        <InfoRow label="Stok Sesudah"       value={`${record.jumlahSesudah.toLocaleString('id-ID')} ${record.satuan}`} last />
      </SectionCard>

      {/* ── Referensi ─────────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader icon="🔗" title="Referensi" color="#37474f" />
        <InfoRow label="UUID Record"        value={record.uuid} mono />
        <InfoRow label="Stok Obat UUID"     value={record.stokObatUuid} mono />
        <InfoRow label="Master Obat UUID"   value={record.masterObatUuid} mono />
        {record.produkKomersialUuid && (
          <InfoRow label="Prod. Komersial UUID" value={record.produkKomersialUuid} mono />
        )}
        {record.transaksiUuid && (
          <InfoRow label="Transaksi UUID"   value={record.transaksiUuid} mono />
        )}
        {record.livestockUuid && (
          <InfoRow label="Ternak UUID"      value={record.livestockUuid} mono />
        )}
        <InfoRow label="Integritas"
          value={
            <span style={{ color: '#1b7a43', fontWeight: 800 }}>
              ✅ Valid — Referensi aktif
            </span>
          }
          last
        />
      </SectionCard>

    </div>
  );
}
