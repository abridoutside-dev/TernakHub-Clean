// ─── CreateDeliveryModal (WST-002) ────────────────────────────────────────────
// Form modal for creating a new delivery in a Transport Workspace.
// No registry imports — the parent provides onSave which calls createDelivery().

import { useState } from 'react';
import {
  type VehicleRecord,
  type DriverRecord,
  type TransportServiceType,
  TRANSPORT_SERVICE_TYPES,
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

export interface CreateDeliveryData {
  customerName: string;
  customerWorkspace: string;
  transportType: TransportServiceType;
  tanggal: string;
  ruteAsal: string;
  ruteTujuan: string;
  kendaraanId: string;
  driverId: string;
  muatan: string;
  nilaiPengiriman: number | null;
  catatan: string;
}

interface CreateDeliveryModalProps {
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  onSave: (data: CreateDeliveryData) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateDeliveryModal({ vehicles, drivers, onSave, onClose }: CreateDeliveryModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [customerName, setCustomerName] = useState('');
  const [customerWorkspace, setCustomerWorkspace] = useState('');
  const [transportType, setTransportType] = useState<TransportServiceType>('Angkut Ternak');
  const [tanggal, setTanggal] = useState(today);
  const [ruteAsal, setRuteAsal] = useState('');
  const [ruteTujuan, setRuteTujuan] = useState('');
  const [kendaraanId, setKendaraanId] = useState(vehicles[0]?.id ?? '');
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? '');
  const [muatan, setMuatan] = useState('');
  const [nilaiPengiriman, setNilaiPengiriman] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!customerName.trim()) { setError('Nama customer wajib diisi.'); return; }
    if (!ruteAsal.trim() || !ruteTujuan.trim()) { setError('Rute asal dan tujuan wajib diisi.'); return; }
    if (!kendaraanId) { setError('Pilih kendaraan.'); return; }
    if (!driverId) { setError('Pilih pengemudi.'); return; }
    if (!muatan.trim()) { setError('Muatan wajib diisi.'); return; }
    onSave({
      customerName: customerName.trim(),
      customerWorkspace: customerWorkspace.trim(),
      transportType,
      tanggal,
      ruteAsal: ruteAsal.trim(),
      ruteTujuan: ruteTujuan.trim(),
      kendaraanId,
      driverId,
      muatan: muatan.trim(),
      nilaiPengiriman: nilaiPengiriman ? parseInt(nilaiPengiriman, 10) : null,
      catatan: catatan.trim(),
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>📦 Buat Pengiriman</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Nama Customer *
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nama pemesan" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Workspace Customer
          <input value={customerWorkspace} onChange={e => setCustomerWorkspace(e.target.value)} placeholder="Nama workspace / peternakan" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Jenis Layanan
          <select value={transportType} onChange={e => setTransportType(e.target.value as TransportServiceType)} style={fieldStyle}>
            {TRANSPORT_SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Tanggal
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Rute Asal *
          <input value={ruteAsal} onChange={e => setRuteAsal(e.target.value)} placeholder="contoh: Garut, Jawa Barat" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Rute Tujuan *
          <input value={ruteTujuan} onChange={e => setRuteTujuan(e.target.value)} placeholder="contoh: Bandung Kota" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Kendaraan *
          <select value={kendaraanId} onChange={e => setKendaraanId(e.target.value)} style={fieldStyle}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.id} · {v.jenisKendaraan} ({v.status})</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Pengemudi *
          <select value={driverId} onChange={e => setDriverId(e.target.value)} style={fieldStyle}>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.nama} ({d.status})</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Muatan *
          <textarea value={muatan} onChange={e => setMuatan(e.target.value)} rows={2} placeholder="contoh: 5 ekor domba garut" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Nilai Pengiriman (Rp)
          <input type="number" value={nilaiPengiriman} onChange={e => setNilaiPengiriman(e.target.value)} placeholder="Kosongkan jika belum ditentukan" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Catatan
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} style={fieldStyle} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Batal
        </button>
        <button onClick={handleSubmit} style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Buat Pengiriman
        </button>
      </div>
    </ModalOverlay>
  );
}
