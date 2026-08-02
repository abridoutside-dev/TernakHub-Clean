// ─── Produk Komersial Obat — Internal Audit Log (PKO-007) ────────────────────
// Records every import/export/merge/replace for internal diagnostics only.
// Never rendered in the UI. Mirrors the masterObatAuditLog.ts pattern — kept
// in-memory and capped so it can't grow unbounded in a long session.

export type ProdukKomersialObatLogAction = 'import' | 'export' | 'merge' | 'replace';
export type ProdukKomersialObatLogEntity = 'brand' | 'produk';

export interface ProdukKomersialObatLogEntry {
  timestamp: string;
  action: ProdukKomersialObatLogAction;
  entity: ProdukKomersialObatLogEntity;
  detail?: string;
}

const MAX_LOG_ENTRIES = 500;

/** Internal-only log — not surfaced anywhere in the UI. */
export const PRODUK_KOMERSIAL_OBAT_LOG: ProdukKomersialObatLogEntry[] = [];

export function logProdukKomersialObatEvent(
  action: ProdukKomersialObatLogAction,
  entity: ProdukKomersialObatLogEntity,
  detail?: string,
): void {
  const entry: ProdukKomersialObatLogEntry = { timestamp: new Date().toISOString(), action, entity, detail };
  PRODUK_KOMERSIAL_OBAT_LOG.push(entry);
  if (PRODUK_KOMERSIAL_OBAT_LOG.length > MAX_LOG_ENTRIES) PRODUK_KOMERSIAL_OBAT_LOG.shift();
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.debug('[ProdukKomersialObat log]', entry);
}
