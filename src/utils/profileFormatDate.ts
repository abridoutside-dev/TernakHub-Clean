// ─── Profile Date Formatter ────────────────────────────────────────────────────
// Shared helper used by Profile, ProfileAccount, ProfileWorkspaceDetail.
// Formats an ISO date string (YYYY-MM-DD) to a human-readable Indonesian date
// like "3 Jul 2026". Falls back to the raw string if parsing fails.

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatTanggalPendek(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN_SHORT[m - 1]} ${y}`;
}
