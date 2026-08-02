import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LIVESTOCK_DB,
  getLivestock, getPedigree, getOwnershipHistory, getReproHistory,
  getWeightTimeline, getWeightHistory,
  type LivestockRecord, type PedigreeRecord,
} from '../data/livestockData';
import {
  getExtendedMetadata, getEditHistory,
  type LivestockExtendedMetadata,
} from '../data/livestockEditData';
import { getActiveLivestockBatches, type BatchRecord, type MembershipRecord } from '../data/batchData';
import {
  getLivestockStatus, getOutsideEntry, getTransferHistoryByLivestock,
} from '../data/transferData';
import { getArchiveInfoById, ARCHIVE_REASON_CONFIG } from '../utils/livestockSummary';
import type { ArchiveReason } from '../utils/livestockSummary';
import { HeaderActionPortal } from '../components/TopAppBar';
import { generateBobotInsightsForLivestock, type InsightItem } from '../data/aiInsightBobotData';
import { getKHTimeline } from '../data/kesehatanTimelineData';
import { getPemberianPakanByTarget, getPakanTimeline } from '../data/pemberianPakanData';
import { KtpOfficialCard } from '../components/KtpCard';
import KtpFullscreenViewer from '../components/KtpFullscreenViewer';
import { downloadKtpPdf } from '../utils/ktpPdf';
import { shareKtp } from '../utils/ktpShare';
import FotoViewer, { type FotoViewerPhoto } from '../components/FotoViewer';
import { ImageStorageService } from '../services/imageStorageService';
import {
  deletePhoto as deletePhotoService,
  setPrimaryPhoto as setPrimaryPhotoService,
} from '../services/livestockService';
import { useLivestockPhotos } from '../hooks/useLivestockPhotos';
import { useLivestock } from '../hooks/useLivestock';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import {
  performTempTransfer,
  performReturn,
  performPermanentTransfer,
  type TempTransferReason,
} from '../data/transferData';
import {
  moveLivestockOutside,
  returnLivestockToFarm,
  archiveLivestock as archiveLivestockService,
} from '../services/livestockService';

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Sehat:      { bg: '#e8f5e9', color: '#2e7d32' },
  Pemantauan: { bg: '#fff8e1', color: '#f57f17' },
  Sakit:      { bg: '#ffebee', color: '#c62828' },
};

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const INSIGHT_LEVEL_CONFIG: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  critical: { bg: '#fff5f5', border: '#ffcdd2', color: '#c62828', dot: '#e53935' },
  warning:  { bg: '#fffde7', border: '#fff176', color: '#f57f17', dot: '#fdd835' },
  info:     { bg: '#f3f8ff', border: '#bbdefb', color: '#0277bd', dot: '#42a5f5' },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  );
}

// ─── Header Overlays ──────────────────────────────────────────────────────────

/** Shown only for non-archived livestock. Archived profiles have no write actions. */
function HeaderActions({
  onEdit,
  onShare,
  onArchive,
  onKeluarSementara,
  isLuarKandang,
}: {
  onEdit: () => void;
  onShare: () => void;
  onArchive: () => void;
  onKeluarSementara: () => void;
  isLuarKandang: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const MENU_ITEMS = [
    { icon: '📤', label: 'Bagikan Profil', action: onShare },
    ...(!isLuarKandang ? [{ icon: '📍', label: 'Keluar Sementara', action: onKeluarSementara }] : []),
    { icon: '📦', label: 'Arsipkan',       action: onArchive },
  ];

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!anchorRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  return (
    <HeaderActionPortal>
      <div ref={anchorRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button type="button" onClick={onEdit} aria-label="Edit identitas ternak"
          style={{ background: 'none', border: 'none', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, lineHeight: 1, color: 'var(--color-primary)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          ✏️
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu lainnya"
          style={{ background: 'none', border: 'none', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, lineHeight: 1, color: 'var(--color-primary)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          ⋮
        </button>
        {open && (
          <div style={{ position: 'absolute', top: '100%', right: 4, zIndex: 112, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', minWidth: 200, overflow: 'hidden' }}>
            {MENU_ITEMS.map((item, i) => (
              <button key={item.label} type="button"
                onClick={() => { setOpen(false); item.action(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid var(--color-border)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </HeaderActionPortal>
  );
}

// ─── Archive Banner ───────────────────────────────────────────────────────────

function ArchiveBanner({ reason, date }: { reason: ArchiveReason; date: string | null }) {
  const cfg   = ARCHIVE_REASON_CONFIG[reason];
  const label = reason;
  return (
    <div style={{
      background: '#fff8e1', border: '1.5px solid #f5c842',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#7a5c00', marginBottom: 3 }}>
          Ternak telah diarsipkan
        </div>
        <div style={{ fontSize: 12, color: '#8a6d1f', lineHeight: 1.5 }}>
          Data arsip bersifat baca saja. Identitas Digital tetap tersimpan selamanya.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 9px' }}>
            {cfg.icon} {label}
          </span>
          {date && (
            <span style={{ fontSize: 11, color: '#8a6d1f', fontWeight: 600 }}>
              📅 {date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Luar Kandang Banner ──────────────────────────────────────────────────────

function LuarKandangBanner({ id, onKembali }: { id: string; onKembali: () => void }) {
  const entry = getOutsideEntry(id);
  if (!entry) return null;

  // M-02 fix: keys must match TempTransferReason values from transferData.ts
  // ('Antar Kandang' | 'Penitipan Farm' | 'Dokter Hewan' | 'Layanan Kawin' | 'Kontes' | 'Karantina' | 'Lainnya')
  // Previous mapping used invented labels (Digembalakan, Pameran, Dipinjam, Lokasi Sementara)
  // that don't exist in the data layer — causing all but 2 reasons to always render as grey fallback.
  const REASON_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
    'Antar Kandang':  { icon: '🏠', color: '#2e7d32', bg: '#e8f5e9' },
    'Penitipan Farm': { icon: '🌿', color: '#388e3c', bg: '#e8f5e9' },
    'Dokter Hewan':   { icon: '🩺', color: '#0277bd', bg: '#e3f2fd' },
    'Layanan Kawin':  { icon: '💕', color: '#c2185b', bg: '#fce4ec' },
    Kontes:           { icon: '🏆', color: '#f57f17', bg: '#fff8e1' },
    Karantina:        { icon: '🔒', color: '#c62828', bg: '#ffebee' },
    Lainnya:          { icon: '📍', color: '#546e7a', bg: '#eceff1' },
  };
  const cfg = REASON_CONFIG[entry.reason] ?? { icon: '📍', color: '#546e7a', bg: '#eceff1' };

  return (
    <div style={{
      background: '#e3f2fd', border: '1.5px solid #90caf9',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0d47a1', marginBottom: 3 }}>
          Ternak sedang di luar kandang
        </div>
        <div style={{ fontSize: 12, color: '#1565c0', lineHeight: 1.5 }}>
          Profil tetap lengkap dan dapat diedit sesuai ketentuan yang berlaku.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '3px 9px' }}>
            {cfg.icon} {entry.reason}
          </span>
          <span style={{ fontSize: 11, color: '#1565c0', fontWeight: 600 }}>
            📍 {entry.destinationName}
          </span>
          {entry.daysOut > 0 && (
            <span style={{ fontSize: 11, color: '#1976d2', fontWeight: 600 }}>
              🕐 {entry.daysOut} hari
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onKembali}
          style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid #1565c0', background: '#fff', color: '#1565c0',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: 5, WebkitTapHighlightColor: 'transparent',
          }}>
          🏠 Kembali ke Kandang
        </button>
      </div>
    </div>
  );
}

// ─── UUID guard ───────────────────────────────────────────────────────────────
// Detects whether a string is a Supabase-loaded UUID vs a seed in-memory ID.
// Used to skip Supabase writes for dev-seed livestock (e.g. SAP-J-000001-KAY).
const _UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isLivestockUUID(val: string) { return _UUID_RE.test(val); }

// ─── Keluar Sementara Sheet ───────────────────────────────────────────────────

const KELUAR_REASONS: TempTransferReason[] = [
  'Antar Kandang', 'Penitipan Farm', 'Dokter Hewan',
  'Layanan Kawin', 'Kontes', 'Karantina', 'Lainnya',
];

function KeluarSementaraSheet({
  livestockId,
  workspaceId,
  userId,
  onClose,
  onDone,
}: {
  livestockId: string;
  workspaceId: string | null;
  userId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [reason, setReason]           = useState<TempTransferReason>('Antar Kandang');
  const [destination, setDestination] = useState('');
  const [date, setDate]               = useState(todayISO);
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState<string | null>(null);

  const valid = destination.trim().length > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      // 1. In-memory mutation (synchronous — always runs)
      performTempTransfer({
        livestockId,
        reason,
        destinationName: destination.trim(),
        departDate: date,
        notes: notes.trim() || null,
      });

      // 2. Supabase dual-write (fire-and-forget — skipped for seed IDs)
      if (workspaceId && isLivestockUUID(livestockId)) {
        void moveLivestockOutside(
          livestockId, workspaceId,
          destination.trim(), reason,
          notes.trim() || null, date,
          null,
        ).then((r) => {
          if (!r.ok) console.error('[LivestockProfile] moveLivestockOutside:', r.error);
        });
      }

      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal mencatat perpindahan.');
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 16 }}>📍 Keluar Sementara</div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Alasan Keluar</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as TempTransferReason)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)' }}>
            {KELUAR_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Nama Tujuan <span style={{ color: '#c62828' }}>*</span></span>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Contoh: Klinik Hewan Maju"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Tanggal Keberangkatan</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Catatan (opsional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Tambahkan catatan..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        {err && <div style={{ fontSize: 12, color: '#c62828', marginBottom: 10, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={() => void handleSubmit()} disabled={!valid || saving}
            style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: valid && !saving ? 'var(--color-primary)' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: valid && !saving ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kembali ke Kandang Sheet ─────────────────────────────────────────────────

function KembaliKandangSheet({
  livestockId,
  workspaceId,
  onClose,
  onDone,
}: {
  livestockId: string;
  workspaceId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setErr(null);
    try {
      const todayISO = new Date().toISOString().split('T')[0];

      // 1. In-memory mutation
      performReturn({ livestockId, notes: notes.trim() || null });

      // 2. Supabase dual-write (fire-and-forget)
      if (workspaceId && isLivestockUUID(livestockId)) {
        void returnLivestockToFarm(
          livestockId, workspaceId,
          null, todayISO, notes.trim() || null,
        ).then((r) => {
          if (!r.ok) console.error('[LivestockProfile] returnLivestockToFarm:', r.error);
        });
      }

      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal mencatat kepulangan.');
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>🏠 Kembali ke Kandang</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>Ternak akan dicatat kembali ke kandang. Status akan berubah menjadi Di Kandang.</div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Catatan (opsional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Tambahkan catatan..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        {err && <div style={{ fontSize: 12, color: '#c62828', marginBottom: 10, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={() => void handleSubmit()} disabled={saving}
            style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: saving ? '#ccc' : '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Menyimpan...' : 'Konfirmasi Kembali'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Archive Sheet ────────────────────────────────────────────────────────────

const ARCHIVE_REASONS: Array<{ value: 'Mati' | 'Terjual' | 'Hibah'; label: string; icon: string }> = [
  { value: 'Mati',    label: 'Mati',    icon: '💀' },
  { value: 'Terjual', label: 'Terjual', icon: '💰' },
  { value: 'Hibah',   label: 'Hibah',   icon: '🎁' },
];

function ArchiveSheet({
  livestockId,
  workspaceId,
  onClose,
  onDone,
}: {
  livestockId: string;
  workspaceId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [reason, setReason] = useState<'Mati' | 'Terjual' | 'Hibah'>('Terjual');
  const [date, setDate]     = useState(todayISO);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  // Map archive reason → PermanentTransferReason for the in-memory function
  const toPermanentReason = (r: 'Mati' | 'Terjual' | 'Hibah') =>
    r === 'Mati' ? 'Mati' as const : r === 'Hibah' ? 'Hibah' as const : 'Penjualan' as const;

  async function handleSubmit() {
    setSaving(true);
    setErr(null);
    try {
      // 1. In-memory mutation
      performPermanentTransfer({
        livestockId,
        reason: toPermanentReason(reason),
        date,
        notes: notes.trim() || null,
      });

      // 2. Supabase dual-write (fire-and-forget — skipped for seed IDs)
      if (workspaceId && isLivestockUUID(livestockId)) {
        void archiveLivestockService(
          livestockId, workspaceId,
          reason, date, notes.trim() || null,
        ).then((r) => {
          if (!r.ok) console.error('[LivestockProfile] archiveLivestock:', r.error);
        });
      }

      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal mengarsipkan ternak.');
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 16px 40px', width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#c62828', marginBottom: 8 }}>📦 Arsipkan Ternak</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>Setelah diarsipkan, data bersifat baca saja. Tindakan ini tidak dapat dibatalkan.</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {ARCHIVE_REASONS.map((r) => (
            <button key={r.value} type="button" onClick={() => setReason(r.value)}
              style={{
                flex: 1, padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                border: reason === r.value ? '2px solid #c62828' : '1.5px solid var(--color-border)',
                background: reason === r.value ? '#ffebee' : 'var(--color-surface)',
                color: reason === r.value ? '#c62828' : 'var(--color-text)',
                fontSize: 12, fontWeight: 700, textAlign: 'center', transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{r.icon}</div>
              {r.label}
            </button>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Tanggal</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 5 }}>Catatan (opsional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Tambahkan catatan..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, resize: 'none', boxSizing: 'border-box', color: 'var(--color-text)' }} />
        </label>

        {err && <div style={{ fontSize: 12, color: '#c62828', marginBottom: 10, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="button" onClick={() => void handleSubmit()} disabled={saving}
            style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: saving ? '#ccc' : '#c62828', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Menyimpan...' : 'Arsipkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Identity Photo ───────────────────────────────────────────────────────────
// LS-PHOTO-003: avatar renders the Cover Photo (falls back to Identity Photo).

function IdentityPhoto({ lv, tick: _tick }: { lv: LivestockRecord; tick?: number }) {
  const status = STATUS_CONFIG[lv.status] ?? STATUS_CONFIG['Sehat'];
  const { identitas, coverPhotoUrl } = useLivestockPhotos(lv.id);
  const [showViewer, setShowViewer] = useState(false);

  // Viewer shows identity photo regardless of cover selection
  const viewerPhoto: FotoViewerPhoto | null = identitas
    ? {
        id: identitas.id,
        url: identitas.original_url,
        typeLabel: 'Foto Identitas',
        dateLabel: new Date(identitas.uploadedAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
        description: identitas.reason ?? undefined,
      }
    : null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        onClick={coverPhotoUrl ? () => setShowViewer(true) : undefined}
        style={{
          width: 96, height: 96, borderRadius: '50%', background: lv.typeBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52, border: '3px solid var(--color-surface)',
          boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
          cursor: coverPhotoUrl ? 'pointer' : 'default',
        }}>
        {coverPhotoUrl
          ? <img src={coverPhotoUrl} alt="Foto Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : lv.typeIcon
        }
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {lv.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 3 }}>{lv.id}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: status.color, background: status.bg, borderRadius: 20, padding: '4px 12px' }}>{lv.status}</span>

      {showViewer && viewerPhoto && (
        <FotoViewer photos={[viewerPhoto]} onClose={() => setShowViewer(false)} isReadOnly />
      )}
    </section>
  );
}

// ─── AI Insight ───────────────────────────────────────────────────────────────
// Per-livestock rule-based insight panel. Combines weight analytics from
// the existing BobotInsight engine with live health, location, batch, and
// feed data for this specific animal.

function buildProfileInsights(id: string, lv: LivestockRecord): InsightItem[] {
  const items: InsightItem[] = [];

  // 1. Weight insights (reuse the existing per-animal engine)
  const bobotReport = generateBobotInsightsForLivestock(id);
  const weightItems = bobotReport.items.slice(0, 2);
  items.push(...weightItems);

  // 2. Health status
  if (lv.status === 'Sakit') {
    items.push({
      id: `profile-health-${id}`,
      level: 'critical',
      category: 'peringatan',
      icon: '🚨',
      title: 'Status Kesehatan: Sakit',
      message: `${lv.name ?? lv.id} berstatus Sakit. Segera lakukan pemeriksaan dan tindakan medis yang diperlukan.`,
    });
  } else if (lv.status === 'Pemantauan') {
    items.push({
      id: `profile-health-${id}`,
      level: 'warning',
      category: 'peringatan',
      icon: '⚠️',
      title: 'Status Kesehatan: Pemantauan',
      message: `${lv.name ?? lv.id} sedang dalam pemantauan. Pantau kondisi secara berkala dan catat perkembangannya.`,
    });
  }

  // 3. Luar Kandang duration
  const entry = getOutsideEntry(id);
  if (entry && entry.daysOut > 14) {
    items.push({
      id: `profile-outside-${id}`,
      level: 'warning',
      category: 'peringatan',
      icon: '📍',
      title: 'Di Luar Kandang Cukup Lama',
      message: `Sudah ${entry.daysOut} hari di luar kandang (${entry.destinationName}). Pastikan kondisi dan kebutuhan ternak terpenuhi.`,
    });
  }

  // 4. Feed — check last feed record
  const pakanList = getPemberianPakanByTarget(id);
  const lastPakan = pakanList.length > 0 ? pakanList[0] : null;
  if (!lastPakan) {
    items.push({
      id: `profile-pakan-${id}`,
      level: 'info',
      category: 'rekomendasi',
      icon: '🌿',
      title: 'Belum Ada Catatan Pemberian Pakan',
      message: 'Catat pemberian pakan secara rutin untuk memantau asupan nutrisi ternak.',
    });
  }

  // Sort: critical → warning → info; cap at 3 items for the profile card
  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  return items
    .sort((a, b) => (rank[a.level] ?? 2) - (rank[b.level] ?? 2))
    .slice(0, 3);
}

function ProfileAIInsight({ id, lv }: { id: string; lv: LivestockRecord }) {
  const [expanded, setExpanded] = useState(false);
  const insights = buildProfileInsights(id, lv);
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <section>
      <SectionLabel title="AI Insight" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.length === 0 ? (
          <Card style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Semua Indikator Normal</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>Tidak ada peringatan yang perlu ditindaklanjuti saat ini.</div>
            </div>
          </Card>
        ) : (
          <>
            {visible.map((item) => {
              const cfg = INSIGHT_LEVEL_CONFIG[item.level] ?? INSIGHT_LEVEL_CONFIG['info'];
              return (
                <div key={item.id} style={{
                  background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                  borderRadius: 'var(--radius-md)', padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{item.message}</div>
                  </div>
                </div>
              );
            })}
            {insights.length > 2 && (
              <button type="button" onClick={() => setExpanded((v) => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}>
                {expanded ? '▲ Tampilkan Lebih Sedikit' : `▼ Lihat ${insights.length - 2} Insight Lainnya`}
              </button>
            )}
          </>
        )}
        <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'right', marginTop: 2 }}>
          ✦ Rule-Based AI · Data real-time
        </div>
      </div>
    </section>
  );
}

// ─── Shared row renderer ──────────────────────────────────────────────────────

function InfoRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500, flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Livestock Identity ───────────────────────────────────────────────────────

function LivestockIdentityCard({ lv, ext }: { lv: LivestockRecord; ext: LivestockExtendedMetadata }) {
  const program = PROGRAM_CONFIG[lv.program] ?? PROGRAM_CONFIG['Lainnya'];
  const birthDateLabel = lv.birthDateEstimated ? 'Perkiraan Tanggal Lahir' : 'Tanggal Lahir';

  // Determine location label and value based on transfer status
  const lvStatus      = getLivestockStatus(lv.id);
  const outsideEntry  = getOutsideEntry(lv.id);
  const locationLabel =
    lvStatus === 'Luar Kandang' ? 'Lokasi Saat Ini'  :
    lvStatus === 'Arsip'        ? 'Status'             :
    'Lokasi Kandang';
  const locationValue =
    lvStatus === 'Luar Kandang' && outsideEntry
      ? `${outsideEntry.destinationName} (${outsideEntry.reason})`
      : lvStatus === 'Arsip'
      ? 'Diarsipkan'
      : lv.location;

  // Build rows — core fields always shown; optional extended fields always shown (null → '—')
  const ROWS: { label: string; value: React.ReactNode }[] = [
    { label: 'ID Ternak',           value: lv.id },
    { label: 'Jenis Ternak',        value: `${lv.typeIcon} ${lv.type}` },
    { label: 'Ras',                 value: lv.ras },
    { label: 'Kategori Ras',        value: ext.breedCategory ?? '—' },
    { label: 'Silangan Dengan',     value: ext.crossBreed ?? '—' },
    { label: 'Jenis Kelamin',       value: lv.kelamin },
    { label: 'Tag Telinga',         value: ext.earTag ?? '—' },
    { label: 'Kode Internal',       value: ext.internalCode ?? '—' },
    { label: birthDateLabel,        value: lv.birthDate },
    { label: 'Perkiraan Umur',      value: lv.age },
    { label: 'Bobot Lahir',         value: `${lv.birthWeight} ${lv.weightUnit}` },
    { label: 'Jumlah Saudara Lahir', value: ext.siblingCount ?? '—' },
    { label: 'Bobot Saat Ini',      value: `${lv.weight} ${lv.weightUnit}` },
    { label: 'Program',         value: (
        <span style={{ fontSize: 11, fontWeight: 700, color: program.color, background: program.bg, borderRadius: 20, padding: '3px 10px' }}>{lv.program}</span>
      ),
    },
    { label: locationLabel,     value: locationValue },
  ];

  return (
    <section>
      <SectionLabel title="Identitas Ternak" />
      <Card style={{ overflow: 'hidden' }}>
        {ROWS.map((row, i) => (
          <InfoRow key={String(row.label)} label={String(row.label)} value={row.value} last={i === ROWS.length - 1} />
        ))}
      </Card>
    </section>
  );
}

// ─── Ciri Fisik (Physical Characteristics) ────────────────────────────────────

function PhysicalCard({ ext }: { ext: LivestockExtendedMetadata }) {
  const ROWS = [
    { label: 'Warna Tubuh',  value: ext.color        ?? '—' },
    { label: 'Tanduk',       value: ext.horn         ?? '—' },
    { label: 'Ekor',         value: ext.tail         ?? '—' },
    { label: 'Tanda Khusus', value: ext.specialMarks ?? '—' },
  ];
  return (
    <section>
      <SectionLabel title="Ciri Fisik" />
      <Card style={{ overflow: 'hidden' }}>
        {ROWS.map((row, i) => (
          <InfoRow key={row.label} label={row.label} value={row.value} last={i === ROWS.length - 1} />
        ))}
      </Card>
    </section>
  );
}

// ─── Informasi Pembelian (Purchase Information) ───────────────────────────────

function PurchaseInfoCard({ ext }: { ext: LivestockExtendedMetadata }) {
  const priceDisplay = ext.purchasePrice
    ? `Rp ${Number(ext.purchasePrice).toLocaleString('id-ID')}`
    : '—';

  const ROWS = [
    { label: 'Pemasok / Penjual',        value: ext.supplier     ?? '—' },
    { label: 'Asal Daerah / Peternakan', value: ext.originFarm   ?? '—' },
    { label: 'Tanggal Pembelian',        value: ext.purchaseDate ?? '—' },
    { label: 'Harga Beli',               value: priceDisplay      },
  ];
  return (
    <section>
      <SectionLabel title="Informasi Pembelian" />
      <Card style={{ overflow: 'hidden' }}>
        {ROWS.map((row, i) => (
          <InfoRow key={row.label} label={row.label} value={row.value} last={i === ROWS.length - 1} />
        ))}
      </Card>
    </section>
  );
}

// ─── Catatan (Notes) ──────────────────────────────────────────────────────────

function NotesCard({ notes }: { notes: string | null }) {
  return (
    <section>
      <SectionLabel title="Catatan" />
      <Card style={{ padding: '14px 16px' }}>
        {notes ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notes}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>Belum ada catatan.</p>
        )}
      </Card>
    </section>
  );
}

// ─── Informasi Tambahan (Meta: Created At / Updated At) ───────────────────────

function MetaInfoCard({ lv, id }: { lv: LivestockRecord; id: string }) {
  const history = getEditHistory(id);
  // getEditHistory returns newest-first; history[0] is the most recent edit ("last updated")
  const lastEdit = history.length > 0 ? history[0] : null;

  function formatTs(iso: string) {
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }

  const ROWS = [
    { label: 'Tanggal Terdaftar',      value: lv.digitalIdentity.registeredDate },
    { label: 'Diterbitkan Oleh',       value: lv.digitalIdentity.issuedBy },
    { label: 'Terakhir Diperbarui',    value: lastEdit ? formatTs(lastEdit.editedAt) : '—' },
    { label: 'Terakhir Diperbarui Oleh', value: lastEdit ? lastEdit.editedBy : '—' },
  ];

  return (
    <section>
      <SectionLabel title="Informasi Tambahan" />
      <Card style={{ overflow: 'hidden' }}>
        {ROWS.map((row, i) => (
          <InfoRow key={row.label} label={row.label} value={row.value} last={i === ROWS.length - 1} />
        ))}
      </Card>
    </section>
  );
}

// ─── Active Batch Cards (multiple membership supported) ───────────────────────

function CurrentBatchCard({
  batches,
}: {
  batches: Array<{ membership: MembershipRecord; batch: BatchRecord }>;
}) {
  const navigate = useNavigate();
  if (batches.length === 0) return null;
  const sectionTitle = batches.length === 1 ? 'Batch Aktif' : `Batch Aktif (${batches.length})`;

  return (
    <section>
      <SectionLabel title={sectionTitle} />
      <Card style={{ overflow: 'hidden' }}>
        {batches.map(({ membership, batch }, i) => {
          const program = PROGRAM_CONFIG[batch.label] ?? PROGRAM_CONFIG['Lainnya'];
          return (
            <div
              key={batch.id}
              onClick={() => navigate(`/batch/${batch.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i < batches.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: 'var(--color-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                📦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {batch.id}
                </div>
                {batch.name && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{batch.name}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: program.color, background: program.bg, borderRadius: 20, padding: '2px 8px' }}>
                    {batch.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-border)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Bergabung {membership.joinDate}</span>
                </div>
              </div>
              <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Photo Gallery ────────────────────────────────────────────────────────────

type UploadSheetType = 'none' | 'identitas' | 'prestasi';

function PhotoGallery({
  id,
  lv,
  isArchived,
  onCoverChange,
}: {
  id: string;
  lv: LivestockRecord;
  isArchived: boolean;
  /** Called whenever the cover photo is changed — lets IdentityPhoto re-render. */
  onCoverChange?: () => void;
}) {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<UploadSheetType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);    // blob URL — memory only, revoked on cancel
  const [pendingFile, setPendingFile] = useState<File | null>(null);    // File object held until confirmed upload
  const [prestasiDate, setPrestasiDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [prestasiDesc, setPrestasiDesc] = useState('');
  const [identitasReason, setIdentitasReason] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ photos: FotoViewerPhoto[]; startIndex: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const identitasFileRef = useRef<HTMLInputElement>(null);
  const prestasiFileRef  = useRef<HTMLInputElement>(null);
  const terbaruFileRef   = useRef<HTMLInputElement>(null);

  // Photo state from Supabase — is_primary=true is the cover SSOT
  const {
    identitas: fotoIdentitas,
    prestasiList,
    terbaruList,
    coverPhotoId,
    refetch: refetchPhotos,
  } = useLivestockPhotos(id);

  // Effective cover: photo_uuid of the is_primary photo, or null.
  const effectiveCoverId = coverPhotoId;

  async function handleSetCover(photoId: string) {
    if (isArchived) return;
    if (photoId === effectiveCoverId) return; // already cover
    try {
      await setPrimaryPhotoService(id, photoId);
      refetchPhotos();
      onCoverChange?.();
    } catch { /* non-fatal — Supabase state reflects on next refetch */ }
  }

  /** Small star badge rendered inside an overflow:hidden THUMB when it's the active cover. */
  const CoverStar = () => (
    <div style={{
      position: 'absolute', top: 3, right: 3,
      width: 17, height: 17, borderRadius: '50%',
      background: '#fbbf24', border: '1.5px solid #f59e0b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, lineHeight: 1, pointerEvents: 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}>⭐</div>
  );

  // ── File selection ──────────────────────────────────────────────────────

  async function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    type: UploadSheetType | 'terbaru',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsProcessing(true);
    setUploadError(null);
    try {
      if (type === 'terbaru') {
        // Upload immediately to R2 — no confirm sheet for "terbaru"
        const result = await ImageStorageService.uploadImage(file, {
          category: 'livestock',
          ownerWorkspaceUuid: 'system',
          uploadedBy: 'Pemilik',
          livestockId: id,
        });
        if (!result.success) {
          setUploadError(result.error);
        } else {
          refetchPhotos();
        }
      } else {
        // Show confirm sheet — preview via blob URL (memory only, never persisted)
        const previewUrl = URL.createObjectURL(file);
        setPendingFile(file);
        setPendingUrl(previewUrl);
        setSheet(type);
      }
    } catch {
      setUploadError('Gagal memproses foto. Coba pilih foto lain.');
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Submit / cancel ─────────────────────────────────────────────────────

  async function submitIdentitas() {
    if (!pendingFile) return;
    setIsProcessing(true);
    setUploadError(null);
    try {
      const result = await ImageStorageService.uploadImage(pendingFile, {
        category: 'livestock',
        ownerWorkspaceUuid: 'system',
        uploadedBy: 'Pemilik',
        livestockId: id,
        isCover: true,
        caption: identitasReason.trim() || null,
      });
      if (!result.success) {
        setUploadError(result.error);
        return;
      }
      cancelSheet();
      refetchPhotos();
    } catch {
      setUploadError('Gagal mengupload foto. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function submitPrestasi() {
    if (!pendingFile) return;
    setIsProcessing(true);
    setUploadError(null);
    try {
      const result = await ImageStorageService.uploadImage(pendingFile, {
        category: 'livestock',
        ownerWorkspaceUuid: 'system',
        uploadedBy: 'Pemilik',
        livestockId: id,
        takenAt: prestasiDate,
        caption: prestasiDesc.trim() || null,
      });
      if (!result.success) {
        setUploadError(result.error);
        return;
      }
      cancelSheet();
      refetchPhotos();
    } catch {
      setUploadError('Gagal mengupload foto. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  }

  function cancelSheet() {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setSheet('none');
    setPendingUrl(null);
    setPendingFile(null);
    setIdentitasReason('');
    setPrestasiDesc('');
    setPrestasiDate(new Date().toISOString().slice(0, 10));
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(photoId: string) {
    try {
      await deletePhotoService(id, photoId);
    } catch { /* non-fatal */ }
    setViewer(null);
    refetchPhotos();
  }

  // ── Viewer helpers ──────────────────────────────────────────────────────

  function openIdentitasViewer() {
    if (!fotoIdentitas) return;
    setViewer({
      photos: [{
        id: fotoIdentitas.id, url: fotoIdentitas.original_url,
        typeLabel: 'Foto Identitas',
        dateLabel: new Date(fotoIdentitas.uploadedAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
        description: fotoIdentitas.reason ?? undefined,
      }],
      startIndex: 0,
    });
  }

  function openPrestasiViewer(startIdx: number) {
    setViewer({
      photos: prestasiList.map((p) => ({
        id: p.id, url: p.original_url,
        typeLabel: 'Foto Prestasi',
        dateLabel: `Prestasi: ${p.achievementDate}`,
        description: p.description ?? undefined,
      })),
      startIndex: startIdx,
    });
  }

  function openTerbaruViewer(startIdx: number) {
    setViewer({
      photos: terbaruList.map((p) => ({
        id: p.id, url: p.original_url,
        typeLabel: 'Foto Terbaru',
        dateLabel: new Date(p.uploadedAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      })),
      startIndex: startIdx,
    });
  }

  // ── Shared gallery styles ────────────────────────────────────────────────────

  const THUMB_SIZE = 84;

  const THUMB_STYLE: React.CSSProperties = {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 'var(--radius-md)',
    overflow: 'hidden', border: '1.5px solid var(--color-border)',
    cursor: 'pointer', background: 'var(--color-bg)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const PLACEHOLDER_STYLE: React.CSSProperties = {
    width: '100%', borderRadius: 'var(--radius-md)',
    border: '1.5px dashed var(--color-border)', background: 'var(--color-bg)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '22px 16px', boxSizing: 'border-box',
  };

  const ADD_BTN_PILL: React.CSSProperties = {
    marginTop: 4, padding: '7px 16px', borderRadius: 20,
    border: '1.5px solid var(--color-primary)', background: 'var(--color-primary)',
    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  };

  const HEADER_ADD_BTN: React.CSSProperties = {
    padding: '5px 12px', borderRadius: 16,
    border: '1.5px solid var(--color-primary)', background: 'transparent',
    color: 'var(--color-primary)', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', flexShrink: 0,
  };

  const MENU_BTN: React.CSSProperties = {
    position: 'absolute', top: 4, right: 4, zIndex: 10,
    width: 22, height: 22, borderRadius: 4,
    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
    fontSize: 14, cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  };

  const DROPDOWN: React.CSSProperties = {
    position: 'absolute', top: THUMB_SIZE + 4, right: 0, zIndex: 50,
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    overflow: 'hidden', minWidth: 148,
  };

  const INPUT_STYLE: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 13,
    color: 'var(--color-text)', background: 'var(--color-bg)', boxSizing: 'border-box',
  };

  const SHEET_BTN_CANCEL: React.CSSProperties = {
    flex: 1, padding: '12px 0', borderRadius: 8,
    border: '1.5px solid var(--color-border)', background: 'transparent',
    color: 'var(--color-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  };

  const SHEET_BTN_SAVE: React.CSSProperties = {
    flex: 2, padding: '12px 0', borderRadius: 8,
    border: 'none', background: 'var(--color-primary)',
    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  };

  return (
    <section>
      <SectionLabel title="Galeri Foto" />

      {/* Menu backdrop — closes open ⋮ menu on outside click */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 45 }} />
      )}

      {/* ── Foto Identitas ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Card style={{ padding: '14px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📸 Foto Identitas
            </div>
            {fotoIdentitas && !isArchived && (
              <button type="button" disabled={isProcessing}
                onClick={() => identitasFileRef.current?.click()}
                style={HEADER_ADD_BTN}>
                🔄 Ganti
              </button>
            )}
          </div>

          {/* Empty state */}
          {!fotoIdentitas && (
            <div style={PLACEHOLDER_STYLE}>
              <span style={{ fontSize: 30, opacity: 0.3 }}>📸</span>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Digunakan di profil, KTP, dan daftar ternak.
              </div>
              {!isArchived && (
                <button type="button" disabled={isProcessing}
                  onClick={() => identitasFileRef.current?.click()}
                  style={{ ...ADD_BTN_PILL, opacity: isProcessing ? 0.6 : 1 }}>
                  📷 Tambah Foto
                </button>
              )}
            </div>
          )}

          {/* Thumbnail strip */}
          {fotoIdentitas && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              <div style={{ position: 'relative', flexShrink: 0, width: THUMB_SIZE, height: THUMB_SIZE }}>
                <div onClick={openIdentitasViewer}
                  style={{ ...THUMB_STYLE, ...(fotoIdentitas.id === effectiveCoverId ? { border: '2px solid #f59e0b' } : {}) }}>
                  <img src={fotoIdentitas.thumbnail_url ?? fotoIdentitas.original_url} alt="Foto Identitas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {fotoIdentitas.id === effectiveCoverId && <CoverStar />}
                </div>
                {!isArchived && (
                  <button type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === fotoIdentitas.id ? null : fotoIdentitas.id); }}
                    style={MENU_BTN}>⋮</button>
                )}
                {menuOpen === fotoIdentitas.id && (
                  <div style={DROPDOWN}>
                    <button type="button" onClick={() => { setMenuOpen(null); openIdentitasViewer(); }}
                      style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                      👁️ Lihat
                    </button>
                    <button type="button" disabled={isProcessing}
                      onClick={() => { setMenuOpen(null); identitasFileRef.current?.click(); }}
                      style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                      🔄 Ganti Foto
                    </button>
                    {fotoIdentitas.id === effectiveCoverId ? (
                      <button type="button" disabled
                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#fff8e1', border: 'none', textAlign: 'left', fontSize: 13, color: '#b45309', cursor: 'default' }}>
                        ⭐ Cover Aktif
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setMenuOpen(null); handleSetCover(fotoIdentitas.id); }}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                        ☆ Jadikan Cover
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadError && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#c62828', background: '#ffebee', borderRadius: 6, padding: '8px 10px' }}>
              ❌ {uploadError}
            </div>
          )}
          <input ref={identitasFileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'identitas')} />
        </Card>
      </div>

      {/* ── Foto Prestasi ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Card style={{ padding: '14px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🏆 Foto Prestasi
            </div>
            {prestasiList.length > 0 && !isArchived && (
              <button type="button" onClick={() => prestasiFileRef.current?.click()} style={HEADER_ADD_BTN}>
                + Tambah
              </button>
            )}
          </div>

          {/* Empty state */}
          {prestasiList.length === 0 && (
            <div style={PLACEHOLDER_STYLE}>
              <span style={{ fontSize: 30, opacity: 0.3 }}>🏆</span>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Tambahkan foto dari kompetisi atau pameran.
              </div>
              {!isArchived && (
                <button type="button" onClick={() => prestasiFileRef.current?.click()} style={ADD_BTN_PILL}>
                  📷 Tambah Foto
                </button>
              )}
            </div>
          )}

          {/* Thumbnail strip */}
          {prestasiList.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {prestasiList.map((p, i) => {
                const isActive = p.id === effectiveCoverId;
                return (
                  <div key={p.id} style={{ position: 'relative', flexShrink: 0, width: THUMB_SIZE, height: THUMB_SIZE }}>
                    <div onClick={() => openPrestasiViewer(i)}
                      style={{ ...THUMB_STYLE, ...(isActive ? { border: '2px solid #f59e0b' } : {}) }}>
                      <img src={p.thumbnail_url ?? p.original_url} alt="Prestasi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isActive && <CoverStar />}
                    </div>
                    {!isArchived && (
                      <button type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                        style={MENU_BTN}>⋮</button>
                    )}
                    {menuOpen === p.id && (
                      <div style={DROPDOWN}>
                        <button type="button" onClick={() => { setMenuOpen(null); openPrestasiViewer(i); }}
                          style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                          👁️ Lihat
                        </button>
                        {isActive ? (
                          <button type="button" disabled
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#fff8e1', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: '#b45309', cursor: 'default' }}>
                            ⭐ Cover Aktif
                          </button>
                        ) : (
                          <button type="button" onClick={() => { setMenuOpen(null); handleSetCover(p.id); }}
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                            ☆ Jadikan Cover
                          </button>
                        )}
                        <button type="button" onClick={() => { setMenuOpen(null); handleDelete(p.id); }}
                          style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: '#c62828', cursor: 'pointer' }}>
                          🗑️ Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <input ref={prestasiFileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'prestasi')} />
        </Card>
      </div>

      {/* ── Foto Terbaru ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <Card style={{ padding: '14px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📷 Foto Terbaru
            </div>
            {terbaruList.length > 0 && !isArchived && (
              <button type="button" disabled={isProcessing}
                onClick={() => terbaruFileRef.current?.click()}
                style={HEADER_ADD_BTN}>
                {isProcessing ? '⏳' : '+ Tambah'}
              </button>
            )}
          </div>

          {/* Empty state */}
          {terbaruList.length === 0 && (
            <div style={PLACEHOLDER_STYLE}>
              <span style={{ fontSize: 30, opacity: 0.3 }}>📷</span>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Tambahkan dokumentasi kondisi ternak saat ini.
              </div>
              {!isArchived && (
                <button type="button" disabled={isProcessing}
                  onClick={() => terbaruFileRef.current?.click()}
                  style={{ ...ADD_BTN_PILL, opacity: isProcessing ? 0.6 : 1 }}>
                  {isProcessing ? '⏳ Memproses...' : '📷 Tambah Foto'}
                </button>
              )}
            </div>
          )}

          {/* Thumbnail strip */}
          {terbaruList.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {terbaruList.map((p, i) => {
                const isActive = p.id === effectiveCoverId;
                return (
                  <div key={p.id} style={{ position: 'relative', flexShrink: 0, width: THUMB_SIZE, height: THUMB_SIZE }}>
                    <div onClick={() => openTerbaruViewer(i)}
                      style={{ ...THUMB_STYLE, ...(isActive ? { border: '2px solid #f59e0b' } : {}) }}>
                      <img src={p.original_url} alt="Terbaru" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isActive && <CoverStar />}
                    </div>
                    {!isArchived && (
                      <button type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                        style={MENU_BTN}>⋮</button>
                    )}
                    {menuOpen === p.id && (
                      <div style={DROPDOWN}>
                        <button type="button" onClick={() => { setMenuOpen(null); openTerbaruViewer(i); }}
                          style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                          👁️ Lihat
                        </button>
                        {isActive ? (
                          <button type="button" disabled
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#fff8e1', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: '#b45309', cursor: 'default' }}>
                            ⭐ Cover Aktif
                          </button>
                        ) : (
                          <button type="button" onClick={() => { setMenuOpen(null); handleSetCover(p.id); }}
                            style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                            ☆ Jadikan Cover
                          </button>
                        )}
                        <button type="button" onClick={() => { setMenuOpen(null); handleDelete(p.id); }}
                          style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: '#c62828', cursor: 'pointer' }}>
                          🗑️ Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <input ref={terbaruFileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e, 'terbaru')} />
        </Card>
      </div>

      {/* ── Riwayat link ────────────────────────────────────────────────── */}
      <button type="button" onClick={() => navigate(`/livestock/${id}/foto/riwayat`)}
        style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        📋 Lihat Riwayat & Audit Foto &gt;&gt;
      </button>

      {/* ── Upload Sheet — Identitas ─────────────────────────────────────── */}
      {sheet === 'identitas' && pendingUrl && (
        <>
          <div onClick={cancelSheet}
            style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
            background: 'var(--color-surface)', borderRadius: '16px 16px 0 0',
            padding: '20px 16px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            maxWidth: 480, margin: '0 auto',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', textAlign: 'center', marginBottom: 16 }}>
              {fotoIdentitas ? '🔄 Ganti Foto Identitas' : '📸 Tambah Foto Identitas'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-primary)' }}>
                <img src={pendingUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            {fotoIdentitas && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                  Alasan Penggantian (opsional)
                </label>
                <input type="text" value={identitasReason}
                  onChange={(e) => setIdentitasReason(e.target.value)}
                  placeholder="misal: Foto lebih jelas, tampilan terbaru..."
                  style={INPUT_STYLE} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={cancelSheet} style={SHEET_BTN_CANCEL}>Batal</button>
              <button type="button" onClick={submitIdentitas} style={SHEET_BTN_SAVE}>✅ Simpan Foto</button>
            </div>
          </div>
        </>
      )}

      {/* ── Upload Sheet — Prestasi ──────────────────────────────────────── */}
      {sheet === 'prestasi' && pendingUrl && (
        <>
          <div onClick={cancelSheet}
            style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
            background: 'var(--color-surface)', borderRadius: '16px 16px 0 0',
            padding: '20px 16px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            maxWidth: 480, margin: '0 auto',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', textAlign: 'center', marginBottom: 14 }}>
              🏆 Tambah Foto Prestasi
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--color-primary)' }}>
                <img src={pendingUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                Tanggal Prestasi <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input type="date" value={prestasiDate}
                onChange={(e) => setPrestasiDate(e.target.value)}
                style={INPUT_STYLE} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                Keterangan (opsional)
              </label>
              <input type="text" value={prestasiDesc}
                onChange={(e) => setPrestasiDesc(e.target.value)}
                placeholder="misal: Juara 1 Kontes Domba Garut, Grade A..."
                style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={cancelSheet} style={SHEET_BTN_CANCEL}>Batal</button>
              <button type="button" onClick={submitPrestasi} style={SHEET_BTN_SAVE}>✅ Simpan Foto</button>
            </div>
          </div>
        </>
      )}

      {/* ── Foto Viewer ─────────────────────────────────────────────────── */}
      {viewer && (
        <FotoViewer
          photos={viewer.photos}
          startIndex={viewer.startIndex}
          onClose={() => setViewer(null)}
          onDelete={isArchived ? undefined : handleDelete}
          isReadOnly={isArchived}
        />
      )}
    </section>
  );
}

// ─── KTP Preview Thumbnail ────────────────────────────────────────────────────
// Renders the official KTP card scaled down to fit the profile column width,
// preserving the correct landscape aspect ratio. Tapping "Lihat" opens the
// full-quality card in the fullscreen viewer.

function KtpPreviewThumbnail({ lv, isArchived }: { lv: LivestockRecord; isArchived: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Default ≈ 328/700 for a 360 px viewport with 32 px padding
  const [scale, setScale] = useState(0.497);

  useEffect(() => {
    if (wrapRef.current) {
      setScale(wrapRef.current.offsetWidth / 700);
    }
  }, []);

  // KtpOfficialCard natural dimensions: 700 px wide, ~575 px tall
  // (header 92px + body ~411px + footer 72px)
  const SRC_H = 575;

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        height: Math.round(SRC_H * scale),
        overflow: 'hidden',
        borderRadius: 8,
        boxShadow: '0 3px 14px rgba(26,53,88,0.22)',
        border: '2px solid #1a3558',
      }}
    >
      <div style={{
        width: 700,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        pointerEvents: 'none',
      }}>
        <KtpOfficialCard lv={lv} isArchived={isArchived} />
      </div>
    </div>
  );
}

// ─── Digital Identity wrapper (with live Lihat / Unduh PDF / Bagikan) ─────────

function DigitalIdentityCard({ lv, isArchived }: { lv: LivestockRecord; isArchived: boolean }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);
  const ktpRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function handlePdf() {
    if (!ktpRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const filename = `KTP-${lv.id.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      await downloadKtpPdf(ktpRef.current, filename);
      showToast('✅ PDF berhasil diunduh!');
    } catch {
      showToast('❌ Gagal membuat PDF. Coba lagi.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleShare() {
    const result = await shareKtp(lv);
    if (result === 'shared') showToast('✅ KTP berhasil dibagikan!');
    if (result === 'copied') showToast('📋 URL profil disalin ke clipboard!');
    if (result === 'failed') showToast('❌ Bagikan tidak tersedia. Salin URL secara manual.');
  }

  const ACTION_BTN: React.CSSProperties = {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '10px 6px',
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: 10, fontWeight: 700, color: 'var(--color-text)',
  };

  return (
    <section>
      <SectionLabel title="Identitas Digital (KTP Ternak)" />

      {/* Hidden full-size KTP element used by html2canvas for PDF capture */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1, pointerEvents: 'none' }}
      >
        <div ref={ktpRef}>
          <KtpOfficialCard lv={lv} isArchived={isArchived} />
        </div>
      </div>

      {/* Landscape thumbnail — same layout as the fullscreen card, scaled to fit */}
      <KtpPreviewThumbnail lv={lv} isArchived={isArchived} />

      {/* Action bar */}
      <Card style={{ overflow: 'hidden', marginTop: 10 }}>
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>
            Aksi KTP
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Lihat — opens fullscreen viewer */}
            <button type="button" style={ACTION_BTN} onClick={() => setShowFullscreen(true)}>
              <span style={{ fontSize: 18 }}>👁️</span>
              Lihat
            </button>

            {/* Unduh PDF — generates real PDF via html2canvas + jsPDF */}
            <button
              type="button"
              style={{ ...ACTION_BTN, opacity: pdfLoading ? 0.6 : 1 }}
              onClick={handlePdf}
              disabled={pdfLoading}
            >
              <span style={{ fontSize: 18 }}>{pdfLoading ? '⏳' : '📄'}</span>
              {pdfLoading ? 'Membuat...' : 'Unduh PDF'}
            </button>

            {/* Bagikan — Web Share API with clipboard fallback */}
            <button type="button" style={ACTION_BTN} onClick={handleShare}>
              <span style={{ fontSize: 18 }}>📤</span>
              Bagikan
            </button>
          </div>

          {/* Toast feedback */}
          {toast && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: '#f0f7ff',
              border: '1px solid #b3d4f5',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#1a3558',
              textAlign: 'center',
            }}>
              {toast}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4 }}>
            ℹ️ Identitas digital selalu mencerminkan data ternak terkini secara otomatis.
          </p>
        </div>
      </Card>

      {/* Fullscreen KTP viewer */}
      {showFullscreen && (
        <KtpFullscreenViewer
          lv={lv}
          isArchived={isArchived}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </section>
  );
}

// ─── Pedigree (preview card) ──────────────────────────────────────────────────

function PedigreeCard({ lv, pedigree, currentId }: { lv: LivestockRecord; pedigree: PedigreeRecord; currentId: string }) {
  const navigate = useNavigate();

  const DISPLAY_ROWS = [
    pedigree.parents[0],
    pedigree.parents[1],
    pedigree.grandparents[0],
    pedigree.grandparents[1],
  ];

  const RelRow = ({ role, id, name, icon }: { role: string; id: string | null; name: string | null; icon: string }) => (
    <div onClick={id ? () => navigate(`/livestock/${id}`) : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: id ? 'pointer' : 'default', opacity: id ? 1 : 0.5 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{role}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginTop: 1 }}>
          {name ?? (id ? 'Tanpa Nama' : 'Tidak Diketahui')}
        </div>
        {id && <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{id}</div>}
      </div>
      {id && <span style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>}
    </div>
  );

  return (
    <section>
      <SectionLabel title="Silsilah" />
      <Card style={{ overflow: 'hidden' }}>
        {DISPLAY_ROWS.map((row, i) => (
          <div key={row.role} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
            <RelRow {...row} />
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={() => navigate(`/livestock/${currentId}/silsilah`)}
            style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
            Lihat Silsilah Lengkap &gt;&gt;
          </button>
        </div>
      </Card>
    </section>
  );
}

// ─── Offspring ────────────────────────────────────────────────────────────────

function OffspringSection({ lv, pedigree, currentId }: { lv: LivestockRecord; pedigree: PedigreeRecord; currentId: string }) {
  const navigate = useNavigate();
  const offspring = pedigree.offspring;

  return (
    <section>
      <SectionLabel title="Keturunan" />
      <Card style={{ overflow: 'hidden' }}>
        {offspring.length === 0 ? (
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 26, opacity: 0.35 }}>🐣</span>
            <span style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
              Belum ada keturunan tercatat untuk ternak ini.
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{offspring.length} ekor</span>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', padding: '14px 16px' }}>
              {offspring.map((o) => (
                <div key={o.id ?? o.role} onClick={o.id ? () => navigate(`/livestock/${o.id}`) : undefined}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: o.id ? 'pointer' : 'default', minWidth: 72 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: lv.typeBg, border: '1.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    {o.icon}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                      {o.name ?? 'Tanpa Nama'}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 2, letterSpacing: 0.2 }}>{o.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={() => navigate(`/livestock/${currentId}/keturunan`)}
            style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
            Lihat Semua &gt;&gt;
          </button>
        </div>
      </Card>
    </section>
  );
}

// ─── Module Summary ───────────────────────────────────────────────────────────

function ModuleSummary({ lv, id, isArchived }: { lv: LivestockRecord; id: string; isArchived: boolean }) {
  const navigate = useNavigate();
  const ownershipHistory  = getOwnershipHistory(id);
  const currentOwnerRecord = ownershipHistory.find((r) => r.isCurrent);
  const currentOwnerLabel  = currentOwnerRecord ? currentOwnerRecord.workspace : '—';

  // Derive real last-activity values from live data
  const reproHistory   = getReproHistory(id);
  const lastReproDate  = reproHistory.length > 0 ? reproHistory[0].date : '—';

  const transferHistory = getTransferHistoryByLivestock(id);
  const lastMutasiDate  = transferHistory.length > 0 ? transferHistory[transferHistory.length - 1].departDate : '—';

  // Feed: derive last pemberian pakan date from live data (not a placeholder)
  const pakanList    = getPemberianPakanByTarget(id);
  const lastPakanVal = pakanList.length > 0 ? pakanList[0].tanggal : 'Belum ada data';

  // Weight: derive from live weight history
  const weightHistory = getWeightHistory(id);
  const lastWeightVal = weightHistory.length > 0
    ? `${weightHistory[0].weight} ${weightHistory[0].unit}`
    : `${lv.weight} ${lv.weightUnit}`;

  const ALL_MODULES = [
    { icon: '⚖️', label: 'Bobot',       valueLabel: 'Bobot Terakhir',     value: lastWeightVal,     to: `/livestock/${id}/bobot`,       readOnly: true  },
    { icon: '❤️', label: 'Kesehatan',   valueLabel: 'Status Terakhir',    value: lv.status,         to: `/livestock/${id}/kesehatan`,   readOnly: true  },
    { icon: '🌿', label: 'Pakan',       valueLabel: 'Pemberian Terakhir', value: lastPakanVal,      to: `/livestock/${id}/pakan`,       readOnly: false },
    { icon: '🧬', label: 'Reproduksi',  valueLabel: 'Aktivitas Terakhir', value: lastReproDate,     to: `/livestock/${id}/reproduksi`,  readOnly: true  },
    { icon: '🔄', label: 'Mutasi',      valueLabel: 'Mutasi Terakhir',    value: lastMutasiDate,    to: `/livestock/${id}/mutasi`,      readOnly: true  },
    { icon: '🏠', label: 'Kepemilikan', valueLabel: 'Workspace Saat Ini', value: currentOwnerLabel, to: `/livestock/${id}/kepemilikan`, readOnly: true  },
  ];

  // Archived profiles: only show read-only modules (no write-action entry points)
  const MODULES = isArchived ? ALL_MODULES.filter((m) => m.readOnly) : ALL_MODULES;

  return (
    <section>
      <SectionLabel title="Ringkasan Modul" />
      <Card style={{ overflow: 'hidden' }}>
        {MODULES.map((mod, i) => (
          <div key={mod.label} onClick={() => navigate(mod.to)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < MODULES.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {mod.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{mod.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {mod.valueLabel}: <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{mod.value}</span>
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
          </div>
        ))}
      </Card>
    </section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
// Consolidated, immutable, chronological event log for this livestock.
// Sources: weight, health, feed, transfer/mutation events.
// Order: newest → oldest (Livestock Constitution §Timeline).

type TimelineEntry = {
  id:    string;
  date:  string;  // ISO date or timestamp for sorting
  icon:  string;
  label: string;  // event type label
  desc:  string;  // human-readable description
  tag:   string;  // module tag
  tagColor: string;
  tagBg:    string;
};

function KH_EVENT_LABEL(type: string): string {
  const map: Record<string, string> = {
    pemeriksaan_created: 'Pemeriksaan Dibuat',
    tindakan_started:    'Sesi Tindakan Dibuka',
    pengobatan_started:  'Sesi Pengobatan Dibuka',
    kontrol_completed:   'Kontrol Selesai',
  };
  return map[type] ?? type;
}

function buildProfileTimeline(id: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // 1. Weight events
  const weightEvents = getWeightTimeline(id);
  for (const e of weightEvents) {
    entries.push({
      id:       `wt-${e.id}`,
      date:     e.recordedAt,
      icon:     '⚖️',
      label:    'Catat Bobot',
      desc:     `${e.weight} ${e.unit}${e.diff ? ` (${e.diff >= '0' ? '+' : ''}${e.diff} ${e.unit})` : ''} — ${e.date}`,
      tag:      'Bobot',
      tagColor: '#0277bd',
      tagBg:    '#e3f2fd',
    });
  }

  // 2. Health events
  const khEvents = getKHTimeline(id);
  for (const e of khEvents) {
    entries.push({
      id:       `kh-${e.id}`,
      date:     e.recordedAt,
      icon:     '❤️',
      label:    KH_EVENT_LABEL(e.type),
      desc:     e.notes ?? e.tanggal,
      tag:      'Kesehatan',
      tagColor: '#c62828',
      tagBg:    '#ffebee',
    });
  }

  // 3. Feed events
  const pakanEvents = getPakanTimeline(id);
  for (const e of pakanEvents) {
    entries.push({
      id:       `pk-${e.id}`,
      date:     e.recordedAt,
      icon:     '🌿',
      label:    'Pemberian Pakan Selesai',
      desc:     e.notes ?? e.tanggal,
      tag:      'Pakan',
      tagColor: '#2e7d32',
      tagBg:    '#e8f5e9',
    });
  }

  // 4. Transfer / mutation events
  const transfers = getTransferHistoryByLivestock(id);
  for (const t of transfers) {
    const ACTION_LABELS: Record<string, { icon: string; label: string }> = {
      'Keluar Sementara': { icon: '📍', label: 'Keluar Sementara' },
      'Kembali ke Kandang': { icon: '🏠', label: 'Kembali ke Kandang' },
      'Keluar Permanen': { icon: '📦', label: 'Keluar Permanen' },
    };
    const ac = ACTION_LABELS[t.action] ?? { icon: '🔄', label: t.action };
    entries.push({
      id:       `tr-${t.id}`,
      date:     t.recordedDate ?? t.departDate,
      icon:     ac.icon,
      label:    ac.label,
      desc:     [t.reason, t.destinationName, t.notes].filter(Boolean).join(' · ') || t.departDate,
      tag:      'Mutasi',
      tagColor: '#6a1b9a',
      tagBg:    '#f3e5f5',
    });
  }

  // Sort newest → oldest
  entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  return entries;
}

function ProfileTimeline({ id }: { id: string }) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW_COUNT = 5;

  const entries = buildProfileTimeline(id);
  const visible = showAll ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <section>
      <SectionLabel title="Timeline Aktivitas" />
      <Card style={{ overflow: 'hidden' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, opacity: 0.35 }}>📋</span>
            <span style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
              Belum ada aktivitas tercatat untuk ternak ini.
            </span>
          </div>
        ) : (
          <>
            {visible.map((entry, i) => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px',
                borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                {/* Timeline dot + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: entry.tagBg, border: `1.5px solid ${entry.tagColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    {entry.icon}
                  </div>
                  {i < visible.length - 1 && (
                    <div style={{ width: 1.5, flex: 1, minHeight: 16, background: 'var(--color-border)', marginTop: 4 }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{entry.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: entry.tagColor, background: entry.tagBg, borderRadius: 20, padding: '1px 7px' }}>{entry.tag}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>{entry.desc}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3, opacity: 0.7 }}>
                    {entry.date.length > 10
                      ? new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : entry.date}
                  </div>
                </div>
              </div>
            ))}

            {entries.length > PREVIEW_COUNT && (
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                <button type="button" onClick={() => setShowAll((v) => !v)}
                  style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                  {showAll
                    ? '▲ Tampilkan Lebih Sedikit'
                    : `▼ Lihat ${entries.length - PREVIEW_COUNT} Aktivitas Lainnya`}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivestockProfile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = paramId ?? '';

  // ── Supabase data loader — must be called before any conditional return ──
  // Bridge hook: populates LIVESTOCK_DB and related stores from Supabase so
  // deep-link / hard-refresh navigations work correctly.
  const { isLoading, error, refresh } = useLivestock();

  // Workspace & auth — needed for Supabase service calls in sheets.
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;
  const userId = currentUser?.id ?? null;

  // LS-PHOTO-003: declared here (before any conditional return) to satisfy
  // React's Rules of Hooks — photoTick propagates cover-photo changes from
  // PhotoGallery to IdentityPhoto so the avatar stays in sync.
  const [photoTick, setPhotoTick] = useState(0);

  // ── Sheet state — declared before conditional returns (Rules of Hooks) ──
  const [showKeluarSheet,  setShowKeluarSheet]  = useState(false);
  const [showKembaliSheet, setShowKembaliSheet] = useState(false);
  const [showArchiveSheet, setShowArchiveSheet] = useState(false);

  // ── Loading guard ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat profil ternak...</div>
      </div>
    );
  }

  // ── Error guard ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── M-01 fix: guard against invalid/unknown livestock IDs ────────────────
  // getLivestock() silently returns FALLBACK_LIVESTOCK for any unknown id —
  // render an explicit "not found" state instead.
  if (!LIVESTOCK_DB[id]) {
    return (
      <div style={{ padding: '48px 24px 80px', maxWidth: 480, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 48, opacity: 0.4 }}>🐄</span>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Ternak Tidak Ditemukan</div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 260 }}>
          ID ternak <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{id || '(kosong)'}</span> tidak terdaftar dalam sistem.
        </div>
        <button
          type="button"
          onClick={() => navigate('/livestock')}
          style={{ marginTop: 8, padding: '11px 24px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Kembali ke Daftar Ternak
        </button>
      </div>
    );
  }

  // Always look up by the current URL param — never cache across navigations
  const lv          = getLivestock(id);
  const ext         = getExtendedMetadata(id);
  const pedigree    = getPedigree(id);
  const activeBatches = getActiveLivestockBatches(id);

  // Determine livestock location status — drives banners and read-only mode
  const lvStatus   = getLivestockStatus(id);
  const isArchived    = lvStatus === 'Arsip';
  const isLuarKandang = lvStatus === 'Luar Kandang';
  const archiveInfo   = isArchived ? getArchiveInfoById(id) : null;

  return (
    <>
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Edit / menu buttons — hidden for archived livestock (read-only) */}
      {!isArchived && (
        <HeaderActions
          onEdit={() => navigate(`/livestock/${id}/edit`)}
          onShare={() => { shareKtp(lv); }}
          onArchive={() => setShowArchiveSheet(true)}
          onKeluarSementara={() => setShowKeluarSheet(true)}
          isLuarKandang={isLuarKandang}
        />
      )}

      {/* Status banners — mutually exclusive */}
      {isArchived && archiveInfo && (
        <ArchiveBanner reason={archiveInfo.reason} date={archiveInfo.date} />
      )}
      {isLuarKandang && <LuarKandangBanner id={id} onKembali={() => setShowKembaliSheet(true)} />}

      {/* Identity — tick forces avatar to re-render when cover photo changes */}
      <IdentityPhoto lv={lv} tick={photoTick} />

      {/* AI Insight — per-livestock, rule-based */}
      <ProfileAIInsight id={id} lv={lv} />

      {/* Identity details — core + extended fields (earTag, internalCode, breedCategory) */}
      <LivestockIdentityCard lv={lv} ext={ext} />

      {/* Physical characteristics — color, horn, tail, specialMarks */}
      <PhysicalCard ext={ext} />

      {/* Purchase information — supplier, purchaseDate, purchasePrice */}
      <PurchaseInfoCard ext={ext} />

      {/* Notes */}
      <NotesCard notes={ext.notes} />

      {/* Photo gallery */}
      <PhotoGallery id={id} lv={lv} isArchived={isArchived}
        onCoverChange={() => setPhotoTick((t) => t + 1)} />

      {/* KTP Ternak */}
      <DigitalIdentityCard lv={lv} isArchived={isArchived} />

      {/* Additional meta: registration date, last updated */}
      <MetaInfoCard lv={lv} id={id} />

      {/* Active batches — hidden for archived livestock */}
      {!isArchived && activeBatches.length > 0 && <CurrentBatchCard batches={activeBatches} />}

      {/* Module summary — links to per-module pages; feed from live data */}
      <ModuleSummary lv={lv} id={id} isArchived={isArchived} />

      {/* Pedigree */}
      <PedigreeCard lv={lv} pedigree={pedigree} currentId={id} />
      <OffspringSection lv={lv} pedigree={pedigree} currentId={id} />

      {/* Timeline — consolidated immutable event log; always visible including for archived */}
      <ProfileTimeline id={id} />

    </div>

    {/* ── Action Sheets (portals rendered over the whole page) ──────────── */}
    {showKeluarSheet && (
      <KeluarSementaraSheet
        livestockId={id}
        workspaceId={workspaceId}
        userId={userId}
        onClose={() => setShowKeluarSheet(false)}
        onDone={() => { setShowKeluarSheet(false); refresh(); }}
      />
    )}
    {showKembaliSheet && (
      <KembaliKandangSheet
        livestockId={id}
        workspaceId={workspaceId}
        onClose={() => setShowKembaliSheet(false)}
        onDone={() => { setShowKembaliSheet(false); refresh(); }}
      />
    )}
    {showArchiveSheet && (
      <ArchiveSheet
        livestockId={id}
        workspaceId={workspaceId}
        onClose={() => setShowArchiveSheet(false)}
        onDone={() => { setShowArchiveSheet(false); refresh(); navigate('/livestock'); }}
      />
    )}
    </>
  );
}
