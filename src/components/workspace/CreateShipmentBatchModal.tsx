import React from "react";
// ─── CreateShipmentBatchModal (WST-003B) ───────────────────────────────────────
// Form modal for creating a new shipment batch.
// No registry imports — the parent provides onSave which persists the batch.

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

export interface CreateShipmentBatchData {
  kendaraan_id?: string | null;
  driver_id?: string | null;
  tanggal?: string | null;
  jam?: string | null;
  rute?: string | null;
  kapasitas_kg?: number | null;
  biaya_perjalanan?: number | null;
  status?: string;
  catatan?: string | null;
}

interface CreateShipmentBatchModalProps {
  vehicles: { id: string; nomor_polisi: string }[];
  drivers: { id: string; nama: string }[];
  onSave: (data: CreateShipmentBatchData) => void;
  onClose: () => void;
}

export default function CreateShipmentBatchModal({ vehicles, drivers, onSave, onClose }: CreateShipmentBatchModalProps) {
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [rute, setRute] = useState('');
  const [kendaraanId, setKendaraanId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [kapasitasKg, setKapasitasKg] = useState('');
  const [biayaPerjalanan, setBiayaPerjalanan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!rute.trim()) { setError('Rute wajib diisi.'); return; }
    if (!kendaraanId) { setError('Pilih kendaraan.'); return; }
    if (!driverId) { setError('Pilih driver.'); return; }
    if (!kapasitasKg || parseInt(kapasitasKg, 10) <= 0) { setError('Kapasitas kg harus lebih besar dari 0.'); return; }
    onSave({
      kendaraan_id: kendaraanId,
      driver_id: driverId,
      tanggal: tanggal || null,
      jam: jam || null,
      rute: rute.trim(),
      kapasitas_kg: parseInt(kapasitasKg, 10),
      biaya_perjalanan: biayaPerjalanan ? parseInt(biayaPerjalanan, 10) : 0,
      status: 'Draft',
      catatan: catatan.trim() || null,
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🚛 Buat Batch Pengiriman</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Rute *
          <input value={rute} onChange={e => setRute(e.target.value)} placeholder="contoh: Garut → Bandung" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Tanggal
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Jam
          <input type="time" value={jam} onChange={e => setJam(e.target.value)} style={fieldStyle} />
        </label>
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
          Driver *
          <select value={driverId} onChange={e => setDriverId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih driver —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Kapasitas (kg)
          <input type="number" value={kapasitasKg} onChange={e => setKapasitasKg(e.target.value)} placeholder="contoh: 1000" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Biaya Perjalanan (Rp)
          <input type="number" value={biayaPerjalanan} onChange={e => setBiayaPerjalanan(e.target.value)} placeholder="0" style={fieldStyle} />
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
          Buat Batch
        </button>
      </div>
    </ModalOverlay>
  );
}
