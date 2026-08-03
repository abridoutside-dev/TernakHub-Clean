// ─── DokterHewanDashboard — ADMIN-SYNC-007 ────────────────────────────────────
// Dashboard Home khusus Workspace Dokter Hewan.
// Dipilih oleh workspaceDashboardRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase):
//   LIVE → workspaces (nama workspace)
//   LIVE → health_checkups (Pemeriksaan, Pasien, Kunjungan, Diagnosis)
//   LIVE → health_treatments (Tindakan, Resep, Obat)
//   LIVE → health_control_schedules (Jadwal)
//   LIVE → activity_log (Aktivitas workspace)
//   NOT_IMPLEMENTED → AI Insight

import React from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  useVeterinaryDashboardData,
  getUpcomingSchedules,
  getDiagnosedCheckups,
  getUniquePasienCount,
  formatNumber,
  formatRupiah,
  formatRelativeTime,
  formatTanggal,
  getTotalBiaya,
} from '../../hooks/useVeterinaryDashboardData';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';
import type { HealthCheckupDbRow, HealthControlScheduleDbRow } from '../../types/health';
import type { ActivityLogDbRow } from '../../types/activityLog';

// ─── Tema warna Dokter Hewan ──────────────────────────────────────────────────

const COLORS = {
  primary:      '#ad1457',
  bg:           '#fce4ec',
  text:         '#880e4f',
  border:       '#f48fb1',
  actionBg:     '#fce4ec',
  actionText:   '#880e4f',
  actionBorder: '#f48fb1',
} as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[72, 120, 110, 160].map((h) => (
        <div
          key={h}
          style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }}
        />
      ))}
    </div>
  );
}

// ─── Ringkasan Stats Card — LIVE ──────────────────────────────────────────────

function RingkasanCard({
  checkupCount,
  pasienCount,
  jadwalCount,
  diagnosisCount,
}: {
  checkupCount: number;
  pasienCount: number;
  jadwalCount: number;
  diagnosisCount: number;
}) {
  const items = [
    { value: formatNumber(checkupCount), label: 'Pemeriksaan',     icon: '🩺', color: COLORS.text,  bg: COLORS.bg  },
    { value: formatNumber(pasienCount),  label: 'Pasien Unik',     icon: '🐄', color: '#0e7490',    bg: '#cffafe'  },
    { value: formatNumber(jadwalCount),  label: 'Jadwal Mendatang', icon: '📅', color: '#1d4ed8',    bg: '#dbeafe'  },
    { value: formatNumber(diagnosisCount), label: 'Terdiagnosis',  icon: '🔬', color: '#166534',    bg: '#dcfce7'  },
  ];

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Kasus" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {items.map((item) => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: 13 }}>
            <p style={{ margin: 0, fontSize: 11, color: item.color, fontWeight: 700 }}>
              {item.icon} {item.label}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: 22, fontWeight: 800, color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {checkupCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada pemeriksaan tercatat. Data akan muncul setelah pemeriksaan pertama dicatat.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Pemeriksaan Terbaru Card — LIVE ──────────────────────────────────────────

const HEALTH_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Sehat:            { color: '#166534', bg: '#dcfce7' },
  Sakit:            { color: '#991b1b', bg: '#fee2e2' },
  'Dalam Perawatan': { color: '#b45309', bg: '#fef3c7' },
  Karantina:        { color: '#6d28d9', bg: '#ede9fe' },
  Pemantauan:       { color: '#1d4ed8', bg: '#dbeafe' },
};

function PemeriksaanTerbaruCard({ checkups }: { checkups: HealthCheckupDbRow[] }) {
  const recent = checkups.slice(0, 5);

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Pemeriksaan Terbaru"
        action={checkups.length > 0 ? `${checkups.length} total` : 'Live'}
        accentColor={COLORS.primary}
      />
      {recent.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada pemeriksaan. Catat pemeriksaan pertama untuk memulai.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {recent.map((c) => {
            const sc = HEALTH_STATUS_CFG[c.health_status] ?? { color: '#6b7280', bg: '#f3f4f6' };
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 11px', borderRadius: 10,
                  background: '#fdf2f8', border: `1px solid ${COLORS.border}`,
                }}
              >
                <span style={{ fontSize: 18 }}>🩺</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.examiner ?? 'Pemeriksa tidak dicatat'} · {formatTanggal(c.checkup_date)}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {c.findings ? c.findings.slice(0, 60) + (c.findings.length > 60 ? '…' : '') : 'Tidak ada catatan temuan'}
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: sc.color, background: sc.bg,
                  padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                }}>
                  {c.health_status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Jadwal Mendatang Card — LIVE ─────────────────────────────────────────────

function JadwalMendatangCard({ schedules }: { schedules: HealthControlScheduleDbRow[] }) {
  const upcoming = getUpcomingSchedules(schedules).slice(0, 5);

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Jadwal Mendatang"
        action={upcoming.length > 0 ? `${upcoming.length} jadwal` : 'Live'}
        accentColor={COLORS.primary}
      />
      {upcoming.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          ✅ Tidak ada jadwal kontrol mendatang
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 11px', borderRadius: 10,
                background: '#eff6ff', border: '1px solid #bfdbfe',
              }}
            >
              <span style={{ fontSize: 18 }}>📅</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.schedule_type ?? 'Kontrol Rutin'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                  {formatTanggal(s.scheduled_date)}
                  {s.notes ? ` · ${s.notes.slice(0, 40)}` : ''}
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#1d4ed8',
                background: '#dbeafe', padding: '2px 6px', borderRadius: 5, flexShrink: 0,
              }}>
                Terjadwal
              </span>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Ringkasan Tindakan Card — LIVE ───────────────────────────────────────────

function RingkasanTindakanCard({
  treatmentCount,
  drugCount,
  totalBiaya,
}: { treatmentCount: number; drugCount: number; totalBiaya: number }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Tindakan & Obat" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          { value: formatNumber(treatmentCount), label: 'Total tindakan', icon: '💉', color: COLORS.text, bg: COLORS.bg },
          { value: formatNumber(drugCount),      label: 'Pemberian obat', icon: '💊', color: '#7c3aed',   bg: '#f5f3ff' },
          { value: formatRupiah(totalBiaya),     label: 'Total biaya',    icon: '💰', color: '#166534',   bg: '#dcfce7' },
        ].map((item) => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{item.icon}</div>
            <div style={{ marginTop: 3, fontSize: item.label === 'Total biaya' ? 12 : 17, fontWeight: 800, color: item.color, wordBreak: 'break-word' }}>
              {item.value}
            </div>
            <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>
      {treatmentCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada tindakan tercatat.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Aktivitas Terkini Card — LIVE ────────────────────────────────────────────

function ActivityIcon(domain: string, action: string): string {
  if (action === 'CREATE') return '➕';
  if (action === 'UPDATE') return '✏️';
  if (action === 'DELETE') return '🗑️';
  if (domain === 'veterinary' || domain === 'health') return '🩺';
  if (domain === 'platform') return '⚙️';
  return '📋';
}

function RecentActivityCard({ activities }: { activities: ActivityLogDbRow[] }) {
  return (
    <WorkspaceCard>
      <WorkspaceSectionTitle title="Aktivitas Terkini" action="Live" accentColor={COLORS.primary} />
      {activities.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada aktivitas yang tercatat
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: COLORS.bg,
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {ActivityIcon(activity.domain, activity.action)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activity.description ?? `${activity.action} · ${activity.entity_type}`}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                  {activity.domain} · {activity.module}
                </p>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── AI Insight Widget — not_implemented ──────────────────────────────────────

function AiInsightWidget() {
  return (
    <WorkspaceCard style={{ borderColor: '#c7d2fe', background: '#eef2ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#312e81' }}>AI Insight Dokter Hewan</h2>
          <span style={{
            display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700,
            color: '#4338ca', background: '#e0e7ff', padding: '2px 7px', borderRadius: 6,
          }}>
            not_implemented
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#4338ca', lineHeight: 1.6 }}>
        Widget AI Insight tersedia untuk diaktifkan. Analisis akan mengonsumsi data platform
        (health_checkups, health_treatments, health_control_schedules) dan memanggil AI service
        yang akan diintegrasikan kemudian.
      </p>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          'Pola penyakit berulang berdasarkan health_checkups.diagnosis',
          'Efektivitas tindakan medis berdasarkan health_treatments',
          'Prediksi jadwal kontrol optimal dari health_control_schedules',
          'Ringkasan tren kesehatan kawanan per periode',
        ].map((item) => (
          <div key={item} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>◦</span>
            <span style={{ fontSize: 11, color: '#4338ca' }}>{item}</span>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DokterHewanDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = '' } = useParams<{ id: string }>();

  const dashboardConfig = getWorkspaceDashboardConfig('DokterHewan');
  const { data, loading, error } = useVeterinaryDashboardData(routeWorkspaceId);

  const workspaceName = data.workspace?.workspace_name ?? dashboardConfig.title;

  const upcomingSchedules = getUpcomingSchedules(data.schedules);
  const diagnosedCheckups = getDiagnosedCheckups(data.checkups);
  const pasienCount       = getUniquePasienCount(data.checkups);
  const totalBiaya        = getTotalBiaya(data.treatments);
  const drugCount         = data.treatments.filter((t) => t.drug_name !== null || t.drug_id !== null).length;

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: COLORS.bg,
            display: 'grid', placeItems: 'center', fontSize: 27,
          }}>
            {dashboardConfig.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 11, color: COLORS.primary,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7,
            }}>
              Dashboard Home
            </p>
            <h1 style={{
              margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)',
              fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {workspaceName}
            </h1>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Ringkasan praktik dokter hewan — pemeriksaan, tindakan, jadwal, dan aktivitas workspace secara real-time.
        </p>
      </header>

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

      {/* ── Loading ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Content ── */}
      {!loading && (
        <>
          {/* Quick Action */}
          {dashboardConfig.quickActions.length > 0 && (
            <WorkspaceCard style={{ marginBottom: 14 }}>
              <WorkspaceSectionTitle title="Quick Action" accentColor={COLORS.primary} />
              <WorkspaceQuickActions
                actions={dashboardConfig.quickActions}
                workspaceId={routeWorkspaceId}
                cols={Math.min(dashboardConfig.quickActions.length, 4)}
                colors={{
                  bg:     COLORS.actionBg,
                  border: COLORS.actionBorder,
                  text:   COLORS.actionText,
                  accent: COLORS.primary,
                }}
              />
            </WorkspaceCard>
          )}

          {/* Ringkasan — LIVE */}
          <RingkasanCard
            checkupCount={data.checkups.length}
            pasienCount={pasienCount}
            jadwalCount={upcomingSchedules.length}
            diagnosisCount={diagnosedCheckups.length}
          />

          {/* Pemeriksaan Terbaru — LIVE */}
          <PemeriksaanTerbaruCard checkups={data.checkups} />

          {/* Jadwal Mendatang — LIVE */}
          <JadwalMendatangCard schedules={data.schedules} />

          {/* Ringkasan Tindakan & Obat — LIVE */}
          <RingkasanTindakanCard
            treatmentCount={data.treatments.length}
            drugCount={drugCount}
            totalBiaya={totalBiaya}
          />

          {/* Aktivitas Terkini — LIVE */}
          <div style={{ marginBottom: 14 }}>
            <RecentActivityCard activities={data.activities} />
          </div>

          {/* AI Insight — not_implemented */}
          <AiInsightWidget />
        </>
      )}
    </main>
  );
}
