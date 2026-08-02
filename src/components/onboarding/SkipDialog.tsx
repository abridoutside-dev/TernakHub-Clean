// ─── Skip Dialog — ONB-001 ───────────────────────────────────────────────────
// Modal confirmation shown when the user taps "Lewati" during onboarding.
// Onboarding is optional — users can always restart from Settings.

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SkipDialog({ onConfirm, onCancel }: Props) {
  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skip-dialog-title"
      aria-describedby="skip-dialog-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        padding: '0 0 env(safe-area-inset-bottom, 0)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'onb-slide-up 0.22s ease',
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: 48, lineHeight: 1 }}>🤔</div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h2
            id="skip-dialog-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}
          >
            Lewati Panduan?
          </h2>
          <p
            id="skip-dialog-desc"
            style={{
              margin: '10px 0 0',
              fontSize: 14,
              color: 'var(--color-muted)',
              lineHeight: 1.6,
            }}
          >
            Tidak apa-apa! Anda dapat mengaktifkan kembali panduan ini kapan saja
            melalui <strong>Profil → Pengaturan Akun</strong>.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: '100%',
              height: 48,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Ya, Lewati Sekarang
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              width: '100%',
              height: 48,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Lanjutkan Panduan
          </button>
        </div>
      </div>

      <style>{`
        @keyframes onb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
