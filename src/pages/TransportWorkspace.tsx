import React from "react";
// ─── Transport Workspace Page (WST-001) ────────────────────────────────────────
// Route: /workspace/:id/transport
// Displays public + operational transport workspace profile.
// Data source: Supabase via repositories.
//
// Flow: UI → repository → Supabase

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  repoGetTransportServicesByWorkspace,
  repoGetTransportDeliveriesByWorkspace,
  repoInsertTransportDelivery,
  repoUpdateTransportDeliveryStatus,
  repoGetTransportVehiclesByWorkspace,
  repoInsertTransportVehicle,
  repoGetTransportDriversByWorkspace,
  repoInsertTransportDriver,
  repoListShipmentBatches,
  repoCreateShipmentBatch,
  repoUpdateShipmentBatch,
  repoAddTransactionToBatch,
  repoListBatchItems,
  repoListPendingMergeDeliveries,
  repoListMaintenanceByVehicle,
  repoInsertMaintenance,
  repoDeleteMaintenance,
  repoListTripCosts,
  repoInsertTripCost,
  repoDeleteTripCost,
  repoListDriverPayments,
  repoInsertDriverPayment,
  repoDeleteDriverPayment,
  repoInsertRevenue,
  repoGetTransportFinancialSummary,
  repoListTrackingByDelivery,
} from '../repositories/transportRepository';
import type {
  TransportServiceDbRow,
  TransportVehicleDbRow,
  TransportDriverDbRow,
  TransportDeliveryDbRow,
  TransportShipmentBatchDbRow,
  TransportVehicleMaintenanceDbRow,
  TransportTripCostDbRow,
  TransportDriverPaymentDbRow,
  TransportFinancialSummary,
  TransportShipmentBatchItemDbRow,
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
import { TRANSPORT_BATCH_STATUS_CONFIG } from '../types/transport';
import { getWorkspaceMembers } from '../services/workspaceService';
import type { WorkspaceMemberRecord } from '../data/workspaceMembersData';

import TransportHeader from '../components/workspace/TransportHeader';
import TransportSummary from '../components/workspace/TransportSummary';
import TransportVehicleSection from '../components/workspace/TransportVehicleSection';
import TransportDriverSection from '../components/workspace/TransportDriverSection';
import TransportPendingMergeSection from '../components/workspace/TransportPendingMergeSection';
import TransportShipmentBatchSection from '../components/workspace/TransportShipmentBatchSection';
import TransportScheduleSection from '../components/workspace/TransportScheduleSection';
import TransportMaintenanceSection from '../components/workspace/TransportMaintenanceSection';
import TransportTripCostSection from '../components/workspace/TransportTripCostSection';
import TransportDriverPaymentSection from '../components/workspace/TransportDriverPaymentSection';
import TransportFinancialSection from '../components/workspace/TransportFinancialSection';
import TransportTrackingSection from '../components/workspace/TransportTrackingSection';
import AddVehicleModal from '../components/workspace/AddVehicleModal';
import AddDriverModal from '../components/workspace/AddDriverModal';
import CreateDeliveryModal from '../components/workspace/CreateDeliveryModal';
import UpdateDeliveryStatusModal from '../components/workspace/UpdateDeliveryStatusModal';
import CompleteDeliveryModal from '../components/workspace/CompleteDeliveryModal';
import CreateShipmentBatchModal from '../components/workspace/CreateShipmentBatchModal';
import AddToBatchModal from '../components/workspace/AddToBatchModal';
import MaintenanceModal from '../components/workspace/MaintenanceModal';
import DriverPaymentModal from '../components/workspace/DriverPaymentModal';
import TripCostModal from '../components/workspace/TripCostModal';
import RevenueModal from '../components/workspace/RevenueModal';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransportWorkspace() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [meta, setMeta] = useState<TransportWorkspaceMeta | null>(null);
  const [services, setServices] = useState<TransportServiceDbRow[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicleDbRow[]>([]);
  const [drivers, setDrivers] = useState<TransportDriverDbRow[]>([]);
  const [deliveries, setDeliveries] = useState<TransportDeliveryDbRow[]>([]);
  const [pendingMergeDeliveries, setPendingMergeDeliveries] = useState<TransportDeliveryDbRow[]>([]);
  const [batches, setBatches] = useState<TransportShipmentBatchDbRow[]>([]);
  const [batchItemsMap, setBatchItemsMap] = useState<Record<string, TransportShipmentBatchItemDbRow[]>>({});
  const [maintenanceRecords, setMaintenanceRecords] = useState<TransportVehicleMaintenanceDbRow[]>([]);
  const [tripCostRecords, setTripCostRecords] = useState<TransportTripCostDbRow[]>([]);
  const [driverPaymentRecords, setDriverPaymentRecords] = useState<TransportDriverPaymentDbRow[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, Array<{ latitude: number; longitude: number; location_name: string | null; speed: number | null; updated_at: string }>>>({});
  const [financialSummary, setFinancialSummary] = useState<TransportFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<{
    role: 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';
    canViewOperational: boolean;
    canViewFinancial: boolean;
    canEditFleet: boolean;
  }>({ role: 'public', canViewOperational: false, canViewFinancial: false, canEditFleet: false });

  const [activeModal, setActiveModal] = useState<'vehicle' | 'driver' | 'delivery' | 'status' | 'complete' | 'batch' | 'addToBatch' | 'maintenance' | 'tripCost' | 'driverPayment' | 'revenue' | null>(null);
  const [selectedDeliveryForBatch, setSelectedDeliveryForBatch] = useState<string | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const isArmada = tab === 'operational';
  const isFinancial = tab === 'financial';

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'vehicle') setActiveModal('vehicle');
    else if (action === 'driver') setActiveModal('driver');
    else if (action === 'delivery') setActiveModal('delivery');
    else if (action === 'status') setActiveModal('status');
    else if (action === 'complete') setActiveModal('complete');
    else if (action === 'batch') setActiveModal('batch');
    else if (action === 'maintenance') setActiveModal('maintenance');
    else if (action === 'tripCost') setActiveModal('tripCost');
    else if (action === 'driverPayment') setActiveModal('driverPayment');
    else if (action === 'revenue') setActiveModal('revenue');
  }, [searchParams, setSearchParams]);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const [{ data: wsData }, svc, vehiclesData, driversData, dlv, members, batchData, maintenanceData, tripCostData, driverPaymentData, financialData, pendingMergeData] = await Promise.all([
        supabase.from('workspaces').select('id,name,description,province,city,phone,status,created_at,owner_user_uuid').eq('id', workspaceId).single(),
        repoGetTransportServicesByWorkspace(workspaceId),
        repoGetTransportVehiclesByWorkspace(workspaceId),
        repoGetTransportDriversByWorkspace(workspaceId),
        repoGetTransportDeliveriesByWorkspace(workspaceId),
        getWorkspaceMembers(workspaceId),
        repoListShipmentBatches(workspaceId),
        repoListMaintenanceByVehicle(workspaceId),
        repoListTripCosts(workspaceId),
        repoListDriverPayments(workspaceId),
        repoGetTransportFinancialSummary(workspaceId),
        repoListPendingMergeDeliveries(workspaceId),
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
      setPendingMergeDeliveries(pendingMergeData ?? []);
      setBatches(batchData ?? []);
      const itemsMap: Record<string, TransportShipmentBatchItemDbRow[]> = {};
      for (const batch of batchData ?? []) {
        const items = await repoListBatchItems(batch.id);
        itemsMap[batch.id] = items;
      }
      setBatchItemsMap(itemsMap);
      setMaintenanceRecords(maintenanceData ?? []);
      setTripCostRecords(tripCostData ?? []);
      setDriverPaymentRecords(driverPaymentData ?? []);
      const trackingData: Record<string, Array<{ latitude: number; longitude: number; location_name: string | null; speed: number | null; updated_at: string }>> = {};
      const activeIds = dlv.filter((d: TransportDeliveryDbRow) => d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready').map((d: TransportDeliveryDbRow) => d.id);
      await Promise.all(activeIds.map(async (id: string) => {
        const points = await repoListTrackingByDelivery(id);
        if (points.length > 0) trackingData[id] = points;
      }));
      setTrackingMap(trackingData);
      setFinancialSummary(financialData ?? null);
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

  const scheduledDeliveries = deliveries.filter((d) => d.status === 'Dikonfirmasi');

  const summary: TransportWorkspaceSummary = {
    totalKendaraan: vehicles.length,
    kendaraanTersedia: vehicles.filter((v) => v.status === 'Tersedia').length,
    kendaraanBeroperasi: vehicles.filter((v) => v.status === 'Beroperasi').length,
    totalDriver: drivers.length,
    driverAktif: drivers.filter((d) => d.status === 'Aktif').length,
    pengirimanTerjadwal: scheduledDeliveries.length,
    pengirimanMenungguGabung: pendingMergeDeliveries.length,
    pengirimanDalamProses: deliveries.filter(
      (d) => d.status === 'Pickup Ready' || d.status === 'Dalam Perjalanan' || d.status === 'Tiba'
    ).length,
    pengirimanSelesai: deliveries.filter((d) => d.status === 'Selesai').length,
    pengirimanDibatalkan: deliveries.filter((d) => d.status === 'Dibatalkan').length,
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

  const handleCompleteDelivery = async (deliveryId: string) => {
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

  const handleCreateBatch = async (data: {
    kendaraan_id?: string | null;
    driver_id?: string | null;
    tanggal?: string | null;
    jam?: string | null;
    rute?: string | null;
    kapasitas_kg?: number | null;
    biaya_perjalanan?: number | null;
    status?: string;
    catatan?: string | null;
  }) => {
    setSaveError(null);
    try {
      await repoCreateShipmentBatch({
        workspace_id: workspaceId,
        ...data,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal membuat batch');
    }
  };

  const handleAddToBatch = async (batchId: string, deliveryId: string, muatanKg: number = 0) => {
    setSaveError(null);
    try {
      const batch = batches.find(b => b.id === batchId);
      if (batch && batch.kapasitas_kg != null) {
        const items = await repoListBatchItems(batchId);
        const currentTotal = items.reduce((sum: number, item: { muatan_kg: number | null }) => sum + (item.muatan_kg ?? 0), 0);
        if (currentTotal + muatanKg > batch.kapasitas_kg) {
          setSaveError(`Kapasitas batch tidak cukup. Kapasitas: ${batch.kapasitas_kg} kg, Terpakai: ${currentTotal} kg, Sisa: ${batch.kapasitas_kg - currentTotal} kg.`);
          return;
        }
      }
      await repoAddTransactionToBatch({
        workspace_id: workspaceId,
        batch_id: batchId,
        transaction_id: deliveryId,
        muatan_kg: muatanKg,
        urutan: 0,
      });
      setSaveSuccess(true);
      setSelectedDeliveryForBatch(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menambahkan ke batch');
    }
  };

  const handleUpdateBatchStatus = async (batchId: string, status: string) => {
    setSaveError(null);
    try {
      await repoUpdateShipmentBatch(batchId, { status });
      setSaveSuccess(true);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal memperbarui status batch');
    }
  };

  const handleStartTrip = async (deliveryId: string) => {
    setSaveError(null);
    try {
      await repoUpdateTransportDeliveryStatus(deliveryId, 'Dalam Perjalanan');
      setSaveSuccess(true);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal memulai perjalanan');
    }
  };

  const handleInsertMaintenance = async (data: {
    kendaraan_id: string;
    jenis_service: string;
    tanggal: string;
    odometer_km?: number | null;
    biaya: number;
    spare_part?: string | null;
    vendor?: string | null;
    status?: string;
    catatan?: string | null;
  }) => {
    setSaveError(null);
    try {
      await repoInsertMaintenance({
        workspace_id: workspaceId,
        ...data,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal mencatat maintenance');
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    setSaveError(null);
    try {
      await repoDeleteMaintenance(id);
      setSaveSuccess(true);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menghapus maintenance');
    }
  };

  const handleInsertTripCost = async (data: {
    kendaraan_id?: string | null;
    driver_id?: string | null;
    tanggal?: string;
    kategori: string;
    nominal: number;
    catatan?: string | null;
  }) => {
    setSaveError(null);
    try {
      await repoInsertTripCost({
        workspace_id: workspaceId,
        ...data,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal mencatat biaya');
    }
  };

  const handleDeleteTripCost = async (id: string) => {
    setSaveError(null);
    try {
      await repoDeleteTripCost(id);
      setSaveSuccess(true);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menghapus biaya');
    }
  };

  const handleInsertDriverPayment = async (data: {
    driver_id: string;
    transaction_id?: string | null;
    batch_id?: string | null;
    periode: string;
    tanggal?: string;
    jenis?: string;
    nominal: number;
    status?: string;
    catatan?: string | null;
  }) => {
    setSaveError(null);
    try {
      await repoInsertDriverPayment({
        workspace_id: workspaceId,
        ...data,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal mencatat pembayaran');
    }
  };

  const handleDeleteDriverPayment = async (id: string) => {
    setSaveError(null);
    try {
      await repoDeleteDriverPayment(id);
      setSaveSuccess(true);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menghapus pembayaran');
    }
  };

  const handleInsertRevenue = async (data: {
    transaction_id: string;
    jenis?: string;
    nominal: number;
    tanggal?: string;
    status?: string;
    catatan?: string | null;
  }) => {
    setSaveError(null);
    try {
      await repoInsertRevenue({
        workspace_id: workspaceId,
        ...data,
      });
      setSaveSuccess(true);
      setActiveModal(null);
      void loadData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal mencatat pendapatan');
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

        {/* ─── TAB SWITCHER ────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '6px 6px 0',
          marginBottom: 20,
          display: 'flex',
          gap: 2,
        }}>
          {[
            { key: 'home', label: 'Home', query: '' },
            { key: 'operational', label: 'Armada', query: 'operational' },
            { key: 'financial', label: 'Keuangan', query: 'financial' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                if (t.query) params.set('tab', t.query); else params.delete('tab');
                setSearchParams(params);
                setSelectedDeliveryId(null);
                setSelectedBatchId(null);
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: (t.key === 'home' && !isArmada && !isFinancial) || (t.key === 'operational' && isArmada) || (t.key === 'financial' && isFinancial)
                  ? 'var(--color-primary-light)'
                  : 'transparent',
                color: ((t.key === 'home' && !isArmada && !isFinancial) || (t.key === 'operational' && isArmada) || (t.key === 'financial' && isFinancial))
                  ? 'var(--color-primary)'
                  : 'var(--color-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── DETAIL VIEWS ───────────────────────────────────────────── */}
        {selectedDeliveryId && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setSelectedDeliveryId(null)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                marginBottom: 10,
              }}
            >
              ← Kembali
            </button>
            {(() => {
              const dlv = deliveries.find(d => d.id === selectedDeliveryId);
              if (!dlv) return <p>Pengiriman tidak ditemukan.</p>;
              const sc = DELIVERY_STATUS_CONFIG[dlv.status as keyof typeof DELIVERY_STATUS_CONFIG] ?? DELIVERY_STATUS_CONFIG.Menunggu;
              const batchItems = batches.flatMap(b => {
                const items = batchItemsMap[b.id]?.filter(item => item.transaction_id === dlv.id) ?? [];
                return items.map(item => ({ ...item, batch: b }));
              });
              return (
                <div style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                    Detail Pengiriman
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-text)' }}>
                    <div><strong>ID:</strong> {dlv.id}</div>
                    <div><strong>Status:</strong> <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{sc.icon} {dlv.status}</span></div>
                    <div><strong>Asal:</strong> {dlv.origin ?? '-'}</div>
                    <div><strong>Tujuan:</strong> {dlv.destination ?? '-'}</div>
                    <div><strong>Tanggal:</strong> {dlv.scheduled_date ?? '-'}</div>
                    <div><strong>Jenis:</strong> {dlv.transport_type ?? '-'}</div>
                    <div><strong>Muatan:</strong> {dlv.notes ?? '-'}</div>
                    <div><strong>Fee:</strong> {dlv.fee ? `Rp ${dlv.fee.toLocaleString('id-ID')}` : '-'}</div>
                    <div><strong>Kendaraan:</strong> {dlv.vehicle_type ?? 'Belum ditentukan'}</div>
                    <div><strong>Driver:</strong> {dlv.driver_name ?? 'Belum ditentukan'}</div>
                    {batchItems.length > 0 && (
                      <div>
                        <strong>Batch:</strong>
                        {batchItems.map(item => (
                          <div key={item.id} style={{ marginLeft: 16, marginTop: 4, fontSize: 12, color: 'var(--color-muted)' }}>
                            {item.batch.rute ?? item.batch_id} · {item.batch.status} · Muatan: {item.muatan_kg ?? 0} kg
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {batchItems.length === 0 && access.canEditFleet && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => {
                          setSelectedDeliveryForBatch(dlv.id);
                          setActiveModal('addToBatch');
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: '#16a34a',
                          color: '#fff',
                        }}
                      >
                        Gabungkan ke Batch
                      </button>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                        Pengiriman ini belum masuk batch. Pilih batch yang memiliki sisa kapasitas untuk menggabungkan.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {selectedBatchId && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setSelectedBatchId(null)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                marginBottom: 10,
              }}
            >
              ← Kembali
            </button>
            {(() => {
              const batch = batches.find(b => b.id === selectedBatchId);
              if (!batch) return <p>Batch tidak ditemukan.</p>;
              const sc = TRANSPORT_BATCH_STATUS_CONFIG[batch.status as keyof typeof TRANSPORT_BATCH_STATUS_CONFIG] ?? TRANSPORT_BATCH_STATUS_CONFIG.Draft;
              const batchItems = batchItemsMap[batch.id] ?? [];
              const totalMuatan = batchItems.reduce((sum, item) => sum + (item.muatan_kg ?? 0), 0);
              const sisaKapasitas = batch.kapasitas_kg != null ? batch.kapasitas_kg - totalMuatan : null;
              return (
                <div style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                    Detail Batch
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-text)' }}>
                    <div><strong>ID:</strong> {batch.id}</div>
                    <div><strong>Status:</strong> <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{sc.icon} {sc.label}</span></div>
                    <div><strong>Rute:</strong> {batch.rute ?? '-'}</div>
                    <div><strong>Tanggal:</strong> {batch.tanggal ?? '-'} {batch.jam ? `· ${batch.jam}` : ''}</div>
                    <div><strong>Kendaraan:</strong> {batch.kendaraan_id ?? '-'}</div>
                    <div><strong>Driver:</strong> {batch.driver_id ?? '-'}</div>
                    <div><strong>Kapasitas:</strong> {batch.kapasitas_kg ?? '-'} kg</div>
                    <div><strong>Total Muatan:</strong> {totalMuatan} kg</div>
                    <div><strong>Sisa Kapasitas:</strong> {sisaKapasitas != null ? `${sisaKapasitas} kg` : '-'}</div>
                    <div><strong>Biaya Perjalanan:</strong> Rp {batch.biaya_perjalanan.toLocaleString('id-ID')}</div>
                    {batch.catatan && <div><strong>Catatan:</strong> {batch.catatan}</div>}
                    <div style={{ marginTop: 8 }}>
                      <strong>Pengiriman dalam Batch ({batchItems.length}):</strong>
                      {batchItems.length === 0 ? (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>Belum ada pengiriman.</p>
                      ) : (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {batchItems.map(item => {
                            const d = deliveries.find(d => d.id === item.transaction_id);
                            return (
                              <div key={item.id} style={{
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 8,
                                padding: '8px 12px',
                                cursor: 'pointer',
                              }} onClick={() => { setSelectedBatchId(null); setSelectedDeliveryId(item.transaction_id); }}>
                                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-text)' }}>{item.transaction_id}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                                  {d?.origin ?? '-'} → {d?.destination ?? '-'} · {item.muatan_kg ?? 0} kg
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

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

            <TransportTrackingSection
              activeDeliveries={deliveries.filter((d) => d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready').map((d) => ({
                id: d.id,
                origin: d.origin ?? '-',
                destination: d.destination ?? '-',
                status: d.status,
              }))}
              trackingMap={trackingMap}
            />

            <TransportMaintenanceSection
              records={maintenanceRecords}
              canEdit={access.canEditFleet}
              onAdd={() => setActiveModal('maintenance')}
              onDelete={handleDeleteMaintenance}
            />
          </>
        ) : isFinancial ? (
          /* ─── KEUANGAN: Financial Overview ─────────────────────────── */
          <>
            {financialSummary && (
              <TransportFinancialSection summary={financialSummary} />
            )}

            <TransportTripCostSection
              records={tripCostRecords}
              canEdit={access.canViewFinancial}
              onAdd={() => setActiveModal('tripCost')}
              onDelete={handleDeleteTripCost}
            />

            <TransportDriverPaymentSection
              records={driverPaymentRecords}
              canEdit={access.canViewFinancial}
              onAdd={() => setActiveModal('driverPayment')}
              onDelete={handleDeleteDriverPayment}
            />
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
              </div>
            </div>

            <TransportPendingMergeSection
              pendingDeliveries={pendingMergeDeliveries}
              onCreateBatch={() => setActiveModal('batch')}
              onAddToBatch={(deliveryId) => setSelectedDeliveryForBatch(deliveryId)}
              onViewDelivery={(deliveryId) => setSelectedDeliveryId(deliveryId)}
              canEdit={access.canEditFleet}
            />

            <TransportShipmentBatchSection
              batches={batches}
              canEdit={access.canEditFleet}
              onUpdateStatus={handleUpdateBatchStatus}
              onViewBatch={(batchId) => setSelectedBatchId(batchId)}
            />

            <TransportScheduleSection
              scheduledDeliveries={scheduledDeliveries}
              canEdit={access.canEditFleet}
              onStartTrip={handleStartTrip}
              onViewDelivery={(deliveryId) => setSelectedDeliveryId(deliveryId)}
            />

            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Pengiriman Aktif
              </p>
              {deliveries.filter((d) => d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready').length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
                  Tidak ada pengiriman aktif.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deliveries.filter((d) => d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready').map((dlv) => {
                    const sc = DELIVERY_STATUS_CONFIG[dlv.status as keyof typeof DELIVERY_STATUS_CONFIG] ?? DELIVERY_STATUS_CONFIG.Menunggu;
                    return (
                      <div key={dlv.id} style={{
                        background: 'var(--color-bg)',
                        border: `1px solid ${sc.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }} onClick={() => setSelectedDeliveryId(dlv.id)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                            {dlv.id}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                            {dlv.origin} → {dlv.destination}
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
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }} onClick={() => setSelectedDeliveryId(dlv.id)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                            {dlv.transportType}
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

            {access.canViewFinancial && financialSummary && (
              <TransportFinancialSection summary={financialSummary} />
            )}
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
      {activeModal === 'batch' && (
        <CreateShipmentBatchModal
          vehicles={vehicles.map(v => ({ id: v.id, nomor_polisi: v.nomor_polisi }))}
          drivers={drivers.map(d => ({ id: d.id, nama: d.nama }))}
          onSave={handleCreateBatch}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'addToBatch' && (
        <AddToBatchModal
          delivery={selectedDeliveryForBatch ? deliveries.find(d => d.id === selectedDeliveryForBatch) ?? null : null}
          batches={batches}
          batchCurrentLoads={Object.fromEntries(
            Object.entries(batchItemsMap).map(([bId, items]) => [
              bId,
              items.reduce((sum, item) => sum + (item.muatan_kg ?? 0), 0),
            ])
          )}
          onAdd={handleAddToBatch}
          onClose={() => { setActiveModal(null); setSelectedDeliveryForBatch(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'maintenance' && (
        <MaintenanceModal
          vehicles={vehicles.map(v => ({ id: v.id, nomor_polisi: v.nomor_polisi }))}
          onSave={handleInsertMaintenance}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'tripCost' && (
        <TripCostModal
          vehicles={vehicles.map(v => ({ id: v.id, nomor_polisi: v.nomor_polisi }))}
          drivers={drivers.map(d => ({ id: d.id, nama: d.nama }))}
          onSave={handleInsertTripCost}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'driverPayment' && (
        <DriverPaymentModal
          drivers={drivers.map(d => ({ id: d.id, nama: d.nama }))}
          onSave={handleInsertDriverPayment}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
      {activeModal === 'revenue' && (
        <RevenueModal
          deliveries={deliveries.map(d => ({ id: d.id, origin: d.origin ?? '-', destination: d.destination ?? '-' }))}
          onSave={handleInsertRevenue}
          onClose={() => { setActiveModal(null); setSearchParams((prev) => { prev.delete('action'); return prev; }); }}
        />
      )}
    </div>
  );
}
