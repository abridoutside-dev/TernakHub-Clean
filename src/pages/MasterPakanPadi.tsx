import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPadiList, computePadiRingkasan,
  KATEGORI_ITEM_STYLE, KATEGORI_ITEM_ALL,
  type PadiItem, type KategoriItem,
} from '../data/padiData';

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computePadiInsights(): Insight[] {
  const items   = getPadiList();
  const industri = items.filter(i => i.kategoriItem === 'Limbah Industri').length;
  const pertanian = items.filter(i => i.kategoriItem === 'Limbah Pertanian').length;
  const priced  = items.filter(i => i.estimasiHarga !== null);
  const termurah = [...priced].sort((a, b) => a.estimasiHarga! - b.estimasiHarga!)[0];
  const termahal = [...priced].sort((a, b) => b.estimasiHarga! - a.estimasiHarga!)[0];

  return [
    {
      icon: '🌾', color: '#558b2f', bg: '#f1f8e9',
      text: `Padi menghasilkan berbagai bahan pakan dari biji hingga batang — mulai dari gabah berenergi tinggi hingga jerami sebagai roughage murah untuk sapi dan kerbau.`,
    },
    {
      icon: '🏭', color: '#546e7a', bg: '#eceff1',
      text: `${industri} produk hasil samping industri penggilingan padi (dedak kasar, dedak halus, bekatul, sekam) tersedia dengan harga ekonomis sebagai sumber serat dan energi.`,
    },
    {
      icon: '💰', color: '#1b7a43', bg: '#e8f5ee',
      text: `Rentang harga bahan padi sangat lebar: ${termurah ? `${termurah.nama} (Rp ${termurah.estimasiHarga!.toLocaleString('id-ID')}/kg)` : '—'} hingga ${termahal ? `${termahal.nama} (Rp ${termahal.estimasiHarga!.toLocaleString('id-ID')}/kg)` : '—'} — sesuaikan pilihan dengan target nutrisi dan anggaran ransum.`,
    },
    {
      icon: '🌱', color: '#558b2f', bg: '#f1f8e9',
      text: `${pertanian} bahan limbah pertanian (jerami segar, jerami kering, sekam bakar) adalah sumber roughage murah yang cocok untuk mengurangi biaya pakan basal ruminansia.`,
    },
    {
      icon: '⚡', color: '#7b5e2a', bg: '#fff8e1',
      text: `Bekatul mengandung lemak 15–20% dan protein 12–14% — nilai nutrisi tertinggi di antara semua turunan penggilingan padi, namun mudah tengik dan perlu disimpan dengan tepat.`,
    },
    {
      icon: '📦', color: '#0277bd', bg: '#e1f5fe',
      text: `Jerami padi kering (protein 3–4%) harus dikombinasikan dengan konsentrat atau urea agar memenuhi kebutuhan protein ternak ruminansia secara memadai.`,
    },
  ];
}

function PadiAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computePadiInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Padi</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
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
      <button type="button" onClick={() => setExpanded(v => !v)} style={{
        width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? 'Sembunyikan' : `Lihat semua (${insights.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function PadiRingkasan() {
  const r = computePadiRingkasan();

  const cards = [
    {
      label: 'Total Referensi Padi',
      value: String(r.totalReferensi),
      icon: '🌾',
      bg: '#f1f8e9', color: '#558b2f',
    },
    {
      label: 'Harga Rata-rata',
      value: r.hargaRataRata !== null ? `Rp ${r.hargaRataRata.toLocaleString('id-ID')}` : '—',
      icon: '💰',
      bg: '#fff8e1', color: '#7b5e2a',
    },
    {
      label: 'Terakhir Diperbarui',
      value: r.terakhirUpdate,
      icon: '🕒',
      bg: '#e1f5fe', color: '#0277bd',
    },
    {
      label: 'Data Nutrisi Lengkap',
      value: `${r.dataLengkap} item`,
      icon: '✅',
      bg: '#e8f5ee', color: '#1b7a43',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 20 }}>{card.icon}</span>
          <div style={{
            fontSize: card.value.startsWith('Rp') || card.value.length > 8 ? 13 : 22,
            fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function PadiItemCard({ item, onDetail }: { item: PadiItem; onDetail: () => void }) {
  const style = KATEGORI_ITEM_STYLE[item.kategoriItem];

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: style.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: name + kategori badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 5, lineHeight: 1.2,
            }}>
              {item.nama}
            </div>
            {item.namaLain && (
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 5, fontStyle: 'italic' }}>
                {item.namaLain}
              </div>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: style.color, background: style.bg,
              borderRadius: 20, padding: '2px 9px',
            }}>
              {item.kategoriItem}
            </span>
          </div>
          {item.estimasiHarga !== null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 2 }}>EST. HARGA</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7b5e2a' }}>
                Rp {item.estimasiHarga.toLocaleString('id-ID')}<span style={{ fontSize: 9, fontWeight: 600 }}>/kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Description */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.deskripsi}
        </p>

        {/* Lihat Detail */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '2px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onDetail}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${style.color}`,
              background: 'transparent', color: style.color,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}
          >
            Lihat Detail →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: KategoriItem; count: number }) {
  const style = KATEGORI_ITEM_STYLE[label];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
        color: style.color, background: style.bg,
        borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
      }}>
        {label} · {count}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterPakanPadi() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getPadiList();
  const filtered = query
    ? allItems.filter(item =>
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.namaLain.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Group by kategoriItem (preserving defined order)
  const grouped = KATEGORI_ITEM_ALL
    .map(kat => ({
      kat,
      items: filtered.filter(i => i.kategoriItem === kat),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: '#f1f8e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '1.5px solid #a5d6a744',
          }}>
            🌾
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Kategori Induk · Master Pakan
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
              Padi
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {allItems.length} referensi bahan baku & hasil samping
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <PadiAiInsightCard />

        {/* Ringkasan */}
        <PadiRingkasan />

      </div>

      {/* Search */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama sub kategori padi..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {allItems.length} referensi
        </div>
      </div>

      {/* Grouped list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🌾</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Tidak Ada Hasil
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          grouped.map(({ kat, items }) => (
            <div key={kat} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel label={kat} count={items.length} />
              {items.map(item => (
                <PadiItemCard
                  key={item.id}
                  item={item}
                  onDetail={() => navigate(`/stok-pakan/master/padi/${item.id}`)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
