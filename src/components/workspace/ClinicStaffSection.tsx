// ─── ClinicStaffSection Component (CLN-002C) ──────────────────────────────────
// Displays the clinic staff list for a Klinik Hewan Workspace.
// All data is received through props — no business logic inside this component.

import {
  STAFF_STATUS_CONFIG,
  STAFF_ROLE_CONFIG,
  type ClinicStaffRecord,
  type ClinicAccessDecision,
} from '../../data/clinicWorkspaceData';

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

interface ClinicStaffSectionProps {
  staff: ClinicStaffRecord[];
  access: ClinicAccessDecision;
}

export default function ClinicStaffSection({ staff, access }: ClinicStaffSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Tim Klinik"
        subtitle={`${staff.length} staf terdaftar · ${staff.filter((s) => s.status === 'Aktif').length} aktif`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {staff.map((member) => {
          const sc = STAFF_STATUS_CONFIG[member.status];
          const rc = STAFF_ROLE_CONFIG[member.peran];
          return (
            <div key={member.id} style={{
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
                {member.foto}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
                      {member.gelar ? `${member.gelar} ` : ''}{member.nama}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                      {member.spesialisasi}
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
                    {sc.icon} {member.status}
                  </span>
                </div>

                {/* Role + credentials */}
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: rc.color,
                    background: rc.bg,
                    padding: '2px 7px',
                    borderRadius: 10,
                  }}>
                    {rc.icon} {member.peran}
                  </span>
                </div>

                <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                  {member.nomorSIPP && <span>🪪 {member.nomorSIPP}</span>}
                  <span>🎓 {member.pendidikan}</span>
                  <span>⏱ {member.pengalamanTahun} tahun pengalaman</span>
                </div>

                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>
                  📅 {member.jadwalPiket}
                </div>

                {/* Operational details — member only */}
                {access.canViewOperational && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                    {member.nomorHP && <span>📞 {member.nomorHP}</span>}
                    {member.catatanInternal && (
                      <span style={{ fontStyle: 'italic' }}>📝 {member.catatanInternal}</span>
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
