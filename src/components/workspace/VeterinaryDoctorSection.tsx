// ─── VeterinaryDoctorSection Component (VET-002C) ─────────────────────────────
// Displays the list of veterinarians for a Veterinary Workspace.
// All data is received through props — no business logic inside this component.

import {
  VET_STATUS_CONFIG,
  VET_SERVICE_CONFIG,
  type VeterinarianRecord,
  type VetAccessDecision,
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

interface VeterinaryDoctorSectionProps {
  vets: VeterinarianRecord[];
  access: VetAccessDecision;
}

export default function VeterinaryDoctorSection({ vets, access }: VeterinaryDoctorSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Daftar Dokter Hewan"
        subtitle={`${vets.length} terdaftar · ${vets.filter((v) => v.status === 'Aktif').length} aktif`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {vets.map((vet) => {
          const sc = VET_STATUS_CONFIG[vet.status];
          return (
            <div key={vet.id} style={{
              background: 'var(--color-bg)',
              border: `1.5px solid ${sc.border}`,
              borderRadius: 'var(--radius-md)',
              padding: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 52,
                height: 52,
                background: 'var(--color-surface)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                flexShrink: 0,
                border: '1.5px solid var(--color-border)',
              }}>
                {vet.foto}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
                      {vet.gelar} {vet.nama}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                      {vet.spesialisasi}
                    </p>
                  </div>
                  <span style={{
                    background: sc.bg,
                    color: sc.color,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}>
                    {sc.icon} {vet.status}
                  </span>
                </div>

                {/* License + experience */}
                <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                  <span>🪪 {vet.nomorSIPP}</span>
                  <span>🎓 {vet.pendidikan}</span>
                  <span>⏱ {vet.pengalamanTahun} tahun pengalaman</span>
                </div>

                {/* Services */}
                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {vet.layanan.map((svc) => {
                    const cfg = VET_SERVICE_CONFIG[svc];
                    return (
                      <span key={svc} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        {cfg.icon} {svc}
                      </span>
                    );
                  })}
                </div>

                {/* Operational details — member only */}
                {access.canViewOperational && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                    <span>📞 {vet.nomorHP}</span>
                    {vet.catatanInternal && (
                      <span style={{ fontStyle: 'italic' }}>📝 {vet.catatanInternal}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
