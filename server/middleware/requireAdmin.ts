// ─── Admin Guard Middleware — ADMIN-PLATFORM-003B ─────────────────────────────
//
// Verifies that the authenticated user carries a Platform Administrator claim.
// Mirrors the three conditions defined in is_platform_admin() (Supabase SQL).
// Must be used AFTER requireAuth (which validates the JWT signature).
//
// Recognised claims (OR logic — any one is sufficient):
//   • user_metadata.is_admin  = true
//   • user_metadata.role      = 'admin'
//   • user_metadata.role      = 'system_admin'
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import { type AuthenticatedRequest } from './auth.js';

interface JwtPayload {
  user_metadata?: {
    is_admin?: boolean;
    role?: string;
  };
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const pad    = parts[1].length % 4;
    const b64    = parts[1] + (pad ? '='.repeat(4 - pad) : '');
    const json   = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isPlatformAdmin(payload: JwtPayload): boolean {
  const meta = payload.user_metadata;
  if (!meta) return false;
  return (
    meta.is_admin === true ||
    meta.role === 'admin' ||
    meta.role === 'system_admin'
  );
}

/**
 * Express middleware that requires a Platform Administrator claim in the JWT.
 * Returns 403 if the user is authenticated but not an admin.
 *
 * Usage: router.get('/route', requireAuth, requireAdmin, handler)
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = (req.headers.authorization ?? '').slice(7);
  const payload = decodeJwtPayload(token);
  if (!payload || !isPlatformAdmin(payload)) {
    res.status(403).json({ success: false, error: 'Akses ditolak: hanya Platform Administrator' });
    return;
  }
  next();
}
