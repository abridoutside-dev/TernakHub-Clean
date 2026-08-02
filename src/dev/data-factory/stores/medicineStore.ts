// ─── Dev-only Medicine (Obat) log store ─────────────────────────────────────
// Same situation as feedStore.ts: KesehatanHewan.tsx / TambahStokObat.tsx have no
// shared src/data store for medicine today. This dev-only store lets
// MedicineFactory produce realistic data for future wiring, without touching UI.

export type MedicineLogEntry = {
  id: string;
  livestockId: string;
  medicineName: string;
  dose: string;
  date: string;
  notes: string | null;
};

export const MEDICINE_LOG_DB: MedicineLogEntry[] = [];
