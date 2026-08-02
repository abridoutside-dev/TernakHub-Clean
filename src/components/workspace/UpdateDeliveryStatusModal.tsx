// ─── UpdateDeliveryStatusModal (WST-002) ──────────────────────────────────────
// Form modal for updating a delivery's status in a Transport Workspace.
// No registry imports — the parent provides onSave which calls updateDeliveryStatus().

import { useState } from 'react';
import {
  type DeliveryRecord,
  type DeliveryStatus,
  DELIVERY_STATUS_CONFIG,
} from '../../data/transportWorkspaceData';

// ─── Shared modal primitives ──────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#374151',
};

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.5)',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UPDATABLE_STATUSES: DeliveryStatus[] = [
  'Menunggu',
  'Dikonfirmasi',
  'Pickup Ready',
  'Dalam Perjalanan',
  'Tiba',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpdateDeliveryStatusModalProps {
  deliveries: DeliveryRecord[];
  onSave: (deliveryId: string, newStatus: DeliveryStatus) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpdateDeliveryStatusModal({ deliveries, onSave, onClose }: UpdateDeliveryStatusModalProps) {
  const nonCompleted = deliveries.filter(d => d.status !== 'Selesai' && d.status !== 'Dibatalkan');
  const [deliveryId, setDeliveryId] = useState(nonCompleted[0]?.id ?? '');
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('Dikonfirmasi');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!deliveryId) { setError('Pilih pengiriman.'); return; }
    onSave(deliveryId, newStatus);
    onClose();
  }

  if (nonCompleted.length === 0) {
    return (
      <ModalOverlay>
        <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🔄 Perbarui Status</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Tidak ada pengiriman aktif yang dapat diperbarui.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Tutup
          </button>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🔄 Perbarui Status Pengiriman</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pengiriman
          <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)} style={fieldStyle}>
            {nonCompleted.map(d => (
              <option key={d.id} value={d.id}>{d.id} · {d.customerName} · {d.status}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Status Baru
          <select value={newStatus} onChange={e => setNewStatus(e.target.value as DeliveryStatus)} style={fieldStyle}>
            {UPDATABLE_STATUSES.map(s => (
              <option key={s} value={s}>{DELIVERY_STATUS_CONFIG[s].icon} {s}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Batal
        </button>
        <button onClick={handleSubmit} style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Simpan
        </button>
      </div>
    </ModalOverlay>
  );
}
