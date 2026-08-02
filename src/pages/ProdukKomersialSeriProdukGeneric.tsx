// ─── Produk Komersial — Seri → Produk (SKU) Generik (Batch 1) ────────────────
// PK-R02A: Halaman daftar Produk (SKU) milik satu Seri. Level terakhir sebelum
// Detail Produk.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KATEGORI_PRODUK_KOMERSIAL } from '../data/produkKomersialData';
import {
  getBrandBySlugAny, getSeriBySlugAny, getProdukBySeriIdAny, type GenericProduk,
} from '../data/produkKomersialGenericResolver';

function ProdukCard({ produk, brandColor, brandBg, onLihat }: {
  produk: GenericProduk; brandColor: string; brandBg: string; onLihat: () => void;
}) {
  const status = produk.statusAktif
    ? { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' }
    : { color: '#c62828', bg: '#ffebee', label: '⏸ Tidak Diproduksi' };
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      <div style={{ width: 4, background: brandColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🏷️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 2 }}>{produk.namaProduk}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>⚖️ {produk.kemasan}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: status.color, background: status.bg,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {status.label}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--color-border)' }} />
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {produk.deskripsi}
        </p>
        <button type="button" onClick={onLihat} style={{
          alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${brandColor}`, background: 'transparent', color: brandColor,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

export default function ProdukKomersialSeriProdukGeneric() {
  const { kategoriSlug, brandSlug, seriSlug } = useParams<{ kategoriSlug: string; brandSlug: string; seriSlug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const kategori = KATEGORI_PRODUK_KOMERSIAL.find(k => k.slug === kategoriSlug);
  const brand = kategoriSlug && brandSlug ? getBrandBySlugAny(kategoriSlug, brandSlug) : undefined;
  const seri = kategoriSlug && brand && seriSlug ? getSeriBySlugAny(kategoriSlug, brand.uuid, seriSlug) : undefined;

  if (!kategori || !brand || !seri) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 56 }}>📦</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Seri Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Slug seri tidak dikenali.</div>
        </div>
      </div>
    );
  }

  const allProduk = getProdukBySeriIdAny(kategoriSlug!, seri.uuid);
  const filtered = query
    ? allProduk.filter(p => p.namaProduk.toLowerCase().includes(query.toLowerCase()))
    : allProduk;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, border: `1.5px solid ${brand.color}44`,
          }}>📦</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              {kategori.nama} · {brand.nama}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{seri.namaSeri}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{allProduk.length} produk (SKU) tersedia</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{filtered.length} dari {allProduk.length} produk</div>
      </div>

      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>📦</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Tidak Ada Hasil</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Coba ubah kata kunci pencarian.</div>
            </div>
          </div>
        ) : (
          filtered.map(p => (
            <ProdukCard
              key={p.slug}
              produk={p}
              brandColor={brand.color}
              brandBg={brand.bg}
              onLihat={() => navigate(`/stok-pakan/komersial/${kategoriSlug}/${brandSlug}/${seriSlug}/${p.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
