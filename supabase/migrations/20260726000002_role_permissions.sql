-- AUTH-001C: role_permissions view + workspace permission helpers
-- Safe to run against a DB that already has 20260726000001 applied.

-- ── 1. role_permissions view ─────────────────────────────────────────────────
--
-- Materialises the built-in ROLE_PERMISSION_MATRIX as a read-only DB view.
-- Rows: one per (role, module, action) combination.
-- Mirrors the TypeScript source-of-truth in src/types/workspacePermissions.ts.
-- Use for reporting, auditing, or any server-side permission enforcement
-- that cannot import the TypeScript module.

CREATE OR REPLACE VIEW role_permissions AS
SELECT * FROM (VALUES
  -- Owner (all modules, all actions)
  ('Owner','dashboard','view',true),('Owner','dashboard','create',true),('Owner','dashboard','update',true),('Owner','dashboard','delete',true),
  ('Owner','livestock','view',true),('Owner','livestock','create',true),('Owner','livestock','update',true),('Owner','livestock','delete',true),
  ('Owner','feed','view',true),('Owner','feed','create',true),('Owner','feed','update',true),('Owner','feed','delete',true),
  ('Owner','medicine','view',true),('Owner','medicine','create',true),('Owner','medicine','update',true),('Owner','medicine','delete',true),
  ('Owner','marketplace','view',true),('Owner','marketplace','create',true),('Owner','marketplace','update',true),('Owner','marketplace','delete',true),
  ('Owner','workspaceSettings','view',true),('Owner','workspaceSettings','create',true),('Owner','workspaceSettings','update',true),('Owner','workspaceSettings','delete',true),
  ('Owner','memberManagement','view',true),('Owner','memberManagement','create',true),('Owner','memberManagement','update',true),('Owner','memberManagement','delete',true),
  ('Owner','reports','view',true),('Owner','reports','create',true),('Owner','reports','update',true),('Owner','reports','delete',true),
  ('Owner','ai','view',true),('Owner','ai','create',true),('Owner','ai','update',true),('Owner','ai','delete',true),
  ('Owner','adminFeatures','view',true),('Owner','adminFeatures','create',true),('Owner','adminFeatures','update',true),('Owner','adminFeatures','delete',true),
  -- Admin (same as Owner except adminFeatures = none)
  ('Admin','dashboard','view',true),('Admin','dashboard','create',true),('Admin','dashboard','update',true),('Admin','dashboard','delete',true),
  ('Admin','livestock','view',true),('Admin','livestock','create',true),('Admin','livestock','update',true),('Admin','livestock','delete',true),
  ('Admin','feed','view',true),('Admin','feed','create',true),('Admin','feed','update',true),('Admin','feed','delete',true),
  ('Admin','medicine','view',true),('Admin','medicine','create',true),('Admin','medicine','update',true),('Admin','medicine','delete',true),
  ('Admin','marketplace','view',true),('Admin','marketplace','create',true),('Admin','marketplace','update',true),('Admin','marketplace','delete',true),
  ('Admin','workspaceSettings','view',true),('Admin','workspaceSettings','create',true),('Admin','workspaceSettings','update',true),('Admin','workspaceSettings','delete',true),
  ('Admin','memberManagement','view',true),('Admin','memberManagement','create',true),('Admin','memberManagement','update',true),('Admin','memberManagement','delete',true),
  ('Admin','reports','view',true),('Admin','reports','create',true),('Admin','reports','update',true),('Admin','reports','delete',true),
  ('Admin','ai','view',true),('Admin','ai','create',true),('Admin','ai','update',true),('Admin','ai','delete',true),
  ('Admin','adminFeatures','view',false),('Admin','adminFeatures','create',false),('Admin','adminFeatures','update',false),('Admin','adminFeatures','delete',false),
  -- Manager
  ('Manager','dashboard','view',true),('Manager','dashboard','create',true),('Manager','dashboard','update',true),('Manager','dashboard','delete',true),
  ('Manager','livestock','view',true),('Manager','livestock','create',true),('Manager','livestock','update',true),('Manager','livestock','delete',true),
  ('Manager','feed','view',true),('Manager','feed','create',true),('Manager','feed','update',true),('Manager','feed','delete',true),
  ('Manager','medicine','view',true),('Manager','medicine','create',true),('Manager','medicine','update',true),('Manager','medicine','delete',true),
  ('Manager','marketplace','view',true),('Manager','marketplace','create',true),('Manager','marketplace','update',true),('Manager','marketplace','delete',true),
  ('Manager','workspaceSettings','view',true),('Manager','workspaceSettings','create',false),('Manager','workspaceSettings','update',false),('Manager','workspaceSettings','delete',false),
  ('Manager','memberManagement','view',true),('Manager','memberManagement','create',false),('Manager','memberManagement','update',false),('Manager','memberManagement','delete',false),
  ('Manager','reports','view',true),('Manager','reports','create',true),('Manager','reports','update',true),('Manager','reports','delete',false),
  ('Manager','ai','view',true),('Manager','ai','create',false),('Manager','ai','update',false),('Manager','ai','delete',false),
  ('Manager','adminFeatures','view',false),('Manager','adminFeatures','create',false),('Manager','adminFeatures','update',false),('Manager','adminFeatures','delete',false),
  -- Staff
  ('Staff','dashboard','view',true),('Staff','dashboard','create',false),('Staff','dashboard','update',false),('Staff','dashboard','delete',false),
  ('Staff','livestock','view',true),('Staff','livestock','create',true),('Staff','livestock','update',false),('Staff','livestock','delete',false),
  ('Staff','feed','view',true),('Staff','feed','create',true),('Staff','feed','update',false),('Staff','feed','delete',false),
  ('Staff','medicine','view',true),('Staff','medicine','create',true),('Staff','medicine','update',false),('Staff','medicine','delete',false),
  ('Staff','marketplace','view',true),('Staff','marketplace','create',true),('Staff','marketplace','update',false),('Staff','marketplace','delete',false),
  ('Staff','workspaceSettings','view',false),('Staff','workspaceSettings','create',false),('Staff','workspaceSettings','update',false),('Staff','workspaceSettings','delete',false),
  ('Staff','memberManagement','view',false),('Staff','memberManagement','create',false),('Staff','memberManagement','update',false),('Staff','memberManagement','delete',false),
  ('Staff','reports','view',false),('Staff','reports','create',false),('Staff','reports','update',false),('Staff','reports','delete',false),
  ('Staff','ai','view',true),('Staff','ai','create',false),('Staff','ai','update',false),('Staff','ai','delete',false),
  ('Staff','adminFeatures','view',false),('Staff','adminFeatures','create',false),('Staff','adminFeatures','update',false),('Staff','adminFeatures','delete',false),
  -- Viewer
  ('Viewer','dashboard','view',true),('Viewer','dashboard','create',false),('Viewer','dashboard','update',false),('Viewer','dashboard','delete',false),
  ('Viewer','livestock','view',true),('Viewer','livestock','create',false),('Viewer','livestock','update',false),('Viewer','livestock','delete',false),
  ('Viewer','feed','view',true),('Viewer','feed','create',false),('Viewer','feed','update',false),('Viewer','feed','delete',false),
  ('Viewer','medicine','view',true),('Viewer','medicine','create',false),('Viewer','medicine','update',false),('Viewer','medicine','delete',false),
  ('Viewer','marketplace','view',true),('Viewer','marketplace','create',false),('Viewer','marketplace','update',false),('Viewer','marketplace','delete',false),
  ('Viewer','workspaceSettings','view',false),('Viewer','workspaceSettings','create',false),('Viewer','workspaceSettings','update',false),('Viewer','workspaceSettings','delete',false),
  ('Viewer','memberManagement','view',false),('Viewer','memberManagement','create',false),('Viewer','memberManagement','update',false),('Viewer','memberManagement','delete',false),
  ('Viewer','reports','view',true),('Viewer','reports','create',false),('Viewer','reports','update',false),('Viewer','reports','delete',false),
  ('Viewer','ai','view',true),('Viewer','ai','create',false),('Viewer','ai','update',false),('Viewer','ai','delete',false),
  ('Viewer','adminFeatures','view',false),('Viewer','adminFeatures','create',false),('Viewer','adminFeatures','update',false),('Viewer','adminFeatures','delete',false)
) AS t(role, module, action, allowed);

COMMENT ON VIEW role_permissions IS
  'Read-only materialisation of the TypeScript ROLE_PERMISSION_MATRIX '
  '(src/types/workspacePermissions.ts). Source of truth is TypeScript; '
  'this view exists for DB-side reporting and future server-side enforcement.';
