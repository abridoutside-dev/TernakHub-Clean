// ─── DrugStoreOperational — WORKSPACE-001F ───────────────────────────────────
// Dashboard Operasional khusus Workspace Toko Obat Hewan.
// Dipilih oleh workspaceOperationalRegistry.tsx — tidak di-hardcode di App.tsx.

import { useState, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDrugStoreWorkspaceMetaWithFallback,
  getProductsByDrugStoreWorkspaceWithFallback,
} from '../../data/drugStoreWorkspaceData';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
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
  cardActive:   '#e0f7fa',
  cardBorder:   '#26c6da',
  actionBg:     '#e0f7fa',
  actionText:   '#006064',
  actionBorder: '#80deea',
} as const;

// ─── Seksi Operasional ────────────────────────────────────────────────────────
const OPERATIONAL_SECTIONS = [
  {
    id: 'products',
    icon: '💊',
    title: 'Produk Obat',
    description: 'Kelola katalog dan informasi produk obat hewan.',
    count: '20 produk',
  },
  {
    id: 'stock',
    icon: '📦',
    title: 'Manajemen Stok',
    description: 'Pantau stok tersedia, minimum, dan habis.',
    count: '4 perlu perhatian',
  },
  {
    id: 'batch-expired',
    icon: '⏰',
    title: 'Batch & Expired',
    description: 'Lacak nomor batch dan tanggal kedaluwarsa.',
    count: '5 mendekati ED',
  },
  {
    id: 'incoming',
    icon: '📥',
    title: 'Transaksi Masuk',
    description: 'Catat penerimaan produk dari distributor/PBF.',
    count: '6 transaksi bulan ini',
  },
  {
    id: 'outgoing',
    icon: '📤',
    title: 'Transaksi Keluar',
    description: 'Catat penjualan dan pengeluaran stok.',
    count: '28 transaksi hari ini',
  },
  {
    id: 'supplier',
    icon: '🏭',
    title: 'Supplier',
    description: 'Kelola PBF, distributor, dan riwayat pembelian.',
    count: '5 supplier aktif',
  },
  {
    id: 'customers',
    icon: '👥',
    title: 'Pelanggan',
    description: 'Kelola pelanggan dan histori transaksi mereka.',
    count: '43 pelanggan',
  },
];

export default function DrugStoreOperational(): ReactElement {
  const { id: workspaceId = 'w-drug-001' } = useParams<{ id: string }>();
  const [selectedSection, setSelectedSection] = useState('products');

  const config          = getWorkspaceOperationalConfig('DrugStore');
  const dashboardConfig = getWorkspaceDashboardConfig('DrugStore');
  const meta            = getDrugStoreWorkspaceMetaWithFallback(workspaceId);
  const products        = getProductsByDrugStoreWorkspaceWithFallback(workspaceId);
  const selected        =
    OPERATIONAL_SECTIONS.find((s) => s.id === selectedSection) ?? OPERATIONAL_SECTIONS[0];

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
        icon={config.icon}
        label="Dashboard Operasional"
        title={meta.nama}
        subtitle={config.subtitle}
        accentColor={COLORS.primary}
        iconBg={COLORS.bg}
      />

      {/* ── Quick Action ── */}
      <section
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#004d40' }}>
              Quick Action
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: COLORS.text }}>
              Akses cepat pekerjaan toko
            </p>
          </div>
          <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
        </div>
        <WorkspaceQuickActions
          actions={dashboardConfig.quickActions}
          workspaceId={workspaceId}
          cols={6}
          colors={{
            bg:     '#fff',
            border: COLORS.border,
            text:   COLORS.text,
            accent: COLORS.primary,
          }}
        />
      </section>

      {/* ── Info Apoteker ── */}
      <WorkspaceCard style={{ marginBottom: 14, background: '#f0fdfa', border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🧑‍⚕️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.primary, fontWeight: 700 }}>
              Apoteker Penanggung Jawab
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#004d40' }}>
              {meta.apotekerPenanggungJawab}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)' }}>No. SIPT</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: COLORS.text }}>
              {meta.noSIPT}
            </p>
          </div>
        </div>
      </WorkspaceCard>

      {/* ── Grid Seksi ── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {OPERATIONAL_SECTIONS.map((section) => {
          const active = section.id === selectedSection;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedSection(section.id)}
              style={{
                textAlign: 'left',
                border: active
                  ? `1.5px solid ${COLORS.cardBorder}`
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: active ? COLORS.cardActive : 'var(--color-surface)',
                padding: 13,
                cursor: 'pointer',
                minHeight: 118,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 23 }}>{section.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: active ? COLORS.primary : 'var(--color-muted)',
                    fontWeight: 700,
                  }}
                >
                  ›
                </span>
              </div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--color-text)',
                }}
              >
                {section.title}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 10,
                  color: 'var(--color-muted)',
                  lineHeight: 1.35,
                }}
              >
                {section.count}
              </p>
            </button>
          );
        })}
      </section>

      {/* ── Panel Detail Seksi ── */}
      <WorkspaceCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <span style={{ fontSize: 24 }}>{selected.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, color: 'var(--color-text)' }}>
              {selected.title}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
              {selected.description}
            </p>
          </div>
        </div>
        <div
          style={{
            background: COLORS.bg,
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
              Ringkasan saat ini
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--color-text)',
              }}
            >
              {selected.count}
            </p>
          </div>
          <span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 700 }}>
            {selected.id === 'products' ? `${products.length} dari katalog` : 'Data dummy'}
          </span>
        </div>
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 11,
            color: 'var(--color-muted)',
            lineHeight: 1.5,
          }}
        >
          Modul {selected.title.toLowerCase()} siap menjadi titik masuk operasional Toko Obat.
          Detail transaksi dan penyimpanan permanen akan mengikuti data layer workspace berikutnya.
        </p>
      </WorkspaceCard>
    </main>
  );
}
