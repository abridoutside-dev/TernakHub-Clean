// ─── TransportDeliverySection Component (WST-002) ─────────────────────────────
// Displays the Delivery History (Riwayat Pengiriman) and Management Actions
// (Aksi Manajemen) sections for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import {
  type DeliveryRecord,
  type DeliveryStatus,
  type TransportServiceType,
  type TransportAccessDecision,
  DELIVERY_STATUS_CONFIG,
  TRANSPORT_SERVICE_TYPE_CONFIG,
  formatTanggalShort,
  formatRupiahTransport,
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

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
        cursor: 'pointer',
        flex: '1 1 140px',
        justifyContent: 'center',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type ModalType = 'vehicle' | 'driver' | 'delivery' | 'status' | 'complete';

interface TransportDeliverySectionProps {
  deliveries: DeliveryRecord[];
  filteredDeliveries: DeliveryRecord[];
  deliveryFilter: DeliveryStatus | 'Semua';
  typeFilter: TransportServiceType | 'Semua';
  onDeliveryFilterChange: (filter: DeliveryStatus | 'Semua') => void;
  onTypeFilterChange: (filter: TransportServiceType | 'Semua') => void;
  access: TransportAccessDecision;
  onOpenModal: (modal: ModalType) => void;
}

export default function TransportDeliverySection({
  deliveries,
  filteredDeliveries,
  deliveryFilter,
  typeFilter,
  onDeliveryFilterChange,
  onTypeFilterChange,
  access,
  onOpenModal,
}: TransportDeliverySectionProps) {
  return (
    <>
      {/* ─── Riwayat Pengiriman ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader
          title="Riwayat Pengiriman"
          subtitle={`${deliveries.length} total · ${deliveries.filter((d) => d.status === 'Selesai').length} selesai`}
        />

        {access.canViewOperational ? (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {/* Status filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['Semua', 'Dalam Perjalanan', 'Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onDeliveryFilterChange(s)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: deliveryFilter === s
                        ? '1.5px solid var(--color-primary)'
                        : '1.5px solid var(--color-border)',
                      background: deliveryFilter === s
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface)',
                      color: deliveryFilter === s
                        ? 'var(--color-primary)'
                        : 'var(--color-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {(['Semua', 'Angkut Ternak', 'Angkut Pakan', 'Angkut Obat', 'Angkut Peralatan', 'Pengiriman Dokumen'] as const).map((t) => {
                const cfg = t !== 'Semua' ? TRANSPORT_SERVICE_TYPE_CONFIG[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => onTypeFilterChange(t as TransportServiceType | 'Semua')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: typeFilter === t
                        ? `1.5px solid ${cfg?.color ?? 'var(--color-primary)'}`
                        : '1.5px solid var(--color-border)',
                      background: typeFilter === t
                        ? (cfg?.bg ?? 'var(--color-primary-light)')
                        : 'var(--color-surface)',
                      color: typeFilter === t
                        ? (cfg?.color ?? 'var(--color-primary)')
                        : 'var(--color-muted)',
                    }}
                  >
                    {cfg ? `${cfg.icon} ` : ''}{t}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            {filteredDeliveries.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--color-muted)',
              }}>
                <span style={{ fontSize: 28 }}>📭</span>
                <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tidak ada pengiriman yang cocok dengan filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredDeliveries.map((dlv) => {
                  const sc = DELIVERY_STATUS_CONFIG[dlv.status];
                  const typeCfg = TRANSPORT_SERVICE_TYPE_CONFIG[dlv.transportType];
                  return (
                    <div key={dlv.id} style={{
                      background: 'var(--color-bg)',
                      border: `1.5px solid ${sc.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                    }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                            {dlv.id}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                            {dlv.customerName} · {dlv.customerWorkspace}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span style={{
                            background: typeCfg.bg,
                            color: typeCfg.color,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 7px',
                            borderRadius: 10,
                          }}>
                            {typeCfg.icon} {dlv.transportType}
                          </span>
                          <span style={{
                            background: sc.bg,
                            color: sc.color,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 7px',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            {sc.icon} {dlv.status}
                          </span>
                        </div>
                      </div>

                      {/* Route */}
                      <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                        📍 {dlv.ruteAsal} → {dlv.ruteTujuan}
                      </p>

                      {/* Bottom row */}
                      <div style={{
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                        fontSize: 11,
                        color: 'var(--color-muted)',
                        marginTop: 4,
                      }}>
                        <span>📅 {formatTanggalShort(dlv.tanggal)}</span>
                        <span>🚛 {dlv.kendaraanId}</span>
                        <span>📦 {dlv.muatan}</span>
                        {access.canViewFinancial && dlv.nilaiPengiriman !== null && (
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            💰 {formatRupiahTransport(dlv.nilaiPengiriman)}
                          </span>
                        )}
                      </div>

                      {dlv.catatan && (
                        <p style={{
                          margin: '6px 0 0',
                          fontSize: 11,
                          color: 'var(--color-muted)',
                          fontStyle: 'italic',
                          lineHeight: 1.4,
                        }}>
                          {dlv.catatan}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <LockedSection title="Riwayat pengiriman" />
        )}
      </div>

      {/* ─── Aksi Manajemen ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader
          title="Aksi Manajemen"
          subtitle="Kelola armada dan operasional pengiriman Workspace Transport"
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {access.canViewOperational ? (
            <>
              {access.canEditFleet && (
                <>
                  <ActionButton icon="🚛" label="Tambah Kendaraan" onClick={() => onOpenModal('vehicle')} />
                  <ActionButton icon="👨‍✈️" label="Tugaskan Pengemudi" onClick={() => onOpenModal('driver')} />
                </>
              )}
              <ActionButton icon="📦" label="Buat Pengiriman" onClick={() => onOpenModal('delivery')} />
              <ActionButton icon="🔄" label="Perbarui Status" onClick={() => onOpenModal('status')} />
              <ActionButton icon="✅" label="Selesaikan Pengiriman" onClick={() => onOpenModal('complete')} />
            </>
          ) : (
            <div style={{
              padding: '14px 16px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--color-muted)',
              width: '100%',
              textAlign: 'center',
            }}>
              🔒 Aksi manajemen hanya tersedia untuk anggota Workspace Transport.
            </div>
          )}
        </div>

        {access.canViewOperational && (
          <p style={{
            margin: '12px 0 0',
            fontSize: 11,
            color: 'var(--color-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Perubahan tersimpan ke registri operasional Workspace Transport ini.
          </p>
        )}
      </div>
    </>
  );
}
