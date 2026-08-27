// ─── Transport Workspace Page (WST-001) ────────────────────────────────────────
// Route: /workspace/:id/transport
// Displays public + operational transport workspace profile.
// Data source: Supabase (layanan_transport, transport_transactions, workspaces)
//
// Flow: UI → repository → Supabase

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  repoGetTransportServicesByWorkspace,
  repoInsertTransportService,
  repoGetTransportDeliveriesByWorkspace,
  repoInsertTransportDelivery,
  repoUpdateTransportDeliveryStatus,
  repoGetTransportVehiclesByWorkspace,
  repoInsertTransportVehicle,
  repoGetTransportDriversByWorkspace,
  repoInsertTransportDriver,
  repoUpdateTransportDriver,
} from '../repositories/transportRepository';
import type {
  TransportServiceDbRow,
  TransportVehicleDbRow,
  TransportDriverDbRow,
  TransportDeliveryDbRow,
} from '../types/transport';
import {
  type DeliveryStatus,
  type TransportServiceType,
  type VehicleRecord,
  type DriverRecord,
  type ServiceArea,
  type DeliveryRecord,
  type TransportWorkspaceMeta,
  type TransportWorkspaceSummary,
  DELIVERY_STATUS_CONFIG,
} from '../data/transportWorkspaceData';
import { getWorkspaceMembers } from '../services/workspaceService';
import type { WorkspaceMemberRecord } from '../data/workspaceMembersData';

import TransportHeader from '../components/workspace/TransportHeader';
import TransportSummary from '../components/workspace/TransportSummary';
import TransportVehicleSection from '../components/workspace/TransportVehicleSection';
import TransportDriverSection from '../components/workspace/TransportDriverSection';
import TransportDeliverySection from '../components/workspace/TransportDeliverySection';
import AddVehicleModal from '../components/workspace/AddVehicleModal';
import AddDriverModal from '../components/workspace/AddDriverModal';
import CreateDeliveryModal from '../components/workspace/CreateDeliveryModal';
import UpdateDeliveryStatusModal from '../components/workspace/UpdateDeliveryStatusModal';
import CompleteDeliveryModal from '../components/workspace/CompleteDeliveryModal';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransportWorkspace() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [meta, setMeta] = useState<TransportWorkspaceMeta | null>(null);
  const [services, setServices] = useState<TransportServiceDbRow[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicleDbRow[]>([]);
  const [drivers, setDrivers] = useState<TransportDriverDbRow[]>([]);
  const [deliveries, setDeliveries] = useState<TransportDeliveryDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<{
    role: 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';
    canViewOperational: boolean;
    canViewFinancial: boolean;
    canEditFleet: boolean;
  }>({ role: 'public', canViewOperational: false, canViewFinancial: false, canEditFleet: false });

  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | 'Semua'>('Semua');
  const [typeFilter, setTypeFilter] = useState<TransportServiceType | 'Semua'>('Semua');
  const [activeModal, setActiveModal] = useState<'vehicle' | 'driver' | 'delivery' | 'status' | 'complete' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const isArmada = tab === 'operational';

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'vehicle') setActiveModal('vehicle');
    else if (action === 'driver') setActiveModal('driver');
    else if (action === 'delivery') setActiveModal('delivery');
    else if (action === 'status') setActiveModal('status');
    else if (action === 'complete') setActiveModal('complete');
  }, [searchParams, setSearchParams]);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const [{ data: wsData }, svc, vehiclesData, driversData, dlv, members] = await Promise.all([
        supabase.from('workspaces').select('id,name,description,province,city,phone,status,created_at,owner_user_uuid').eq('id', workspaceId).single(),
        repoGetTransportServicesByWorkspace(workspaceId),
        repoGetTransportVehiclesByWorkspace(workspaceId),
        repoGetTransportDriversByWorkspace(workspaceId),
        repoGetTransportDeliveriesByWorkspace(workspaceId),
        getWorkspaceMembers(workspaceId),
      ]);
      const ws = wsData as { id: string; name: string | null; description: string | null; province: string | null; city: string | null; phone: string | null; created_at: string | null; status: string | null; owner_user_uuid: string | null; } | null;
      if (ws) {
        setMeta({
          workspaceId: ws.id,
          nama: ws.name ?? 'Workspace Transport',
          logo: '🚚',
          banner: '🚚',
          deskripsi: ws.description ?? 'Layanan Transportasi Ternak & Logistik',
          lokasiUmum: [ws.city, ws.province].filter(Boolean).join(', ') || '-',
          kontakPublik: ws.phone ?? '-',
          bergabungSejak: ws.created_at ?? new Date().toISOString(),
        });
      }
      const ownerId = ws?.owner_user_uuid ?? null;
      const isOwner = !!currentUser?.id && ownerId === currentUser.id;
      const member = members.find((m: WorkspaceMemberRecord) => m.user_id === currentUser?.id);
      const isActiveMember = !!member && member.status === 'Active';
      if (isOwner) {
        setAccess({ role: 'owner', canViewOperational: true, canViewFinancial: true, canEditFleet: true });
      } else if (isActiveMember) {
        const role = member.role === 'Owner' ? 'owner' : member.role === 'Admin' ? 'admin' : 'member';
        setAccess({
          role,
          canViewOperational: true,
          canViewFinancial: role === 'owner' || role === 'admin',
          canEditFleet: role === 'owner' || role === 'admin',
        });
      } else {
        setAccess({ role: 'public', canViewOperational: false, canViewFinancial: false, canEditFleet: false });
      }
      setServices(svc);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setDeliveries(dlv);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data transport');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, currentUser?.id]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Map DB vehicle rows to VehicleRecord shape for component compatibility
  const vehicleRecords: VehicleRecord[] = vehicles.map((v) => ({
    id: v.id,
    workspaceId: v.workspace_id,
    jenisKendaraan: v.jenis_kendaraan as VehicleRecord['jenisKendaraan'],
    nomorPolisi: v.nomor_polisi,
    kapasitas: v.kapasitas_kg ? `${v.kapasitas_kg.toLocaleString('id-ID')} kg` : '—',
    kapasitasKg: v.kapasitas_kg,
    status: v.status === 'Tersedia' ? 'Tersedia' : v.status === 'Beroperasi' ? 'Beroperasi' : v.status === 'Servis' ? 'Servis' : 'Tidak Aktif',
    tahunBeli: v.tahun_beli ?? new Date().getFullYear(),
    jenisLayanan: (v.jenis_layanan ?? []) as VehicleRecord['jenisLayanan'],
    catatanOperasional: v.catatan_operasional ?? '',
  }));

  // Map DB driver rows to DriverRecord shape for component compatibility
  const driverRecords: DriverRecord[] = drivers.map((d) => ({
    id: d.id,
    workspaceId: d.workspace_id,
    nama: d.nama,
    foto: '👤',
    nomorSIM: d.nomor_sim ?? '-',
    kategoriSIM: (d.kategori_sim as DriverRecord['kategoriSIM']) ?? 'B2',
    kendaraanId: d.kendaraan_id,
    status: d.status === 'Aktif' ? 'Aktif' : d.status === 'Tidak Aktif' ? 'Tidak Aktif' : 'Cuti',
    pengalamanTahun: d.pengalaman_tahun,
    nomorHP: d.nomor_hp ?? '-',
    catatanDriver: d.catatan ?? '',
  }));

  // Extract service areas from service coverage_area
  const areas: ServiceArea[] = services
    .filter((s) => s.coverage_area && s.coverage_area.length > 0)
    .map((s) => ({
      id: s.id,
      workspaceId: s.workspace_id,
      namaWilayah: s.name,
      provinsi: s.coverage_area?.[0] ?? '-',
      kabupatenKota: s.coverage_area ?? [],
      jenisLayanan: [],
      minOrderKg: null,
      estimasiWaktu: '-',
      keterangan: s.description ?? '',
    }));

  // Map DB delivery rows to DeliveryRecord shape
  const deliveryRecords: DeliveryRecord[] = deliveries.map((d) => ({
    id: d.id,
    workspaceId: d.transport_workspace_id ?? workspaceId,
    customerId: '',
    customerName: d.origin ?? '-',
    customerWorkspace: '-',
    transportType: (d.transport_type as TransportServiceType) ?? 'Angkut Ternak',
    status: d.status as DeliveryStatus,
    tanggal: d.scheduled_date ?? d.created_at?.split('T')[0] ?? '-',
    tanggalSelesai: null,
    ruteAsal: d.origin ?? '-',
    ruteTujuan: d.destination ?? '-',
    kendaraanId: d.vehicle_type ?? '-',
    driverId: d.driver_name ?? '-',
    muatan: d.notes ?? '-',
    nilaiPengiriman: d.fee,
    catatan: d.notes ?? '',
  }));

  const summary: TransportWorkspaceSummary = {
    totalKendaraan: vehicles.length,
    kendaraanTersedia: vehicles.filter((v) => v.status === 'Tersedia').length,
    kendaraanBeroperasi: vehicles.filter((v) => v.status === 'Beroperasi').length,
    totalDriver: drivers.length,
    driverAktif: drivers.filter((d) => d.status === 'Aktif').length,
    pengirimanSelesai: deliveries.filter((d) => d.status === 'Selesai').length,
    pengirimanPending: deliveries.filter(
      (d) => d.status === 'Menunggu' || d.status === 'Dikonfirmasi' || d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready' || d.status === 'Tiba'
    ).length,
    totalWilayahLayanan: areas.length,
  };

  const handleAddVehicle = async (data: {
    jenisKendaraan: string;
    nomorPolisi: string;
    kapasitas: string;
    kapasitasKg: number | null;
    tahunBeli: number;
    jenisLayanan: TransportServiceType[];
    catatanOperasional: string;
  }) => {
    setSaveError(null);
    try {
      await repoInsertTransportVehicle({
        workspace_id: workspaceId,
        jenis_kendaraan: data.jenisKendaraan,
        nomor_polisi: data.nomorPolisi,
        kapasitas_kg: data.kapasitasKg,
        tahun_beli: data.tahunBeli,
        jenis_layanan: data.jenisLayanan,
        catatan_operasional: data.catatanOperasional,
        status: 'Tersedia',
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menambah kendaraan');
    }
  };

  const handleAddDriver = async (data: {
    nama: string;
    nomorSIM: string;
    kategoriSIM: string;
    kendaraanId: string | null;
    pengalamanTahun: number;
    nomorHP: string;
    catatan: string;
  }) => {
    setSaveError(null);
    try {
      await repoInsertTransportDriver({
        workspace_id: workspaceId,
        nama: data.nama,
        nomor_sim: data.nomorSIM || null,
        kategori_sim: data.kategoriSIM || null,
        kendaraan_id: data.kendaraanId || null,
        pengalaman_tahun: data.pengalamanTahun,
        nomor_hp: data.nomorHP || null,
        catatan: data.catatan || null,
        status: 'Aktif',
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menambah pengemudi');
    }
  };

  const handleCreateDelivery = async (data: {
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
  }) => {
    setSaveError(null);
    try {
      await repoInsertTransportDelivery({
        room_id: crypto.randomUUID(),
        transport_workspace_id: workspaceId,
        origin: data.ruteAsal,
        destination: data.ruteTujuan,
        scheduled_date: data.tanggal,
        fee: data.nilaiPengiriman,
        status: 'Menunggu',
        vehicle_type: data.kendaraanId,
        driver_name: data.driverId,
        notes: data.muatan,
        transport_type: data.transportType,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      setSearchParams((prev) => {
        prev.delete('action');
        return prev;
      });
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal membuat pengiriman');
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    setSaveError(null);
    try {
      await repoUpdateTransportDeliveryStatus(deliveryId, newStatus);
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal memperbarui status');
    }
  };

  const handleCompleteDelivery = async (deliveryId: string, _tanggalSelesai: string) => {
    setSaveError(null);
    try {
      await repoUpdateTransportDeliveryStatus(deliveryId, 'Selesai');
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyelesaikan pengiriman');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px 16px 40px', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>⏳ Memuat data transport...</p>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🚚</p>
        <p style={{ fontWeight: 700, color: '#b91c1c' }}>Gagal memuat data transport</p>
        <p style={{ fontSize: 13 }}>{error}</p>
        <button onClick={() => void loadData()} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Coba lagi</button>
      </div>
    );
  }

  const roleLabel: Record<string, { text: string; icon: string; color: string; bg: string }> = {
    owner:          { text: 'Owner Workspace', icon: '👑', color: '#92400e', bg: '#fef3c7' },
    admin:          { text: 'Admin Workspace', icon: '🔑', color: '#1e40af', bg: '#dbeafe' },
    member:         { text: 'Anggota Workspace', icon: '👤', color: '#166534', bg: '#dcfce7' },
    public:         { text: 'Pengunjung Publik', icon: '👁', color: '#5d4037', bg: '#efebe9' },
    platform_admin: { text: 'Platform Admin', icon: '🛡️', color: '#6d28d9', bg: '#ede9fe' },
  };
  const rl = roleLabel[access.role];

  const actionBtnStyle: React.CSSProperties = {
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
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      paddingBottom: 40,
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        {meta && <TransportHeader meta={meta} roleLabel={rl} />}

        {/* ─── SUMMARY ────────────────────────────────────────────────── */}
        <TransportSummary summary={summary} />

        {isArmada ? (
          /* ─── ARMADA: Fleet Management ─────────────────────────────── */
          <>
            <TransportVehicleSection vehicles={vehicleRecords} access={access} />
            <TransportDriverSection drivers={driverRecords} areas={areas} access={access} />

            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Aksi Manajemen Armada
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {access.canEditFleet && (
                  <>
                    <button onClick={() => setActiveModal('vehicle')} style={actionBtnStyle}>🚛 Tambah Kendaraan</button>
                    <button onClick={() => setActiveModal('driver')} style={actionBtnStyle}>👨‍✈️ Tugaskan Pengemudi</button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ─── DASHBOARD: Operational Overview ──────────────────────── */
          <>
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Aksi Operasional
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setActiveModal('delivery')} style={actionBtnStyle}>📦 Buat Pengiriman</button>
                <button onClick={() => setActiveModal('status')} style={actionBtnStyle}>🔄 Perbarui Status</button>
                <button onClick={() => setActiveModal('complete')} style={actionBtnStyle}>✅ Selesaikan Pengiriman</button>
                {access.canEditFleet && (
                  <>
                    <button onClick={() => setActiveModal('vehicle')} style={actionBtnStyle}>🚛 Tambah Kendaraan</button>
                    <button onClick={() => setActiveModal('driver')} style={actionBtnStyle}>👨‍✈️ Tugaskan Pengemudi</button>
                  </>
                )}
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Pengiriman Terbaru
              </p>
              {deliveryRecords.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
                  Belum ada pengiriman tercatat.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deliveryRecords.slice(0, 5).map((dlv) => {
                    const sc = DELIVERY_STATUS_CONFIG[dlv.status];
                    return (
                      <div key={dlv.id} style={{
                        background: 'var(--color-bg)',
                        border: `1px solid ${sc.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                            {dlv.id}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                            {dlv.ruteAsal} → {dlv.ruteTujuan}
                          </p>
                        </div>
                        <span style={{
                          background: sc.bg,
                          color: sc.color,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12,
                          whiteSpace: 'nowrap',
                        }}>
                          {sc.icon} {dlv.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {saveError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{saveError}</div>
        )}
        {saveSuccess && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#166534' }}>✓ Perubahan berhasil disimpan.</div>
        )}

      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      {activeModal === 'vehicle' && (
        <AddVehicleModal
          onSave={handleAddVehicle}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'driver' && (
        <AddDriverModal
          vehicles={vehicleRecords.map(v => ({ id: v.id, jenisKendaraan: v.jenisKendaraan, nomorPolisi: v.nomorPolisi }))}
          onSave={handleAddDriver}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'delivery' && (
        <CreateDeliveryModal
          vehicles={vehicleRecords}
          drivers={driverRecords}
          onSave={handleCreateDelivery}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'status' && (
        <UpdateDeliveryStatusModal
          deliveries={deliveryRecords}
          onSave={handleUpdateStatus}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'complete' && (
        <CompleteDeliveryModal
          deliveries={deliveryRecords}
          onSave={handleCompleteDelivery}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
    </div>
  );
}
