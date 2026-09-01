// ─── TransportScheduleSection Component (WST-003C) ─────────────────────────────
// Displays scheduled deliveries (Dikonfirmasi status) for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import type { TransportDeliveryDbRow } from '../../types/transport';

interface TransportScheduleSectionProps {
  scheduledDeliveries: TransportDeliveryDbRow[];
  canEdit: boolean;
  onStartTrip: (id: string) => void;
  onViewDelivery: (id: string) => void;
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

export default function TransportScheduleSection({
  scheduledDeliveries,
  canEdit,
  onStartTrip,
  onViewDelivery,
}: TransportScheduleSectionProps) {
  if (scheduledDeliveries.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Pengiriman Terjadwal" subtitle="Dikonfirmasi dan siap dijalankan" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Tidak ada pengiriman terjadwal.
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
      <SectionHeader title="Pengiriman Terjadwal" subtitle={`${scheduledDeliveries.length} terjadwal`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scheduledDeliveries.map((dlv) => (
          <div key={dlv.id} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            cursor: 'pointer',
          }} onClick={() => onViewDelivery(dlv.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                  {dlv.id}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                  {dlv.origin} → {dlv.destination} · {dlv.scheduled_date ?? '-'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                  {dlv.vehicle_type ?? '-'} · {dlv.driver_name ?? '-'} · {dlv.notes ?? '-'}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStartTrip(dlv.id); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: '#0e7490',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mulai Perjalanan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
