// ─── Veterinary Workspace Page (VET-001 / VET-002) ────────────────────────────
// Route: /workspace/:id/veterinary
// Public + operational veterinary workspace profile.
// Access-gated: vet details (phone/notes), activity history, financials.
// NO diagnosis · NO prescriptions · NO medical records · NO telemedicine.

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getVetWorkspaceMeta,
  getVeterinariansByWorkspace,
  getServiceCatalogByWorkspace,
  getVetServiceAreasByWorkspace,
  getActivitiesByWorkspace,
  getVetWorkspaceSummary,
  deriveVetAccess,
  type ActivityStatus,
  type VetServiceType,
} from '../data/veterinaryWorkspaceData';

import VeterinaryHeader from '../components/workspace/VeterinaryHeader';
import VeterinarySummary from '../components/workspace/VeterinarySummary';
import VeterinaryDoctorSection from '../components/workspace/VeterinaryDoctorSection';
import VeterinaryServiceSection from '../components/workspace/VeterinaryServiceSection';
import VeterinaryScheduleSection from '../components/workspace/VeterinaryScheduleSection';
import VeterinaryPatientSection from '../components/workspace/VeterinaryPatientSection';
import VeterinaryActionBar from '../components/workspace/VeterinaryActionBar';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VeterinaryWorkspace() {
  const { id: workspaceId = 'w5' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const meta       = getVetWorkspaceMeta(workspaceId);
  const access     = deriveVetAccess(workspaceId, currentUser?.id ?? null);
  const summary    = getVetWorkspaceSummary(workspaceId);
  const vets       = getVeterinariansByWorkspace(workspaceId);
  const services   = getServiceCatalogByWorkspace(workspaceId);
  const areas      = getVetServiceAreasByWorkspace(workspaceId);
  const activities = getActivitiesByWorkspace(workspaceId);

  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'Semua'>('Semua');
  const [typeFilter,   setTypeFilter]   = useState<VetServiceType | 'Semua'>('Semua');

  const filteredActivities = activities.filter((a) => {
    const byStatus = statusFilter === 'Semua' || a.status === statusFilter;
    const byType   = typeFilter   === 'Semua' || a.tipeLayanan === typeFilter;
    return byStatus && byType;
  });

  if (!meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🩺</p>
        <p style={{ fontWeight: 700 }}>Workspace veteriner tidak ditemukan.</p>
        <p style={{ fontSize: 13 }}>ID: {workspaceId}</p>
      </div>
    );
  }

  const roleLabel: Record<typeof access.role, { text: string; icon: string; color: string; bg: string }> = {
    owner:          { text: 'Owner Workspace',    icon: '👑', color: '#92400e', bg: '#fef3c7' },
    admin:          { text: 'Admin Workspace',    icon: '🔑', color: '#1e40af', bg: '#dbeafe' },
    member:         { text: 'Anggota Workspace',  icon: '👤', color: '#166534', bg: '#dcfce7' },
    public:         { text: 'Pengunjung Publik',  icon: '👁',  color: '#5d4037', bg: '#efebe9' },
    platform_admin: { text: 'Platform Admin',     icon: '🛡️', color: '#6d28d9', bg: '#ede9fe' },
  };
  const rl = roleLabel[access.role];

  const tipeLabel = meta.tipeWorkspace === 'DokterHewan' ? 'Dokter Hewan' : 'Klinik Hewan';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── 1. HEADER ─────────────────────────────────────────────────── */}
        <VeterinaryHeader meta={meta} tipeLabel={tipeLabel} roleLabel={rl} />

        {/* ─── 2. SUMMARY CARDS ──────────────────────────────────────────── */}
        <VeterinarySummary summary={summary} />

        {/* ─── 3. VETERINARIAN LIST ──────────────────────────────────────── */}
        <VeterinaryDoctorSection vets={vets} access={access} />

        {/* ─── 4. SERVICES ───────────────────────────────────────────────── */}
        <VeterinaryServiceSection services={services} />

        {/* ─── 5. SERVICE AREAS ──────────────────────────────────────────── */}
        <VeterinaryScheduleSection areas={areas} />

        {/* ─── 6. ACTIVITY HISTORY ───────────────────────────────────────── */}
        <VeterinaryPatientSection
          activities={activities}
          filteredActivities={filteredActivities}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
          access={access}
        />

        {/* ─── 7. RESERVED ACTIONS ───────────────────────────────────────── */}
        <VeterinaryActionBar access={access} />

      </div>
    </div>
  );
}
