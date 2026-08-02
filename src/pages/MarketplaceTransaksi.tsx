// ─── MPK-009 — Halaman Transaksi Marketplace ─────────────────────────────────
// Daftar seluruh transaksi Marketplace milik Workspace aktif.
// Layout: Header → Ringkasan → Search → Filter → Daftar Transaksi.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { usePaginatedList } from '../utils/usePaginatedList';
import {
  getAllTransaksi,
  getRingkasanTransaksi,
  searchAndFilterTransaksi,
  type TransaksiItem,
  type TransaksiStatus,
  type TransaksiFilterStatus,
} from '../data/marketplaceTransaksiData';
import { useMarketplace } from '../hooks/useMarketplace';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TransaksiStatus, { bg: string; color: string; label: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#7b5e2a', label: 'Menunggu Persetujuan' },
  Disetujui:             { bg: '#e8f5ee', color: '#1b7a43', label: 'Disetujui' },
  Ditolak:               { bg: '#ffebee', color: '#c62828', label: 'Ditolak' },
  'Menunggu Pembayaran': { bg: '#fff3e0', color: '#e65100', label: 'Menunggu Pembayaran' },
  Diproses:              { bg: '#e3f2fd', color: '#1565c0', label: 'Diproses' },
  'Siap Diserahkan':     { bg: '#f3e5f5', color: '#6a1b9a', label: 'Siap Diserahkan' },
  'Sedang Dikirim':      { bg: '#e0f7fa', color: '#006064', label: 'Sedang Dikirim' },
  Selesai:               { bg: '#e8f5ee', color: '#1b5e20', label: 'Selesai ✓' },
  Dibatalkan:            { bg: '#efebe9', color: '#5d4037', label: 'Dibatalkan' },
};

const FILTER_CHIPS: { key: TransaksiFilterStatus; label: string; icon: string }[] = [
  { key: 'semua',      label: 'Semua',                icon: '🗂️' },
  { key: 'menunggu',   label: 'Menunggu Persetujuan', icon: '⏳' },
  { key: 'diproses',   label: 'Diproses',             icon: '🔄' },
  { key: 'selesai',    label: 'Selesai',               icon: '✅' },
  { key: 'dibatalkan', label: 'Dibatalkan',            icon: '❌' },
];

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function RingkasanCard({
  icon, label, value, color,
}: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: '1 1 calc(50% - 6px)',
      minWidth: 0,
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function TransaksiCard({ item }: { item: TransaksiItem }) {
  const navigate = useNavigate();
  const badge = STATUS_BADGE[item.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/marketplace/transaksi/${item.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/marketplace/transaksi/${item.id}`)}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 14px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Baris atas: thumbnail + judul + status */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {item.thumbnailListing}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.judulListing}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            {item.id}
          </div>
        </div>
        <span style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 12,
          background: badge.bg, color: badge.color,
          whiteSpace: 'nowrap',
        }}>
          {badge.label}
        </span>
      </div>

      {/* Info transaksi */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
      }}>
        <InfoRow label="Pembeli" value={item.namaPembeli} />
        <InfoRow label="Penjual" value={item.namaPenjual} />
        <InfoRow label="Qty" value={`${item.qty} ${item.satuanHarga}`} />
        <InfoRow label="Total" value={formatRp(item.total)} highlight />
        <InfoRow label="Tanggal" value={formatTanggal(item.createdAt)} />
        <InfoRow label="Workspace Penjual" value={item.workspaceNamaPenjual} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--color-primary)' : 'var(--color-text)', marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      color: 'var(--color-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
        {isFiltered ? 'Tidak ada transaksi' : 'Belum ada transaksi'}
      </div>
      <div style={{ fontSize: 12 }}>
        {isFiltered
          ? 'Coba ubah filter atau kata kunci pencarian.'
          : 'Transaksi akan muncul di sini setelah Pembeli mengajukan pembelian dari listing Anda.'}
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceTransaksi() {
  useMarketplace(); // FLOW-003M27: hydrate transaksi from Supabase on mount
  const [inputKeyword, setInputKeyword] = useState('');
  const keyword = useDebounce(inputKeyword, 300);
  const [statusFilter, setStatusFilter] = useState<TransaksiFilterStatus>('semua');

  const ringkasan  = getRingkasanTransaksi();
  const allCount   = getAllTransaksi().length;
  const hasil      = useMemo(
    () => searchAndFilterTransaksi(keyword, statusFilter),
    [keyword, statusFilter],
  );
  const isFiltered = inputKeyword.trim().length > 0 || statusFilter !== 'semua';

  const { visible: hasilVisible, hasMore: hasilHasMore, sentinelRef: hasilSentinel } = usePaginatedList(hasil);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>

      {/* ── Ringkasan ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Ringkasan
        </div>
        {/* Total row */}
        <div style={{
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total Transaksi</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{allCount}</div>
        </div>
        {/* Grid 2×2 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <RingkasanCard icon="⏳" label="Menunggu Persetujuan" value={ringkasan.menungguPersetujuan} color="#7b5e2a" />
          <RingkasanCard icon="🔄" label="Diproses"             value={ringkasan.diproses}             color="#1565c0" />
          <RingkasanCard icon="✅" label="Selesai"               value={ringkasan.selesai}               color="#1b5e20" />
          <RingkasanCard icon="❌" label="Dibatalkan / Ditolak"  value={ringkasan.dibatalkan}            color="#c62828" />
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="search"
            placeholder="Cari nomor transaksi, listing, pembeli, penjual..."
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 38,
              paddingRight: keyword ? 36 : 12,
              height: 42,
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 14,
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
          {inputKeyword && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setInputKeyword('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--color-bg)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div style={{
        overflowX: 'auto',
        padding: '0 16px 14px',
        display: 'flex', gap: 8,
        scrollbarWidth: 'none',
      }}>
        {FILTER_CHIPS.map((chip) => {
          const active = statusFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setStatusFilter(chip.key)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px',
                borderRadius: 20,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                fontSize: 12.5, fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? 'none' : 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: 13 }}>{chip.icon}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Jumlah hasil ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 10px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
          {hasil.length} transaksi ditemukan
        </span>
      </div>

      {/* ── Daftar transaksi ───────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {hasil.length > 0
          ? hasilVisible.map((t) => <TransaksiCard key={t.id} item={t} />)
          : <EmptyState isFiltered={isFiltered} />}
      </div>
      {hasilHasMore && (
        <div ref={hasilSentinel} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
