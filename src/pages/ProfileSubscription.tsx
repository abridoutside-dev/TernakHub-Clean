// ─── Profile Subscription Page — SUB-001 / P0-006B-3 ─────────────────────────
//
// Displays the subscription state for the currently active Workspace.
// Subscription is per-Workspace, NOT per-User.
//
// Rules:
//  ❌ No payment gateway, billing, invoice, or real money flow.
//  ✅ requestPlanChange() creates a "Waiting for Payment" request.
//  ✅ Plan is activated only after Admin verifies payment proof.
//  ✅ Payment instructions come from SUBSCRIPTION_PAYMENT_CONFIG (Admin SSOT).

import { useEffect, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  BENEFIT_ROWS,
  SUBSCRIPTION_STATUS_CONFIG,
} from '../data/workspaceSubscriptionData';
import { getWorkspaceSubscriptionHistory } from '../services/workspaceService';
import type { SubscriptionHistoryEntryAdmin } from '../types/subscriptionAdmin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatIDR(amount: number | null): string {
  if (!amount || amount === 0) return 'Rp 0';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md, 12px)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function BenefitValue({ value }: { value: boolean | string }) {
  if (value === true)  return <span style={{ color: '#1b7a43', fontSize: 16 }}>✓</span>;
  if (value === false) return <span style={{ color: '#d1d5db', fontSize: 16 }}>—</span>;
  return <span style={{ fontSize: 11, color: 'var(--color-text)', fontWeight: 500 }}>{value}</span>;
}

function InfoBanner() {
  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
      padding: '10px 14px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>🏢</span>
      <div style={{ fontSize: 12, color: '#7b5e2a', lineHeight: 1.5 }}>
        <strong>Subscription melekat pada Workspace.</strong> Setiap Workspace memiliki paket sendiri.
        Ganti Workspace aktif di Global Header untuk melihat subscriptionnya.
      </div>
    </div>
  );
}

/* ─── Legacy payment request UI (not part of the live subscription contract) ──

const PAYMENT_REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'Waiting for Payment':    { label: 'Menunggu Pembayaran', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  'Payment Proof Submitted': { label: 'Bukti Dikirim',      color: '#2563eb', bg: '#dbeafe', icon: '📋' },
  'Verified':               { label: 'Terverifikasi',        color: '#059669', bg: '#d1fae5', icon: '✅' },
  'Rejected':               { label: 'Ditolak',              color: '#dc2626', bg: '#fee2e2', icon: '❌' },
  'Cancelled':              { label: 'Dibatalkan',           color: '#64748b', bg: '#f1f5f9', icon: '🚫' },
};

// ─── Payment Instructions Card ────────────────────────────────────────────────

function PaymentInstructionsCard({
  request,
  onSubmitProof,
}: {
  request: SubscriptionPaymentRequest;
  onSubmitProof: () => void;
}) {
  const statusCfg = PAYMENT_REQUEST_STATUS_CONFIG[request.status] ?? { label: request.status, color: '#64748b', bg: '#f1f5f9', icon: '❓' };
  const cfg       = request.paymentConfigSnapshot;
  const planCfg   = PLAN_CONFIG[request.to_plan];
  const isWaiting = request.status === 'Waiting for Payment';
  const isSubmitted = request.status === 'Payment Proof Submitted';

  return (
    <Card style={{ marginBottom: 24, border: `1.5px solid ${isWaiting ? '#fcd34d' : isSubmitted ? '#93c5fd' : 'var(--color-border)'}` }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: statusCfg.bg,
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{statusCfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: statusCfg.color }}>{statusCfg.label}</div>
          <div style={{ fontSize: 11.5, color: statusCfg.color, opacity: 0.85, marginTop: 1 }}>
            Permintaan perubahan ke paket{' '}
            <strong style={{ color: planCfg.color }}>{request.to_plan}</strong>
            {request.amount ? ` — ${formatIDR(request.amount)}` : ''}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Payment instructions */}
        {(isWaiting || isSubmitted) && cfg.active && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, letterSpacing: 0.5 }}>
              INSTRUKSI PEMBAYARAN
            </div>
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 12,
            }}>
              {[
                { label: 'Bank', value: cfg.bankName },
                { label: 'Atas Nama', value: cfg.accountHolder },
                { label: 'Nomor Rekening', value: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>{cfg.accountNumber}</code> },
                ...(cfg.qrisUrl ? [{ label: 'QRIS', value: '✓ Tersedia (hubungi Admin untuk detail)' }] : []),
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 12, padding: '7px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 14 }}>
              {cfg.instructions}
            </div>
          </>
        )}

        {/* Proof submitted info */}
        {isSubmitted && request.proofFileName && (
          <div style={{ background: '#dbeafe', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af' }}>Bukti pembayaran telah dikirim</div>
              <div style={{ fontSize: 11.5, color: '#1d4ed8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {request.proofFileName}
              </div>
            </div>
          </div>
        )}

        {/* Verified / Rejected info */}
        {(request.status === 'Verified' || request.status === 'Rejected') && (
          <div style={{
            background: request.status === 'Verified' ? '#d1fae5' : '#fee2e2',
            borderRadius: 8, padding: '10px 12px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: request.status === 'Verified' ? '#065f46' : '#7f1d1d' }}>
              {request.status === 'Verified'
                ? 'Pembayaran telah diverifikasi oleh Admin. Paket Anda sudah aktif.'
                : 'Pembayaran ditolak oleh Admin. Silakan hubungi support untuk informasi lebih lanjut.'}
            </div>
            {request.proofNote && (
              <div style={{ fontSize: 11.5, marginTop: 4, color: request.status === 'Verified' ? '#047857' : '#991b1b' }}>
                Catatan: {request.proofNote}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: isWaiting ? 14 : 0 }}>
          Dibuat: {formatDateTime(request.createdAt)}
        </div>

        {/* CTA: submit proof */}
        {isWaiting && (
          <button
            onClick={onSubmitProof}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: '#2563eb', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4,
            }}
          >
            📤 Upload Bukti Pembayaran
          </button>
        )}
      </div>
    </Card>
  );
}

// ─── Submit Proof Sheet ───────────────────────────────────────────────────────

function SubmitProofSheet({
  requestId,
  onSubmit,
  onClose,
}: {
  requestId: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [fileName, setFileName] = useState('');
  const [note, setNote]         = useState('');
  const [error, setError]       = useState('');

  function handleSubmit() {
    if (!fileName.trim()) { setError('Nama file bukti pembayaran wajib diisi.'); return; }
    const result = submitSubscriptionPaymentProof(requestId, { proofFileName: fileName.trim(), note });
    if (!result) { setError('Gagal mengirim bukti. Coba lagi.'); return; }
    onSubmit();
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        zIndex: 401, padding: '0 0 env(safe-area-inset-bottom, 24px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Upload Bukti Pembayaran
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20 }}>
            Setelah Admin memverifikasi bukti, paket Anda akan langsung diaktifkan.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
              Nama File Bukti Transfer <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              value={fileName}
              onChange={e => { setFileName(e.target.value); setError(''); }}
              placeholder="e.g. bukti_transfer_pro_juli2026.jpg"
              style={{
                width: '100%', padding: '11px 14px', border: `1.5px solid ${error ? '#fca5a5' : 'var(--color-border)'}`,
                borderRadius: 10, fontSize: 14, color: 'var(--color-text)',
                background: 'var(--color-bg)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
              Catatan (opsional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Transfer via BCA mobile jam 14:30"
              rows={2}
              style={{
                width: '100%', padding: '11px 14px', border: '1.5px solid var(--color-border)',
                borderRadius: 10, fontSize: 14, color: 'var(--color-text)',
                background: 'var(--color-bg)', outline: 'none', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Batal
            </button>
            <button onClick={handleSubmit}
              style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Kirim Bukti
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Confirm Sheet ────────────────────────────────────────────────────────────

function PlanChangeSheet({
  targetPlan,
  currentPlan,
  onConfirm,
  onClose,
}: {
  targetPlan: WorkspacePlan;
  currentPlan: WorkspacePlan;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cfg   = PLAN_CONFIG[targetPlan];
  const isUp  = PLAN_ORDER.indexOf(targetPlan) > PLAN_ORDER.indexOf(currentPlan);
  const verb  = isUp ? 'Upgrade' : 'Downgrade';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        zIndex: 401, padding: '0 0 env(safe-area-inset-bottom, 24px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Konfirmasi {verb}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 16 }}>
            Anda akan mengajukan perubahan ke paket{' '}
            <span style={{
              fontWeight: 700, color: cfg.color, background: cfg.bg,
              padding: '2px 8px', borderRadius: 6, border: `1px solid ${cfg.border}`,
            }}>
              {cfg.label}
            </span>
            {' '}({cfg.price_label}).
          </div>
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#166534',
          }}>
            💳 Permintaan pembayaran akan dibuat. Setelah Admin memverifikasi bukti transfer, paket akan langsung diaktifkan.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Batal
            </button>
            <button onClick={() => { onConfirm(); onClose(); }}
              style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: cfg.color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Ajukan {verb}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

*/

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileSubscription() {
  const [tick, setTick]                     = useState(0);
  const [confirmPlan, setConfirmPlan]       = useState<WorkspacePlan | null>(null);
  const [showProofSheet, setShowProofSheet] = useState(false);

  const { activeWorkspace } = useWorkspace();
  const sub                 = useSubscription();

  const workspaceUuid = sub.workspaceUuid;
  const plan          = sub.plan;
  const planCfg       = PLAN_CONFIG[plan];
  const statusCfg     = SUBSCRIPTION_STATUS_CONFIG[sub.status];
  const history       = workspaceUuid ? getSubscriptionHistory(workspaceUuid) : [];

  // Read pending payment request on every tick
  const pendingRequest: SubscriptionPaymentRequest | undefined =
    workspaceUuid ? getPendingSubscriptionPaymentRequest(workspaceUuid) : undefined;

  function handleSelectPlan(target: WorkspacePlan) {
    if (target === plan) return;
    if (pendingRequest) return; // already has a pending request
    if (target === 'Enterprise') return;
    setConfirmPlan(target);
  }

  function handleConfirm() {
    if (!confirmPlan || !workspaceUuid) return;
    requestPlanChange(workspaceUuid, confirmPlan);
    setTick((t) => t + 1);
  }

  // No active workspace
  if (!activeWorkspace) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Tidak ada Workspace Aktif
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>
          Pilih atau buat Workspace terlebih dahulu untuk melihat subscription.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>

      {/* ── Workspace indicator ──────────────────────────────────────── */}
      <InfoBanner />

      {/* ── Current workspace context ────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🏢</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>WORKSPACE AKTIF</div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeWorkspace.workspace_name}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: planCfg.color, background: planCfg.bg,
          border: `1px solid ${planCfg.border}`,
          padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
        }}>
          {planCfg.label}
        </span>
      </div>

      {/* ── Pending Payment Request ──────────────────────────────────── */}
      {pendingRequest && (
        <>
          <SectionLabel>PERMINTAAN PEMBAYARAN</SectionLabel>
          <PaymentInstructionsCard
            request={pendingRequest}
            onSubmitProof={() => setShowProofSheet(true)}
          />
        </>
      )}

      {/* ── Paket Saat Ini ───────────────────────────────────────────── */}
      <SectionLabel>PAKET SAAT INI</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        <div style={{
          background: planCfg.bg, borderBottom: `2px solid ${planCfg.border}`,
          padding: '20px 20px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{ fontSize: 36, flexShrink: 0, paddingTop: 1 }}>💳</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: planCfg.color }}>
                {planCfg.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: statusCfg.color,
                background: statusCfg.bg, padding: '2px 8px', borderRadius: 20,
                border: `1px solid ${statusCfg.color}33`,
              }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: planCfg.color, fontWeight: 500 }}>
              {planCfg.price_label}
            </div>
          </div>
        </div>

        <div>
          {[
            {
              label: 'Tanggal Aktivasi',
              value: sub.activatedAt ? formatDate(sub.activatedAt) : '—',
            },
            {
              label: 'Masa Berlaku',
              value: sub.expiredAt ? formatDate(sub.expiredAt) : 'Tidak Terbatas',
            },
            {
              label: 'Jadwal Perpanjangan',
              value: sub.renewalAt ? formatDate(sub.renewalAt) : '—',
            },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Pilih Paket ──────────────────────────────────────────────── */}
      <SectionLabel>PILIH PAKET</SectionLabel>
      {pendingRequest && (
        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10,
          padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#92400e',
        }}>
          ⚠️ Anda memiliki permintaan pembayaran aktif. Selesaikan atau batalkan terlebih dahulu untuk mengajukan perubahan baru.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {PLAN_ORDER.map((p) => {
          const cfg       = PLAN_CONFIG[p];
          const isCurrent = p === plan;
          const planIdx   = PLAN_ORDER.indexOf(p);
          const curIdx    = PLAN_ORDER.indexOf(plan);
          const isUp      = planIdx > curIdx;
          const isEnterprise = p === 'Enterprise';
          const isDisabled = !!pendingRequest && !isCurrent;

          return (
            <div key={p} style={{
              background: isCurrent ? cfg.bg : 'var(--color-surface)',
              border: `2px solid ${isCurrent ? cfg.border : 'var(--color-border)'}`,
              borderRadius: 14, padding: '16px 18px',
              position: 'relative',
              opacity: isDisabled ? 0.6 : 1,
            }}>
              {cfg.badge && !isCurrent && (
                <div style={{
                  position: 'absolute', top: -1, right: 16,
                  background: cfg.color, color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px',
                  borderRadius: '0 0 8px 8px', letterSpacing: 0.5,
                }}>
                  {cfg.badge}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: cfg.color,
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        padding: '2px 7px', borderRadius: 20,
                      }}>
                        Paket Anda
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>
                    {cfg.description}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                    {cfg.price_label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                    {cfg.duration_label}
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => !isDisabled && handleSelectPlan(p)}
                    disabled={isDisabled}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: isEnterprise ? 'transparent' : isDisabled ? '#e2e8f0' : cfg.color,
                      color: isEnterprise ? cfg.color : isDisabled ? '#94a3b8' : '#fff',
                      border: isEnterprise ? `2px solid ${cfg.border}` : 'none',
                      fontSize: 12, fontWeight: 700,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', alignSelf: 'center', flexShrink: 0,
                    }}
                  >
                    {isEnterprise ? 'Hubungi Kami' : (isUp ? 'Upgrade' : 'Downgrade')}
                  </button>
                )}
              </div>
              {/* Enterprise: contact info */}
              {isEnterprise && !isCurrent && (
                <div style={{
                  marginTop: 10, padding: '8px 12px',
                  background: cfg.bg, borderRadius: 8, fontSize: 12, color: cfg.color,
                }}>
                  📧 Kirim email ke <strong>enterprise@ternakhub.id</strong> untuk penawaran kustomisasi.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Perbandingan Benefit ─────────────────────────────────────── */}
      <SectionLabel>PERBANDINGAN BENEFIT</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)', width: '40%' }}>
                  Fitur
                </th>
                {PLAN_ORDER.map((p) => {
                  const c = PLAN_CONFIG[p];
                  return (
                    <th key={p} style={{
                      padding: '12px 10px', textAlign: 'center', fontSize: 12,
                      fontWeight: 700, color: c.color, borderBottom: '1px solid var(--color-border)',
                    }}>
                      {c.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {BENEFIT_ROWS.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12.5, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
                    {row.label}
                  </td>
                  {PLAN_ORDER.map((p) => {
                    const key = p.toLowerCase() as 'free' | 'pro' | 'enterprise';
                    return (
                      <td key={p} style={{ padding: '10px 10px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                        <BenefitValue value={row[key]} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Riwayat Perubahan ────────────────────────────────────────── */}
      <SectionLabel>RIWAYAT PERUBAHAN</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        {history.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
            Belum ada riwayat perubahan paket.
          </div>
        ) : (
          history.map((entry, i, arr) => {
            const actionCfg = SUBSCRIPTION_ACTION_CONFIG[entry.action];
            const fromCfg   = entry.from_plan ? PLAN_CONFIG[entry.from_plan] : null;
            const toCfg     = PLAN_CONFIG[entry.to_plan];
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
              }}>
                <div style={{ fontSize: 22, flexShrink: 0, paddingTop: 1 }}>
                  {actionCfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: actionCfg.color }}>
                      {actionCfg.label}
                    </span>
                    {fromCfg ? (
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        {fromCfg.label} → {toCfg.label}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: toCfg.color, background: toCfg.bg,
                        padding: '1px 7px', borderRadius: 20,
                        border: `1px solid ${toCfg.border}`,
                      }}>
                        {toCfg.label}
                      </span>
                    )}
                  </div>
                  {entry.note && (
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>
                      {entry.note}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    {formatDate(entry.date)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* ── Plan Change Confirm Sheet ─────────────────────────────────── */}
      {confirmPlan && (
        <PlanChangeSheet
          targetPlan={confirmPlan}
          currentPlan={plan}
          onConfirm={handleConfirm}
          onClose={() => setConfirmPlan(null)}
        />
      )}

      {/* ── Submit Proof Sheet ────────────────────────────────────────── */}
      {showProofSheet && pendingRequest && (
        <SubmitProofSheet
          requestId={pendingRequest.id}
          onSubmit={() => setTick(t => t + 1)}
          onClose={() => setShowProofSheet(false)}
        />
      )}
    </div>
  );
}
