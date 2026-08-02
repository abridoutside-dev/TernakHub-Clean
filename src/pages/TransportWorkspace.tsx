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
  DELIVERY_STATUS_CONFIG,
  TRANSPORT_SERVICE_TYPE_CONFIG,
  TRANSPORT_SERVICE_TYPES,
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

import TransportHeader from '../components/workspace/TransportHeader';
import TransportSummary from '../components/workspace/TransportSummary';
import TransportVehicleSection from '../components/workspace/TransportVehicleSection';
import TransportDriverSection from '../components/workspace/TransportDriverSection';
import TransportDeliverySection from '../components/workspace/TransportDeliverySection';

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
        <TransportHeader meta={meta} roleLabel={rl} />

        {/* ─── 2. SUMMARY CARDS ──────────────────────────────────────────── */}
        <TransportSummary summary={summary} />

        {/* ─── 3. FLEET ──────────────────────────────────────────────────── */}
        <TransportVehicleSection vehicles={vehicles} access={access} />

        {/* ─── 4. DRIVERS · 5. SERVICE COVERAGE ─────────────────────────── */}
        <TransportDriverSection drivers={drivers} areas={areas} access={access} />

        {/* ─── 6. DELIVERY HISTORY · 7. MANAGEMENT ACTIONS ──────────────── */}
        <TransportDeliverySection
          deliveries={deliveries}
          filteredDeliveries={filteredDeliveries}
          deliveryFilter={deliveryFilter}
          typeFilter={typeFilter}
          onDeliveryFilterChange={setDeliveryFilter}
          onTypeFilterChange={setTypeFilter}
          access={access}
          onOpenModal={(modal) => setActiveModal(modal)}
        />

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
