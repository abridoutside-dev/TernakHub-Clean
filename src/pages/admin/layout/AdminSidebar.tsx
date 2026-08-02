// ─── AdminSidebar — ADM-002 ───────────────────────────────────────────────────
// Collapsible sidebar with nested accordion menus and mobile drawer support.

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_NAV_TREE, type AdminNavItem } from '../../../data/adminNavData';

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
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
          gap: collapsed ? 0 : 10,
          width: '100%',
          padding: collapsed ? '10px 0' : '9px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: showActive ? 'rgba(59,130,246,0.15)' : 'transparent',
          color: showActive ? '#60a5fa' : '#94a3b8',
          fontWeight: showActive ? 600 : 400,
          fontSize: 13.5,
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
        <span
          style={{
            fontSize: 16,
            width: collapsed ? 'auto' : 20,
            textAlign: 'center',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {item.icon}
        </span>

        {!collapsed && (
          <>
            <span style={{ flex: 1, lineHeight: 1.2 }}>{item.label}</span>
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
            {hasChildren && (
              <span
                style={{
                  fontSize: 10,
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

        {/* Badge dot when collapsed */}
        {collapsed && item.badge != null && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
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
        <div
          style={{
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {item.children!.map((child) => (
            <button
              key={child.key}
              onClick={() => onNavigate(child.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '7px 16px 7px 44px',
                background: 'transparent',
                color: '#64748b',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: '3px solid transparent',
                transition: 'color 0.1s, background 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#64748b';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {child.icon && <span style={{ fontSize: 12 }}>{child.icon}</span>}
              <span>{child.label}</span>
            </button>
          ))}
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

  // Auto-expand the group containing the active path
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const active = ADMIN_NAV_TREE.find(
      (item) =>
        item.path === location.pathname ||
        item.children?.some((c) => c.path === location.pathname),
    );
    return active?.children ? new Set([active.key]) : new Set();
  });

  // Keep expanded group in sync when route changes
  useEffect(() => {
    const active = ADMIN_NAV_TREE.find(
      (item) =>
        item.path === location.pathname ||
        item.children?.some((c) => c.path === location.pathname),
    );
    if (active?.children) {
      setExpandedGroups((prev) => new Set([...prev, active.key]));
    }
  }, [location.pathname]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
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
                Admin Panel
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '10px 0',
            scrollbarWidth: 'none',
          }}
        >
          {ADMIN_NAV_TREE.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              isActive={location.pathname === item.path}
              collapsed={collapsed}
              expanded={expandedGroups.has(item.key)}
              onToggleExpand={() => toggleGroup(item.key)}
              onNavigate={handleNavigate}
            />
          ))}
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
