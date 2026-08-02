// ─── Master Pakan — Kategori Induk item counts ───────────────────────────────
// Computes the "jumlah item" badge for each kategori induk directly from the
// same source data used by each category's sub-category list page. Never
// hardcode counts here — always derive from the underlying data source so the
// badge stays in sync automatically as references are added or removed.

import { getJagungList } from './jagungData';
import { getPadiList } from './padiData';
import { getRumputList } from './rumputData';
import { getLeguminosaList } from './leguminosaData';
import { getAllDaunanDetailItems } from './daunanDetailData';
import { getAllKacangBijianDetailItems } from './kacangBijianDetailData';
import { getAllUmbiDetailItems } from './umbiDetailData';
import { getAllSerealiaDetailItems } from './serealiaDetailData';
import { getKelapaList } from './kelapaData';
import { getKelapaSawitList } from './kelapaSawitData';
import { getTebuList } from './tebuData';
import { getBuahLimbahList } from './buahLimbahBuahData';
import { getLimbahIndustriList } from './limbahIndustriPanganData';
import { getSumberProteinHewaniList } from './sumberProteinHewaniData';
import { getMineralList } from './mineralData';
import { getVitaminFeedAdditiveList } from './vitaminFeedAdditiveData';
import { getBahanCairList } from './bahanCairData';
import { getLainnyaList } from './lainnyaData';
import { KATEGORI_INDUK, type KategoriInduk } from './masterPakanKategoriData';

// Maps each kategori induk slug to the function that returns its authoritative
// list of items — the exact same source used by the corresponding sub-category
// list page — so the counted total always matches what the user sees there.
// Keyed by `KategoriInduk['slug']` so a slug added to KATEGORI_INDUK without a
// matching counter here fails to type-check instead of silently showing 0.
const KATEGORI_ITEM_COUNTERS: Record<KategoriInduk['slug'], () => number> = {
  'jagung':                  () => getJagungList().length,
  'padi':                    () => getPadiList().length,
  'rumput':                  () => getRumputList().length,
  'leguminosa':              () => getLeguminosaList().length,
  'daun-daunan':             () => getAllDaunanDetailItems().length,
  'kacang-biji-bijian':      () => getAllKacangBijianDetailItems().length,
  'umbi-umbian':             () => getAllUmbiDetailItems().length,
  'serealia-lain':           () => getAllSerealiaDetailItems().length,
  'kelapa':                  () => getKelapaList().length,
  'kelapa-sawit':            () => getKelapaSawitList().length,
  'tebu':                    () => getTebuList().length,
  'buah-limbah-buah':        () => getBuahLimbahList().length,
  'limbah-industri-pangan':  () => getLimbahIndustriList().length,
  'sumber-protein-hewani':   () => getSumberProteinHewaniList().length,
  'mineral':                 () => getMineralList().length,
  'vitamin-feed-additive':   () => getVitaminFeedAdditiveList().length,
  'bahan-cair':              () => getBahanCairList().length,
  'lainnya':                 () => getLainnyaList().length,
};

/** Returns the current number of items for a kategori induk, computed live from its data source. */
export function getKategoriItemCount(slug: KategoriInduk['slug']): number {
  return KATEGORI_ITEM_COUNTERS[slug]();
}

/**
 * Returns the total item count across ALL 18 kategori induk, summing each
 * category's live data source.  Use this instead of getMasterPakanList().length
 * (which only reflects the legacy flat DB, not the per-category modules).
 */
export function getTotalAllKategoriCount(): number {
  return KATEGORI_INDUK.reduce((sum, k) => sum + KATEGORI_ITEM_COUNTERS[k.slug](), 0);
}
