// ─── UUID Utility ─────────────────────────────────────────────────────────────
// Standard PK-000A: UUID v4 generator for Produk Komersial entities.
//
// Uses the Web Crypto API (crypto.randomUUID) — browser-native, no external
// dependencies, cryptographically random.
//
// Rules (PK-000A):
// • Call generateUUID() exactly once per new record — at creation time.
// • Store the result immediately; never regenerate for an existing record.
// • Never display UUID values in any UI element.
// • Never use UUID as a sort key or display label.

/**
 * Generates a cryptographically random UUID v4.
 * Must be called by the system at record creation time — never by the user.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
