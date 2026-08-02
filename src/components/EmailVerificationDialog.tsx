// ─── Email Verification Dialog ────────────────────────────────────────────────
// AUTH-007 — Friendly modal shown when an unverified user attempts a restricted
// Marketplace action (create listing, start negotiation/transaction).
//
// Rules:
//  - Pure presentational. No Supabase calls. No routing logic.
//  - Caller decides what "verify now" and "dismiss" mean.
//  - Rendered as a fixed overlay; sits above any page content.

import type { CSSProperties } from 'react';

interface EmailVerificationDialogProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Called when user clicks "Verifikasi Sekarang" (navigate to /verify-email). */
  onVerifyNow: () => void;
  /** Called when user clicks "Nanti Saja" or taps the backdrop. */
  onDismiss: () => void;
}

export default function EmailVerificationDialog({
  open,
  onVerifyNow,
  onDismiss,
}: EmailVerificationDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evd-title"
      style={s.overlay}
      onClick={(e) => {
        // Dismiss when clicking the backdrop (not the card itself).
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div style={s.card}>
        {/* Icon */}
        <div style={s.iconWrap}>
          <span style={s.icon} aria-hidden="true">✉️</span>
        </div>

        {/* Heading */}
        <h2 id="evd-title" style={s.title}>
          Verifikasi Email Diperlukan
        </h2>

        {/* Body */}
        <p style={s.body}>
          Verifikasi email kamu terlebih dahulu untuk bisa membuat listing
          atau memulai transaksi di Marketplace.
        </p>
        <p style={s.hint}>
          Cek kotak masuk atau folder spam untuk tautan verifikasi dari TernakHub.
        </p>

        {/* Actions */}
        <button
          type="button"
          onClick={onVerifyNow}
          style={s.primaryBtn}
        >
          Verifikasi Sekarang
        </button>

        <button
          type="button"
          onClick={onDismiss}
          style={s.secondaryBtn}
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(22, 36, 28, 0.55)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 9000,
    // Slide-up feel on mobile
    padding: '0 0 16px 0',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--color-surface)',
    borderRadius: '20px 20px 12px 12px',
    padding: '28px 24px 24px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 0,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 30,
    lineHeight: 1,
  },
  title: {
    margin: '0 0 10px',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1.3,
  },
  body: {
    margin: '0 0 8px',
    fontSize: 14,
    color: 'var(--color-text)',
    lineHeight: 1.6,
  },
  hint: {
    margin: '0 0 24px',
    fontSize: 12.5,
    color: 'var(--color-muted)',
    lineHeight: 1.5,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 10,
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-muted)',
    border: '1.5px solid var(--color-border)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
