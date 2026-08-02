// ─── MPK-010 — Halaman Detail Negosiasi Marketplace ──────────────────────────
// Detail satu sesi negosiasi: info listing, pembeli, penjual, harga awal,
// harga penawaran, qty, riwayat negosiasi, dan tombol aksi sesuai status.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketplace } from '../hooks/useMarketplace';
import { recordUpdateNegosiasiStatus } from '../services/marketplaceService';
import {
  getNegosiasiById,
  ajukanPenawaranBalik,
  setujuiNegosiasi,
  setujuiPenawaranBalik,
  tolakNegosiasi,
  batalkanNegosiasi,
  ubahPenawaran,
  type NegosiasiStatus,
  type NegosiasiItem,
  type AksiNegosiasi,
} from '../data/marketplaceNegosiasiData';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<NegosiasiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Respon Penjual': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  'Penawaran Balik':         { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  Disetujui:                 { bg: '#e8f5ee', color: '#1b5e20', icon: '✅' },
  Ditolak:                   { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Dibatalkan Pembeli':      { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
  Kadaluarsa:                { bg: '#f5f5f5', color: '#757575', icon: '⌛' },
};

const AKSI_LABEL: Record<AksiNegosiasi, string> = {
  'Penawaran Dibuat':    'Penawaran Dibuat',
  'Penawaran Diubah':    'Penawaran Diubah',
  'Penawaran Balik':     'Penawaran Balik dari Penjual',
  'Penawaran Diterima':  'Penawaran Diterima ✓',
  'Penawaran Ditolak':   'Penawaran Ditolak ✗',
  'Penawaran Kadaluarsa':'Penawaran Kadaluarsa',
  'Dibatalkan Pembeli':  'Dibatalkan oleh Pembeli',
};

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function formatDatetime(isoTs: string): string {
  const d = new Date(isoTs);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{
        padding: '10px 16px', background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>{title}</div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, highlight, mono }: {
  label: string; value: React.ReactNode; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: highlight ? 16 : 13, fontWeight: highlight ? 800 : 500,
        color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
        fontFamily: mono ? 'monospace' : undefined,
      }}>
        {value}
      </div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>;
}

function RiwayatTimeline({ negosiasi }: { negosiasi: NegosiasiItem }) {
  const riwayat = [...negosiasi.riwayatNegosiasi].reverse();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {riwayat.map((entry, idx) => {
        const isFirst = idx === 0;
        const olehColor = entry.oleh === 'Pembeli' ? '#1565c0' : entry.oleh === 'Penjual' ? '#1b7a43' : '#757575';
        return (
          <div key={entry.timestamp + idx} style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isFirst ? 'var(--color-primary)' : 'var(--color-bg)',
                border: `2px solid ${isFirst ? 'var(--color-primary)' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: isFirst ? '#fff' : 'var(--color-muted)', flexShrink: 0,
              }}>
                {entry.oleh === 'Pembeli' ? '🙋' : entry.oleh === 'Penjual' ? '🏪' : '⚙️'}
              </div>
              {idx < riwayat.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 16, background: 'var(--color-border)', margin: '2px 0' }} />
              )}
            </div>
            <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: olehColor }}>
                  {entry.oleh}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  — {AKSI_LABEL[entry.aksi]}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatRp(entry.harga)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {entry.qty} {negosiasi.satuanHarga}
                </span>
              </div>
              {entry.catatan && (
                <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 3, fontStyle: 'italic' }}>
                  "{entry.catatan}"
                </div>
              )}
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 3 }}>
                {formatDatetime(entry.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal Aksi ───────────────────────────────────────────────────────────────

type ModalType =
  | 'setujui'          // Penjual setujui penawaran Pembeli
  | 'setujuiBalik'     // Pembeli setujui Penawaran Balik
  | 'penawaranBalik'   // Penjual buat counter-offer
  | 'ubahPenawaran'    // Pembeli ubah penawaran
  | 'tolak'            // Penjual tolak
  | 'batalkan';        // Pembeli batalkan

function ActionModal({
  type,
  negosiasi,
  onConfirm,
  onClose,
}: {
  type: ModalType;
  negosiasi: NegosiasiItem;
  onConfirm: (harga: number, qty: number, catatan: string) => void;
  onClose: () => void;
}) {
  const [harga, setHarga]   = useState(negosiasi.hargaPenawaran);
  const [qty, setQty]       = useState(negosiasi.qtyPenawaran);
  const [catatan, setCatatan] = useState('');

  const needsPrice  = type === 'penawaranBalik' || type === 'ubahPenawaran';
  const catatanReq  = type === 'tolak';

  const CONFIG: Record<ModalType, { title: string; confirmLabel: string; confirmColor: string }> = {
    setujui:       { title: 'Setujui Penawaran',        confirmLabel: 'Setujui & Buat Transaksi', confirmColor: '#1b7a43' },
    setujuiBalik:  { title: 'Terima Penawaran Balik',   confirmLabel: 'Terima & Buat Transaksi',  confirmColor: '#1b7a43' },
    penawaranBalik:{ title: 'Ajukan Penawaran Balik',   confirmLabel: 'Kirim Penawaran Balik',    confirmColor: '#1565c0' },
    ubahPenawaran: { title: 'Ubah Penawaran Saya',      confirmLabel: 'Kirim Penawaran Baru',     confirmColor: '#1565c0' },
    tolak:         { title: 'Tolak Penawaran',           confirmLabel: 'Tolak Penawaran',          confirmColor: '#c62828' },
    batalkan:      { title: 'Batalkan Negosiasi',        confirmLabel: 'Batalkan',                 confirmColor: '#5d4037' },
  };
  const cfg = CONFIG[type];
  const canConfirm = !catatanReq || catatan.trim().length > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{cfg.title}</div>

        {needsPrice && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                Harga (Rp) <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={harga}
                min={1}
                onChange={(e) => setHarga(Number(e.target.value))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)', fontSize: 13.5, color: 'var(--color-text)', outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
                Qty <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={qty}
                min={1}
                onChange={(e) => setQty(Number(e.target.value))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-bg)', fontSize: 13.5, color: 'var(--color-text)', outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>
            Catatan {catatanReq ? <span style={{ color: '#c62828' }}>*</span> : '(opsional)'}
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder={catatanReq ? 'Wajib diisi…' : 'Opsional…'}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg)', fontSize: 13.5,
              color: 'var(--color-text)', resize: 'vertical', outline: 'none',
            }}
          />
        </div>

        {(type === 'setujui' || type === 'setujuiBalik') && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#e8f5ee', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#1b5e20', fontWeight: 600 }}>
            🎉 Transaksi akan dibuat otomatis dengan harga {formatRp(negosiasi.hargaPenawaran)} × {negosiasi.qtyPenawaran} {negosiasi.satuanHarga}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={() => onConfirm(harga, qty, catatan)} disabled={!canConfirm}
            style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', border: 'none', background: canConfirm ? cfg.confirmColor : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: canConfirm ? 'pointer' : 'not-allowed' }}>
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tombol Aksi sesuai Status ────────────────────────────────────────────────

function ActionButtons({ negosiasi, onAction }: {
  negosiasi: NegosiasiItem;
  onAction: (type: ModalType) => void;
}) {
  const s = negosiasi.status;
  const btn = (label: string, color: string, outline: boolean, type: ModalType): React.ReactNode => (
    <button type="button"
      onClick={() => onAction(type)}
      style={{
        flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)',
        border: outline ? `1.5px solid ${color}` : 'none',
        background: outline ? 'transparent' : color,
        color: outline ? color : '#fff',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}
    >{label}</button>
  );

  if (s === 'Menunggu Respon Penjual') {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {btn('❌ Tolak', '#c62828', true, 'tolak')}
        {btn('🔄 Penawaran Balik', '#1565c0', false, 'penawaranBalik')}
        {btn('✅ Setujui', '#1b7a43', false, 'setujui')}
      </div>
    );
  }
  if (s === 'Penawaran Balik') {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {btn('🚫 Batalkan', '#5d4037', true, 'batalkan')}
        {btn('✏️ Ubah Penawaran', '#1565c0', true, 'ubahPenawaran')}
        {btn('✅ Terima', '#1b7a43', false, 'setujuiBalik')}
      </div>
    );
  }
  return null; // terminal states — tidak ada aksi
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceDetailNegosiasi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useMarketplace(); // FLOW-003M27: hydrate negosiasi from Supabase on mount
  const [, setTick]         = useState(0);
  const [modal, setModal]       = useState<ModalType | null>(null);
  const [successMsg, setSuccess] = useState('');
  const [errorMsg, setError]    = useState('');

  const neg = id ? getNegosiasiById(id) : undefined;

  function refresh() { setTick((n) => n + 1); }

  if (!neg) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Negosiasi tidak ditemukan</div>
        <button type="button" onClick={() => navigate('/marketplace/negosiasi')}
          style={{ marginTop: 8, padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Kembali ke Negosiasi
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGE[neg.status];
  const selisih = neg.hargaPenawaran - neg.hargaAwal;
  const pctSelisih = neg.hargaAwal > 0 ? Math.round((selisih / neg.hargaAwal) * 100) : 0;

  function handleConfirm(harga: number, qty: number, catatan: string) {
    if (!modal || !neg) return;
    const negId = neg.id;
    setSuccess(''); setError('');
    try {
      switch (modal) {
        case 'setujui':
          setujuiNegosiasi(negId, catatan || undefined);
          void recordUpdateNegosiasiStatus(negId, 'Accepted');
          setSuccess('Penawaran disetujui. Transaksi otomatis dibuat.');
          break;
        case 'setujuiBalik':
          setujuiPenawaranBalik(negId, catatan || undefined);
          void recordUpdateNegosiasiStatus(negId, 'Accepted');
          setSuccess('Penawaran balik diterima. Transaksi otomatis dibuat.');
          break;
        case 'penawaranBalik':
          ajukanPenawaranBalik(negId, harga, qty, catatan || undefined);
          void recordUpdateNegosiasiStatus(negId, 'Counter', harga);
          setSuccess('Penawaran balik berhasil dikirim.');
          break;
        case 'ubahPenawaran':
          ubahPenawaran(negId, harga, qty, catatan || undefined);
          void recordUpdateNegosiasiStatus(negId, 'Pending');
          setSuccess('Penawaran berhasil diubah.');
          break;
        case 'tolak':
          tolakNegosiasi(negId, catatan);
          void recordUpdateNegosiasiStatus(negId, 'Rejected');
          setSuccess('Penawaran ditolak.');
          break;
        case 'batalkan':
          batalkanNegosiasi(negId, catatan || undefined);
          void recordUpdateNegosiasiStatus(negId, 'Cancelled');
          setSuccess('Negosiasi dibatalkan.');
          break;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
    setModal(null);
    refresh();
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 40px' }}>

      {/* ── Status Badge ─────────────────────────────────────────────────── */}
      <div style={{
        background: badge.bg, borderRadius: 'var(--radius-md)',
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      }}>
        <div style={{ fontSize: 32 }}>{badge.icon}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: badge.color, textTransform: 'uppercase', letterSpacing: 0.6 }}>Status Negosiasi</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: badge.color, marginTop: 2 }}>{neg.status}</div>
        </div>
      </div>

      {/* ── Pesan sukses / error ──────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ background: '#e8f5ee', border: '1.5px solid #a5d6a7', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#c62828', display: 'flex', alignItems: 'center', gap: 8 }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* ── Transaksi terhubung ───────────────────────────────────────────── */}
      {neg.transaksiId && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/marketplace/transaksi/${neg.transaksiId}`)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/marketplace/transaksi/${neg.transaksiId}`)}
          style={{
            background: '#e8f5ee', border: '1.5px solid #a5d6a7', borderRadius: 'var(--radius-md)',
            padding: '12px 14px', marginBottom: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🧾</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1b5e20' }}>Transaksi Dibuat Otomatis</div>
            <div style={{ fontSize: 11.5, color: '#1b7a43', marginTop: 2 }}>{neg.transaksiId}</div>
          </div>
          <span style={{ fontSize: 12, color: '#1b7a43' }}>→</span>
        </div>
      )}

      {/* ── Info Negosiasi ────────────────────────────────────────────────── */}
      <Section title="Info Negosiasi">
        <Field label="Nomor Negosiasi" value={neg.id} mono />
        <Grid2>
          <Field label="Tanggal Dibuat"      value={formatTanggal(neg.createdAt)} />
          <Field label="Terakhir Diperbarui" value={formatTanggal(neg.updatedAt)} />
        </Grid2>
      </Section>

      {/* ── Listing ───────────────────────────────────────────────────────── */}
      <Section title="Listing">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-sm)',
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
          }}>{neg.thumbnailListing}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{neg.judulListing}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>Kategori: {neg.kategoriSlug}</div>
          </div>
        </div>
        <Grid2>
          <Field label="Harga Awal"      value={`${formatRp(neg.hargaAwal)} / ${neg.satuanHarga}`} />
          <Field label="Harga Penawaran" value={`${formatRp(neg.hargaPenawaran)} / ${neg.satuanHarga}`} highlight />
        </Grid2>
        <Grid2>
          <Field label="Qty Penawaran" value={`${neg.qtyPenawaran} ${neg.satuanHarga}`} />
          <Field
            label="Selisih Harga"
            value={`${selisih >= 0 ? '+' : ''}${pctSelisih}% (${selisih >= 0 ? '+' : ''}${formatRp(selisih)})`}
          />
        </Grid2>
        <Field label="Total Penawaran" value={`${formatRp(neg.hargaPenawaran * neg.qtyPenawaran)}`} highlight />
        {neg.catatan && <Field label="Catatan" value={neg.catatan} />}
      </Section>

      {/* ── Pembeli & Penjual ─────────────────────────────────────────────── */}
      <Section title="Pihak">
        <Grid2>
          <Field label="Pembeli"         value={neg.namaPembeli} />
          <Field label="Workspace Pembeli" value={neg.workspaceNamaPembeli} />
        </Grid2>
        <Grid2>
          <Field label="Penjual"         value={neg.namaPenjual} />
          <Field label="Workspace Penjual" value={neg.workspaceNamaPenjual} />
        </Grid2>
      </Section>

      {/* ── Riwayat Negosiasi ─────────────────────────────────────────────── */}
      <Section title="Riwayat Negosiasi">
        <RiwayatTimeline negosiasi={neg} />
      </Section>

      {/* ── Tombol Aksi ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <ActionButtons negosiasi={neg} onAction={setModal} />
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modal && (
        <ActionModal
          type={modal}
          negosiasi={neg}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
