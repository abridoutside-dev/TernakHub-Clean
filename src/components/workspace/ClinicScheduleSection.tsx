// ─── ClinicScheduleSection Component (CLN-002E) ───────────────────────────────
// Displays clinic facilities and operational schedule info for a Klinik Hewan
// Workspace. All data is received through props — no business logic inside.

import { type ClinicWorkspaceMeta } from '../../data/clinicWorkspaceData';

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

interface ClinicScheduleSectionProps {
  meta: ClinicWorkspaceMeta;
}

export default function ClinicScheduleSection({ meta }: ClinicScheduleSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Informasi Klinik"
        subtitle="Lokasi, jam operasional & fasilitas"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Location & Contact card */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
            📍 Lokasi & Kontak
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-muted)' }}>
            <span>🏠 {meta.alamatLengkap}</span>
            <span>📞 {meta.kontakPublik}</span>
            <span>🚨 Darurat: {meta.kontakDarurat}</span>
            <span>📋 Nomor Izin: {meta.nomorIzin}</span>
          </div>
        </div>

        {/* Operating hours card */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
            🕐 Jam Operasional
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            {meta.jamOperasional}
          </p>
        </div>

        {/* Facilities card */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
            🏗️ Fasilitas Klinik
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {meta.fasilitas.map((f) => (
              <span key={f} style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#065f46',
                background: '#d1fae5',
                padding: '3px 9px',
                borderRadius: 12,
              }}>
                ✅ {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
