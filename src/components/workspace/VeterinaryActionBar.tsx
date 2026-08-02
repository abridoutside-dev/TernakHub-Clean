// ─── VeterinaryActionBar Component (VET-002G) ─────────────────────────────────
// Displays management action buttons (Aksi Manajemen) for a Veterinary Workspace.
// All data is received through props — no business logic inside this component.

import { type VetAccessDecision } from '../../data/veterinaryWorkspaceData';

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

function DisabledButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button
      disabled
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text)',
        cursor: 'not-allowed',
        opacity: 0.45,
        flex: '1 1 140px',
        justifyContent: 'center',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VeterinaryActionBarProps {
  access: VetAccessDecision;
}

export default function VeterinaryActionBar({ access }: VeterinaryActionBarProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Aksi Manajemen"
        subtitle="Fitur-fitur di bawah dalam tahap pengembangan"
      />

      {access.role !== 'public' ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DisabledButton icon="👨‍⚕️" label="Tambah Dokter Hewan" />
            <DisabledButton icon="📅"   label="Jadwalkan Kunjungan" />
            <DisabledButton icon="📁"   label="Buat Rekam Medis" />
            <DisabledButton icon="📋"   label="Terbitkan Sertifikat" />
            <DisabledButton icon="💊"   label="Resepkan Obat" />
          </div>
          <p style={{
            margin: '12px 0 0',
            fontSize: 11,
            color: 'var(--color-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Rekam medis, resep, telemedicine, dan penjadwalan akan tersedia pada rilis berikutnya.
          </p>
        </>
      ) : (
        <div style={{
          padding: '14px 16px',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: 'var(--color-muted)',
          textAlign: 'center',
        }}>
          🔒 Aksi manajemen hanya tersedia untuk anggota Workspace Veteriner.
        </div>
      )}
    </div>
  );
}
