// ─── Layanan Dokter Hewan — Modul Asal (MPK-024) ─────────────────────────────
// Sumber data UTAMA (source of truth) untuk seluruh Layanan Dokter Hewan.
// Marketplace hanya membaca modul ini via Reference UUID — tidak pernah
// menduplikasi, mengubah, atau menyimpan salinan data ini.
//
// Marketplace Constitution:
//   ✅ Data layanan tetap di modul ini.
//   ✅ Marketplace hanya menyimpan Reference UUID.
//   ✅ Perubahan status di sini langsung terefleksi di Marketplace.
//   ❌ Marketplace tidak boleh menyalin field apapun dari modul ini.

export type LayananStatus = 'Aktif' | 'Nonaktif' | 'Ditutup' | 'Diarsipkan';

export interface LayananDokterHewanRecord {
  /** Reference UUID — satu-satunya data yang boleh disimpan Marketplace. */
  uuid: string;
  /** Workspace pemilik layanan ini. */
  workspaceId: string;
  nama: string;
  /** Kategori layanan (Konsultasi | Vaksinasi | Pemeriksaan | Kunjungan Kandang | Operasi). */
  kategori: string;
  subKategori?: string;
  thumbnail: string;
  lokasi: string;
  status: LayananStatus;
  deskripsi?: string;
  namaLengkap: string;
  nomorSIPV?: string;
  spesialisasi: string[];
  hewanYangDitangani: string[];
  modePelayanan: string[];
}

/** Registry layanan dokter hewan per workspace. */
const LAYANAN_DOKTER_HEWAN: LayananDokterHewanRecord[] = [
  {
    uuid: 'a1b2c3d4-d001-4000-8002-000000000001',
    workspaceId: 'w5',
    nama: 'Konsultasi & Kunjungan Kandang',
    kategori: 'Kunjungan Kandang',
    subKategori: 'Konsultasi Umum',
    thumbnail: '👨‍⚕️',
    lokasi: 'Garut, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Kunjungan langsung ke kandang untuk konsultasi kesehatan ternak, diagnosa penyakit, dan rekomendasi penanganan. Jangkauan radius 30 km dari Garut.',
    namaLengkap: 'drh. Amelia Putri, M.Kes',
    nomorSIPV: 'SIPV-12345-JB-2025',
    spesialisasi: ['Kesehatan Ternak Ruminansia', 'Reproduksi Ternak'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    modePelayanan: ['Kunjungan Kandang'],
  },
  {
    uuid: 'a1b2c3d4-d002-4000-8002-000000000002',
    workspaceId: 'w5',
    nama: 'Vaksinasi & Pencegahan Penyakit',
    kategori: 'Vaksinasi',
    subKategori: 'Vaksinasi Massal',
    thumbnail: '💉',
    lokasi: 'Garut, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Layanan vaksinasi ternak untuk pencegahan PMK, Anthrax, Brucellosis, dan penyakit strategis lainnya. Tersedia program vaksinasi individu dan massal.',
    namaLengkap: 'drh. Amelia Putri, M.Kes',
    nomorSIPV: 'SIPV-12345-JB-2025',
    spesialisasi: ['Vaksinologi', 'Kesehatan Masyarakat Veteriner'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda'],
    modePelayanan: ['Kunjungan Kandang', 'Klinik'],
  },
  {
    uuid: 'a1b2c3d4-d003-4000-8002-000000000003',
    workspaceId: 'w5',
    nama: 'Pemeriksaan Kesehatan Rutin',
    kategori: 'Pemeriksaan',
    subKategori: 'Pemeriksaan Berkala',
    thumbnail: '🩺',
    lokasi: 'Garut, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Paket pemeriksaan kesehatan rutin bulanan atau triwulan untuk seluruh populasi ternak. Termasuk pencatatan berat badan, kondisi fisik, dan laporan kesehatan.',
    namaLengkap: 'drh. Amelia Putri, M.Kes',
    nomorSIPV: 'SIPV-12345-JB-2025',
    spesialisasi: ['Manajemen Kesehatan Kawanan', 'Produksi Ternak'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    modePelayanan: ['Kunjungan Kandang'],
  },
  {
    uuid: 'a1b2c3d4-d004-4000-8002-000000000004',
    workspaceId: 'w5',
    nama: 'Konsultasi Reproduksi & Inseminasi Buatan',
    kategori: 'Konsultasi',
    subKategori: 'Reproduksi',
    thumbnail: '🔬',
    lokasi: 'Garut, Jawa Barat',
    status: 'Nonaktif',
    deskripsi: 'Layanan konsultasi reproduksi dan pelaksanaan Inseminasi Buatan (IB) untuk sapi. Sementara tidak tersedia — hubungi untuk jadwal.',
    namaLengkap: 'drh. Amelia Putri, M.Kes',
    nomorSIPV: 'SIPV-12345-JB-2025',
    spesialisasi: ['Reproduksi & Ginekologi Veteriner'],
    hewanYangDitangani: ['Sapi', 'Kerbau'],
    modePelayanan: ['Kunjungan Kandang', 'Klinik'],
  },
];

/** Semua layanan dokter hewan. */
export function getAllLayananDokterHewan(): LayananDokterHewanRecord[] {
  return LAYANAN_DOKTER_HEWAN;
}

/** Layanan dokter hewan berdasarkan workspaceId. */
export function getLayananDokterHewanByWorkspace(workspaceId: string): LayananDokterHewanRecord[] {
  return LAYANAN_DOKTER_HEWAN.filter((l) => l.workspaceId === workspaceId);
}

/** Satu layanan dokter hewan berdasarkan Reference UUID. */
export function getLayananDokterHewanByUuid(uuid: string): LayananDokterHewanRecord | undefined {
  return LAYANAN_DOKTER_HEWAN.find((l) => l.uuid === uuid);
}
