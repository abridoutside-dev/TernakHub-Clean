// ─── AuthErrorMessage ─────────────────────────────────────────────────────────
// AUTH-003 — Reusable error banner for authentication pages.
// Renders nothing when `message` is falsy.

interface AuthErrorMessageProps {
  message: string | null | undefined;
}

export default function AuthErrorMessage({ message }: AuthErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-sm)',
        background: '#fdf2f2',
        border: '1.5px solid #f5c6c6',
        marginBottom: 20,
      }}
    >
      {/* Error icon */}
      <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-danger)',
          fontWeight: 500,
        }}
      >
        {message}
      </p>
    </div>
  );
}
