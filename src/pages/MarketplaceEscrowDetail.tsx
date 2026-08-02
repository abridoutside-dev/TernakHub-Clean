// ─── PROFILE-007 — Escrow Detail Page ────────────────────────────────────────
// Mengacu pada: docs/architecture/ESCROW_MODULE_CONSTITUTION.md
//               docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Aturan:
//  - Escrow HANYA menahan dana, mengelola bukti, dan mencatat transfer manual.
//  - Konfirmasi akhir HANYA dilakukan oleh PENERIMA DANA (Seller atau Buyer).
//  - Tidak ada auto-transfer. Tidak ada integrasi bank.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getActiveWorkspace } from '../components/TopAppBar';
import TransactionTabBar from '../components/TransactionTabBar';
import {
  getEscrowByTransaksiId,
  confirmPaymentReceived,
  startDelivery,
  requestArrivalConfirmation,
  openDispute,
  closeDispute,
  initiateTransfer,
  recordManualTransfer,
  receiverConfirm,
  cancelEscrow,
  ESCROW_STATUS_CONFIG,
  type EscrowRecord,
  type EscrowStatus,
  type EscrowTransferRecord,
} from '../data/transaksiEscrowData';
import { getConversationByTransaksiId, type ConversationRoom } from '../data/transaksiConversationData';
import { type TransaksiStatus } from '../data/marketplaceTransaksiData';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const TRX_STATUS_BADGE: Record<TransaksiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  Disetujui:              { bg: '#e8f5ee', color: '#1b7a43', icon: '✅' },
  Ditolak:                { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Menunggu Pembayaran':  { bg: '#fff3e0', color: '#e65100', icon: '💳' },
  Diproses:               { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  'Siap Diserahkan':      { bg: '#f3e5f5', color: '#6a1b9a', icon: '📦' },
  'Sedang Dikirim':       { bg: '#e0f7fa', color: '#006064', icon: '🚚' },
  Selesai:                { bg: '#e8f5ee', color: '#1b5e20', icon: '🎉' },
  Dibatalkan:             { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
};

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtRp(n: number | null): string {
  if (n === null) return '—';
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function daysDiff(isoFrom: string, isoTo: string): number {
  return Math.ceil((new Date(isoTo).getTime() - new Date(isoFrom).getTime()) / 86_400_000);
}

// ─── Page Header ─────────────────────────────────────────────────────────────

function PageHeader({ room }: { room: ConversationRoom }) {
  const badge = TRX_STATUS_BADGE[room.transaksiStatus];
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '10px 14px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
          color: 'var(--color-text)', background: 'var(--color-bg)',
          border: '1px solid var(--color-border)', borderRadius: 6,
          padding: '2px 8px', flexShrink: 0,
        }}>{room.transaksiId}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: badge.color,
          background: badge.bg, borderRadius: 20, padding: '2px 8px',
        }}>{badge.icon} {room.transaksiStatus}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>{room.thumbnailListing}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{room.judulListing}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {room.workspaceIconBuyer} {room.workspaceNamaBuyer} → {room.workspaceIconSeller} {room.workspaceNamaSeller}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Escrow Status Card ───────────────────────────────────────────────────────

function EscrowStatusCard({ escrow }: { escrow: EscrowRecord }) {
  const cfg = ESCROW_STATUS_CONFIG[escrow.status];
  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.color}`,
      borderRadius: 'var(--radius-md)',
      padding: '14px 14px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: cfg.color, opacity: 0.85 }}>Escrow Status</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 9.5, fontWeight: 700, color: '#546e7a',
          background: 'rgba(255,255,255,0.7)', borderRadius: 6,
          padding: '2px 8px', border: '1px solid rgba(0,0,0,0.08)',
        }}>🔒 Permanen</span>
      </div>
      <div style={{ fontSize: 12.5, color: cfg.color, lineHeight: 1.5 }}>{cfg.description}</div>
    </div>
  );
}

// ─── Pricing Panel ────────────────────────────────────────────────────────────

function PricingPanel({ escrow }: { escrow: EscrowRecord }) {
  const [open, setOpen] = useState(false);
  const p = escrow.pricing;
  const feeLabel = p.type === 'Percentage' && p.percentage !== null
    ? `${(p.percentage * 100).toFixed(2)}%`
    : p.fixedAmount !== null ? `Tetap ${fmtRp(p.fixedAmount)}` : '—';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden', marginBottom: 12,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 16 }}>💰</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>Biaya &amp; Pricing</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-muted)' }}>›</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 12px' }}>
          {/* Summary row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 10,
          }}>
            {[
              { label: 'Nominal Transaksi', value: fmtRp(escrow.nominalTransaksi) },
              { label: 'Escrow Fee',        value: fmtRp(escrow.escrowFee),        note: 'Pendapatan Escrow' },
              { label: 'Transaction Cost',  value: fmtRp(escrow.transactionCost),  note: 'Biaya Bank (bukan pendapatan Escrow)' },
            ].map((row) => (
              <div key={row.label} style={{
                background: 'var(--color-bg)', borderRadius: 8,
                padding: '8px 10px', border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                  {row.label}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</div>
                {row.note && (
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{row.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* Policy detail */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            <div>Tipe: <strong>{p.type === 'Percentage' ? `Persentase (${feeLabel})` : `Tetap (${feeLabel})`}</strong></div>
            <div>Minimum: <strong>{p.minimumFee !== null ? fmtRp(p.minimumFee) : '—'}</strong> · Maksimum: <strong>{p.maximumFee !== null ? fmtRp(p.maximumFee) : '—'}</strong></div>
            <div>Ditanggung oleh: <strong>{p.feePayer === 'Shared' ? 'Bersama (Buyer + Seller)' : p.feePayer}</strong></div>
          </div>

          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 6,
            background: '#fff3e0', border: '1px solid #ffe082',
            fontSize: 11, color: '#7b5e2a',
          }}>
            ⚠️ <strong>Catatan:</strong> Transaction Cost adalah biaya bank pihak ketiga — <strong>bukan</strong> pendapatan Escrow.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manual Transfer Form ─────────────────────────────────────────────────────

function ManualTransferForm({
  escrow,
  onDone,
}: {
  escrow: EscrowRecord;
  onDone: () => void;
}) {
  const [nominal,      setNominal]      = useState(String(escrow.nominalTransaksi));
  const [bankTujuan,   setBankTujuan]   = useState('');
  const [noRekening,   setNoRekening]   = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [tanggal,      setTanggal]      = useState(new Date().toISOString().slice(0, 10));
  const [jam,          setJam]          = useState('');
  const [fileName,     setFileName]     = useState('');
  const [catatan,      setCatatan]      = useState('');
  const [saving,       setSaving]       = useState(false);

  const isValid = !!bankTujuan && !!noRekening && !!namaPenerima && !!tanggal && !!jam && !!fileName && Number(nominal) > 0;

  function handleSubmit() {
    if (!isValid) return;
    setSaving(true);
    setTimeout(() => {
      recordManualTransfer(escrow.id, {
        nominal:      Number(nominal),
        bankTujuan,
        noRekening,
        namaPenerima,
        tanggal,
        jam,
        fileName,
        catatan:     catatan || null,
        recordedBy:  'escrow-system',
      });
      setSaving(false);
      onDone();
    }, 400);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 13,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
    textTransform: 'uppercase', letterSpacing: 0.4,
    display: 'block', marginBottom: 4,
  };

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        🏦 Catat Transfer Manual
      </div>
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '6px 10px', marginBottom: 12, fontSize: 11, color: '#7b5e2a' }}>
        ⚠️ Sistem hanya mencatat transfer. Transfer dilakukan secara manual melalui aplikasi bank resmi.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Nominal (Rp)</label>
          <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bank Tujuan</label>
          <input type="text" value={bankTujuan} onChange={(e) => setBankTujuan(e.target.value)} placeholder="BCA, BRI, Mandiri…" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>No. Rekening</label>
          <input type="text" value={noRekening} onChange={(e) => setNoRekening(e.target.value)} placeholder="1234567890" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Nama Penerima</label>
          <input type="text" value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} placeholder="Nama rekening" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tanggal Transfer</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Jam Transfer</label>
          <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Nama File Bukti (Screenshot / Foto)</label>
        <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="bukti-transfer-bca-15-juli.jpg" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Catatan (opsional)</label>
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2}
          placeholder="Catatan petugas Escrow…"
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <button
        type="button" onClick={handleSubmit}
        disabled={!isValid || saving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: isValid ? 'var(--color-primary)' : 'var(--color-border)',
          color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: isValid ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Menyimpan…' : '🏦 Simpan Bukti Transfer'}
      </button>
    </div>
  );
}

// ─── Transfer History ─────────────────────────────────────────────────────────

function TransferHistoryPanel({ transfers }: { transfers: EscrowTransferRecord[] }) {
  if (transfers.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        Riwayat Transfer Manual
      </div>
      {transfers.map((t) => (
        <div key={t.id} style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>🏦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                {fmtRp(t.nominal)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {t.bankTujuan} · {t.noRekening} · a.n. {t.namaPenerima}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {[
              { label: 'Tanggal', value: t.tanggal },
              { label: 'Jam', value: t.jam },
              { label: 'Bukti', value: t.fileName },
            ].map((f) => (
              <span key={f.label} style={{
                fontSize: 10.5, color: 'var(--color-muted)',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: 6, padding: '2px 8px',
              }}>{f.label}: <strong>{f.value}</strong></span>
            ))}
          </div>
          {t.catatan && (
            <div style={{ fontSize: 11.5, color: 'var(--color-text)', marginBottom: 6 }}>{t.catatan}</div>
          )}
          {/* OCR Warnings */}
          {t.ocrWarnings.length > 0 && !t.isOCRIgnored && (
            <div style={{
              background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6,
              padding: '6px 10px',
            }}>
              {t.ocrWarnings.map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: '#7b5e2a', marginBottom: 2 }}>
                  ⚠️ <strong>{w.type}</strong>: {w.detail}
                  <span style={{ opacity: 0.7 }}> (Terdeteksi: {w.detectedValue} · Diharapkan: {w.expectedValue})</span>
                </div>
              ))}
            </div>
          )}
          {t.isOCRIgnored && (
            <div style={{
              fontSize: 10.5, color: '#1b7a43',
              background: '#e8f5ee', border: '1px solid #a5d6a7',
              borderRadius: 6, padding: '4px 8px',
            }}>
              ✅ OCR Warning diabaikan oleh petugas: {t.ignoreReason}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 6 }}>
            Dicatat: {fmt(t.recordedAt)} · Petugas: TernakHub Escrow
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ escrow }: { escrow: EscrowRecord }) {
  const [open, setOpen] = useState(false);
  const history = [...escrow.statusHistory].reverse(); // newest first

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden', marginBottom: 12,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 16 }}>📋</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
          Riwayat Status ({escrow.statusHistory.length} event)
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-muted)' }}>›</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 12px' }}>
          {history.map((entry, idx) => {
            const cfg = ESCROW_STATUS_CONFIG[entry.status];
            return (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, border: `2px solid ${cfg.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                  {entry.catatan && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.4, marginTop: 2 }}>{entry.catatan}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3 }}>
                    {fmt(entry.timestamp)} · {entry.actorNama}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dispute Panel ────────────────────────────────────────────────────────────

function DisputePanel({
  escrow,
  onAction,
}: {
  escrow: EscrowRecord;
  onAction: () => void;
}) {
  const [resolution, setResolution] = useState('');
  const [direction, setDirection]   = useState<'Seller' | 'Buyer'>('Seller');
  const [saving, setSaving]         = useState(false);
  const d = escrow.dispute;
  if (!d) return null;

  const daysLeft = d.closedAt ? 0 : Math.max(0, daysDiff(new Date().toISOString(), d.deadlineAt));
  const isExpired = !d.closedAt && daysLeft === 0;

  function handleClose() {
    if (!resolution.trim()) return;
    setSaving(true);
    setTimeout(() => {
      closeDispute(escrow.id, resolution, direction);
      setSaving(false);
      onAction();
    }, 400);
  }

  return (
    <div style={{
      background: '#ffebee',
      border: '1.5px solid #ef9a9a',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#c62828', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        ⚠️ Sengketa Aktif
      </div>
      <div style={{ fontSize: 12.5, color: '#5d4037', marginBottom: 6 }}>
        Dibuka: {fmt(d.openedAt)} · Alasan: {d.reason}
      </div>
      <div style={{
        display: 'inline-block', fontSize: 11.5, fontWeight: 700,
        color: isExpired ? '#c62828' : '#7b5e2a',
        background: isExpired ? '#ffcdd2' : '#fff8e1',
        border: `1px solid ${isExpired ? '#ef9a9a' : '#ffe082'}`,
        borderRadius: 20, padding: '3px 10px', marginBottom: 10,
      }}>
        {isExpired ? '⏰ Batas waktu habis' : `⏰ ${daysLeft} hari tersisa`} (Maks. 30 hari)
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.7)', borderRadius: 6,
        padding: '8px 10px', marginBottom: 12, fontSize: 11, color: '#5d4037',
      }}>
        🔐 Escrow menunggu kesepakatan para pihak. Escrow <strong>tidak menentukan</strong> siapa yang benar.
      </div>

      {!d.closedAt && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#7b5e2a', display: 'block', marginBottom: 4 }}>
              Arah Dana (setelah kesepakatan)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Seller', 'Buyer'] as const).map((dir) => (
                <button
                  key={dir} type="button"
                  onClick={() => setDirection(dir)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: '1.5px solid',
                    borderColor: direction === dir ? '#c62828' : '#efcfcf',
                    background: direction === dir ? '#c62828' : 'rgba(255,255,255,0.7)',
                    color: direction === dir ? '#fff' : '#7b5e2a',
                    cursor: 'pointer',
                  }}
                >
                  {dir === 'Seller' ? '🏪 Dana ke Seller' : '🛒 Kembalikan ke Buyer'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#7b5e2a', display: 'block', marginBottom: 4 }}>
              Keterangan Kesepakatan
            </label>
            <textarea
              value={resolution} onChange={(e) => setResolution(e.target.value)}
              rows={2} placeholder="Jelaskan kesepakatan para pihak…"
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1.5px solid #ef9a9a', fontSize: 13,
                background: 'rgba(255,255,255,0.8)', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="button" onClick={handleClose}
            disabled={!resolution.trim() || saving}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8,
              background: resolution.trim() ? '#c62828' : '#efcfcf',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: resolution.trim() ? 'pointer' : 'default',
            }}
          >
            {saving ? 'Menyimpan…' : '🔒 Tutup Sengketa & Lanjutkan Transfer'}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Action Panel ─────────────────────────────────────────────────────────────

function ActionPanel({
  escrow,
  activeWsId,
  onAction,
}: {
  escrow: EscrowRecord;
  activeWsId: string;
  onAction: () => void;
}) {
  const [showTransferForm, setShowTransferForm]       = useState(false);
  const [showDisputeForm, setShowDisputeForm]         = useState(false);
  const [disputeReason, setDisputeReason]             = useState('');
  const [showReceiverConfirm, setShowReceiverConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  function btn(
    label: string,
    onClick: () => void,
    color = 'var(--color-primary)',
    disabled = false,
  ) {
    return (
      <button
        type="button" onClick={onClick} disabled={disabled}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: disabled ? 'var(--color-border)' : color,
          color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          marginBottom: 8,
        }}
      >
        {label}
      </button>
    );
  }

  const status = escrow.status;
  const isBuyer  = activeWsId === escrow.workspaceIdBuyer;
  const isSeller = activeWsId === escrow.workspaceIdSeller;

  function doAction(fn: () => void) {
    setSaving(true);
    fn();
    setSaving(false);
    onAction();
  }

  // Determine the receiver based on dispute direction or default (Seller)
  const releaseDir = escrow.dispute?.releaseDirection ?? 'Seller';
  const receiverWsId = releaseDir === 'Buyer' ? escrow.workspaceIdBuyer : escrow.workspaceIdSeller;
  const isReceiver = activeWsId === receiverWsId;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        Aksi
      </div>

      {status === 'Waiting Payment' && (
        <>
          {btn('✅ Konfirmasi Dana Masuk (Escrow Officer)',
            () => doAction(() => confirmPaymentReceived(escrow.id,
              'Dana masuk dikonfirmasi setelah pengecekan rekening manual.')))}
          {btn('🚫 Batalkan Escrow',
            () => doAction(() => cancelEscrow(escrow.id, 'Dibatalkan oleh petugas Escrow.')),
            '#c62828')}
        </>
      )}

      {status === 'Holding Fund' && (
        <>
          {btn('🚚 Catat Pengiriman Dimulai',
            () => doAction(() => startDelivery(escrow.id, 'Seller telah mengirimkan barang.')))}
          {btn('🚫 Batalkan Escrow',
            () => doAction(() => cancelEscrow(escrow.id, 'Dibatalkan.')),
            '#c62828')}
        </>
      )}

      {status === 'Delivery' && (
        <>
          {btn('📍 Catat Kedatangan (Waiting Confirmation)',
            () => doAction(() => requestArrivalConfirmation(escrow.id)))}
          {!showDisputeForm && btn('⚠️ Buka Sengketa', () => setShowDisputeForm(true), '#e65100')}
          {showDisputeForm && (
            <div style={{ marginBottom: 8 }}>
              <textarea
                value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                rows={2} placeholder="Alasan sengketa…"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1.5px solid #ef9a9a', fontSize: 13,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box', marginBottom: 6,
                }}
              />
              {btn('⚠️ Konfirmasi Buka Sengketa',
                () => doAction(() => openDispute(escrow.id, activeWsId, disputeReason)),
                '#c62828', !disputeReason.trim())}
            </div>
          )}
        </>
      )}

      {status === 'Waiting Confirmation' && (
        <>
          {btn('💸 Lanjutkan ke Transfer',
            () => doAction(() => initiateTransfer(escrow.id, 'Buyer mengkonfirmasi kedatangan. Dana siap ditransfer.')))}
          {!showDisputeForm && btn('⚠️ Buka Sengketa', () => setShowDisputeForm(true), '#e65100')}
          {showDisputeForm && (
            <div style={{ marginBottom: 8 }}>
              <textarea
                value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                rows={2} placeholder="Alasan sengketa…"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1.5px solid #ef9a9a', fontSize: 13,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box', marginBottom: 6,
                }}
              />
              {btn('⚠️ Konfirmasi Buka Sengketa',
                () => doAction(() => openDispute(escrow.id, activeWsId, disputeReason)),
                '#c62828', !disputeReason.trim())}
            </div>
          )}
        </>
      )}

      {status === 'Transfer Processing' && (
        <>
          {!showTransferForm
            ? btn('🏦 Catat Transfer Manual', () => setShowTransferForm(true))
            : <ManualTransferForm escrow={escrow} onDone={() => { setShowTransferForm(false); onAction(); }} />
          }
        </>
      )}

      {status === 'Waiting Receiver Confirmation' && (
        <>
          {isReceiver ? (
            <>
              <div style={{
                background: '#e8f5ee', border: '1px solid #a5d6a7', borderRadius: 8,
                padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#1b5e20',
              }}>
                💡 Kamu adalah penerima dana. Konfirmasi bahwa dana telah diterima di rekening kamu.
              </div>
              {!showReceiverConfirm ? (
                btn('✅ Konfirmasi Dana Diterima', () => setShowReceiverConfirm(true))
              ) : (
                <div style={{
                  background: '#fff3e0', border: '1.5px solid #ffe082',
                  borderRadius: 8, padding: '12px 14px', marginBottom: 8,
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7b3f00', marginBottom: 6 }}>
                    ⚠️ Konfirmasi Penerimaan Dana
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7b3f00', lineHeight: 1.55, marginBottom: 12 }}>
                    Tindakan ini <strong>bersifat permanen dan tidak dapat dibatalkan</strong>. Pastikan dana benar-benar telah diterima di rekening Anda sebelum mengkonfirmasi.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowReceiverConfirm(false)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8,
                        border: '1.5px solid var(--color-border)',
                        background: 'var(--color-surface)', color: 'var(--color-text)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Batalkan
                    </button>
                    <button
                      type="button"
                      onClick={() => doAction(() => receiverConfirm(escrow.id, activeWsId,
                        'Penerima dana mengkonfirmasi bahwa dana telah masuk ke rekening.'))}
                      style={{
                        flex: 2, padding: '10px 0', borderRadius: 8,
                        border: 'none', background: '#1b7a43', color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      ✅ Ya, Dana Sudah Diterima
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center',
            }}>
              ⏳ Menunggu konfirmasi dari penerima dana ({releaseDir === 'Buyer' ? escrow.workspaceNamaBuyer : escrow.workspaceNamaSeller}).
              <br /><br />
              <span style={{ fontSize: 11, fontStyle: 'italic' }}>
                Escrow tidak dapat melakukan konfirmasi ini.
              </span>
            </div>
          )}
        </>
      )}

      {status === 'Completed' && (
        <div style={{
          background: '#e8f5ee', border: '1.5px solid #a5d6a7',
          borderRadius: 'var(--radius-md)', padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1b5e20' }}>Escrow Selesai</div>
          <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 4 }}>
            Penerima dana telah mengkonfirmasi. Semua pihak selesai.
          </div>
        </div>
      )}

      {status === 'Cancelled' && (
        <div style={{
          background: '#efebe9', border: '1.5px solid #bcaaa4',
          borderRadius: 'var(--radius-md)', padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🚫</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#5d4037' }}>Escrow Dibatalkan</div>
          <div style={{ fontSize: 12, color: '#795548', marginTop: 4 }}>
            Transaksi telah dibatalkan. Proses pengembalian dana jika diperlukan.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── No Escrow Panel ──────────────────────────────────────────────────────────

function NoEscrowPanel({ transaksiId }: { transaksiId: string }) {
  const navigate = useNavigate();
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', gap: 12, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>🔐</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
        Transaksi Ini Menggunakan P2P
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        Settlement method transaksi ini adalah <strong>P2P</strong>.<br />
        Escrow hanya tersedia untuk transaksi yang memilih settlement Escrow.
      </div>
      <button
        type="button"
        onClick={() => navigate(`/marketplace/conversation/${transaksiId}`)}
        style={{
          marginTop: 8, padding: '9px 18px', borderRadius: 8,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
        }}
      >
        💬 Kembali ke Conversation
      </button>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceEscrowDetail() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate        = useNavigate();
  const activeWs        = getActiveWorkspace();

  const [room,   setRoom]   = useState<ConversationRoom | null>(null);
  const [escrow, setEscrow] = useState<EscrowRecord | undefined>(undefined);
  const [tick,   setTick]   = useState(0);

  useEffect(() => {
    if (!transaksiId) return;
    const r = getConversationByTransaksiId(transaksiId);
    if (r) setRoom(r);
    setEscrow(getEscrowByTransaksiId(transaksiId));
  }, [transaksiId, tick]);

  function refresh() { setTick((t) => t + 1); }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (!room && transaksiId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - var(--top-app-bar-height))', gap: 12, padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Transaksi tidak ditemukan</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{transaksiId}</div>
        <button type="button" onClick={() => navigate('/marketplace/transaksi')}
          style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          ← Kembali ke Transaksi
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--top-app-bar-height))',
      minHeight: 0,
      background: 'var(--color-bg)',
    }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      {room && <PageHeader room={room} />}

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      {transaksiId && (
        <TransactionTabBar transaksiId={transaksiId} activeTab="escrow" hasEscrow={!!escrow} />
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {!escrow && transaksiId
          ? <NoEscrowPanel transaksiId={transaksiId} />
          : escrow && (
            <>
              {/* Status */}
              <EscrowStatusCard escrow={escrow} />

              {/* Actions */}
              <ActionPanel escrow={escrow} activeWsId={activeWs.id} onAction={refresh} />

              {/* Dispute */}
              {escrow.status === 'Dispute' && (
                <DisputePanel escrow={escrow} onAction={refresh} />
              )}

              {/* Transfer History */}
              <TransferHistoryPanel transfers={escrow.transfers} />

              {/* Pricing */}
              <PricingPanel escrow={escrow} />

              {/* Status Timeline */}
              <StatusTimeline escrow={escrow} />

              {/* Bottom padding */}
              <div style={{ height: 16 }} />
            </>
          )
        }
      </div>
    </div>
  );
}
