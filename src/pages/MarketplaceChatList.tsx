// ─── MPK-011 — Daftar Chat Marketplace ───────────────────────────────────────
// Inbox semua ruang chat workspace aktif — sebagai Pembeli maupun Penjual.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { WORKSPACES } from '../components/TopAppBar';
import { useMarketplace } from '../hooks/useMarketplace';
import {
  getChatRoomsByWorkspace,
  type ChatRoom,
} from '../data/marketplaceChatData';
import { getListingByUuid } from '../data/marketplaceListingData';

// ─── Helper ───────────────────────────────────────────────────────────────────

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

function getWorkspaceName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function getWorkspaceIcon(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.icon ?? '🏪';
}

// ─── Komponen Item Chat ───────────────────────────────────────────────────────

function ChatItem({ room, activeWsId, onOpen }: {
  room: ChatRoom;
  activeWsId: string;
  onOpen: () => void;
}) {
  const listing = getListingByUuid(room.listingUuid);
  const isPembeli = room.workspaceIdPembeli === activeWsId;
  const lawanId = isPembeli ? room.workspaceIdPenjual : room.workspaceIdPembeli;
  const lawanNama = getWorkspaceName(lawanId);
  const lawanIcon = getWorkspaceIcon(lawanId);
  const unread = isPembeli ? room.unreadPembeli : room.unreadPenjual;
  const peranLabel = isPembeli ? 'Pembeli' : 'Penjual';

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '14px 16px', textAlign: 'left',
        background: 'var(--color-surface)', border: 'none',
        borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, position: 'relative',
      }}>
        {listing?.media.thumbnail ?? lawanIcon}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>

      {/* Konten */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Baris atas: nama lawan + waktu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{
            fontSize: 13, fontWeight: unread > 0 ? 700 : 600,
            color: 'var(--color-text)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%',
          }}>
            {lawanIcon} {lawanNama}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', flexShrink: 0, marginLeft: 6 }}>
            {formatRelative(room.lastMessageAt)}
          </span>
        </div>

        {/* Judul listing */}
        <div style={{
          fontSize: 11, color: 'var(--color-primary)', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
        }}>
          📦 {listing?.judul ?? 'Listing tidak tersedia'}
        </div>

        {/* Preview pesan terakhir */}
        <div style={{
          fontSize: 12, color: unread > 0 ? 'var(--color-text)' : 'var(--color-muted)',
          fontWeight: unread > 0 ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: 'var(--color-muted)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 4, padding: '1px 4px', flexShrink: 0,
          }}>
            {peranLabel}
          </span>
          {room.lastMessagePreview || <span style={{ fontStyle: 'italic' }}>Belum ada pesan</span>}
        </div>
      </div>
    </button>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

type TabKey = 'Semua' | 'Sebagai Pembeli' | 'Sebagai Penjual';

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceChatList() {
  useMarketplace(); // FLOW-003M27: hydrate marketplace data from Supabase on mount
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace;  if (!activeWs) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }

  const [tab, setTab] = useState<TabKey>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const allRooms = getChatRoomsByWorkspace(activeWs.workspace_uuid);
  const tabs: TabKey[] = ['Semua', 'Sebagai Pembeli', 'Sebagai Penjual'];

  const filtered = allRooms.filter(r => {
    const byTab =
      tab === 'Sebagai Pembeli' ? r.workspaceIdPembeli === activeWs.workspace_uuid :
      tab === 'Sebagai Penjual' ? r.workspaceIdPenjual === activeWs.workspace_uuid :
      true;
    if (!byTab) return false;

    // F-016: search by listing title or counterpart workspace name (debounced)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.trim().toLowerCase();
      const listing = getListingByUuid(r.listingUuid);
      const lawanId = r.workspaceIdPembeli === activeWs.workspace_uuid
        ? r.workspaceIdPenjual
        : r.workspaceIdPembeli;
      const lawanNama = getWorkspaceName(lawanId).toLowerCase();
      const judulMatch = (listing?.judul ?? '').toLowerCase().includes(q);
      const lawanMatch = lawanNama.includes(q);
      if (!judulMatch && !lawanMatch) return false;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Search */}
      <div style={{ padding: '10px 14px 6px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama listing atau workspace…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 32, paddingRight: 10, height: 36,
              borderRadius: 'var(--radius-md)', fontSize: 13,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg)',
            }}
          />
        </div>
      </div>

      {/* Tab filter */}
      <div style={{
        display: 'flex', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)', overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: '0 0 auto', padding: '10px 14px',
              fontSize: 12, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
              background: 'transparent', border: 'none',
              borderBottom: tab === t ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Daftar chat */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada percakapan
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Buka Detail Listing dan klik "Hubungi Penjual" untuk memulai percakapan.
          </div>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Jelajahi Marketplace
          </button>
        </div>
      ) : (
        <div>
          {filtered.map(room => (
            <ChatItem
              key={room.id}
              room={room}
              activeWsId={activeWs.workspace_uuid}
              onOpen={() => navigate(`/marketplace/chat/${room.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
