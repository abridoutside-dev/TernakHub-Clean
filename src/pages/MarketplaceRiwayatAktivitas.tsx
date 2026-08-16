// ─── MPK-016 — Riwayat Aktivitas Marketplace ──────────────────────────────────
// Halaman audit trail semua aktivitas Marketplace untuk workspace aktif.
// Layout: Header → Ringkasan → Search → Filter → Timeline → Detail (sheet).
// Seluruh data berasal dari aggregator read-only; tidak ada input manual.

import { useState, useMemo } from 'react';
import { useDebounce } from '../utils/useDebounce';
import { usePaginatedList } from '../utils/usePaginatedList';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import {
  getAllAktivitas,
  getRingkasanAktivitas,
  type AktivitasRecord,
  type KategoriAktivitas,
} from '../data/marketplaceRiwayatAktivitasData';
import { useMarketplaceAktivitas } from '../hooks/useMarketplaceAktivitas';

// ─── Konstanta ────────────────────────────────────────────────────────────────

type FilterKategori = KategoriAktivitas | 'Semua';

const FILTER_CHIPS: { slug: FilterKategori; label: string; icon: string }[] = [
  { slug: 'Semua',      label: 'Semua',      icon: '📋' },
  { slug: 'Listing',    label: 'Listing',    icon: '🏪' },
  { slug: 'Wishlist',   label: 'Wishlist',   icon: '🔖' },
  { slug: 'Negosiasi',  label: 'Negosiasi',  icon: '🤝' },
  { slug: 'Chat',       label: 'Chat',       icon: '💬' },
  { slug: 'Transaksi',  label: 'Transaksi',  icon: '🧾' },
  { slug: 'Sistem',     label: 'Sistem',     icon: '⚙️' },
];

const KATEGORI_COLOR: Record<KategoriAktivitas, { bg: string; color: string }> = {
  Listing:   { bg: '#e8f5ee', color: '#1b7a43' },
  Wishlist:  { bg: '#fff8e1', color: '#7b5e2a' },
  Negosiasi: { bg: '#e3f2fd', color: '#1565c0' },
  Chat:      { bg: '#f3e5f5', color: '#6a1b9a' },
  Transaksi: { bg: '#fce4ec', color: '#ad1457' },
  Sistem:    { bg: '#efebe9', color: '#4e342e' },
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Aktif:                    { bg: '#e8f5ee', color: '#1b7a43' },
  Draft:                    { bg: '#f5f5f5', color: '#616161' },
  Ditahan:                  { bg: '#fff8e1', color: '#7b5e2a' },
  Terjual:                  { bg: '#e3f2fd', color: '#1565c0' },
  Ditutup:                  { bg: '#ffebee', color: '#c62828' },
  Diarsipkan:               { bg: '#efebe9', color: '#5d4037' },
  Selesai:                  { bg: '#e8f5ee', color: '#1b7a43' },
  Disetujui:                { bg: '#e8f5ee', color: '#1b7a43' },
  'Menunggu Persetujuan':   { bg: '#fff8e1', color: '#7b5e2a' },
  'Menunggu Pembayaran':    { bg: '#fff8e1', color: '#7b5e2a' },
  Diproses:                 { bg: '#e3f2fd', color: '#1565c0' },
  'Siap Diserahkan':        { bg: '#e3f2fd', color: '#1565c0' },
  'Sedang Dikirim':         { bg: '#e3f2fd', color: '#1565c0' },
  Dibatalkan:               { bg: '#ffebee', color: '#c62828' },
  Ditolak:                  { bg: '#ffebee', color: '#c62828' },
  'Menunggu Respon Penjual': { bg: '#fff8e1', color: '#7b5e2a' },
  'Penawaran Balik':        { bg: '#e3f2fd', color: '#1565c0' },
  Terkirim:                 { bg: '#e8f5ee', color: '#1b7a43' },
  Diterima:                 { bg: '#e8f5ee', color: '#1b7a43' },
  Dibaca:                   { bg: '#f5f5f5', color: '#616161' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWaktu(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function formatWaktuRelative(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)   return 'Baru saja';
    if (diffMins < 60)  return `${diffMins} mnt lalu`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)   return `${diffHrs} jam lalu`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7)   return `${diffDays} hari lalu`;
    return formatWaktu(iso);
  } catch {
    return iso;
  }
}

function groupByDate(records: AktivitasRecord[]): { dateLabel: string; items: AktivitasRecord[] }[] {
  const groups: Map<string, AktivitasRecord[]> = new Map();
  const today    = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  for (const r of records) {
    const dateStr = r.waktu.slice(0, 10);
    let label = dateStr;
    if (dateStr === today)     label = 'Hari Ini';
    else if (dateStr === yesterday) label = 'Kemarin';
    else {
      try {
        const d = new Date(dateStr);
        const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
                       'Juli','Agustus','September','Oktober','November','Desember'];
        label = `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
      } catch { /* keep dateStr */ }
    }
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(r);
  }

  return Array.from(groups.entries()).map(([dateLabel, items]) => ({ dateLabel, items }));
}

// ─── Sub-komponen: Ringkasan Card ─────────────────────────────────────────────

function RingkasanCard({
  label, value, icon, color,
}: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 10px 8px',
      border: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
    }}>
      <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500, lineHeight: 1.2 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Sub-komponen: Aktivitas Card ─────────────────────────────────────────────

function AktivitasCard({
  record,
  onClick,
}: {
  record: AktivitasRecord;
  onClick: (r: AktivitasRecord) => void;
}) {
  const katColor = KATEGORI_COLOR[record.kategori] ?? { bg: '#f5f5f5', color: '#616161' };
  const stColor  = STATUS_COLOR[record.status ?? ''] ?? { bg: '#f5f5f5', color: '#616161' };

  return (
    <button
      type="button"
      onClick={() => onClick(record)}
      style={{
        width: '100%', textAlign: 'left',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 12px 10px',
        cursor: 'pointer',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      {/* Icon lingkaran */}
      <div style={{
        width: 38, height: 38, flexShrink: 0,
        borderRadius: '50%',
        background: katColor.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
      }}>
        {record.icon}
      </div>

      {/* Konten */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.3, flex: 1, minWidth: 0,
          }}>
            {record.jenisAktivitas}
          </div>
          <div style={{
            fontSize: 10.5, color: 'var(--color-muted)',
            fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {formatWaktuRelative(record.waktu)}
          </div>
        </div>

        <div style={{
          fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.4, marginBottom: 6,
          display: '-webkit-box', WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2, overflow: 'hidden',
        }}>
          {record.ringkasan}
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Kategori badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            borderRadius: 100, background: katColor.bg, color: katColor.color,
          }}>
            {record.kategori}
          </span>
          {/* Status badge */}
          {record.status && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 100, background: stColor.bg, color: stColor.color,
            }}>
              {record.status}
            </span>
          )}
          {/* Nomor referensi */}
          <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
            {record.nomorReferensi}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Sub-komponen: Detail Sheet ───────────────────────────────────────────────

function DetailSheet({
  record,
  onClose,
}: {
  record: AktivitasRecord;
  onClose: () => void;
}) {
  const katColor = KATEGORI_COLOR[record.kategori] ?? { bg: '#f5f5f5', color: '#616161' };
  const stColor  = STATUS_COLOR[record.status ?? ''] ?? { bg: '#f5f5f5', color: '#616161' };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 200,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--color-surface)',
        borderRadius: '16px 16px 0 0',
        zIndex: 201,
        maxHeight: '80vh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header sheet */}
        <div style={{ padding: '8px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              Detail Aktivitas
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
              {record.nomorAktivitas}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: '50%', width: 30, height: 30,
              cursor: 'pointer', fontSize: 14, color: 'var(--color-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Isi detail */}
        <div style={{ padding: '16px 16px 8px' }}>
          {/* Ikon + jenis + ringkasan */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 46, height: 46, flexShrink: 0, borderRadius: '50%',
              background: katColor.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {record.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3 }}>
                {record.jenisAktivitas}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                {record.ringkasan}
              </div>
            </div>
          </div>

          {/* Badge baris */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 100, background: katColor.bg, color: katColor.color,
            }}>
              {record.kategori}
            </span>
            {record.status && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 100, background: stColor.bg, color: stColor.color,
              }}>
                {record.status}
              </span>
            )}
          </div>

          {/* Tabel detail */}
          <div style={{
            background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 12,
          }}>
            {/* Baris wajib */}
            {[
              { k: 'UUID Aktivitas', v: record.id },
              { k: 'Nomor Aktivitas', v: record.nomorAktivitas },
              { k: 'Jenis Aktivitas', v: record.jenisAktivitas },
              { k: 'Nomor Referensi', v: record.nomorReferensi },
              { k: 'Workspace',       v: record.workspaceNama },
              { k: 'Waktu',           v: formatWaktu(record.waktu) },
            ].map(({ k, v }, i) => (
              <div
                key={k}
                style={{
                  display: 'flex', gap: 8,
                  borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none',
                  padding: '9px 12px',
                }}
              >
                <div style={{ width: 120, flexShrink: 0, fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 600 }}>
                  {k}
                </div>
                <div style={{
                  flex: 1, fontSize: 11.5, color: 'var(--color-text)', wordBreak: 'break-all',
                  fontFamily: k === 'UUID Aktivitas' || k === 'Nomor Referensi' ? 'monospace' : undefined,
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* Kolom detail tambahan dari sumber data */}
          {Object.keys(record.detail).length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Ringkasan Perubahan
              </div>
              <div style={{
                background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 16,
              }}>
                {Object.entries(record.detail).map(([k, v], i, arr) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex', gap: 8,
                      borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                      padding: '9px 12px',
                    }}
                  >
                    <div style={{ width: 120, flexShrink: 0, fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 600 }}>
                      {k}
                    </div>
                    <div style={{ flex: 1, fontSize: 11.5, color: 'var(--color-text)', wordBreak: 'break-all' }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tutup */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

/** Map a DB activity_log module name to the UI KategoriAktivitas. */
function mapModuleToKategori(module: string): KategoriAktivitas {
  const m = module.toLowerCase();
  if (m.includes('listing'))   return 'Listing';
  if (m.includes('wishlist'))  return 'Wishlist';
  if (m.includes('negosias'))  return 'Negosiasi';
  if (m.includes('chat'))      return 'Chat';
  if (m.includes('transaksi') || m.includes('transaction')) return 'Transaksi';
  return 'Sistem';
}

function mapSeverityToIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high':     return '⚠️';
    case 'medium':   return '📋';
    case 'low':      return '📄';
    default:         return '⚙️';
  }
}

export default function MarketplaceRiwayatAktivitas() {
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

  const workspaceId = ws?.workspace_uuid;

  const [inputSearch, setInputSearch] = useState('');
  const search = useDebounce(inputSearch, 300);
  const [filter, setFilter]     = useState<FilterKategori>('Semua');
  const [selected, setSelected] = useState<AktivitasRecord | null>(null);

  // Hitung data sekali per render — aggregator read-only (from in-memory stores)
  const memAktivitas = useMemo(() => getAllAktivitas(workspaceId), [workspaceId]);
  const ringkasan    = useMemo(() => getRingkasanAktivitas(workspaceId), [workspaceId]);

  // DB activity_log (supplements the in-memory aggregated records)
  const { rows: dbRows } = useMarketplaceAktivitas(workspaceId);

  // Convert DB rows to AktivitasRecord and merge
  const allAktivitas = useMemo((): AktivitasRecord[] => {
    const memIds = new Set(memAktivitas.map((r) => r.id));
    const fromDb: AktivitasRecord[] = dbRows
      .filter((r) => !memIds.has(r.id))
      .map((row, idx) => {
        const kat = mapModuleToKategori(row.module);
        return {
          id: row.id,
          nomorAktivitas: `AKT-DB-${row.id.slice(0, 8).toUpperCase()}`,
          jenisAktivitas: (row.action || 'Aktivitas Sistem') as AktivitasRecord['jenisAktivitas'],
          kategori: kat,
          nomorReferensi: row.entity_id ?? row.id.slice(0, 8).toUpperCase(),
          judulReferensi: row.description ?? row.action,
          workspaceId: row.workspace_id ?? workspaceId,
          workspaceNama: ws?.workspace_name ?? '',
          ringkasan: row.description ?? row.action,
          waktu: row.created_at,
          status: row.status,
          icon: mapSeverityToIcon(row.severity),
          detail: (row.metadata ?? {}) as Record<string, string | number>,
        };
        void idx;
      });
    return [...memAktivitas, ...fromDb].sort((a, b) =>
      b.waktu.localeCompare(a.waktu),
    );
  }, [memAktivitas, dbRows, workspaceId, ws?.workspace_name]);

  // Search + Filter (search uses debounced value)
  const filtered = useMemo(() => {
    let rows = allAktivitas;

    if (filter !== 'Semua') {
      rows = rows.filter((r) => r.kategori === filter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        r.nomorAktivitas.toLowerCase().includes(q) ||
        r.nomorReferensi.toLowerCase().includes(q) ||
        r.judulReferensi.toLowerCase().includes(q) ||
        r.workspaceNama.toLowerCase().includes(q) ||
        r.ringkasan.toLowerCase().includes(q) ||
        r.jenisAktivitas.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [allAktivitas, filter, search]);

  const { visible: paginatedFiltered, hasMore: riwayatHasMore, sentinelRef: riwayatSentinel } = usePaginatedList(filtered, 20);
  const grouped = useMemo(() => groupByDate(paginatedFiltered), [paginatedFiltered]);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 16px 12px',
        maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
              📋 Riwayat Marketplace
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              Audit trail semua aktivitas
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 100, padding: '5px 10px',
          }}>
            <span style={{ fontSize: 12 }}>🏢</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ws?.workspace_name ?? 'Workspace'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Ringkasan ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <RingkasanCard label="Total Aktivitas" value={ringkasan.total}     icon="📊" color="var(--color-primary)" />
          <RingkasanCard label="Hari Ini"         value={ringkasan.hariIni}  icon="📅" color="#1565c0" />
          <RingkasanCard label="Minggu Ini"       value={ringkasan.mingguIni} icon="🗓️" color="#6a1b9a" />
          <RingkasanCard label="Bulan Ini"        value={ringkasan.bulanIni}  icon="📆" color="#ad1457" />
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 12px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari nomor aktivitas, listing, transaksi, workspace..."
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 36px 10px 38px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setInputSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--color-muted)', padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '0 0 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <div style={{
          display: 'flex', gap: 6,
          padding: '0 16px',
          width: 'max-content',
          maxWidth: '100%',
        }}>
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.slug;
            return (
              <button
                key={chip.slug}
                type="button"
                onClick={() => setFilter(chip.slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 12px',
                  borderRadius: 100,
                  background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                  color:      active ? '#fff' : 'var(--color-text)',
                  border:     active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 13 }}>{chip.icon}</span>
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Tidak ada aktivitas
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>
              {search
                ? `Tidak ada hasil untuk "${inputSearch}"`
                : filter !== 'Semua'
                  ? `Belum ada aktivitas kategori ${filter}`
                  : 'Belum ada aktivitas Marketplace tercatat'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {grouped.map((group) => (
              <div key={group.dateLabel} style={{ marginBottom: 16 }}>
                {/* Label tanggal */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    padding: '3px 10px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 100,
                    whiteSpace: 'nowrap',
                  }}>
                    {group.dateLabel}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                {/* Kartu aktivitas dalam grup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map((record) => (
                    <AktivitasCard
                      key={record.id}
                      record={record}
                      onClick={setSelected}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            {riwayatHasMore && (
              <div ref={riwayatSentinel} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />
                ))}
              </div>
            )}

            {/* Footer jumlah */}
            <div style={{
              textAlign: 'center', padding: '12px 0 4px',
              fontSize: 12, color: 'var(--color-muted)',
            }}>
              {riwayatHasMore
                ? `${paginatedFiltered.length} dari ${filtered.length} aktivitas ditampilkan`
                : `${filtered.length} aktivitas ditemukan`}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Sheet ─────────────────────────────────────────────────────── */}
      {selected && (
        <DetailSheet record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
