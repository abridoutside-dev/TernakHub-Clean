import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getVitaminFeedAdditiveList,
  computeVitaminFeedAdditiveRingkasan,
  VITAMIN_FEED_ADDITIVE_KATEGORI_ORDER,
  KATEGORI_ITEM_STYLE,
  type VitaminFeedAdditiveItem,
} from '../data/vitaminFeedAdditiveData';
import type { KategoriItem } from '../data/jagungData';

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeVitaminInsights(): Insight[] {
  const items    = getVitaminFeedAdditiveList();
  const vitamins = items.filter(i => i.kategoriItem === 'Vitamin Larut Lemak' || i.kategoriItem === 'Vitamin Larut Air');
  const enzymes  = items.filter(i => i.kategoriItem === 'Enzim & Mikroba Pakan');
  const priced   = items.filter(i => i.estimasiHarga !== null);
  const termahal = [...priced].sort((a, b) => b.estimasiHarga! - a.estimasiHarga!)[0];
  const termurah = [...priced].sort((a, b) => a.estimasiHarga! - b.estimasiHarga!)[0];

  return [
    {
      icon: '💊', color: '#6a1b9a', bg: '#f3e5f5',
      text: `${items.length} bahan baku tunggal sumber vitamin dan feed additive terdokumentasi — semuanya adalah bahan murni tunggal, bukan premix atau campuran. Kategori ini adalah referensi untuk memahami fungsi, dosis, dan interaksi masing-masing komponen sebelum Anda merancang atau membeli premix vitamin dari pemasok. Memahami bahan tunggal = memahami premix Anda.`,
    },
    {
      icon: '🔬', color: '#6a1b9a', bg: '#f3e5f5',
      text: `${vitamins.length} vitamin terdokumentasi — dibagi menjadi larut lemak (A, D3, E, K3) dan larut air (B-kompleks + C). Vitamin larut lemak disimpan di jaringan adiposa dan hati, sehingga defisiensi lebih lambat muncul namun juga dapat menumpuk hingga toksik. Vitamin larut air tidak disimpan — ekskres harian, sehingga pasokan harus konsisten setiap hari dalam ransum.`,
    },
    {
      icon: '⚗️', color: '#00695c', bg: '#e0f2f1',
      text: `${enzymes.length} enzim dan produk mikroba tersedia — fitase adalah yang paling dampak ekonominya: setiap ton ransum unggas mengandung ±3–5 kg P terikat fitat yang tidak tersedia, setara Rp 15.000–25.000/ton biaya P yang terbuang. Suplementasi fitase memungkinkan pengurangan DCP/MCP 1–1,5 kg/ton tanpa mengorbankan performa — ROI biasanya 3–5× dari biaya enzim.`,
    },
    {
      icon: '🛡️', color: '#c62828', bg: '#fdecea',
      text: `Aflatoksin adalah ancaman nyata di Indonesia: iklim tropis lembap mendukung pertumbuhan Aspergillus flavus pada jagung dan kedelai. Kadar aflatoksin >20 ppb (unggas) atau >300 ppb (sapi) menyebabkan imunosupresi, penurunan produksi, dan kematian. Toksin Binder (Mycotoxin Binder) wajib dipertimbangkan dalam setiap ransum yang menggunakan jagung lokal — khususnya di musim hujan dan pascapanen lembap.`,
    },
    {
      icon: '🤝', color: '#0277bd', bg: '#e1f5fe',
      text: `Interaksi kritis antar-bahan: (1) Kolin Klorida merusak vitamin lain jika dicampur dalam premix — selalu tambahkan terpisah ke ransum; (2) Vitamin E + Selenium bekerja sinergis — defisiensi salah satu meningkatkan kebutuhan yang lain; (3) Vitamin D3 meningkatkan absorpsi Ca hingga 50% — kekurangan D3 membuat suplementasi Ca menjadi sia-sia; (4) Fitase + Vitamin D3 kombinasi terbaik untuk efisiensi Ca dan P.`,
    },
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Rentang harga sangat lebar: ${termurah ? `${termurah.nama} (Rp ${termurah.estimasiHarga!.toLocaleString('id-ID')}/kg)` : 'Buffer Pakan'} paling terjangkau, sementara ${termahal ? `${termahal.nama} (Rp ${termahal.estimasiHarga!.toLocaleString('id-ID')}/kg)` : 'Biotin'} termahal. Perlu diingat: vitamin dan additive digunakan dalam dosis sangat kecil (gram hingga miligram per ton pakan), sehingga harga per kg tidak langsung mencerminkan biaya aktual per ton ransum — selalu hitung biaya per unit aktif (IU, mg) yang dibutuhkan.`,
    },
  ];
}

function VitaminAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeVitaminInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid #6a1b9a',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: '#6a1b9a', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>
          AI Insight — Vitamin &amp; Feed Additive
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            padding: '11px 14px',
            borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: ins.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              {ins.icon}
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.65 }}>
              {ins.text}
            </p>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', border: 'none', borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)', padding: '10px 14px',
            fontSize: 12, fontWeight: 700, color: '#6a1b9a', cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {expanded ? '▲ Sembunyikan' : `▼ Lihat ${insights.length - 2} insight lainnya`}
        </button>
      )}
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function RingkasanCard() {
  const r = computeVitaminFeedAdditiveRingkasan();
  const cards = [
    { label: 'Total Referensi Vitamin & Feed Additive', value: `${r.totalReferensi} bahan`, icon: '💊', color: '#6a1b9a' },
    {
      label: 'Harga Rata-rata',
      value: r.hargaRataRata !== null
        ? `Rp ${r.hargaRataRata.toLocaleString('id-ID')}/kg`
        : '—',
      icon: '💰', color: '#7b5e2a',
    },
    { label: 'Terakhir Diperbarui', value: r.terakhirUpdate, icon: '📅', color: '#546e7a' },
    { label: 'Jumlah Data Nutrisi Lengkap', value: `${r.dataLengkap} bahan`, icon: '✅', color: '#1b7a43' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', padding: '12px 14px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginBottom: 3 }}>{c.value}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  const style = KATEGORI_ITEM_STYLE[label as KategoriItem] ?? { color: '#6a1b9a', bg: '#f3e5f5' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 2px' }}>
      <div style={{ height: 2, flex: 1, background: style.color, opacity: 0.25, borderRadius: 2 }} />
      <span style={{
        fontSize: 10, fontWeight: 800, color: style.color, background: style.bg,
        borderRadius: 20, padding: '3px 10px', letterSpacing: 0.4, whiteSpace: 'nowrap',
      }}>
        {label} · {count}
      </span>
      <div style={{ height: 2, flex: 1, background: style.color, opacity: 0.25, borderRadius: 2 }} />
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function VitaminItemCard({
  item, onDetail,
}: {
  item: VitaminFeedAdditiveItem;
  onDetail: () => void;
}) {
  const style = KATEGORI_ITEM_STYLE[item.kategoriItem] ?? { color: '#6a1b9a', bg: '#f3e5f5' };

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: style.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: name + badge + harga */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 3, lineHeight: 1.2,
            }}>
              {item.nama}
            </div>
            {item.namaIlmiah && (
              <div style={{
                fontSize: 11, color: style.color, marginBottom: 5,
                fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3,
              }}>
                {item.namaIlmiah}
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
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.deskripsi}
        </p>

        {/* Footer: data badge + detail button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
            color: item.dataLengkap ? '#1b7a43' : '#546e7a',
            background: item.dataLengkap ? '#e8f5ee' : '#eceff1',
            border: `1px solid ${item.dataLengkap ? '#a5d6a7' : '#cfd8dc'}`,
          }}>
            {item.dataLengkap ? '✅ Data Lengkap' : '🔄 Data Menyusul'}
          </span>

          <button
            type="button"
            onClick={onDetail}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: `1.5px solid ${style.color}`,
              background: 'transparent', color: style.color,
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Lihat Detail →
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterPakanVitaminFeedAdditive() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getVitaminFeedAdditiveList();

  const filtered = query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.namaLain.toLowerCase().includes(q) ||
          (item.namaIlmiah?.toLowerCase().includes(q) ?? false) ||
          item.deskripsi.toLowerCase().includes(q)
        );
      })
    : allItems;

  // Group by kategoriItem following defined order; append any uncategorised at end
  const grouped: { kat: KategoriItem; items: VitaminFeedAdditiveItem[] }[] = [];
  const seenKats = new Set<KategoriItem>();
  for (const kat of VITAMIN_FEED_ADDITIVE_KATEGORI_ORDER) {
    const group = filtered.filter(i => i.kategoriItem === kat);
    if (group.length > 0) {
      grouped.push({ kat, items: group });
      seenKats.add(kat);
    }
  }
  // Leftover items with unknown kategoriItem
  const others = filtered.filter(i => !seenKats.has(i.kategoriItem));
  if (others.length > 0) {
    grouped.push({ kat: 'Lainnya' as KategoriItem, items: others });
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)',
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 12,
          }}>
            💊
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
            Vitamin &amp; Feed Additive
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.55 }}>
            Bahan baku tunggal sumber vitamin dan aditif pakan: vitamin A–K, enzim, probiotik, prebiotik, asam organik, antioksidan, dan pelindung toksin untuk optimasi performa ternak.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* AI Insight */}
        <VitaminAiInsightCard />

        <div style={{ height: 14 }} />

        {/* Ringkasan */}
        <RingkasanCard />

        <div style={{ height: 14 }} />

        {/* Search */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari nama bahan vitamin atau feed additive…"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 13,
                background: 'transparent', color: 'var(--color-text)',
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
        <div style={{ padding: '8px 0 0' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
            {filtered.length} dari {allItems.length} referensi
          </div>
        </div>

        {/* Grouped list */}
        <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
              <span style={{ fontSize: 56 }}>💊</span>
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
                  <VitaminItemCard
                    key={item.id}
                    item={item}
                    onDetail={() => navigate(`/stok-pakan/master/vitamin-feed-additive/${item.id}`)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
