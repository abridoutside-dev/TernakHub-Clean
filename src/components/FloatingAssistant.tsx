import { useState, useEffect } from 'react';

const SECTIONS = [
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: '📚',
    description: 'Akses panduan peternakan, referensi penyakit, nutrisi, dan tips budidaya.',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: '⚡',
    description: 'Jalankan tindakan cepat seperti catat bobot, jadwal vaksin, dan laporan harian.',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: '🤖',
    description: 'Tanya jawab seputar peternakan dengan asisten AI yang memahami konteks ternakmu.',
  },
];

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('ternakhub:open-assistant', handler);
    return () => window.removeEventListener('ternakhub:open-assistant', handler);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 200,
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: open ? 0 : '-100%',
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderRadius: open ? '20px 20px 0 0' : 0,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          zIndex: 201,
          transition: 'bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        aria-hidden={!open}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                TernakHub Assistant
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                Pilih fitur di bawah ini
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Tutup panel"
            style={{
              background: 'var(--color-bg)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Sections */}
        <div style={{ padding: '16px 16px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                background: 'var(--color-bg)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 14px',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: 'var(--color-primary-light)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {section.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                  {section.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {section.description}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    background: 'var(--color-border)',
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  Segera hadir
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka assistant"
        style={{
          position: 'fixed',
          bottom: 76,
          right: 16,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open ? 'var(--color-primary-dark)' : 'var(--color-primary)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(27,122,67,0.40)',
          zIndex: 202,
          transition: 'background 0.2s, transform 0.2s',
          transform: open ? 'scale(0.92)' : 'scale(1)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.046 21.17a.75.75 0 0 0 .927.928l4.003-1.392A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z"
            fill="white"
            opacity="0.9"
          />
          <circle cx="8.5" cy="12" r="1.25" fill="var(--color-primary)" />
          <circle cx="12" cy="12" r="1.25" fill="var(--color-primary)" />
          <circle cx="15.5" cy="12" r="1.25" fill="var(--color-primary)" />
        </svg>
      </button>
    </>
  );
}
