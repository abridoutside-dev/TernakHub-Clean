// ─── Master Obat — Internal Audit Log (SO-006) ───────────────────────────────
// Records every add/update/deactivate/restore/import for internal diagnostics
// only. Never rendered in the UI. Kept in-memory (mirrors the dev-factory
// MEDICINE_LOG_DB pattern) and capped so it can't grow unbounded in a long
// session.

export type MasterObatLogAction = 'add' | 'update' | 'deactivate' | 'restore' | 'import';
export type MasterObatLogEntity = 'kategori' | 'subKategori' | 'detailObat';

export interface MasterObatLogEntry {
  timestamp: string;
  action: MasterObatLogAction;
  entity: MasterObatLogEntity;
  uuid: string;
  detail?: string;
}

const MAX_LOG_ENTRIES = 500;

/** Internal-only log — not surfaced anywhere in the UI. */
export const MASTER_OBAT_LOG: MasterObatLogEntry[] = [];

export function logMasterObatEvent(
  action: MasterObatLogAction,
  entity: MasterObatLogEntity,
  uuid: string,
  detail?: string,
): void {
  const entry: MasterObatLogEntry = { timestamp: new Date().toISOString(), action, entity, uuid, detail };
  MASTER_OBAT_LOG.push(entry);
  if (MASTER_OBAT_LOG.length > MAX_LOG_ENTRIES) MASTER_OBAT_LOG.shift();
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.debug('[MasterObat log]', entry);
}
