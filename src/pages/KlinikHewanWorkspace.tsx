// ─── Klinik Hewan Workspace Page (CLN-001 / CLN-002) ──────────────────────────
// Route: /workspace/:id/clinic
// Public + operational klinik hewan workspace profile.
// Access-gated: staff contacts, visit history, financials.
// NO diagnosis · NO prescriptions · NO medical records · NO telemedicine.

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getClinicWorkspaceMeta,
  getClinicStaffByWorkspace,
  getClinicVisitsByWorkspace,
  getClinicWorkspaceSummary,
  deriveClinicAccess,
  type ClinicVisitStatus,
  type ClinicKategori,
} from '../data/clinicWorkspaceData';
import { getLayananKlinikHewanByWorkspace } from '../data/layananKlinikHewanData';

import ClinicHeader from '../components/workspace/ClinicHeader';
import ClinicSummary from '../components/workspace/ClinicSummary';
import ClinicStaffSection from '../components/workspace/ClinicStaffSection';
import ClinicServiceSection from '../components/workspace/ClinicServiceSection';
import ClinicScheduleSection from '../components/workspace/ClinicScheduleSection';
import ClinicPatientSection from '../components/workspace/ClinicPatientSection';
import ClinicActionBar from '../components/workspace/ClinicActionBar';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KlinikHewanWorkspace() {
  const { id: workspaceId = 'w6' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const meta     = getClinicWorkspaceMeta(workspaceId);
  const access   = deriveClinicAccess(workspaceId, currentUser?.id ?? null);
  const summary  = getClinicWorkspaceSummary(workspaceId);
  const staff    = getClinicStaffByWorkspace(workspaceId);
  const services = getLayananKlinikHewanByWorkspace(workspaceId);
  const visits   = getClinicVisitsByWorkspace(workspaceId);

  const [statusFilter,   setStatusFilter]   = useState<ClinicVisitStatus | 'Semua'>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState<ClinicKategori | 'Semua'>('Semua');

  const filteredVisits = visits.filter((v) => {
    const byStatus   = statusFilter   === 'Semua' || v.status    === statusFilter;
    const byKategori = kategoriFilter === 'Semua' || v.kategori  === kategoriFilter;
    return byStatus && byKategori;
  });

  if (!meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🏥</p>
        <p style={{ fontWeight: 700 }}>Workspace klinik hewan tidak ditemukan.</p>
        <p style={{ fontSize: 13 }}>ID: {workspaceId}</p>
      </div>
    );
  }

  const roleLabel: Record<typeof access.role, { text: string; icon: string; color: string; bg: string }> = {
    owner:          { text: 'Owner Workspace',   icon: '👑', color: '#92400e', bg: '#fef3c7' },
    admin:          { text: 'Admin Workspace',   icon: '🔑', color: '#1e40af', bg: '#dbeafe' },
    member:         { text: 'Anggota Workspace', icon: '👤', color: '#166534', bg: '#dcfce7' },
    public:         { text: 'Pengunjung Publik', icon: '👁',  color: '#5d4037', bg: '#efebe9' },
    platform_admin: { text: 'Platform Admin',    icon: '🛡️', color: '#6d28d9', bg: '#ede9fe' },
  };
  const rl = roleLabel[access.role];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── 1. HEADER ─────────────────────────────────────────────────── */}
        <ClinicHeader meta={meta} roleLabel={rl} />

        {/* ─── 2. SUMMARY CARDS ──────────────────────────────────────────── */}
        <ClinicSummary summary={summary} />

        {/* ─── 3. STAFF LIST ─────────────────────────────────────────────── */}
        <ClinicStaffSection staff={staff} access={access} />

        {/* ─── 4. SERVICES ───────────────────────────────────────────────── */}
        <ClinicServiceSection services={services} />

        {/* ─── 5. CLINIC INFO & SCHEDULE ─────────────────────────────────── */}
        <ClinicScheduleSection meta={meta} />

        {/* ─── 6. VISIT HISTORY ──────────────────────────────────────────── */}
        <ClinicPatientSection
          visits={visits}
          filteredVisits={filteredVisits}
          statusFilter={statusFilter}
          kategoriFilter={kategoriFilter}
          onStatusFilterChange={setStatusFilter}
          onKategoriFilterChange={setKategoriFilter}
          access={access}
        />

        {/* ─── 7. RESERVED ACTIONS ───────────────────────────────────────── */}
        <ClinicActionBar access={access} />

      </div>
    </div>
  );
}
