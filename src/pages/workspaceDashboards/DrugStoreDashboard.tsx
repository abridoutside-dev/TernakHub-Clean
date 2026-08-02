// ─── DrugStoreDashboard — WORKSPACE-001F ─────────────────────────────────────
// Dashboard Home khusus Workspace Toko Obat Hewan.
// Dipilih oleh workspaceDashboardRegistry.tsx — tidak di-hardcode di App.tsx.

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDrugStoreWorkspaceMetaWithFallback,
  getProductsByDrugStoreWorkspaceWithFallback,
  getDrugStoreLowStockProducts,
  getDrugStoreNearExpiryProducts,
  getDrugStoreRecentOrders,
  getDrugStoreTodayActivities,
  getExpiryStatus,
  formatExpiryDate,
  EXPIRY_STATUS_CONFIG,
} from '../../data/drugStoreWorkspaceData';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspacePageHeader,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';

// ─── Tema warna Toko Obat ─────────────────────────────────────────────────────
const COLORS = {
  primary:    '#0097a7',
  bg:         '#e0f7fa',
  text:       '#006064',
  border:     '#80deea',
  actionBg:   '#e0f7fa',
  actionText: '#006064',
  actionBorder: '#80deea',
} as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function getStatusColors(status: string): { color: string; bg: string } {
  if (status === 'Menunggu diproses') return { color: '#b45309', bg: '#fffbeb' };
  if (status === 'Siap dikirim')      return { color: '#166534', bg: '#f0fdf4' };
  if (status === 'Selesai')           return { color: '#1d4ed8', bg: '#eff6ff' };
  return { color: '#6b7280', bg: '#f3f4f6' };
}

export default function DrugStoreDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = 'w-drug-001' } = useParams<{ id: string }>();
  const workspaceId = routeWorkspaceId;

  const dashboardConfig = getWorkspaceDashboardConfig('DrugStore');
  const meta            = getDrugStoreWorkspaceMetaWithFallback(workspaceId);
  const products        = getProductsByDrugStoreWorkspaceWithFallback(workspaceId);
  const lowStock        = useMemo(() => getDrugStoreLowStockProducts(workspaceId).length > 0
    ? getDrugStoreLowStockProducts(workspaceId)
    : getDrugStoreLowStockProducts('w-drug-001'), [workspaceId]);
  const nearExpiry      = useMemo(() => getDrugStoreNearExpiryProducts(workspaceId).length > 0
    ? getDrugStoreNearExpiryProducts(workspaceId)
    : getDrugStoreNearExpiryProducts('w-drug-001'), [workspaceId]);
  const orders          = getDrugStoreRecentOrders();
  const activities      = getDrugStoreTodayActivities();

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '18px 16px 24px',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Header ── */}
      <WorkspacePageHeader
        icon={dashboardConfig.icon}
        label="Dashboard Home"
        title={meta.nama}
        accentColor={COLORS.primary}
        iconBg={COLORS.bg}
      />

      {/* ── Quick Action ── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="Quick Action" accentColor={COLORS.primary} />
        <WorkspaceQuickActions
          actions={dashboardConfig.quickActions}
          workspaceId={workspaceId}
          cols={6}
          colors={{
            bg:     COLORS.actionBg,
            border: COLORS.actionBorder,
            text:   COLORS.actionText,
            accent: COLORS.primary,
          }}
        />
      </WorkspaceCard>

      {/* ── Ringkasan Penjualan ── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle
          title="Ringkasan Penjualan"
          action="Hari ini"
          accentColor={COLORS.primary}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <div style={{ background: COLORS.bg, borderRadius: 12, padding: 13 }}>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.text }}>Total penjualan</p>
            <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#004d40' }}>
              Rp 12,35 jt
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>↑ 8,2% dari kemarin</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 13 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>Transaksi</p>
            <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
              28
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
              24 selesai · 4 proses
            </p>
          </div>
        </div>
      </WorkspaceCard>

      {/* ── Ringkasan Stok Obat ── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle
          title="Ringkasan Stok Obat"
          action="Lihat detail"
          accentColor={COLORS.primary}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          {[
            {
              value: formatNumber(products.length),
              label: 'Produk aktif',
              icon: '💊',
              color: COLORS.text,
              bg: COLORS.bg,
            },
            {
              value: String(lowStock.length),
              label: 'Stok rendah',
              icon: '⚠️',
              color: '#b45309',
              bg: '#fffbeb',
            },
            {
              value: String(nearExpiry.length),
              label: 'Hampir ED',
              icon: '⏰',
              color: '#991b1b',
              bg: '#fee2e2',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                borderRadius: 12,
                padding: '11px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18 }}>{item.icon}</div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 17,
                  fontWeight: 800,
                  color: item.color,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  color: item.color,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </WorkspaceCard>

      {/* ── Obat Hampir Habis ── */}
      {lowStock.length > 0 && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle
            title="Obat Hampir Habis"
            action={`${lowStock.length} produk`}
            accentColor={COLORS.primary}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {lowStock.slice(0, 4).map((product) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 11px',
                  borderRadius: 10,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {product.ketersediaan === 'Habis' ? '🚫' : '⚠️'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.namaProduk}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: '#92400e' }}>
                    {product.kategori} · {product.satuan}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: product.ketersediaan === 'Habis' ? '#991b1b' : '#92400e',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {product.ketersediaan}
                </span>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}

      {/* ── Obat Mendekati Kedaluwarsa ── */}
      {nearExpiry.length > 0 && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle
            title="Obat Mendekati Kedaluwarsa"
            action={`${nearExpiry.length} produk`}
            accentColor="#991b1b"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {nearExpiry.slice(0, 4).map((product) => {
              const expiryStatus = getExpiryStatus(product.tanggalKedaluwarsa);
              const cfg          = EXPIRY_STATUS_CONFIG[expiryStatus];
              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 11px',
                    borderRadius: 10,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.namaProduk}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: cfg.color }}>
                      Batch {product.noBatch} · ED {formatExpiryDate(product.tanggalKedaluwarsa)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: cfg.color,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {expiryStatus === 'Kedaluwarsa' ? 'EXPIRED' : 'Hampir ED'}
                  </span>
                </div>
              );
            })}
          </div>
        </WorkspaceCard>
      )}

      {/* ── Pesanan Terbaru ── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle
          title="Pesanan Terbaru"
          action="Lihat semua"
          accentColor={COLORS.primary}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {orders.map((order) => {
            const sc = getStatusColors(order.status);
            return (
              <div
                key={order.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  background: sc.bg,
                }}
              >
                <span style={{ fontSize: 19 }}>🧾</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {order.buyer}
                    </p>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        color: sc.color,
                        fontWeight: 800,
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {order.id} · {order.items}
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 11,
                      fontWeight: 800,
                      color: sc.color,
                    }}
                  >
                    {order.total}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </WorkspaceCard>

      {/* ── Aktivitas Hari Ini ── */}
      <WorkspaceCard>
        <WorkspaceSectionTitle
          title="Aktivitas Hari Ini"
          action="27 Juli 2026"
          accentColor={COLORS.primary}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {activities.map((activity) => (
            <div
              key={`${activity.time}-${activity.title}`}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: COLORS.bg,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {activity.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                >
                  {activity.title}
                </p>
                <p
                  style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}
                >
                  {activity.detail}
                </p>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </WorkspaceCard>
    </main>
  );
}
