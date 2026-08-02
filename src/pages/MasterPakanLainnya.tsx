import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLainnyaList,
  computeLainnyaRingkasan,
  LAINNYA_KATEGORI_ORDER,
  KATEGORI_ITEM_STYLE,
  type LainnyaItem,
} from '../data/lainnyaData';
import type { KategoriItem } from '../data/jagungData';

// ─── AI Insight ────────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeLainnyaInsights(): Insight[] {
  const items     = getLainnyaList();
  const adsorben  = items.filter(i => i.kategoriItem === 'Adsorben & Pengikat');
  const bioaktif  = items.filter(i => i.kategoriItem === 'Bahan Bioaktif Tanaman');
  const organik   = items.filter(i => i.kategoriItem === 'Bahan Organik Alami');
  const priced    = items.filter(i => i.estimasiHarga !== null);
  const termahal  = [...priced].sort((a, b) => b.estimasiHarga! - a.estimasiHarga!)[0];
  const termurah  = [...priced].sort((a, b) => a.estimasiHarga! - b.estimasiHarga!)[0];

  return [
    {
      icon: '📦', color: '#455a64', bg: '#eceff1',
      text: `${items.length} bahan baku tunggal terdokumentasi di kategori "Lainnya" — seluruhnya merupakan bahan mentah tunggal yang tidak masuk kategori Master Pakan utama lainnya. Kategori ini menjadi referensi teknis sebelum bahan pendukung ini digunakan dalam formulasi ransum akhir.`,
    },
    {
      icon: '🪨', color: '#455a64', bg: '#eceff1',
      text: `${adsorben.length} bahan adsorben & pengikat terdokumentasi — bahan-bahan ini bekerja secara fisik mengikat mikotoksin, amonia, dan racun dalam saluran cerna tanpa ikut diserap tubuh ternak. Efektivitasnya bergantung pada luas permukaan dan muatan kation; bentonit dan zeolit paling umum digunakan karena harga terjangkau dan ketersediaan lokal.`,
    },
    {
      icon: '🌿', color: '#558b2f', bg: '#f1f8e9',
      text: `${bioaktif.length} bahan bioaktif tanaman terdokumentasi — kitosan, ekstrak yucca, dan ekstrak quillaja bekerja melalui mekanisme biologis aktif: antimikroba, imunomodulasi, dan pengurangan amonia. Ketiga bahan ini merupakan alternatif penting untuk mengurangi ketergantungan pada antibiotik pertumbuhan (AGP) yang kini dilarang di banyak negara.`,
    },
    {
      icon: '🟤', color: '#795548', bg: '#efebe9',
      text: `${organik.length} bahan organik alami terdokumentasi — asam humat, asam fulvat, lignit, gambut pakan, dan bioflok kering berasal dari dekomposisi bahan organik alami. Asam humat dan fulvat bekerja sebagai chelator mineral (meningkatkan bioavailabilitas), pengkondisi saluran cerna, dan imunomodulator; lignit menjadi sumber ekonomis keduanya.`,
    },
    {
      icon: '⚗️', color: '#558b2f', bg: '#f1f8e9',
      text: `Ekstrak yucca (Yucca schidigera) dan ekstrak quillaja (Quillaja saponaria) sama-sama kaya saponin namun berbeda struktur: saponin yucca bersifat steroidal (lebih efektif mengikat amonia), saponin quillaja bersifat triterpenoid (lebih larut air, lebih efektif sebagai emulsifier). Pemilihan bergantung pada target aplikasi dalam ransum.`,
    },
    {
      icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Rentang harga sangat lebar: ${termurah ? `${termurah.nama} (Rp ${termurah.estimasiHarga!.toLocaleString('id-ID')}/kg)` : '—'} paling terjangkau, sementara ${termahal ? `${termahal.nama} (Rp ${termahal.estimasiHarga!.toLocaleString('id-ID')}/kg)` : '—'} paling mahal. Bahan adsorben mineral (bentonit, kaolin, zeolit) umumnya sangat ekonomis karena merupakan mineral tambang lokal; bahan bioaktif tanaman dan ekstrak mahal karena proses ekstraksi intensif.`,
    },
  ];
}

function LainnyaAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeLainnyaInsights();
  const visible  = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid #455a64',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: '#455a64', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>
          AI Insight — Lainnya
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
            fontSize: 12, fontWeight: 700, color: '#455a64', cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {expanded ? '▲ Sembunyikan' : `▼ Lihat ${insights.length - 2} insight lainnya`}
        </button>
      )}
    </div>
  );
}

// ─── Ringkasan ─────────────────────────────────────────────────────────────────

function RingkasanCard() {
  const r = computeLainnyaRingkasan();
  const cards = [
    { label: 'Total Referensi Bahan Lainnya', value: `${r.totalReferensi} bahan`, icon: '📦', color: '#455a64' },
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

// ─── Section Label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  const style = KATEGORI_ITEM_STYLE[label as KategoriItem] ?? { color: '#455a64', bg: '#eceff1' };
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

// ─── Item Card ─────────────────────────────────────────────────────────────────

function LainnyaItemCard({
  item, onDetail,
}: {
  item: LainnyaItem;
  onDetail: () => void;
}) {
  const style = KATEGORI_ITEM_STYLE[item.kategoriItem] ?? { color: '#455a64', bg: '#eceff1' };

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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: style.color, background: style.bg,
                borderRadius: 20, padding: '2px 9px',
              }}>
                {item.kategoriItem}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: '#455a64', background: '#eceff1',
                borderRadius: 20, padding: '2px 9px',
              }}>
                📦 Bahan Lainnya
              </span>
            </div>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MasterPakanLainnya() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allItems = getLainnyaList();

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
  const grouped: { kat: KategoriItem; items: LainnyaItem[] }[] = [];
  const seenKats = new Set<KategoriItem>();
  for (const kat of LAINNYA_KATEGORI_ORDER) {
    const group = filtered.filter(i => i.kategoriItem === kat);
    if (group.length > 0) {
      grouped.push({ kat, items: group });
      seenKats.add(kat);
    }
  }
  // Leftover items with unknown kategoriItem
  const others = filtered.filter(i => !seenKats.has(i.kategoriItem));
  if (others.length > 0) {
    grouped.push({ kat: 'Adsorben & Pengikat' as KategoriItem, items: others });
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #455a64 0%, #263238 100%)',
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 12,
          }}>
            📦
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
            Lainnya
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.55 }}>
            Bahan baku tunggal yang tidak masuk kategori Master Pakan lainnya — adsorben & pengikat, bahan bioaktif tanaman, dan bahan organik alami yang digunakan sebagai bahan pakan atau bahan pendukung pakan ternak.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* AI Insight */}
        <LainnyaAiInsightCard />

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
              placeholder="Cari nama bahan lainnya…"
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
              <span style={{ fontSize: 56 }}>📦</span>
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
                  <LainnyaItemCard
                    key={item.id}
                    item={item}
                    onDetail={() => navigate(`/stok-pakan/master/lainnya/${item.id}`)}
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
