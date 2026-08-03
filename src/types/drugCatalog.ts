// ─── Drug Catalog DB Types — ADMIN-FOUNDATION-001 ────────────────────────────
//
// TypeScript types for:
//   drug_catalog          — platform master obat reference catalog
//   drug_categories       — top-level drug categories
//   drug_sub_categories   — sub-categories within a category
//
// Schema: supabase/migrations/20260725000004_reference.sql
// RLS/grants: supabase/migrations/20260803000001_drug_catalog_rls_grants.sql
//
// Rules:
//   - Read-only for authenticated users (SELECT only).
//   - Writes are service_role-only (platform-managed reference data).
//   - Never import from pages or components; only from repositories/services.

// ─── drug_categories ─────────────────────────────────────────────────────────

export interface DrugCategoryDbRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

// ─── drug_sub_categories ─────────────────────────────────────────────────────

export interface DrugSubCategoryDbRow {
  id: string;
  /** FK → drug_categories.id */
  category_id: string;
  name: string;
  created_at: string;
}

// ─── drug_catalog ─────────────────────────────────────────────────────────────

export interface DrugCatalogDbRow {
  id: string;
  /** Primary drug name */
  name: string;
  /** International non-proprietary name (generic name) */
  generic_name: string | null;
  /** FK → drug_categories.id */
  category_id: string | null;
  /** FK → drug_sub_categories.id */
  sub_category_id: string | null;
  /**
   * Array of target animal species codes.
   * e.g. ['sapi', 'kambing', 'domba', 'babi', 'unggas']
   */
  species_targets: string[] | null;
  /** Dosage form: 'Tablet' | 'Injeksi' | 'Sirup' | 'Serbuk' | 'Salep' etc. */
  dosage_form: string | null;
  /** Standard dosage description string */
  standard_dosage: string | null;
  /** Withdrawal period in days (null = no withdrawal) */
  withdrawal_period_days: number | null;
  /** Whether a veterinary prescription is required */
  requires_prescription: boolean;
  /** Manufacturer or brand name */
  manufacturer: string | null;
  /** Free-text description */
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Join shape (for admin views with category name) ─────────────────────────

export interface DrugCatalogWithCategory extends DrugCatalogDbRow {
  drug_categories: { name: string; slug: string; icon: string | null } | null;
  drug_sub_categories: { name: string } | null;
}
