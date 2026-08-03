// ─── MPK-012 — Pusat Notifikasi Marketplace ──────────────────────────────────
// Halaman pusat notifikasi: ringkasan, filter per sumber, dan daftar notifikasi
// dari seluruh aktivitas Listing, Negosiasi, Chat, Transaksi, dan Sistem.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedList } from '../utils/usePaginatedList';
import { getActiveWorkspace } from '../components/TopAppBar';
import {
  getNotifikasi,
  getRingkasanNotifikasi,
  tandaiDibaca,
  tandaiSemuaDibaca,
  type NotifikasiItem,
  type NotifikasiSumber,
} from '../data/marketplaceNotifikasiData';
import { useMarketplaceNotifikasi } from '../hooks/useMarketplaceNotifikasi';

// ─── Helper ───────────────────────────────────────────────────────────────────

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} hari lalu`;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Konstanta Filter ─────────────────────────────────────────────────────────

type FilterKey = 'Semua' | NotifikasiSumber;

const FILTER_TABS: FilterKey[] = ['Semua', 'Listing', 'Negosiasi', 'Chat', 'Transaksi', 'Sistem'];

const FILTER_ICON: Record<FilterKey, string> = {
  Semua:      '🔔',
  Listing:    '📋',
  Negosiasi:  '🤝',
  Chat:       '💬',
  Transaksi:  '🧾',
  Sistem:     '⚙️',
};

// ─── Komponen Ringkasan ───────────────────────────────────────────────────────

function RingkasanCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: highlight ? 'var(--color-primary)' : 'var(--color-surface)',
      border: highlight ? 'none' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 10px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: 22, fontWeight: 800,
        color: highlight ? '#fff' : 'var(--color-primary)',
        lineHeight: 1.1, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10.5, fontWeight: 600,
        color: highlight ? 'rgba(255,255,255,0.85)' : 'var(--color-muted)',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Komponen Item Notifikasi ─────────────────────────────────────────────────

function NotifItem({
  item,
  onRead,
  onOpen,
}: {
  item: NotifikasiItem;
  onRead: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px',
        background: item.dibaca ? 'var(--color-bg)' : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={() => { onRead(); onOpen(); }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') { onRead(); onOpen(); } }}
    >
      {/* Indikator belum dibaca */}
      {!item.dibaca && (
        <span style={{
          position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-primary)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: item.dibaca ? 'var(--color-border)' : 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {item.icon}
      </div>

      {/* Konten */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
          <span style={{
            fontSize: 13, fontWeight: item.dibaca ? 600 : 700,
            color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {item.judul}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', flexShrink: 0 }}>
            {formatRelative(item.timestamp)}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--color-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {item.ringkasan}
        </div>
        {/* Badge sumber */}
        <span style={{
          display: 'inline-block', fontSize: 9.5, fontWeight: 700,
          padding: '2px 7px', borderRadius: 20,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}>
          {FILTER_ICON[item.sumber]} {item.sumber}
        </span>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

/** Convert a DB notification row to the shape NotifikasiItem expects. */
function dbRowToNotifikasiItem(row: {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  icon: string | null;
  action_route: string | null;
  is_read: boolean;
  created_at: string;
  recipient_workspace_id?: string | null;
}): NotifikasiItem {
  let sumber: NotifikasiSumber = 'Sistem';
  if (row.notification_type === 'Transaksi') sumber = 'Transaksi';

  // Map DB notification_type to the nearest NotifikasiTipe union value.
  const tipe = sumber === 'Transaksi' ? 'Transaksi Baru' as const : 'Verifikasi Berhasil' as const;

  return {
    id: `db-${row.id}`,
    sumber,
    tipe,
    judul: row.title,
    ringkasan: row.message,
    icon: row.icon ?? '🔔',
    timestamp: row.created_at,
    dibaca: row.is_read,
    navigateTo: row.action_route ?? undefined,
    targetWorkspaceId: row.recipient_workspace_id ?? '',
  };
}

export default function MarketplaceNotifikasi() {
  const navigate = useNavigate();
  const activeWs = getActiveWorkspace();
  const [filter, setFilter] = useState<FilterKey>('Semua');
  const [tick, setTick] = useState(0);

  // DB notifications (supplements the in-memory aggregated items)
  const { notifikasi: dbNotif, markRead: dbMarkRead, markAllRead: dbMarkAllRead } =
    useMarketplaceNotifikasi(activeWs.id);

  function refresh() { setTick(t => t + 1); }

  const memItems = getNotifikasi(activeWs.id);

  // Merge: DB rows come first (newest), then in-memory items not already in DB
  const dbIds = useMemo(() => new Set(dbNotif.map((r) => `db-${r.id}`)), [dbNotif]);
  const allItems = useMemo((): NotifikasiItem[] => {
    const dbConverted = dbNotif.map(dbRowToNotifikasiItem);
    const memFiltered = memItems.filter((m) => !dbIds.has(m.id));
    return [...dbConverted, ...memFiltered].sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp),
    );
  }, [dbNotif, memItems, dbIds]);

  const ringkasan = getRingkasanNotifikasi(activeWs.id);

  const filtered = filter === 'Semua'
    ? allItems
    : allItems.filter(n => n.sumber === filter);

  const { visible: notifVisible, hasMore: notifHasMore, sentinelRef: notifSentinel } = usePaginatedList(filtered, 20);

  function handleTandaiDibaca(id: string) {
    if (id.startsWith('db-')) {
      void dbMarkRead(id.slice(3));
    } else {
      tandaiDibaca(id);
    }
    refresh();
  }

  async function handleTandaiSemuaDibaca() {
    await dbMarkAllRead();
    tandaiSemuaDibaca(activeWs.id);
    refresh();
  }

  function handleOpen(item: NotifikasiItem) {
    if (item.navigateTo) navigate(item.navigateTo);
  }

  const adaBelumDibaca = filtered.some(n => !n.dibaca);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 12px',
        background: 'var(--color-surface)',
        borderBottom: '1.5px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
              🔔 Notifikasi Marketplace
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 1 }}>
              {ringkasan.belumDibaca > 0
                ? `${ringkasan.belumDibaca} belum dibaca`
                : 'Semua sudah dibaca'}
            </div>
          </div>
          {adaBelumDibaca && (
            <button
              type="button"
              onClick={handleTandaiSemuaDibaca}
              style={{
                padding: '7px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-light)', border: 'none',
                color: 'var(--color-primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* ── Ringkasan ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8 }}>
          <RingkasanCard label="Total" value={ringkasan.total} />
          <RingkasanCard label="Belum Dibaca" value={ringkasan.belumDibaca} highlight={ringkasan.belumDibaca > 0} />
          <RingkasanCard label="Hari Ini" value={ringkasan.hariIni} />
          <RingkasanCard label="Minggu Ini" value={ringkasan.mingguIni} />
        </div>
      </div>

      {/* ── Filter Tab ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        scrollbarWidth: 'none',
      }}>
        {FILTER_TABS.map(tab => {
          const count = tab === 'Semua'
            ? allItems.filter(n => !n.dibaca).length
            : allItems.filter(n => n.sumber === tab && !n.dibaca).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                flex: '0 0 auto', padding: '10px 14px',
                fontSize: 12, fontWeight: filter === tab ? 700 : 500,
                color: filter === tab ? 'var(--color-primary)' : 'var(--color-muted)',
                background: 'transparent', border: 'none',
                borderBottom: filter === tab
                  ? '2.5px solid var(--color-primary)'
                  : '2.5px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {FILTER_ICON[tab]} {tab}
              {count > 0 && (
                <span style={{
                  fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 10,
                  background: filter === tab ? 'var(--color-primary)' : 'var(--color-border)',
                  color: filter === tab ? '#fff' : 'var(--color-muted)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Daftar Notifikasi ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Tidak ada notifikasi
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {filter === 'Semua'
              ? 'Belum ada aktivitas Marketplace untuk workspace ini.'
              : `Tidak ada notifikasi dari sumber "${filter}".`}
          </div>
        </div>
      ) : (
        <div>
          {notifVisible.map(item => (
            <NotifItem
              key={`${item.id}-${tick}`}
              item={item}
              onRead={() => handleTandaiDibaca(item.id)}
              onOpen={() => handleOpen(item)}
            />
          ))}
          {notifHasMore && (
            <div ref={notifSentinel} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
