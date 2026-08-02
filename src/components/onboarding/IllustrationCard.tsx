// ─── Illustration Card — ONB-001 ─────────────────────────────────────────────
// Wrapper for step illustrations (SVG or emoji-based art).
// Renders a centred, rounded card with a soft tinted background.

interface Props {
  children: React.ReactNode;
  /** Background tint. Defaults to primary-light. */
  bg?: string;
  /** Explicit height. Defaults to 200px on mobile, 220px on desktop. */
  height?: number;
}

export default function IllustrationCard({ children, bg, height = 200 }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height,
        background: bg ?? 'var(--color-primary-light)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}
