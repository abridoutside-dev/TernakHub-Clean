// ─── AuthLoadingSpinner ───────────────────────────────────────────────────────
// AUTH-003 — Inline loading indicator for authentication pages.
// Used both as a full-card overlay (when `overlay` is true) and as an inline
// element inside a submit button.

interface AuthLoadingSpinnerProps {
  /** When true, renders a translucent overlay over the entire card. */
  overlay?: boolean;
  /** Size in pixels. Default: 28. */
  size?: number;
  /** Accessible label. */
  label?: string;
}

export default function AuthLoadingSpinner({
  overlay = false,
  size = 28,
  label = 'Memuat…',
}: AuthLoadingSpinnerProps) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `3px solid var(--color-primary-light)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'auth-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );

  if (!overlay) return spinner;

  return (
    <>
      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        aria-busy="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.82)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 10,
        }}
      >
        {spinner}
        <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>
          {label}
        </span>
      </div>
    </>
  );
}
