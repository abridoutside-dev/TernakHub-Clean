// ─── Layanan Transport — Modul Asal (MPK-024) ────────────────────────────────
// Sumber data UTAMA (source of truth) untuk seluruh Layanan Transport.
// Marketplace hanya membaca modul ini via Reference UUID — tidak pernah
// menduplikasi, mengubah, atau menyimpan salinan data ini.
//
// Struktur: setiap LayananTransportRecord mewakili satu jenis layanan yang
// ditawarkan oleh Workspace Transporter. UUID adalah Reference UUID yang
// disimpan di Marketplace sebagai sumber.sumberId.
//
// Marketplace Constitution:
//   ✅ Data layanan tetap di modul ini.
//   ✅ Marketplace hanya menyimpan Reference UUID.
//   ✅ Perubahan status di sini langsung terefleksi di Marketplace.
//   ❌ Marketplace tidak boleh menyalin field apapun dari modul ini.

export type LayananStatus = 'Aktif' | 'Nonaktif' | 'Ditutup' | 'Diarsipkan';

export interface LayananTransportRecord {
  /** Reference UUID — satu-satunya data yang boleh disimpan Marketplace. */
  uuid: string;
  /** Workspace pemilik layanan ini. */
  workspaceId: string;
  nama: string;
  /** Kategori layanan transport (Angkut Ternak | Angkut Pakan | Angkut Lainnya). */
  kategori: string;
  subKategori?: string;
  thumbnail: string;
  lokasi: string;
  status: LayananStatus;
  deskripsi?: string;
  jenisKendaraan: string;
  kapasitasMuatan: string;
  rute?: string;
  targetTernak?: string[];
}

/** Registry layanan transport per workspace. */
const LAYANAN_TRANSPORT: LayananTransportRecord[] = [
  {
    uuid: 'a1b2c3d4-t001-4000-8001-000000000001',
    workspaceId: 'w4',
    nama: 'Jasa Angkut Ternak Garut–Bandung',
    kategori: 'Angkut Ternak',
    subKategori: 'Jarak Menengah',
    thumbnail: '🚚',
    lokasi: 'Garut, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Jasa pengangkutan ternak rute Garut–Bandung. Armada tertutup, berventilasi, kapasitas hingga 10 ekor domba/kambing atau 3 ekor sapi.',
    jenisKendaraan: 'Truk Ternak Tertutup',
    kapasitasMuatan: '10 ekor domba/kambing atau 3 ekor sapi',
    rute: 'Garut – Bandung (PP)',
    targetTernak: ['Sapi', 'Kambing', 'Domba'],
  },
  {
    uuid: 'a1b2c3d4-t002-4000-8001-000000000002',
    workspaceId: 'w4',
    nama: 'Jasa Angkut Ternak Bandung–Sukabumi',
    kategori: 'Angkut Ternak',
    subKategori: 'Jarak Menengah',
    thumbnail: '🚚',
    lokasi: 'Bandung, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Pengangkutan ternak rute Bandung–Sukabumi. Supir berpengalaman, dilengkapi alas anti-selip.',
    jenisKendaraan: 'Pick-up Bak Terbuka',
    kapasitasMuatan: '5 ekor domba/kambing atau 2 ekor sapi',
    rute: 'Bandung – Sukabumi (PP)',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
  {
    uuid: 'a1b2c3d4-t003-4000-8001-000000000003',
    workspaceId: 'w4',
    nama: 'Jasa Angkut Pakan Curah',
    kategori: 'Angkut Pakan',
    subKategori: 'Pakan Kering',
    thumbnail: '🚛',
    lokasi: 'Garut, Jawa Barat',
    status: 'Aktif',
    deskripsi: 'Pengangkutan pakan curah (dedak, jagung, konsentrat) dalam karung. Kapasitas 2 ton per pengiriman.',
    jenisKendaraan: 'Truk Pickup',
    kapasitasMuatan: '2 ton',
    rute: 'Jawa Barat (area Priangan)',
    targetTernak: [],
  },
  {
    uuid: 'a1b2c3d4-t004-4000-8001-000000000004',
    workspaceId: 'w4',
    nama: 'Jasa Sewa Timbangan Ternak Portable',
    kategori: 'Angkut Lainnya',
    subKategori: 'Peralatan',
    thumbnail: '⚖️',
    lokasi: 'Garut, Jawa Barat',
    status: 'Nonaktif',
    deskripsi: 'Sewa timbangan ternak portable, kapasitas 500 kg. Tersedia harian dan mingguan.',
    jenisKendaraan: '—',
    kapasitasMuatan: 'N/A',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
  {
    uuid: 'a1b2c3d4-t005-4000-8001-000000000005',
    workspaceId: 'w4',
    nama: 'Jasa Angkut Ternak Lintas Kota (Jawa Barat)',
    kategori: 'Angkut Ternak',
    subKategori: 'Jarak Jauh',
    thumbnail: '🚚',
    lokasi: 'Garut, Jawa Barat',
    status: 'Ditutup',
    deskripsi: 'Layanan ini sementara ditutup untuk pemeliharaan armada. Akan kembali tersedia pada bulan depan.',
    jenisKendaraan: 'Truk Ternak Besar',
    kapasitasMuatan: '20 ekor domba/kambing atau 6 ekor sapi',
    rute: 'Seluruh Jawa Barat',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
];

/** Semua layanan transport. */
export function getAllLayananTransport(): LayananTransportRecord[] {
  return LAYANAN_TRANSPORT;
}

/** Layanan transport berdasarkan workspaceId. */
export function getLayananTransportByWorkspace(workspaceId: string): LayananTransportRecord[] {
  return LAYANAN_TRANSPORT.filter((l) => l.workspaceId === workspaceId);
}

/** Satu layanan transport berdasarkan Reference UUID. */
export function getLayananTransportByUuid(uuid: string): LayananTransportRecord | undefined {
  return LAYANAN_TRANSPORT.find((l) => l.uuid === uuid);
}
