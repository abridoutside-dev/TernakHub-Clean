// ─── MPK-013 — Dashboard Penjual Marketplace ─────────────────────────────────
// Pusat monitoring seluruh aktivitas Marketplace milik Workspace aktif.
// Hanya menampilkan data Marketplace — bukan Dashboard Workspace.

import { useNavigate } from 'react-router-dom';
import { getActiveWorkspace } from '../components/TopAppBar';
import { useMarketplace } from '../hooks/useMarketplace';
import { getVerifikasiBadge } from '../data/marketplaceWorkspaceVerifikasiData';
import { getDashboardPenjual, type GrafikHarian } from '../data/marketplaceDashboardData';
import type { ListingItem } from '../data/marketplaceListingData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const LISTING_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  Aktif:      { bg: '#e8f5e9', color: '#2e7d32' },
  Draft:      { bg: '#f5f5f5', color: '#757575' },
  Ditahan:    { bg: '#fff8e1', color: '#f57f17' },
  Terjual:    { bg: '#e3f2fd', color: '#1565c0' },
  Ditutup:    { bg: '#fce4ec', color: '#c62828' },
  Diarsipkan: { bg: '#ede7f6', color: '#4527a0' },
};

const TRANSAKSI_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
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
  const style = map[label] ?? { bg: 'var(--color-bg)', color: 'var(--color-muted)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
      background: style.bg, color: style.color, flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Komponen Ringkasan Card ──────────────────────────────────────────────────

function RingkasanCard({
  label, value, sub, highlight,
}: {
  label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div style={{
      flex: '1 1 calc(33% - 6px)', minWidth: 90,
      background: highlight ? 'var(--color-primary)' : 'var(--color-surface)',
      border: highlight ? 'none' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 10px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: 21, fontWeight: 800,
        color: highlight ? '#fff' : 'var(--color-primary)',
        lineHeight: 1.1, marginBottom: 3,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 600,
        color: highlight ? 'rgba(255,255,255,0.85)' : 'var(--color-muted)',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 9, color: highlight ? 'rgba(255,255,255,0.65)' : 'var(--color-muted)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Komponen Statistik Card ──────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      flex: '1 1 calc(50% - 6px)', minWidth: 130,
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Grafik Batang ───────────────────────────────────────────────────

function GrafikTransaksi({ data }: { data: GrafikHarian[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const BAR_MAX_H = 56;
  return (
    <div style={{ marginTop: 12, padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_MAX_H + 28 }}>
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.count / maxCount) * BAR_MAX_H));
          const isToday = i === data.length - 1;
          return (
            <div key={d.tanggal} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {d.count > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {d.count}
                </span>
              )}
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div style={{
                  width: '100%',
                  height: h,
                  borderRadius: '4px 4px 0 0',
                  background: isToday
                    ? 'var(--color-primary)'
                    : d.count > 0 ? 'var(--color-primary-light)' : 'var(--color-border)',
                  border: isToday ? 'none' : '1px solid var(--color-border)',
                  transition: 'height 0.3s ease',
                }} />
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--color-primary)' : 'var(--color-muted)',
              }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4, textAlign: 'center' }}>
        Jumlah transaksi masuk per hari (7 hari terakhir)
      </div>
    </div>
  );
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function InsightRow({ icon, label, title, sub }: { icon: string; label: string; title: string; sub: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--color-border)',
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
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Listing Card (Terbaru) ───────────────────────────────────────────────────

function ListingCard({ item, onClick }: { item: ListingItem; onClick: () => void }) {
  const sc = LISTING_STATUS_COLOR[item.status] ?? { bg: '#f5f5f5', color: '#757575' };
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 72, background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>
        {item.media.thumbnail.startsWith('http') ? (
          <img src={item.media.thumbnail} alt={item.judul}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : item.media.thumbnail}
      </div>
      {/* Info */}
      <div style={{ padding: '8px 8px 10px', flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.judul}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>
          {formatRupiah(item.harga)}<span style={{ fontWeight: 500, color: 'var(--color-muted)' }}>/{item.satuanHarga}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9.5, color: 'var(--color-muted)' }}>Qty {item.qtyDijual}</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: sc.bg, color: sc.color }}>
            {item.status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
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
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
        {title}
      </h3>
      {action && (
        <button type="button" onClick={onAction}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)',
            cursor: 'pointer',
          }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── Halaman Dashboard Penjual ────────────────────────────────────────────────

export default function MarketplaceDashboard() {
  useMarketplace(); // FLOW-003M27: hydrate listings/transaksi from Supabase on mount
  const navigate = useNavigate();
  const ws = getActiveWorkspace();
  const badge = getVerifikasiBadge(ws.id);
  const data = getDashboardPenjual(ws.id);

  const { ringkasan, statistik, aiInsight, listingTerbaru, transaksiTerbaru, negosiasiTerbaru, grafikTransaksi } = data;

  const hasData = ringkasan.totalListing > 0 || ringkasan.totalTransaksi > 0 || ringkasan.totalNegosiasi > 0;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 16px 14px',
        background: 'var(--color-primary)',
        color: '#fff',
      }}>
        {/* Workspace */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {ws.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, opacity: 0.8, lineHeight: 1.2 }}>Workspace</div>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ws.name}
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.75, lineHeight: 1.2 }}>{ws.type}</div>
          </div>
          {/* Badge Verifikasi */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            flexShrink: 0,
          }}>
            {badge.icon} {badge.label}
          </span>
        </div>

        {/* Judul */}
        <div>
          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>
            📊 Dashboard Penjual
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
            Marketplace Activity
          </div>
          {!hasData && (
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
              Belum ada aktivitas Marketplace untuk workspace ini
            </div>
          )}
        </div>
      </div>

      {/* ── Ringkasan ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionHeader title="Ringkasan Listing & Aktivitas" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <RingkasanCard label="Total Listing"  value={ringkasan.totalListing} highlight />
          <RingkasanCard label="Listing Aktif"  value={ringkasan.listingAktif} />
          <RingkasanCard label="Draft"           value={ringkasan.draft} />
          <RingkasanCard label="Terjual"         value={ringkasan.terjual} />
          <RingkasanCard label="Total Negosiasi" value={ringkasan.totalNegosiasi} />
          <RingkasanCard label="Total Transaksi" value={ringkasan.totalTransaksi} />
        </div>
      </div>

      {/* ── AI Insight ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader title="✨ AI Insight Marketplace" />
        <div style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 12px 0',
        }}>
          {aiInsight.listingTerbanyakDilihat ? (
            <InsightRow
              icon="👁️"
              label="Paling Banyak Dilihat"
              title={aiInsight.listingTerbanyakDilihat.listing.judul}
              sub={`${aiInsight.listingTerbanyakDilihat.views} kali dilihat`}
            />
          ) : (
            <InsightRow icon="👁️" label="Paling Banyak Dilihat" title="—" sub="Belum ada data" />
          )}

          {aiInsight.listingTerbanyakDinegosiasi ? (
            <InsightRow
              icon="🤝"
              label="Paling Banyak Dinegosiasi"
              title={aiInsight.listingTerbanyakDinegosiasi.listing.judul}
              sub={`${aiInsight.listingTerbanyakDinegosiasi.count} negosiasi`}
            />
          ) : (
            <InsightRow icon="🤝" label="Paling Banyak Dinegosiasi" title="—" sub="Belum ada negosiasi" />
          )}

          {aiInsight.listingTerbanyakTerjual ? (
            <InsightRow
              icon="🎉"
              label="Paling Banyak Terjual"
              title={aiInsight.listingTerbanyakTerjual.listing.judul}
              sub={`${aiInsight.listingTerbanyakTerjual.qty} ${aiInsight.listingTerbanyakTerjual.listing.satuanHarga} terjual`}
            />
          ) : (
            <InsightRow icon="🎉" label="Paling Banyak Terjual" title="—" sub="Belum ada transaksi selesai" />
          )}

          {aiInsight.listingPerluDiperbarui.length > 0 ? (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#fff8e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>⚠️</div>
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--color-muted)', fontWeight: 600 }}>Perlu Diperbarui</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#e65100' }}>
                    {aiInsight.listingPerluDiperbarui.length} listing belum diperbarui &gt;30 hari
                  </div>
                </div>
              </div>
              {aiInsight.listingPerluDiperbarui.map(l => (
                <div key={l.uuid} style={{
                  fontSize: 11, color: 'var(--color-muted)', padding: '3px 0 3px 46px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  • {l.judul} <span style={{ color: 'var(--color-border)' }}>({formatDate(l.updatedAt)})</span>
                </div>
              ))}
            </div>
          ) : (
            <InsightRow icon="✅" label="Kondisi Listing" title="Semua listing up-to-date" sub="Tidak ada yang perlu diperbarui" />
          )}
        </div>
      </div>

      {/* ── Quick Action ────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader title="Quick Action" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto' }}>
          <QuickBtn icon="➕" label="Buat Listing"  onClick={() => navigate('/marketplace/buat')} />
          <QuickBtn icon="📋" label="Listing Saya"  onClick={() => navigate('/marketplace/listing-saya')} />
          <QuickBtn icon="🧾" label="Transaksi"     onClick={() => navigate('/marketplace/transaksi')} />
          <QuickBtn icon="🤝" label="Negosiasi"     onClick={() => navigate('/marketplace/negosiasi')} />
          <QuickBtn icon="💬" label="Chat"           onClick={() => navigate('/marketplace/chat')} />
        </div>
      </div>

      {/* ── Statistik ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader title="Statistik" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatCard icon="👁️" label="Total Dilihat"   value={statistik.totalDilihat.toLocaleString('id-ID')} />
          <StatCard icon="🤝" label="Total Penawaran"  value={statistik.totalPenawaran.toString()} />
          <StatCard icon="🧾" label="Total Transaksi"  value={statistik.totalTransaksi.toString()} />
          <StatCard icon="💰" label="Total Penjualan"  value={formatRupiah(statistik.totalPenjualan)} />
        </div>

        {/* Grafik Transaksi */}
        <div style={{
          marginTop: 12,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 12px 10px',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 0 }}>
            Grafik Transaksi 7 Hari
          </div>
          <GrafikTransaksi data={grafikTransaksi} />
        </div>
      </div>

      {/* ── Listing Terbaru ─────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title={`Listing Terbaru (${listingTerbaru.length})`}
          action="Lihat Semua"
          onAction={() => navigate('/marketplace/listing-saya')}
        />
        {listingTerbaru.length === 0 ? (
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              Belum ada listing
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 8,
          }}>
            {listingTerbaru.map(item => (
              <ListingCard
                key={item.uuid}
                item={item}
                onClick={() => navigate(`/marketplace/${item.kategoriSlug}/${item.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Transaksi Terbaru ──────────────────────────────────────────────── */}
      <div style={{ padding: '18px 16px 0' }}>
        <SectionHeader
          title={`Transaksi Terbaru (${transaksiTerbaru.length})`}
          action="Lihat Semua"
          onAction={() => navigate('/marketplace/transaksi')}
        />
        {transaksiTerbaru.length === 0 ? (
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              Belum ada transaksi
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {transaksiTerbaru.map((trx, i) => (
              <div
                key={trx.id}
                onClick={() => navigate(`/marketplace/transaksi/${trx.id}`)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 12px',
                  borderBottom: i < transaksiTerbaru.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {trx.thumbnailListing.startsWith('http')
                    ? <img src={trx.thumbnailListing} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    : trx.thumbnailListing}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{trx.id}</div>
                    <StatusPill label={trx.status} map={TRANSAKSI_STATUS_COLOR} />
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trx.judulListing}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                      {trx.namaPembeli}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                      {formatDate(trx.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
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
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🤝</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
              Belum ada negosiasi
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {negosiasiTerbaru.map((neg, i) => (
              <div
                key={neg.id}
                onClick={() => navigate(`/marketplace/negosiasi/${neg.id}`)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 12px',
                  borderBottom: i < negosiasiTerbaru.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {neg.thumbnailListing.startsWith('http')
                    ? <img src={neg.thumbnailListing} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    : neg.thumbnailListing}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{neg.id}</div>
                    <StatusPill label={neg.status} map={NEG_STATUS_COLOR} />
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {neg.judulListing}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatRupiah(neg.hargaPenawaran)}
                      <span style={{ fontWeight: 500, color: 'var(--color-muted)' }}>/{neg.satuanHarga}</span>
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                      {formatDate(neg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
