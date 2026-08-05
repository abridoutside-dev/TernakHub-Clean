// ─── DrugStoreOperational — ADMIN-SYNC-006 FINAL ─────────────────────────────
// Dashboard Operasional khusus Workspace Toko Obat Hewan.
// Dipilih oleh workspaceOperationalRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase):
//   LIVE → stok_obat, stok_obat_masuk, stok_obat_keluar
//   LIVE → drug_catalog (count), activity_log, workspaces
//   LIVE → drug_store_suppliers, drug_store_orders, drug_store_sales
//   LIVE → ringkasan data operasional dari tabel yang tersedia

import { type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  useDrugStoreDashboardData,
  getLowStokObatItems,
  getNearExpiryStokItems,
  formatNumber,
  formatRupiah,
} from '../../hooks/useDrugStoreDashboardData';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspacePageHeader,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';

// ─── Tema warna Toko Obat ─────────────────────────────────────────────────────

const COLORS = {
  primary:      '#0097a7',
  bg:           '#e0f7fa',
  text:         '#006064',
  border:       '#80deea',
  actionBg:     '#e0f7fa',
  actionText:   '#006064',
  actionBorder: '#80deea',
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

export default function DrugStoreOperational(): ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();

  const config          = getWorkspaceOperationalConfig('DrugStore');
  const dashboardConfig = getWorkspaceDashboardConfig('DrugStore');
  const { data, loading, error } = useDrugStoreDashboardData(workspaceId);

  const workspaceName = data.workspace?.workspace_name ?? config.title;

  // ── LIVE counts dari stok_obat ─────────────────────────────────────────────
  const totalProduk     = data.stokItems.length;
  const lowStockCount   = getLowStokObatItems(data.stokItems).length;
  const nearExpiryCount = getNearExpiryStokItems(data.stokItems).length;
  const masukCount      = data.stokMasuk.length;
  const keluarCount     = data.stokKeluar.length;
  const masterObatCount = data.masterObatCount;

  // ── LIVE counts dari drug_store_* ──────────────────────────────────────────
  const supplierCount       = data.suppliers.length;
  const activeSupplierCount = data.suppliers.filter((s) => s.status === 'Aktif').length;

  const pembelianCount  = data.recentOrders.filter((o) => o.order_type === 'Pembelian').length;
  const penjualanCount  = data.recentOrders.filter((o) => o.order_type === 'Penjualan').length;

  const salesCount       = data.sales.length;
  const salesTotalAmount = data.sales.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  // Ringkasan laporan: total order penjualan dari drug_store_orders
  const totalPenjualanOrders = data.recentOrders.filter((o) => o.order_type === 'Penjualan').length;

  type SectionStatus = 'live';

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
      id:          'master-obat',
      icon:        '📋',
      title:       'Master Obat',
      description: 'Katalog referensi obat hewan platform (drug_catalog).',
      count:       `${formatNumber(masterObatCount)} item di katalog`,
      status:      'live',
    },
    {
      id:          'stok-obat',
      icon:        '💊',
      title:       'Stok Obat',
      description: 'Stok obat aktif di workspace ini.',
      count:       `${formatNumber(totalProduk)} produk · ${lowStockCount} stok rendah`,
      status:      'live',
    },
    {
      id:          'batch-expired',
      icon:        '⏰',
      title:       'Batch & Kedaluwarsa',
      description: 'Lacak nomor batch dan tanggal kedaluwarsa.',
      count:       `${nearExpiryCount} mendekati/sudah ED`,
      status:      'live',
    },
    {
      id:          'transaksi-masuk',
      icon:        '📥',
      title:       'Transaksi Masuk',
      description: 'Catatan penerimaan produk dari distributor/PBF.',
      count:       `${formatNumber(masukCount)} catatan penerimaan`,
      status:      'live',
    },
    {
      id:          'transaksi-keluar',
      icon:        '📤',
      title:       'Transaksi Keluar',
      description: 'Catatan pengeluaran/dispensing stok obat.',
      count:       `${formatNumber(keluarCount)} catatan pengeluaran`,
      status:      'live',
    },
    {
      id:          'supplier',
      icon:        '🏭',
      title:       'Supplier',
      description: 'PBF, distributor, dan riwayat pembelian.',
      count:       `${formatNumber(supplierCount)} supplier · ${activeSupplierCount} aktif`,
      status:      'live',
    },
    {
      id:          'purchase',
      icon:        '🛒',
      title:       'Purchase',
      description: 'Order pembelian dari supplier.',
      count:       `${formatNumber(pembelianCount)} order pembelian terbaru`,
      status:      'live',
    },
    {
      id:          'sales',
      icon:        '🧾',
      title:       'Penjualan',
      description: 'Catat dan pantau penjualan kepada pelanggan.',
      count:       `${formatNumber(penjualanCount)} order penjualan terbaru · ${formatRupiah(salesTotalAmount)} total`,
      status:      'live',
    },
    {
      id:          'reports',
      icon:        '📊',
      title:       'Laporan',
      description: 'Laporan penjualan, stok, dan pembelian.',
      count:       `${formatNumber(totalPenjualanOrders)} order penjualan · ${formatNumber(salesCount)} catatan penjualan`,
      status:      'live',
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
      <section style={{
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#004d40' }}>Quick Action</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: COLORS.text }}>Akses cepat pekerjaan toko</p>
          </div>
          <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
        </div>
        <WorkspaceQuickActions
          actions={dashboardConfig.quickActions}
          workspaceId={workspaceId}
          cols={6}
          colors={{ bg: '#fff', border: COLORS.border, text: COLORS.text, accent: COLORS.primary }}
        />
      </section>

      {/* ── Ringkasan Stok ── */}
      {!loading && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle title="Ringkasan Stok Obat" action="Live" accentColor={COLORS.primary} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { label: 'Total produk',    value: formatNumber(totalProduk),    icon: '💊', color: COLORS.text, bg: COLORS.bg  },
              { label: 'Stok rendah',     value: String(lowStockCount),        icon: '⚠️', color: '#b45309',   bg: '#fffbeb' },
              { label: 'Hampir/sudah ED', value: String(nearExpiryCount),      icon: '⏰', color: '#991b1b',   bg: '#fee2e2' },
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
        }}>
          {OPERATIONAL_SECTIONS.map((section) => {
            const borderColor = COLORS.border;
            const bgColor     = 'var(--color-surface)';
            const badgeColor = { color: COLORS.primary, bg: COLORS.bg };
            const badgeLabel = 'live';
            const isLive = true;

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
    </main>
  );
}
