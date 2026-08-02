// ─── TransportVehicleSection Component (WST-002) ──────────────────────────────
// Displays the Fleet (Armada Kendaraan) section for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import {
  type VehicleRecord,
  type TransportAccessDecision,
  VEHICLE_STATUS_CONFIG,
  TRANSPORT_SERVICE_TYPE_CONFIG,
} from '../../data/transportWorkspaceData';

// ─── Local helpers ────────────────────────────────────────────────────────────

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

interface TransportVehicleSectionProps {
  vehicles: VehicleRecord[];
  access: TransportAccessDecision;
}

export default function TransportVehicleSection({ vehicles, access }: TransportVehicleSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Armada Kendaraan"
        subtitle={`${vehicles.length} unit terdaftar`}
      />

      {/* Desktop: table-like grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 10,
      }}>
        {vehicles.map((v) => {
          const sc = VEHICLE_STATUS_CONFIG[v.status];
          return (
            <div key={v.id} style={{
              background: 'var(--color-bg)',
              border: `1.5px solid ${sc.border}`,
              borderRadius: 'var(--radius-md)',
              padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                    {v.id}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                    {v.jenisKendaraan} · {v.nomorPolisi}
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
                }}>
                  {sc.icon} {v.status}
                </span>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {v.jenisLayanan.map((jl) => {
                    const cfg = TRANSPORT_SERVICE_TYPE_CONFIG[jl];
                    return (
                      <span key={jl} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        {cfg.icon} {jl}
                      </span>
                    );
                  })}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                  <strong>Kapasitas:</strong>{' '}
                  {v.kapasitas !== '—'
                    ? v.kapasitas
                    : v.kapasitasKg
                      ? `${v.kapasitasKg.toLocaleString('id-ID')} kg`
                      : '—'}
                </p>
                {v.kapasitas !== '—' && v.kapasitasKg && (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                    ~{v.kapasitasKg.toLocaleString('id-ID')} kg · Tahun {v.tahunBeli}
                  </p>
                )}
                {v.kapasitas === '—' && (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                    Tahun {v.tahunBeli}
                  </p>
                )}
                {access.canViewOperational && (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: 11,
                    color: 'var(--color-muted)',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}>
                    {v.catatanOperasional}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
