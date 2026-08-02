// ─── Veterinary Workspace Page (VET-001) ──────────────────────────────────────
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
  VET_STATUS_CONFIG,
  ACTIVITY_STATUS_CONFIG,
  VET_SERVICE_CONFIG,
  formatRupiahVet,
  formatTanggalVet,
  type ActivityStatus,
  type VetServiceType,
} from '../data/veterinaryWorkspaceData';

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
      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{value}</span>
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
        {title} hanya tersedia untuk anggota Workspace Veteriner ini.
      </p>
    </div>
  );
}

function DisabledButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button
      disabled
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
        cursor: 'not-allowed',
        opacity: 0.45,
        flex: '1 1 140px',
        justifyContent: 'center',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

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
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 55%, #1d4ed8 100%)',
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
            fontSize: 52,
            opacity: 0.15,
            letterSpacing: 12,
            userSelect: 'none',
          }}>
            {meta.banner} 🩺 💉 🔬 🧪 {meta.banner}
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
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}>
                  {meta.nama}
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {tipeLabel} · {meta.lokasiUmum}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                `🏥 ${tipeLabel}`,
                `📅 Sejak ${new Date(meta.bergabungSejak).getFullYear()}`,
                `📞 ${meta.kontakPublik}`,
                `🕐 ${meta.jamOperasional}`,
              ].map((tag) => (
                <span key={tag} style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.18)',
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
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Statistik Layanan" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatCard icon="👨‍⚕️" value={summary.totalDokterHewan} label="Dokter Hewan" sub={`${summary.dokterAktif} aktif`} />
            <StatCard icon="🏥" value={summary.totalKlinik} label="Klinik" />
            <StatCard icon="🐄" value={summary.pasienAktif} label="Pasien Aktif" />
            <StatCard icon="🏡" value={summary.kunjunganKandang} label="Kunjungan Kandang" sub="selesai" />
            <StatCard icon="📋" value={summary.sertifikatDiterbitkan} label="Sertifikat" sub="diterbitkan" />
          </div>
        </div>

        {/* ─── 3. VETERINARIAN LIST ──────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Daftar Dokter Hewan"
            subtitle={`${vets.length} terdaftar · ${vets.filter((v) => v.status === 'Aktif').length} aktif`}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vets.map((vet) => {
              const sc = VET_STATUS_CONFIG[vet.status];
              return (
                <div key={vet.id} style={{
                  background: 'var(--color-bg)',
                  border: `1.5px solid ${sc.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 52,
                    height: 52,
                    background: 'var(--color-surface)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    flexShrink: 0,
                    border: '1.5px solid var(--color-border)',
                  }}>
                    {vet.foto}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
                          {vet.gelar} {vet.nama}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                          {vet.spesialisasi}
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
                        {sc.icon} {vet.status}
                      </span>
                    </div>

                    {/* License + experience */}
                    <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                      <span>🪪 {vet.nomorSIPP}</span>
                      <span>🎓 {vet.pendidikan}</span>
                      <span>⏱ {vet.pengalamanTahun} tahun pengalaman</span>
                    </div>

                    {/* Services */}
                    <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {vet.layanan.map((svc) => {
                        const cfg = VET_SERVICE_CONFIG[svc];
                        return (
                          <span key={svc} style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: cfg.color,
                            background: cfg.bg,
                            padding: '2px 7px',
                            borderRadius: 10,
                          }}>
                            {cfg.icon} {svc}
                          </span>
                        );
                      })}
                    </div>

                    {/* Operational details — member only */}
                    {access.canViewOperational && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-muted)' }}>
                        <span>📞 {vet.nomorHP}</span>
                        {vet.catatanInternal && (
                          <span style={{ fontStyle: 'italic' }}>📝 {vet.catatanInternal}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 4. SERVICES ───────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Layanan Tersedia"
            subtitle={`${services.filter((s) => s.tersedia).length} dari ${services.length} layanan aktif`}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 10,
          }}>
            {services.map((svc) => {
              const cfg = VET_SERVICE_CONFIG[svc.tipeLayanan];
              return (
                <div key={svc.id} style={{
                  background: 'var(--color-bg)',
                  border: `1.5px solid ${svc.tersedia ? 'var(--color-border)' : '#e5e7eb'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  opacity: svc.tersedia ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: cfg.color,
                          background: cfg.bg,
                          padding: '2px 7px',
                          borderRadius: 10,
                        }}>
                          {cfg.icon} {svc.tipeLayanan}
                        </span>
                        {!svc.tersedia && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: 8,
                          }}>
                            Tidak Tersedia
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                        {svc.namaLayanan}
                      </p>
                    </div>
                    {svc.hargaMulaiDari !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)' }}>Mulai dari</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                          {formatRupiahVet(svc.hargaMulaiDari)}
                        </p>
                      </div>
                    )}
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    {svc.deskripsi}
                  </p>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-muted)' }}>
                    <span>⏱ {svc.estimasiDurasi}</span>
                    <span>🐄 {svc.targetTernak.join(', ')}</span>
                  </div>

                  {svc.catatan && (
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: 11,
                      color: 'var(--color-muted)',
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 6,
                    }}>
                      ℹ️ {svc.catatan}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 5. SERVICE AREAS ──────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Wilayah Layanan"
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
                      {area.provinsi} · 📏 {area.jarakMaksKunjungan}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1e40af',
                    background: '#dbeafe',
                    padding: '3px 8px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    💰 {area.biayaKunjungan}
                  </span>
                </div>

                {/* Service type tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {area.layananTersedia.map((lt) => {
                    const cfg = VET_SERVICE_CONFIG[lt];
                    return (
                      <span key={lt} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        {cfg.icon} {lt}
                      </span>
                    );
                  })}
                </div>

                {/* Kab/kota tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
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

        {/* ─── 6. ACTIVITY HISTORY ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Riwayat Aktivitas"
            subtitle={`${activities.length} total · ${activities.filter((a) => a.status === 'Selesai').length} selesai`}
          />

          {access.canViewOperational ? (
            <>
              {/* Status filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {(['Semua', 'Selesai', 'Terjadwal', 'Dalam Proses', 'Dibatalkan'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: statusFilter === s
                        ? '1.5px solid #1e40af'
                        : '1.5px solid var(--color-border)',
                      background: statusFilter === s ? '#dbeafe' : 'var(--color-surface)',
                      color: statusFilter === s ? '#1e40af' : 'var(--color-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Type filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {(['Semua', ...Object.keys(VET_SERVICE_CONFIG)] as const).map((t) => {
                  const cfg = t !== 'Semua'
                    ? VET_SERVICE_CONFIG[t as VetServiceType]
                    : null;
                  const active = typeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t as VetServiceType | 'Semua')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: active
                          ? `1.5px solid ${cfg?.color ?? '#1e40af'}`
                          : '1.5px solid var(--color-border)',
                        background: active ? (cfg?.bg ?? '#dbeafe') : 'var(--color-surface)',
                        color: active ? (cfg?.color ?? '#1e40af') : 'var(--color-muted)',
                      }}
                    >
                      {cfg ? `${cfg.icon} ` : ''}{t}
                    </button>
                  );
                })}
              </div>

              {filteredActivities.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                  <span style={{ fontSize: 28 }}>📭</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tidak ada aktivitas yang cocok dengan filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredActivities.map((act) => {
                    const sc  = ACTIVITY_STATUS_CONFIG[act.status];
                    const svc = VET_SERVICE_CONFIG[act.tipeLayanan];
                    return (
                      <div key={act.id} style={{
                        background: 'var(--color-bg)',
                        border: `1.5px solid ${sc.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                      }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                              {act.id}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                              {act.clientWorkspace}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: svc.color, background: svc.bg,
                              padding: '3px 7px', borderRadius: 10,
                            }}>
                              {svc.icon} {act.tipeLayanan}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: sc.color, background: sc.bg,
                              padding: '3px 7px', borderRadius: 10,
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              {sc.icon} {act.status}
                            </span>
                          </div>
                        </div>

                        {/* Livestock */}
                        <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                          🐄 {act.ternakDeskripsi} · 📍 {act.lokasiKunjungan}
                        </p>

                        {/* Bottom row */}
                        <div style={{
                          display: 'flex', gap: 14, flexWrap: 'wrap',
                          fontSize: 11, color: 'var(--color-muted)', marginTop: 4,
                        }}>
                          <span>📅 {formatTanggalVet(act.tanggal)}</span>
                          <span>👨‍⚕️ {act.vetId}</span>
                          {access.canViewFinancial && (
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              💰 {formatRupiahVet(act.biaya)}
                            </span>
                          )}
                        </div>

                        {act.hasilRingkasan && act.status !== 'Terjadwal' && (
                          <p style={{
                            margin: '6px 0 0',
                            fontSize: 11,
                            color: 'var(--color-muted)',
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                          }}>
                            📝 {act.hasilRingkasan}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <LockedSection title="Riwayat aktivitas layanan" />
          )}
        </div>

        {/* ─── 7. RESERVED ACTIONS ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Aksi Manajemen"
            subtitle="Fitur-fitur di bawah dalam tahap pengembangan"
          />

          {access.role !== 'public' ? (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <DisabledButton icon="👨‍⚕️" label="Tambah Dokter Hewan" />
                <DisabledButton icon="📅"   label="Jadwalkan Kunjungan" />
                <DisabledButton icon="📁"   label="Buat Rekam Medis" />
                <DisabledButton icon="📋"   label="Terbitkan Sertifikat" />
                <DisabledButton icon="💊"   label="Resepkan Obat" />
              </div>
              <p style={{
                margin: '12px 0 0',
                fontSize: 11,
                color: 'var(--color-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                Rekam medis, resep, telemedicine, dan penjadwalan akan tersedia pada rilis berikutnya.
              </p>
            </>
          ) : (
            <div style={{
              padding: '14px 16px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--color-muted)',
              textAlign: 'center',
            }}>
              🔒 Aksi manajemen hanya tersedia untuk anggota Workspace Veteriner.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
