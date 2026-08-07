-- TV-001 — Trust & Verification Edge Function contract.
--
-- Admin trust operations use the service role inside the
-- workspace-trust-verification Edge Function. The browser never accesses
-- these tables directly.

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE trust_verifications, trust_verification_evidence
  TO service_role;

GRANT SELECT, INSERT
  ON TABLE global_audit_trail
  TO service_role;

GRANT SELECT
  ON TABLE workspaces, user_profiles
  TO service_role;