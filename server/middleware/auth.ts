// ─── Supabase JWT Auth Middleware ─────────────────────────────────────────────
//
// Validates the Supabase JWT from the Authorization header before allowing
// access to protected routes (e.g. file uploads).
//
// Usage:
//   router.post('/image', requireAuth, upload.single('file'), handler);
//
// The middleware calls Supabase's /auth/v1/user endpoint with the bearer token
// to verify it is a current, valid session — no service-role key required.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     ?? process.env.SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL)      console.error('[Auth] Missing SUPABASE_URL / VITE_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) console.error('[Auth] Missing SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY');

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string };
}

/**
 * Express middleware that requires a valid Supabase session.
 * Returns 401 if the Authorization header is absent or the token is invalid.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Autentikasi diperlukan' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      res.status(401).json({ success: false, error: 'Sesi tidak valid atau sudah kedaluwarsa' });
      return;
    }

    interface SupabaseUser { id: string; email?: string }
    const user = await response.json() as SupabaseUser;
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('[Auth] Token verification error:', err);
    res.status(500).json({ success: false, error: 'Gagal memverifikasi sesi' });
  }
}
