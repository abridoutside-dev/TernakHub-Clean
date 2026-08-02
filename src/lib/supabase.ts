// ─── Supabase Client ──────────────────────────────────────────────────────────
// AUTH-002 — Centralized Supabase client instance.
//
// Rules:
//  - Never import this file in server/edge code — it is browser-only.
//  - Never cache or mutate the exported `supabase` object.
//  - All Supabase Auth calls go through AuthContext (src/contexts/AuthContext.tsx),
//    not by importing `supabase` directly in components.
//  - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set as Replit Secrets.
//    They are surfaced to the Vite build via the VITE_ prefix.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[TernakHub] Missing Supabase environment variables.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as Replit Secrets.\n' +
    'Running in demo mode — all data is in-memory only.',
  );
}

// Use placeholder values when env vars are absent so the app boots in demo mode.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    // Persist session in localStorage so the user stays signed in across
    // page reloads. Supabase handles token refresh automatically.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
