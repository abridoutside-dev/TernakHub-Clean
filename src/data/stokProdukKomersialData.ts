// ─── Stok Pakan Integration Readiness — Produk Komersial ──────────────────────
// PK-006: Menyiapkan agar SELURUH Produk Komersial dapat dipilih sebagai item
// persediaan pada modul Stok Pakan di masa depan — TANPA mengubah struktur
// Stok Pakan yang sudah ada, Master Pakan, atau membuat transaksi apa pun.
// Modul ini murni lapisan kesiapan (readiness): sebuah bridge/adapter di atas
// Living Database Produk Komersial yang sudah ada (PK-001..PK-004), belum
// digunakan oleh halaman/komponen Stok Pakan manapun.
//
// Prinsip:
// • Tidak ada data hardcode baru. Seluruh referensi DITURUNKAN (derived) live
//   dari Living Database: KONSENTRAT_SERI_LIST, KONSENTRAT_DETAIL_LIST,
//   KONSENTRAT_MEREK_LIST, dan PRODUK_KOMERSIAL_LIST (kategori lain — saat ini
//   kosong, akan otomatis ikut begitu diisi, tanpa perlu ubah file ini).
// • Setiap entri WAJIB memiliki UUID permanen (PK-000A) sebagai satu-satunya
//   identitas yang boleh digunakan Stok Pakan untuk merujuk ke sebuah produk —
//   mekanisme relasi yang sama seperti Stok merujuk item Master Pakan.
// • Produk dengan statusProduksi 'Tidak Diproduksi' tetap tersimpan di database
//   (tidak dihapus), namun disembunyikan secara default saat menambah stok
//   baru — hanya muncul jika eksplisit diminta (includeInactive), mis. untuk
//   melihat riwayat stok lama.
//
// Modul Stok Pakan (di masa depan) akan dapat mencatat Stok Masuk, Stok Keluar,
// Penyesuaian Stok, dan Riwayat Stok baik dari Master Pakan maupun Produk
// Komersial menggunakan mekanisme yang sama. Modul ini menyiapkan sisi Produk
// Komersial dari kontrak tersebut. Belum ada transaksi/mutasi stok apa pun
// yang dibuat pada fase ini — hanya bentuk data & lookup read-only.

import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { KONSENTRAT_MEREK_LIST } from './konsentratMerekData';
import { getKonsentratDetailBySeriId } from './konsentratDetailData';
import { KATEGORI_UUID, PRODUK_KOMERSIAL_LIST, getKategoriSlugByUUID } from './produkKomersialData';

// ─── Kontrak Referensi Stok ────────────────────────────────────────────────────

/**
 * Bentuk siap-pakai satu Produk Komersial untuk direferensikan modul Stok
 * Pakan. Field relasi (uuid, brandId, kategoriId) WAJIB UUID — tidak pernah
 * nama/slug. Kontrak ini yang akan dikonsumsi Stok Pakan nanti, disamakan
 * mekanismenya dengan cara Stok Pakan merujuk item Master Pakan.
 */
export interface StokProdukKomersialRef {
  /** UUID v4 permanen produk (PK-000A) — satu-satunya identitas untuk relasi Stok. */
  uuid: string;
  /** UUID brand/merek pemilik produk. */
  brandId: string;
  /** UUID kategori Produk Komersial (mis. Konsentrat, Premix, dst). */
  kategoriId: string;

  // ── Tampilan & data minimal Stok (bukan untuk relasi) ─────────────────────
  brandNama: string;
  seriNama: string;
  namaProduk: string;
  /** Jenis produk / nama kategori — mis. "Konsentrat", "Premix". */
  jenisProduk: string;
  /** Satuan default pencatatan stok — diturunkan dari beratKemasan, fallback "kg". */
  satuanDefault: string;
  /** Berat kemasan standar produk — mis. "50 kg". */
  beratKemasan: string;
  /** true jika statusProduksi === 'Aktif'. Menentukan tampil/tidaknya saat menambah stok baru. */
  statusAktif: boolean;
}

/** Ekstrak satuan dari string beratKemasan (mis. "50 kg" -> "kg"), fallback "kg". */
function ekstrakSatuan(beratKemasan: string): string {
  const match = beratKemasan.trim().split(/\s+/);
  return match.length > 1 ? match[match.length - 1] : 'kg';
}

// ─── Adapter: Konsentrat (satu-satunya kategori dengan data konkret saat ini) ─

function buildFromKonsentrat(): StokProdukKomersialRef[] {
  const merekByUUID = new Map(KONSENTRAT_MEREK_LIST.map(m => [m.uuid, m] as const));
  const kategoriId = KATEGORI_UUID['konsentrat'];

  return KONSENTRAT_SERI_LIST.map(seri => {
    const brand = merekByUUID.get(seri.brandId);
    const detail = getKonsentratDetailBySeriId(seri.uuid);
    return {
      uuid: seri.uuid,
      brandId: seri.brandId,
      kategoriId,
      brandNama: brand?.nama ?? '—',
      seriNama: seri.namaSeri,
      namaProduk: detail?.namaProduk ?? seri.namaProduk,
      jenisProduk: detail?.jenisProduk ?? 'Konsentrat',
      satuanDefault: ekstrakSatuan(seri.beratKemasan),
      beratKemasan: seri.beratKemasan,
      statusAktif: seri.statusProduksi === 'Aktif',
    };
  });
}

// ─── Adapter: kategori lain via PRODUK_KOMERSIAL_LIST ─────────────────────────
// PK-001..PK-003 baru membangun struktur untuk kategori selain Konsentrat;
// PRODUK_KOMERSIAL_LIST menjadi tempat entri kategori lain begitu diisi.
// Konsentrat dikecualikan di sini (sudah dicakup buildFromKonsentrat(), sumber
// datanya lebih lengkap) agar tidak pernah terjadi UUID ganda antar adapter.

function buildFromKategoriLain(): StokProdukKomersialRef[] {
  // Kategori selain Konsentrat belum memiliki Living Database detail sendiri
  // (seri/merek/beratKemasan per kategori). Field opsional pada
  // ProdukKomersialItem (jenisProduk, satuanDefault, beratKemasan,
  // statusProduksi) hanya diisi jika data konkret sudah ada — TIDAK direka
  // (hardcode). Fallback di bawah hanya untuk field tampilan generik
  // (jenisProduk dari nama kategori, satuanDefault 'kg' sebagai konvensi
  // industri pakan saat berat kemasan belum diketahui), bukan status.
  const kategoriKonsentratId = KATEGORI_UUID['konsentrat'];
  return PRODUK_KOMERSIAL_LIST.filter(item => item.kategoriId !== kategoriKonsentratId).map(item => ({
    uuid: item.id,
    brandId: item.brandId,
    kategoriId: item.kategoriId,
    brandNama: item.merek,
    seriNama: item.seri ?? item.nama,
    namaProduk: item.nama,
    jenisProduk: item.jenisProduk ?? getKategoriSlugByUUID(item.kategoriId) ?? '—',
    satuanDefault: item.satuanDefault ?? ekstrakSatuan(item.beratKemasan ?? ''),
    beratKemasan: item.beratKemasan ?? '—',
    // Tidak diketahui = anggap 'Tidak Diproduksi' (disembunyikan default) demi
    // keamanan, bukan diasumsikan aktif tanpa dasar data.
    statusAktif: item.statusProduksi === 'Aktif',
  }));
}

// ─── API Publik ────────────────────────────────────────────────────────────────

/**
 * Seluruh Produk Komersial (aktif maupun tidak diproduksi), live dari Living
 * Database. Menjamin UUID unik di seluruh sumber — jika ditemukan UUID ganda
 * antar adapter (seharusnya tidak pernah terjadi berkat partisi kategori di
 * atas), entri duplikat dibuang dan dicatat sebagai error agar cepat terdeteksi.
 */
export function getAllStokProdukKomersial(): StokProdukKomersialRef[] {
  const merged = [...buildFromKonsentrat(), ...buildFromKategoriLain()];
  const seen = new Set<string>();
  const deduped: StokProdukKomersialRef[] = [];
  for (const item of merged) {
    if (seen.has(item.uuid)) {
      console.error(`[PK-006] UUID Produk Komersial ganda terdeteksi: ${item.uuid} — entri diabaikan.`);
      continue;
    }
    seen.add(item.uuid);
    deduped.push(item);
  }
  return deduped;
}

/**
 * Produk Komersial yang layak ditampilkan saat menambah stok baru.
 * Default: hanya yang statusAktif=true (produk 'Tidak Diproduksi' disembunyikan
 * namun tetap ada di database, tetap dapat muncul pada Riwayat Stok lama).
 * Set includeInactive=true untuk melihat semua, mis. untuk Riwayat Stok/admin.
 */
export function getStokSelectableProdukKomersial(
  includeInactive = false,
): StokProdukKomersialRef[] {
  const all = getAllStokProdukKomersial();
  return includeInactive ? all : all.filter(item => item.statusAktif);
}

/** Lookup satu Produk Komersial via UUID — satu-satunya cara Stok boleh merujuk produk. */
export function getStokProdukKomersialByUUID(uuid: string): StokProdukKomersialRef | undefined {
  return getAllStokProdukKomersial().find(item => item.uuid === uuid);
}

// ─── Kesiapan Jenis Pergerakan Stok ────────────────────────────────────────────
// Kontrak jenis pergerakan yang nantinya dicatat modul Stok Pakan untuk Produk
// Komersial, menggunakan mekanisme yang sama dengan Master Pakan. Belum ada
// data/transaksi yang dibuat pada fase ini — ini hanya definisi tipe untuk
// dikonsumsi implementasi Stok Pakan berikutnya.
export type StokProdukKomersialJenisPergerakan =
  | 'Stok Masuk'
  | 'Stok Keluar'
  | 'Penyesuaian Stok';

/**
 * Bentuk satu baris Riwayat Stok untuk Produk Komersial — disamakan strukturnya
 * dengan Riwayat Stok Master Pakan (referensi item via UUID, bukan nama/slug).
 * Kontrak ini BELUM diisi/dipakai — disiapkan agar modul Stok Pakan dapat
 * langsung mengadopsi bentuk yang konsisten saat transaksi mulai dibangun.
 */
export interface StokProdukKomersialRiwayatEntry {
  /** UUID Produk Komersial (relasi ke StokProdukKomersialRef.uuid). */
  produkUuid: string;
  jenis: StokProdukKomersialJenisPergerakan;
  jumlah: number;
  satuan: string;
  tanggal: string; // ISO date
  keterangan?: string;
}
