import React from "react";
// ─── MaintenanceModal (WST-003D) ───────────────────────────────────────────────
// Form modal for recording a vehicle maintenance event.
// No registry imports — the parent provides onSave which persists the record.

import { useState } from 'react';

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

export interface MaintenanceData {
  kendaraan_id: string;
  jenis_service: string;
  tanggal: string;
  odometer_km?: number | null;
  biaya: number;
  spare_part?: string | null;
  vendor?: string | null;
  status?: string;
  catatan?: string | null;
}

interface MaintenanceModalProps {
  vehicles: { id: string; nomor_polisi: string }[];
  onSave: (data: MaintenanceData) => void;
  onClose: () => void;
}

const MAINTENANCE_TYPES = [
  'Service Berkala', 'Oli', 'Ban', 'Rem', 'Mesin',
  'Kelistrikan', 'Spare Part', 'Perbaikan', 'Lainnya',
];

export default function MaintenanceModal({ vehicles, onSave, onClose }: MaintenanceModalProps) {
  const [kendaraanId, setKendaraanId] = useState('');
  const [jenisService, setJenisService] = useState('Lainnya');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [odometerKm, setOdometerKm] = useState('');
  const [biaya, setBiaya] = useState('');
  const [sparePart, setSparePart] = useState('');
  const [vendor, setVendor] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!kendaraanId) { setError('Pilih kendaraan.'); return; }
    if (!biaya) { setError('Biaya wajib diisi.'); return; }
    onSave({
      kendaraan_id: kendaraanId,
      jenis_service: jenisService,
      tanggal,
      odometer_km: odometerKm ? parseInt(odometerKm, 10) : null,
      biaya: parseInt(biaya, 10),
      spare_part: sparePart.trim() || null,
      vendor: vendor.trim() || null,
      status: 'Selesai',
      catatan: catatan.trim() || null,
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🔧 Catat Service Kendaraan</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Kendaraan *
          <select value={kendaraanId} onChange={e => setKendaraanId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih kendaraan —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.nomor_polisi}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Jenis Service
          <select value={jenisService} onChange={e => setJenisService(e.target.value)} style={fieldStyle}>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Tanggal
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Odometer (km)
          <input type="number" value={odometerKm} onChange={e => setOdometerKm(e.target.value)} placeholder="contoh: 50000" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Biaya (Rp) *
          <input type="number" value={biaya} onChange={e => setBiaya(e.target.value)} placeholder="contoh: 500000" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Spare Part
          <input value={sparePart} onChange={e => setSparePart(e.target.value)} placeholder="contoh: Filter oli" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Vendor / Bengkel
          <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="contoh: Bengkel ABC" style={fieldStyle} />
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
          Simpan
        </button>
      </div>
    </ModalOverlay>
  );
}
