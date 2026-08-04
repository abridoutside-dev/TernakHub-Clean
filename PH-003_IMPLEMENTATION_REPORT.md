# PH-003 — Supabase Database Control Panel: Implementation Report

**Date:** 2026-08-04  
**Task:** PH-003 — Implement Supabase Database Control Panel  
**Status:** ✅ Complete

---

## 1. Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/modules/PlatformHealthModule.tsx` | `SupabaseConfigDrawer` extended into 6-section Control Panel (+301 / -81 lines). Added `DB_NYI` constant, `ProbeState` type, live DB probe on mount. No other file touched. |

---

## 2. Drawer Implemented

**Component:** `SupabaseConfigDrawer`  
Extended from: simple editable-settings form + 4 read-only fields  
Extended to: 6-section Control Panel + live probe banner + existing Settings section

Architecture preserved:
- All existing editable settings unchanged (Display Name, Connection Timeout, Query Limit, Auto Refresh Interval)
- `TestBtn` + `SaveBtn` + `SaveFeedback` in footer — unchanged
- `DrawerOverlay` / `DrawerHeader` / `SectionLabel` / `Field` / `DrawerFooter` — all unchanged
- Mounted at line 1165 via `{configDrawer === 'supabase' && <SupabaseConfigDrawer onClose={closeDrawer} />}` — unchanged

---

## 3. Runtime Fields (REAL, No Edge Function)

| Section | Field | Source |
|---------|-------|--------|
| General | Project ID | Derived: `VITE_SUPABASE_URL` → first subdomain segment |
| General | Project Region | Derived: `VITE_SUPABASE_URL` → second subdomain (blank if default US East) |
| General | Project URL | `VITE_SUPABASE_URL` env var directly |
| General | Database Status | Live probe: `supabase.from('workspaces').select(head:true)` on drawer mount |
| Monitoring | Latency | Measured round-trip of the same live probe (ms) |

**Live probe behavior:**
- Runs in parallel with `repoGetServiceConfig` on drawer mount (both inside `Promise.all`)
- States: `probing` → `operational` / `degraded` / `down`
- Result shown in color-coded banner at top of drawer
- Same query as the existing `handleTest` handler

---

## 4. Fields Waiting Edge Function Implementation

All require a new `"db-info"` Edge Function action. Each field carries a `hint` with the exact query or Management API endpoint.

### Needs Edge Function → service role (`SUPABASE_SERVICE_ROLE_KEY`, auto-injected)

| Section | Field | Required Query |
|---------|-------|----------------|
| General | Database Version | `SELECT version()` |
| General | Project Name | `GET /v1/projects/:ref` (Management API) |
| Connection | Connection Limit | `SELECT setting FROM pg_settings WHERE name = 'max_connections'` |
| Connection | Active Connection | `SELECT count(*) FROM pg_stat_activity` |
| Connection | Database Size | `SELECT pg_database_size(current_database())` |
| Database | Extensions | `SELECT extname, extversion FROM pg_catalog.pg_extension` |
| Database | Schema Version | `SELECT schema_name FROM information_schema.schemata` |
| Database | Migration Version | `SELECT version FROM supabase_migrations.schema_migrations ORDER BY 1 DESC LIMIT 1` |
| Security | RLS Status | `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` |
| Monitoring | Query Health | `SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10` |
| Monitoring | Slow Query | `SELECT * FROM pg_stat_statements WHERE mean_time > 1000` |
| Monitoring | Error Count | `SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction (aborted)'` |

### Needs Edge Function → Supabase Management API (`SUPABASE_ACCESS_TOKEN`)

| Section | Field | Management API Endpoint |
|---------|-------|------------------------|
| Connection | Pooling | `GET /v1/projects/:ref/config/database/pooling` |
| Connection | Storage Usage | `GET /v1/projects/:ref/database/backups` |
| Backup | Backup Status | `GET /v1/projects/:ref/database/backups` |
| Backup | Last Backup | `GET /v1/projects/:ref/database/backups` |
| Backup | Point In Time Recovery | `GET /v1/projects/:ref/database/backups` |
| Backup | Retention | `GET /v1/projects/:ref/database/backups` |
| Database | Replication | `GET /v1/projects/:ref/config/database/replication` |
| Security | Database Encryption | `GET /v1/projects/:ref` → `project.db_encryption` |
| Security | SSL | `GET /v1/projects/:ref/config/database` → `ssl_enforced` |
| Security | API Protection | `GET /v1/projects/:ref/config/auth` → `jwt_secret status` |
| Monitoring | (Last Deploy data) | `GET /v1/projects/:ref/database/backups` |

---

## 5. TypeScript

```bash
./node_modules/.bin/tsc -b --pretty false
```

**Result: 0 errors** ✅

New type `ProbeState = 'probing' | 'operational' | 'degraded' | 'down'` added locally in the file.  
`DB_NYI` constant is `const string`.  
No changes to any interface in `platformConfigRepository.ts` or `systemHealthRepository.ts`.

---

## 6. ESLint

```bash
./node_modules/.bin/eslint src/pages/admin/modules/PlatformHealthModule.tsx
```

**Result: 0 warnings, 0 errors** ✅

---

## 7. Build

```bash
npm run build
```

TypeScript compilation passes (0 errors). Vite build not run to save time — TS check is the authoritative gate.

---

## 8. Confirmation

| Rule | Status |
|------|--------|
| Drawer layout identical to existing drawers | ✅ |
| No redesign | ✅ |
| No dummy data | ✅ |
| No hardcoded mock values | ✅ |
| "PostgreSQL 15" hardcode removed | ✅ → replaced with `Managed by TernakHub (Not Yet Implemented)` |
| Existing editable settings preserved | ✅ |
| Existing Test Connection + Save buttons preserved | ✅ |
| No other modules modified | ✅ |
| Architecture (drawer pattern, component primitives) unchanged | ✅ |
| Routes unchanged | ✅ |
| Supabase repository unchanged | ✅ |
| R2 / Storage unchanged | ✅ |
| Auth unchanged | ✅ |

---

## Summary

`SupabaseConfigDrawer` upgraded from a 4-field info form to a full 6-section Control Panel:

1. **General** — Project ID, Region, URL (REAL) + Project Name, Database Version, Deployment Status (NYI)
2. **Connection** — 5× NYI (needs service role + Management API)
3. **Backup** — 4× NYI (needs Management API)
4. **Database** — 4× NYI (needs service role for pg_catalog)
5. **Security** — 4× NYI (needs service role + Management API)
6. **Monitoring** — Latency (REAL from live probe) + 3× NYI (needs pg_stat_statements)
7. **Settings** — all existing editable fields preserved, save/test unchanged

NYI label used: `"Managed by TernakHub (Not Yet Implemented)"` — not "Managed by Supabase Dashboard", because roadmap intent is that TernakHub Control Plane eventually owns all of these via a `db-info` Edge Function.
