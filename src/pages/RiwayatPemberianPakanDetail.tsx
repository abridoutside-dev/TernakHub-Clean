// ─── LP-005: Riwayat Pemberian Pakan — Detail Page ────────────────────────────
// Read-only. Menampilkan detail satu sesi pemberian pakan beserta seluruh
// item stok pakan yang digunakan. Tombol "Lihat Riwayat Stok" membuka
// /stok-pakan/riwayat. Tidak ada mutasi pada halaman ini.

import { useParams, useNavigate } from 'react-router-dom';
import { getPemberianPakanById, type PemberianPakanItem } from '../data/pemberianPakanData';
import { usePemberianPakan } from '../hooks/usePemberianPakan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'Draft':                   { label: 'Draft',    color: '#78909c', bg: '#eceff1', icon: '📝' },
  'Siap Diproses':           { label: 'Siap Diproses', color: '#0277bd', bg: '#e1f5fe', icon: '⏳' },
  'Pemberian Pakan Selesai': { label: 'Selesai',  color: '#1b7a43', bg: '#e8f5ee', icon: '✅' },
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

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

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, width: 110, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent ? 'var(--color-primary)' : 'var(--color-text)', flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function PakanItemCard({ item, index }: { item: PemberianPakanItem; index: number }) {
  const isMasterPakan = item.sumber === 'Master Pakan';
  return (
    <div style={{ border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '11px 14px 8px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)' }}>{index + 1}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.namaPakan}
              {item.brand && <span style={{ fontWeight: 600, color: 'var(--color-muted)', fontSize: 12 }}> · {item.brand}</span>}
            </div>
          </div>
          {/* Qty badge */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>{item.jumlah.toLocaleString('id-ID')}</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginLeft: 3 }}>{item.satuan}</span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>

        {/* Sumber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Sumber</span>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
            color: isMasterPakan ? '#2e7d32' : '#6a1b9a',
            background: isMasterPakan ? '#e8f5e9' : '#f3e5f5',
          }}>
            {item.sumber}
          </span>
        </div>

        {/* Kategori */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Kategori</span>
          <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{item.kategori}</span>
        </div>

        {/* Nama Stok (inventarisId) — only shown for in-memory records; empty on DB-hydrated sessions */}
        {item.inventarisId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>ID Inventaris</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{item.inventarisId}</span>
          </div>
        )}

        {/* Master Pakan UUID */}
        {item.masterPakanUuid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Master Pakan</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.masterPakanUuid}</span>
          </div>
        )}

        {/* Produk Komersial UUID */}
        {item.produkKomersialUuid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Produk Komersial</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.produkKomersialUuid}</span>
          </div>
        )}

        {/* Formula UUID */}
        {item.formulaUuid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Formula</span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.formulaUuid}</span>
          </div>
        )}

        {/* Nomor Batch/Lot */}
        {item.nomorBatch && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Batch / Lot</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'monospace' }}>{item.nomorBatch}</span>
          </div>
        )}

        {/* Lokasi Penyimpanan */}
        {item.lokasiPenyimpanan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Lokasi Stok</span>
            <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{item.lokasiPenyimpanan}</span>
          </div>
        )}

        {/* Stok sebelum (snapshot) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>Stok Saat Catat</span>
          <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{item.stokSebelum.toLocaleString('id-ID')} {item.satuan}</span>
        </div>

        {/* Riwayat Stok ID */}
        {item.riwayatStokId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, width: 120, flexShrink: 0 }}>ID Riwayat Stok</span>
            <span style={{ fontSize: 10, color: '#1b7a43', fontFamily: 'monospace', background: '#e8f5ee', borderRadius: 4, padding: '2px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.riwayatStokId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Riwayat Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Data pemberian pakan ini tidak tersedia atau sudah dihapus.
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
        >
          ← Kembali
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatPemberianPakanDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  // Hydrate in-memory store from Supabase so deep-link / hard-refresh works.
  const { loading } = usePemberianPakan();
  const record     = id ? getPemberianPakanById(id) : undefined;

  if (loading && !record) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat riwayat pemberian pakan...</div>
      </div>
    );
  }
  if (!record) return <NotFound onBack={() => navigate('/riwayat-pemberian-pakan')} />;

  const statusCfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG['Draft'];
  const isSelesai = record.status === 'Pemberian Pakan Selesai';
  const totalJumlah = record.items.reduce((s, i) => s + i.jumlah, 0);
  const satuans = [...new Set(record.items.map((i) => i.satuan))];
  const beratLabel = `${totalJumlah.toLocaleString('id-ID')} ${satuans.length === 1 ? satuans[0] : 'campuran'}`;

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Status banner ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: statusCfg.bg, border: `1.5px solid ${statusCfg.color}22` }}>
        <span style={{ fontSize: 20 }}>{statusCfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: statusCfg.color }}>{statusCfg.label}</div>
          {isSelesai && record.selesaiAt && (
            <div style={{ fontSize: 11, color: statusCfg.color, opacity: 0.75, marginTop: 1 }}>
              Diselesaikan {formatTs(record.selesaiAt)}
            </div>
          )}
        </div>
      </div>

      {/* ── Informasi Ternak / Batch ──────────────────────────────────────── */}
      <section>
        <SectionLabel title="Informasi Ternak / Batch" />
        <Card>
          {/* Target visual */}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: record.targetTypeBg || 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {record.targetIcon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.targetName ?? record.targetId}
              </div>
              <div style={{ marginTop: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                  color: record.targetKind === 'batch' ? '#5d4037' : '#1b5e20',
                  background: record.targetKind === 'batch' ? '#efebe9' : '#e8f5e9',
                }}>
                  {record.targetKind === 'batch' ? '📦 Batch' : '🐑 Individu'}
                </span>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <InfoRow icon="📅" label="Tanggal" value={formatDate(record.tanggal)} />
          <InfoRow icon="🕐" label="Jam Pemberian" value={record.waktuPemberian} />
          {record.petugas && <InfoRow icon="👤" label="Petugas" value={record.petugas} />}
          <InfoRow icon="🌾" label="Jumlah Item" value={`${record.items.length} item pakan`} />
          <InfoRow icon="⚖️" label="Total Berat" value={beratLabel} />
          <div style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💬</span>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, width: 110, flexShrink: 0, paddingTop: 1 }}>Catatan</span>
              <span style={{ fontSize: 13, color: record.catatan ? 'var(--color-text)' : 'var(--color-muted)', fontStyle: record.catatan ? 'normal' : 'italic' }}>
                {record.catatan ?? 'Tidak ada catatan'}
              </span>
            </div>
          </div>
          {record.sumberJadwalId && (
            <div style={{ padding: '8px 16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>📅</span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, width: 110, flexShrink: 0 }}>Dari Jadwal</span>
                <span style={{ fontSize: 11, color: '#0277bd', fontFamily: 'monospace', background: '#e1f5fe', borderRadius: 4, padding: '2px 6px' }}>{record.sumberJadwalId}</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── Daftar Stok Pakan ─────────────────────────────────────────────── */}
      <section>
        <SectionLabel title={`Stok Pakan Digunakan (${record.items.length} item)`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {record.items.map((item, i) => (
            <PakanItemCard key={`${item.inventarisId}-${i}`} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* ── Riwayat Stok IDs (LP-003) ──────────────────────────────────────── */}
      {isSelesai && record.riwayatStokIds && record.riwayatStokIds.length > 0 && (
        <section>
          <SectionLabel title="Referensi Riwayat Stok" />
          <Card>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                Sesi ini menghasilkan {record.riwayatStokIds.length} entri perubahan stok yang dapat ditelusuri di Riwayat Stok Pakan.
              </div>
              {record.riwayatStokIds.map((sid) => (
                <div key={sid} style={{ fontSize: 10, color: '#1b7a43', fontFamily: 'monospace', background: '#e8f5ee', borderRadius: 4, padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sid}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ── Tombol: Lihat Riwayat Stok ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/stok-pakan/riwayat')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '14px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--color-primary)',
          background: isSelesai ? 'var(--color-primary)' : 'var(--color-primary-light)',
          color: isSelesai ? '#fff' : 'var(--color-primary)',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <span>📊</span>
        Lihat Riwayat Stok Pakan
        <span style={{ fontSize: 12, opacity: 0.75 }}>→</span>
      </button>

      {/* ── Metadata ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingTop: 4 }}>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
          ID: {record.id}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
          Dicatat: {formatTs(record.createdAt)}
        </div>
      </div>
    </div>
  );
}
