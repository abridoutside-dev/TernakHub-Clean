-- SECURITY-ARCH-001FIX — Fix infinite RLS recursion in is_platform_admin()
--
-- Root cause: is_platform_admin() was SECURITY INVOKER and queried user_profiles.
-- The user_profiles_select_own policy also calls is_platform_admin(), creating
-- infinite recursion whenever any RLS policy invokes is_platform_admin().
--
-- Fix: change is_platform_admin() to SECURITY DEFINER so the internal
-- user_profiles lookup bypasses RLS, breaking the recursion while preserving
-- the account-lifecycle check (status = 'active').

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    (SELECT EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND status = 'active'
    ))
    AND (
      coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'system_admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
    )
  );
$$;
