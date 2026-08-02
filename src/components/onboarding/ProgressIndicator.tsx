// ─── Progress Indicator — ONB-001 ────────────────────────────────────────────
// Displays current step progress as a row of dots + a label.
// Accessible: role="progressbar" with aria-valuenow/max.

interface Props {
  current: number; // 1-based
  total: number;
}

export default function ProgressIndicator({ current, total }: Props) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Langkah ${current} dari ${total}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '0 24px',
      }}
    >
      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isActive = step === current;
          const isDone   = step < current;
          return (
            <div
              key={step}
              aria-hidden="true"
              style={{
                width: isActive ? 24 : isDone ? 10 : 8,
                height: 8,
                borderRadius: 4,
                background: isActive
                  ? 'var(--color-primary)'
                  : isDone
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
                opacity: isDone ? 0.45 : 1,
                transition: 'width 0.25s ease, background 0.25s ease, opacity 0.25s ease',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Label */}
      <span style={{ fontSize: 11, color: 'var(--color-muted)', letterSpacing: 0.3 }}>
        {current} / {total}
      </span>
    </div>
  );
}
