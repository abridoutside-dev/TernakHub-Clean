// ─── Jenis Ternak — Master Penyakit ──────────────────────────────────────────
// SP-001/SP-002: Daftar jenis ternak yang didukung aplikasi untuk modul
// Master Penyakit. Dipisahkan dari MasterPenyakitTab.tsx agar Fast Refresh
// bekerja normal (file page tidak boleh mengekspor data non-komponen).

export interface JenisTernakPenyakit {
  uuid: string;
  slug: string;
  icon: string;
  nama: string;
  color: string;
  bg: string;
  /** Angka dummy untuk tampilan — belum terhubung ke data Kategori nyata. */
  jumlahKategori: number;
}

export const JENIS_TERNAK_PENYAKIT: JenisTernakPenyakit[] = [
  {
    uuid: 'jtp-0001-4a3b-9c5f-domba00000001',
    slug: 'domba',
    icon: '🐑',
    nama: 'Domba',
    color: '#1b7a43',
    bg: '#e8f5ee',
    jumlahKategori: 12,
  },
  {
    uuid: 'jtp-0002-4a3b-9c5f-kambing000001',
    slug: 'kambing',
    icon: '🐐',
    nama: 'Kambing',
    color: '#6d4c41',
    bg: '#efebe9',
    jumlahKategori: 12,
  },
  {
    uuid: 'jtp-0003-4a3b-9c5f-sapi00000001',
    slug: 'sapi',
    icon: '🐄',
    nama: 'Sapi',
    color: '#e65100',
    bg: '#fff3e0',
    jumlahKategori: 12,
  },
  {
    uuid: 'jtp-0004-4a3b-9c5f-kerbau0000001',
    slug: 'kerbau',
    icon: '🐃',
    nama: 'Kerbau',
    color: '#546e7a',
    bg: '#eceff1',
    jumlahKategori: 12,
  },
  {
    uuid: 'jtp-0005-4a3b-9c5f-kuda00000001',
    slug: 'kuda',
    icon: '🐴',
    nama: 'Kuda',
    color: '#7b5e2a',
    bg: '#fff8e1',
    jumlahKategori: 12,
  },
  {
    uuid: 'jtp-0006-4a3b-9c5f-babi00000001',
    slug: 'babi',
    icon: '🐷',
    nama: 'Babi',
    color: '#ad1457',
    bg: '#fce4ec',
    jumlahKategori: 12,
  },
];

export function getJenisTernakBySlug(slug: string): JenisTernakPenyakit | undefined {
  return JENIS_TERNAK_PENYAKIT.find((j) => j.slug === slug);
}
