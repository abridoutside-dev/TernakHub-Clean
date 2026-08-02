// ─── Master Obat Tab ──────────────────────────────────────────────────────────
// SO-003: Kategori-level tab for Master Obat.
// Mengikuti pola MasterPakanTab.tsx.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OBAT_KATEGORI, type ObatKategori } from '../data/masterObatKategoriData';
import { getObatByKategori } from '../data/obatData';
import { downloadMasterObatExport } from '../utils/masterObatImportExport';

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeObatMasterInsights(): Insight[] {
  const total = OBAT_KATEGORI.length;
  const totalReferensi = OBAT_KATEGORI.reduce((sum, k) => sum + getObatByKategori(k.slug).length, 0);
  const totalLengkap = OBAT_KATEGORI.reduce(
    (sum, k) => sum + getObatByKategori(k.slug).filter(o => o.dataLengkap).length,
    0,
  );

  return [
    {
      icon: '💊', color: '#c62828', bg: '#ffebee',
      text: `Database Master Obat mencakup ${total} kategori — dari antibiotik, antiparasit, vaksin, hingga hormon dan cairan infus — sebagai referensi farmakologi lengkap untuk penanganan kesehatan ternak.`,
    },
    {
      icon: '📋', color: '#0277bd', bg: '#e1f5fe',
      text: `Saat ini tersedia ${totalReferensi} referensi obat aktif, ${totalLengkap} di antaranya sudah memiliki data farmakologi dan dosis lengkap berdasarkan jenis ternak.`,
    },
    {
      icon: '⚠️', color: '#e65100', bg: '#fff3e0',
      text: `Withdrawal Time (waktu henti) harus selalu diperhatikan sebelum pemotongan hewan atau pengambilan susu/telur. Residu obat melebihi batas aman adalah pelanggaran keamanan pangan dan dapat ditindak hukum.`,
    },
    {
      icon: '🔗', color: '#1b7a43', bg: '#e8f5ee',
      text: `Master Obat menjadi sumber data terpusat untuk Modul Stok Obat, Catat Pengobatan, dan AI Health Insight — pastikan referensi selalu mutakhir untuk rekomendasi penanganan penyakit yang akurat.`,
    },
    {
      icon: '🏗️', color: '#546e7a', bg: '#eceff1',
      text: `Produk Komersial Obat, Riwayat Pengobatan, dan integrasi dengan AI Diagnosis akan dikembangkan pada roadmap berikutnya berdasarkan foundation Master Obat ini.`,
    },
  ];
}

export function MasterObatAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeObatMasterInsights();
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Master Obat</span>
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

export function MasterObatRingkasanCards() {
  const totalKategori = OBAT_KATEGORI.length;
  const totalReferensi = OBAT_KATEGORI.reduce((sum, k) => sum + getObatByKategori(k.slug).length, 0);
  const totalLengkap = OBAT_KATEGORI.reduce(
    (sum, k) => sum + getObatByKategori(k.slug).filter(o => o.dataLengkap).length,
    0,
  );

  const cards = [
    { label: 'Total Kategori',    value: String(totalKategori),   icon: '🏷️', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Total Referensi',   value: String(totalReferensi),  icon: '💊', bg: '#ffebee', color: '#c62828' },
    { label: 'Data Lengkap',      value: String(totalLengkap),    icon: '✅', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Status Database',   value: 'Aktif',                 icon: '🟢', bg: '#e8f5e9', color: '#2e7d32' },
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
            fontSize: card.value.length > 6 ? 13 : 22,
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

// ─── Category Card ────────────────────────────────────────────────────────────

function ObatKategoriCard({ kategori, onLihat }: { kategori: ObatKategori; onLihat: () => void }) {
  const items = getObatByKategori(kategori.slug);
  const jumlahItem = items.length;

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: kategori.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

        {/* Row 1: icon + name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: kategori.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {kategori.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {kategori.nama}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: kategori.color, background: kategori.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {jumlahItem} referensi
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Description */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {kategori.deskripsi}
        </p>

        {/* Lihat Selengkapnya */}
        <button
          type="button"
          onClick={onLihat}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${kategori.color}`,
            background: 'transparent', color: kategori.color,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Lihat Selengkapnya →
        </button>
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function MasterObatTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = OBAT_KATEGORI.filter(k =>
    k.nama.toLowerCase().includes(query.toLowerCase()) ||
    k.deskripsi.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>

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
            placeholder="Cari obat..."
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

      {/* Result count + Export */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {OBAT_KATEGORI.length} kategori
        </div>
        <button
          type="button"
          onClick={() => downloadMasterObatExport()}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-primary)',
            background: 'transparent', color: 'var(--color-primary)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span>⬇️</span> Export JSON
        </button>
      </div>

      {/* Category list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>💊</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Kategori Tidak Ditemukan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          filtered.map(k => (
            <ObatKategoriCard
              key={k.slug}
              kategori={k}
              onLihat={() => navigate(`/stok-obat/master/${k.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
