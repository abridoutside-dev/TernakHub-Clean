# TernakHub

An Indonesian livestock management platform ("platform operasional peternakan"). React SPA frontend + Express API backend, backed by Supabase (PostgreSQL + Auth) and Cloudflare R2 for image storage.

## Stack
- **Frontend**: React 18, React Router 6, Vite — served on port 5000
- **Backend**: Express 5 (TypeScript via tsx) — served on port 5001
- **Database / Auth**: Supabase (PostgreSQL + Row Level Security)
- **Image storage**: Cloudflare R2 (S3-compatible)

## How to run

Two workflows must be running simultaneously:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| API Server | `npm run server:dev` | 5001 |

The Vite dev server proxies `/api/*` to the Express server (port 5001).

## Environment variables / secrets

Already configured in Replit shared env vars:
- `VITE_SUPABASE_URL` / `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`
- `SESSION_SECRET` (Replit Secret)
- `SESSION_SECRET` is also mirrored in Supabase Edge Function secrets as
  `PLATFORM_HEALTH_INTERNAL_TOKEN` for the server-to-server platform-health
  authorization path. It is never exposed to the browser.

Still needed for image uploads (Cloudflare R2):
- `CLOUDFLARE_R2_ACCOUNT_ID` — Cloudflare account ID (non-sensitive)
- `CLOUDFLARE_R2_BUCKET_NAME` — bucket name (non-sensitive, defaults to `ternakhub-images`)
- `CLOUDFLARE_R2_API_TOKEN` — Cloudflare API Token with R2 Storage Edit permission (**secret**)
- `CLOUDFLARE_R2_PUBLIC_URL` — optional public base URL for served objects

## Admin auth integrity
The Dashboard Admin uses the same-origin Express route `/api/admin/platform-health`
for `auth-health` and `auth-integrity`. Express verifies the current caller is a
`system_admin`, then calls the `platform-health` Edge Function with internal
service authorization. The user's access token is not forwarded to the Edge
Function and is never used for the service-role database reads.

## Build & deploy
```bash
npm run build          # tsc + vite build → dist/
npm run server:prod    # production Express server (serves built dist/)
```

## User preferences
