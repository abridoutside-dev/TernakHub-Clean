// ─── AdminLayout — ADM-002 ────────────────────────────────────────────────────
// Shared layout for all admin pages: sidebar + topbar + scrollable content.
// Manages collapsed/mobile sidebar state with localStorage persistence.

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

const COLLAPSED_KEY = 'adm_sidebar_collapsed';

// ─── Context (shared sidebar state) ──────────────────────────────────────────

interface AdminLayoutCtx {
  collapsed: boolean;
  mobileOpen: boolean;
}
const AdminLayoutContext = createContext<AdminLayoutCtx>({ collapsed: false, mobileOpen: false });
export const useAdminLayout = () => useContext(AdminLayoutContext);

// ─── Layout ───────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  // Close mobile sidebar on route change or resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <AdminLayoutContext.Provider value={{ collapsed, mobileOpen }}>
      <div className={`adm-root${collapsed ? ' adm-root--collapsed' : ''}`}>
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="adm-body">
          <AdminTopBar onMenuClick={() => setMobileOpen((v) => !v)} />

          <main className="adm-content">
            {children}
            <div style={{ height: 40 }} />
          </main>
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
}
