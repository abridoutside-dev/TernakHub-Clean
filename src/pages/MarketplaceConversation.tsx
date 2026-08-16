// ─── PROFILE-005 — Transaction Conversation Page ─────────────────────────────
// Mengacu pada: docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Layout:
//   ConversationHeader  → TransactionId, Status, Workspace, Listing
//   TransactionSummary  → Buyer, Seller, Nilai, Status, Settlement
//   ParticipantBar      → Daftar Participant aktif
//   MessageList         → Riwayat percakapan (scrollable)
//   Composer            → Text, Attachment, Send

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import TransactionTabBar from '../components/TransactionTabBar';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';
import {
  getOrCreateConversation,
  getConversationByTransaksiId,
  getConversationParticipants,
  getConversationMessages,
  sendConversationMessage,
  markConversationAsRead,
  searchConversationMessages,
  type ConversationRoom,
  type ConversationMessage,
  type ConversationParticipant,
  type ParticipantRole,
  type ConversationMessageTipe,
} from '../data/transaksiConversationData';
import { type TransaksiStatus } from '../data/marketplaceTransaksiData';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TransaksiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  Disetujui:              { bg: '#e8f5ee', color: '#1b7a43', icon: '✅' },
  Ditolak:                { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Menunggu Pembayaran':  { bg: '#fff3e0', color: '#e65100', icon: '💳' },
  Diproses:               { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  'Siap Diserahkan':      { bg: '#f3e5f5', color: '#6a1b9a', icon: '📦' },
  'Sedang Dikirim':       { bg: '#e0f7fa', color: '#006064', icon: '🚚' },
  Selesai:                { bg: '#e8f5ee', color: '#1b5e20', icon: '🎉' },
  Dibatalkan:             { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
};

const ROLE_CONFIG: Record<ParticipantRole, { icon: string; label: string; color: string; bg: string }> = {
  Buyer:        { icon: '🛒', label: 'Buyer',        color: '#1565c0', bg: '#e3f2fd' },
  Seller:       { icon: '🏪', label: 'Seller',       color: '#1b7a43', bg: '#e8f5ee' },
  Escrow:       { icon: '🔐', label: 'Escrow',       color: '#7b5e2a', bg: '#fff8e1' },
  Transport:    { icon: '🚚', label: 'Transport',    color: '#006064', bg: '#e0f7fa' },
  Veterinarian: { icon: '👨‍⚕️', label: 'Veterinarian', color: '#6a1b9a', bg: '#f3e5f5' },
};

const IMG_PRESETS = ['🐑','🐄','🐐','🐓','🦆','🌾','🌿','💊','📦','🚚','🌱','📸','📋','✅','🤝'];

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Hari ini';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Status Icon (pesan) ──────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ConversationMessage['status'] }) {
  if (status === 'Sending')   return <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>⏳</span>;
  if (status === 'Sent')      return <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>✓</span>;
  if (status === 'Delivered') return <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>✓✓</span>;
  return <span style={{ color: '#a8edff', fontSize: 10 }}>✓✓</span>;
}

// ─── Conversation Header ──────────────────────────────────────────────────────

function ConversationHeader({
  room,
  onSearch,
  showSearch,
}: {
  room: ConversationRoom;
  onSearch: () => void;
  showSearch: boolean;
}) {
  const badge = STATUS_BADGE[room.transaksiStatus];
  const { activeWorkspace } = useWorkspace();
  const ws = activeWorkspace;  if (!ws) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }


  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '10px 14px',
    }}>
      {/* Row 1: TRX ID + Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
          color: 'var(--color-text)', background: 'var(--color-bg)',
          border: '1px solid var(--color-border)', borderRadius: 6,
          padding: '2px 8px', flexShrink: 0,
        }}>
          {room.transaksiId}
        </span>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: badge.color,
          background: badge.bg, borderRadius: 20, padding: '2px 8px',
          flexShrink: 0,
        }}>
          {badge.icon} {room.transaksiStatus}
        </span>
        <div style={{ flex: 1 }} />
        {/* Search toggle */}
        <button
          type="button"
          onClick={onSearch}
          title="Cari pesan"
          style={{
            background: showSearch ? 'var(--color-primary)' : 'var(--color-bg)',
            color: showSearch ? '#fff' : 'var(--color-muted)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
            fontSize: 14, lineHeight: 1,
          }}
        >
          🔍
        </button>
      </div>

      {/* Row 2: Listing thumbnail + title + workspace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {room.thumbnailListing}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {room.judulListing}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
            {getWorkspaceIcon(ws)} {ws.workspace_name}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Summary ──────────────────────────────────────────────────────

function TransactionSummary({ room }: { room: ConversationRoom }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: 'var(--color-bg)',
      borderBottom: '1.5px solid var(--color-border)',
    }}>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '8px 14px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Ringkasan Transaksi
        </span>
        <span style={{
          fontSize: 12, color: 'var(--color-muted)',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)',
          transition: 'transform 0.2s',
        }}>›</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Buyer + Seller row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{
              background: ROLE_CONFIG.Buyer.bg,
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ROLE_CONFIG.Buyer.color, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                🛒 Buyer
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>
                {room.workspaceIconBuyer} {room.workspaceNamaBuyer}
              </div>
            </div>
            <div style={{
              background: ROLE_CONFIG.Seller.bg,
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ROLE_CONFIG.Seller.color, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                🏪 Seller
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>
                {room.workspaceIconSeller} {room.workspaceNamaSeller}
              </div>
            </div>
          </div>

          {/* Nilai + Settlement row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                Nilai Transaksi
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatRp(room.nilaiTransaksi)}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                {room.qty} {room.satuanHarga}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                Settlement
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11.5, fontWeight: 700,
                color: room.settlementMethod === 'Escrow' ? '#7b5e2a' : '#1565c0',
                background: room.settlementMethod === 'Escrow' ? '#fff8e1' : '#e3f2fd',
                borderRadius: 6, padding: '3px 8px',
              }}>
                {room.settlementMethod === 'Escrow' ? '🔐' : '🤝'} {room.settlementMethod}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Participant Bar ──────────────────────────────────────────────────────────

function ParticipantBar({ participants }: { participants: ConversationParticipant[] }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '8px 14px',
      overflowX: 'auto',
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        Participant
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {participants.filter((p) => p.isActive).map((p) => {
          const cfg = ROLE_CONFIG[p.role];
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: cfg.bg,
                border: `2px solid ${cfg.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, position: 'relative',
              }}>
                {p.workspaceIcon}
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: cfg.bg, border: `1.5px solid ${cfg.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8,
                }}>
                  {cfg.icon}
                </div>
              </div>
              {/* Info */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                  {p.workspaceNama.length > 14 ? p.workspaceNama.slice(0, 14) + '…' : p.workspaceNama}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: cfg.color,
                  background: cfg.bg, borderRadius: 4, padding: '1px 4px',
                }}>
                  {cfg.label}
                </span>
              </div>

              {/* Separator */}
              <div style={{ width: 1, height: 28, background: 'var(--color-border)', marginLeft: 2 }} />
            </div>
          );
        })}

        {/* Slot Escrow/Transport/Vet (future) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          opacity: 0.4, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px dashed var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--color-muted)',
          }}>
            +
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-muted)' }}>
            Escrow/<br />Transport
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({
  query,
  onChange,
  resultCount,
  onClose,
}: {
  query: string;
  onChange: (q: string) => void;
  resultCount: number;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari isi pesan atau pengirim…"
        style={{
          flex: 1, border: 'none', outline: 'none',
          background: 'transparent', fontSize: 13,
          color: 'var(--color-text)',
        }}
      />
      {query && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          {resultCount} hasil
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: 'var(--color-muted)', lineHeight: 1, padding: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isSelf,
  senderLabel,
  showSenderLabel,
}: {
  msg: ConversationMessage;
  isSelf: boolean;
  senderLabel: string;
  showSenderLabel: boolean;
}) {
  const cfg = ROLE_CONFIG[msg.fromRole];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isSelf ? 'flex-end' : 'flex-start',
      marginBottom: 4,
    }}>
      {/* Sender label (role badge) — hanya untuk pesan dari orang lain */}
      {!isSelf && showSenderLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, marginLeft: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
            {senderLabel}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: cfg.color,
            background: cfg.bg, borderRadius: 4, padding: '1px 5px',
          }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      )}

      <div style={{
        maxWidth: '78%',
        background: isSelf ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isSelf ? '#fff' : 'var(--color-text)',
        borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: msg.tipe === 'Gambar' ? '8px 12px' : msg.tipe === 'File' ? '10px 14px' : '9px 13px',
        border: isSelf ? 'none' : '1.5px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {msg.tipe === 'Gambar' && (
          <div style={{ fontSize: 44, lineHeight: 1.1, textAlign: 'center' }}>
            {msg.konten}
          </div>
        )}

        {msg.tipe === 'File' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>📎</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{msg.fileName ?? msg.konten}</div>
              {msg.fileSize && <div style={{ fontSize: 10.5, opacity: 0.7 }}>{msg.fileSize}</div>}
            </div>
          </div>
        )}

        {msg.tipe === 'Teks' && (
          <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.konten}
          </div>
        )}

        {/* Time + status */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
          marginTop: 4,
        }}>
          <span style={{ fontSize: 10, opacity: 0.65 }}>{formatTime(msg.timestamp)}</span>
          {isSelf && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

// ─── Attachment Picker ────────────────────────────────────────────────────────

function AttachmentPicker({
  onPickImage,
  onPickFile,
  onClose,
}: {
  onPickImage: (emoji: string) => void;
  onPickFile: (name: string, size: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'menu' | 'image' | 'file'>('menu');
  const [fileName, setFileName] = useState('');

  if (mode === 'image') {
    return (
      <div style={{
        position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 20,
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 4,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button type="button" onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)' }}>← Kembali</button>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Pilih Gambar</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-muted)' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {IMG_PRESETS.map((emoji, i) => (
            <button
              key={i} type="button"
              onClick={() => { onPickImage(emoji); onClose(); }}
              style={{
                width: 40, height: 40, fontSize: 22, borderRadius: 8,
                background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--color-muted)' }}>
          Upload gambar nyata tersedia pada versi berikutnya.
        </div>
      </div>
    );
  }

  if (mode === 'file') {
    return (
      <div style={{
        position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 20,
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 4,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button type="button" onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)' }}>← Kembali</button>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Lampiran Berkas</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-muted)' }}>✕</button>
        </div>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Nama berkas (contoh: bukti-transfer.pdf)"
          autoFocus
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: '1.5px solid var(--color-border)', fontSize: 13,
            color: 'var(--color-text)', background: 'var(--color-bg)',
            boxSizing: 'border-box', outline: 'none', marginBottom: 8,
          }}
        />
        <button
          type="button"
          disabled={!fileName.trim()}
          onClick={() => { onPickFile(fileName.trim(), '—'); onClose(); }}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 8,
            background: fileName.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
            cursor: fileName.trim() ? 'pointer' : 'default',
          }}
        >
          Lampirkan Berkas
        </button>
        <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--color-muted)' }}>
          Upload berkas nyata tersedia pada versi berikutnya.
        </div>
      </div>
    );
  }

  // Menu utama
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, zIndex: 20,
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 8, marginBottom: 4,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140,
    }}>
      <button
        type="button" onClick={() => setMode('image')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'transparent', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, color: 'var(--color-text', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18 }}>📸</span> Gambar
      </button>
      <button
        type="button" onClick={() => setMode('file')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'transparent', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18 }}>📎</span> Berkas
      </button>
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  onSend,
}: {
  onSend: (konten: string, tipe: ConversationMessageTipe, fileName?: string, fileSize?: string) => void;
}) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, 'Teks');
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderTop: '1.5px solid var(--color-border)',
      padding: '8px 10px',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      position: 'relative',
    }}>
      {showPicker && (
        <AttachmentPicker
          onPickImage={(emoji) => { onSend(emoji, 'Gambar'); setShowPicker(false); }}
          onPickFile={(name, size) => { onSend(name, 'File', name, size); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: showPicker ? 'var(--color-primary)' : 'var(--color-bg)',
            color: showPicker ? '#fff' : 'var(--color-muted)',
            border: '1.5px solid var(--color-border)',
            cursor: 'pointer', fontSize: 18, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          📎
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan…"
          rows={1}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 12,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-bg)',
            fontSize: 13, color: 'var(--color-text)',
            resize: 'none', outline: 'none', lineHeight: 1.5,
            minHeight: 38, maxHeight: 96,
            overflowY: 'auto', fontFamily: 'inherit',
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: text.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            color: '#fff', border: 'none',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, transition: 'background 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceConversation() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace;

  const [room, setRoom]               = useState<ConversationRoom | null>(null);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [messages, setMessages]        = useState<ConversationMessage[]>([]);
  const [tick, setTick]                = useState(0);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  // Load conversation
  useEffect(() => {
    if (!transaksiId) return;
    const r = getOrCreateConversation(transaksiId);
    if (!r) return;
    setRoom(r);
    setParticipants(getConversationParticipants(r.id));
    const msgs = getConversationMessages(r.id);
    setMessages(msgs);
    markConversationAsRead(r.id, activeWs!.workspace_uuid);
  }, [transaksiId, tick]);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Tutup search jika tidak ada query
  function handleToggleSearch() {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery('');
    } else {
      setShowSearch(true);
    }
  }

  function handleSend(konten: string, tipe: ConversationMessageTipe, fileName?: string, fileSize?: string) {
    if (!room) return;
    sendConversationMessage(room.id, activeWs!.workspace_uuid, tipe, konten, fileName, fileSize);
    setTick((t) => t + 1);
  }

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (!room) {
    const r = transaksiId ? getConversationByTransaksiId(transaksiId) ?? null : null;
    if (!r && transaksiId) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100dvh - var(--top-app-bar-height))',
          gap: 12, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
            Transaksi tidak ditemukan
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            ID: {transaksiId}
          </div>
          <button
            type="button"
            onClick={() => navigate('/marketplace/transaksi')}
            style={{
              padding: '9px 18px', borderRadius: 8, background: 'var(--color-primary)',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}
          >
            ← Kembali ke Transaksi
          </button>
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - var(--top-app-bar-height))',
      }}>
        <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Memuat conversation…</div>
      </div>
    );
  }

  // ─── Pesan yang ditampilkan (dengan filter search) ──────────────────────────

  const displayMessages: ConversationMessage[] =
    showSearch && searchQuery.trim()
      ? searchConversationMessages(room.id, searchQuery)
      : messages;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - var(--top-app-bar-height))',
      minHeight: 0,
      background: 'var(--color-bg)',
    }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <ConversationHeader
        room={room}
        onSearch={handleToggleSearch}
        showSearch={showSearch}
      />

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <TransactionTabBar transaksiId={room.transaksiId} activeTab="conversation" hasEscrow={!!getEscrowByTransaksiId(room.transaksiId)} />

      {/* ── Transaction Summary ──────────────────────────────────────────────── */}
      <TransactionSummary room={room} />

      {/* ── Participant Bar ──────────────────────────────────────────────────── */}
      <ParticipantBar participants={participants} />

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      {showSearch && (
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          resultCount={displayMessages.length}
          onClose={() => { setShowSearch(false); setSearchQuery(''); }}
        />
      )}

      {/* ── Message List ────────────────────────────────────────────────────── */}
      <div
        ref={messagesAreaRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {displayMessages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5,
          }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
              {showSearch && searchQuery
                ? 'Tidak ada pesan yang cocok.'
                : 'Belum ada percakapan.\nMulai dengan mengirim pesan.'}
            </div>
          </div>
        )}

        {displayMessages.map((msg, idx) => {
          const isSelf = msg.fromWorkspaceId === activeWs!.workspace_uuid;
          const prevMsg = displayMessages[idx - 1];
          const showDateSep = !prevMsg || !sameDay(prevMsg.timestamp, msg.timestamp);

          // Tampilkan label pengirim jika beda dari pesan sebelumnya (non-self)
          const showSenderLabel = !isSelf && (
            !prevMsg ||
            prevMsg.fromWorkspaceId !== msg.fromWorkspaceId ||
            showDateSep
          );

          const sender = participants.find((p) => p.workspaceId === msg.fromWorkspaceId);
          const senderLabel = sender?.workspaceNama ?? msg.fromWorkspaceId;

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <div style={{
                  textAlign: 'center', margin: '10px 0',
                  fontSize: 11, color: 'var(--color-muted)',
                  position: 'relative',
                }}>
                  <span style={{
                    background: 'var(--color-bg)',
                    padding: '2px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                  }}>
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}

              <MessageBubble
                msg={msg}
                isSelf={isSelf}
                senderLabel={senderLabel}
                showSenderLabel={showSenderLabel}
              />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ────────────────────────────────────────────────────────── */}
      <Composer onSend={handleSend} />
    </div>
  );
}
