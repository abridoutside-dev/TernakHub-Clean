-- Restore service_role privileges on ownership_transfers and ownership_transfer_history.
-- This is intentionally scoped to privilege repair only.
-- It does not alter schema, data, or any other table.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ownership_transfer_history TO service_role;
