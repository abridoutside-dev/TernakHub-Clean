# TernakHub

An Indonesian livestock management platform ("platform operasional peternakan"). React SPA frontend backed by Supabase (PostgreSQL + Auth) and Cloudflare R2 for image storage.

## Stack
- **Frontend**: React 18, React Router 6, Vite — served on port 5000
- **Database / Auth**: Supabase (PostgreSQL + Row Level Security), with privileged admin operations in Supabase Edge Functions
- **Image storage**: Cloudflare R2 (S3-compatible)

## How to run

The application runs with one workflow:

| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |

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

## Admin operations
Admin user operations are dispatched through the dedicated `admin-users`
Supabase Edge Function. The browser does not use a legacy `/api` or Node backend
route for User operations.

## Build & deploy
```bash
npm run build          # tsc + vite build → dist/
npm run preview        # serve the production build on port 5000
```

## User preferences
