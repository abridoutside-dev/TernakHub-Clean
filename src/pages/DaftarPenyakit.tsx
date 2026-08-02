// ─── Daftar Penyakit ──────────────────────────────────────────────────────────
// SP-003: Daftar Penyakit per Jenis Ternak + Kategori Penyakit.
// Alur: Penyakit → Jenis Ternak → Kategori → Daftar Penyakit (halaman ini)
// Layout: Breadcrumb → Search → Filter Status → Daftar Penyakit

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { JENIS_TERNAK_PENYAKIT } from '../data/jenisTernakPenyakitData';
import { getKategoriByTernakSlug } from '../data/kategoriPenyakitData';
import {
  getPenyakitByKategoriDanTernak,
  type PenyakitListItem,
  type StatusPenyakit,
  type TingkatKeparahan,
  type TingkatPenularan,
} from '../data/daftarPenyakitData';

// ─── Badge helpers ────────────────────────────────────────────────────────────

function keparahanStyle(k: TingkatKeparahan): { color: string; bg: string } {
  if (k === 'Ringan') return { color: '#1b7a43', bg: '#e8f5ee' };
  if (k === 'Sedang') return { color: '#e65100', bg: '#fff3e0' };
  return { color: '#c62828', bg: '#ffebee' };
}

function keparahanIcon(k: TingkatKeparahan): string {
  if (k === 'Ringan') return '🟢';
  if (k === 'Sedang') return '🟡';
  return '🔴';
}

function penularanStyle(p: TingkatPenularan): { color: string; bg: string } {
  if (p === 'Tidak Menular')   return { color: '#546e7a', bg: '#eceff1' };
  if (p === 'Menular Rendah')  return { color: '#0277bd', bg: '#e1f5fe' };
  if (p === 'Menular Sedang')  return { color: '#e65100', bg: '#fff3e0' };
  return                              { color: '#c62828', bg: '#ffebee' };
}

function penularanIcon(p: TingkatPenularan): string {
  if (p === 'Tidak Menular')  return '🔒';
  if (p === 'Menular Rendah') return '⚠️';
  if (p === 'Menular Sedang') return '⚡';
  return '🚨';
}

// ─── Penyakit Card ────────────────────────────────────────────────────────────

function PenyakitCard({
  item,
  accentColor,
  onClick,
}: {
  item: PenyakitListItem;
  accentColor: string;
  onClick: () => void;
}) {
  const kStyle = keparahanStyle(item.tingkatKeparahan);
  const pStyle = penularanStyle(item.tingkatPenularan);
  const inactive = item.status === 'Nonaktif';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'stretch',
      overflow: 'hidden',
      opacity: inactive ? 0.6 : 1,
      cursor: 'pointer',
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: inactive ? 'var(--color-border)' : accentColor, flexShrink: 0 }} />

      <div style={{
        flex: 1,
        padding: '14px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}>

        {/* Row 1: name + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800,
              color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 4,
            }}>
              {item.namaPenyakit}
            </div>
            {item.namaIlmiah && (
              <div style={{
                fontSize: 11, color: 'var(--color-muted)',
                fontStyle: 'italic', lineHeight: 1.3,
              }}>
                {item.namaIlmiah}
              </div>
            )}
          </div>
          <span style={{
            flexShrink: 0,
            fontSize: 10, fontWeight: 700,
            borderRadius: 20, padding: '3px 8px',
            color: inactive ? '#546e7a' : '#1b7a43',
            background: inactive ? '#eceff1' : '#e8f5ee',
            border: `1px solid ${inactive ? '#b0bec5' : '#a5d6a7'}`,
          }}>
            {item.status}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Ringkasan */}
        <p style={{
          margin: 0,
          fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.ringkasan}
        </p>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Keparahan */}
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: kStyle.color, background: kStyle.bg,
            borderRadius: 20, padding: '3px 8px',
          }}>
            {keparahanIcon(item.tingkatKeparahan)} {item.tingkatKeparahan}
          </span>
          {/* Penularan */}
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: pStyle.color, background: pStyle.bg,
            borderRadius: 20, padding: '3px 8px',
          }}>
            {penularanIcon(item.tingkatPenularan)} {item.tingkatPenularan}
          </span>
        </div>

        {/* Footer: go to detail */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11, color: 'var(--color-primary)',
            fontWeight: 700,
          }}>
            Lihat Detail Penyakit
          </span>
          <span style={{ fontSize: 14, color: 'var(--color-border)' }}>›</span>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type FilterKey = 'Semua' | StatusPenyakit;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'Semua',    label: 'Semua' },
  { key: 'Aktif',   label: 'Aktif' },
  { key: 'Nonaktif', label: 'Nonaktif' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DaftarPenyakit() {
  const { ternakSlug, kategoriSlug } = useParams<{
    ternakSlug: string;
    kategoriSlug: string;
  }>();
  const navigate = useNavigate();
  const [query, setQuery]   = useState('');
  const debouncedQuery      = useDebounce(query, 300);
  const [filter, setFilter] = useState<FilterKey>('Semua');

  const ternak = ternakSlug
    ? JENIS_TERNAK_PENYAKIT.find((j) => j.slug === ternakSlug)
    : undefined;

  const kategori = ternak && kategoriSlug
    ? getKategoriByTernakSlug(ternakSlug!, ternak.uuid).find(
        (k) => k.slug === kategoriSlug,
      )
    : undefined;

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!ternak || !kategori) {
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Halaman Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Kombinasi jenis ternak atau kategori penyakit tidak ditemukan.
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
          Kembali ke Stok Obat
        </button>
      </div>
    );
  }

  const allPenyakit = getPenyakitByKategoriDanTernak(kategoriSlug!, ternakSlug!);

  const filtered = allPenyakit.filter((p) => {
    const q = debouncedQuery.toLowerCase();
    const matchSearch = !q
      || p.namaPenyakit.toLowerCase().includes(q)
      || (p.namaIlmiah?.toLowerCase().includes(q) ?? false);
    const matchFilter = filter === 'Semua' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const aktifCount   = allPenyakit.filter((p) => p.status === 'Aktif').length;
  const nonaktifCount = allPenyakit.filter((p) => p.status === 'Nonaktif').length;

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Breadcrumb / Header ───────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 16px 16px',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {/* Category icon */}
        <div style={{
          width: 64, height: 64,
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
          background: kategori.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34,
          border: `1.5px solid ${kategori.color}22`,
        }}>
          {kategori.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Breadcrumb trail */}
          <div style={{
            fontSize: 11, color: 'var(--color-muted)',
            fontWeight: 600, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            flexWrap: 'wrap',
          }}>
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate('/stok-obat')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/stok-obat')}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              Penyakit
            </span>
            <span>›</span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/stok-obat/penyakit/${ternakSlug}`)}
              onKeyDown={(e) =>
                e.key === 'Enter' && navigate(`/stok-obat/penyakit/${ternakSlug}`)
              }
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {ternak.icon} {ternak.nama}
            </span>
            <span>›</span>
            <span style={{ color: 'var(--color-text)' }}>{kategori.nama}</span>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 18, fontWeight: 800,
            color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 6,
          }}>
            {kategori.nama}
          </div>

          {/* Sub-badge: jenis ternak */}
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: ternak.color, background: ternak.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            {ternak.icon} {ternak.nama}
          </span>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '0 16px 0',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', gap: 10, marginBottom: 0,
      }}>
        <div style={{
          flex: 1, background: '#e8f5ee',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1b7a43', lineHeight: 1 }}>{aktifCount}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#1b7a43', opacity: 0.8 }}>Aktif</div>
          </div>
        </div>
        <div style={{
          flex: 1, background: '#eceff1',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⛔</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#546e7a', lineHeight: 1 }}>{nonaktifCount}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#546e7a', opacity: 0.8 }}>Nonaktif</div>
          </div>
        </div>
        <div style={{
          flex: 1, background: kategori.bg,
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🩺</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: kategori.color, lineHeight: 1 }}>{allPenyakit.length}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: kategori.color, opacity: 0.8 }}>Total</div>
          </div>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama penyakit atau nama ilmiah..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                border: 'none', background: 'none',
                fontSize: 14, color: 'var(--color-muted)',
                cursor: 'pointer', padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px 0',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                fontSize: 12, fontWeight: 700,
                border: active
                  ? `2px solid ${kategori.color}`
                  : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: active ? kategori.color : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Result count ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {allPenyakit.length} penyakit
        </div>
      </div>

      {/* ── Penyakit List ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px 0',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '60px 24px', gap: 14,
          }}>
            <span style={{ fontSize: 56 }}>
              {allPenyakit.length === 0 ? kategori.icon : '🔍'}
            </span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 6,
              }}>
                {allPenyakit.length === 0
                  ? 'Data Penyakit Segera Hadir'
                  : 'Penyakit Tidak Ditemukan'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                {allPenyakit.length === 0
                  ? 'Referensi penyakit untuk kategori ini sedang disiapkan.'
                  : 'Coba ubah kata kunci atau hapus filter.'}
              </div>
            </div>
          </div>
        ) : (
          filtered.map((p) => (
            <PenyakitCard
              key={p.uuid}
              item={p}
              accentColor={kategori.color}
              onClick={() => navigate(`/stok-obat/penyakit/${ternakSlug}/${kategoriSlug}/${p.uuid}`)}
            />
          ))
        )}
      </div>

    </div>
  );
}
