// ─── MPK-010 — Halaman Negosiasi Marketplace ─────────────────────────────────
// Daftar seluruh negosiasi harga/qty yang melibatkan Workspace aktif.
// Layout: Header → Ringkasan → Search → Filter → Daftar Negosiasi.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { usePaginatedList } from '../utils/usePaginatedList';
import {
  getAllNegosiasi,
  getRingkasanNegosiasi,
  searchAndFilterNegosiasi,
  type NegosiasiItem,
  type NegosiasiStatus,
  type NegosiasiFilterStatus,
} from '../data/marketplaceNegosiasiData';
import { useMarketplace } from '../hooks/useMarketplace';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<NegosiasiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Respon Penjual': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  'Penawaran Balik':         { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  Disetujui:                 { bg: '#e8f5ee', color: '#1b5e20', icon: '✅' },
  Ditolak:                   { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Dibatalkan Pembeli':      { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
  Kadaluarsa:                { bg: '#f5f5f5', color: '#757575', icon: '⌛' },
};

const FILTER_CHIPS: { key: NegosiasiFilterStatus; label: string; icon: string }[] = [
  { key: 'semua',         label: 'Semua',            icon: '🗂️' },
  { key: 'menunggu',      label: 'Menunggu Respon',  icon: '⏳' },
  { key: 'penawaranBalik',label: 'Penawaran Balik',  icon: '🔄' },
  { key: 'disetujui',     label: 'Disetujui',        icon: '✅' },
  { key: 'ditolak',       label: 'Ditolak',          icon: '❌' },
  { key: 'kadaluarsa',    label: 'Kadaluarsa',       icon: '⌛' },
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

function RingkasanCard({ icon, label, value, color }: {
  icon: string; label: string; value: number; color: string;
}) {
  return (
    <div style={{
      flex: '1 1 calc(50% - 6px)', minWidth: 0,
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

function NegosiasiCard({ item }: { item: NegosiasiItem }) {
  const navigate = useNavigate();
  const badge = STATUS_BADGE[item.status];
  const selisih = item.hargaPenawaran - item.hargaAwal;
  const pctSelisih = item.hargaAwal > 0
    ? Math.round((selisih / item.hargaAwal) * 100)
    : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/marketplace/negosiasi/${item.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/marketplace/negosiasi/${item.id}`)}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Baris atas: thumbnail + judul + badge status */}
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
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 12,
          background: badge.bg, color: badge.color,
          whiteSpace: 'nowrap',
        }}>
          {badge.icon} {item.status}
        </span>
      </div>

      {/* Info harga */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
      }}>
        <InfoRow label="Harga Awal"       value={formatRp(item.hargaAwal)} />
        <InfoRow label="Harga Penawaran"  value={formatRp(item.hargaPenawaran)} highlight />
        <InfoRow label="Qty"              value={`${item.qtyPenawaran} ${item.satuanHarga}`} />
        <InfoRow label="Selisih"
          value={`${selisih >= 0 ? '+' : ''}${pctSelisih}%`}
          color={selisih < 0 ? '#c62828' : '#1b7a43'}
        />
        <InfoRow label="Pembeli"  value={item.namaPembeli} />
        <InfoRow label="Penjual"  value={item.namaPenjual} />
        <InfoRow label="Tanggal"  value={formatTanggal(item.createdAt)} />
        {item.transaksiId && (
          <InfoRow label="Transaksi" value={item.transaksiId} highlight />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight, color }: {
  label: string; value: string; highlight?: boolean; color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 12, fontWeight: highlight ? 700 : 500, marginTop: 1,
        color: color ?? (highlight ? 'var(--color-primary)' : 'var(--color-text)'),
      }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
        {isFiltered ? 'Tidak ada negosiasi' : 'Belum ada negosiasi'}
      </div>
      <div style={{ fontSize: 12 }}>
        {isFiltered
          ? 'Coba ubah filter atau kata kunci pencarian.'
          : 'Negosiasi akan muncul saat Pembeli mengajukan penawaran dari halaman Detail Listing.'}
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceNegosiasi() {
  useMarketplace(); // FLOW-003M27: hydrate negosiasi from Supabase on mount
  const [inputKeyword, setInputKeyword] = useState('');
  const keyword = useDebounce(inputKeyword, 300);
  const [statusFilter, setStatusFilter] = useState<NegosiasiFilterStatus>('semua');

  const ringkasan  = getRingkasanNegosiasi();
  const allCount   = getAllNegosiasi().length;
  const hasil      = useMemo(
    () => searchAndFilterNegosiasi(keyword, statusFilter),
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
        <div style={{
          background: 'var(--color-primary)', borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total Negosiasi</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{allCount}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <RingkasanCard icon="⏳" label="Menunggu Respon"  value={ringkasan.menungguRespon}  color="#7b5e2a" />
          <RingkasanCard icon="🔄" label="Penawaran Balik"  value={ringkasan.penawaranBalik}  color="#1565c0" />
          <RingkasanCard icon="✅" label="Disetujui"         value={ringkasan.disetujui}        color="#1b5e20" />
          <RingkasanCard icon="❌" label="Ditolak / Batal"   value={ringkasan.ditolak}          color="#c62828" />
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--color-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="search"
            placeholder="Cari nomor negosiasi, listing, pembeli, penjual..."
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 38, paddingRight: keyword ? 36 : 12,
              height: 42, borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 14, color: 'var(--color-text)', outline: 'none',
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
            >✕</button>
          )}
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div style={{
        overflowX: 'auto', padding: '0 16px 14px',
        display: 'flex', gap: 8, scrollbarWidth: 'none',
      }}>
        {FILTER_CHIPS.map((chip) => {
          const active = statusFilter === chip.key;
          return (
            <button key={chip.key} type="button"
              onClick={() => setStatusFilter(chip.key)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 20,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                fontSize: 12.5, fontWeight: active ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap',
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
          {hasil.length} negosiasi ditemukan
        </span>
      </div>

      {/* ── Daftar ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {hasil.length > 0
          ? hasilVisible.map((n) => <NegosiasiCard key={n.id} item={n} />)
          : <EmptyState isFiltered={isFiltered} />}
      </div>
      {hasilHasMore && (
        <div ref={hasilSentinel} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
