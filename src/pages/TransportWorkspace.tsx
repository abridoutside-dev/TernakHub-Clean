// ─── Transport Workspace Page (WST-001) ───────────────────────────────────────
// Route: /workspace/:id/transport
// Displays public + operational transport workspace profile.
// Access-gated sections: Drivers, financial stats, internal delivery notes.
// NO GPS · NO live tracking · NO payment · NO scheduling engine.

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getTransportWorkspaceMeta,
  getVehiclesByWorkspace,
  getDriversByWorkspace,
  getServiceAreasByWorkspace,
  getDeliveriesByWorkspace,
  getTransportWorkspaceSummary,
  deriveTransportAccess,
  VEHICLE_STATUS_CONFIG,
  DRIVER_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
  TRANSPORT_SERVICE_TYPE_CONFIG,
  TRANSPORT_SERVICE_TYPES,
  formatRupiahTransport,
  formatTanggalShort,
  addVehicle,
  assignDriverToVehicle,
  createDelivery,
  updateDeliveryStatus,
  completeDelivery,
  type DeliveryStatus,
  type TransportServiceType,
  type VehicleType,
  type VehicleRecord,
  type DriverRecord,
  type DeliveryRecord,
} from '../data/transportWorkspaceData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>{subtitle}</p>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, sub,
}: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 80,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 10px 10px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{sub}</span>}
    </div>
  );
}

function LockedSection({ title }: { title: string }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '28px 20px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 28 }}>🔒</span>
      <p style={{ margin: '8px 0 4px', fontWeight: 700, color: 'var(--color-text)' }}>Akses Terbatas</p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
        {title} hanya tersedia untuk anggota Workspace Transport ini.
      </p>
    </div>
  );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text)',
        cursor: 'pointer',
        flex: '1 1 140px',
        justifyContent: 'center',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Modal: Tambah Kendaraan ──────────────────────────────────────────────────

const VEHICLE_TYPES: VehicleType[] = [
  'Truk Ternak Tertutup',
  'Truk Ternak Besar',
  'Pick-up Bak Terbuka',
  'Pick-up Tertutup',
  'Motor Kurir',
  'Van Box',
];

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

function TambahKendaraanModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    addVehicle(workspaceId, {
      jenisKendaraan,
      nomorPolisi: nomorPolisi.trim(),
      kapasitas: kapasitas.trim() || '—',
      kapasitasKg: kapasitasKg ? parseInt(kapasitasKg, 10) : null,
      tahunBeli: tahun,
      jenisLayanan,
      catatanOperasional: catatanOperasional.trim(),
    });
    onSuccess();
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

// ─── Modal: Tugaskan Pengemudi ────────────────────────────────────────────────

function TugaskanPengemudiModal({
  drivers,
  vehicles,
  onClose,
  onSuccess,
}: {
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id ?? '');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!driverId) { setError('Pilih pengemudi.'); return; }
    assignDriverToVehicle(driverId, vehicleId || null);
    onSuccess();
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

// ─── Modal: Buat Pengiriman ───────────────────────────────────────────────────

function BuatPengirimanModal({
  workspaceId,
  vehicles,
  drivers,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    createDelivery(workspaceId, {
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
    onSuccess();
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

// ─── Modal: Perbarui Status ───────────────────────────────────────────────────

const UPDATABLE_STATUSES: DeliveryStatus[] = [
  'Menunggu',
  'Dikonfirmasi',
  'Pickup Ready',
  'Dalam Perjalanan',
  'Tiba',
];

function PerbaruiStatusModal({
  deliveries,
  onClose,
  onSuccess,
}: {
  deliveries: DeliveryRecord[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const nonCompleted = deliveries.filter(d => d.status !== 'Selesai' && d.status !== 'Dibatalkan');
  const [deliveryId, setDeliveryId] = useState(nonCompleted[0]?.id ?? '');
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('Dikonfirmasi');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!deliveryId) { setError('Pilih pengiriman.'); return; }
    updateDeliveryStatus(deliveryId, newStatus);
    onSuccess();
    onClose();
  }

  if (nonCompleted.length === 0) {
    return (
      <ModalOverlay>
        <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🔄 Perbarui Status</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>Tidak ada pengiriman aktif yang dapat diperbarui.</p>
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
      <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🔄 Perbarui Status Pengiriman</p>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={labelStyle}>
          Pengiriman
          <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)} style={fieldStyle}>
            {nonCompleted.map(d => (
              <option key={d.id} value={d.id}>{d.id} · {d.customerName} · {d.status}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Status Baru
          <select value={newStatus} onChange={e => setNewStatus(e.target.value as DeliveryStatus)} style={fieldStyle}>
            {UPDATABLE_STATUSES.map(s => (
              <option key={s} value={s}>{DELIVERY_STATUS_CONFIG[s].icon} {s}</option>
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

// ─── Modal: Selesaikan Pengiriman ─────────────────────────────────────────────

const IN_PROGRESS_STATUSES: DeliveryStatus[] = ['Dikonfirmasi', 'Pickup Ready', 'Dalam Perjalanan', 'Tiba'];

function SelesaikanPengirimanModal({
  deliveries,
  onClose,
  onSuccess,
}: {
  deliveries: DeliveryRecord[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const inProgress = deliveries.filter(d => IN_PROGRESS_STATUSES.includes(d.status));
  const [deliveryId, setDeliveryId] = useState(inProgress[0]?.id ?? '');
  const [tanggalSelesai, setTanggalSelesai] = useState(today);
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!deliveryId) { setError('Pilih pengiriman.'); return; }
    if (!tanggalSelesai) { setError('Tanggal selesai wajib diisi.'); return; }
    completeDelivery(deliveryId, tanggalSelesai);
    onSuccess();
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransportWorkspace() {
  const { id: workspaceId = 'w4' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const meta     = getTransportWorkspaceMeta(workspaceId);
  const access   = deriveTransportAccess(workspaceId, currentUser?.id ?? null);
  const summary  = getTransportWorkspaceSummary(workspaceId);
  const vehicles  = getVehiclesByWorkspace(workspaceId);
  const drivers   = getDriversByWorkspace(workspaceId);
  const areas     = getServiceAreasByWorkspace(workspaceId);
  const deliveries = getDeliveriesByWorkspace(workspaceId);

  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | 'Semua'>('Semua');
  const [typeFilter, setTypeFilter] = useState<TransportServiceType | 'Semua'>('Semua');
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeModal, setActiveModal] = useState<'vehicle' | 'driver' | 'delivery' | 'status' | 'complete' | null>(null);

  // The transport registries are intentionally in-memory for WST-001. This
  // tick makes every successful mutation re-read the registry in this page.
  void refreshTick;
  const refresh = () => setRefreshTick((current) => current + 1);

  const filteredDeliveries = deliveries.filter((d) => {
    const byStatus = deliveryFilter === 'Semua' || d.status === deliveryFilter;
    const byType   = typeFilter === 'Semua' || d.transportType === typeFilter;
    return byStatus && byType;
  });

  if (!meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🚚</p>
        <p style={{ fontWeight: 700 }}>Workspace transport tidak ditemukan.</p>
        <p style={{ fontSize: 13 }}>ID: {workspaceId}</p>
      </div>
    );
  }

  const roleLabel: Record<typeof access.role, { text: string; icon: string; color: string; bg: string }> = {
    owner:          { text: 'Owner Workspace', icon: '👑', color: '#92400e', bg: '#fef3c7' },
    admin:          { text: 'Admin Workspace', icon: '🔑', color: '#1e40af', bg: '#dbeafe' },
    member:         { text: 'Anggota Workspace', icon: '👤', color: '#166534', bg: '#dcfce7' },
    public:         { text: 'Pengunjung Publik', icon: '👁', color: '#5d4037', bg: '#efebe9' },
    platform_admin: { text: 'Platform Admin', icon: '🛡️', color: '#6d28d9', bg: '#ede9fe' },
  };
  const rl = roleLabel[access.role];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── 1. HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, #2d9e5e 100%)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 20,
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          marginTop: 16,
        }}>
          {/* Banner pattern */}
          <div style={{
            height: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            opacity: 0.18,
            letterSpacing: 8,
            userSelect: 'none',
          }}>
            {meta.banner} 🚚 🛤️ 🚚 🛤️ {meta.banner}
          </div>

          {/* Role badge */}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: rl.bg,
            color: rl.color,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {rl.icon} {rl.text}
          </div>

          {/* Logo + info */}
          <div style={{ padding: '0 20px 20px', marginTop: -20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 72,
                height: 72,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '3px solid var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
              }}>
                {meta.logo}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}>
                  {meta.nama}
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  Workspace Transport · {meta.lokasiUmum}
                </p>
              </div>
            </div>

            {/* Tags row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                🚚 Transporter
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                📅 Sejak {new Date(meta.bergabungSejak).getFullYear()}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                📞 {meta.kontakPublik}
              </span>
            </div>

            {/* Description */}
            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}>
              {meta.deskripsi}
            </p>
          </div>
        </div>

        {/* ─── 2. SUMMARY CARDS ──────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Statistik Operasional" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatCard
              icon="🚛"
              value={summary.totalKendaraan}
              label="Total Kendaraan"
              sub={`${summary.kendaraanTersedia} tersedia`}
            />
            <StatCard
              icon="👨‍✈️"
              value={summary.driverAktif}
              label="Driver Aktif"
              sub={`dari ${summary.totalDriver} total`}
            />
            <StatCard
              icon="🏁"
              value={summary.pengirimanSelesai}
              label="Pengiriman Selesai"
            />
            <StatCard
              icon="⏳"
              value={summary.pengirimanPending}
              label="Dalam Proses"
            />
            <StatCard
              icon="🗺️"
              value={summary.totalWilayahLayanan}
              label="Area Layanan"
              sub="wilayah"
            />
          </div>
        </div>

        {/* ─── 3. FLEET ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Armada Kendaraan"
            subtitle={`${vehicles.length} unit terdaftar`}
          />

          {/* Desktop: table-like grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 10,
          }}>
            {vehicles.map((v) => {
              const sc = VEHICLE_STATUS_CONFIG[v.status];
              return (
                <div key={v.id} style={{
                  background: 'var(--color-bg)',
                  border: `1.5px solid ${sc.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                        {v.id}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                        {v.jenisKendaraan} · {v.nomorPolisi}
                      </p>
                    </div>
                    <span style={{
                      background: sc.bg,
                      color: sc.color,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 12,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      {sc.icon} {v.status}
                    </span>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {v.jenisLayanan.map((jl) => {
                        const cfg = TRANSPORT_SERVICE_TYPE_CONFIG[jl];
                        return (
                          <span key={jl} style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: cfg.color,
                            background: cfg.bg,
                            padding: '2px 7px',
                            borderRadius: 10,
                          }}>
                            {cfg.icon} {jl}
                          </span>
                        );
                      })}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                      <strong>Kapasitas:</strong>{' '}
                      {v.kapasitas !== '—'
                        ? v.kapasitas
                        : v.kapasitasKg
                          ? `${v.kapasitasKg.toLocaleString('id-ID')} kg`
                          : '—'}
                    </p>
                    {v.kapasitas !== '—' && v.kapasitasKg && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                        ~{v.kapasitasKg.toLocaleString('id-ID')} kg · Tahun {v.tahunBeli}
                      </p>
                    )}
                    {v.kapasitas === '—' && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                        Tahun {v.tahunBeli}
                      </p>
                    )}
                    {access.canViewOperational && (
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}>
                        {v.catatanOperasional}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 4. DRIVERS ────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Pengemudi"
            subtitle={`${drivers.length} terdaftar · ${drivers.filter((d) => d.status === 'Aktif').length} aktif`}
          />

          {access.canViewOperational ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drivers.map((d) => {
                const sc = DRIVER_STATUS_CONFIG[d.status];
                const vehicle = d.kendaraanId
                  ? `${d.kendaraanId}`
                  : '—';
                return (
                  <div key={d.id} style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48,
                      height: 48,
                      background: 'var(--color-surface)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      flexShrink: 0,
                      border: '1.5px solid var(--color-border)',
                    }}>
                      {d.foto}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                            {d.nama}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                            SIM {d.kategoriSIM} · {d.pengalamanTahun} tahun pengalaman
                          </p>
                        </div>
                        <span style={{
                          background: sc.bg,
                          color: sc.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          flexShrink: 0,
                        }}>
                          {sc.icon} {d.status}
                        </span>
                      </div>

                      <div style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                        fontSize: 12,
                        color: 'var(--color-muted)',
                      }}>
                        <span>🚛 {vehicle}</span>
                        <span>📞 {d.nomorHP}</span>
                      </div>

                      {d.catatanDriver && (
                        <p style={{
                          margin: '6px 0 0',
                          fontSize: 11,
                          color: 'var(--color-muted)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}>
                          {d.catatanDriver}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <LockedSection title="Data pengemudi" />
          )}
        </div>

        {/* ─── 5. SERVICE COVERAGE ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Coverage Area Layanan"
            subtitle={`${areas.length} wilayah terdaftar`}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {areas.map((area) => (
              <div key={area.id} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                      🗺️ {area.namaWilayah}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                      {area.provinsi} · ⏱ {area.estimasiWaktu}
                    </p>
                  </div>
                  {area.minOrderKg && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                    }}>
                      Min. {area.minOrderKg} kg
                    </span>
                  )}
                </div>

                {/* Jenis layanan tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {area.jenisLayanan.map((jl) => {
                    const cfg = TRANSPORT_SERVICE_TYPE_CONFIG[jl];
                    return (
                      <span key={jl} style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}>
                        {cfg.icon} {jl}
                      </span>
                    );
                  })}
                </div>

                {/* Kabupaten/Kota */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {area.kabupatenKota.map((kk) => (
                    <span key={kk} style={{
                      fontSize: 11,
                      color: 'var(--color-muted)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      padding: '2px 7px',
                      borderRadius: 8,
                    }}>
                      {kk}
                    </span>
                  ))}
                </div>

                <p style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}>
                  {area.keterangan}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. DELIVERY HISTORY ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Riwayat Pengiriman"
            subtitle={`${deliveries.length} total · ${deliveries.filter((d) => d.status === 'Selesai').length} selesai`}
          />

          {access.canViewOperational ? (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {/* Status filter */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(['Semua', 'Dalam Perjalanan', 'Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setDeliveryFilter(s)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: deliveryFilter === s
                          ? '1.5px solid var(--color-primary)'
                          : '1.5px solid var(--color-border)',
                        background: deliveryFilter === s
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface)',
                        color: deliveryFilter === s
                          ? 'var(--color-primary)'
                          : 'var(--color-muted)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {(['Semua', 'Angkut Ternak', 'Angkut Pakan', 'Angkut Obat', 'Angkut Peralatan', 'Pengiriman Dokumen'] as const).map((t) => {
                  const cfg = t !== 'Semua' ? TRANSPORT_SERVICE_TYPE_CONFIG[t] : null;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t as TransportServiceType | 'Semua')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: typeFilter === t
                          ? `1.5px solid ${cfg?.color ?? 'var(--color-primary)'}`
                          : '1.5px solid var(--color-border)',
                        background: typeFilter === t
                          ? (cfg?.bg ?? 'var(--color-primary-light)')
                          : 'var(--color-surface)',
                        color: typeFilter === t
                          ? (cfg?.color ?? 'var(--color-primary)')
                          : 'var(--color-muted)',
                      }}
                    >
                      {cfg ? `${cfg.icon} ` : ''}{t}
                    </button>
                  );
                })}
              </div>

              {/* Results count */}
              {filteredDeliveries.length === 0 ? (
                <div style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--color-muted)',
                }}>
                  <span style={{ fontSize: 28 }}>📭</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tidak ada pengiriman yang cocok dengan filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredDeliveries.map((dlv) => {
                    const sc = DELIVERY_STATUS_CONFIG[dlv.status];
                    const typeCfg = TRANSPORT_SERVICE_TYPE_CONFIG[dlv.transportType];
                    return (
                      <div key={dlv.id} style={{
                        background: 'var(--color-bg)',
                        border: `1.5px solid ${sc.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                      }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                              {dlv.id}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                              {dlv.customerName} · {dlv.customerWorkspace}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{
                              background: typeCfg.bg,
                              color: typeCfg.color,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 7px',
                              borderRadius: 10,
                            }}>
                              {typeCfg.icon} {dlv.transportType}
                            </span>
                            <span style={{
                              background: sc.bg,
                              color: sc.color,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 7px',
                              borderRadius: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              {sc.icon} {dlv.status}
                            </span>
                          </div>
                        </div>

                        {/* Route */}
                        <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                          📍 {dlv.ruteAsal} → {dlv.ruteTujuan}
                        </p>

                        {/* Bottom row */}
                        <div style={{
                          display: 'flex',
                          gap: 16,
                          flexWrap: 'wrap',
                          fontSize: 11,
                          color: 'var(--color-muted)',
                          marginTop: 4,
                        }}>
                          <span>📅 {formatTanggalShort(dlv.tanggal)}</span>
                          <span>🚛 {dlv.kendaraanId}</span>
                          <span>📦 {dlv.muatan}</span>
                          {access.canViewFinancial && dlv.nilaiPengiriman !== null && (
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              💰 {formatRupiahTransport(dlv.nilaiPengiriman)}
                            </span>
                          )}
                        </div>

                        {dlv.catatan && (
                          <p style={{
                            margin: '6px 0 0',
                            fontSize: 11,
                            color: 'var(--color-muted)',
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                          }}>
                            {dlv.catatan}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <LockedSection title="Riwayat pengiriman" />
          )}
        </div>

        {/* ─── 7. MANAGEMENT ACTIONS ──────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Aksi Manajemen"
            subtitle="Kelola armada dan operasional pengiriman Workspace Transport"
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {access.canViewOperational ? (
              <>
                {access.canEditFleet && (
                  <>
                    <ActionButton icon="🚛" label="Tambah Kendaraan" onClick={() => setActiveModal('vehicle')} />
                    <ActionButton icon="👨‍✈️" label="Tugaskan Pengemudi" onClick={() => setActiveModal('driver')} />
                  </>
                )}
                <ActionButton icon="📦" label="Buat Pengiriman" onClick={() => setActiveModal('delivery')} />
                <ActionButton icon="🔄" label="Perbarui Status" onClick={() => setActiveModal('status')} />
                <ActionButton icon="✅" label="Selesaikan Pengiriman" onClick={() => setActiveModal('complete')} />
              </>
            ) : (
              <div style={{
                padding: '14px 16px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--color-muted)',
                width: '100%',
                textAlign: 'center',
              }}>
                🔒 Aksi manajemen hanya tersedia untuk anggota Workspace Transport.
              </div>
            )}
          </div>

          {access.canViewOperational && (
            <p style={{
              margin: '12px 0 0',
              fontSize: 11,
              color: 'var(--color-muted)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              Perubahan tersimpan ke registri operasional Workspace Transport ini.
            </p>
          )}
        </div>

      </div>

      {activeModal === 'vehicle' && (
        <TambahKendaraanModal
          workspaceId={workspaceId}
          onClose={() => setActiveModal(null)}
          onSuccess={refresh}
        />
      )}
      {activeModal === 'driver' && (
        <TugaskanPengemudiModal
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setActiveModal(null)}
          onSuccess={refresh}
        />
      )}
      {activeModal === 'delivery' && (
        <BuatPengirimanModal
          workspaceId={workspaceId}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setActiveModal(null)}
          onSuccess={refresh}
        />
      )}
      {activeModal === 'status' && (
        <PerbaruiStatusModal
          deliveries={deliveries}
          onClose={() => setActiveModal(null)}
          onSuccess={refresh}
        />
      )}
      {activeModal === 'complete' && (
        <SelesaikanPengirimanModal
          deliveries={deliveries}
          onClose={() => setActiveModal(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
