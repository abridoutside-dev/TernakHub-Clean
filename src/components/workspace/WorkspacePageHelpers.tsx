// ─── Workspace Page Helpers — WORKSPACE-001F ──────────────────────────────────
// Shared UI primitives untuk halaman Dashboard dan Operasional workspace
// non-Farm. Komponen ini bersifat generic dan parameterisasi via props warna.
//
// ATURAN:
//   - Komponen ini digunakan oleh DrugStore dan workspace selanjutnya.
//   - Toko Pakan (FeedStore) memiliki komponen inline-nya sendiri (WORKSPACE-001E).
//   - Jangan import halaman atau context di sini — hanya UI primitif.
//   - Semua warna diteruskan sebagai prop, bukan hardcode.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';
import type { WorkspaceQuickAction } from '../../config/workspaceDashboardRegistry';

// ─── WorkspaceCard ────────────────────────────────────────────────────────────

export function WorkspaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

// ─── WorkspaceSectionTitle ────────────────────────────────────────────────────

export function WorkspaceSectionTitle({
  title,
  action,
  accentColor = 'var(--color-primary)',
}: {
  title: string;
  action?: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h2>
      {action && (
        <span style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>
          {action}
        </span>
      )}
    </div>
  );
}

// ─── WorkspacePageHeader ──────────────────────────────────────────────────────

export function WorkspacePageHeader({
  icon,
  label,
  title,
  subtitle,
  accentColor = '#0097a7',
  iconBg = '#e0f7fa',
}: {
  icon: string;
  label: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
  iconBg?: string;
}) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 18 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: iconBg,
          display: 'grid',
          placeItems: 'center',
          fontSize: 27,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: accentColor,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
          }}
        >
          {label}
        </p>
        <h1
          style={{
            margin: '3px 0 0',
            fontSize: 21,
            color: 'var(--color-text)',
            fontWeight: 800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

// ─── WorkspaceQuickActions ────────────────────────────────────────────────────
// Grid Quick Action generic — menerima warna dari luar agar sesuai tema workspace.

export function WorkspaceQuickActions({
  actions,
  workspaceId,
  cols = 6,
  colors,
}: {
  actions: WorkspaceQuickAction[];
  workspaceId: string;
  /** Jumlah kolom grid. Default 6. */
  cols?: number;
  colors: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 8,
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => navigate(resolveWorkspaceRoute(action.route, workspaceId))}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            background: colors.bg,
            color: colors.text,
            padding: '10px 5px',
            minHeight: 76,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          <span style={{ fontSize: 20 }}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─── WorkspaceStatGrid ────────────────────────────────────────────────────────
// Grid ringkasan statistik (2 atau 3 kolom).

export interface WorkspaceStatItem {
  value: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export function WorkspaceStatGrid({
  items,
  cols = 2,
}: {
  items: WorkspaceStatItem[];
  cols?: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 10,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: item.bg,
            borderRadius: 12,
            padding: 13,
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: item.color }}>{item.label}</p>
          <p
            style={{
              margin: '5px 0 0',
              fontSize: 20,
              fontWeight: 800,
              color: item.color,
            }}
          >
            {item.value}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 18 }}>{item.icon}</p>
        </div>
      ))}
    </div>
  );
}
