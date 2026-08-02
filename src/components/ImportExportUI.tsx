import { useEffect } from 'react';
import type { ReactNode } from 'react';

// ─── Shared Import/Export UI primitives (SO-005 — Master Obat) ───────────────
// Dialog / progress indicator / snackbar, styled identically to the existing
// BottomSheetShell / CardMenuDropdown conventions used across the app. Scoped
// for the Master Obat Import & Export feature.

// ─── Dialog ─────────────────────────────────────────────────────────────────

export function ImportExportDialog({ title, onClose, children }: {
  title: string; onClose: () => void; children: ReactNode;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 501, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: 'calc(100% - 48px)', maxWidth: 380,
        maxHeight: '82vh', overflowY: 'auto', padding: '20px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{title}</span>
          <button type="button" onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', padding: 2, lineHeight: 1 }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
      {children}
    </div>
  );
}

export function DialogButton({ label, onClick, variant = 'secondary', disabled }: {
  label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean;
}) {
  const styles = {
    primary:   { border: 'none', background: 'var(--color-primary)', color: '#fff' },
    secondary: { border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)' },
    danger:    { border: 'none', background: 'var(--color-danger)', color: '#fff' },
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)',
        fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, ...styles,
      }}
    >
      {label}
    </button>
  );
}

// ─── Radio-style option card (used for Merge / Replace choice) ───────────────

export function ImportModeOption({ label, description, icon, selected, onClick, danger }: {
  label: string; description: string; icon: string; selected: boolean; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left',
        padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: selected ? `1.5px solid ${danger ? 'var(--color-danger)' : 'var(--color-primary)'}` : '1.5px solid var(--color-border)',
        background: selected ? (danger ? '#ffebee' : 'var(--color-primary-light, #e8f5ee)') : 'var(--color-surface)',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: danger ? 'var(--color-danger)' : 'var(--color-text)', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </button>
  );
}

// ─── Progress overlay ─────────────────────────────────────────────────────────

export function ProgressOverlay({ label }: { label: string }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 601, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '28px 26px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 200,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)',
          animation: 'io-spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', textAlign: 'center' }}>{label}</span>
      </div>
      <style>{'@keyframes io-spin { to { transform: rotate(360deg); } }'}</style>
    </>
  );
}

// ─── Snackbar ─────────────────────────────────────────────────────────────────

export type SnackbarTone = 'success' | 'error';

export function Snackbar({ message, tone, onClose, autoHideMs = 4000 }: {
  message: string; tone: SnackbarTone; onClose: () => void; autoHideMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [onClose, autoHideMs]);

  const cfg = tone === 'success'
    ? { icon: '✅', bg: '#1b7a43' }
    : { icon: '⚠️', bg: 'var(--color-danger)' };

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 88, transform: 'translateX(-50%)',
      zIndex: 700, maxWidth: 'calc(100% - 32px)', width: 420,
      background: cfg.bg, color: '#fff', borderRadius: 'var(--radius-md)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.25)', padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, flex: 1, whiteSpace: 'pre-line' }}>{message}</span>
      <button type="button" onClick={onClose}
        style={{ border: 'none', background: 'none', color: '#fff', opacity: 0.85, fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        ✕
      </button>
    </div>
  );
}
