import React from "react";
// ─── RevenueModal (WST-003H) ───────────────────────────────────────────────────
// Form modal for recording transport revenue.
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

export interface RevenueData {
  transaction_id: string;
  jenis?: string;
  nominal: number;
  tanggal?: string;
  status?: string;
  catatan?: string | null;
}

interface RevenueModalProps {
  deliveries: { id: string; origin: string; destination: string }[];
  onSave: (data: RevenueData) => void;
  onClose: () => void;
}

const REVENUE_TYPES = ['Delivery Fee', 'Insentif Penjemputan', 'Lainnya'];
const REVENUE_STATUSES = ['Pending', 'Received', 'Failed'];

export default function RevenueModal({ deliveries, onSave, onClose }: RevenueModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [jenis, setJenis] = useState('Delivery Fee');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState('');
  const [status, setStatus] = useState('Pending');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!transactionId) { setError('Pilih pengiriman.'); return; }
    if (!nominal) { setError('Nominal wajib diisi.'); return; }
    onSave({
      transaction_id: transactionId,
      jenis,
      nominal: parseInt(nominal, 10),
      tanggal,
      status,
      catatan: catatan.trim() || null,
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>💵 Catat Pendapatan</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pengiriman *
          <select value={transactionId} onChange={e => setTransactionId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih pengiriman —</option>
            {deliveries.map(d => (
              <option key={d.id} value={d.id}>{d.id} · {d.origin} → {d.destination}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Jenis
          <select value={jenis} onChange={e => setJenis(e.target.value)} style={fieldStyle}>
            {REVENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Tanggal
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Nominal (Rp) *
          <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="contoh: 2000000" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Status
          <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
            {REVENUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
