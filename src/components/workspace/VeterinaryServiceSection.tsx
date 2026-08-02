// ─── VeterinaryServiceSection Component (VET-002D) ────────────────────────────
// Displays the service catalog for a Veterinary Workspace.
// All data is received through props — no business logic inside this component.

import {
  VET_SERVICE_CONFIG,
  formatRupiahVet,
  type VetServiceRecord,
} from '../../data/veterinaryWorkspaceData';

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

// ─── Component ────────────────────────────────────────────────────────────────

interface VeterinaryServiceSectionProps {
  services: VetServiceRecord[];
}

export default function VeterinaryServiceSection({ services }: VeterinaryServiceSectionProps) {
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
        subtitle={`${services.filter((s) => s.tersedia).length} dari ${services.length} layanan aktif`}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 10,
      }}>
        {services.map((svc) => {
          const cfg = VET_SERVICE_CONFIG[svc.tipeLayanan];
          return (
            <div key={svc.id} style={{
              background: 'var(--color-bg)',
              border: `1.5px solid ${svc.tersedia ? 'var(--color-border)' : '#e5e7eb'}`,
              borderRadius: 'var(--radius-md)',
              padding: 14,
              opacity: svc.tersedia ? 1 : 0.6,
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
                      {cfg.icon} {svc.tipeLayanan}
                    </span>
                    {!svc.tersedia && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: 8,
                      }}>
                        Tidak Tersedia
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                    {svc.namaLayanan}
                  </p>
                </div>
                {svc.hargaMulaiDari !== null && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)' }}>Mulai dari</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatRupiahVet(svc.hargaMulaiDari)}
                    </p>
                  </div>
                )}
              </div>

              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                {svc.deskripsi}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-muted)' }}>
                <span>⏱ {svc.estimasiDurasi}</span>
                <span>🐄 {svc.targetTernak.join(', ')}</span>
              </div>

              {svc.catatan && (
                <p style={{
                  margin: '6px 0 0',
                  fontSize: 11,
                  color: 'var(--color-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 6,
                }}>
                  ℹ️ {svc.catatan}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
