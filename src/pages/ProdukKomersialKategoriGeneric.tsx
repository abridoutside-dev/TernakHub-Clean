// ─── Produk Komersial — Kategori Generik (Batch 1) ────────────────────────────
// PK-R02A: Halaman daftar Brand untuk kategori Batch 1 (Complete Feed, Premix,
// Mineral Mix, Vitamin, Feed Additive). Generik lintas-kategori — dipilih via
// param URL :kategoriSlug — mengikuti pola halaman Konsentrat (PK-002) tanpa
// menduplikasi 5 halaman terpisah.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KATEGORI_PRODUK_KOMERSIAL } from '../data/produkKomersialData';
import {
  getBrandsByKategoriSlugAny, getSeriByBrandIdAny, getJumlahProdukByKategoriSlugAny,
  type GenericBrand,
} from '../data/produkKomersialGenericResolver';

function BrandCard({ brand, jumlahSeri, onLihat }: { brand: GenericBrand; jumlahSeri: number; onLihat: () => void }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      <div style={{ width: 4, background: brand.color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {brand.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.2 }}>{brand.nama}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>{brand.produsen}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>🌍 {brand.negaraAsal}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: brand.color, background: brand.bg,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {jumlahSeri} seri
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--color-border)' }} />
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {brand.deskripsi}
        </p>
        <button type="button" onClick={onLihat} style={{
          alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${brand.color}`, background: 'transparent', color: brand.color,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Lihat Produk →
        </button>
      </div>
    </div>
  );
}

export default function ProdukKomersialKategoriGeneric() {
  const { kategoriSlug } = useParams<{ kategoriSlug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const kategori = KATEGORI_PRODUK_KOMERSIAL.find(k => k.slug === kategoriSlug);
  const brands = kategoriSlug ? getBrandsByKategoriSlugAny(kategoriSlug) : [];
  const totalProduk = kategoriSlug ? getJumlahProdukByKategoriSlugAny(kategoriSlug) : 0;

  if (!kategori) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 56 }}>🏷️</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Kategori Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Slug kategori tidak dikenali.</div>
        </div>
      </div>
    );
  }

  const filtered = query
    ? brands.filter(b => b.nama.toLowerCase().includes(query.toLowerCase()) || b.produsen.toLowerCase().includes(query.toLowerCase()))
    : brands;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: kategori.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${kategori.color}44`,
          }}>
            {kategori.icon}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Kategori · Produk Komersial
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{kategori.nama}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {brands.length} merek/produsen · {totalProduk} produk
            </div>
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
            placeholder="Cari nama merek atau produsen..."
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
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {brands.length} merek/produsen
        </div>
      </div>

      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>{kategori.icon}</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Tidak Ada Hasil</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Coba ubah kata kunci pencarian.</div>
            </div>
          </div>
        ) : (
          filtered.map(b => (
            <BrandCard
              key={b.slug}
              brand={b}
              jumlahSeri={getSeriByBrandIdAny(kategoriSlug!, b.uuid).length}
              onLihat={() => navigate(`/stok-pakan/komersial/${kategoriSlug}/${b.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
