// ─── Marketplace — AI Insight Full (MPK-020) ──────────────────────────────────
// Pusat analisis Marketplace berbasis data LIVE.
// AI hanya memberikan Insight — tidak mengambil keputusan, tidak mengubah data.
// Layout: Header → Ringkasan → Insight Penjualan → Insight Pembelian →
//         Insight Listing → Insight Workspace → Rekomendasi AI

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  computeFullAiInsight,
  type ListingInsightItem,
  type KategoriInsightItem,
  type WorkspaceInsightItem,
  type RekomendasiItem,
} from '../data/marketplaceAiInsightMPK020Data';
import type { StatusVerifikasiWorkspace } from '../data/marketplaceWorkspaceVerifikasiData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VERIF_META: Record<StatusVerifikasiWorkspace, { icon: string; color: string; bg: string }> = {
  'Terverifikasi':      { icon: '✅', color: '#1b7a43', bg: '#e8f5ee' },
  'Dalam Proses':       { icon: '⏳', color: '#7b5e2a', bg: '#fff8e1' },
  'Belum Diverifikasi': { icon: '⚪', color: '#616161', bg: '#f5f5f5' },
  'Ditangguhkan':       { icon: '🚫', color: '#c62828', bg: '#ffebee' },
};

const PRIORITAS_META: Record<RekomendasiItem['prioritas'], { color: string; bg: string; label: string }> = {
  tinggi:  { color: '#c62828', bg: '#ffebee', label: 'Prioritas Tinggi' },
  sedang:  { color: '#7a6b1c', bg: '#fdf3d0', label: 'Prioritas Sedang' },
  rendah:  { color: '#1b7a43', bg: '#e8f5ee', label: 'Prioritas Rendah' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, children, defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
        <span style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label, value, icon, color, bg,
}: { label: string; value: number; icon: string; color: string; bg: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 82,
      background: bg, border: `1.5px solid ${color}33`,
      borderRadius: 'var(--radius-md)',
      padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color, opacity: 0.85, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '16px 0',
      fontSize: 12, color: 'var(--color-muted)',
    }}>
      {label}
    </div>
  );
}

function ListingInsightRow({
  item, rank,
}: { item: ListingInsightItem; rank: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Rank badge */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: rank === 1 ? '#fdf3d0' : 'var(--color-bg)',
        border: `1px solid ${rank === 1 ? '#e0c040' : 'var(--color-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10.5, fontWeight: 800, color: rank === 1 ? '#7a6b1c' : 'var(--color-muted)',
        flexShrink: 0,
      }}>
        {rank}
      </div>
      {/* Kategori icon */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.kategoriIcon}</span>
      {/* Judul + workspace */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.judul}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>
          {item.workspaceNama}
        </div>
      </div>
      {/* Nilai */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>
          {item.nilai.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.satuan}</div>
      </div>
    </div>
  );
}

function KategoriInsightRow({
  item, rank,
}: { item: KategoriInsightItem; rank: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: rank === 1 ? '#fdf3d0' : 'var(--color-bg)',
        border: `1px solid ${rank === 1 ? '#e0c040' : 'var(--color-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10.5, fontWeight: 800, color: rank === 1 ? '#7a6b1c' : 'var(--color-muted)',
        flexShrink: 0,
      }}>
        {rank}
      </div>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
          {item.nama}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>
          {item.jumlah}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>listing/transaksi</div>
      </div>
    </div>
  );
}

function WorkspaceInsightRow({ item }: { item: WorkspaceInsightItem }) {
  const verif = VERIF_META[item.statusVerifikasi];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'var(--color-bg)',
        border: '1.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        🏡
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.workspaceNama}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 600,
          color: verif.color, background: verif.bg,
          borderRadius: 20, padding: '1px 6px', marginTop: 2,
        }}>
          {verif.icon} {item.statusVerifikasi}
        </span>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>
          {item.jumlah}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.satuan}</div>
      </div>
    </div>
  );
}

function RekomendasiCard({ item }: { item: RekomendasiItem }) {
  const meta = PRIORITAS_META[item.prioritas];
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderLeft: `4px solid ${meta.color}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{item.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
            {item.judul}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: meta.color, background: meta.bg,
          borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
        }}>
          {meta.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
        {item.deskripsi}
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function SubLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 6, marginTop: 12,
    }}>
      {label}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceAiInsight() {
  const navigate = useNavigate();

  // Compute live insight setiap render — no cache, no stale data
  const insight = computeFullAiInsight();
  const { ringkasan, insightPenjualan, insightPembelian, insightListing, insightWorkspace, rekomendasi } = insight;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3b6e 0%, #1a6eb5 100%)',
        borderRadius: 'var(--radius-md)', padding: '16px 18px',
        marginBottom: 14, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🤖</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>AI Insight Marketplace</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Analisis otomatis dari data Marketplace live
            </div>
          </div>
        </div>
        {/* AI disclaimer */}
        <div style={{
          marginTop: 12, background: 'rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 11, opacity: 0.9, lineHeight: 1.5,
        }}>
          ℹ️ AI hanya memberikan insight informatif — tidak mengambil keputusan dan tidak mengubah data.
        </div>
      </div>

      {/* ── Ringkasan Marketplace ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 14, marginBottom: 12,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
          📊 Ringkasan Marketplace
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatBox label="Listing Aktif"  value={ringkasan.totalListingAktif}   icon="🏷️" color="#1b7a43" bg="#e8f5ee" />
          <StatBox label="Terjual"        value={ringkasan.totalListingTerjual}  icon="✅" color="#0277bd" bg="#e1f5fe" />
          <StatBox label="Transaksi"      value={ringkasan.totalTransaksi}       icon="🧾" color="#5c3d8f" bg="#f3eaff" />
          <StatBox label="Negosiasi"      value={ringkasan.totalNegosiasi}       icon="🤝" color="#7b3f00" bg="#fff3e0" />
          <StatBox label="Workspace"      value={ringkasan.totalWorkspaceAktif}  icon="🏡" color="#1b7a43" bg="#e8f5ee" />
          <StatBox label="Chat Aktif"     value={ringkasan.totalChatAktif}       icon="💬" color="#616161" bg="#f5f5f5" />
        </div>
      </div>

      {/* ── Insight Penjualan ─────────────────────────────────────────────────── */}
      <SectionCard title="📈 Insight Penjualan">
        <SubLabel label="Listing Paling Banyak Dilihat" />
        {insightPenjualan.listingPalingBanyakDilihat.length === 0
          ? <EmptyState label="Belum ada data listing." />
          : insightPenjualan.listingPalingBanyakDilihat.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing Paling Banyak Dinegosiasi" />
        {insightPenjualan.listingPalingBanyakDinegosiasi.length === 0
          ? <EmptyState label="Belum ada negosiasi tercatat." />
          : insightPenjualan.listingPalingBanyakDinegosiasi.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing Paling Banyak Terjual" />
        {insightPenjualan.listingPalingBanyakTerjual.length === 0
          ? <EmptyState label="Belum ada transaksi selesai." />
          : insightPenjualan.listingPalingBanyakTerjual.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Kategori Terlaris" />
        {insightPenjualan.kategoriTerlaris.length === 0
          ? <EmptyState label="Belum ada transaksi selesai." />
          : insightPenjualan.kategoriTerlaris.map((item, i) => (
            <KategoriInsightRow key={item.slug} item={item} rank={i + 1} />
          ))}
      </SectionCard>

      {/* ── Insight Pembelian ─────────────────────────────────────────────────── */}
      <SectionCard title="🛒 Insight Pembelian">
        <SubLabel label="Kategori Paling Banyak Dicari" />
        {insightPembelian.kategoriPalingBanyakDicari.length === 0
          ? <EmptyState label="Belum ada data negosiasi." />
          : insightPembelian.kategoriPalingBanyakDicari.map((item, i) => (
            <KategoriInsightRow key={item.slug} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing Paling Banyak Disimpan ke Wishlist" />
        {insightPembelian.listingPalingBanyakDisimpan.length === 0
          ? <EmptyState label="Belum ada listing disimpan ke wishlist." />
          : insightPembelian.listingPalingBanyakDisimpan.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing Paling Banyak Dibuka" />
        {insightPembelian.listingPalingBanyakDibuka.length === 0
          ? <EmptyState label="Belum ada data listing aktif." />
          : insightPembelian.listingPalingBanyakDibuka.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}
      </SectionCard>

      {/* ── Insight Listing ───────────────────────────────────────────────────── */}
      <SectionCard title="🏷️ Insight Listing">
        <SubLabel label="Listing Hampir Kadaluarsa (>30 hari tidak diperbarui)" />
        {insightListing.listingHampirKadaluarsa.length === 0
          ? <EmptyState label="Semua listing masih baru diperbarui." />
          : insightListing.listingHampirKadaluarsa.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing Tanpa Aktivitas" />
        {insightListing.listingTanpaAktivitas.length === 0
          ? <EmptyState label="Semua listing sudah memiliki aktivitas." />
          : insightListing.listingTanpaAktivitas.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing yang Perlu Diperbarui" />
        {insightListing.listingPerluDiperbarui.length === 0
          ? <EmptyState label="Tidak ada listing yang perlu diperbarui." />
          : insightListing.listingPerluDiperbarui.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}

        <SubLabel label="Listing dengan Performa Terbaik" />
        {insightListing.listingPerformaTerbaik.length === 0
          ? <EmptyState label="Belum ada data performa." />
          : insightListing.listingPerformaTerbaik.map((item, i) => (
            <ListingInsightRow key={item.uuid} item={item} rank={i + 1} />
          ))}
      </SectionCard>

      {/* ── Insight Workspace ─────────────────────────────────────────────────── */}
      <SectionCard title="🏡 Insight Workspace">
        <SubLabel label="Workspace Paling Aktif" />
        {insightWorkspace.workspacePalingAktif.length === 0
          ? <EmptyState label="Belum ada data workspace." />
          : insightWorkspace.workspacePalingAktif.map((item) => (
            <WorkspaceInsightRow key={item.workspaceId} item={item} />
          ))}

        <SubLabel label="Workspace Baru" />
        {insightWorkspace.workspaceBaru.length === 0
          ? <EmptyState label="Belum ada data workspace baru." />
          : insightWorkspace.workspaceBaru.map((item) => (
            <WorkspaceInsightRow key={item.workspaceId} item={item} />
          ))}

        <SubLabel label="Workspace Terverifikasi" />
        {insightWorkspace.workspaceTerverifikasi.length === 0
          ? <EmptyState label="Belum ada workspace yang terverifikasi." />
          : insightWorkspace.workspaceTerverifikasi.map((item) => (
            <WorkspaceInsightRow key={item.workspaceId} item={item} />
          ))}

        <div style={{
          marginTop: 12, background: '#f3eaff', border: '1px solid #c9a8f0',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 11.5, color: '#5c3d8f', lineHeight: 1.5,
        }}>
          ℹ️ AI menampilkan data informasi workspace — tidak memberikan peringkat berdasarkan popularitas.
        </div>
      </SectionCard>

      {/* ── Rekomendasi AI ────────────────────────────────────────────────────── */}
      <SectionCard title="💡 Rekomendasi AI">
        <div style={{
          background: '#e8f5ee', border: '1px solid #a5d6b7',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
          fontSize: 11.5, color: '#1b7a43', lineHeight: 1.5,
        }}>
          ✅ Rekomendasi bersifat informatif — keputusan tetap di tangan Anda.
        </div>

        {rekomendasi.map((item) => (
          <RekomendasiCard key={item.id} item={item} />
        ))}
      </SectionCard>

      {/* ── Sumber Data ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          📡 Sumber Data Live
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            'Listing', 'Transaksi', 'Negosiasi',
            'Wishlist', 'Chat', 'Status Verifikasi',
          ].map((s) => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 600,
              background: '#e1f5fe', color: '#0277bd',
              borderRadius: 20, padding: '3px 10px',
            }}>
              {s}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8, lineHeight: 1.5 }}>
          Seluruh angka dihitung dari data live. Tidak ada hardcode. Tidak ada dummy data.
        </div>
      </div>

      {/* ── Tombol Kembali ───────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/marketplace')}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ← Kembali ke Marketplace
      </button>
    </div>
  );
}
