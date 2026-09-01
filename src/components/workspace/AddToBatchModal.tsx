import React from "react";
// ─── AddToBatchModal (WST-003B) ────────────────────────────────────────────────
// Modal for selecting a batch to add pending delivery items to.
// No registry imports — the parent provides onSave which persists the items.

import { useState } from 'react';
import type { TransportDeliveryDbRow, TransportShipmentBatchDbRow } from '../../types/transport';

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

interface AddToBatchModalProps {
  delivery: TransportDeliveryDbRow | null;
  batches: TransportShipmentBatchDbRow[];
  batchCurrentLoads?: Record<string, number>;
  onAdd: (batchId: string, deliveryId: string, muatanKg: number) => void;
  onClose: () => void;
}

export default function AddToBatchModal({ delivery, batches, batchCurrentLoads = {}, onAdd, onClose }: AddToBatchModalProps) {
  const [batchId, setBatchId] = useState('');
  const [muatanKg, setMuatanKg] = useState('');
  const [error, setError] = useState('');

  const selectedBatch = batches.find(b => b.id === batchId);
  const currentLoad = selectedBatch ? (batchCurrentLoads[selectedBatch.id] ?? 0) : 0;
  const remainingCapacity = selectedBatch?.kapasitas_kg != null ? selectedBatch.kapasitas_kg - currentLoad : null;
  const inputMuatan = muatanKg ? parseInt(muatanKg, 10) : 0;
  const wouldExceed = selectedBatch?.kapasitas_kg != null && remainingCapacity != null && (currentLoad + inputMuatan) > selectedBatch.kapasitas_kg;

  function handleSubmit() {
    if (!batchId) { setError('Pilih batch.'); return; }
    if (selectedBatch?.kapasitas_kg != null && remainingCapacity != null && (currentLoad + inputMuatan) > selectedBatch.kapasitas_kg) {
      setError(`Kapasitas batch tidak cukup. Kapasitas: ${selectedBatch.kapasitas_kg} kg, Terpakai: ${currentLoad} kg, Sisa: ${remainingCapacity} kg.`);
      return;
    }
    onAdd(batchId, delivery?.id ?? '', inputMuatan);
    onClose();
  }

  if (!delivery) {
    return (
      <ModalOverlay>
        <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Gabungkan ke Batch</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Pilih pengiriman terlebih dahulu.</p>
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
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Gabungkan ke Batch</p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-muted)' }}>
        Pengiriman: <strong>{delivery.id}</strong> · {delivery.origin} → {delivery.destination}
      </p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pilih Batch *
          <select value={batchId} onChange={e => setBatchId(e.target.value)} style={fieldStyle}>
            <option value="">— Pilih batch —</option>
            {batches.map(b => {
              const load = batchCurrentLoads[b.id] ?? 0;
              const sisa = b.kapasitas_kg != null ? b.kapasitas_kg - load : null;
              const full = b.kapasitas_kg != null && sisa != null && sisa <= 0;
              return (
                <option key={b.id} value={b.id} disabled={full}>
                  {b.rute ?? 'Tanpa rute'} · {b.status} · Kapasitas: {b.kapasitas_kg ?? '-'} kg · Sisa: {sisa != null ? `${sisa} kg` : '-'}
                  {full ? ' (PENUH)' : ''}
                </option>
              );
            })}
          </select>
        </label>
        {selectedBatch && (
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
            color: 'var(--color-text)',
          }}>
            <div><strong>Kapasitas batch:</strong> {selectedBatch.kapasitas_kg ?? '-'} kg</div>
            <div><strong>Total muatan saat ini:</strong> {currentLoad} kg</div>
            <div><strong>Sisa kapasitas:</strong> {remainingCapacity != null ? `${remainingCapacity} kg` : '-'}</div>
            <div style={{ marginTop: 6, color: wouldExceed ? '#dc2626' : 'var(--color-muted)', fontWeight: wouldExceed ? 700 : 400 }}>
              {inputMuatan > 0
                ? (wouldExceed
                    ? `❌ Melebihi kapasitas jika ditambah ${inputMuatan} kg`
                    : `✓ Setelah ditambah: ${currentLoad + inputMuatan} / ${selectedBatch.kapasitas_kg} kg`)
                : 'Masukkan muatan (kg) untuk validasi.'}
            </div>
          </div>
        )}
        <label style={labelStyle}>
          Muatan (kg) *
          <input type="number" value={muatanKg} onChange={e => setMuatanKg(e.target.value)} placeholder="Berat muatan dalam kg" style={fieldStyle} min="0" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Batal
        </button>
        <button onClick={handleSubmit} style={{ background: '#16a34a', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Gabungkan
        </button>
      </div>
    </ModalOverlay>
  );
}
