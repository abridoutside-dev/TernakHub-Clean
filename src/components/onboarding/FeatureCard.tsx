// ─── Feature Card — ONB-001 ──────────────────────────────────────────────────
// Displays a platform feature or quick action with icon, title, and description.

interface Props {
  icon: string;
  title: string;
  description: string;
  /** Highlight the card (e.g. for selected workspace type). */
  selected?: boolean;
  onClick?: () => void;
  /** If true renders as a static display card (no hover/click). */
  static?: boolean;
}

export default function FeatureCard({
  icon,
  title,
  description,
  selected = false,
  onClick,
  static: isStatic = false,
}: Props) {
  const isInteractive = !isStatic && !!onClick;

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }
          : undefined
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '14px 16px',
        background: selected
          ? 'var(--color-primary-light)'
          : 'var(--color-surface)',
        border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        ...(isInteractive
          ? {
              ':hover': {
                boxShadow: 'var(--shadow-sm)',
                borderColor: 'var(--color-primary)',
              },
            }
          : {}),
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: selected ? 'var(--color-primary)' : 'var(--color-text)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--color-muted)',
          lineHeight: 1.4,
        }}
      >
        {description}
      </span>
    </div>
  );
}
