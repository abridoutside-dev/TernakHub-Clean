import { useNavigate } from 'react-router-dom';
import type { WorkspaceJenis } from '../TopAppBar';
import { getQuickActionsForWorkspace, type QuickActionBadge, type QuickActionItem } from '../../data/quickActionData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-002 — Dashboard Quick Action
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Quick Action HANYA membuka Route / Modal / Bottom Sheet milik modul asal.
// Tidak ada logic bisnis, tidak ada CRUD di dalam komponen ini. Modal dan
// Bottom Sheet belum diimplementasikan (belum ada modul yang membutuhkan) —
// disiapkan sebagai actionType agar mudah dikembangkan tanpa mengubah
// struktur data maupun komponen ini.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<QuickActionBadge, { label: string; bg: string; color: string }> = {
  'new':          { label: 'New',          bg: '#e6f7ec', color: '#1f8a4c' },
  'coming-soon':  { label: 'Coming Soon',  bg: '#f1f2f4', color: '#6b7280' },
  'beta':         { label: 'Beta',          bg: '#eef2ff', color: '#4338ca' },
};

function QuickActionBadgeTag({ badge }: { badge: QuickActionBadge }) {
  const style = BADGE_STYLE[badge];
  return (
    <span
      style={{
        position: 'absolute',
        top: 6,
        right: 6,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: style.color,
        background: style.bg,
        borderRadius: 20,
        padding: '2px 6px',
        lineHeight: 1.4,
      }}
    >
      {style.label}
    </span>
  );
}

function QuickActionButton({ action, onRun }: { action: QuickActionItem; onRun: (action: QuickActionItem) => void }) {
  const isComingSoon = action.badge === 'coming-soon';

  return (
    <button
      type="button"
      onClick={() => onRun(action)}
      disabled={isComingSoon}
      aria-disabled={isComingSoon}
      style={{
        position: 'relative',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        cursor: isComingSoon ? 'not-allowed' : 'pointer',
        opacity: isComingSoon ? 0.55 : 1,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {action.badge && <QuickActionBadgeTag badge={action.badge} />}
      <span style={{ fontSize: 26 }}>{action.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.3 }}>
        {action.label}
      </span>
    </button>
  );
}

function QuickActionEmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '28px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
        Belum ada Quick Action
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
        Workspace ini belum memiliki Quick Action yang tersedia.
      </div>
    </div>
  );
}

interface QuickActionSectionProps {
  workspaceType: WorkspaceJenis;
}

/**
 * Section Quick Action — Grid responsive shortcut menuju modul lain.
 * Mengikuti Workspace aktif (workspaceType) dan MENGIKUTI Constitution:
 * Quick Action tidak memiliki logic sendiri, hanya navigasi/pembuka.
 */
export default function QuickActionSection({ workspaceType }: QuickActionSectionProps) {
  const navigate = useNavigate();
  const actions = getQuickActionsForWorkspace(workspaceType);

  const handleRun = (action: QuickActionItem) => {
    // Quick Action hanya membuka halaman/form/dialog milik modul asal.
    // Aksi bisnis (tambah/catat/simpan) dieksekusi di dalam modul tujuan.
    if (action.actionType === 'route' && action.to) {
      navigate(action.to);
      return;
    }
    if (action.actionType === 'modal' || action.actionType === 'bottom-sheet') {
      // Modal/Bottom Sheet global belum diimplementasikan.
      // Setiap QuickActionItem dengan tipe ini harus diubah menjadi 'route'
      // atau menunggu Global Modal/Sheet registry dikembangkan.
      // eslint-disable-next-line no-console
      console.warn('[QuickAction] Tipe aksi belum didukung:', action.actionType, action.id);
      return;
    }
  };

  if (actions.length === 0) {
    return <QuickActionEmptyState />;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}
      className="qa-grid"
    >
      {actions.map((action) => (
        <QuickActionButton key={action.id} action={action} onRun={handleRun} />
      ))}
    </div>
  );
}
