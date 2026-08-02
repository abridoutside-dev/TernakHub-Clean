// ─── VeterinaryPatientSection Component (VET-002F) ────────────────────────────
// Displays activity history (Riwayat Aktivitas) with status/type filters
// for a Veterinary Workspace.
// All data is received through props — no business logic inside this component.

import {
  ACTIVITY_STATUS_CONFIG,
  VET_SERVICE_CONFIG,
  formatRupiahVet,
  formatTanggalVet,
  type VetActivityRecord,
  type VetAccessDecision,
  type ActivityStatus,
  type VetServiceType,
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

function LockedSection({ title }: { title: string }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '28px 20px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 28 }}>🔒</span>
      <p style={{ margin: '8px 0 4px', fontWeight: 700, color: 'var(--color-text)' }}>Akses Terbatas</p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
        {title} hanya tersedia untuk anggota Workspace Veteriner ini.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VeterinaryPatientSectionProps {
  activities: VetActivityRecord[];
  filteredActivities: VetActivityRecord[];
  statusFilter: ActivityStatus | 'Semua';
  typeFilter: VetServiceType | 'Semua';
  onStatusFilterChange: (filter: ActivityStatus | 'Semua') => void;
  onTypeFilterChange: (filter: VetServiceType | 'Semua') => void;
  access: VetAccessDecision;
}

export default function VeterinaryPatientSection({
  activities,
  filteredActivities,
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  access,
}: VeterinaryPatientSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Riwayat Aktivitas"
        subtitle={`${activities.length} total · ${activities.filter((a) => a.status === 'Selesai').length} selesai`}
      />

      {access.canViewOperational ? (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {(['Semua', 'Selesai', 'Terjadwal', 'Dalam Proses', 'Dibatalkan'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusFilterChange(s)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 16,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === s
                    ? '1.5px solid #1e40af'
                    : '1.5px solid var(--color-border)',
                  background: statusFilter === s ? '#dbeafe' : 'var(--color-surface)',
                  color: statusFilter === s ? '#1e40af' : 'var(--color-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            {(['Semua', ...Object.keys(VET_SERVICE_CONFIG)] as const).map((t) => {
              const cfg = t !== 'Semua'
                ? VET_SERVICE_CONFIG[t as VetServiceType]
                : null;
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => onTypeFilterChange(t as VetServiceType | 'Semua')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active
                      ? `1.5px solid ${cfg?.color ?? '#1e40af'}`
                      : '1.5px solid var(--color-border)',
                    background: active ? (cfg?.bg ?? '#dbeafe') : 'var(--color-surface)',
                    color: active ? (cfg?.color ?? '#1e40af') : 'var(--color-muted)',
                  }}
                >
                  {cfg ? `${cfg.icon} ` : ''}{t}
                </button>
              );
            })}
          </div>

          {filteredActivities.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 28 }}>📭</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tidak ada aktivitas yang cocok dengan filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredActivities.map((act) => {
                const sc  = ACTIVITY_STATUS_CONFIG[act.status];
                const svc = VET_SERVICE_CONFIG[act.tipeLayanan];
                return (
                  <div key={act.id} style={{
                    background: 'var(--color-bg)',
                    border: `1.5px solid ${sc.border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                          {act.id}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                          {act.clientWorkspace}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: svc.color, background: svc.bg,
                          padding: '3px 7px', borderRadius: 10,
                        }}>
                          {svc.icon} {act.tipeLayanan}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: sc.color, background: sc.bg,
                          padding: '3px 7px', borderRadius: 10,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          {sc.icon} {act.status}
                        </span>
                      </div>
                    </div>

                    {/* Livestock */}
                    <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                      🐄 {act.ternakDeskripsi} · 📍 {act.lokasiKunjungan}
                    </p>

                    {/* Bottom row */}
                    <div style={{
                      display: 'flex', gap: 14, flexWrap: 'wrap',
                      fontSize: 11, color: 'var(--color-muted)', marginTop: 4,
                    }}>
                      <span>📅 {formatTanggalVet(act.tanggal)}</span>
                      <span>👨‍⚕️ {act.vetId}</span>
                      {access.canViewFinancial && (
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          💰 {formatRupiahVet(act.biaya)}
                        </span>
                      )}
                    </div>

                    {act.hasilRingkasan && act.status !== 'Terjadwal' && (
                      <p style={{
                        margin: '6px 0 0',
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}>
                        📝 {act.hasilRingkasan}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <LockedSection title="Riwayat aktivitas layanan" />
      )}
    </div>
  );
}
