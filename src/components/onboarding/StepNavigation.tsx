// ─── Step Navigation — ONB-001 ───────────────────────────────────────────────
// Previous / Next / Finish buttons rendered at the bottom of each step.
// Skip is handled via onSkip callback → parent shows SkipDialog.

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  /** Label override for the forward button. Defaults to "Lanjut". */
  nextLabel?: string;
  /** Disables the Next button (e.g. while a required field is empty). */
  nextDisabled?: boolean;
}

export default function StepNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSkip,
  nextLabel,
  nextDisabled = false,
}: Props) {
  const isFirst  = currentStep === 1;
  const isLast   = currentStep === totalSteps;
  const forwardLabel = nextLabel ?? (isLast ? 'Ke Dashboard' : 'Lanjut');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      {/* ← Kembali */}
      {!isFirst ? (
        <button
          type="button"
          onClick={onPrev}
          style={{
            height: 44,
            padding: '0 18px',
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          aria-label="Langkah sebelumnya"
        >
          ← Kembali
        </button>
      ) : (
        /* Spacer so Next stays right-aligned on step 1 */
        <div style={{ flex: 1 }} />
      )}

      {/* Spacer */}
      {!isFirst && <div style={{ flex: 1 }} />}

      {/* Lewati (skip) — hidden on last step */}
      {!isLast && (
        <button
          type="button"
          onClick={onSkip}
          style={{
            height: 44,
            padding: '0 14px',
            background: 'none',
            border: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            textDecoration: 'underline',
            textDecorationColor: 'transparent',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'; }}
          aria-label="Lewati onboarding"
        >
          Lewati
        </button>
      )}

      {/* Lanjut / Ke Dashboard */}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          height: 44,
          padding: '0 22px',
          background: nextDisabled ? 'var(--color-border)' : 'var(--color-primary)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 14,
          fontWeight: 700,
          color: nextDisabled ? 'var(--color-muted)' : '#fff',
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          transition: 'background 0.15s, opacity 0.15s',
          letterSpacing: '0.01em',
        }}
        aria-label={forwardLabel}
      >
        {isLast ? '🚀 ' : ''}{forwardLabel}{!isLast ? ' →' : ''}
      </button>
    </div>
  );
}
