// ─── TransportShipmentBatchSection Component (WST-003B) ────────────────────────
// Displays shipment batches for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import type { TransportShipmentBatchDbRow } from '../../types/transport';
import { TRANSPORT_BATCH_STATUS_CONFIG } from '../../types/transport';

interface TransportShipmentBatchSectionProps {
  batches: TransportShipmentBatchDbRow[];
  canEdit: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onViewBatch: (batchId: string) => void;
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

export default function TransportShipmentBatchSection({
  batches,
  canEdit,
  onUpdateStatus,
  onViewBatch,
}: TransportShipmentBatchSectionProps) {
  if (batches.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Batch Pengiriman" subtitle="Gabungkan beberapa pengiriman dalam satu armada" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada batch pengiriman.
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
      <SectionHeader title="Batch Pengiriman" subtitle={`${batches.length} batch aktif`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {batches.map((batch) => {
          const sc = TRANSPORT_BATCH_STATUS_CONFIG[batch.status as keyof typeof TRANSPORT_BATCH_STATUS_CONFIG] ?? TRANSPORT_BATCH_STATUS_CONFIG.Draft;
          return (
            <div key={batch.id} style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 14,
              cursor: 'pointer',
            }} onClick={() => onViewBatch(batch.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                    {batch.rute ?? 'Batch tanpa rute'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                    {batch.tanggal ?? '-'} {batch.jam ? `· ${batch.jam}` : ''} · Kapasitas: {batch.kapasitas_kg ?? '-'} kg
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
                }}>
                  {sc.icon} {sc.label}
                </span>
              </div>
              {batch.catatan && (
                <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                  {batch.catatan}
                </p>
              )}
              {canEdit && batch.status === 'Draft' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateStatus(batch.id, 'Menunggu')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: '#1e40af',
                      color: '#fff',
                    }}
                  >
                    Jadikan Menunggu
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
