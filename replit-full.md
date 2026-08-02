# TernakHub

A mobile-first livestock management app built with React + Vite + TypeScript.

## Stack
- **Frontend:** React 18, TypeScript, React Router v6
- **Build tool:** Vite 6
- **Auth:** Supabase (`@supabase/supabase-js`)
- **Styling:** CSS + inline styles
- **Data:** Local in-memory data stores (`src/data/`) — dev-seeded on boot

## How to run on Replit

Two workflows must both be running:

| Workflow | Command | Port | Purpose |
|----------|---------|------|---------|
| **Start application** | `npm run dev` | 5000 | React SPA (Vite) |
| **API Server** | `npm run server:dev` | 5001 | R2 upload proxy (Express) |

The Vite dev server proxies all `/api/*` requests to the Express server on port 5001 — no cross-origin issues.

For a fresh environment:
```
npm install          # install dependencies (Node 20+)
npm run dev          # Vite dev server on http://0.0.0.0:5000
npm run server:dev   # Express API server on port 5001 (separate terminal)
```

## Type-checking

```
npm run type-check      # browser code (tsconfig.json)
npm run type-check:r2   # server code (tsconfig.r2.json — no DOM types)
```

Both must pass before committing.

## Environment variables (Replit Secrets)

### Browser (Vite — VITE_ prefix required)
| Key | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key |

### Server-side only (NO VITE_ prefix — never exposed to browser)
| Key | Purpose |
|-----|---------|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name (`ternakhub-images`) |
| `CLOUDFLARE_R2_API_TOKEN` | Cloudflare API bearer token (R2 write access) |
| `CLOUDFLARE_R2_PUBLIC_URL` | *(optional)* Custom domain base URL for served images |

**Important:** `CLOUDFLARE_R2_API_TOKEN` is a **Cloudflare API token** (Bearer auth), not an S3 Access Key. The server uses the Cloudflare REST API, not the S3-compatible API.

## Project structure
- `src/App.tsx` — route definitions and layout
- `src/contexts/AuthContext.tsx` — Supabase auth provider (wraps App in `main.tsx`)
- `src/lib/supabase.ts` — Supabase client (browser-only)
- `src/data/` — in-memory data registries (livestock, batch, transfer, etc.)
- `src/pages/` — page components
- `src/components/` — shared UI components (TopAppBar, BottomNav, etc.)
- `src/utils/` — utility helpers (e.g. `livestockSummary.ts`)
- `docs/` — architecture decision records and module constitutions

## Dev seed
In development, `src/dev/seed.ts` auto-seeds 75 livestock, 8 batches, 50 memberships, and 31 transfers on cold load. Call `window.ternakDevFactory.clear()` in the browser console to reset.

## Notes
- Mobile-first UI; best previewed at ≤ 390 px width
- All data is in-memory only — nothing persists across page reloads yet
- Auth route guards are not yet implemented; all routes are currently public

## Key modules

### Produk Komersial (Pakan) — PK-000 s.d. PK-018 (`src/data/produkKomersialData.ts`, `konsentratMerekData.ts`, `konsentratSeriData.ts`, `konsentratDetailData.ts`, etc.)
- Living Database hierarchy: Kategori → Brand → Seri/Varian → Detail Produk, all entities keyed by UUID v4 (see `docs/PRODUK_KOMERSIAL_ARCHITECTURE.md`, `docs/PK-000A_UUID_STANDARD.md`)
- Admin CRUD chokepoint via `assertAdmin`/`logRiwayat` in `produkKomersialLivingDB.ts` — every mutation is access-controlled and audited/versioned (PK-009, PK-018)
- Master Referensi (`masterReferensiPKData.ts`), Knowledge Base (`knowledgeBasePKData.ts`), AI Readiness (`aiReadinessPKData.ts`), Import/Export (`importProdukKomersialData.ts` / `exportProdukKomersialData.ts`) round out the module
- Routes live under `/stok-pakan/komersial/*`

### Produk Komersial Obat (`src/data/produkKomersialObatData.ts`)
- 10 Brand + 98 Produk, all with UUID v4 identities
- Every Produk links to a Brand via `brandId` (UUID) and to Master Obat via `masterObatUuid` (UUID, read-only reference)
- Mutable in-memory arrays `OBAT_BRAND_LIST` / `OBAT_PRODUK_LIST`; mutations via `addObatBrand`, `updateObatBrand`, `softDeleteObatBrand`, etc.
- Admin pages: `/stok-obat/komersial/admin` → Kelola Brand, Kelola Produk, Import/Export
- Import/Export (`src/utils/produkKomersialObatImportExport.ts`): JSON + CSV, Merge/Replace, full relation validation, UUID preservation, audit log (`src/utils/produkKomersialObatAuditLog.ts`)
- Master Obat (`src/data/obatData.ts`, `src/data/obatDetailData.ts`) is always read-only SSOT — never modified by this module

## User preferences
