// ─── KlinikHewanDashboard — ADMIN-SYNC-007 ────────────────────────────────────
// Dashboard Home khusus Workspace Klinik Hewan.
// Dipilih oleh workspaceDashboardRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase):
//   LIVE → workspaces (nama workspace)
//   LIVE → health_checkups (Pemeriksaan, Pasien, Kunjungan, Diagnosis)
//   LIVE → health_treatments (Tindakan, Resep, Obat)
//   LIVE → health_control_schedules (Jadwal)
//   LIVE → activity_log (Aktivitas workspace)
//   LIVE → ringkasan operasional berbasis kunjungan, tindakan, jadwal, dan aktivitas

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

// ─── Tema warna Klinik Hewan ──────────────────────────────────────────────────

const COLORS = {
  primary:      '#7b1fa2',
  bg:           '#f3e5f5',
  text:         '#4a148c',
  border:       '#ce93d8',
  actionBg:     '#f3e5f5',
  actionText:   '#4a148c',
  actionBorder: '#ce93d8',
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
  treatmentCount,
}: {
  checkupCount:    number;
  pasienCount:     number;
  jadwalCount:     number;
  diagnosisCount:  number;
  treatmentCount:  number;
}) {
  const items = [
    { value: formatNumber(checkupCount),   label: 'Kunjungan',       icon: '🏥', color: COLORS.text, bg: COLORS.bg },
    { value: formatNumber(pasienCount),    label: 'Pasien Unik',     icon: '🐄', color: '#0e7490',   bg: '#cffafe' },
    { value: formatNumber(jadwalCount),    label: 'Jadwal Aktif',    icon: '📅', color: '#1d4ed8',   bg: '#dbeafe' },
    { value: formatNumber(diagnosisCount), label: 'Terdiagnosis',    icon: '🔬', color: '#166534',   bg: '#dcfce7' },
    { value: formatNumber(treatmentCount), label: 'Tindakan Medis',  icon: '💉', color: '#9a3412',   bg: '#ffedd5' },
  ];

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Operasional Klinik" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 0 }}>
        {items.slice(0, 3).map((item) => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 17 }}>{item.icon}</div>
            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
        {items.slice(3).map((item) => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 17 }}>{item.icon}</div>
            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>
      {checkupCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada kunjungan tercatat. Data akan muncul setelah pemeriksaan pertama dicatat.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Kunjungan Terbaru Card — LIVE ────────────────────────────────────────────

const HEALTH_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Sehat:            { color: '#166534', bg: '#dcfce7' },
  Sakit:            { color: '#991b1b', bg: '#fee2e2' },
  'Dalam Perawatan': { color: '#b45309', bg: '#fef3c7' },
  Karantina:        { color: '#6d28d9', bg: '#ede9fe' },
  Pemantauan:       { color: '#1d4ed8', bg: '#dbeafe' },
};

function KunjunganTerbaruCard({ checkups }: { checkups: HealthCheckupDbRow[] }) {
  const recent = checkups.slice(0, 5);

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Kunjungan Terbaru"
        action={checkups.length > 0 ? `${checkups.length} total` : 'Live'}
        accentColor={COLORS.primary}
      />
      {recent.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada kunjungan pasien. Catat pemeriksaan pertama untuk mulai.
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
                  background: '#fdf4ff', border: `1px solid ${COLORS.border}`,
                }}
              >
                <span style={{ fontSize: 18 }}>🏥</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.examiner ?? 'Dokter tidak dicatat'} · {formatTanggal(c.checkup_date)}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {c.diagnosis
                      ? `Diagnosis: ${c.diagnosis.slice(0, 50)}${c.diagnosis.length > 50 ? '…' : ''}`
                      : c.findings
                        ? c.findings.slice(0, 60) + (c.findings.length > 60 ? '…' : '')
                        : 'Menunggu diagnosis'}
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
                background: '#fdf4ff', border: `1px solid ${COLORS.border}`,
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
                fontSize: 10, fontWeight: 700, color: COLORS.text,
                background: COLORS.bg, padding: '2px 6px', borderRadius: 5, flexShrink: 0,
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

// ─── Ringkasan Transaksi Card — LIVE ──────────────────────────────────────────

function RingkasanTransaksiCard({ totalBiaya, transaksiCount }: { totalBiaya: number; transaksiCount: number }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Transaksi" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#f3e5f5', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: COLORS.text, fontWeight: 700 }}>💰 Total Biaya Tindakan</p>
          <p style={{ margin: '5px 0 0', fontSize: 15, fontWeight: 800, color: COLORS.text, wordBreak: 'break-word' }}>
            {totalBiaya > 0 ? formatRupiah(totalBiaya) : 'Rp 0'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.text }}>dari health_treatments.cost</p>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#166534', fontWeight: 700 }}>🧾 Tindakan Berbayar</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {formatNumber(transaksiCount)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>catatan tindakan dengan biaya</p>
        </div>
      </div>
      {transaksiCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada tindakan berbayar tercatat.
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
  if (domain === 'veterinary' || domain === 'health') return '🏥';
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KlinikHewanDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = '' } = useParams<{ id: string }>();

  const dashboardConfig = getWorkspaceDashboardConfig('KlinikHewan');
  const { data, loading, error } = useVeterinaryDashboardData(routeWorkspaceId);

  const workspaceName = data.workspace?.workspace_name ?? dashboardConfig.title;

  const upcomingSchedules = getUpcomingSchedules(data.schedules);
  const diagnosedCheckups = getDiagnosedCheckups(data.checkups);
  const pasienCount       = getUniquePasienCount(data.checkups);
  const totalBiaya        = getTotalBiaya(data.treatments);
  const transaksiCount    = data.treatments.filter((t) => t.cost !== null && t.cost > 0).length;

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
          Ringkasan operasional klinik hewan — kunjungan pasien, tindakan, jadwal, transaksi, dan aktivitas secara real-time.
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

          {/* Ringkasan Operasional — LIVE */}
          <RingkasanCard
            checkupCount={data.checkups.length}
            pasienCount={pasienCount}
            jadwalCount={upcomingSchedules.length}
            diagnosisCount={diagnosedCheckups.length}
            treatmentCount={data.treatments.length}
          />

          {/* Kunjungan Terbaru — LIVE */}
          <KunjunganTerbaruCard checkups={data.checkups} />

          {/* Jadwal Mendatang — LIVE */}
          <JadwalMendatangCard schedules={data.schedules} />

          {/* Ringkasan Transaksi — LIVE */}
          <RingkasanTransaksiCard totalBiaya={totalBiaya} transaksiCount={transaksiCount} />

          {/* Aktivitas Terkini — LIVE */}
          <div style={{ marginBottom: 14 }}>
            <RecentActivityCard activities={data.activities} />
          </div>

        </>
      )}
    </main>
  );
}
