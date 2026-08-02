// ─── VeterinarySummary Component (VET-002B) ───────────────────────────────────
// Displays the Statistik Layanan summary cards for a Veterinary Workspace.
// All data is received through props — no data imports inside this component.

import { type VetWorkspaceSummary } from '../../data/veterinaryWorkspaceData';

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

function StatCard({
  icon, value, label, sub,
}: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 80,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 10px 10px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{sub}</span>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VeterinarySummaryProps {
  summary: VetWorkspaceSummary;
}

export default function VeterinarySummary({ summary }: VeterinarySummaryProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader title="Statistik Layanan" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatCard icon="👨‍⚕️" value={summary.totalDokterHewan} label="Dokter Hewan" sub={`${summary.dokterAktif} aktif`} />
        <StatCard icon="🏥" value={summary.totalKlinik} label="Klinik" />
        <StatCard icon="🐄" value={summary.pasienAktif} label="Pasien Aktif" />
        <StatCard icon="🏡" value={summary.kunjunganKandang} label="Kunjungan Kandang" sub="selesai" />
        <StatCard icon="📋" value={summary.sertifikatDiterbitkan} label="Sertifikat" sub="diterbitkan" />
      </div>
    </div>
  );
}
