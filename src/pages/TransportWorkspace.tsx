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
  addVehicle,
  assignDriverToVehicle,
  createDelivery,
  updateDeliveryStatus,
  completeDelivery,
  type DeliveryStatus,
  type TransportServiceType,
} from '../data/transportWorkspaceData';

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
  const { id: workspaceId = 'w4' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const meta      = getTransportWorkspaceMeta(workspaceId);
  const access    = deriveTransportAccess(workspaceId, currentUser?.id ?? null);
  const summary   = getTransportWorkspaceSummary(workspaceId);
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

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      {activeModal === 'vehicle' && (
        <AddVehicleModal
          onSave={(data) => { addVehicle(workspaceId, data); refresh(); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'driver' && (
        <AddDriverModal
          drivers={drivers}
          vehicles={vehicles}
          onSave={(driverId, vehicleId) => { assignDriverToVehicle(driverId, vehicleId); refresh(); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'delivery' && (
        <CreateDeliveryModal
          vehicles={vehicles}
          drivers={drivers}
          onSave={(data) => { createDelivery(workspaceId, data); refresh(); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'status' && (
        <UpdateDeliveryStatusModal
          deliveries={deliveries}
          onSave={(deliveryId, newStatus) => { updateDeliveryStatus(deliveryId, newStatus); refresh(); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'complete' && (
        <CompleteDeliveryModal
          deliveries={deliveries}
          onSave={(deliveryId, tanggalSelesai) => { completeDelivery(deliveryId, tanggalSelesai); refresh(); }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
