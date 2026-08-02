// ─── AddDriverModal (WST-002) ─────────────────────────────────────────────────
// Form modal for assigning a driver to a vehicle in a Transport Workspace.
// No registry imports — the parent provides onSave which calls assignDriverToVehicle().

import { useState } from 'react';
import {
  type DriverRecord,
  type VehicleRecord,
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddDriverModalProps {
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
  onSave: (driverId: string, vehicleId: string | null) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddDriverModal({ drivers, vehicles, onSave, onClose }: AddDriverModalProps) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id ?? '');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!driverId) { setError('Pilih pengemudi.'); return; }
    onSave(driverId, vehicleId || null);
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>👨‍✈️ Tugaskan Pengemudi</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pengemudi *
          <select value={driverId} onChange={e => setDriverId(e.target.value)} style={fieldStyle}>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.nama} ({d.status})</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Kendaraan
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} style={fieldStyle}>
            <option value="">— Tidak ditugaskan —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.id} · {v.jenisKendaraan} ({v.status})</option>
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
