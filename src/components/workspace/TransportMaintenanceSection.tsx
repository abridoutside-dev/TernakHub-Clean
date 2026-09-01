// ─── TransportMaintenanceSection Component (WST-003D) ──────────────────────────
// Displays vehicle maintenance records for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import type { TransportVehicleMaintenanceDbRow } from '../../types/transport';

interface TransportMaintenanceSectionProps {
  records: TransportVehicleMaintenanceDbRow[];
  canEdit: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

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

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Terjadwal: { bg: '#fef3c7', color: '#92400e' },
  Sedang: { bg: '#dbeafe', color: '#1e40af' },
  Selesai: { bg: '#dcfce7', color: '#166534' },
  Dibatalkan: { bg: '#fee2e2', color: '#991b1b' },
};

export default function TransportMaintenanceSection({
  records,
  canEdit,
  onAdd,
  onDelete,
}: TransportMaintenanceSectionProps) {
  if (records.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Maintenance Kendaraan" subtitle="Riwayat service dan perbaikan" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada catatan maintenance.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      padding: 16,
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionHeader title="Maintenance Kendaraan" subtitle={`${records.length} catatan`} />
        {canEdit && (
          <button
            onClick={onAdd}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
            }}
          >
            + Tambah Service
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {records.map((rec) => {
          const sc = STATUS_COLOR[rec.status] ?? { bg: '#f3f4f6', color: '#374151' };
          return (
            <div key={rec.id} style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                    {rec.jenis_service}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                    {rec.tanggal} · {rec.vendor ?? '-'} · {rec.odometer_km ? `${rec.odometer_km.toLocaleString('id-ID')} km` : '-'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>
                    Rp {rec.biaya.toLocaleString('id-ID')}
                  </p>
                  {rec.spare_part && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                      Spare Part: {rec.spare_part}
                    </p>
                  )}
                  {rec.catatan && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                      {rec.catatan}
                    </p>
                  )}
                </div>
                <span style={{
                  background: sc.bg,
                  color: sc.color,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 12,
                  whiteSpace: 'nowrap',
                }}>
                  {rec.status}
                </span>
              </div>
              {canEdit && (
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <button
                    onClick={() => onDelete(rec.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#991b1b',
                    }}
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
