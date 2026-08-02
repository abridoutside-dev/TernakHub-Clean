// ─── VeterinaryScheduleSection Component (VET-002E) ───────────────────────────
// Displays service areas (Wilayah Layanan) for a Veterinary Workspace.
// All data is received through props — no business logic inside this component.

import {
  VET_SERVICE_CONFIG,
  type VetServiceArea,
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

interface VeterinaryScheduleSectionProps {
  areas: VetServiceArea[];
}

export default function VeterinaryScheduleSection({ areas }: VeterinaryScheduleSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Wilayah Layanan"
        subtitle={`${areas.length} wilayah terdaftar`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {areas.map((area) => (
          <div key={area.id} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                  🗺️ {area.namaWilayah}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                  {area.provinsi} · 📏 {area.jarakMaksKunjungan}
                </p>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#1e40af',
                background: '#dbeafe',
                padding: '3px 8px',
                borderRadius: 10,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                💰 {area.biayaKunjungan}
              </span>
            </div>

            {/* Service type tags */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {area.layananTersedia.map((lt) => {
                const cfg = VET_SERVICE_CONFIG[lt];
                return (
                  <span key={lt} style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: cfg.color,
                    background: cfg.bg,
                    padding: '2px 7px',
                    borderRadius: 10,
                  }}>
                    {cfg.icon} {lt}
                  </span>
                );
              })}
            </div>

            {/* Kab/kota tags */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {area.kabupatenKota.map((kk) => (
                <span key={kk} style={{
                  fontSize: 11,
                  color: 'var(--color-muted)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '2px 7px',
                  borderRadius: 8,
                }}>
                  {kk}
                </span>
              ))}
            </div>

            <p style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--color-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}>
              {area.keterangan}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
