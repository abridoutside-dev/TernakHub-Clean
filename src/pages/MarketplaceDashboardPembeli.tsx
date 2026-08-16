// ─── MPK-014 — Dashboard Pembeli Marketplace ─────────────────────────────────
// Pusat monitoring seluruh aktivitas pembelian Marketplace milik Workspace aktif.
// Hanya menampilkan data Marketplace — bukan Dashboard Workspace.

import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import { useMarketplace } from '../hooks/useMarketplace';
import { getDashboardPembeli, type ChatRoomDisplay, type WishlistDisplay } from '../data/marketplaceBuyerDashboardData';
import type { ListingItem } from '../data/marketplaceListingData';
import type { TransaksiItem } from '../data/marketplaceTransaksiData';
import type { NegosiasiItem } from '../data/marketplaceNegosiasiData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

function formatRelative(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH  < 24)  return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH  / 24);
  if (diffD  <  7)  return `${diffD} hari lalu`;
  return formatDate(iso);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const TRX_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#e65100' },
  'Menunggu Pembayaran':  { bg: '#fff3e0', color: '#bf360c' },
  Disetujui:              { bg: '#e8f5e9', color: '#2e7d32' },
  Diproses:               { bg: '#e3f2fd', color: '#1565c0' },
  'Siap Diserahkan':      { bg: '#f3e5f5', color: '#6a1b9a' },
  'Sedang Dikirim':       { bg: '#e0f7fa', color: '#006064' },
  Selesai:                { bg: '#e8f5e9', color: '#1b5e20' },
  Ditolak:                { bg: '#fce4ec', color: '#b71c1c' },
  Dibatalkan:             { bg: '#fce4ec', color: '#b71c1c' },
};

const NEG_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  'Menunggu Respon Penjual': { bg: '#fff8e1', color: '#e65100' },
  'Penawaran Balik':         { bg: '#e3f2fd', color: '#1565c0' },
  Disetujui:                 { bg: '#e8f5e9', color: '#2e7d32' },
  Ditolak:                   { bg: '#fce4ec', color: '#b71c1c' },
  'Dibatalkan Pembeli':      { bg: '#fce4ec', color: '#b71c1c' },
  Kadaluarsa:                { bg: '#f5f5f5', color: '#757575' },
};

function StatusPill({ label, map }: { label: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[label] ?? { bg: 'var(--color-bg)', color: 'var(--color-muted)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
      background: s.bg, color: s.color, flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Komponen Ringkasan Card ──────────────────────────────────────────────────

function RingkasanCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{
      flex: '1 1 calc(50% - 6px)', minWidth: 110,
      background: highlight ? 'var(--color-primary)' : 'var(--color-surface)',
      border: highlight ? 'none' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 900,
        color: highlight ? '#fff' : 'var(--color-primary)',
        lineHeight: 1.1, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: highlight ? 'rgba(255,255,255,0.85)' : 'var(--color-muted)',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickBtn({ icon, label, onClick, badge }: {
  icon: string; label: string; onClick: () => void; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '1 1 calc(20% - 8px)', minWidth: 56,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '10px 4px 8px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer', position: 'relative',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 8,
          minWidth: 14, height: 14, borderRadius: 7,
          background: 'var(--color-danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, color: '#fff', padding: '0 3px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>{title}</h3>
      {action && (
        <button type="button" onClick={onAction}
          style={{ background: 'none', border: 'none', padding: 0,
            fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── Listing Card (Rekomendasi & Wishlist) ────────────────────────────────────

function ListingMiniCard({ item, onClick }: { item: ListingItem; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden', cursor: 'pointer',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 68, background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
        {item.media.thumbnail.startsWith('http')
          ? <img src={item.media.thumbnail} alt={item.judul}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : item.media.thumbnail}
      </div>
      <div style={{ padding: '7px 8px 9px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.judul}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700 }}>
          {formatRupiah(item.harga)}
          <span style={{ fontWeight: 500, color: 'var(--color-muted)' }}>/{item.satuanHarga}</span>
        </div>
        <div style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.penjual}
        </div>
      </div>
    </div>
  );
}

// ─── AI Insight Row ───────────────────────────────────────────────────────────

function InsightRow({ icon, label, title, sub, last }: {
  icon: string; label: string; title: string; sub: string; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9.5, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      padding: '24px 16px', textAlign: 'center',
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{text}</div>
    </div>
  );
}

// ─── Transaksi Row ────────────────────────────────────────────────────────────

function TransaksiRow({ trx, last, onClick }: { trx: TransaksiItem; last: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 12px',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      cursor: 'pointer',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        {trx.thumbnailListing.startsWith('http')
          ? <img src={trx.thumbnailListing} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          : trx.thumbnailListing}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{trx.id}</span>
          <StatusPill label={trx.status} map={TRX_STATUS_COLOR} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trx.judulListing}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{trx.namaPenjual}</span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{formatDate(trx.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Negosiasi Row ────────────────────────────────────────────────────────────

function NegosiasiRow({ neg, last, onClick }: { neg: NegosiasiItem; last: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 12px',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      cursor: 'pointer',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        {neg.thumbnailListing.startsWith('http')
          ? <img src={neg.thumbnailListing} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          : neg.thumbnailListing}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{neg.id}</span>
          <StatusPill label={neg.status} map={NEG_STATUS_COLOR} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {neg.judulListing}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
            {formatRupiah(neg.hargaPenawaran)}
            <span style={{ fontWeight: 500, color: 'var(--color-muted)' }}>/{neg.satuanHarga}</span>
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{formatDate(neg.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Row ─────────────────────────────────────────────────────────────────

function ChatRow({ room, last, onClick }: { room: ChatRoomDisplay; last: boolean; onClick: () => void }) {
  const hasUnread = room.unreadPembeli > 0;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 12px',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
      background: hasUnread ? 'var(--color-surface)' : 'var(--color-bg)',
      cursor: 'pointer',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        💬
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: hasUnread ? 800 : 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.namaPenjual}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
            {formatRelative(room.lastMessageAt)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.judulListing}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {room.lastMessagePreview}
          </span>
          {hasUnread && (
            <span style={{
              marginLeft: 6, minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 4px', flexShrink: 0,
            }}>
              {room.unreadPembeli > 99 ? '99+' : room.unreadPembeli}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Dashboard Pembeli ────────────────────────────────────────────────

export default function MarketplaceDashboardPembeli() {
  useMarketplace(); // FLOW-003M27: hydrate buyer data from Supabase on mount
  const navigate = useNavigate();
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

  const data = getDashboardPembeli(ws.workspace_uuid);

  const { ringkasan, aiInsight, rekomendasi, transaksiTerbaru, negosiasiTerbaru, chatTerbaru, wishlist } = data;

  const totalUnreadChat = chatTerbaru.reduce((s, r) => s + r.unreadPembeli, 0);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 16px 14px',
        background: 'linear-gradient(135deg, #1565c0 0%, var(--color-primary) 100%)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {getWorkspaceIcon(ws)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Workspace</div>
            <div style={{ fontSize: 14, fontWeight: 800,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ws.workspace_name}
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.75 }}>{getWorkspaceTypeLabel(ws)}</div>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
            background: 'rgba(255,255,255,0.2)', color: '#fff', flexShrink: 0,
          }}>
            🛒 Pembeli
          </div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>🛒 Dashboard Pembeli</div>
        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>Aktivitas Pembelian</div>
      </div>

      {/* ── Ringkasan ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionHeader title="Ringkasan Pembelian" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <RingkasanCard label="Wishlist"           value={ringkasan.wishlist} />
          <RingkasanCard label="Negosiasi Aktif"    value={ringkasan.negosiasiAktif} highlight={ringkasan.negosiasiAktif > 0} />
          <RingkasanCard label="Transaksi Berjalan" value={ringkasan.transaksiAktif} highlight={ringkasan.transaksiAktif > 0} />
          <RingkasanCard label="Transaksi Selesai"  value={ringkasan.transaksiSelesai} />
        </div>
      </div>

      {/* ── AI Insight ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader title="✨ AI Insight untuk Anda" />
        <div style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 12px 0',
        }}>
          {/* Listing baru sesuai minat */}
          {aiInsight.listingBaruSesuaiMinat.length > 0 ? (
            <InsightRow
              icon="🆕"
              label="Listing Baru Sesuai Minat"
              title={aiInsight.listingBaruSesuaiMinat[0].judul}
              sub={`+${aiInsight.listingBaruSesuaiMinat.length} listing baru di kategori favorit Anda`}
            />
          ) : (
            <InsightRow icon="🆕" label="Listing Baru Sesuai Minat" title="Jelajahi Marketplace"
              sub="Mulai bertransaksi agar kami bisa merekomendasikan listing" />
          )}

          {/* Listing serupa */}
          {aiInsight.listingSerupa.length > 0 ? (
            <InsightRow
              icon="🔍"
              label="Listing Serupa Pembelian Anda"
              title={aiInsight.listingSerupa[0].judul}
              sub={`${aiInsight.listingSerupa.length} listing di kategori yang sama`}
            />
          ) : (
            <InsightRow icon="🔍" label="Listing Serupa" title="Belum ada riwayat pembelian"
              sub="Beli sesuatu agar kami dapat merekomendasikan listing serupa" />
          )}

          {/* Penjual sering bertransaksi */}
          {aiInsight.penjualSeringBertransaksi.length > 0 ? (
            <InsightRow
              icon="🤝"
              label="Penjual yang Sering Anda Hubungi"
              title={aiInsight.penjualSeringBertransaksi[0].nama}
              sub={aiInsight.penjualSeringBertransaksi.map(p => `${p.nama} (${p.count}×)`).join(' · ')}
            />
          ) : (
            <InsightRow icon="🤝" label="Penjual yang Sering Anda Hubungi" title="—"
              sub="Belum ada riwayat transaksi" />
          )}

          {/* Wishlist insight */}
          {wishlist.length > 0 ? (
            <InsightRow
              icon="❤️"
              label="Wishlist Anda"
              title={`${wishlist.length} listing tersimpan`}
              sub={wishlist.slice(0, 2).map(w => w.listing.judul).join(' · ')}
              last
            />
          ) : (
            <InsightRow icon="❤️" label="Wishlist" title="Wishlist masih kosong"
              sub="Simpan listing favorit untuk dibeli nanti" last />
          )}
        </div>
      </div>

      {/* ── Quick Action ────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader title="Quick Action" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto' }}>
          <QuickBtn icon="🏪" label="Jelajahi"    onClick={() => navigate('/marketplace')} />
          <QuickBtn icon="❤️" label="Wishlist"    onClick={() => navigate('/marketplace/wishlist')} badge={ringkasan.wishlist} />
          <QuickBtn icon="🧾" label="Transaksi"   onClick={() => navigate('/marketplace/transaksi')} badge={ringkasan.transaksiAktif} />
          <QuickBtn icon="🤝" label="Negosiasi"   onClick={() => navigate('/marketplace/negosiasi')} badge={ringkasan.negosiasiAktif} />
          <QuickBtn icon="💬" label="Chat"         onClick={() => navigate('/marketplace/chat')} badge={totalUnreadChat} />
        </div>
      </div>

      {/* ── Rekomendasi Untuk Anda ─────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title="Rekomendasi Untuk Anda"
          action="Jelajahi Semua"
          onAction={() => navigate('/marketplace')}
        />
        {rekomendasi.length === 0 ? (
          <EmptyState icon="🏪" text="Belum ada rekomendasi. Jelajahi Marketplace!" />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 8,
          }}>
            {rekomendasi.map(item => (
              <ListingMiniCard
                key={item.uuid}
                item={item}
                onClick={() => navigate(`/marketplace/${item.kategoriSlug}/${item.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Wishlist ────────────────────────────────────────────────────────── */}
      {wishlist.length > 0 && (
        <div style={{ padding: '18px 16px 0' }}>
          <SectionHeader title={`❤️ Wishlist (${wishlist.length})`} action="Jelajahi" onAction={() => navigate('/marketplace/wishlist')} />
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {wishlist.map((w: WishlistDisplay) => (
              <div key={w.id} style={{ flexShrink: 0, width: 130 }}>
                <ListingMiniCard
                  item={w.listing}
                  onClick={() => navigate(`/marketplace/${w.listing.kategoriSlug}/${w.listing.slug}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transaksi Terbaru ──────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title={`Transaksi Terbaru (${transaksiTerbaru.length})`}
          action="Lihat Semua"
          onAction={() => navigate('/marketplace/transaksi')}
        />
        {transaksiTerbaru.length === 0 ? (
          <EmptyState icon="🧾" text="Belum ada transaksi" />
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {transaksiTerbaru.map((trx, i) => (
              <TransaksiRow
                key={trx.id}
                trx={trx}
                last={i === transaksiTerbaru.length - 1}
                onClick={() => navigate(`/marketplace/transaksi/${trx.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Negosiasi Terbaru ──────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title={`Negosiasi Terbaru (${negosiasiTerbaru.length})`}
          action="Lihat Semua"
          onAction={() => navigate('/marketplace/negosiasi')}
        />
        {negosiasiTerbaru.length === 0 ? (
          <EmptyState icon="🤝" text="Belum ada negosiasi" />
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {negosiasiTerbaru.map((neg, i) => (
              <NegosiasiRow
                key={neg.id}
                neg={neg}
                last={i === negosiasiTerbaru.length - 1}
                onClick={() => navigate(`/marketplace/negosiasi/${neg.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Chat Terbaru ───────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title={`Chat Terbaru (${chatTerbaru.length})`}
          action="Lihat Semua"
          onAction={() => navigate('/marketplace/chat')}
        />
        {chatTerbaru.length === 0 ? (
          <EmptyState icon="💬" text="Belum ada percakapan" />
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {chatTerbaru.map((room, i) => (
              <ChatRow
                key={room.id}
                room={room}
                last={i === chatTerbaru.length - 1}
                onClick={() => navigate(`/marketplace/chat/${room.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
