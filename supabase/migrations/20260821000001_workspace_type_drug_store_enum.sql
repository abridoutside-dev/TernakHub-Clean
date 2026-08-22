-- WORKSPACE-001G — Add DrugStore to workspace_type enum
--
-- Adds 'DrugStore' as an official workspace type so Toko Obat can be created
-- and identified without relying on VeterinaryClinic aliasing or name-based
-- detection.
--
-- SAFETY:
--   - Additive only. Does not modify existing rows or remove enum values.
--   - Existing VeterinaryClinic / VeterinaryDoctor workspaces are untouched.
--   - ALTER TYPE ... ADD VALUE is a metadata-only operation in PostgreSQL;
--     it does not rewrite any table.

ALTER TYPE workspace_type ADD VALUE IF NOT EXISTS 'DrugStore';
