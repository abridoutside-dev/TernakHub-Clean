// ─── PK-010: Dashboard & AI Insight — Produk Komersial ───────────────────────
// Pusat informasi & analisis Produk Komersial: Ringkasan, AI Insight, Produk
// Terbaru, Brand Populer, Produk Terakhir Diperbarui, dan Peringatan Data.
//
// Halaman ini MURNI presentasi (read-only) — tidak ada transaksi, tidak
// mengubah Formula/Stok/Master Pakan/modul lain, dan tidak mengubah arsitektur
// aplikasi. Seluruh data berasal dari Living Database via
// produkKomersialDashboardData.ts (tidak ada hardcode).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProdukKomersialDashboardStats,
  getProdukTerbaru,
  getProdukTerakhirDiperbarui,
  getBrandPopuler,
  getPeringatanData,
  computeDashboardInsights,
  type ProdukKomersialDashboardItem,
} from '../data/produkKomersialDashboardData';

const ACCENT = '#1b7a43';

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function AiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeDashboardInsights();
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: `1.5px solid ${ACCENT}`,
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: ACCENT, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Produk Komersial</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.5 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button type="button" onClick={() => setExpanded(v => !v)} style={{
          width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
          fontSize: 12, fontWeight: 700, color: ACCENT, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
          <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  );
}

// ─── Ringkasan Statistik ──────────────────────────────────────────────────────

function RingkasanStatistik() {
  const stats = getProdukKomersialDashboardStats();
  const cards = [
    { label: 'Total Brand',                   value: stats.totalBrand,                 icon: '™️', bg: '#f3e5f5', color: '#6a1b9a' },
    { label: 'Total Seri Produk',             value: stats.totalSeriProduk,             icon: '🧾', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Total Produk',                  value: stats.totalProduk,                 icon: '📦', bg: '#e8f5ee', color: ACCENT },
    { label: 'Total Produsen',                value: stats.totalProdusen,               icon: '🏭', bg: '#fff8e1', color: '#7b5e2a' },
    { label: 'Total Produk Aktif',            value: stats.totalProdukAktif,            icon: '✅', bg: '#e8f5e9', color: '#2e7d32' },
    { label: 'Total Produk Tidak Diproduksi', value: stats.totalProdukTidakDiproduksi,  icon: '⏸️', bg: '#fff3e0', color: '#e65100' },
  ];

  return (
    <div>
      <SectionTitle icon="📊" title="Ringkasan Statistik" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
            borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{card.icon}</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div style={{
      padding: '18px 14px', textAlign: 'center', fontSize: 12, color: 'var(--color-muted)',
      background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
    }}>
      {text}
    </div>
  );
}

function StatusChip({ status }: { status: ProdukKomersialDashboardItem['statusProduksi'] }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Aktif': { bg: '#e8f5e9', color: '#2e7d32' },
    'Tidak Diproduksi': { bg: '#fff3e0', color: '#e65100' },
    'Arsip': { bg: '#eceff1', color: '#546e7a' },
  };
  const s = map[status] ?? map['Arsip'];
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 7px', flexShrink: 0 }}>
      {status}
    </span>
  );
}

function ProdukRow({ item, subtitle, onClick }: { item: ProdukKomersialDashboardItem; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '11px 12px', cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.namaProduk}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {item.brandNama} • {subtitle}
        </div>
      </div>
      <StatusChip status={item.statusProduksi} />
    </button>
  );
}

// Dashboard bersifat read-only murni; baris produk mengarahkan ke halaman
// kategori terkait (bukan langsung ke detail) karena rute detail memerlukan
// brandSlug/seriSlug — bukan brandId/uuid (lihat konsentratMerekData.ts).
function navigateToProduk(navigate: ReturnType<typeof useNavigate>, item: ProdukKomersialDashboardItem) {
  if (item.kategoriSlug === 'konsentrat') {
    navigate('/stok-pakan/komersial/konsentrat');
  } else {
    navigate('/stok-pakan/komersial');
  }
}

// ─── Produk Terbaru ───────────────────────────────────────────────────────────

function ProdukTerbaru() {
  const navigate = useNavigate();
  const produk = getProdukTerbaru(5);
  return (
    <div>
      <SectionTitle icon="🆕" title="Produk Terbaru" />
      {produk.length === 0 ? (
        <EmptyRow text="Belum ada produk yang tercatat." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {produk.map(item => (
            <ProdukRow key={item.uuid} item={item} subtitle={item.kategoriNama} onClick={() => navigateToProduk(navigate, item)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Brand Populer ────────────────────────────────────────────────────────────

function BrandPopuler() {
  const brands = getBrandPopuler(5);
  const max = brands[0]?.jumlahProduk ?? 1;
  return (
    <div>
      <SectionTitle icon="🏆" title="Brand Populer" />
      {brands.length === 0 ? (
        <EmptyRow text="Belum ada brand yang tercatat." />
      ) : (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {brands.map((b, i) => (
            <div key={b.brandId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? '#fff3e0' : '#eceff1', color: i === 0 ? '#e65100' : '#546e7a',
                fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4,
                }}>
                  {b.brandNama}
                </div>
                <div style={{ height: 6, borderRadius: 4, background: '#eceff1', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(6, (b.jumlahProduk / max) * 100)}%`, background: ACCENT, borderRadius: 4 }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>{b.jumlahProduk}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Produk Terakhir Diperbarui ───────────────────────────────────────────────

function ProdukTerakhirDiperbarui() {
  const navigate = useNavigate();
  const produk = getProdukTerakhirDiperbarui(5);
  return (
    <div>
      <SectionTitle icon="🕒" title="Produk Terakhir Diperbarui" />
      {produk.length === 0 ? (
        <EmptyRow text="Belum ada produk yang tercatat." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {produk.map(item => (
            <ProdukRow key={item.uuid} item={item} subtitle={item.updatedAt} onClick={() => navigateToProduk(navigate, item)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Peringatan Data ──────────────────────────────────────────────────────────

function PeringatanData() {
  const [expanded, setExpanded] = useState(false);
  const peringatan = getPeringatanData();
  const visible = expanded ? peringatan : peringatan.slice(0, 5);

  return (
    <div>
      <SectionTitle icon="⚠️" title="Peringatan Data" />
      {peringatan.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#e8f5e9', border: '1.5px solid #2e7d32', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', fontSize: 12, color: '#2e7d32', fontWeight: 600,
        }}>
          <span>✅</span>
          <span>Seluruh produk memiliki data lengkap.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(p => (
            <div key={p.uuid} style={{
              background: '#fff8e1', border: '1.5px solid #f9a825', borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7b5e2a', marginBottom: 4 }}>
                {p.namaProduk} <span style={{ fontWeight: 500, opacity: 0.8 }}>— {p.brandNama}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.jenis.map(j => (
                  <span key={j} style={{
                    fontSize: 10, fontWeight: 700, color: '#e65100', background: '#fff3e0',
                    borderRadius: 20, padding: '2px 8px',
                  }}>
                    {j} belum lengkap
                  </span>
                ))}
              </div>
            </div>
          ))}
          {peringatan.length > 5 && (
            <button type="button" onClick={() => setExpanded(v => !v)} style={{
              border: 'none', background: 'none', padding: '6px 0', fontSize: 12, fontWeight: 700,
              color: ACCENT, cursor: 'pointer', textAlign: 'center',
            }}>
              {expanded ? 'Sembunyikan' : `Lihat semua (${peringatan.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1b7a43, #14532d)', borderRadius: 'var(--radius-md)',
      padding: '18px 16px', color: '#fff', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        Produk Komersial
      </div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Dashboard & AI Insight</div>
      <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
        Pusat informasi dan analisis Living Database Produk Komersial — ringkasan, insight, dan peringatan data.
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProdukKomersialDashboard() {
  return (
    <div style={{ padding: '14px 16px 80px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DashboardHeader />
      <AiInsightCard />
      <RingkasanStatistik />
      <ProdukTerbaru />
      <BrandPopuler />
      <ProdukTerakhirDiperbarui />
      <PeringatanData />
    </div>
  );
}
