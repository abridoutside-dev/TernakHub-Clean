// ─── TransportDriverSection Component (WST-002) ───────────────────────────────
// Displays the Drivers (Pengemudi) and Service Coverage (Coverage Area Layanan)
// sections for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import {
  type DriverRecord,
  type ServiceArea,
  type TransportAccessDecision,
  DRIVER_STATUS_CONFIG,
  TRANSPORT_SERVICE_TYPE_CONFIG,
} from '../../data/transportWorkspaceData';

// ─── Local helpers ────────────────────────────────────────────────────────────

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
        {title} hanya tersedia untuk anggota Workspace Transport ini.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TransportDriverSectionProps {
  drivers: DriverRecord[];
  areas: ServiceArea[];
  access: TransportAccessDecision;
}

export default function TransportDriverSection({ drivers, areas, access }: TransportDriverSectionProps) {
  return (
    <>
      {/* ─── Pengemudi ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader
          title="Pengemudi"
          subtitle={`${drivers.length} terdaftar · ${drivers.filter((d) => d.status === 'Aktif').length} aktif`}
        />

        {access.canViewOperational ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map((d) => {
              const sc = DRIVER_STATUS_CONFIG[d.status];
              const vehicle = d.kendaraanId
                ? `${d.kendaraanId}`
                : '—';
              return (
                <div key={d.id} style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48,
                    height: 48,
                    background: 'var(--color-surface)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                    border: '1.5px solid var(--color-border)',
                  }}>
                    {d.foto}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                          {d.nama}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                          SIM {d.kategoriSIM} · {d.pengalamanTahun} tahun pengalaman
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
                        {sc.icon} {d.status}
                      </span>
                    </div>

                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      gap: 16,
                      flexWrap: 'wrap',
                      fontSize: 12,
                      color: 'var(--color-muted)',
                    }}>
                      <span>🚛 {vehicle}</span>
                      <span>📞 {d.nomorHP}</span>
                    </div>

                    {d.catatanDriver && (
                      <p style={{
                        margin: '6px 0 0',
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}>
                        {d.catatanDriver}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <LockedSection title="Data pengemudi" />
        )}
      </div>

      {/* ─── Coverage Area Layanan ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader
          title="Coverage Area Layanan"
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
                    {area.provinsi} · ⏱ {area.estimasiWaktu}
                  </p>
                </div>
                {area.minOrderKg && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                  }}>
                    Min. {area.minOrderKg} kg
                  </span>
                )}
              </div>

              {/* Jenis layanan tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {area.jenisLayanan.map((jl) => {
                  const cfg = TRANSPORT_SERVICE_TYPE_CONFIG[jl];
                  return (
                    <span key={jl} style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: cfg.color,
                      background: cfg.bg,
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}>
                      {cfg.icon} {jl}
                    </span>
                  );
                })}
              </div>

              {/* Kabupaten/Kota */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
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
    </>
  );
}
