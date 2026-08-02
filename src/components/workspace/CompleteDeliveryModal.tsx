// ─── CompleteDeliveryModal (WST-002) ──────────────────────────────────────────
// Form modal for completing a delivery in a Transport Workspace.
// No registry imports — the parent provides onSave which calls completeDelivery().

import { useState } from 'react';
import {
  type DeliveryRecord,
  type DeliveryStatus,
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

const IN_PROGRESS_STATUSES: DeliveryStatus[] = ['Dikonfirmasi', 'Pickup Ready', 'Dalam Perjalanan', 'Tiba'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompleteDeliveryModalProps {
  deliveries: DeliveryRecord[];
  onSave: (deliveryId: string, tanggalSelesai: string) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompleteDeliveryModal({ deliveries, onSave, onClose }: CompleteDeliveryModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const inProgress = deliveries.filter(d => IN_PROGRESS_STATUSES.includes(d.status));
  const [deliveryId, setDeliveryId] = useState(inProgress[0]?.id ?? '');
  const [tanggalSelesai, setTanggalSelesai] = useState(today);
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!deliveryId) { setError('Pilih pengiriman.'); return; }
    if (!tanggalSelesai) { setError('Tanggal selesai wajib diisi.'); return; }
    onSave(deliveryId, tanggalSelesai);
    onClose();
  }

  if (inProgress.length === 0) {
    return (
      <ModalOverlay>
        <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>✅ Selesaikan Pengiriman</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Tidak ada pengiriman dalam proses yang dapat diselesaikan.</p>
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
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>✅ Selesaikan Pengiriman</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pengiriman
          <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)} style={fieldStyle}>
            {inProgress.map(d => (
              <option key={d.id} value={d.id}>{d.id} · {d.customerName} · {d.status}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Tanggal Selesai
          <input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} style={fieldStyle} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Batal
        </button>
        <button onClick={handleSubmit} style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Selesaikan
        </button>
      </div>
    </ModalOverlay>
  );
}
