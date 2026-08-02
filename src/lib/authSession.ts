import { supabase } from './supabase';

/**
 * Repository boundary for workspace-scoped Supabase access.
 * UI guards improve navigation, but repositories must remain safe when called
 * directly from a page, service, job, or future integration.
 */
export async function requireAuthSession(): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error('Sesi autentikasi diperlukan untuk mengakses workspace.');
  }
}