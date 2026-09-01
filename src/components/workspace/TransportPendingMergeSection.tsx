// ─── TransportPendingMergeSection Component (WST-003A) ─────────────────────────
// Displays deliveries waiting to be merged into a shipment batch.
// All data received through props — no data loading, no state, no business logic.

import type { TransportDeliveryDbRow } from '../../types/transport';

interface TransportPendingMergeSectionProps {
  pendingDeliveries: TransportDeliveryDbRow[];
  onCreateBatch: () => void;
  onAddToBatch: (deliveryId: string) => void;
  onViewDelivery: (deliveryId: string) => void;
  canEdit: boolean;
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

export default function TransportPendingMergeSection({
  pendingDeliveries,
  onCreateBatch,
  onAddToBatch,
  onViewDelivery,
  canEdit,
}: TransportPendingMergeSectionProps) {
  if (pendingDeliveries.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Menunggu Penggabungan" subtitle="Pengiriman yang belum masuk batch" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Tidak ada pengiriman yang menunggu penggabungan.
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
      <SectionHeader title="Menunggu Penggabungan" subtitle={`${pendingDeliveries.length} pengiriman menunggu`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pendingDeliveries.map((dlv) => (
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
                  Muatan: {dlv.notes ?? '-'} · Fee: {dlv.fee ? `Rp ${dlv.fee.toLocaleString('id-ID')}` : '-'}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToBatch(dlv.id); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    flexShrink: 0,
                  }}
                >
                  Gabungkan ke Batch
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {canEdit && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={onCreateBatch}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
            }}
          >
            + Buat Batch Baru
          </button>
        </div>
      )}
    </div>
  );
}
