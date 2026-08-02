// ─── Layanan Klinik Hewan — Modul Asal (MPK-024) ─────────────────────────────
// Sumber data UTAMA (source of truth) untuk seluruh Layanan Klinik Hewan.
// Marketplace hanya membaca modul ini via Reference UUID — tidak pernah
// menduplikasi, mengubah, atau menyimpan salinan data ini.
//
// Marketplace Constitution:
//   ✅ Data layanan tetap di modul ini.
//   ✅ Marketplace hanya menyimpan Reference UUID.
//   ✅ Perubahan status di sini langsung terefleksi di Marketplace.
//   ❌ Marketplace tidak boleh menyalin field apapun dari modul ini.

export type LayananStatus = 'Aktif' | 'Nonaktif' | 'Ditutup' | 'Diarsipkan';

export interface LayananKlinikHewanRecord {
  /** Reference UUID — satu-satunya data yang boleh disimpan Marketplace. */
  uuid: string;
  /** Workspace pemilik layanan ini. */
  workspaceId: string;
  nama: string;
  /** Kategori layanan (Rawat Jalan | Rawat Inap | Layanan Darurat | Laboratorium | Bedah). */
  kategori: string;
  subKategori?: string;
  thumbnail: string;
  lokasi: string;
  status: LayananStatus;
  deskripsi?: string;
  namaKlinik: string;
  nomorIzin?: string;
  fasilitas: string[];
  hewanYangDitangani: string[];
  jamOperasional?: string;
}

/** Registry layanan klinik hewan per workspace. */
const LAYANAN_KLINIK_HEWAN: LayananKlinikHewanRecord[] = [
  {
    uuid: 'a1b2c3d4-k001-4000-8003-000000000001',
    workspaceId: 'w6',
    nama: 'Layanan Rawat Jalan Ternak',
    kategori: 'Rawat Jalan',
    subKategori: 'Umum',
    thumbnail: '🏥',
    lokasi: 'Tasikmalaya, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Pemeriksaan dan penanganan penyakit ternak tanpa rawat inap. Tersedia Senin–Sabtu pukul 08.00–17.00.',
    namaKlinik: 'Klinik Hewan Sejahtera',
    nomorIzin: 'IKH-4567-TLY-2024',
    fasilitas: ['Ruang Periksa Ternak Besar', 'Ruang Periksa Ternak Kecil', 'Apotek Hewan', 'Laboratorium Dasar'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda'],
    jamOperasional: 'Senin–Sabtu, 08.00–17.00',
  },
  {
    uuid: 'a1b2c3d4-k002-4000-8003-000000000002',
    workspaceId: 'w6',
    nama: 'Layanan Rawat Inap',
    kategori: 'Rawat Inap',
    subKategori: 'Ternak Besar',
    thumbnail: '🛏️',
    lokasi: 'Tasikmalaya, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Fasilitas rawat inap untuk ternak yang membutuhkan pemantauan intensif. Kapasitas 6 ekor ternak besar atau 12 ekor ternak kecil.',
    namaKlinik: 'Klinik Hewan Sejahtera',
    nomorIzin: 'IKH-4567-TLY-2024',
    fasilitas: ['Kandang Rawat Inap Berpendingin', 'Monitoring 24 Jam', 'Infus & Cairan', 'Isolasi Penyakit Menular'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    jamOperasional: '24 jam',
  },
  {
    uuid: 'a1b2c3d4-k003-4000-8003-000000000003',
    workspaceId: 'w6',
    nama: 'Layanan Darurat 24 Jam',
    kategori: 'Layanan Darurat',
    subKategori: 'Emergency',
    thumbnail: '🚨',
    lokasi: 'Tasikmalaya, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Penanganan darurat ternak 24 jam termasuk distokia (kesulitan melahirkan), kolik, keracunan, dan kondisi mengancam jiwa lainnya.',
    namaKlinik: 'Klinik Hewan Sejahtera',
    nomorIzin: 'IKH-4567-TLY-2024',
    fasilitas: ['Ruang Operasi', 'Anestesi Hewan', 'Ventilator', 'ICU Hewan'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda', 'Babi'],
    jamOperasional: '24 jam (hubungi nomor darurat)',
  },
  {
    uuid: 'a1b2c3d4-k004-4000-8003-000000000004',
    workspaceId: 'w6',
    nama: 'Pemeriksaan Laboratorium',
    kategori: 'Laboratorium',
    subKategori: 'Diagnostik',
    thumbnail: '🔬',
    lokasi: 'Tasikmalaya, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Pemeriksaan darah lengkap, feses (parasite), urine, kultur bakteri, dan sensitivitas antibiotik. Hasil tersedia dalam 1–3 hari kerja.',
    namaKlinik: 'Klinik Hewan Sejahtera',
    nomorIzin: 'IKH-4567-TLY-2024',
    fasilitas: ['Hematologi Analyzer', 'Mikroskopi', 'Kultur Mikrobiologi', 'PCR Dasar'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda', 'Babi'],
    jamOperasional: 'Senin–Jumat, 08.00–14.00',
  },
  {
    uuid: 'a1b2c3d4-k005-4000-8003-000000000005',
    workspaceId: 'w6',
    nama: 'Layanan Bedah Ternak',
    kategori: 'Bedah',
    subKategori: 'Operasi Elektif',
    thumbnail: '🩺',
    lokasi: 'Tasikmalaya, Jawa Barat',
    status: 'Ditutup',
    deskripsi: 'Layanan bedah ternak (kastrasi, abomasum displacement, operasi luka) sementara ditutup untuk renovasi ruang operasi. Diperkirakan kembali tersedia bulan depan.',
    namaKlinik: 'Klinik Hewan Sejahtera',
    nomorIzin: 'IKH-4567-TLY-2024',
    fasilitas: ['Ruang Operasi Steril', 'Anestesi Umum & Lokal'],
    hewanYangDitangani: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    jamOperasional: 'Senin–Jumat (dengan perjanjian)',
  },
];

/** Semua layanan klinik hewan. */
export function getAllLayananKlinikHewan(): LayananKlinikHewanRecord[] {
  return LAYANAN_KLINIK_HEWAN;
}

/** Layanan klinik hewan berdasarkan workspaceId. */
export function getLayananKlinikHewanByWorkspace(workspaceId: string): LayananKlinikHewanRecord[] {
  return LAYANAN_KLINIK_HEWAN.filter((l) => l.workspaceId === workspaceId);
}

/** Satu layanan klinik hewan berdasarkan Reference UUID. */
export function getLayananKlinikHewanByUuid(uuid: string): LayananKlinikHewanRecord | undefined {
  return LAYANAN_KLINIK_HEWAN.find((l) => l.uuid === uuid);
}
