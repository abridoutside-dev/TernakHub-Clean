// ─── PROFILE-006 — Evidence Timeline ─────────────────────────────────────────
// Halaman Evidence untuk satu transaksi.
// Evidence BUKAN Chat — dipisahkan sejak awal.
// Mengacu pada: docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Layout:
//   PageHeader    → TRX ID, Status, Listing
//   TabBar        → Conversation | Evidence | Audit Trail
//   FilterBar     → Filter Category + Search Caption
//   EvidenceList  → Terbaru → Terlama
//   FAB           → Tambah Evidence

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import TransactionTabBar from '../components/TransactionTabBar';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';
import {
  getEvidenceByTransaksiId,
  addEvidence,
  filterEvidence,
  EVIDENCE_CATEGORY_CONFIG,
  EVIDENCE_FILE_ICON,
  EVIDENCE_STATUS_CONFIG,
  EVIDENCE_RETENTION,
  CHAT_RETENTION_DAYS,
  type EvidenceRecord,
  type EvidenceCategory,
  type EvidenceFileType,
  type EvidenceStatus,
} from '../data/transaksiEvidenceData';
import { getConversationByTransaksiId, type ConversationRoom } from '../data/transaksiConversationData';
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

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const ALL_CATEGORIES: EvidenceCategory[] = [
  'Agreement', 'Payment', 'Delivery', 'Arrival', 'Livestock Condition', 'Document', 'Other',
];

const FILE_TYPES: EvidenceFileType[] = ['Image', 'PDF', 'Video'];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSep(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Page Header ─────────────────────────────────────────────────────────────

function PageHeader({ room }: { room: ConversationRoom }) {
  const badge = STATUS_BADGE[room.transaksiStatus];
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '10px 14px',
      flexShrink: 0,
    }}>
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
        }}>
          {badge.icon} {room.transaksiStatus}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
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
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {room.workspaceIconBuyer} {room.workspaceNamaBuyer} → {room.workspaceIconSeller} {room.workspaceNamaSeller}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  activeCategory,
  onCategory,
  searchQuery,
  onSearch,
  total,
}: {
  activeCategory: EvidenceCategory | 'All';
  onCategory: (c: EvidenceCategory | 'All') => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  total: number;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      flexShrink: 0,
    }}>
      {/* Category chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 14px',
        overflowX: 'auto',
      }}>
        {(['All', ...ALL_CATEGORIES] as (EvidenceCategory | 'All')[]).map((cat) => {
          const isActive = cat === activeCategory;
          const cfg = cat === 'All' ? null : EVIDENCE_CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: isActive ? 'var(--color-primary)' : (cfg ? cfg.bg : 'var(--color-bg)'),
                color: isActive ? '#fff' : (cfg ? cfg.color : 'var(--color-muted)'),
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat === 'All' ? '🗂 Semua' : `${cfg!.icon} ${cfg!.label}`}
            </button>
          );
        })}
      </div>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 14px 8px',
      }}>
        <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cari caption atau nama file…"
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', fontSize: 13,
            color: 'var(--color-text)',
          }}
        />
        {searchQuery && (
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {total} hasil
          </span>
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-muted)' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Evidence Card ────────────────────────────────────────────────────────────

function EvidenceCard({ record }: { record: EvidenceRecord }) {
  const catCfg    = EVIDENCE_CATEGORY_CONFIG[record.category];
  const statusCfg = EVIDENCE_STATUS_CONFIG[record.status];
  const fileIcon  = EVIDENCE_FILE_ICON[record.fileType];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: catCfg.bg,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 18 }}>{catCfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: catCfg.color }}>
          {catCfg.label}
        </span>
        <div style={{ flex: 1 }} />
        {/* Status badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: statusCfg.color,
          background: statusCfg.bg, borderRadius: 20, padding: '2px 8px',
        }}>
          {statusCfg.icon} {record.status}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        {/* File info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>{fileIcon}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {record.fileName}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
              {record.fileType}
            </div>
          </div>
          {/* Retention badge */}
          <span style={{
            fontSize: 9.5, color: 'var(--color-muted)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 6, padding: '2px 6px', flexShrink: 0,
          }}>
            🗓 {record.retention.label}
          </span>
        </div>

        {/* Caption */}
        <div style={{
          fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.5,
          marginBottom: 8,
        }}>
          {record.caption}
        </div>

        {/* Warnings */}
        {record.warnings.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {record.warnings.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                background: '#fff8e1', border: '1px solid #ffe082',
                borderRadius: 6, padding: '6px 10px', marginBottom: 4,
              }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7b5e2a' }}>{w.type}</div>
                  <div style={{ fontSize: 11.5, color: '#5d4037', lineHeight: 1.4 }}>{w.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer: uploader + timestamp */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 10.5, color: 'var(--color-muted)',
          paddingTop: 6, borderTop: '1px solid var(--color-border)',
        }}>
          <span>
            <span style={{ fontWeight: 600 }}>{record.uploadedByNama}</span>
            {' · '}
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: '#1565c0',
              background: '#e3f2fd', borderRadius: 4, padding: '1px 5px',
            }}>
              {record.uploadedByRole}
            </span>
          </span>
          <span>{formatDatetime(record.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Add Evidence Form ────────────────────────────────────────────────────────

function AddEvidenceForm({
  transaksiId,
  onDone,
  onCancel,
}: {
  transaksiId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
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

  const [category, setCategory] = useState<EvidenceCategory>('Payment');
  const [fileType, setFileType]  = useState<EvidenceFileType>('Image');
  const [fileName, setFileName]  = useState('');
  const [caption, setCaption]    = useState('');
  const [saving, setSaving]      = useState(false);

  function handleSubmit() {
    if (!fileName.trim() || !caption.trim()) return;
    setSaving(true);
    setTimeout(() => {
      addEvidence({
        transaksiId,
        category,
        fileType,
        fileName: fileName.trim(),
        caption:  caption.trim(),
        uploadedBy:     ws!.workspace_uuid,
        uploadedByRole: 'Buyer', // default — sesuai workspace aktif
        uploadedByNama: ws!.workspace_name,
      });
      setSaving(false);
      onDone();
    }, 400);
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
      }}>
        📎 Tambah Evidence
      </div>

      {/* Category */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>
          Kategori
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: '1.5px solid var(--color-border)', fontSize: 13,
            background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none',
          }}
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EVIDENCE_CATEGORY_CONFIG[c].icon} {EVIDENCE_CATEGORY_CONFIG[c].label}
            </option>
          ))}
        </select>
      </div>

      {/* File Type */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>
          Tipe File
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILE_TYPES.map((ft) => (
            <button
              key={ft} type="button"
              onClick={() => setFileType(ft)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1.5px solid',
                borderColor: fileType === ft ? 'var(--color-primary)' : 'var(--color-border)',
                background: fileType === ft ? 'var(--color-primary)' : 'var(--color-bg)',
                color: fileType === ft ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {EVIDENCE_FILE_ICON[ft]} {ft}
            </button>
          ))}
        </div>
      </div>

      {/* File Name */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>
          Nama File
        </label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="contoh: bukti-transfer.pdf"
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: '1.5px solid var(--color-border)', fontSize: 13,
            background: 'var(--color-bg)', color: 'var(--color-text)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Caption */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>
          Caption / Deskripsi
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Jelaskan isi file ini…"
          rows={3}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: '1.5px solid var(--color-border)', fontSize: 13,
            background: 'var(--color-bg)', color: 'var(--color-text)',
            outline: 'none', resize: 'vertical', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Retention info */}
      <div style={{
        fontSize: 11, color: 'var(--color-muted)',
        background: 'var(--color-bg)', borderRadius: 6,
        padding: '6px 10px', marginBottom: 12,
        border: '1px solid var(--color-border)',
      }}>
        🗓 Retensi kategori <strong>{category}</strong>: {EVIDENCE_RETENTION[category].label}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button" onClick={onCancel}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--color-bg)', color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)', cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button" onClick={handleSubmit}
          disabled={!fileName.trim() || !caption.trim() || saving}
          style={{
            flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: (fileName.trim() && caption.trim()) ? 'var(--color-primary)' : 'var(--color-border)',
            color: '#fff', border: 'none',
            cursor: (fileName.trim() && caption.trim()) ? 'pointer' : 'default',
          }}
        >
          {saving ? 'Menyimpan…' : '📎 Simpan Evidence'}
        </button>
      </div>
    </div>
  );
}

// ─── Retention Info Panel ─────────────────────────────────────────────────────

function RetentionInfoPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, marginBottom: 12,
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 11.5, color: 'var(--color-muted)',
        }}
      >
        <span>🗓 Kebijakan Retensi</span>
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: 12 }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, marginTop: 8 }}>
            💬 <strong>Chat</strong>: {CHAT_RETENTION_DAYS} hari (default)
          </div>
          {ALL_CATEGORIES.map((cat) => (
            <div key={cat} style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 3 }}>
              {EVIDENCE_CATEGORY_CONFIG[cat].icon} <strong>{cat}</strong>: {EVIDENCE_RETENTION[cat].label}
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
            📋 <strong>Audit Trail</strong>: Permanen (kebijakan sistem)
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceEvidenceTimeline() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate = useNavigate();

  const [room, setRoom]               = useState<ConversationRoom | null>(null);
  const [records, setRecords]         = useState<EvidenceRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<EvidenceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [tick, setTick]               = useState(0);

  useEffect(() => {
    if (!transaksiId) return;
    const r = getConversationByTransaksiId(transaksiId);
    if (r) setRoom(r);
    setRecords(getEvidenceByTransaksiId(transaksiId));
  }, [transaksiId, tick]);

  const displayRecords = transaksiId
    ? filterEvidence(transaksiId, activeCategory, searchQuery)
    : [];

  function handleDone() {
    setShowAddForm(false);
    setTick((t) => t + 1);
  }

  // ─── Error state ───────────────────────────────────────────────────────────

  if (!room && transaksiId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - var(--top-app-bar-height))', gap: 12, padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Transaksi tidak ditemukan</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{transaksiId}</div>
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
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--top-app-bar-height))',
      minHeight: 0,
      background: 'var(--color-bg)',
    }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      {room && <PageHeader room={room} />}

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      {transaksiId && (
        <TransactionTabBar transaksiId={transaksiId} activeTab="evidence" hasEscrow={!!getEscrowByTransaksiId(transaksiId)} />
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <FilterBar
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        total={displayRecords.length}
      />

      {/* ── Evidence List ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* Add Form */}
        {showAddForm && transaksiId && (
          <AddEvidenceForm
            transaksiId={transaksiId}
            onDone={handleDone}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Retention info */}
        <RetentionInfoPanel />

        {/* Empty state */}
        {displayRecords.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', gap: 10, opacity: 0.5, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36 }}>📎</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              {searchQuery || activeCategory !== 'All'
                ? 'Tidak ada Evidence yang cocok.'
                : 'Belum ada Evidence untuk transaksi ini.'}
            </div>
          </div>
        )}

        {/* Records — terbaru → terlama */}
        {displayRecords.map((rec, idx) => {
          const prev = displayRecords[idx - 1];
          const showDateSep = !prev || !sameDay(rec.uploadedAt, prev.uploadedAt);
          return (
            <div key={rec.id}>
              {showDateSep && (
                <div style={{
                  textAlign: 'center', margin: '10px 0', fontSize: 11,
                  color: 'var(--color-muted)',
                }}>
                  <span style={{
                    background: 'var(--color-bg)',
                    padding: '2px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                  }}>
                    {formatDateSep(rec.uploadedAt)}
                  </span>
                </div>
              )}
              <EvidenceCard record={rec} />
            </div>
          );
        })}
      </div>

      {/* ── FAB Tambah Evidence ──────────────────────────────────────────────── */}
      {!showAddForm && (
        <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: '1.5px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            📎 Tambah Evidence
          </button>
        </div>
      )}
    </div>
  );
}
