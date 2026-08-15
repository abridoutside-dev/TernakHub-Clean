import { Outlet, useLocation } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNav from './BottomNav';
import FloatingAssistant from './FloatingAssistant';
import ScrollRestorer from './ScrollRestorer';
import PageContent from './PageContent';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import { WORKSPACE_REGISTRY } from '../config/workspaceRegistry';

type PageMeta = {
  title: string;
  showBack?: boolean;
  showBackWithSwitcher?: boolean;
  hideNav?: boolean;
  hideTopBar?: boolean;
};

function resolveMeta(pathname: string): PageMeta {
  if (pathname === '/dashboard') return { title: 'TernakHub' };
  if (pathname === '/search') return { title: 'Cari', showBack: true, hideNav: true };
  if (pathname === '/notifications') return { title: 'Notifikasi', showBack: true, hideNav: true };
  if (pathname === '/dashboard/ai-insight') return { title: 'Semua Insight', showBack: true, hideNav: true };
  if (pathname === '/dashboard/aktivitas') return { title: 'Aktivitas Hari Ini', showBack: true, hideNav: true };
  if (pathname === '/dashboard/alert') return { title: 'Alert & Reminder', showBack: true, hideNav: true };
  if (pathname === '/dashboard/recent-activity') return { title: 'Aktivitas Terbaru', showBack: true, hideNav: true };
  if (pathname === '/livestock') return { title: 'Ternak' };
  if (pathname === '/livestock/active') return { title: 'Ternak Aktif', showBack: true };
  if (pathname === '/livestock/outside') return { title: 'Ternak Luar Kandang', showBack: true };
  if (pathname === '/livestock/add') return { title: 'Tambah Ternak', showBack: true, hideNav: true };
  if (pathname === '/catat-bobot') return { title: 'Catat Bobot', showBack: true, hideNav: true };
  if (pathname === '/kesehatan-hewan') return { title: 'Kesehatan Hewan', showBack: true, hideNav: true };
  if (pathname === '/pemberian-pakan') return { title: 'Pemberian Pakan', showBack: true, hideNav: true };
  if (pathname === '/jadwal-pemberian-pakan') return { title: 'Jadwal Pemberian Pakan', showBack: true, hideNav: true };
  if (pathname === '/riwayat-pemberian-pakan') return { title: 'Riwayat Pemberian Pakan', showBack: true, hideNav: true };
  if (pathname === '/reproduksi') return { title: 'Reproduksi', showBack: true, hideNav: true };
  if (pathname === '/mutasi') return { title: 'Mutasi', showBack: true, hideNav: true };
  if (pathname === '/marketplace') return { title: 'Marketplace', showBackWithSwitcher: true };
  if (pathname === '/news-event') return { title: 'News & Event' };
  if (pathname === '/onboarding') return { title: 'Selamat Datang', hideTopBar: true, hideNav: true };
  if (pathname.startsWith('/admin/')) return { title: '', hideNav: true, hideTopBar: true };
  if (pathname === '/admin') return { title: '', hideNav: true, hideTopBar: true };
  if (pathname.startsWith('/workspace/')) {
    const nonFarmWorkspaces = Object.values(WORKSPACE_REGISTRY).filter(c => c.kind !== 'Farm');
    for (const ws of nonFarmWorkspaces) {
      const toRegex = (route: string) => new RegExp(`^${route.replace(':id', '[^/]+')}(?:/|$|\\?)`);
      if (toRegex(ws.routeDashboard).test(pathname) || toRegex(ws.routeUtama).test(pathname)) {
        return { title: ws.nama, showBack: true, hideNav: false };
      }
    }
    return { title: 'Workspace', showBack: true, hideNav: true };
  }
  if (pathname.startsWith('/profile/')) return { title: 'Profil', showBack: true, hideNav: true };
  if (pathname.startsWith('/livestock/')) return { title: 'Detail Ternak', showBack: true, hideNav: true };
  if (pathname.startsWith('/kesehatan-hewan/')) return { title: 'Kesehatan Hewan', showBack: true, hideNav: true };
  if (pathname.startsWith('/marketplace/')) return { title: 'Marketplace', showBack: true, hideNav: true };
  if (pathname.startsWith('/news-event/')) return { title: 'News & Event', showBack: true, hideNav: true };
  return { title: 'TernakHub' };
}

/**
 * Provider-only route boundary for authenticated workspace setup and app
 * routes. It is never mounted by PublicLayout.
 */
export function WorkspaceProviderLayout() {
  console.log('[Render] WorkspaceProviderLayout');
  if (typeof window !== 'undefined') {
    (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent = 'WorkspaceProviderLayout';
  }
  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  );
}

/** Application chrome. This component is only used by protected feature routes. */
export default function ProtectedLayout() {
  console.log('[Render] ProtectedLayout');
  if (typeof window !== 'undefined') {
    (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent = 'ProtectedLayout';
  }
  const location = useLocation();
  const meta = resolveMeta(location.pathname);
  return (
    <div style={{ minHeight: '100dvh' }}>
      <ScrollRestorer />
      {!meta.hideTopBar && <TopAppBar title={meta.title} showBack={meta.showBack} showBackWithSwitcher={meta.showBackWithSwitcher} />}
      <div style={{ paddingTop: meta.hideTopBar ? 0 : 'var(--top-app-bar-height)', paddingBottom: meta.hideNav ? 0 : 'var(--bottom-nav-height)' }}>
        <PageContent className="page-content-shell" style={{ minHeight: '100%' }}>
          <Outlet />
        </PageContent>
      </div>
      {!meta.hideNav && <BottomNav />}
      {!meta.hideTopBar && <FloatingAssistant />}
    </div>
  );
}