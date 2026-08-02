// ─── Marketplace — Detail Laporan (MPK-018) ────────────────────────────────────
// Menampilkan detail lengkap satu laporan:
//   Nomor, Listing, Workspace Terlapor, Pelapor, Alasan, Keterangan,
//   Lampiran, Status, Riwayat Penanganan.
// Halaman ini baca-saja — tidak ada aksi mutasi dari UI.

import { useNavigate, useParams } from 'react-router-dom';
import {
  getLaporanById,
  STATUS_LAPORAN_META,
  ALASAN_LAPORAN_LIST,
  type LaporanRecord,
  type StatusLaporan,
  type RiwayatPenangananEvent,
} from '../data/marketplaceLaporanData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function alasanDeskripsi(alasan: string): string {
  return ALASAN_LAPORAN_LIST.find((a) => a.value === alasan)?.deskripsi ?? '';
}

function alasanIcon(alasan: string): string {
  return ALASAN_LAPORAN_LIST.find((a) => a.value === alasan)?.icon ?? '📝';
}

function riwayatColor(status: StatusLaporan): { color: string; bg: string } {
  const meta = STATUS_LAPORAN_META[status];
  return { color: meta.color, bg: meta.bg };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '7px 0', borderBottom: '1px solid var(--color-border)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, textAlign: 'right', flex: 1 }}>{value}</span>
    </div>
  );
}

function StatusChip({ status }: { status: StatusLaporan }) {
  const meta = STATUS_LAPORAN_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 700,
      color: meta.color, background: meta.bg,
      borderRadius: 20, padding: '5px 12px',
    }}>
      {meta.icon} {status}
    </span>
  );
}

function RiwayatItem({ event, isLast }: { event: RiwayatPenangananEvent; isLast: boolean }) {
  const c = riwayatColor(event.status);
  const meta = STATUS_LAPORAN_META[event.status];
  return (
    <div style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 14 }}>
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: c.bg, border: `1.5px solid ${c.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 4 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: c.color, background: c.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {event.status}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            {formatTanggal(event.tanggal)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
          {event.catatan}
        </div>
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 40 }}>🔎</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '10px 0 4px' }}>
        Laporan tidak ditemukan
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
        Laporan ini mungkin sudah dihapus atau nomornya tidak valid.
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Kembali ke Laporan
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceDetailLaporan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const laporan: LaporanRecord | undefined = id ? getLaporanById(id) : undefined;

  if (!laporan) {
    return <NotFound onBack={() => navigate('/marketplace/laporan')} />;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      {/* Header ringkas */}
      <div style={{
        background: 'linear-gradient(135deg, #c62828 0%, #8b1a1a 100%)',
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        marginBottom: 14, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>🚩</span>
        <div>
          <div style={{ fontSize: 10.5, opacity: 0.75, marginBottom: 2, fontFamily: 'monospace' }}>
            {laporan.id}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Detail Laporan</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusChip status={laporan.status} />
        </div>
      </div>

      {/* Informasi Laporan */}
      <SectionCard title="📋 Informasi Laporan">
        <InfoRow label="Nomor Laporan" value={
          <span style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{laporan.id}</span>
        } />
        <InfoRow label="Tanggal Laporan"   value={formatTanggal(laporan.tanggalLaporan)} />
        <InfoRow label="Status"            value={<StatusChip status={laporan.status} />} />
        <InfoRow label="Pelapor"           value={laporan.workspaceNamaPelapor} />
        <InfoRow label="Workspace Terlapor" value={laporan.workspaceNamaTerlapor} />
      </SectionCard>

      {/* Listing */}
      <SectionCard title="🏷️ Listing yang Dilaporkan">
        <InfoRow label="Judul Listing" value={laporan.listingJudul} />
        <InfoRow label="Kategori"      value={laporan.listingKategoriSlug} />
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() =>
              navigate(`/marketplace/${laporan.listingKategoriSlug}/${laporan.listingSlug}`)
            }
            style={{
              width: '100%', padding: '9px 0',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-primary)', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Buka Halaman Listing →
          </button>
        </div>
      </SectionCard>

      {/* Alasan & Keterangan */}
      <SectionCard title="⚠️ Alasan & Keterangan">
        {/* Alasan chip */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 5 }}>Alasan Pelaporan</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff3e0', border: '1.5px solid #ffe082',
            borderRadius: 'var(--radius-md)', padding: '6px 12px',
            fontSize: 12.5, fontWeight: 700, color: '#7b3f00',
          }}>
            {alasanIcon(laporan.alasan)} {laporan.alasan}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5, lineHeight: 1.4 }}>
            {alasanDeskripsi(laporan.alasan)}
          </div>
        </div>

        {/* Keterangan */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 5 }}>Keterangan Pelapor</div>
          <div style={{
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '10px 12px',
            fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6,
          }}>
            {laporan.keterangan}
          </div>
        </div>
      </SectionCard>

      {/* Lampiran */}
      <SectionCard title="📎 Lampiran">
        {laporan.lampiran.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '10px 0' }}>
            Tidak ada lampiran.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {laporan.lampiran.map((item, i) => (
              <div
                key={i}
                style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Riwayat Penanganan */}
      <SectionCard title="📅 Riwayat Penanganan">
        {laporan.riwayatPenanganan.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Belum ada riwayat penanganan.
          </div>
        ) : (
          laporan.riwayatPenanganan.map((event, i) => (
            <RiwayatItem
              key={i}
              event={event}
              isLast={i === laporan.riwayatPenanganan.length - 1}
            />
          ))
        )}
      </SectionCard>

      {/* Informasi Pendukung */}
      <SectionCard title="ℹ️ Informasi Pendukung">
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: 'var(--color-text)' }}>Laporan tidak langsung menghapus listing.</strong>{' '}
            Moderator akan meninjau laporan terlebih dahulu sebelum mengambil tindakan.
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: 'var(--color-text)' }}>Proses tinjauan:</strong>{' '}
            Biasanya diselesaikan dalam 1–3 hari kerja tergantung kompleksitas.
          </div>
          <div>
            <strong style={{ color: 'var(--color-text)' }}>Laporan palsu:</strong>{' '}
            Laporan yang terbukti tidak berdasar dapat dikenai pembatasan akun pelapor.
          </div>
        </div>
      </SectionCard>

      {/* Tombol kembali */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/laporan')}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ← Kembali ke Laporan Marketplace
      </button>
    </div>
  );
}
