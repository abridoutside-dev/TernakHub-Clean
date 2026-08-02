// ─── AdminTopBar — ADM-002 ────────────────────────────────────────────────────
// Admin top bar: hamburger, breadcrumb, search, notifications, profile dropdown.

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ADMIN_NAV_TREE } from '../../../data/adminNavData';

// ADMIN-003: seed notifications removed — panel shows empty state, badge = 0.
import {
  SOURCE_CONFIG,
  type NotificationRecord,
} from '../../../data/adminNotificationsData';

// ─── Resolve page title from current path ────────────────────────────────────

function useActiveModule() {
  const { pathname } = useLocation();
  const item = ADMIN_NAV_TREE.find(
    (n) => pathname === n.path || pathname.startsWith(n.path + '/'),
  );
  return item ?? ADMIN_NAV_TREE[0];
}

// ─── Notification panel ───────────────────────────────────────────────────────

function fmtRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

function NotificationPanel({
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  onClose: () => void;
  notifications: NotificationRecord[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const navigate = useNavigate();
  const unread = notifications.filter((n) => n.readStatus === 'Unread');

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 340,
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '13px 16px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notifikasi</span>
          {unread.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 10, background: '#ef4444', color: '#fff',
            }}>
              {unread.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {unread.length > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                fontSize: 11, fontWeight: 600, color: '#059669',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              }}
            >
              ✓✓ Semua Dibaca
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
            Belum ada notifikasi
          </div>
        ) : notifications.slice(0, 8).map((n) => {
          const sc = SOURCE_CONFIG[n.source];
          const isUnread = n.readStatus === 'Unread';
          return (
            <div
              key={n.id}
              onClick={() => { if (isUnread) onMarkRead(n.id); }}
              style={{
                padding: '11px 16px',
                borderBottom: '1px solid #f8fafc',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: isUnread ? '#fafbff' : '#fff',
                cursor: isUnread ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (isUnread) (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isUnread ? '#fafbff' : '#fff'}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isUnread ? '#3b82f6' : 'transparent', flexShrink: 0, marginTop: 5 }} />
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${sc.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>
                {sc.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: isUnread ? 700 : 400,
                  color: '#1e293b', lineHeight: 1.35,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  {n.source} · {fmtRelTime(n.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={() => { navigate('/admin/notifications'); onClose(); }}
          style={{
            fontSize: 12.5, fontWeight: 600, color: '#3b82f6',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          Lihat Semua Notifikasi →
        </button>
      </div>
    </div>
  );
}

// ─── Profile dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { signOut, currentUser } = useAuth();
  const adminName = currentUser?.user_metadata?.full_name || currentUser?.email || 'System Administrator';
  const adminEmail = currentUser?.email || '—';
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 220,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {/* Admin info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{adminName}</div>
        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{adminEmail}</div>
        <div
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            background: '#dbeafe',
            color: '#1d4ed8',
          }}
        >
          ⚙️ System Admin
        </div>
      </div>

      {/* Menu items */}
      {[
        { icon: '👤', label: 'Profil Admin', action: () => { onClose(); } },
        { icon: '⚙️', label: 'Pengaturan Platform', action: () => { navigate('/admin/settings'); onClose(); } },
        { icon: '📊', label: 'Kembali ke Dashboard', action: () => { navigate('/admin'); onClose(); } },
      ].map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            color: '#374151',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

      {/* Workspace link */}
      <button
        onClick={() => { navigate('/'); onClose(); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          color: '#374151',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <span>🏠</span>
        <span>Kembali ke Workspace</span>
      </button>

      <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

      {/* Logout */}
      <button
        onClick={() => { signOut(); onClose(); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          color: '#ef4444',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff5f5')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <span>🚪</span>
        <span>Keluar</span>
      </button>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface Props {
  onMenuClick: () => void;
}

export default function AdminTopBar({ onMenuClick }: Props) {
  const activeModule = useActiveModule();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ADMIN-003: no seed notifications — always empty, badge always 0.
  const notifications: NotificationRecord[] = [];
  const unreadCount = 0;

  // No-ops until backend notification integration is wired.
  const handleMarkRead = (_id: string) => {};
  const handleMarkAllRead = () => {};

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="adm-topbar">
      {/* Left — hamburger + module label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="adm-hamburger"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            flexShrink: 0,
            color: '#64748b',
            cursor: 'pointer',
          }}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeModule.label}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>
            Administrasi Platform
          </div>
        </div>
      </div>

      {/* Center — search */}
      <div className="adm-search-wrap">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f1f5f9',
            borderRadius: 10,
            padding: '8px 14px',
            border: '1.5px solid transparent',
            transition: 'border-color 0.15s',
            width: '100%',
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = '#93c5fd')
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = 'transparent')
          }
        >
          <span style={{ color: '#94a3b8', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari admin…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue.trim()) {
                navigate(`/admin/search?q=${encodeURIComponent(searchValue.trim())}`);
                setSearchValue('');
              }
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13.5,
              color: '#374151',
              padding: 0,
              minWidth: 0,
            }}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              style={{ background: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right — notifications + environment + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Environment badge */}
        <span
          className="adm-env-badge"
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 11px',
            borderRadius: 20,
            background: '#dcfce7',
            color: '#15803d',
          }}
        >
          {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
        </span>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: notifOpen ? '#eff6ff' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              cursor: 'pointer',
              position: 'relative',
              border: notifOpen ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              transition: 'background 0.13s',
            }}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1.5px solid #fff',
                }}
              />
            )}
          </button>
          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              border: profileOpen ? '2px solid #93c5fd' : '2px solid transparent',
              transition: 'border-color 0.15s',
            }}
            aria-label="Admin profile menu"
          >
            SA
          </button>
          {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
