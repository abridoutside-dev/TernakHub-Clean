// ─── KlinikHewanOperational — ADMIN-SYNC-007 ─────────────────────────────────
// Dashboard Operasional khusus Workspace Klinik Hewan.
// Dipilih oleh workspaceOperationalRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase):
//   LIVE → workspaces, health_checkups, health_treatments, health_control_schedules, activity_log
//
// Domain yang tersedia:
//   LIVE → Pasien, Pemeriksaan, Kunjungan, Diagnosis, Tindakan, Resep/Obat, Jadwal, Transaksi, Laporan
//   NOT_IMPLEMENTED → AI Insight Veterinary
//
// Blocked Modules (dependency platform belum tersedia):
//   - Tim Dokter & Staf    → tidak ada tabel clinic_staff di Supabase
//   - Katalog Layanan      → tidak ada tabel clinic_services di Supabase
//   - Fasilitas Klinik     → tidak ada tabel clinic_facilities di Supabase

import React from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  useVeterinaryDashboardData,
  getUpcomingSchedules,
  getDiagnosedCheckups,
  getUniquePasienCount,
  getDrugTreatments,
  getTransaksiWithCost,
  getTotalBiaya,
  formatNumber,
  formatRupiah,
} from '../../hooks/useVeterinaryDashboardData';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspacePageHeader,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';

// ─── Tema warna Klinik Hewan ──────────────────────────────────────────────────

const COLORS = {
  primary:      '#7b1fa2',
  bg:           '#f3e5f5',
  text:         '#4a148c',
  border:       '#ce93d8',
} as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[72, 120, 110].map((h) => (
        <div
          key={h}
          style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KlinikHewanOperational(): React.ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();

  const config          = getWorkspaceOperationalConfig('KlinikHewan');
  const dashboardConfig = getWorkspaceDashboardConfig('KlinikHewan');
  const { data, loading, error } = useVeterinaryDashboardData(workspaceId);

  const workspaceName = data.workspace?.workspace_name ?? config.title;

  // ── LIVE counts dari tabel health_* ───────────────────────────────────────
  const pasienCount     = getUniquePasienCount(data.checkups);
  const checkupCount    = data.checkups.length;
  const diagnosisCount  = getDiagnosedCheckups(data.checkups).length;
  const treatmentCount  = data.treatments.length;
  const drugCount       = getDrugTreatments(data.treatments).length;
  const jadwalCount     = data.schedules.length;
  const jadwalAktif     = getUpcomingSchedules(data.schedules).length;
  const transaksiCount  = getTransaksiWithCost(data.treatments).length;
  const totalBiaya      = getTotalBiaya(data.treatments);

  const laporanSummary = `${checkupCount} kunjungan · ${treatmentCount} tindakan · ${jadwalCount} jadwal`;

  type SectionStatus = 'live' | 'not_implemented' | 'blocked';

  interface OperationalSection {
    id:          string;
    icon:        string;
    title:       string;
    description: string;
    count:       string;
    status:      SectionStatus;
  }

  const OPERATIONAL_SECTIONS: OperationalSection[] = [
    {
      id:          'pasien',
      icon:        '🐄',
      title:       'Pasien',
      description: 'Pasien unik yang pernah berkunjung (health_checkups.livestock_id distinct).',
      count:       `${formatNumber(pasienCount)} pasien unik`,
      status:      'live',
    },
    {
      id:          'kunjungan',
      icon:        '🏥',
      title:       'Kunjungan',
      description: 'Seluruh kunjungan pasien tercatat (health_checkups).',
      count:       `${formatNumber(checkupCount)} kunjungan`,
      status:      'live',
    },
    {
      id:          'pemeriksaan',
      icon:        '🩺',
      title:       'Pemeriksaan',
      description: 'Riwayat pemeriksaan klinis dari health_checkups.',
      count:       `${formatNumber(checkupCount)} pemeriksaan`,
      status:      'live',
    },
    {
      id:          'diagnosis',
      icon:        '🔬',
      title:       'Diagnosis',
      description: 'Pemeriksaan dengan diagnosis terisi (health_checkups.diagnosis != null).',
      count:       `${formatNumber(diagnosisCount)} terdiagnosis`,
      status:      'live',
    },
    {
      id:          'tindakan',
      icon:        '💉',
      title:       'Tindakan',
      description: 'Seluruh tindakan medis dari health_treatments.',
      count:       `${formatNumber(treatmentCount)} tindakan`,
      status:      'live',
    },
    {
      id:          'resep-obat',
      icon:        '💊',
      title:       'Resep & Obat',
      description: 'Tindakan dengan pemberian obat (health_treatments.drug_name atau drug_id).',
      count:       `${formatNumber(drugCount)} pemberian obat`,
      status:      'live',
    },
    {
      id:          'jadwal',
      icon:        '📅',
      title:       'Jadwal',
      description: 'Jadwal kontrol & tindak lanjut (health_control_schedules).',
      count:       `${formatNumber(jadwalAktif)} aktif · ${formatNumber(jadwalCount)} total`,
      status:      'live',
    },
    {
      id:          'transaksi',
      icon:        '💰',
      title:       'Transaksi',
      description: 'Tindakan berbayar (health_treatments.cost > 0).',
      count:       `${formatNumber(transaksiCount)} catatan · ${formatRupiah(totalBiaya)}`,
      status:      'live',
    },
    {
      id:          'laporan',
      icon:        '📊',
      title:       'Laporan',
      description: 'Ringkasan data operasional klinik dari seluruh modul LIVE.',
      count:       laporanSummary,
      status:      'live',
    },
    {
      id:          'ai-insight',
      icon:        '🤖',
      title:       'AI Insight',
      description: 'Analisis berbasis data platform — belum diintegrasikan.',
      count:       'not_implemented',
      status:      'not_implemented',
    },
  ];

  // ── Blocked Modules (dependency platform belum tersedia) ──────────────────
  const BLOCKED_MODULES = [
    {
      id:         'tim-dokter',
      icon:       '👨‍⚕️',
      title:      'Tim Dokter & Staf',
      reason:     'Tidak ada tabel clinic_staff atau vet_staff di Supabase. Data staf klinik saat ini disimpan di data layer statis.',
      dependency: 'Tabel: clinic_staff (workspace_id, nama, gelar, peran, spesialisasi, nomorSIPP, status, jadwal_piket)',
      priority:   'high' as const,
    },
    {
      id:         'katalog-layanan',
      icon:       '📋',
      title:      'Katalog Layanan',
      reason:     'Tidak ada tabel clinic_services di Supabase. Layanan klinik saat ini disimpan di data layer statis.',
      dependency: 'Tabel: clinic_services (workspace_id, tipe_layanan, nama_layanan, harga, estimasi_durasi)',
      priority:   'medium' as const,
    },
    {
      id:         'fasilitas',
      icon:       '🏗️',
      title:      'Fasilitas Klinik',
      reason:     'Tidak ada tabel untuk merekam fasilitas fisik klinik. Data fasilitas disimpan di data layer statis.',
      dependency: 'Tabel: clinic_facilities (workspace_id, nama_fasilitas, kapasitas, status)',
      priority:   'low' as const,
    },
  ];

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <WorkspacePageHeader
        icon={config.icon}
        label="Dashboard Operasional"
        title={workspaceName}
        subtitle={config.subtitle}
        accentColor={COLORS.primary}
        iconBg={COLORS.bg}
      />

      {/* ── Error Banner ── */}
      {error !== null && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '10px 14px', marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>
            ⚠️ Gagal memuat sebagian data: {error}
          </p>
        </div>
      )}

      {/* ── Quick Action ── */}
      {dashboardConfig.quickActions.length > 0 && (
        <section style={{
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#3b0764' }}>Quick Action</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: COLORS.text }}>Akses cepat operasional klinik</p>
            </div>
            <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
          </div>
          <WorkspaceQuickActions
            actions={dashboardConfig.quickActions}
            workspaceId={workspaceId}
            cols={Math.min(dashboardConfig.quickActions.length, 4)}
            colors={{ bg: '#fff', border: COLORS.border, text: COLORS.text, accent: COLORS.primary }}
          />
        </section>
      )}

      {/* ── Ringkasan Cepat ── */}
      {!loading && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle title="Ringkasan Data" action="Live" accentColor={COLORS.primary} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { label: 'Pasien unik',  value: formatNumber(pasienCount),    icon: '🐄', color: COLORS.text, bg: COLORS.bg },
              { label: 'Kunjungan',    value: formatNumber(checkupCount),   icon: '🏥', color: '#1d4ed8',   bg: '#eff6ff' },
              { label: 'Tindakan',     value: formatNumber(treatmentCount), icon: '💉', color: '#166534',   bg: '#f0fdf4' },
            ].map((item) => (
              <div
                key={item.label}
                style={{ background: item.bg, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 18 }}>{item.icon}</div>
                <div style={{ marginTop: 3, fontSize: 17, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}

      {loading && <LoadingSkeleton />}

      {/* ── Grid Seksi Operasional ── */}
      {!loading && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}>
          {OPERATIONAL_SECTIONS.map((section) => {
            const isNotImplemented = section.status === 'not_implemented';
            const isLive           = section.status === 'live';

            const borderColor = isNotImplemented ? '#c7d2fe' : COLORS.border;
            const bgColor     = isNotImplemented ? '#eef2ff' : 'var(--color-surface)';

            const badgeColor = isNotImplemented
              ? { color: '#4338ca', bg: '#e0e7ff' }
              : { color: COLORS.primary, bg: COLORS.bg };

            const badgeLabel = isNotImplemented ? 'not_implemented' : 'live';

            return (
              <div
                key={section.id}
                style={{
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 'var(--radius-md)',
                  background: bgColor,
                  padding: 13,
                  minHeight: 108,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 23 }}>{section.icon}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: badgeColor.color, background: badgeColor.bg,
                    padding: '2px 6px', borderRadius: 5,
                  }}>
                    {badgeLabel}
                  </span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                  {section.title}
                </p>
                {isLive ? (
                  <>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: COLORS.text, fontWeight: 600, lineHeight: 1.35 }}>
                      {section.count}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 9, color: 'var(--color-muted)', lineHeight: 1.35 }}>
                      {section.description}
                    </p>
                  </>
                ) : (
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.35 }}>
                    {section.description}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Blocked Modules Panel ── */}
      {!loading && BLOCKED_MODULES.length > 0 && (
        <WorkspaceCard style={{ borderColor: '#fbbf24', background: '#fffbeb' }}>
          <WorkspaceSectionTitle
            title="Modul Tertunda"
            action={`${BLOCKED_MODULES.length} modul`}
            accentColor="#b45309"
          />
          <p style={{ margin: '0 0 12px', fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
            Modul-modul berikut membutuhkan tabel Supabase tambahan yang belum tersedia di platform.
            Tidak ada data dummy — widget hanya ditampilkan jika tabel tersedia.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BLOCKED_MODULES.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 9,
                  background: '#fff', border: '1px solid #fde68a',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                      {m.title}
                    </p>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#92400e', background: '#fed7aa',
                      padding: '1px 5px', borderRadius: 4,
                    }}>
                      {m.priority === 'high' ? 'TINGGI' : m.priority === 'medium' ? 'SEDANG' : 'RENDAH'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 3px', fontSize: 10, color: '#92400e', lineHeight: 1.4 }}>
                    <strong>Alasan:</strong> {m.reason}
                  </p>
                  <p style={{ margin: 0, fontSize: 9, color: '#b45309', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                    Dependency: {m.dependency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}
    </main>
  );
}
