// ─── ClinicPatientSection Component (CLN-002F) ────────────────────────────────
// Displays visit / patient history with status and kategori filters
// for a Klinik Hewan Workspace.
// All data is received through props — no business logic inside this component.

import {
  VISIT_STATUS_CONFIG,
  KATEGORI_CONFIG,
  formatRupiahClinic,
  formatTanggalClinic,
  type ClinicVisitRecord,
  type ClinicAccessDecision,
  type ClinicVisitStatus,
  type ClinicKategori,
} from '../../data/clinicWorkspaceData';

// ─── Local helpers (presentational only) ─────────────────────────────────────

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
        {title} hanya tersedia untuk anggota Workspace Klinik Hewan ini.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ClinicPatientSectionProps {
  visits: ClinicVisitRecord[];
  filteredVisits: ClinicVisitRecord[];
  statusFilter: ClinicVisitStatus | 'Semua';
  kategoriFilter: ClinicKategori | 'Semua';
  onStatusFilterChange: (filter: ClinicVisitStatus | 'Semua') => void;
  onKategoriFilterChange: (filter: ClinicKategori | 'Semua') => void;
  access: ClinicAccessDecision;
}

export default function ClinicPatientSection({
  visits,
  filteredVisits,
  statusFilter,
  kategoriFilter,
  onStatusFilterChange,
  onKategoriFilterChange,
  access,
}: ClinicPatientSectionProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader
        title="Riwayat Kunjungan"
        subtitle={`${visits.length} total · ${visits.filter((v) => v.status === 'Selesai').length} selesai`}
      />

      {access.canViewOperational ? (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {(['Semua', 'Selesai', 'Terjadwal', 'Dalam Proses', 'Dibatalkan'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusFilterChange(s)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 16,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === s
                    ? '1.5px solid #065f46'
                    : '1.5px solid var(--color-border)',
                  background: statusFilter === s ? '#d1fae5' : 'var(--color-surface)',
                  color: statusFilter === s ? '#065f46' : 'var(--color-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Kategori filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            {(['Semua', ...Object.keys(KATEGORI_CONFIG)] as const).map((k) => {
              const cfg = k !== 'Semua'
                ? KATEGORI_CONFIG[k as ClinicKategori]
                : null;
              const active = kategoriFilter === k;
              return (
                <button
                  key={k}
                  onClick={() => onKategoriFilterChange(k as ClinicKategori | 'Semua')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active
                      ? `1.5px solid ${cfg?.color ?? '#065f46'}`
                      : '1.5px solid var(--color-border)',
                    background: active ? (cfg?.bg ?? '#d1fae5') : 'var(--color-surface)',
                    color: active ? (cfg?.color ?? '#065f46') : 'var(--color-muted)',
                  }}
                >
                  {cfg ? `${cfg.icon} ` : ''}{k}
                </button>
              );
            })}
          </div>

          {filteredVisits.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 28 }}>📭</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tidak ada kunjungan yang cocok dengan filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredVisits.map((visit) => {
                const sc  = VISIT_STATUS_CONFIG[visit.status];
                const kc  = KATEGORI_CONFIG[visit.kategori];
                return (
                  <div key={visit.id} style={{
                    background: 'var(--color-bg)',
                    border: `1.5px solid ${sc.border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                          {visit.id}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                          {visit.clientWorkspace}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: kc.color, background: kc.bg,
                          padding: '3px 7px', borderRadius: 10,
                        }}>
                          {kc.icon} {visit.kategori}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: sc.color, background: sc.bg,
                          padding: '3px 7px', borderRadius: 10,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          {sc.icon} {visit.status}
                        </span>
                      </div>
                    </div>

                    {/* Ternak & dokter */}
                    <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                      🐄 {visit.ternakDeskripsi}
                    </p>

                    {/* Bottom row */}
                    <div style={{
                      display: 'flex', gap: 14, flexWrap: 'wrap',
                      fontSize: 11, color: 'var(--color-muted)', marginTop: 4,
                    }}>
                      <span>📅 {formatTanggalClinic(visit.tanggal)}</span>
                      <span>👨‍⚕️ {visit.dokterPenanggung}</span>
                      {access.canViewFinancial && (
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          💰 {formatRupiahClinic(visit.biaya)}
                        </span>
                      )}
                    </div>

                    {visit.hasilRingkasan && visit.status !== 'Terjadwal' && (
                      <p style={{
                        margin: '6px 0 0',
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}>
                        📝 {visit.hasilRingkasan}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <LockedSection title="Riwayat kunjungan pasien" />
      )}
    </div>
  );
}
