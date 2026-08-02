// ─── RP-008: Registrasi Anak (Offspring Registration) ────────────────────────
// Mengonversi AnakRecord (Temporary Offspring — RP-007) menjadi LivestockRecord
// permanen. Tidak membuat arsitektur registrasi baru: ID Livestock, penulisan
// LIVESTOCK_DB/OWNERSHIP_DB, dan penautan Lineage seluruhnya memanggil fungsi
// yang sudah ada di livestockData.ts (addLivestock/addPedigreeLink) — modul ini
// hanya menyiapkan input dari data Kelahiran + Anak dan menandai Anak sebagai
// 'Sudah Didaftarkan'.
//
// Entry requirement: Anak harus berasal dari Kelahiran yang valid (relasi
// kelahiranId), berjenis 'Hidup' (anak yang lahir mati/mati setelah lahir tidak
// dapat menjadi Livestock hidup), dan belum pernah didaftarkan (statusRegistrasi
// === 'Belum Didaftarkan' && livestockId === null). Satu Anak hanya dapat
// menjadi satu Livestock — divalidasi lewat livestockId, bukan dihitung ulang.

import {
  ANAK_DB,
  getAnakListByKelahiran,
  getKelahiranById,
  type AnakRecord,
  type KelahiranRecord,
} from './kelahiranData';
import { getProgramById, type ReproduksiProgramRecord } from './reproduksiProgramData';
import {
  getLivestock,
  addLivestock,
  addPedigreeLink,
  LIVESTOCK_DB,
  type LivestockRecord,
} from './livestockData';
import { findSpecies } from './speciesData';
import type { EventType, ReproduksiEvent } from './monitoringReproduksiData';
import { getFullTimelineForProgram as getRp007TimelineForProgram } from './kelahiranData';

// ─── Status Kesehatan Awal ─────────────────────────────────────────────────────
// Mirrors AddLivestock.tsx's STATUS_KESEHATAN — bukan bagian dari auto-fill
// (kondisi saat lahir sudah dicatat lewat KondisiAwal RP-007), harus dipilih
// ulang oleh user karena mencerminkan kondisi ternak SAAT didaftarkan.

export const STATUS_KESEHATAN_REGISTRASI_LIST = ['Sehat', 'Sakit', 'Dalam Perawatan', 'Karantina'] as const;
export type StatusKesehatanRegistrasi = typeof STATUS_KESEHATAN_REGISTRASI_LIST[number];

// ─── Auto-fill preview ────────────────────────────────────────────────────────
// Bentuk data yang ditampilkan ke user sebelum melengkapi field yang tersisa.

export type RegistrasiAutoFill = {
  anak: AnakRecord;
  kelahiran: KelahiranRecord;
  program: ReproduksiProgramRecord | null;
  dam: LivestockRecord;
  sire: LivestockRecord | null;
  tanggalLahirLabel: string;   // format Indonesia, siap tampil
  lokasiLahir: string;
  farmCode: string;
};

export type RegistrasiAnakInput = {
  nama: string | null;
  kelamin: 'Jantan' | 'Betina';   // wajib dipilih ulang bila Anak.jenisKelamin === 'Tidak Diketahui'
  lokasi: string;                 // default = lokasiLahir, dapat diubah user
  statusKesehatan: StatusKesehatanRegistrasi;
  catatan: string | null;
};

const FARM_CODE = 'KAY'; // sama dengan konvensi AddLivestock.tsx / idFactory.ts — belum multi-farm.

// ─── ID Ternak ────────────────────────────────────────────────────────────────
// Mengikuti persis konvensi Livestock ID yang sudah ada di AddLivestock.tsx /
// idFactory.ts: {speciesCode}-{genderCode}-{counter:6}-{farmCode}. Konvensi ini
// tidak diubah — hanya di-mirror di sini karena idFactory.ts berada di bawah
// src/dev (utilitas seed, tidak boleh diimpor oleh kode produksi).

const KELAMIN_CODE: Record<'Jantan' | 'Betina', string> = { Jantan: 'J', Betina: 'B' };

function padNumber(n: number): string {
  return String(n).padStart(6, '0');
}

// Scanning existing IDs for the next free counter needs LIVESTOCK_DB itself
// (not getLivestock, which only reads one id at a time) — same cross-module
// access pattern batchData.ts / transferData.ts already use.
function nextLivestockId(speciesCode: string, genderCode: string): string {
  const pattern = new RegExp(`^${speciesCode}-${genderCode}-(\\d+)-${FARM_CODE}$`);
  let max = 0;
  for (const id of Object.keys(LIVESTOCK_DB)) {
    const m = id.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${speciesCode}-${genderCode}-${padNumber(max + 1)}-${FARM_CODE}`;
}

// ─── Tanggal Indonesia (mirrors batchData.ts / dateFactory.ts convention) ─────

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatIndonesianDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d.getTime())) return isoDate;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function ageMonthsBetween(isoBirthDate: string, now: Date): number {
  const birth = new Date(`${isoBirthDate}T00:00:00`);
  if (isNaN(birth.getTime())) return 0;
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function formatAgeLabel(months: number): string {
  if (months < 1) return 'Baru lahir';
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} tahun` : `${years} tahun ${rem} bulan`;
}

// ─── Validasi & lookup ─────────────────────────────────────────────────────────

/** Anak yang berjenis 'Hidup', belum didaftarkan, dan belum punya livestockId — satu-satunya himpunan yang boleh didaftarkan. */
export function getRegistrableAnak(kelahiranId: string): AnakRecord[] {
  return getAnakListByKelahiran(kelahiranId).filter(
    (a) => a.jenis === 'Hidup' && a.statusRegistrasi === 'Belum Didaftarkan' && a.livestockId === null,
  );
}

function resolveSire(program: ReproduksiProgramRecord | null): LivestockRecord | null {
  if (!program) return null;
  // Sire hanya diambil otomatis bila tunggal — bila lebih dari satu pejantan
  // (mis. kawin koloni) atau memakai Data IB (tanpa pejantan fisik terdaftar),
  // sire tetap "tidak diketahui" daripada menebak salah satu secara sepihak.
  if (program.pejantanIds.length !== 1) return null;
  return getLivestock(program.pejantanIds[0]);
}

/** Throws dengan pesan siap tampil bila Anak tidak memenuhi syarat pendaftaran. */
export function validateRegistrasiAnak(anakId: string): { anak: AnakRecord; kelahiran: KelahiranRecord } {
  const anak = ANAK_DB[anakId];
  if (!anak) throw new Error('Data Anak tidak ditemukan.');
  if (anak.statusRegistrasi === 'Sudah Didaftarkan' || anak.livestockId !== null) {
    throw new Error('Anak ini sudah pernah didaftarkan menjadi Ternak.');
  }
  if (anak.jenis !== 'Hidup') {
    throw new Error('Hanya Anak berstatus "Hidup" yang dapat didaftarkan menjadi Ternak.');
  }
  const kelahiran = getKelahiranById(anak.kelahiranId);
  if (!kelahiran) throw new Error('Data Kelahiran terkait tidak ditemukan.');
  return { anak, kelahiran };
}

/** Menyiapkan seluruh data yang bisa diisi otomatis dari Kelahiran/Anak — dipakai untuk pratinjau form. */
export function getRegistrasiAutoFill(anakId: string): RegistrasiAutoFill {
  const { anak, kelahiran } = validateRegistrasiAnak(anakId);
  const program = getProgramById(kelahiran.programId);
  const dam = getLivestock(kelahiran.damId);
  const sire = resolveSire(program);

  return {
    anak,
    kelahiran,
    program,
    dam,
    sire,
    tanggalLahirLabel: formatIndonesianDate(kelahiran.tanggalLahir),
    lokasiLahir: kelahiran.lokasiLahir,
    farmCode: FARM_CODE,
  };
}

function validateRegistrasiInput(anak: AnakRecord, input: RegistrasiAnakInput): string | null {
  if (anak.jenisKelamin === 'Tidak Diketahui' && !input.kelamin) {
    return 'Jenis Kelamin wajib dipilih (tidak diketahui saat kelahiran dicatat).';
  }
  if (!input.lokasi.trim()) return 'Lokasi Kandang wajib diisi.';
  if (!input.statusKesehatan) return 'Status Kesehatan wajib dipilih.';
  return null;
}

/**
 * Mendaftarkan satu Anak menjadi Livestock permanen. Throws dengan pesan
 * siap tampil bila validasi gagal. Memanggil addLivestock + addPedigreeLink
 * (livestockData.ts) — tidak menulis LIVESTOCK_DB/PEDIGREE_DB langsung di sini.
 */
export function registerAnak(anakId: string, input: RegistrasiAnakInput): LivestockRecord {
  const { anak, kelahiran } = validateRegistrasiAnak(anakId);

  const fieldError = validateRegistrasiInput(anak, input);
  if (fieldError) throw new Error(fieldError);

  const program = getProgramById(kelahiran.programId);
  const dam = getLivestock(kelahiran.damId);
  const sire = resolveSire(program);

  const kelamin: 'Jantan' | 'Betina' = anak.jenisKelamin === 'Tidak Diketahui' ? input.kelamin : anak.jenisKelamin;
  const now = new Date();
  const registeredDateIso = now.toISOString().slice(0, 10);
  const ageMonths = ageMonthsBetween(kelahiran.tanggalLahir, now);

  const genderCode = KELAMIN_CODE[kelamin];
  const speciesCode = findSpecies(dam.type)?.code ?? dam.type.charAt(0).toUpperCase();
  const livestockId = nextLivestockId(speciesCode, genderCode);

  const catatanParts = [
    anak.catatan,
    input.catatan,
    anak.warna ? `Warna: ${anak.warna}` : null,
    `Kondisi awal saat lahir: ${anak.kondisiAwal}.`,
  ].filter((s): s is string => !!s && s.trim().length > 0);

  const record = addLivestock({
    id: livestockId,
    name: input.nama?.trim() || null,
    type: dam.type,
    typeIcon: dam.typeIcon,
    typeColor: dam.typeColor,
    typeBg: dam.typeBg,
    ras: anak.ras,
    kelamin,
    birthDate: formatIndonesianDate(kelahiran.tanggalLahir),
    birthDateEstimated: false,
    age: formatAgeLabel(ageMonths),
    ageMonths,
    birthWeight: anak.beratLahir != null ? anak.beratLahir.toFixed(1) : '—',
    weight: anak.beratLahir != null ? anak.beratLahir.toFixed(1) : '—',
    weightUnit: 'Kg',
    program: dam.program,
    status: input.statusKesehatan,
    location: input.lokasi.trim(),
    ownerMethod: 'Lahir',
    ownerNotes: catatanParts.length > 0 ? catatanParts.join(' ') : null,
    issuedBy: kelahiran.petugas,
    registeredDate: formatIndonesianDate(registeredDateIso),
  });

  addPedigreeLink(record.id, dam.id, sire?.id ?? null);

  ANAK_DB[anak.id] = {
    ...anak,
    statusRegistrasi: 'Sudah Didaftarkan',
    livestockId: record.id,
    registeredDate: registeredDateIso,
  };

  return record;
}

export type RegistrasiSemuaResult = {
  berhasil: LivestockRecord[];
  gagal: Array<{ anakId: string; pesan: string }>;
};

/**
 * Register All — mendaftarkan seluruh Anak yang memenuhi syarat dalam satu
 * Kelahiran dengan satu input yang sama (Lokasi/Status Kesehatan/Catatan);
 * field spesifik per-Anak (Ras, Berat Lahir, Jenis Kelamin) tetap diambil dari
 * AnakRecord masing-masing seperti pada pendaftaran satuan.
 */
export function registerAllAnak(
  kelahiranId: string,
  inputBuilder: (anak: AnakRecord) => RegistrasiAnakInput,
): RegistrasiSemuaResult {
  const eligible = getRegistrableAnak(kelahiranId);
  const berhasil: LivestockRecord[] = [];
  const gagal: Array<{ anakId: string; pesan: string }> = [];

  for (const anak of eligible) {
    try {
      berhasil.push(registerAnak(anak.id, inputBuilder(anak)));
    } catch (e) {
      gagal.push({ anakId: anak.id, pesan: e instanceof Error ? e.message : String(e) });
    }
  }

  return { berhasil, gagal };
}

// ─── Timeline integration ─────────────────────────────────────────────────────
// Registrasi Anak tidak menyimpan Timeline-nya sendiri — ia menambahkan Event
// ke Timeline Reproduksi yang sudah ada. getFullTimelineForProgram (RP-007,
// yang sendiri menggabungkan RP-004/RP-005/RP-006) TIDAK diubah; fungsi di
// bawah ini hanya menggabungkan hasilnya dengan Event Registrasi (RP-008).

const EVENT_OFFSPRING_REGISTERED: EventType = 'Anak Didaftarkan';
const EVENT_LIVESTOCK_CREATED: EventType = 'Ternak Terdaftar';

function anakToRegistrasiEvents(a: AnakRecord, programId: string): ReproduksiEvent[] {
  if (a.statusRegistrasi !== 'Sudah Didaftarkan' || !a.livestockId || !a.registeredDate) return [];
  return [
    {
      eventId: `anak-${a.id}-registered`,
      programId,
      eventType: EVENT_OFFSPRING_REGISTERED,
      timestamp: a.registeredDate,
      jam: null,
      petugas: '—',
      catatan: `Anak (${a.jenisKelamin}, Ras: ${a.ras}) didaftarkan menjadi Ternak permanen.`,
      source: 'monitoring',
      livestockId: a.livestockId,
      kelahiranId: a.kelahiranId,
    },
    {
      eventId: `anak-${a.id}-livestock-created`,
      programId,
      eventType: EVENT_LIVESTOCK_CREATED,
      timestamp: a.registeredDate,
      jam: null,
      petugas: '—',
      catatan: `Ternak baru dibuat: ${a.livestockId}.`,
      source: 'monitoring',
      livestockId: a.livestockId,
      kelahiranId: a.kelahiranId,
    },
  ];
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Timeline lengkap satu Program termasuk Registrasi Anak: Timeline RP-007
 * (sudah menggabungkan RP-004/RP-005/RP-006, tidak diubah) + event Registrasi
 * (RP-008), terbaru → terlama.
 */
export function getFullTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const allAnak = Object.values(ANAK_DB).filter((a) => {
    const k = getKelahiranById(a.kelahiranId);
    return k?.programId === program.id;
  });
  const registrasiEvents = allAnak.flatMap((a) => anakToRegistrasiEvents(a, program.id));

  return [
    ...getRp007TimelineForProgram(program),
    ...registrasiEvents,
  ].sort(sortEventsTerbaruKeTerlama);
}
