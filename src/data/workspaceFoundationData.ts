// ─── Workspace Slug Utilities — DB-001B-3 ────────────────────────────────────
//
// Pure slug helpers used by workspaceService.ts for UX slug suggestions.
//
// HISTORY:
//   This file previously held an in-memory WORKSPACE_DB (WS-001/P0-001B).
//   That in-memory store has been removed as part of DB-001B-3: the Supabase
//   `workspaces` table (via workspaceRepository.ts) is now the sole source of
//   truth for all workspace records.
//
// RULES:
//   - deriveSlug  : pure string transform, no side-effects, no imports.
//   - isSlugTaken : always returns false — slug uniqueness is enforced by the
//                   Supabase UNIQUE constraint on workspaces.metadata->>'slug'.
//                   This function is kept for API compatibility with
//                   workspaceService.ts and generates no false positives.
//   - Do NOT re-add WORKSPACE_DB or any in-memory store here.
//   - Do NOT import from pages, components, or contexts.

// ─── Slug helpers ─────────────────────────────────────────────────────────────

/**
 * Converts a workspace name to a URL-safe slug.
 * e.g. "Berkah Farm Garut" → "berkah-farm-garut"
 */
export function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '');          // trim leading/trailing hyphens
}

/**
 * Returns whether a slug is already taken.
 *
 * Always returns `false` — slug uniqueness is enforced by the Supabase
 * UNIQUE constraint on the `workspaces` table.  The function is preserved
 * for API compatibility; callers should treat it as a best-effort UX hint
 * only and rely on the Supabase constraint as the authoritative guard.
 */
export function isSlugTaken(
  _slug: string,
  _excludeUuid?: string,
): boolean {
  return false;
}
