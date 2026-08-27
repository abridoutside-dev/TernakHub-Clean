// ─── AddDriverModal (WST-002) ─────────────────────────────────────────────────
// Form modal for creating a new driver and assigning them to a vehicle.
// No registry imports — the parent provides onSave which persists the driver.

import { useState } from 'react';

// ─── Shared modal primitives ────────────────────────────────────────────────────

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

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface AddDriverData {
  nama: string;
  nomorSIM: string;
  kategoriSIM: string;
  kendaraanId: string | null;
  pengalamanTahun: number;
  nomorHP: string;
  catatan: string;
}

interface AddDriverModalProps {
  vehicles: { id: string; jenisKendaraan: string; nomorPolisi: string }[];
  onSave: (data: AddDriverData) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddDriverModal({ vehicles, onSave, onClose }: AddDriverModalProps) {
  const [nama, setNama] = useState('');
  const [nomorSIM, setNomorSIM] = useState('');
  const [kategoriSIM, setKategoriSIM] = useState('B2');
  const [kendaraanId, setKendaraanId] = useState<string>(vehicles[0]?.id ?? '');
  const [pengalamanTahun, setPengalamanTahun] = useState('0');
  const [nomorHP, setNomorHP] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!nama.trim()) { setError('Nama pengemudi wajib diisi.'); return; }
    onSave({
      nama: nama.trim(),
      nomorSIM: nomorSIM.trim(),
      kategoriSIM: kategoriSIM.trim() || 'B2',
      kendaraanId: kendaraanId || null,
      pengalamanTahun: parseInt(pengalamanTahun, 10) || 0,
      nomorHP: nomorHP.trim(),
      catatan: catatan.trim(),
    });
    onClose();
  }

  return (
    <ModalOverlay>
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>👨‍✈️ Tugaskan Pengemudi</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Nama Pengemudi *
          <input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama lengkap pengemudi" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Nomor SIM
          <input value={nomorSIM} onChange={e => setNomorSIM(e.target.value)} placeholder="contoh: SIM-B2-1234567890" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Kategori SIM
          <select value={kategoriSIM} onChange={e => setKategoriSIM(e.target.value)} style={fieldStyle}>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="A">A</option>
            <option value="C">C</option>
          </select>
        </label>

        <label style={labelStyle}>
          Kendaraan
          <select value={kendaraanId} onChange={e => setKendaraanId(e.target.value)} style={fieldStyle}>
            <option value="">— Tidak ditugaskan —</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.jenisKendaraan} · {v.nomorPolisi}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Pengalaman (tahun)
          <input type="number" value={pengalamanTahun} onChange={e => setPengalamanTahun(e.target.value)} style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Nomor HP
          <input value={nomorHP} onChange={e => setNomorHP(e.target.value)} placeholder="contoh: 0812-3456-7890" style={fieldStyle} />
        </label>

        <label style={labelStyle}>
          Catatan
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} style={fieldStyle} />
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
