// ─── FARM-FIX-005.9 — Transaction Receipt Page ────────────────────────────────
// Full transaction receipt: deal summary, participants, escrow, transport,
// timeline, evidence, financial breakdown.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionTabBar from '../components/TransactionTabBar';
import { generateReceipt, type TransactionReceipt } from '../data/transactionReceiptData';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTs(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Maybe date-only
    const parts = iso.split('-').map(Number);
    if (parts.length === 3) return `${parts[2]} ${BULAN[parts[1]-1]} ${parts[0]}`;
    return iso;
  }
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReceiptCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 }}>{title}</span>
      {badge && (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(37,99,235,0.1)', borderRadius: 8, padding: '2px 8px' }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function Row({ label, value, bold, highlight, mono }: {
  label: string; value: React.ReactNode;
  bold?: boolean; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', flexShrink: 0, paddingRight: 8 }}>{label}</span>
      <span style={{
        fontSize: bold ? 14 : 13,
        fontWeight: bold ? 800 : highlight ? 700 : 500,
        color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
        fontFamily: mono ? 'monospace' : undefined,
        textAlign: 'right', flex: 1,
      }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />;
}

function ParticipantCard({ p }: { p: TransactionReceipt['participants'][0] }) {
  const ROLE_ICON: Record<string, string> = {
    Buyer: '🛒', Seller: '🏪', Escrow: '🏦', Transport: '🚚', Veterinarian: '👨‍⚕️',
  };
  // Each role carries both a text color (CSS var) and a pre-computed bg so the
  // hex-opacity trick `${color}18` is not needed in JSX.
  const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
    Buyer:        { color: 'var(--color-info)',      bg: 'rgba(21,101,192,0.1)' },
    Seller:       { color: 'var(--color-primary)',   bg: 'var(--color-primary-light)' },
    Escrow:       { color: 'var(--color-cancelled)', bg: 'rgba(93,64,55,0.1)' },
    Transport:    { color: 'var(--color-transport)', bg: 'rgba(0,96,100,0.1)' },
    Veterinarian: { color: 'var(--color-escrow)',    bg: 'rgba(106,27,154,0.1)' },
  };
  const icon                = ROLE_ICON[p.role] ?? '🏪';
  const { color, bg: roleBg } = ROLE_STYLE[p.role] ?? { color: 'var(--color-muted)', bg: 'rgba(107,114,128,0.1)' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: roleBg, border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {p.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color, background: roleBg, borderRadius: 4, padding: '1px 6px' }}>
            {icon} {p.role}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{p.status}</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'right', flexShrink: 0 }}>
        <div>Bergabung</div>
        <div style={{ fontWeight: 600 }}>{formatTs(p.joinedAt).split(',')[0]}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceTransactionReceipt() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate = useNavigate();
  const receipt = transaksiId ? generateReceipt(transaksiId) : null;
  const hasEscrow = transaksiId ? !!getEscrowByTransaksiId(transaksiId) : false;

  function handlePrint() {
    window.print();
  }

  if (!receipt) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
          Receipt tidak tersedia
        </div>
        <button
          type="button"
          onClick={() => navigate(`/marketplace/transaksi/${transaksiId}`)}
          style={{
            padding: '10px 24px', borderRadius: 10,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ← Kembali
        </button>
      </div>
    );
  }

  // Pre-compute border and textBg so template-literal hex-opacity tricks are
  // avoided and dark mode tokens take effect correctly.
  const statusCfg: Record<string, { color: string; bg: string; borderColor: string; textBg: string }> = {
    Selesai:      { color: 'var(--color-primary-dark)', bg: 'var(--color-primary-light)', borderColor: 'rgba(27,94,32,0.13)',  textBg: 'rgba(27,94,32,0.1)'  },
    Completed:    { color: 'var(--color-primary-dark)', bg: 'var(--color-primary-light)', borderColor: 'rgba(27,94,32,0.13)',  textBg: 'rgba(27,94,32,0.1)'  },
    Dibatalkan:   { color: 'var(--color-cancelled)',    bg: 'var(--color-cancelled-bg)',  borderColor: 'rgba(93,64,55,0.13)',  textBg: 'rgba(93,64,55,0.1)'  },
    Cancelled:    { color: 'var(--color-cancelled)',    bg: 'var(--color-cancelled-bg)',  borderColor: 'rgba(93,64,55,0.13)',  textBg: 'rgba(93,64,55,0.1)'  },
    Dikembalikan: { color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',     borderColor: 'rgba(198,40,40,0.13)', textBg: 'rgba(198,40,40,0.1)' },
    Refunded:     { color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',     borderColor: 'rgba(198,40,40,0.13)', textBg: 'rgba(198,40,40,0.1)' },
    Sengketa:     { color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',     borderColor: 'rgba(198,40,40,0.13)', textBg: 'rgba(198,40,40,0.1)' },
    Disputed:     { color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',     borderColor: 'rgba(198,40,40,0.13)', textBg: 'rgba(198,40,40,0.1)' },
  };
  const DEFAULT_SC = { color: 'var(--color-info)', bg: 'var(--color-info-bg)', borderColor: 'rgba(37,99,235,0.13)', textBg: 'rgba(37,99,235,0.1)' };
  const sc = statusCfg[receipt.finalStatus] ?? DEFAULT_SC;

  return (
    <div style={{ height: 'calc(100dvh - var(--top-app-bar-height))', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Tab Bar — hidden in print via .receipt-no-print */}
      <div className="receipt-no-print">
        <TransactionTabBar
          transaksiId={transaksiId!}
          activeTab="receipt"
          hasEscrow={hasEscrow}
        />
      </div>

      {/* Print button — hidden in print via .receipt-no-print */}
      <div className="receipt-no-print" style={{ padding: '8px 14px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handlePrint}
          style={{
            padding: '6px 14px', borderRadius: 8,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)', color: 'var(--color-text)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          🖨️ Cetak
        </button>
      </div>

      {/* Content — the only area visible in print */}
      <div className="receipt-print-area" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 48px' }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          background: sc.bg, borderRadius: 12, padding: '16px 14px', marginBottom: 14,
          textAlign: 'center', border: `1.5px solid ${sc.borderColor}`,
        }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>{receipt.finalStatusIcon}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: sc.color, marginBottom: 2 }}>
            {receipt.finalStatus}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: sc.color, fontWeight: 700, background: sc.textBg, borderRadius: 6, padding: '3px 10px', display: 'inline-block', marginTop: 4 }}>
            {receipt.receiptNumber}
          </div>
          <div style={{ fontSize: 11, color: sc.color, marginTop: 8, opacity: 0.8 }}>
            Dibuat: {formatTs(receipt.generatedAt)}
          </div>
          {receipt.isComplete && (
            <div style={{ fontSize: 10.5, fontWeight: 600, color: sc.color, marginTop: 4, opacity: 0.75 }}>
              ✅ Transaksi selesai dan terverifikasi
            </div>
          )}
        </div>

        {/* ── Transaction ID ─────────────────────────────────────────────── */}
        <ReceiptCard>
          <CardHeader icon="📋" title="Info Transaksi" />
          <div style={{ padding: '10px 14px' }}>
            <Row label="Nomor Transaksi" value={receipt.transaksiId} mono />
            <Row label="Dibuat" value={formatTs(receipt.createdAt)} />
            {receipt.completedAt && <Row label="Diselesaikan" value={formatTs(receipt.completedAt)} />}
            <Row label="Status Akhir" value={
              <span style={{ color: sc.color, fontWeight: 700 }}>
                {receipt.finalStatusIcon} {receipt.finalStatus}
              </span>
            } />
            <Row label="Status Pembayaran" value={
              <span style={{ fontWeight: 700, color: receipt.paymentStatus === 'Lunas' ? '#1b5e20' : 'var(--color-text)' }}>
                {receipt.paymentStatus}
              </span>
            } />
            {receipt.hasDispute && <Row label="Sengketa" value="⚠️ Ada sengketa tercatat" />}
            {receipt.hasRefund   && <Row label="Refund"   value="↩️ Dana dikembalikan ke Buyer" />}
          </div>
        </ReceiptCard>

        {/* ── Participants ──────────────────────────────────────────────── */}
        <ReceiptCard>
          <CardHeader icon="👥" title="Peserta" badge={`${receipt.participants.length} pihak`} />
          <div style={{ padding: '4px 14px' }}>
            {receipt.participants.map((p, i) => (
              <ParticipantCard key={i} p={p} />
            ))}
          </div>
        </ReceiptCard>

        {/* ── Deal ──────────────────────────────────────────────────────── */}
        {receipt.deal && (
          <ReceiptCard>
            <CardHeader icon="🤝" title="Detail Deal" />
            <div style={{ padding: '6px 14px 10px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0 10px', borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                }}>{receipt.deal.thumbnail}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{receipt.deal.judulListing}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{receipt.deal.jumlah} {receipt.deal.satuanHarga} × {formatRp(receipt.deal.hargaSatuan)}</div>
                </div>
              </div>
              <Row label="Jumlah"      value={`${receipt.deal.jumlah} ${receipt.deal.satuanHarga}`} />
              <Row label="Harga Satuan" value={formatRp(receipt.deal.hargaSatuan)} />
              <Row label="Total Deal"   value={formatRp(receipt.deal.totalHarga)} bold highlight />
              {receipt.deal.catatan && <Row label="Catatan" value={`"${receipt.deal.catatan}"`} />}
              {receipt.deal.lockedAt && <Row label="Deal Dikunci" value={formatTs(receipt.deal.lockedAt)} />}
            </div>
          </ReceiptCard>
        )}

        {/* ── Layanan Terpilih ──────────────────────────────────────────── */}
        {receipt.selectedServices.length > 0 && (
          <ReceiptCard>
            <CardHeader icon="🧩" title="Layanan Terpilih" badge={`${receipt.selectedServices.length} layanan`} />
            <div style={{ padding: '6px 14px 10px' }}>
              {receipt.selectedServices.map((svc, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < receipt.selectedServices.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{svc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{svc.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px',
                        background: svc.source === 'Platform Service' ? 'rgba(37,99,235,0.1)' : 'rgba(22,163,74,0.1)',
                        color: svc.source === 'Platform Service' ? '#1d4ed8' : '#15803d',
                      }}>
                        {svc.source === 'Platform Service' ? '🏦 Platform' : svc.source === 'Marketplace Listing' ? '🏪 Marketplace' : '🏢 Eksternal'}
                      </span>
                      {svc.detail && (
                        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{svc.detail}</span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                    background: svc.status === 'Digunakan' ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)',
                    color: svc.status === 'Digunakan' ? '#15803d' : '#6b7280',
                  }}>
                    {svc.status === 'Digunakan' ? '✓ Digunakan' : '— Tidak Digunakan'}
                  </span>
                </div>
              ))}
            </div>
          </ReceiptCard>
        )}

        {/* ── Financial ─────────────────────────────────────────────────── */}
        <ReceiptCard>
          <CardHeader icon="💰" title="Ringkasan Keuangan" />
          <div style={{ padding: '6px 14px 10px' }}>
            <Row label="Harga Negosiasi" value={formatRp(receipt.negotiatedPrice)} />
            {receipt.financial.escrowFee > 0 && (
              <Row label="Biaya Escrow" value={formatRp(receipt.financial.escrowFee)} />
            )}
            {receipt.financial.transportFee > 0 && (
              <Row label="Biaya Transport" value={formatRp(receipt.financial.transportFee)} />
            )}
            {receipt.financial.otherFees > 0 && (
              <Row label="Biaya Layanan Lain" value={formatRp(receipt.financial.otherFees)} />
            )}
            <Divider />
            <Row label="Total Akhir" value={formatRp(receipt.finalPrice)} bold highlight />
          </div>
        </ReceiptCard>

        {/* ── Escrow ────────────────────────────────────────────────────── */}
        {receipt.escrow && (
          <ReceiptCard>
            <CardHeader icon="🔐" title="Escrow" />
            <div style={{ padding: '6px 14px 10px' }}>
              <Row label="Mode"            value={receipt.escrow.mode} />
              <Row label="Status Akhir"    value={receipt.escrow.status} />
              <Row label="Nominal Transaksi" value={formatRp(receipt.escrow.nominalTransaksi)} />
              {receipt.escrow.escrowFee !== null && (
                <Row label="Biaya Escrow" value={formatRp(receipt.escrow.escrowFee)} />
              )}
              <Row label="Jumlah Transfer" value={`${receipt.escrow.totalTransferCount} bukti`} />
              {receipt.escrow.dispute.opened && (
                <>
                  <Divider />
                  <Row label="Sengketa"    value={<span style={{ color: 'var(--color-danger)' }}>⚠️ Ada</span>} />
                  {receipt.escrow.dispute.reason && <Row label="Alasan" value={receipt.escrow.dispute.reason} />}
                  {receipt.escrow.dispute.resolution && <Row label="Resolusi" value={receipt.escrow.dispute.resolution} />}
                  {receipt.escrow.dispute.releaseDirection && (
                    <Row label="Dana ke" value={receipt.escrow.dispute.releaseDirection === 'Buyer' ? '↩️ Buyer (Refund)' : '➡️ Seller'} />
                  )}
                </>
              )}
            </div>
          </ReceiptCard>
        )}

        {/* ── Transport ─────────────────────────────────────────────────── */}
        {receipt.transport && (
          <ReceiptCard>
            <CardHeader icon="🚚" title="Transport" />
            <div style={{ padding: '6px 14px 10px' }}>
              <Row label="Mode"          value={receipt.transport.mode} />
              <Row label="Provider"      value={receipt.transport.companyOrProvider || '—'} />
              <Row label="Status"        value={receipt.transport.status} />
              <Row label="Bukti Pickup"  value={`${receipt.transport.pickupEvidenceCount} berkas`} />
              <Row label="Bukti Delivery" value={`${receipt.transport.deliveryEvidenceCount} berkas`} />
              {receipt.transport.buyerConfirmation && (
                <Row label="Konfirmasi Buyer" value={
                  receipt.transport.buyerConfirmation === 'Confirmed'
                    ? '✅ Dikonfirmasi'
                    : receipt.transport.buyerConfirmation
                } />
              )}
            </div>
          </ReceiptCard>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        <ReceiptCard>
          <CardHeader icon="📋" title="Ringkasan Audit Trail" badge={`${receipt.timeline.totalEvents} event`} />
          <div style={{ padding: '6px 14px 10px' }}>
            <Row label="Event Pertama" value={formatTs(receipt.timeline.firstEvent)} />
            <Row label="Event Terakhir" value={formatTs(receipt.timeline.lastEvent)} />
            {receipt.timeline.keyEvents.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                  Event Utama
                </div>
                {receipt.timeline.keyEvents.slice(0, 5).map((e, i) => (
                  <div key={i} style={{
                    padding: '6px 0', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{e.event}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{e.actor} · {formatTs(e.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate(`/marketplace/audit/${transaksiId}`)}
              style={{
                width: '100%', marginTop: 10, padding: '8px 0',
                borderRadius: 8, border: '1.5px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-primary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Lihat Audit Trail Lengkap →
            </button>
          </div>
        </ReceiptCard>

        {/* ── Evidence ──────────────────────────────────────────────────── */}
        <ReceiptCard>
          <CardHeader icon="📎" title="Ringkasan Evidence" badge={`${receipt.evidence.totalCount} berkas`} />
          <div style={{ padding: '6px 14px 10px' }}>
            <Row label="Total Berkas"    value={`${receipt.evidence.totalCount}`} />
            <Row label="Terverifikasi"   value={`${receipt.evidence.verifiedCount}`} />
            {receipt.evidence.categories.length > 0 && (
              <Row label="Kategori" value={receipt.evidence.categories.join(', ')} />
            )}
            <button
              type="button"
              onClick={() => navigate(`/marketplace/evidence/${transaksiId}`)}
              style={{
                width: '100%', marginTop: 10, padding: '8px 0',
                borderRadius: 8, border: '1.5px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-primary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Lihat Semua Evidence →
            </button>
          </div>
        </ReceiptCard>

        {/* ── Validity Notice ──────────────────────────────────────────── */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 10,
          fontSize: 10.5, color: 'var(--color-muted)',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          📄 Receipt ini dibuat secara otomatis oleh sistem TernakHub.<br />
          Dicetak: {formatTs(receipt.generatedAt)}<br />
          <strong>#{receipt.receiptNumber}</strong>
        </div>

      </div>
    </div>
  );
}
