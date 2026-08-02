// ─── ClinicServiceSection Component (CLN-002D) ────────────────────────────────
// Displays the service catalog for a Klinik Hewan Workspace.
// All data is received through props — no business logic inside this component.

import { type LayananKlinikHewanRecord } from '../../data/layananKlinikHewanData';

// ─── Local helpers (presentational only) ─────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>{subtitle}</p>
      )}
    </div>
  );
}

const KATEGORI_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  'Rawat Jalan':     { icon: '🏥', color: '#1e40af', bg: '#dbeafe' },
  'Rawat Inap':      { icon: '🛏️', color: '#6d28d9', bg: '#ede9fe' },
  'Layanan Darurat': { icon: '🚨', color: '#991b1b', bg: '#fee2e2' },
  'Laboratorium':    { icon: '🔬', color: '#065f46', bg: '#d1fae5' },
  'Bedah':           { icon: '🩺', color: '#9a3412', bg: '#ffedd5' },
};

function getKategoriStyle(kategori: string) {
  return KATEGORI_STYLE[kategori] ?? { icon: '🏥', color: '#374151', bg: '#f3f4f6' };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ClinicServiceSectionProps {
  services: LayananKlinikHewanRecord[];
}

export default function ClinicServiceSection({ services }: ClinicServiceSectionProps) {
  const aktif = services.filter((s) => s.status === 'Aktif').length;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Layanan Tersedia"
        subtitle={`${aktif} dari ${services.length} layanan aktif`}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 10,
      }}>
        {services.map((svc) => {
          const isAvailable = svc.status === 'Aktif';
          const cfg = getKategoriStyle(svc.kategori);
          return (
            <div key={svc.uuid} style={{
              background: 'var(--color-bg)',
              border: `1.5px solid ${isAvailable ? 'var(--color-border)' : '#e5e7eb'}`,
              borderRadius: 'var(--radius-md)',
              padding: 14,
              opacity: isAvailable ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: cfg.color,
                      background: cfg.bg,
                      padding: '2px 7px',
                      borderRadius: 10,
                    }}>
                      {cfg.icon} {svc.kategori}
                    </span>
                    {!isAvailable && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: 8,
                      }}>
                        {svc.status}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                    {svc.thumbnail} {svc.nama}
                  </p>
                </div>
              </div>

              {svc.deskripsi && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {svc.deskripsi}
                </p>
              )}

              {/* Facilities */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                {svc.fasilitas.map((f) => (
                  <span key={f} style={{
                    fontSize: 10,
                    color: 'var(--color-muted)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 6px',
                    borderRadius: 8,
                  }}>
                    {f}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-muted)' }}>
                <span>🐄 {svc.hewanYangDitangani.join(', ')}</span>
                {svc.jamOperasional && <span>🕐 {svc.jamOperasional}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
