// ─── Workspace Auth Middleware — DB-001C-1 ────────────────────────────────────
//
// Optional post-multer middleware that validates workspace membership.
//
// When `workspaceId` is present in the (already-parsed) multipart body or as a
// query param, it verifies that the authenticated user is a member of that
// workspace by querying Supabase with the user's own JWT (RLS-enforced — no
// service-role key required).
//
// When `workspaceId` is absent, the check is skipped (auth-only mode), so
// existing clients that do not send workspaceId continue to work unchanged.
//
// PLACEMENT: must come AFTER requireAuth AND after multer — req.body is only
// populated once multer has finished parsing the multipart form.
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? process.env.SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

/**
 * Express middleware that validates workspace membership when `workspaceId` is
 * provided in the request body (multipart field) or query string.
 *
 * Requires `requireAuth` to have already run (populates `req.user`).
 */
export async function requireWorkspaceAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Accept workspaceId from the parsed multipart body or query string
  const workspaceId = (
    (req.body?.workspaceId as string | undefined) ??
    (req.query.workspaceId as string | undefined)
  )?.trim();

  // No workspaceId provided — skip workspace check (auth already enforced)
  if (!workspaceId) {
    next();
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    // requireAuth should have caught this; defensive guard
    res.status(401).json({ success: false, error: 'Autentikasi diperlukan' });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[WorkspaceAuth] Supabase env vars not configured');
    res.status(500).json({ success: false, error: 'Konfigurasi server tidak lengkap' });
    return;
  }

  const token = (req.headers.authorization ?? '').slice(7); // strip "Bearer "

  try {
    // Query workspace_members using the user's JWT so RLS enforces their access.
    // A non-empty result means the user is a member; empty means they are not.
    const url = new URL(`${SUPABASE_URL}/rest/v1/workspace_members`);
    url.searchParams.set('select', 'workspace_id');
    url.searchParams.set('workspace_id', `eq.${workspaceId}`);
    url.searchParams.set('user_id', `eq.${userId}`);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization:  `Bearer ${token}`,
        apikey:         SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer:         'count=none',
      },
    });

    if (!response.ok) {
      console.error(`[WorkspaceAuth] Supabase query failed: HTTP ${response.status}`);
      res.status(403).json({ success: false, error: 'Akses workspace tidak diizinkan' });
      return;
    }

    interface MemberRow { workspace_id: string }
    const rows = await response.json() as MemberRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(403).json({ success: false, error: 'Anda bukan anggota workspace ini' });
      return;
    }

    next();
  } catch (err) {
    console.error('[WorkspaceAuth] Error validating workspace membership:', err);
    res.status(500).json({ success: false, error: 'Gagal memvalidasi akses workspace' });
  }
}
