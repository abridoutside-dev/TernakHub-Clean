// ─── AdminControlPlane — ADMIN-ARCH-003 ──────────────────────────────────────
// Renders the full 14-domain Control Plane on the Admin Dashboard.
// Architecture-only: all widget data is placeholder (no live queries).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DOMAIN_CONTROL_CENTERS,
  BLOCKED_MODULES_PANEL,
  type DomainControlCenter,
  type DomainWidget,
  type BlockedModuleRecord,
} from '../../data/adminControlPlaneData';
import type { SyncStatus, ModuleHealth } from '../../data/adminNavData';

// ─── Health dot ───────────────────────────────────────────────────────────────

const HEALTH_CFG: Record<ModuleHealth, { color: string; bg: string; label: string }> = {
  healthy:  { color: '#16a34a', bg: 'rgba(22,163,74,0.12)',  label: 'Healthy'  },
  degraded: { color: '#d97706', bg: 'rgba(217,119,6,0.12)', label: 'Degraded' },
  down:     { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', label: 'Down'     },
  unknown:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Unknown' },
};

function HealthDot({ health }: { health: ModuleHealth }) {
  const cfg = HEALTH_CFG[health];
  return (
    <span
      title={`Health: ${cfg.label}`}
      style={{
        display: 'inline-flex',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: health === 'healthy' ? `0 0 0 2px ${cfg.color}30` : undefined,
      }}
    />
  );
}

// ─── Sync badge ───────────────────────────────────────────────────────────────

const SYNC_CFG: Record<SyncStatus, { label: string; color: string; bg: string }> = {
  synced:          { label: 'Live',  color: '#15803d', bg: 'rgba(22,163,74,0.12)'   },
  blocked:         { label: 'Block', color: '#b91c1c', bg: 'rgba(220,38,38,0.12)'   },
  dummy:           { label: 'Dummy', color: '#b45309', bg: 'rgba(217,119,6,0.12)'   },
  not_implemented: { label: 'N/I',   color: '#475569', bg: 'rgba(71,85,105,0.12)'   },
};

function SyncBadge({ status }: { status: SyncStatus }) {
  const cfg = SYNC_CFG[status];
  return (
    <span
      title={`Sync: ${cfg.label}`}
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        flexShrink: 0,
        letterSpacing: 0.2,
        lineHeight: 1.7,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Priority badge (Blocked Modules panel) ───────────────────────────────────

const PRIORITY_CFG: Record<BlockedModuleRecord['priority'], { color: string; bg: string }> = {
  critical: { color: '#b91c1c', bg: '#fef2f2' },
  high:     { color: '#c2410c', bg: '#fff7ed' },
  medium:   { color: '#b45309', bg: '#fffbeb' },
  low:      { color: '#475569', bg: '#f8fafc' },
};

function PriorityBadge({ priority }: { priority: BlockedModuleRecord['priority'] }) {
  const cfg = PRIORITY_CFG[priority];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 8,
        background: cfg.bg,
        color: cfg.color,
        textTransform: 'capitalize',
      }}
    >
      {priority}
    </span>
  );
}

// ─── Widget row ───────────────────────────────────────────────────────────────

function WidgetRow({ widget }: { widget: DomainWidget }) {
  const { status } = widget;
  const hasBlocker = status.blocker !== null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 14px',
        borderBottom: '1px solid #f8fafc',
        minWidth: 0,
      }}
    >
      {/* Health dot */}
      <HealthDot health={status.health} />

      {/* Icon + label */}
      <span style={{ fontSize: 12, flexShrink: 0 }}>{widget.icon}</span>
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: '#374151',
          fontWeight: 500,
          lineHeight: 1.2,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {widget.label}
      </span>

      {/* Blocker indicator */}
      {hasBlocker && (
        <span title={status.blocker!.reason} style={{ fontSize: 11, flexShrink: 0 }}>
          🚫
        </span>
      )}

      {/* Sync badge */}
      <SyncBadge status={status.syncStatus} />

      {/* Last sync */}
      <span
        style={{
          fontSize: 9.5,
          color: '#94a3b8',
          flexShrink: 0,
          minWidth: 24,
          textAlign: 'right',
        }}
      >
        {status.lastSync ? new Date(status.lastSync).toLocaleDateString('id-ID') : '—'}
      </span>
    </div>
  );
}

// ─── Domain card ──────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  defaultExpanded = false,
}: {
  domain: DomainControlCenter;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  const total   = domain.widgets.length;
  const live    = domain.widgets.filter((w) => w.status.syncStatus === 'synced').length;
  const blocked = domain.widgets.filter((w) => w.status.blocker !== null).length;
  const hasIssues = blocked > 0 || domain.widgets.some((w) => w.status.health === 'down' || w.status.health === 'degraded');

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${hasIssues ? '#fca5a533' : '#f1f5f9'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          background: expanded ? '#fafbff' : '#fff',
          borderBottom: expanded ? '1px solid #f1f5f9' : '1px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = expanded ? '#fafbff' : '#fff')}
      >
        {/* Domain icon */}
        <span
          style={{
            fontSize: 18,
            width: 34,
            height: 34,
            borderRadius: 8,
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {domain.icon}
        </span>

        {/* Title + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {domain.label}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: '#94a3b8',
              marginTop: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {total} modules · {live} live
            {blocked > 0 && (
              <span style={{ color: '#ef4444', marginLeft: 4 }}>· {blocked} blocked</span>
            )}
          </div>
        </div>

        {/* Open button */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(domain.primaryPath); }}
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 6,
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            cursor: 'pointer',
            flexShrink: 0,
            lineHeight: 1.4,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#dbeafe')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#eff6ff')}
        >
          Open
        </button>

        {/* Chevron */}
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
            marginLeft: 2,
          }}
        >
          ▶
        </span>
      </button>

      {/* Widget list */}
      {expanded && (
        <div>
          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '3px 14px',
              background: '#f8fafc',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ width: 8, flexShrink: 0 }} />
            <span style={{ width: 12, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Module
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>Sync</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0, minWidth: 24, textAlign: 'right' }}>Last</span>
          </div>
          {domain.widgets.map((widget) => (
            <WidgetRow key={widget.key} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Blocked Modules panel ────────────────────────────────────────────────────

function BlockedModulesPanel() {
  const records = BLOCKED_MODULES_PANEL;

  return (
    <section
      style={{
        marginTop: 28,
        background: '#fff',
        borderRadius: 14,
        border: '2px solid rgba(220,38,38,0.15)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(220,38,38,0.03)',
        }}
      >
        <span style={{ fontSize: 18 }}>🚫</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Blocked Modules</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            Permanent registry — modules gated by missing dependencies or pending implementation
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            background: records.length === 0 ? '#f0fdf4' : '#fef2f2',
            color: records.length === 0 ? '#15803d' : '#b91c1c',
          }}
        >
          {records.length === 0 ? '✓ None blocked' : `${records.length} blocked`}
        </span>
      </div>

      {/* Table or empty state */}
      {records.length === 0 ? (
        <div
          style={{
            padding: '32px 18px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 32 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
            No blocked modules
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 320, lineHeight: 1.5 }}>
            All platform modules are unblocked. Add entries to{' '}
            <code
              style={{
                fontSize: 11,
                background: '#f1f5f9',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              BLOCKED_MODULES_PANEL
            </code>{' '}
            in <code style={{ fontSize: 11, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>adminControlPlaneData.ts</code> when a module is gated.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 140px 1fr 90px 90px 140px',
              gap: 0,
              padding: '7px 18px',
              background: '#f8fafc',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {['Module', 'Domain', 'Reason', 'Priority', 'Blocked Since', 'Expected Dependency'].map(
              (col) => (
                <span
                  key={col}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    paddingRight: 8,
                  }}
                >
                  {col}
                </span>
              ),
            )}
          </div>

          {/* Data rows */}
          {records.map((rec, idx) => (
            <div
              key={rec.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 140px 1fr 90px 90px 140px',
                gap: 0,
                padding: '9px 18px',
                borderBottom: idx < records.length - 1 ? '1px solid #f8fafc' : undefined,
                alignItems: 'start',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', paddingRight: 8 }}>
                {rec.label}
              </span>
              <span style={{ fontSize: 12, color: '#64748b', paddingRight: 8 }}>
                {rec.domain}
              </span>
              <span style={{ fontSize: 12, color: '#374151', paddingRight: 8, lineHeight: 1.4 }}>
                {rec.reason}
              </span>
              <span style={{ paddingRight: 8 }}>
                <PriorityBadge priority={rec.priority} />
              </span>
              <span style={{ fontSize: 12, color: '#64748b', paddingRight: 8 }}>
                {rec.blockedSince
                  ? new Date(rec.blockedSince).toLocaleDateString('id-ID')
                  : '—'}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {rec.expectedDependency ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Owner column note */}
      {records.length > 0 && (
        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid #f1f5f9',
            fontSize: 10.5,
            color: '#94a3b8',
          }}
        >
          Owner: {records.map((r) => r.owner ?? '—').join(', ')}
        </div>
      )}
    </section>
  );
}

// ─── Control Plane section header ─────────────────────────────────────────────

function ControlPlaneHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
              color: '#fff',
              letterSpacing: 0.5,
            }}
          >
            CONTROL PLANE
          </span>
          Domain Overview
        </h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
          14 domains · All module health, sync status, and blockers at a glance. Click any card to expand.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {[
          { color: '#16a34a', label: 'Healthy' },
          { color: '#d97706', label: 'Degraded' },
          { color: '#dc2626', label: 'Down' },
          { color: '#94a3b8', label: 'Unknown' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: '#64748b' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminControlPlane() {
  return (
    <section style={{ marginTop: 32 }}>
      <ControlPlaneHeader />

      {/* 2-column domain grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
        className="adm-cp-grid"
      >
        {DOMAIN_CONTROL_CENTERS.map((domain, idx) => (
          <DomainCard
            key={domain.domainKey}
            domain={domain}
            // Auto-expand Platform Overview and User & Workspace
            defaultExpanded={idx < 2}
          />
        ))}
      </div>

      {/* Permanent Blocked Modules panel */}
      <BlockedModulesPanel />
    </section>
  );
}
