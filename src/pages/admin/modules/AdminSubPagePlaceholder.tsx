// ─── AdminSubPagePlaceholder — ADMIN-001 ──────────────────────────────────────
// Sub-pages that have no backend implementation yet redirect to their parent
// admin module rather than showing a "coming soon" stub.

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Map every known sub-page to its parent module path
const PARENT_PATH: Record<string, string> = {
  // Users
  '/admin/users/roles':    '/admin/users',
  '/admin/users/activity': '/admin/users',
  // Workspaces
  '/admin/workspaces/plans':        '/admin/workspaces',
  '/admin/workspaces/verification': '/admin/workspaces',
  // Marketplace
  '/admin/marketplace/transactions': '/admin/marketplace',
  '/admin/marketplace/reports':      '/admin/marketplace',
  // Ownership Transfer
  '/admin/ownership-transfer/pending': '/admin/ownership-transfer',
  '/admin/ownership-transfer/done':    '/admin/ownership-transfer',
  // Relationships
  '/admin/relationships/active':  '/admin/relationships',
  '/admin/relationships/pending': '/admin/relationships',
  // Escrow
  '/admin/escrow/active':  '/admin/escrow',
  '/admin/escrow/dispute': '/admin/escrow',
  // Livestock
  '/admin/livestock/health':   '/admin/livestock',
  '/admin/livestock/breeding': '/admin/livestock',
  // Cross-WS Lineage
  '/admin/lineage/cross-ws':     '/admin/lineage',
  '/admin/lineage/verification': '/admin/lineage',
  // Feed
  '/admin/feed/stock':       '/admin/feed',
  '/admin/feed/consumption': '/admin/feed',
  // Medicine
  '/admin/medicine/stock': '/admin/medicine',
  '/admin/medicine/usage': '/admin/medicine',
  // Subscription
  '/admin/subscription/billing':  '/admin/subscription',
  '/admin/subscription/features': '/admin/subscription',
  // Trust & Verification
  '/admin/trust/approved': '/admin/trust',
  '/admin/trust/rejected': '/admin/trust',
  // Announcements
  '/admin/announcements/drafts':    '/admin/announcements',
  '/admin/announcements/scheduled': '/admin/announcements',
  // Notifications
  '/admin/notifications/templates': '/admin/notifications',
  // Reports
  '/admin/reports/content':   '/admin/reports',
  '/admin/reports/financial': '/admin/reports',
  // Monitoring
  '/admin/monitoring/errors':      '/admin/monitoring',
  '/admin/monitoring/performance': '/admin/monitoring',
  // Data Master
  '/admin/data-master/master':  '/admin/data-master',
  '/admin/data-master/imports': '/admin/data-master',
  // Settings
  '/admin/settings/security': '/admin/settings',
  '/admin/settings/api':      '/admin/settings',
  '/admin/settings/email':    '/admin/settings',
};

export default function AdminSubPagePlaceholder() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const parentPath = PARENT_PATH[pathname] ?? '/admin';

  useEffect(() => {
    navigate(parentPath, { replace: true });
  }, [navigate, parentPath]);

  return null;
}
