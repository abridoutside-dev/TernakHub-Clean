// ─── Marketplace — Moderasi Laporan (MPK-018) ─────────────────────────────────
// Halaman Moderasi Marketplace: menampilkan seluruh laporan masuk.
// Layout: Header → Ringkasan → Search → Filter → Daftar Laporan
// Setiap laporan dapat dibuka ke halaman Detail Laporan.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import { useMarketplace } from '../hooks/useMarketplace';
import {
  queryLaporan,
  getLaporanSummary,
  STATUS_LAPORAN_META,
  ALASAN_LAPORAN_LIST,
  type LaporanRecord,
  type StatusLaporan,
} from '../data/marketplaceLaporanData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function alasanIcon(alasan: string): string {
  return ALASAN_LAPORAN_LIST.find((a) => a.value === alasan)?.icon ?? '📝';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 14,
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatBox({
  label, value, color, bg,
}: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 70, background: bg,
      border: `1.5px solid ${color}33`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color, opacity: 0.85, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function StatusChip({ status }: { status: StatusLaporan }) {
  const meta = STATUS_LAPORAN_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10.5, fontWeight: 700,
      color: meta.color, background: meta.bg,
      borderRadius: 20, padding: '3px 9px',
      whiteSpace: 'nowrap',
    }}>
      {meta.icon} {meta.label}
    </span>
  );
}

function LaporanCard({ laporan, onOpen }: { laporan: LaporanRecord; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px', marginBottom: 10,
        cursor: 'pointer',
      }}
    >
      {/* Baris atas: ID + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
          {laporan.id}
        </span>
        <StatusChip status={laporan.status} />
      </div>

      {/* Judul listing */}
      <div style={{
        fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
        marginBottom: 4, lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {alasanIcon(laporan.alasan)} {laporan.listingJudul}
      </div>

      {/* Alasan */}
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>
        Alasan: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{laporan.alasan}</span>
      </div>

      {/* Baris bawah: terlapor + tanggal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Terlapor:{' '}
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>
            {laporan.workspaceNamaTerlapor}
          </span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
          {formatTanggal(laporan.tanggalLaporan)}
        </div>
      </div>
    </button>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'Semua' | StatusLaporan;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'Semua',                           label: 'Semua' },
  { key: 'Menunggu Review',                 label: 'Menunggu' },
  { key: 'Diproses',                        label: 'Diproses' },
  { key: 'Memerlukan Informasi Tambahan',   label: 'Info Tambahan' },
  { key: 'Selesai',                         label: 'Selesai' },
  { key: 'Ditolak',                         label: 'Ditolak' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceLaporan() {
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

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterTab, setFilterTab] = useState<FilterTab>('Semua');

  const summary = getLaporanSummary();

  const list = queryLaporan({
    query: debouncedSearch,
    status: filterTab === 'Semua' ? undefined : filterTab,
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 32px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b7a43 0%, #0d5c32 100%)',
        borderRadius: 'var(--radius-md)', padding: '16px 18px',
        marginBottom: 14, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>🛡️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Laporan Marketplace</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              {getWorkspaceIcon(activeWs)} {activeWs.workspace_name}
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <SectionCard title="📊 Ringkasan">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatBox label="Total" value={summary.total}            color="#1b7a43" bg="#e8f5ee" />
          <StatBox label="Menunggu" value={summary.menungguReview} color="#7a6b1c" bg="#fdf3d0" />
          <StatBox label="Diproses" value={summary.diproses}       color="#0277bd" bg="#e1f5fe" />
          <StatBox label="Selesai"  value={summary.selesai}        color="#1b7a43" bg="#e8f5ee" />
          <StatBox label="Ditolak"  value={summary.ditolak}        color="#c62828" bg="#ffebee" />
        </div>
      </SectionCard>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: 'var(--color-muted)',
        }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nomor laporan, listing, atau workspace…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px 10px 36px',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            fontSize: 13, color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--color-muted)',
            }}
          >✕</button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        paddingBottom: 4, marginBottom: 14,
        scrollbarWidth: 'none',
      }}>
        {FILTER_TABS.map((tab) => {
          const active = filterTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key)}
              style={{
                flexShrink: 0, padding: '6px 14px',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                border: active ? 'none' : '1.5px solid var(--color-border)',
                fontSize: 11.5, fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              } as React.CSSProperties}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Daftar Laporan */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        {list.length} laporan ditemukan
      </div>

      {list.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            Tidak ada laporan
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {search ? 'Coba kata kunci lain.' : 'Belum ada laporan masuk dengan filter ini.'}
          </div>
        </div>
      ) : (
        list.map((lap) => (
          <LaporanCard
            key={lap.id}
            laporan={lap}
            onOpen={() => navigate(`/marketplace/laporan/${lap.id}`)}
          />
        ))
      )}
    </div>
  );
}
