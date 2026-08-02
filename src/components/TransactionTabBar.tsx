// ─── FARM-FIX-005.9 — Transaction Tab Bar (extended) ─────────────────────────
// Navigasi bersama untuk Transaction Room modules:
//   Conversation | Evidence | Audit Trail | Escrow (conditional) |
//   Attachments | Receipt
//
// Tab Escrow hanya muncul jika hasEscrow === true.

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export type TransactionTab =
  | 'conversation'
  | 'evidence'
  | 'audit'
  | 'escrow'
  | 'attachments'
  | 'receipt'
  /** 'detail' = no tab is highlighted — used on the main Detail Transaksi page */
  | 'detail';

interface TabDef {
  id: TransactionTab;
  icon: string;
  label: string;
  path: (id: string) => string;
  color?: string;
  conditional?: boolean;
}

const ALL_TABS: TabDef[] = [
  { id: 'conversation',  icon: '💬', label: 'Chat',        path: (id) => `/marketplace/conversation/${id}` },
  { id: 'evidence',      icon: '📎', label: 'Evidence',    path: (id) => `/marketplace/evidence/${id}`     },
  { id: 'audit',         icon: '📋', label: 'Audit',       path: (id) => `/marketplace/audit/${id}`        },
  { id: 'escrow',        icon: '🔐', label: 'Escrow',      path: (id) => `/marketplace/escrow/${id}`,        color: '#1565c0', conditional: true },
  { id: 'attachments',   icon: '🗂️', label: 'Files',       path: (id) => `/marketplace/attachments/${id}`  },
  { id: 'receipt',       icon: '📄', label: 'Receipt',     path: (id) => `/marketplace/receipt/${id}`      },
];

export default function TransactionTabBar({
  transaksiId,
  activeTab,
  hasEscrow = false,
}: {
  transaksiId: string;
  activeTab: TransactionTab;
  /** Tampilkan tab Escrow hanya jika transaksi menggunakan settlement Escrow. */
  hasEscrow?: boolean;
}) {
  const navigate = useNavigate();
  const tabs = ALL_TABS.filter(t => !t.conditional || (t.id === 'escrow' && hasEscrow));
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      flexShrink: 0,
      overflowX: 'auto',
      overflowY: 'hidden',
      minHeight: 44,
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const activeColor = tab.color ?? 'var(--color-primary)';
        return (
          <button
            key={tab.id}
            ref={isActive ? activeTabRef : undefined}
            type="button"
            onClick={() => { if (!isActive) navigate(tab.path(transaksiId)); }}
            style={{
              flex: '0 0 auto',
              minWidth: 72,
              minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 10px',
              background: 'transparent', border: 'none',
              borderBottom: isActive
                ? `2.5px solid ${activeColor}`
                : '2.5px solid transparent',
              color: isActive ? activeColor : 'var(--color-muted)',
              fontSize: 11, fontWeight: isActive ? 700 : 500,
              cursor: isActive ? 'default' : 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
