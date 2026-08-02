// ─── Marketplace — Moderasi Kasus (MPK-019) ───────────────────────────────────
// Halaman utama Moderasi Marketplace.
// Layout: Header → Ringkasan → Search → Filter → Daftar Kasus
// Moderasi hanya mengelola Listing Marketplace — tidak mengubah data aset.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import {
  queryKasusModerasi,
  getKasusModerasiSummary,
  STATUS_MODERASI_META,
  SUMBER_MODERASI_META,
  type KasusModerasiRecord,
  type StatusModerasi,
} from '../data/marketplaceModerasiData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label, value, color, bg,
}: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 60,
      background: bg,
      border: `1.5px solid ${color}33`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 6px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color, opacity: 0.85, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function StatusChip({ status }: { status: StatusModerasi }) {
  const meta = STATUS_MODERASI_META[status];
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

function KasusCard({
  kasus, onOpen,
}: { kasus: KasusModerasiRecord; onOpen: () => void }) {
  const sumberMeta = SUMBER_MODERASI_META[kasus.sumber];

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
      {/* Baris atas: Nomor Kasus + Status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8, gap: 8,
      }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: 'var(--color-primary)', fontFamily: 'monospace',
        }}>
          {kasus.id}
        </span>
        <StatusChip status={kasus.status} />
      </div>

      {/* Judul listing */}
      <div style={{
        fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
        marginBottom: 5, lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {kasus.listingJudul}
      </div>

      {/* Alasan */}
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, lineHeight: 1.4 }}>
        {kasus.alasan}
      </div>

      {/* Baris bawah: Sumber + Workspace + Tanggal */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Sumber badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 700,
            color: sumberMeta.color, background: sumberMeta.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {sumberMeta.icon} {kasus.sumber}
          </span>
          {/* Nomor report */}
          {kasus.nomorReport && (
            <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
              {kasus.nomorReport}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
          {formatTanggal(kasus.tanggalDibuat)}
        </div>
      </div>

      {/* Workspace */}
      <div style={{
        marginTop: 6, fontSize: 11, color: 'var(--color-muted)',
        borderTop: '1px solid var(--color-border)', paddingTop: 6,
      }}>
        Workspace: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{kasus.workspaceNama}</span>
      </div>
    </button>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'Semua' | StatusModerasi;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'Semua',                 label: 'Semua' },
  { key: 'Menunggu Review',       label: 'Menunggu' },
  { key: 'Sedang Diproses',       label: 'Diproses' },
  { key: 'Memerlukan Klarifikasi', label: 'Klarifikasi' },
  { key: 'Selesai',               label: 'Selesai' },
  { key: 'Ditolak',               label: 'Ditolak' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceModerasiKasus() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterTab, setFilterTab] = useState<FilterTab>('Semua');
  const [tick, setTick] = useState(0);

  // Re-read on tick so fresh data shows after navigation back

  const summary = getKasusModerasiSummary();
  const list = queryKasusModerasi({
    query: debouncedSearch,
    status: filterTab === 'Semua' ? undefined : filterTab,
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 32px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #3a1a6e 0%, #5c3d8f 100%)',
        borderRadius: 'var(--radius-md)', padding: '16px 18px',
        marginBottom: 14, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>⚖️</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Moderasi Marketplace</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Penanganan laporan, pelanggaran, dan kualitas listing
            </div>
          </div>
        </div>
      </div>

      {/* ── Ringkasan ────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 14, marginBottom: 12,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
          📊 Ringkasan Kasus
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatBox label="Total"     value={summary.total}                color="#5c3d8f" bg="#f3eaff" />
          <StatBox label="Menunggu"  value={summary.menungguReview}       color="#7a6b1c" bg="#fdf3d0" />
          <StatBox label="Diproses"  value={summary.sedangDiproses}       color="#0277bd" bg="#e1f5fe" />
          <StatBox label="Klarifikasi" value={summary.memerlukanKlarifikasi} color="#7b3f00" bg="#fff3e0" />
          <StatBox label="Selesai"   value={summary.selesai}              color="#1b7a43" bg="#e8f5ee" />
          <StatBox label="Ditolak"   value={summary.ditolak}              color="#c62828" bg="#ffebee" />
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: 'var(--color-muted)', pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nomor kasus, nomor report, listing, workspace…"
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

      {/* ── Filter Tabs ──────────────────────────────────────────────────────── */}
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
                background: active ? '#5c3d8f' : 'var(--color-surface)',
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

      {/* ── Daftar Kasus ─────────────────────────────────────────────────────── */}
      <div style={{
        fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10,
      }}>
        {list.length} kasus ditemukan
      </div>

      {list.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            Tidak ada kasus
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {search ? 'Coba kata kunci lain.' : 'Belum ada kasus moderasi dengan filter ini.'}
          </div>
        </div>
      ) : (
        list.map((kasus) => (
          <KasusCard
            key={kasus.id}
            kasus={kasus}
            onOpen={() => {
              setTick((t) => t + 1);
              navigate(`/marketplace/moderasi/${kasus.id}`);
            }}
          />
        ))
      )}
    </div>
  );
}
