import React from "react";
// ─── TripCostModal (WST-003E) ──────────────────────────────────────────────────
// Form modal for recording a trip cost.
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

export interface TripCostData {
  batch_id?: string | null;
  transaction_id?: string | null;
  kendaraan_id?: string | null;
  driver_id?: string | null;
  tanggal?: string;
  kategori: string;
  nominal: number;
  catatan?: string | null;
}

interface TripCostModalProps {
  vehicles: { id: string; nomor_polisi: string }[];
  drivers: { id: string; nama: string }[];
  onSave: (data: TripCostData) => void;
  onClose: () => void;
}

const COST_CATEGORIES = ['BBM', 'Tol', 'Parkir', 'Uang Jalan', 'Makan', 'Penginapan', 'Spare Part', 'Biaya Darurat', 'Lainnya'];

export default function TripCostModal({ vehicles, drivers, onSave, onClose }: TripCostModalProps) {
  const [kendaraanId, setKendaraanId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState('Lainnya');
  const [nominal, setNominal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!nominal) { setError('Nominal wajib diisi.'); return; }
    onSave({
      kendaraan_id: kendaraanId || null,
      driver_id: driverId || null,
      tanggal,
      kategori,
      nominal: parseInt(nominal, 10),
      catatan: catatan.trim() || null,
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>⛽ Catat Biaya Perjalanan</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Kendaraan
          <select value={kendaraanId} onChange={e => setKendaraanId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih kendaraan —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.nomor_polisi}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Driver
          <select value={driverId} onChange={e => setDriverId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih driver —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Tanggal
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Kategori
          <select value={kategori} onChange={e => setKategori(e.target.value)} style={fieldStyle}>
            {COST_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Nominal (Rp) *
          <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="contoh: 150000" style={fieldStyle} />
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
