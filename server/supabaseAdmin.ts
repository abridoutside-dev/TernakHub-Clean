// ─── Supabase Server Client — DB-001D-1 ──────────────────────────────────────
//
// Lightweight Supabase REST helper for server-side use.
// Always uses the calling user's JWT so RLS policies are enforced — no
// service-role key required or stored.
//
// SECURITY: Never log the JWT or any credential value.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? process.env.SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL)      console.error('[Supabase] Missing SUPABASE_URL / VITE_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) console.error('[Supabase] Missing SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY');

export class SupabaseServerError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly pgCode?: string,
  ) {
    super(message);
    this.name = 'SupabaseServerError';
  }
}

type DbRecord = Record<string, unknown>;

/**
 * INSERT a single row into a Supabase table using the caller's JWT.
 * Returns the inserted row (Prefer: return=representation).
 */
export async function supabaseServerInsert(
  table: string,
  row: DbRecord,
  jwt: string,
): Promise<DbRecord> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new SupabaseServerError('Supabase not configured on server');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${jwt}`,
      apikey:         SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer:         'return=representation',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    // Try to extract PostgREST error code
    let pgCode: string | undefined;
    try { pgCode = (JSON.parse(body) as { code?: string }).code; } catch { /* ignore */ }
    throw new SupabaseServerError(
      `Supabase insert into "${table}" failed (HTTP ${res.status}): ${body}`,
      res.status,
      pgCode,
    );
  }

  const data = await res.json() as DbRecord[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new SupabaseServerError(`Supabase insert into "${table}" returned empty result`);
  }
  return data[0];
}

/**
 * UPDATE rows using the caller's JWT and return the changed representation.
 */
export async function supabaseServerUpdate(
  table: string,
  query: string,
  patch: DbRecord,
  jwt: string,
): Promise<DbRecord[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new SupabaseServerError('Supabase not configured on server');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      Authorization:  `Bearer ${jwt}`,
      apikey:         SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer:         'return=representation',
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    let pgCode: string | undefined;
    try { pgCode = (JSON.parse(body) as { code?: string }).code; } catch { /* ignore */ }
    throw new SupabaseServerError(
      `Supabase update of "${table}" failed (HTTP ${res.status}): ${body}`,
      res.status,
      pgCode,
    );
  }

  const data = await res.json() as DbRecord[];
  return Array.isArray(data) ? data : [];
}
