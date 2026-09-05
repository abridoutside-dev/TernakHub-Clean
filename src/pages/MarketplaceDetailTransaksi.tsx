// ─── FARM-FIX-005.9 — Detail Transaksi (Orchestration Enhanced) ───────────────
// Shows full transaction detail with:
//   - Unified Orchestration State (11-step state machine)
//   - Deal Summary as SSOT
//   - Full Participants Panel (Buyer/Seller/Escrow/Transport/Vet)
//   - Contextual AI Suggestions (role-aware)
//   - Transaction timeline actions
//   - Links to Conversation, Attachments, Receipt

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useMarketplace } from '../hooks/useMarketplace';
import { recordUpdateTransaksiStatus, getTransaksiSupabaseId } from '../services/marketplaceService';
import { getWorkspacesByType } from '../services/workspaceService';
import { repoCreateTransportFromMarketplaceOrder } from '../repositories/transportRepository';
import TransactionTabBar from '../components/TransactionTabBar';
import {
  getTransaksiById,
  setujuiTransaksi,
  tolakTransaksi,
  batalkanTransaksi,
  selesaikanTransaksi,
  updateTransaksiStatus,
  type TransaksiStatus,
  type TransaksiItem,
} from '../data/marketplaceTransaksiData';
import {
  computeOrchestrationState,
  getOrchestrationProgress,
  getOrchestrationSteps,
  subscribeOrchestration,
  type OrchestrationState,
  type OrchParticipant,
  type AISuggestion005,
  type ParticipantOrchRole,
} from '../data/transactionOrchestrationData';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';
import { syncOrchestrationState } from '../data/transactionOrchestrationData';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TransaksiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  Disetujui:             { bg: '#e8f5ee', color: '#1b7a43', icon: '✅' },
  Ditolak:               { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Menunggu Pembayaran': { bg: '#fff3e0', color: '#e65100', icon: '💳' },
  Diproses:              { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  'Siap Diserahkan':     { bg: '#f3e5f5', color: '#6a1b9a', icon: '📦' },
  'Sedang Dikirim':      { bg: '#e0f7fa', color: '#006064', icon: '🚚' },
  Selesai:               { bg: '#e8f5ee', color: '#1b5e20', icon: '🎉' },
  Dibatalkan:            { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
};

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function formatDatetime(isoTs: string): string {
  const d = new Date(isoTs);
  if (isNaN(d.getTime())) return isoTs;
  const tgl = `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${tgl}, ${jam}`;
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Section / Field ──────────────────────────────────────────────────────────

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      <div style={{
        padding: '10px 16px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(37,99,235,0.1)', borderRadius: 8, padding: '2px 8px' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {children}
    </div>
  );
}

// ─── Orchestration Progress Bar ───────────────────────────────────────────────

function OrchestrationProgressBar({ orch }: { orch: OrchestrationState }) {
  const steps = getOrchestrationSteps();
  const progress = getOrchestrationProgress(orch);
  const cfg = orch.statusConfig;
  const isTerminal = ['Cancelled', 'Refunded', 'Disputed'].includes(orch.status);

  if (isTerminal) {
    return (
      <div style={{
        background: cfg.bg, border: `1.5px solid ${cfg.color}30`,
        borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: cfg.color, opacity: 0.8, marginTop: 2 }}>{cfg.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
      {/* Current status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 20, background: cfg.bg, borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {cfg.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>{cfg.description}</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>
          {orch.progressStep}/{orch.totalSteps}
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%', borderRadius: 10,
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}90)`,
          width: `${progress * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        {steps.slice(0, 11).map((step) => {
          const isDone = step.config.step < orch.progressStep;
          const isCurrent = step.config.step === orch.progressStep;
          return (
            <div
              key={step.status}
              title={step.config.label}
              style={{
                flex: 1, height: 4, borderRadius: 10,
                background: isDone || isCurrent ? step.config.color : 'var(--color-border)',
                opacity: isCurrent ? 1 : isDone ? 0.7 : 0.3,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Deal Summary ─────────────────────────────────────────────────────────────

function DealSummaryPanel({ orch }: { orch: OrchestrationState }) {
  const { deal, escrowMode, transportMode, grandTotal, transaksi } = orch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Listing */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8, flexShrink: 0,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {transaksi.thumbnailListing}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{transaksi.judulListing}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            {transaksi.qty} {transaksi.satuanHarga} × {formatRp(transaksi.hargaSatuan)}
          </div>
        </div>
      </div>

      {/* Deal Fields */}
      {deal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
            color: deal.status === 'Locked' ? '#2563eb' : deal.status === 'Waiting Approval' ? '#d97706' : '#6b7280',
            background: deal.status === 'Locked' ? '#eff6ff' : deal.status === 'Waiting Approval' ? '#fef3c7' : '#f3f4f6',
          }}>
            {deal.status === 'Locked' ? '🔒 Deal Terkunci' : deal.status === 'Waiting Approval' ? '⏳ Menunggu Persetujuan' : `📝 ${deal.status}`}
          </span>
          {deal.lockedAt && (
            <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
              {formatDatetime(deal.lockedAt).split(',')[0]}
            </span>
          )}
        </div>
      )}

      <Grid2>
        <Field label="Subtotal Kesepakatan" value={formatRp(grandTotal.dealTotal)} />
        <Field label="Total Keseluruhan"   value={formatRp(grandTotal.grandTotal)} highlight />
      </Grid2>
      <Grid2>
        <Field label="Mode Escrow"    value={escrowMode} />
        <Field label="Mode Transportasi" value={transportMode} />
      </Grid2>
      {grandTotal.escrowFee > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-muted)' }}>
          <span>Biaya Escrow</span>
          <span>{formatRp(grandTotal.escrowFee)}</span>
        </div>
      )}
      {grandTotal.transportFee > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'var(--color-muted)' }}>
          <span>Biaya Transport</span>
          <span>{formatRp(grandTotal.transportFee)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Participants Panel ───────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  Buyer:        { color: '#1565c0', bg: '#e3f2fd', icon: '🛒' },
  Seller:       { color: '#1b7a43', bg: '#e8f5ee', icon: '🏪' },
  Escrow:       { color: '#7b5e2a', bg: '#fff8e1', icon: '🏦' },
  Transport:    { color: '#006064', bg: '#e0f7fa', icon: '🚚' },
  Veterinarian: { color: '#6a1b9a', bg: '#f3e5f5', icon: '👨‍⚕️' },
};

function ParticipantRow({ p }: { p: OrchParticipant }) {
  const cfg = ROLE_COLORS[p.role] ?? { color: '#6b7280', bg: '#f3f4f6', icon: '🏪' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: cfg.bg, border: `2px solid ${cfg.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {p.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 4, padding: '1px 5px' }}>
            {cfg.icon} {p.role}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{p.currentStatus}</span>
        </div>
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--color-muted)', textAlign: 'right', flexShrink: 0 }}>
        <div>Bergabung</div>
        <div style={{ fontWeight: 600 }}>
          {p.joinedAt
            ? new Date(p.joinedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
            : '—'}
        </div>
      </div>
    </div>
  );
}

// ─── AI Suggestions Panel ─────────────────────────────────────────────────────

function AISuggestionsPanel({
  suggestions,
  onAction,
  activeRole,
}: {
  suggestions: AISuggestion005[];
  onAction: (key: string) => void;
  activeRole: ParticipantOrchRole | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const filtered = activeRole
    ? suggestions.filter(s => s.forRoles.includes(activeRole))
    : suggestions;

  if (filtered.length === 0) return null;

  const PRIORITY_CFG = {
    High:   { color: '#c62828', bg: '#ffebee', icon: '🔴' },
    Medium: { color: '#d97706', bg: '#fef3c7', icon: '🟡' },
    Low:    { color: '#6b7280', bg: '#f3f4f6', icon: '⚪' },
  };

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid #3b82f630',
      borderRadius: 12, overflow: 'hidden', marginBottom: 12,
    }}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16, marginRight: 8 }}>🤖</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 }}>
          AI Saran Kontekstual
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', borderRadius: 8, padding: '2px 8px', marginRight: 8 }}>
          {filtered.length} saran
        </span>
        <span style={{ fontSize: 14, color: 'var(--color-muted)', transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>›</span>
      </button>

      {!collapsed && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {filtered.map((s) => {
            const pcfg = PRIORITY_CFG[s.priority];
            return (
              <div key={s.id} style={{
                padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{s.title}</div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: pcfg.color, background: pcfg.bg, borderRadius: 4, padding: '1px 5px' }}>
                      {pcfg.icon} {s.priority}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {s.body}
                </div>
                {s.actionLabel && s.actionKey && (
                  <button
                    type="button"
                    onClick={() => onAction(s.actionKey!)}
                    style={{
                      alignSelf: 'flex-start', padding: '5px 12px',
                      borderRadius: 6, border: '1.5px solid #3b82f6',
                      background: 'transparent', color: '#3b82f6',
                      fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {s.actionLabel} →
                  </button>
                )}
              </div>
            );
          })}
          <div style={{ padding: '8px 16px', fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            🤖 Saran AI bersifat informatif. AI tidak melakukan aksi apapun secara otomatis.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Riwayat Status Timeline ──────────────────────────────────────────────────

function RiwayatTimeline({ transaksi }: { transaksi: TransaksiItem }) {
  const riwayat = [...transaksi.riwayatStatus].reverse();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {riwayat.map((entry, idx) => {
        const badge = STATUS_BADGE[entry.status];
        const isFirst = idx === 0;
        return (
          <div key={entry.timestamp + idx} style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isFirst ? 'var(--color-primary)' : badge.bg,
                border: isFirst ? '2px solid var(--color-primary)' : `2px solid ${badge.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0, zIndex: 1,
              }}>
                {badge.icon}
              </div>
              {idx < riwayat.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 16, background: 'var(--color-border)', margin: '2px 0' }} />
              )}
            </div>
            <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: badge.bg, color: badge.color, whiteSpace: 'nowrap',
                }}>
                  {entry.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
                {formatDatetime(entry.timestamp)}
              </div>
              {entry.catatan && (
                <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 4, fontStyle: 'italic' }}>
                  "{entry.catatan}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Action Modal ─────────────────────────────────────────────────────────────

type ModalAction =
  | { type: 'setujui' }
  | { type: 'tolak' }
  | { type: 'batalkan' }
  | { type: 'bayar' }
  | { type: 'proses' }
  | { type: 'siap' }
  | { type: 'kirim' }
  | { type: 'selesai' };

function ActionModal({
  action,
  onConfirm,
  onClose,
}: {
  action: ModalAction;
  onConfirm: (catatan: string) => void;
  onClose: () => void;
}) {
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  const CONFIG: Record<ModalAction['type'], { title: string; catatanLabel: string; catatanRequired: boolean; confirmLabel: string; confirmColor: string }> = {
    setujui:  { title: 'Setujui Transaksi',  catatanLabel: 'Pesan ke Pembeli (opsional)', catatanRequired: false, confirmLabel: 'Setujui',          confirmColor: '#1b7a43' },
    tolak:    { title: 'Tolak Transaksi',     catatanLabel: 'Alasan penolakan',             catatanRequired: true,  confirmLabel: 'Tolak Transaksi',   confirmColor: '#c62828' },
    batalkan: { title: 'Batalkan Transaksi',  catatanLabel: 'Alasan pembatalan',            catatanRequired: true,  confirmLabel: 'Batalkan',          confirmColor: '#5d4037' },
    bayar:    { title: 'Konfirmasi Pembayaran', catatanLabel: 'Catatan pembayaran (opsional)', catatanRequired: false, confirmLabel: 'Konfirmasi Bayar', confirmColor: '#e65100' },
    proses:   { title: 'Proses Pesanan',      catatanLabel: 'Catatan pemrosesan (opsional)', catatanRequired: false, confirmLabel: 'Proses Sekarang',  confirmColor: '#1565c0' },
    siap:     { title: 'Tandai Siap Diserahkan', catatanLabel: 'Catatan (opsional)', catatanRequired: false, confirmLabel: 'Siap Diserahkan', confirmColor: '#6a1b9a' },
    kirim:    { title: 'Mulai Pengiriman',    catatanLabel: 'Info pengiriman (nomor resi, ekspedisi)', catatanRequired: false, confirmLabel: 'Kirim Sekarang', confirmColor: '#006064' },
    selesai:  { title: 'Selesaikan Transaksi', catatanLabel: 'Catatan penyelesaian (opsional)', catatanRequired: false, confirmLabel: 'Selesaikan & Sinkronkan Aset', confirmColor: '#1b5e20' },
  };

  const cfg = CONFIG[action.type];

  async function handleConfirm() {
    if (cfg.catatanRequired && !catatan.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onConfirm(catatan.trim());
      setLoading(false);
    }, 200);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px',
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{cfg.title}</div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>
            {cfg.catatanLabel} {cfg.catatanRequired && <span style={{ color: '#c62828' }}>*</span>}
          </label>
          <textarea
            value={catatan} onChange={(e) => setCatatan(e.target.value)}
            placeholder={cfg.catatanRequired ? 'Wajib diisi…' : 'Opsional…'} rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
              fontSize: 13.5, color: 'var(--color-text)', resize: 'vertical', outline: 'none',
            }}
          />
        </div>
        {action.type === 'selesai' && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#e8f5ee', borderRadius: 8, fontSize: 12, color: '#1b5e20', fontWeight: 600 }}>
            ⚠️ Sinkronisasi aset akan dilakukan setelah konfirmasi dan tidak dapat dibatalkan.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--color-border)',
            background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Batal
          </button>
          <button type="button" onClick={handleConfirm}
            disabled={loading || (cfg.catatanRequired && !catatan.trim())}
            style={{
              flex: 2, padding: '12px', borderRadius: 10, border: 'none',
              background: loading || (cfg.catatanRequired && !catatan.trim()) ? '#ccc' : cfg.confirmColor,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading || (cfg.catatanRequired && !catatan.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Memproses…' : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({
  transaksi,
  onAction,
  onRequestTransport,
}: {
  transaksi: TransaksiItem;
  onAction: (action: ModalAction) => void;
  onRequestTransport: () => void;
}) {
  const s = transaksi.status;
  const btn = (color: string, outline = false): React.CSSProperties => ({
    flex: 1, padding: '11px 8px', borderRadius: 10,
    border: outline ? `1.5px solid ${color}` : 'none',
    background: outline ? 'transparent' : color,
    color: outline ? color : '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  });

  const showTransportBtn = s === 'Disetujui' || s === 'Diproses' || s === 'Siap Diserahkan' || s === 'Sedang Dikirim';

  if (s === 'Menunggu Persetujuan') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" style={btn('#c62828', true)} onClick={() => onAction({ type: 'tolak' })}>❌ Tolak</button>
      <button type="button" style={btn('#1b7a43')}       onClick={() => onAction({ type: 'setujui' })}>✅ Setujui</button>
      <button type="button" style={btn('#5d4037', true)} onClick={() => onAction({ type: 'batalkan' })}>🚫 Batal</button>
    </div>
  );
  if (s === 'Disetujui') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn('#5d4037', true)} onClick={() => onAction({ type: 'batalkan' })}>🚫 Batal</button>
        <button type="button" style={btn('#e65100')}       onClick={() => onAction({ type: 'bayar' })}>💳 Konfirmasi Bayar</button>
      </div>
      {showTransportBtn && (
        <button type="button" style={btn('#006064')} onClick={onRequestTransport}>
          🚚 Buat Pengiriman Transport
        </button>
      )}
    </div>
  );
  if (s === 'Menunggu Pembayaran') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" style={btn('#5d4037', true)} onClick={() => onAction({ type: 'batalkan' })}>🚫 Batal</button>
      <button type="button" style={btn('#1565c0')}       onClick={() => onAction({ type: 'proses' })}>🔄 Proses</button>
    </div>
  );
  if (s === 'Diproses') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn('#6a1b9a')} onClick={() => onAction({ type: 'siap' })}>📦 Siap Diserahkan</button>
      </div>
      {showTransportBtn && (
        <button type="button" style={btn('#006064')} onClick={onRequestTransport}>
          🚚 Buat Pengiriman Transport
        </button>
      )}
    </div>
  );
  if (s === 'Siap Diserahkan') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn('#006064')} onClick={() => onAction({ type: 'kirim' })}>🚚 Kirim</button>
        <button type="button" style={btn('#1b5e20')} onClick={() => onAction({ type: 'selesai' })}>🎉 Selesaikan</button>
      </div>
      {showTransportBtn && (
        <button type="button" style={btn('#006064')} onClick={onRequestTransport}>
          🚚 Buat Pengiriman Transport
        </button>
      )}
    </div>
  );
  if (s === 'Sedang Dikirim') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn('#1b5e20')} onClick={() => onAction({ type: 'selesai' })}>🎉 Konfirmasi & Selesai</button>
      </div>
      {showTransportBtn && (
        <button type="button" style={btn('#006064')} onClick={onRequestTransport}>
          🚚 Buat Pengiriman Transport
        </button>
      )}
    </div>
  );
  return null;
}

// ─── Quick Access Buttons ─────────────────────────────────────────────────────

function QuickAccess({ transaksiId, hasEscrow }: { transaksiId: string; hasEscrow: boolean }) {
  const navigate = useNavigate();

  const items: Array<{ icon: string; label: string; color: string; path: string; show: boolean }> = [
    { icon: '💬', label: 'Chat',        color: '#3b82f6', path: `/marketplace/conversation/${transaksiId}`, show: true },
    { icon: '📎', label: 'Evidence',    color: '#1b7a43', path: `/marketplace/evidence/${transaksiId}`,     show: true },
    { icon: '📋', label: 'Audit',       color: '#6b7280', path: `/marketplace/audit/${transaksiId}`,        show: true },
    { icon: '🔐', label: 'Escrow',      color: '#1565c0', path: `/marketplace/escrow/${transaksiId}`,       show: hasEscrow },
    { icon: '🗂️', label: 'Files',       color: '#d97706', path: `/marketplace/attachments/${transaksiId}`,  show: true },
    { icon: '📄', label: 'Receipt',     color: '#9333ea', path: `/marketplace/receipt/${transaksiId}`,      show: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
      {items.filter(i => i.show).map((item) => (
        <button
          key={item.path}
          type="button"
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 6px', borderRadius: 10,
            border: `1.5px solid ${item.color}30`,
            background: `${item.color}0a`,
            color: item.color, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Transport Workspace Picker Modal ──────────────────────────────────────────

function TransportWorkspacePickerModal({
  loading,
  error,
  workspaces,
  creating,
  onSelect,
  onClose,
}: {
  loading: boolean;
  error: string;
  workspaces: Array<{ id: string; name: string; icon: string }>;
  creating: boolean;
  onSelect: (workspaceId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.5)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 22,
          width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
          🚚 Pilih Workspace Transport
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
          Order marketplace ini akan dibuat menjadi pengiriman transport pada workspace yang dipilih.
          Pengiriman akan muncul di <strong>Menunggu Penggabungan</strong> untuk digabung ke batch.
        </p>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '8px 12px', fontSize: 12, color: '#991b1b', marginBottom: 12,
          }}>{error}</div>
        )}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>
            ⏳ Memuat workspace Transport…
          </p>
        ) : workspaces.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '20px 0' }}>
            Belum ada Workspace Transport Aktif. Buat workspace Transport terlebih dahulu.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                disabled={creating}
                onClick={() => onSelect(w.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #cbd5e1', background: '#fff',
                  textAlign: 'left', cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#0f172a',
                }}
              >
                <span style={{ fontSize: 22 }}>{w.icon}</span>
                <span style={{ flex: 1 }}>{w.name}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{creating ? '…' : 'Pilih →'}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            style={{
              padding: '9px 18px', borderRadius: 8,
              background: '#f1f5f9', color: '#374151',
              border: 'none', fontSize: 13, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceDetailTransaksi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setTick]         = useState(0);
  const [modalAction, setModal] = useState<ModalAction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccess] = useState('');
  const [transportPickerOpen, setTransportPickerOpen] = useState(false);
  const [transportWorkspaces, setTransportWorkspaces] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [transportPickerLoading, setTransportPickerLoading] = useState(false);
  const [transportPickerError, setTransportPickerError] = useState('');
  const [transportCreating, setTransportCreating] = useState(false);

  const { activeWorkspace } = useWorkspace();
  useMarketplace(); // FLOW-003M27: hydrate transaksi from Supabase on mount

  const transaksi = id ? getTransaksiById(id) : undefined;
  const orch = id ? computeOrchestrationState(id) : null;
  const hasEscrow = id ? !!getEscrowByTransaksiId(id) : false;

  const activeRole: ParticipantOrchRole | null = orch
    ? activeWorkspace?.workspace_uuid === orch.transaksi.workspaceIdPembeli
      ? 'Buyer'
      : activeWorkspace?.workspace_uuid === orch.transaksi.workspaceIdPenjual
      ? 'Seller'
      : null
    : null;

  function refresh() { setTick((n) => n + 1); }

  // Subscribe to orchestration bus — mutations in escrow/deal/transport/quotation
  // modules will fire syncOrchestrationState which triggers this listener.
  useEffect(() => {
    if (!id) return;
    return subscribeOrchestration((changedId) => {
      if (changedId === id) setTick((n) => n + 1);
    });
  }, [id]);

  if (!transaksi) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Transaksi tidak ditemukan</div>
        <button type="button" onClick={() => navigate('/marketplace/transaksi')} style={{
          marginTop: 8, padding: '10px 20px', borderRadius: 10,
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          ← Kembali ke Transaksi
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGE[transaksi.status];

  function handleAction(catatan: string) {
    if (!modalAction || !transaksi) return;
    const txId = transaksi.id;
    setErrorMsg('');
    setSuccess('');
    try {
      switch (modalAction.type) {
        case 'setujui':
          setujuiTransaksi(txId, catatan || undefined);
          void recordUpdateTransaksiStatus(txId, 'Disetujui');
          setSuccess('Transaksi berhasil disetujui.'); break;
        case 'tolak':
          tolakTransaksi(txId, catatan);
          void recordUpdateTransaksiStatus(txId, 'Ditolak');
          setSuccess('Transaksi ditolak.'); break;
        case 'batalkan':
          batalkanTransaksi(txId, catatan);
          void recordUpdateTransaksiStatus(txId, 'Dibatalkan');
          setSuccess('Transaksi dibatalkan.'); break;
        case 'bayar':
          updateTransaksiStatus(txId, 'Menunggu Pembayaran', catatan || 'Menunggu konfirmasi pembayaran.');
          void recordUpdateTransaksiStatus(txId, 'Menunggu Pembayaran');
          setSuccess('Status: Menunggu Pembayaran.'); break;
        case 'proses':
          updateTransaksiStatus(txId, 'Diproses', catatan || 'Pesanan sedang diproses.');
          void recordUpdateTransaksiStatus(txId, 'Diproses');
          setSuccess('Pesanan diproses.'); break;
        case 'siap':
          updateTransaksiStatus(txId, 'Siap Diserahkan', catatan || 'Pesanan siap diserahkan.');
          void recordUpdateTransaksiStatus(txId, 'Siap Diserahkan');
          setSuccess('Siap Diserahkan.'); break;
        case 'kirim':
          updateTransaksiStatus(txId, 'Sedang Dikirim', catatan || 'Pesanan sedang dikirim.');
          void recordUpdateTransaksiStatus(txId, 'Sedang Dikirim');
          setSuccess('Pengiriman dimulai.'); break;
        case 'selesai':
          selesaikanTransaksi(txId, catatan || undefined);
          void recordUpdateTransaksiStatus(txId, 'Selesai', { asset_synced: true, completed_at: new Date().toISOString() });
          setSuccess('Transaksi selesai. Aset disinkronkan.'); break;
      }
      syncOrchestrationState(txId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
    setModal(null);
    refresh();
  }

  function handleAISuggestionAction(key: string) {
    const txId = transaksi?.id;
    if (!txId) return;
    switch (key) {
      case 'create_deal':
      case 'submit_deal':
      case 'review_deal':
      case 'review_quotations':
      case 'configure_transport':
        navigate(`/marketplace/conversation/${txId}`); break;
      case 'configure_escrow':
      case 'confirm_receipt':
      case 'buyer_confirm':
      case 'confirm_funds':
        navigate(`/marketplace/escrow/${txId}`); break;
      case 'upload_evidence':
      case 'upload_payment_proof':
        navigate(`/marketplace/evidence/${txId}`); break;
      case 'view_receipt':
        navigate(`/marketplace/receipt/${txId}`); break;
      case 'view_audit':
        navigate(`/marketplace/audit/${txId}`); break;
    }
  }

  // ─── Marketplace → Transport (Gap #1) ────────────────────────────────────────
  // The user (typically seller) decides to ship the marketplace order via a
  // Transport workspace. We open a workspace picker, then call
  // repoCreateTransportFromMarketplaceOrder, which:
  //   1. Validates the order is in an eligible status
  //   2. Reuses or creates the canonical transaction_rooms row
  //   3. Inserts a transport_transactions row with status='Menunggu'
  //   4. The new row is immediately visible to repoListPendingMergeDeliveries
  async function openTransportPicker() {
    setErrorMsg('');
    setSuccess('');
    setTransportPickerError('');
    setTransportPickerOpen(true);
    setTransportPickerLoading(true);
    try {
      const list = await getWorkspacesByType('Transport');
      setTransportWorkspaces(
        list
          .filter((w) => w.workspace_status === 'Active')
          .map((w) => ({ id: w.workspace_uuid, name: w.workspace_name ?? 'Transport', icon: '🚚' })),
      );
    } catch (e) {
      setTransportPickerError(e instanceof Error ? e.message : 'Gagal memuat daftar Transport.');
    } finally {
      setTransportPickerLoading(false);
    }
  }

  function closeTransportPicker() {
    if (transportCreating) return;
    setTransportPickerOpen(false);
    setTransportPickerError('');
  }

  async function handleCreateTransportFromMarketplace(transportWorkspaceId: string) {
    if (!transaksi) return;
    const txDbId = getTransaksiSupabaseId(transaksi.id);
    if (!txDbId) {
      setTransportPickerError(
        'Order marketplace belum tersinkronisasi ke database (UUID Supabase tidak ditemukan). ' +
          'Coba muat ulang halaman.',
      );
      return;
    }
    setTransportCreating(true);
    setTransportPickerError('');
    try {
      const result = await repoCreateTransportFromMarketplaceOrder({
        marketplace_transaction_id: txDbId,
        transport_workspace_id: transportWorkspaceId,
      });
      setSuccess(
        result.reused
          ? 'Pengiriman transport untuk order ini sudah ada — dibawa ke workspace Transport.'
          : 'Pengiriman transport berhasil dibuat. Pengiriman muncul di "Menunggu Penggabungan".',
      );
      setTransportPickerOpen(false);
      // Navigate to the Transport workspace so the user can see it in Pending Merge.
      navigate(`/workspace/${transportWorkspaceId}/transport?tab=home`);
    } catch (e) {
      setTransportPickerError(e instanceof Error ? e.message : 'Gagal membuat pengiriman transport.');
    } finally {
      setTransportCreating(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 48px' }}>

      {/* ── Orchestration Status (Primary) ─────────────────────────────── */}
      {orch ? (
        <div style={{ marginBottom: 14 }}>
          <OrchestrationProgressBar orch={orch} />
        </div>
      ) : (
        <div style={{
          background: badge.bg, borderRadius: 10, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <div style={{ fontSize: 28 }}>{badge.icon}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: badge.color, textTransform: 'uppercase', letterSpacing: 0.6 }}>Status</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: badge.color }}>{transaksi.status}</div>
          </div>
          {transaksi.selesaiAt && (
            <div style={{ marginLeft: 'auto', fontSize: 11, color: badge.color, textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>Selesai</div>
              <div>{formatTanggal(transaksi.selesaiAt)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ background: '#e8f5ee', border: '1.5px solid #a5d6a7', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#1b5e20' }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#c62828' }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* ── Quick Access ───────────────────────────────────────────────── */}
      <QuickAccess transaksiId={transaksi.id} hasEscrow={hasEscrow} />

      {/* ── AI Suggestions ─────────────────────────────────────────────── */}
      {orch && orch.aiSuggestions.length > 0 && (
        <AISuggestionsPanel
          suggestions={orch.aiSuggestions}
          onAction={handleAISuggestionAction}
          activeRole={activeRole}
        />
      )}

      {/* ── Deal Summary (SSOT) ────────────────────────────────────────── */}
      {orch ? (
        <Section title="Ringkasan Kesepakatan">
          <DealSummaryPanel orch={orch} />
        </Section>
      ) : (
        <>
          <Section title="Info Transaksi">
            <Field label="Nomor Transaksi" value={transaksi.id} mono />
            <Grid2>
              <Field label="Tanggal Dibuat" value={formatTanggal(transaksi.createdAt)} />
              <Field label="Diperbarui" value={formatTanggal(transaksi.updatedAt)} />
            </Grid2>
            {transaksi.alasanDitolak   && <Field label="Alasan Ditolak"   value={transaksi.alasanDitolak} />}
            {transaksi.alasanDibatalkan && <Field label="Alasan Dibatalkan" value={transaksi.alasanDibatalkan} />}
          </Section>

          <Section title="Listing">
            <Field label="Listing" value={transaksi.judulListing} />
            <Grid2>
              <Field label="Qty"   value={`${transaksi.qty} ${transaksi.satuanHarga}`} />
              <Field label="Harga" value={formatRp(transaksi.hargaSatuan) + ` / ${transaksi.satuanHarga}`} />
            </Grid2>
            <Field label="Total" value={formatRp(transaksi.total)} highlight />
          </Section>
        </>
      )}

      {/* ── Participants Panel ─────────────────────────────────────────── */}
      {orch && orch.participants.length > 0 && (
        <Section title="Peserta Transaksi" badge={`${orch.participants.length} pihak`}>
          {orch.participants.map((p) => (
            <ParticipantRow key={p.id} p={p} />
          ))}
        </Section>
      )}

      {/* ── Transaksi Info (compact, below) ────────────────────────────── */}
      <Section title="Info Transaksi">
        <Field label="Nomor Transaksi" value={transaksi.id} mono />
        <Grid2>
          <Field label="Dibuat"     value={formatTanggal(transaksi.createdAt)} />
          <Field label="Diperbarui" value={formatTanggal(transaksi.updatedAt)} />
        </Grid2>
        {transaksi.selesaiAt && <Field label="Selesai" value={formatTanggal(transaksi.selesaiAt)} />}
        {transaksi.alasanDitolak    && <Field label="Alasan Ditolak"    value={transaksi.alasanDitolak} />}
        {transaksi.alasanDibatalkan && <Field label="Alasan Dibatalkan" value={transaksi.alasanDibatalkan} />}
      </Section>

      {/* ── Riwayat Status ─────────────────────────────────────────────── */}
      <Section title="Riwayat Status">
        <RiwayatTimeline transaksi={transaksi} />
      </Section>

      {/* ── Tombol Aksi ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 4 }}>
        <ActionButtons
          transaksi={transaksi}
          onAction={setModal}
          onRequestTransport={() => void openTransportPicker()}
        />
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalAction && (
        <ActionModal action={modalAction} onConfirm={handleAction} onClose={() => setModal(null)} />
      )}

      {transportPickerOpen && (
        <TransportWorkspacePickerModal
          loading={transportPickerLoading}
          error={transportPickerError}
          workspaces={transportWorkspaces}
          creating={transportCreating}
          onSelect={(id) => void handleCreateTransportFromMarketplace(id)}
          onClose={closeTransportPicker}
        />
      )}

      {/* ── Transaction Tab Bar ─────────────────────────────────────────── */}
      <div style={{ marginTop: 20, marginLeft: -14, marginRight: -14 }}>
        <TransactionTabBar
          transaksiId={transaksi.id}
          activeTab="detail"
          hasEscrow={hasEscrow}
        />
      </div>
    </div>
  );
}
