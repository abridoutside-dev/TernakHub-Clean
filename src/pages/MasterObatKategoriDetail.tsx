// ─── Master Obat — Kategori Detail ────────────────────────────────────────────
// SO-003: Daftar obat per kategori, dikelompokkan berdasarkan sub-kategori.
// Mengikuti pola MasterPakanMineral.tsx.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getObatKategoriBySlug } from '../data/masterObatKategoriData';
import {
  getObatByKategori,
  computeObatRingkasan,
  OBAT_SUB_KATEGORI_ORDER,
  OBAT_SUB_KATEGORI_STYLE,
  type ObatItem,
  type ObatSubKategori,
} from '../data/obatData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ObatItem['status'] }) {
  const cfg = {
    'Aktif':       { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' },
    'Tidak Aktif': { color: '#546e7a', bg: '#eceff1', label: '⛔ Tidak Aktif' },
    'Terbatas':    { color: '#e65100', bg: '#fff3e0', label: '⚠️ Terbatas' },
  }[status];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeKategoriInsights(items: ObatItem[]): Insight[] {
  const lengkap = items.filter(i => i.dataLengkap).length;
  const terbatas = items.filter(i => i.status === 'Terbatas').length;
  const aktif = items.filter(i => i.status === 'Aktif').length;

  const insights: Insight[] = [
    {
      icon: '📋', color: '#0277bd', bg: '#e1f5fe',
      text: `${items.length} referensi obat tersedia dalam kategori ini. ${lengkap} di antaranya sudah memiliki data farmakologi dan tabel dosis lengkap berdasarkan jenis ternak.`,
    },
    {
      icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
      text: `${aktif} obat berstatus Aktif dan siap digunakan sebagai referensi. ${terbatas > 0 ? `${terbatas} obat berstatus Terbatas — memerlukan resep dokter hewan dan/atau ijin khusus.` : ''}`,
    },
    {
      icon: '⚠️', color: '#c62828', bg: '#ffebee',
      text: 'Selalu perhatikan Withdrawal Time sebelum pemotongan hewan atau pengambilan hasil ternak (susu/telur). Penggunaan obat harus sesuai dosis dan indikasi yang tertera.',
    },
  ];
  return insights;
}

function AiInsightCard({ items }: { items: ObatItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const insights = computeKategoriInsights(items);
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>AI Insight</span>
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
              background: ins.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
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
            fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', textAlign: 'center',
          }}
        >
          {expanded ? '▲ Sembunyikan' : `▼ Lihat ${insights.length - 2} insight lainnya`}
        </button>
      )}
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function RingkasanCard({ items, kategoryNama }: { items: ObatItem[]; kategoryNama: string }) {
  const lengkap = items.filter(i => i.dataLengkap).length;
  const aktif = items.filter(i => i.status === 'Aktif').length;
  const terakhirUpdate = items.map(i => i.updatedAt).sort((a, b) => b.localeCompare(a))[0] ?? '—';

  const cards = [
    { label: `Total Referensi ${kategoryNama}`, value: `${items.length} obat`, icon: '💊', color: '#c62828' },
    { label: 'Data Farmakologi Lengkap',          value: `${lengkap} obat`,    icon: '✅', color: '#1b7a43' },
    { label: 'Status Aktif',                       value: `${aktif} obat`,      icon: '🟢', color: '#2e7d32' },
    { label: 'Terakhir Diperbarui',                value: terakhirUpdate,        icon: '📅', color: '#546e7a' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', padding: '12px 14px', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.color, marginBottom: 3 }}>{c.value}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4 }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  const style = OBAT_SUB_KATEGORI_STYLE[label] ?? { color: '#546e7a', bg: '#eceff1' };
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

function ObatItemCard({ item, onDetail }: { item: ObatItem; onDetail: () => void }) {
  const style = OBAT_SUB_KATEGORI_STYLE[item.subKategori] ?? { color: '#546e7a', bg: '#eceff1' };

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: style.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>

        {/* Row 1: name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
              {item.namaGenerik}
            </div>
            {item.namaLatin && (
              <div style={{ fontSize: 11, color: style.color, marginBottom: 5, fontStyle: 'italic', fontWeight: 600 }}>
                {item.namaLatin}
              </div>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: style.color, background: style.bg,
              borderRadius: 20, padding: '2px 9px',
            }}>
              {item.subKategori}
            </span>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Key info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, minWidth: 80, flexShrink: 0 }}>Bentuk</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>{item.bentukSediaan}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, minWidth: 80, flexShrink: 0 }}>Indikasi</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item.indikasi}
            </span>
          </div>
        </div>

        {/* Footer */}
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

export default function MasterObatKategoriDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const kategori = slug ? getObatKategoriBySlug(slug) : undefined;

  if (!kategori) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Kategori Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Kategori "{slug}" tidak ada dalam database Master Obat.
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat')}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Master Obat
        </button>
      </div>
    );
  }

  const allItems = getObatByKategori(kategori.slug);

  const filtered = query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase();
        return (
          item.namaGenerik.toLowerCase().includes(q) ||
          (item.namaLatin?.toLowerCase().includes(q) ?? false) ||
          item.indikasi.toLowerCase().includes(q) ||
          item.subKategori.toLowerCase().includes(q) ||
          item.golonganObat.toLowerCase().includes(q)
        );
      })
    : allItems;

  // Group by sub-kategori following defined order
  const order = OBAT_SUB_KATEGORI_ORDER[kategori.slug] ?? [];
  const grouped: { kat: ObatSubKategori; items: ObatItem[] }[] = [];
  const seenKats = new Set<string>();
  for (const kat of order) {
    const group = filtered.filter(i => i.subKategori === kat);
    if (group.length > 0) {
      grouped.push({ kat, items: group });
      seenKats.add(kat);
    }
  }
  const others = filtered.filter(i => !seenKats.has(i.subKategori));
  if (others.length > 0) {
    grouped.push({ kat: 'Lainnya' as ObatSubKategori, items: others });
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${kategori.color} 0%, ${kategori.color}cc 100%)`,
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 12,
          }}>
            {kategori.icon}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
            {kategori.nama}
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.88, lineHeight: 1.55 }}>
            {kategori.deskripsi}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* AI Insight */}
        <AiInsightCard items={allItems} />

        <div style={{ height: 14 }} />

        {/* Ringkasan */}
        <RingkasanCard items={allItems} kategoryNama={kategori.nama} />

        <div style={{ height: 14 }} />

        {/* Admin: kelola sub kategori */}
        <button
          type="button"
          onClick={() => navigate(`/stok-obat/master/${kategori.slug}/sub`)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', border: `1.5px solid ${kategori.color}55`,
            borderRadius: 'var(--radius-md)', background: kategori.bg,
            cursor: 'pointer', marginBottom: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🗂️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: kategori.color }}>Kelola Sub Kategori</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>Tambah, edit, dan atur status sub kategori</div>
            </div>
          </div>
          <span style={{ fontSize: 16, color: kategori.color }}>›</span>
        </button>

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
              placeholder="Cari nama obat, indikasi, atau golongan..."
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
              <span style={{ fontSize: 56 }}>{kategori.icon}</span>
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
                  <ObatItemCard
                    key={item.id}
                    item={item}
                    onDetail={() => navigate(`/stok-obat/master/${kategori.slug}/${item.id}`)}
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
