// ─── AddVehicleModal (WST-002) ────────────────────────────────────────────────
// Form modal for adding a new vehicle to a Transport Workspace.
// No registry imports — the parent provides onSave which calls addVehicle().

import { useState } from 'react';
import {
  type VehicleType,
  type TransportServiceType,
  TRANSPORT_SERVICE_TYPES,
  TRANSPORT_SERVICE_TYPE_CONFIG,
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

const VEHICLE_TYPES: VehicleType[] = [
  'Truk Ternak Tertutup',
  'Truk Ternak Besar',
  'Pick-up Bak Terbuka',
  'Pick-up Tertutup',
  'Motor Kurir',
  'Van Box',
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddVehicleData {
  jenisKendaraan: VehicleType;
  nomorPolisi: string;
  kapasitas: string;
  kapasitasKg: number | null;
  tahunBeli: number;
  jenisLayanan: TransportServiceType[];
  catatanOperasional: string;
}

interface AddVehicleModalProps {
  onSave: (data: AddVehicleData) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddVehicleModal({ onSave, onClose }: AddVehicleModalProps) {
  const [jenisKendaraan, setJenisKendaraan] = useState<VehicleType>('Pick-up Bak Terbuka');
  const [nomorPolisi, setNomorPolisi] = useState('');
  const [kapasitas, setKapasitas] = useState('');
  const [kapasitasKg, setKapasitasKg] = useState('');
  const [tahunBeli, setTahunBeli] = useState(String(new Date().getFullYear()));
  const [jenisLayanan, setJenisLayanan] = useState<TransportServiceType[]>([]);
  const [catatanOperasional, setCatatanOperasional] = useState('');
  const [error, setError] = useState('');

  function toggleLayanan(jl: TransportServiceType) {
    setJenisLayanan(prev =>
      prev.includes(jl) ? prev.filter(x => x !== jl) : [...prev, jl]
    );
  }

  function handleSubmit() {
    if (!nomorPolisi.trim()) { setError('Nomor polisi wajib diisi.'); return; }
    if (jenisLayanan.length === 0) { setError('Pilih minimal satu jenis layanan.'); return; }
    const tahun = parseInt(tahunBeli, 10);
    if (isNaN(tahun) || tahun < 1990 || tahun > new Date().getFullYear()) {
      setError('Tahun beli tidak valid.'); return;
    }
    onSave({
      jenisKendaraan,
      nomorPolisi: nomorPolisi.trim(),
      kapasitas: kapasitas.trim() || '—',
      kapasitasKg: kapasitasKg ? parseInt(kapasitasKg, 10) : null,
      tahunBeli: tahun,
      jenisLayanan,
      catatanOperasional: catatanOperasional.trim(),
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🚛 Tambah Kendaraan</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Jenis Kendaraan
          <select value={jenisKendaraan} onChange={e => setJenisKendaraan(e.target.value as VehicleType)} style={fieldStyle}>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Nomor Polisi *
          <input value={nomorPolisi} onChange={e => setNomorPolisi(e.target.value)} placeholder="contoh: Z 1234 AB" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Kapasitas (teks)
          <input value={kapasitas} onChange={e => setKapasitas(e.target.value)} placeholder="contoh: 10 ekor domba atau —" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Kapasitas (kg)
          <input type="number" value={kapasitasKg} onChange={e => setKapasitasKg(e.target.value)} placeholder="contoh: 1500" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Tahun Beli
          <input type="number" value={tahunBeli} onChange={e => setTahunBeli(e.target.value)} placeholder="contoh: 2022" style={fieldStyle} />
        </label>

        <div>
          <span style={labelStyle}>Jenis Layanan *</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TRANSPORT_SERVICE_TYPES.map(jl => (
              <label key={jl} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={jenisLayanan.includes(jl)} onChange={() => toggleLayanan(jl)} />
                {TRANSPORT_SERVICE_TYPE_CONFIG[jl].icon} {jl}
              </label>
            ))}
          </div>
        </div>

        <label style={labelStyle}>
          Catatan Operasional
          <textarea value={catatanOperasional} onChange={e => setCatatanOperasional(e.target.value)} rows={3} style={fieldStyle} />
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
