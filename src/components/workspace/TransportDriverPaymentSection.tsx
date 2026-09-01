// ─── TransportDriverPaymentSection Component (WST-003F) ────────────────────────
// Displays driver payment records for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import type { TransportDriverPaymentDbRow } from '../../types/transport';

interface TransportDriverPaymentSectionProps {
  records: TransportDriverPaymentDbRow[];
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
  'Belum Dibayar': { bg: '#fef3c7', color: '#92400e' },
  Lunas: { bg: '#dcfce7', color: '#166534' },
  Dibatalkan: { bg: '#fee2e2', color: '#991b1b' },
};

export default function TransportDriverPaymentSection({
  records,
  canEdit,
  onAdd,
  onDelete,
}: TransportDriverPaymentSectionProps) {
  if (records.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Pembayaran Driver" subtitle="Gaji, uang jalan, insentif, dan lainnya" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada pembayaran driver tercatat.
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
        <SectionHeader title="Pembayaran Driver" subtitle={`${records.length} pembayaran`} />
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
            + Catat Pembayaran
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
                    {rec.jenis} · Periode {rec.periode}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                    {rec.tanggal} · Driver ID: {rec.driver_id} · {rec.catatan ?? '-'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>
                    Rp {rec.nominal.toLocaleString('id-ID')}
                  </p>
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
