// ─── Notification Center — DB-001B-4 ─────────────────────────────────────────
// Workspace inbox. Uses NotificationRepository via globalNotificationService.
// Data is loaded async; refreshed on notifSignal bump.

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  countUnread,
  NOTIFICATION_TYPE_UUID,
  type NotificationRecord,
} from '../services/globalNotificationService';
import { subscribe } from '../utils/notifSignal';

// ─── Type Config Map ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  [NOTIFICATION_TYPE_UUID.INFO]:         { label: 'Informasi',   icon: 'ℹ️',  color: '#0369a1', bg: '#e0f2fe' },
  [NOTIFICATION_TYPE_UUID.WARNING]:      { label: 'Peringatan',  icon: '⚠️',  color: '#d97706', bg: '#fef3c7' },
  [NOTIFICATION_TYPE_UUID.CRITICAL]:     { label: 'Kritis',      icon: '🚨',  color: '#dc2626', bg: '#fee2e2' },
  [NOTIFICATION_TYPE_UUID.SUCCESS]:      { label: 'Berhasil',    icon: '✅',  color: '#059669', bg: '#d1fae5' },
  [NOTIFICATION_TYPE_UUID.REMINDER]:     { label: 'Pengingat',   icon: '🔔',  color: '#7c3aed', bg: '#ede9fe' },
  [NOTIFICATION_TYPE_UUID.TRANSACTION]:  { label: 'Transaksi',   icon: '🛒',  color: '#d97706', bg: '#fef9c3' },
  [NOTIFICATION_TYPE_UUID.SYSTEM]:       { label: 'Sistem',      icon: '⚙️',  color: '#64748b', bg: '#f1f5f9' },
  [NOTIFICATION_TYPE_UUID.ESCROW]:       { label: 'Escrow',      icon: '🔐',  color: '#7c3aed', bg: '#ede9fe' },
  [NOTIFICATION_TYPE_UUID.MARKETPLACE]:  { label: 'Marketplace', icon: '🛍️',  color: '#0891b2', bg: '#e0f7fa' },
  [NOTIFICATION_TYPE_UUID.LIVESTOCK]:    { label: 'Ternak',      icon: '🐄',  color: '#16a34a', bg: '#dcfce7' },
  [NOTIFICATION_TYPE_UUID.FEED]:         { label: 'Pakan',       icon: '🌾',  color: '#ca8a04', bg: '#fef9c3' },
  [NOTIFICATION_TYPE_UUID.MEDICINE]:     { label: 'Obat',        icon: '💊',  color: '#dc2626', bg: '#fee2e2' },
  [NOTIFICATION_TYPE_UUID.HEALTH]:       { label: 'Kesehatan',   icon: '🏥',  color: '#0891b2', bg: '#e0f7fa' },
  [NOTIFICATION_TYPE_UUID.AI_INSIGHT]:   { label: 'AI Insight',  icon: '🤖',  color: '#8b5cf6', bg: '#ede9fe' },
  [NOTIFICATION_TYPE_UUID.VERIFICATION]: { label: 'Verifikasi',  icon: '✅',  color: '#059669', bg: '#d1fae5' },
  [NOTIFICATION_TYPE_UUID.AUDIT]:        { label: 'Audit',       icon: '📋',  color: '#64748b', bg: '#f1f5f9' },
};
const DEFAULT_TYPE = { label: 'Notifikasi', icon: '🔔', color: '#64748b', bg: '#f1f5f9' };

function getTypeConf(uuid: string) {
  return TYPE_CONFIG[uuid] ?? DEFAULT_TYPE;
}

// ─── Time Formatter ───────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  record,
  onRead,
  onDelete,
  onNavigate,
}: {
  record: NotificationRecord;
  onRead: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  onNavigate: (route: string) => void;
}) {
  const conf = getTypeConf(record.notification_type_reference_uuid);
  const icon = record.icon ?? conf.icon;
  const isUnread = !record.is_read;

  return (
    <div
      onClick={() => {
        if (isUnread) onRead(record.notification_uuid);
        if (record.action_route) onNavigate(record.action_route);
      }}
      style={{
        position: 'relative',
        display: 'flex', gap: 12, padding: '14px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: isUnread ? 'rgba(59,130,246,0.04)' : 'var(--color-surface)',
        cursor: (isUnread || !!record.action_route) ? 'pointer' : 'default',
        borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          width: 8, height: 8, borderRadius: '50%',
          background: '#3b82f6',
        }} />
      )}

      {/* Type Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: conf.bg, border: `1px solid ${conf.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 19,
      }}>
        {icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{
          fontSize: 13.5, fontWeight: isUnread ? 700 : 500,
          color: isUnread ? 'var(--color-text)' : 'var(--color-muted)',
          lineHeight: 1.35, marginBottom: 3,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {record.title}
        </div>

        {/* Message preview */}
        <div style={{
          fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.5, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {record.message}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700,
            padding: '2px 7px', borderRadius: 20,
            background: conf.bg, color: conf.color,
            whiteSpace: 'nowrap',
          }}>
            {conf.icon} {conf.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {formatTime(record.created_at)}
          </span>
          {!isUnread && record.read_at && (
            <span style={{ fontSize: 11, color: '#059669' }}>
              ✓ Dibaca {formatTime(record.read_at)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
          onClick={e => e.stopPropagation()}
        >
          {record.action_route && record.action_label && (
            <button
              onClick={() => {
                if (isUnread) onRead(record.notification_uuid);
                onNavigate(record.action_route!);
              }}
              style={{
                padding: '5px 10px', borderRadius: 6,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {record.action_label} →
            </button>
          )}
          {isUnread && (
            <button
              onClick={() => onRead(record.notification_uuid)}
              style={{
                padding: '5px 10px', borderRadius: 6,
                background: 'transparent', color: '#059669',
                border: '1px solid #059669', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ✓ Dibaca
            </button>
          )}
          <button
            onClick={() => onDelete(record.notification_uuid)}
            title="Hapus notifikasi"
            style={{
              padding: '5px 8px', borderRadius: 6,
              background: 'transparent', color: '#94a3b8',
              border: '1px solid #e2e8f0', fontSize: 13,
              cursor: 'pointer', lineHeight: 1,
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabFilter }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      color: 'var(--color-muted)',
    }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>
        {tab === 'unread' ? '✅' : tab === 'read' ? '📭' : '🔔'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
        {tab === 'unread' ? 'Tidak ada notifikasi baru'
          : tab === 'read' ? 'Belum ada notifikasi yang dibaca'
          : 'Belum ada notifikasi'}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
        {tab === 'unread' ? 'Semua notifikasi sudah dibaca. Bagus!'
          : tab === 'read' ? 'Notifikasi yang sudah dibaca akan tampil di sini.'
          : 'Notifikasi aktivitas farm Anda akan muncul di sini.'}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabFilter = 'all' | 'unread' | 'read';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>('all');
  const [allNotifications, setAllNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [notifications, unread] = await Promise.all([
        getNotifications({ active_only: true }),
        countUnread(),
      ]);
      setAllNotifications(notifications);
      setUnreadCount(unread);
    } catch {
      // If auth fails or network error, show empty state
      setAllNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Re-load when any notification mutation fires bump()
    return subscribe(() => { loadData(); });
  }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRead = useCallback((uuid: string) => {
    markAsRead(uuid).catch(() => { /* fire-and-forget */ });
  }, []);

  const handleDelete = useCallback((uuid: string) => {
    deleteNotification(uuid).catch(() => { /* fire-and-forget */ });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead().catch(() => { /* fire-and-forget */ });
  }, []);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  // ── Derived display list ──────────────────────────────────────────────────────

  const displayed =
    tab === 'unread' ? allNotifications.filter(n => !n.is_read)
    : tab === 'read'  ? allNotifications.filter(n => n.is_read)
    : allNotifications;

  const unreadInList = allNotifications.filter(n => !n.is_read).length;
  const readInList   = allNotifications.filter(n => n.is_read).length;

  // ── Tab config ───────────────────────────────────────────────────────────────

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all',    label: 'Semua',        count: allNotifications.length },
    { key: 'unread', label: 'Belum Dibaca', count: unreadInList },
    { key: 'read',   label: 'Sudah Dibaca', count: readInList },
  ];

  return (
    <div style={{ minHeight: '100%', width: '100%', background: 'var(--color-bg)' }}>

      {/* ── Sub-header: count + mark-all ── */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          {loading
            ? <span>Memuat...</span>
            : unreadCount > 0
              ? <span style={{ fontWeight: 600, color: '#3b82f6' }}>{unreadCount} belum dibaca</span>
              : <span>Semua sudah dibaca ✓</span>
          }
        </span>
        {!loading && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            ✓✓ Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        paddingLeft: 4, overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 12px', fontSize: 13,
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted)',
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key
                ? '2px solid var(--color-primary)'
                : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10,
                background: tab === t.key ? 'var(--color-primary-light)' : '#f1f5f9',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted)',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-muted)', fontSize: 14 }}>
          Memuat notifikasi...
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div>
          {displayed.map(record => (
            <NotificationCard
              key={record.notification_uuid}
              record={record}
              onRead={handleRead}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
            />
          ))}

          {/* Footer hint */}
          <div style={{
            padding: '16px', textAlign: 'center',
            fontSize: 12, color: 'var(--color-muted)',
          }}>
            {displayed.length} notifikasi ditampilkan
          </div>
        </div>
      )}
    </div>
  );
}
