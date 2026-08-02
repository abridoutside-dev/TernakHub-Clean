// ─── Produk Komersial — Brand → Seri Generik (Batch 1) ────────────────────────
// PK-R02A: Halaman daftar Seri milik satu Brand. Generik lintas-kategori Batch 1.
// Klik "Lihat Produk" pada satu seri membuka daftar Produk (SKU) di dalamnya.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KATEGORI_PRODUK_KOMERSIAL } from '../data/produkKomersialData';
import {
  getBrandBySlugAny, getSeriByBrandIdAny, getProdukBySeriIdAny, type GenericSeri,
} from '../data/produkKomersialGenericResolver';

function SeriCard({ seri, brandColor, jumlahProduk, onLihat }: {
  seri: GenericSeri; brandColor: string; jumlahProduk: number; onLihat: () => void;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'stretch', overflow: 'hidden',
    }}>
      <div style={{ width: 4, background: brandColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '13px 12px 12px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 2 }}>{seri.namaSeri}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.3 }}>{seri.targetTernak}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: brandColor, background: `${brandColor}18`,
            borderRadius: 20, padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {jumlahProduk} produk
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--color-border)' }} />
        <p style={{
          margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {seri.deskripsi}
        </p>
        <button type="button" onClick={onLihat} style={{
          alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${brandColor}`, background: 'transparent', color: brandColor,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Lihat Produk →
        </button>
      </div>
    </div>
  );
}

export default function ProdukKomersialBrandSeriGeneric() {
  const { kategoriSlug, brandSlug } = useParams<{ kategoriSlug: string; brandSlug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const kategori = KATEGORI_PRODUK_KOMERSIAL.find(k => k.slug === kategoriSlug);
  const brand = kategoriSlug && brandSlug ? getBrandBySlugAny(kategoriSlug, brandSlug) : undefined;

  if (!kategori || !brand) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 56 }}>🏭</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Brand Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Slug brand tidak dikenali.</div>
        </div>
      </div>
    );
  }

  const allSeri = getSeriByBrandIdAny(kategoriSlug!, brand.uuid);
  const filtered = query
    ? allSeri.filter(s =>
        s.namaSeri.toLowerCase().includes(query.toLowerCase()) ||
        s.targetTernak.toLowerCase().includes(query.toLowerCase()),
      )
    : allSeri;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${brand.color}44`,
          }}>
            {brand.logo}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              {kategori.nama} · Seri Produk
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{brand.nama}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{allSeri.length} seri/lini produk tersedia</div>
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
            placeholder="Cari nama seri atau target ternak..."
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
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{filtered.length} dari {allSeri.length} seri</div>
      </div>

      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>{brand.logo}</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Tidak Ada Hasil</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Coba ubah kata kunci pencarian.</div>
            </div>
          </div>
        ) : (
          filtered.map(s => (
            <SeriCard
              key={s.slug}
              seri={s}
              brandColor={brand.color}
              jumlahProduk={getProdukBySeriIdAny(kategoriSlug!, s.uuid).length}
              onLihat={() => navigate(`/stok-pakan/komersial/${kategoriSlug}/${brandSlug}/${s.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
