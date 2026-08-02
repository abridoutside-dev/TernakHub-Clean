import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  getWorkspaceConfigByDbType,
  type WorkspaceKind,
} from '../config/workspaceRegistry';
import {
  getResolvedNavItems,
  getWorkspaceNavConfig,
  type WorkspaceNavItem,
} from '../config/workspaceNavRegistry';

export default function BottomNav() {
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!currentUser) return null;

  const workspaceKind: WorkspaceKind = activeWorkspace
    ? getWorkspaceConfigByDbType(activeWorkspace.workspace_type).kind
    : 'Farm';
  const workspaceId  = activeWorkspace?.workspace_uuid ?? 'w7';
  const navConfig    = getWorkspaceNavConfig(workspaceKind);
  const registryItems = getResolvedNavItems(workspaceKind, workspaceId);

  // For tab-based workspaces (routeDashboard === routeUtama), append '?tab='
  // to home/operational items so react-router can distinguish them.
  const navItems = registryItems.map((item): WorkspaceNavItem => {
    if (navConfig.tabBased && (item.id === 'home' || item.id === 'operational')) {
      return { ...item, route: `${item.route}?tab=${item.id}` };
    }
    return item;
  });

  // Guard: hide nav when the current URL contains a workspace ID in the path
  // that doesn't match the active workspace. Applies to any workspace kind
  // whose routes use '/workspace/:id/' patterns (i.e. all non-Farm kinds).
  if (workspaceKind !== 'Farm') {
    const urlWsIdMatch = location.pathname.match(/^\/workspace\/([^/]+)\//);
    if (urlWsIdMatch && urlWsIdMatch[1] !== workspaceId) {
      return null;
    }
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
         paddingBottom: 'env(safe-area-inset-bottom, 0px)',
         height: 'var(--bottom-nav-height)',
        zIndex: 10,
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.route}
          end={item.end}
          style={({ isActive }) => {
            // Tab-based workspaces: use the '?tab=' query param for active
            // state instead of react-router's prefix-matching isActive.
            const isTabItem = navConfig.tabBased && (item.id === 'home' || item.id === 'operational');
            const tabMatch  = isTabItem && location.pathname === item.route.split('?')[0];
            const active    = tabMatch
              ? (searchParams.get('tab') ?? 'home') === item.id
              : isActive;

            return {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 10,
              color: active ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: active ? 600 : 400,
              flex: 1,
              height: '100%',
              letterSpacing: 0.1,
            };
          }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
