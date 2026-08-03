// ─── AdminSidebar — ADMIN-ARCH-001 ───────────────────────────────────────────
// Collapsible sidebar with 14-domain architecture, sync-status badges,
// nested accordion menus, and a permanent Blocked Modules section.

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ADMIN_NAV_DOMAINS,
  BLOCKED_MODULES,
  type AdminNavItem,
  type AdminNavDomain,
  type SyncStatus,
} from '../../../data/adminNavData';

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─── Sync-status badge ────────────────────────────────────────────────────────

const SYNC_BADGE: Record<SyncStatus, { label: string; color: string; bg: string }> = {
  synced:          { label: 'Synced',     color: '#16a34a', bg: 'rgba(22,163,74,0.15)'  },
  blocked:         { label: 'Blocked',    color: '#dc2626', bg: 'rgba(220,38,38,0.15)'  },
  dummy:           { label: 'Dummy',      color: '#d97706', bg: 'rgba(217,119,6,0.15)'  },
  not_implemented: { label: 'N/I',        color: '#475569', bg: 'rgba(71,85,105,0.15)'  },
};

function SyncBadge({ status }: { status: SyncStatus }) {
  const cfg = SYNC_BADGE[status];
  return (
    <span
      title={`Sync: ${cfg.label}`}
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 8,
        background: cfg.bg,
        color: cfg.color,
        flexShrink: 0,
        letterSpacing: 0.3,
        lineHeight: 1.6,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  item,
  isActive,
  collapsed,
  expanded,
  onToggleExpand,
  onNavigate,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onNavigate: (path: string) => void;
}) {
  const hasChildren = (item.children?.length ?? 0) > 0;
  const loc = useLocation();
  const isChildActive = item.children?.some((c) => loc.pathname === c.path) ?? false;
  const showActive = isActive || isChildActive;

  return (
    <div>
      <button
        title={collapsed ? item.label : undefined}
        onClick={() => {
          if (hasChildren && !collapsed) {
            onToggleExpand();
          } else {
            onNavigate(item.path);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 8,
          width: '100%',
          padding: collapsed ? '9px 0' : '8px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: showActive ? 'rgba(59,130,246,0.15)' : 'transparent',
          color: showActive ? '#60a5fa' : '#94a3b8',
          fontWeight: showActive ? 600 : 400,
          fontSize: 13,
          cursor: 'pointer',
          borderLeft: showActive ? '3px solid #3b82f6' : '3px solid transparent',
          transition: 'background 0.13s, color 0.13s',
          textAlign: 'left',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!showActive)
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={(e) => {
          if (!showActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: 15,
            width: collapsed ? 'auto' : 18,
            textAlign: 'center',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {item.icon}
        </span>

        {!collapsed && (
          <>
            <span style={{ flex: 1, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>

            {/* Sync badge */}
            {item.syncStatus && <SyncBadge status={item.syncStatus} />}

            {/* Count badge */}
            {item.badge != null && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: item.badgeColor ?? '#3b82f6',
                  color: '#fff',
                  minWidth: 20,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {item.badge}
              </span>
            )}

            {/* Expand chevron */}
            {hasChildren && (
              <span
                style={{
                  fontSize: 9,
                  color: '#64748b',
                  transition: 'transform 0.2s',
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              >
                ▶
              </span>
            )}
          </>
        )}

        {/* Collapsed: count badge dot */}
        {collapsed && item.badge != null && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: item.badgeColor ?? '#3b82f6',
            }}
          />
        )}
      </button>

      {/* Children */}
      {!collapsed && hasChildren && expanded && (
        <div style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          {item.children!.map((child) => {
            const childActive = loc.pathname === child.path;
            return (
              <button
                key={child.key}
                onClick={() => onNavigate(child.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  padding: '6px 14px 6px 40px',
                  background: childActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: childActive ? '#93c5fd' : '#64748b',
                  fontWeight: childActive ? 600 : 400,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: childActive ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'color 0.1s, background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!childActive) {
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!childActive) {
                    (e.currentTarget as HTMLElement).style.color = '#64748b';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {child.icon && <span style={{ fontSize: 11 }}>{child.icon}</span>}
                <span style={{ flex: 1 }}>{child.label}</span>
                {child.syncStatus && <SyncBadge status={child.syncStatus} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Domain Section ───────────────────────────────────────────────────────────

function DomainSection({
  domain,
  collapsed,
  expanded,
  expandedItems,
  onToggleDomain,
  onToggleItem,
  onNavigate,
  activePath,
}: {
  domain: AdminNavDomain;
  collapsed: boolean;
  expanded: boolean;
  expandedItems: Set<string>;
  onToggleDomain: () => void;
  onToggleItem: (key: string) => void;
  onNavigate: (path: string) => void;
  activePath: string;
}) {
  const isEmpty = domain.items.length === 0;

  // Highlight domain header if any child is active
  const isDomainActive = domain.items.some(
    (item) =>
      activePath === item.path ||
      item.children?.some((c) => activePath === c.path),
  );

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Domain header */}
      <button
        title={collapsed ? domain.label : undefined}
        onClick={onToggleDomain}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 8,
          width: '100%',
          padding: collapsed ? '8px 0' : '7px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: isDomainActive
            ? 'rgba(99,102,241,0.12)'
            : 'rgba(255,255,255,0.03)',
          color: isDomainActive ? '#818cf8' : '#64748b',
          fontWeight: 600,
          fontSize: 10.5,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          transition: 'background 0.12s, color 0.12s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = isDomainActive
            ? 'rgba(99,102,241,0.18)'
            : 'rgba(255,255,255,0.06)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = isDomainActive
            ? 'rgba(99,102,241,0.12)'
            : 'rgba(255,255,255,0.03)')
        }
      >
        <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{domain.icon}</span>

        {!collapsed && (
          <>
            <span style={{ flex: 1, lineHeight: 1.2 }}>{domain.label}</span>
            {isEmpty && (
              <span style={{ fontSize: 9, color: '#334155', fontWeight: 400, letterSpacing: 0 }}>
                coming soon
              </span>
            )}
            <span
              style={{
                fontSize: 9,
                color: '#475569',
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            >
              ▶
            </span>
          </>
        )}
      </button>

      {/* Items within domain */}
      {!collapsed && expanded && (
        <div>
          {isEmpty ? (
            <div
              style={{
                padding: '6px 14px 6px 36px',
                fontSize: 11,
                color: '#334155',
                fontStyle: 'italic',
              }}
            >
              — Segera hadir —
            </div>
          ) : (
            domain.items.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isActive={activePath === item.path}
                collapsed={false}
                expanded={expandedItems.has(item.key)}
                onToggleExpand={() => onToggleItem(item.key)}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Blocked Modules Section ──────────────────────────────────────────────────

function BlockedModulesSection({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);

  if (collapsed) return null;

  return (
    <div
      style={{
        borderTop: '2px solid rgba(220,38,38,0.2)',
        marginTop: 4,
      }}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 14px',
          background: 'rgba(220,38,38,0.06)',
          color: '#94a3b8',
          fontWeight: 600,
          fontSize: 10.5,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.1)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)')
        }
      >
        <span style={{ fontSize: 13 }}>🚫</span>
        <span style={{ flex: 1 }}>Blocked Modules</span>
        <span
          style={{
            fontSize: 9,
            color: '#475569',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▶
        </span>
      </button>

      {/* Content */}
      {open && (
        <div style={{ background: 'rgba(0,0,0,0.12)', padding: '6px 0' }}>
          {BLOCKED_MODULES.length === 0 ? (
            <div
              style={{
                padding: '8px 14px 8px 36px',
                fontSize: 11,
                color: '#334155',
                fontStyle: 'italic',
              }}
            >
              Tidak ada modul yang diblokir saat ini.
            </div>
          ) : (
            BLOCKED_MODULES.map((mod) => (
              <div
                key={mod.key}
                style={{
                  padding: '6px 14px 6px 36px',
                  fontSize: 12,
                  color: '#ef4444',
                }}
              >
                <div style={{ fontWeight: 600 }}>{mod.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                  {mod.domain} — {mod.reason}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  // Track expanded state for both domains and items using a single Set of keys.
  // Domain keys are prefixed with 'domain-'; item keys are plain.
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Auto-expand the domain + item that contain the active path.
    for (const domain of ADMIN_NAV_DOMAINS) {
      for (const item of domain.items) {
        const itemActive =
          item.path === location.pathname ||
          item.children?.some((c) => c.path === location.pathname);
        if (itemActive) {
          initial.add(domain.key);
          if (item.children?.length) initial.add(item.key);
          break;
        }
      }
    }
    // Default: expand Platform Overview on first load.
    if (initial.size === 0) initial.add('domain-overview');
    return initial;
  });

  // Keep expansions in sync when route changes.
  useEffect(() => {
    for (const domain of ADMIN_NAV_DOMAINS) {
      for (const item of domain.items) {
        const itemActive =
          item.path === location.pathname ||
          item.children?.some((c) => c.path === location.pathname);
        if (itemActive) {
          setExpandedKeys((prev) => {
            const next = new Set(prev);
            next.add(domain.key);
            if (item.children?.length) next.add(item.key);
            return next;
          });
          return;
        }
      }
    }
  }, [location.pathname]);

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 99,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        className={[
          'adm-sidebar',
          collapsed ? 'adm-sidebar--collapsed' : '',
          mobileOpen ? 'adm-sidebar--mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? '18px 0' : '18px 16px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <img
            src="/logo/ternakhub-logo.png"
            alt="TernakHub"
            style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0, borderRadius: 8 }}
            draggable={false}
          />
          {!collapsed && (
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#f1f5f9',
                  letterSpacing: 0.2,
                  lineHeight: 1.1,
                }}
              >
                TernakHub
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: '#475569',
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Control Plane
              </div>
            </div>
          )}
        </div>

        {/* Navigation — 14 domains */}
        <nav
          className="adm-sidebar-nav"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '6px 0',
            scrollbarWidth: 'none',
            scrollBehavior: 'smooth',
          }}
        >
          {ADMIN_NAV_DOMAINS.map((domain) => (
            <DomainSection
              key={domain.key}
              domain={domain}
              collapsed={collapsed}
              expanded={expandedKeys.has(domain.key)}
              expandedItems={expandedKeys}
              onToggleDomain={() => toggleKey(domain.key)}
              onToggleItem={(key) => toggleKey(key)}
              onNavigate={handleNavigate}
              activePath={location.pathname}
            />
          ))}

          {/* Permanent Blocked Modules section */}
          <BlockedModulesSection collapsed={collapsed} />
        </nav>

        {/* Footer — collapse toggle + version */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: collapsed ? '12px 0' : '12px 16px',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <div style={{ fontSize: 10, color: '#334155', marginBottom: 8, lineHeight: 1.4 }}>
              <div style={{ color: '#475569', fontWeight: 500 }}>v1.4.2 · 2026-07-18</div>
              <div>Asia-Pacific (Jakarta)</div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.05)',
              color: '#475569',
              fontSize: 12,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.13s',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')
            }
            className="adm-collapse-btn"
          >
            <span style={{ fontSize: 14 }}>{collapsed ? '▶▶' : '◀◀'}</span>
            {!collapsed && <span>Ciutkan</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
