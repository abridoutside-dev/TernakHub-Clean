// ─── Produk Komersial — Batch 3 — Adapter ke Registry Generik ────────────────
    // PK-R02C: Menjembatani data Batch 3 (Brand → Seri → Produk, tersebar di
    // produkKomersialBatch3{Brand,Seri,Produk}Data.ts) ke bentuk ProdukKomersialItem
    // generik yang dipakai produkKomersialData.ts (PRODUK_KOMERSIAL_LIST).
    //
    // Ini adalah SATU-SATUNYA cara Batch 3 masuk ke Ringkasan/Dashboard dan ke
    // readiness layer Formula (formulaProdukKomersialData.ts → buildFromKategoriLain).
    // Tidak ada perubahan pada struktur Formula, Master Pakan, Stok, Livestock,
    // Batch 1, Batch 2, maupun Konsentrat.

    import type { ProdukKomersialItem } from './produkKomersialData';
    import { PK_BATCH3_BRAND_LIST } from './produkKomersialBatch3BrandData';
    import { PK_BATCH3_SERI_LIST } from './produkKomersialBatch3SeriData';
    import { PK_BATCH3_PRODUK_LIST } from './produkKomersialBatch3ProdukData';
    import { getPKKategoriNama } from './produkKomersialKategoriNama';

    export function buildBatch3ProdukKomersialItems(): ProdukKomersialItem[] {
    const brandByUUID = new Map(PK_BATCH3_BRAND_LIST.map(b => [b.uuid, b] as const));
    const seriByUUID = new Map(PK_BATCH3_SERI_LIST.map(s => [s.uuid, s] as const));

    return PK_BATCH3_PRODUK_LIST.map(p => {
      const brand = brandByUUID.get(p.brandId);
      const seri = seriByUUID.get(p.seriId);
      const kategoriNama = getPKKategoriNama(p.kategoriSlug);
      return {
        id: p.uuid,
        kategoriId: p.kategoriId,
        brandId: p.brandId,
        kategoriSlug: p.kategoriSlug,
        nama: p.namaProduk,
        merek: brand?.nama ?? '—',
        produsen: brand?.produsen ?? '—',
        updatedAt: p.updatedAt,
        seri: seri?.namaSeri,
        jenisProduk: kategoriNama,
        statusProduksi: p.statusAktif ? 'Aktif' : 'Tidak Diproduksi',
        beratKemasan: p.kemasan,
        satuanDefault: 'kg',
      };
    });
    }

    // Nama kategori ditangani oleh getPKKategoriNama() dari produkKomersialKategoriNama.ts
