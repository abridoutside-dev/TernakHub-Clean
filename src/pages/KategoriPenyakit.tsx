// ─── Kategori Penyakit ────────────────────────────────────────────────────────
// SP-002: Daftar Kategori Penyakit berdasarkan Jenis Ternak yang dipilih.
// Alur: Penyakit (tab) → Jenis Ternak → Kategori Penyakit (halaman ini)
// Layout: Header (breadcrumb) → Search → Daftar Kategori

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import { JENIS_TERNAK_PENYAKIT } from '../data/jenisTernakPenyakitData';
import { getKategoriByTernakSlug, type KategoriPenyakit } from '../data/kategoriPenyakitData';

// ─── Kategori Card ────────────────────────────────────────────────────────────

function KategoriCard({
  kategori,
  onClick,
}: {
  kategori: KategoriPenyakit;
  onClick: () => void;
}) {
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
    }}>
      {/* Left accent */}
      <div style={{ width: 4, background: kategori.color, flexShrink: 0 }} />

      <div style={{
        flex: 1,
        padding: '14px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}>
        {/* Row: icon + name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
            background: kategori.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {kategori.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800,
              color: 'var(--color-text)',
              marginBottom: 5,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {kategori.nama}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: kategori.color, background: kategori.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {kategori.jumlahPenyakit} penyakit
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Description */}
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {kategori.deskripsi}
        </p>

        {/* CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11, color: 'var(--color-primary)',
            fontWeight: 700,
          }}>
            Lihat Daftar Penyakit →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KategoriPenyakit() {
  const { ternakSlug } = useParams<{ ternakSlug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const ternak = ternakSlug
    ? JENIS_TERNAK_PENYAKIT.find((j) => j.slug === ternakSlug)
    : undefined;

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!ternak) {
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Jenis Ternak Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          "{ternakSlug}" tidak ada dalam daftar jenis ternak yang didukung.
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

  const allKategori = getKategoriByTernakSlug(ternakSlug!, ternak.uuid);
  const filtered = allKategori.filter((k) =>
    k.nama.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    k.deskripsi.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Breadcrumb / Jenis Ternak Header ─────────────────────────────────── */}
      <div style={{
        padding: '20px 16px 16px',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
          background: ternak.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34,
          border: `1.5px solid ${ternak.color}22`,
        }}>
          {ternak.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Breadcrumb trail */}
          <div style={{
            fontSize: 11, color: 'var(--color-muted)',
            fontWeight: 600, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 4,
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
            <span style={{ color: 'var(--color-text)' }}>{ternak.nama}</span>
          </div>
          {/* Title */}
          <div style={{
            fontSize: 20, fontWeight: 800,
            color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 6,
          }}>
            {ternak.nama}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: ternak.color, background: ternak.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            Kategori Penyakit
          </span>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
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
            placeholder="Cari kategori penyakit..."
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

      {/* ── Result count ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {allKategori.length} kategori
        </div>
      </div>

      {/* ── Kategori List ─────────────────────────────────────────────────────── */}
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
            <span style={{ fontSize: 56 }}>🩺</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--color-text)', marginBottom: 6,
              }}>
                Kategori Tidak Ditemukan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci pencarian.
              </div>
            </div>
          </div>
        ) : (
          filtered.map((k) => (
            <KategoriCard
              key={k.uuid}
              kategori={k}
              onClick={() => navigate(`/stok-obat/penyakit/${ternakSlug}/${k.slug}`)}
            />
          ))
        )}
      </div>

    </div>
  );
}
