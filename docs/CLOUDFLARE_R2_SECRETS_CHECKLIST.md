# Cloudflare R2 Secrets Checklist

Add all values as Replit environment variables or Secrets (never commit them to Git).

## Required Replit Secrets (sensitive credentials)

- [ ] `CLOUDFLARE_R2_API_TOKEN`
  - A Cloudflare **API Token** (Bearer token) scoped to your R2 bucket.
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permission: **R2 Storage — Edit** (scoped to your target bucket).
  - **Note:** This is NOT an S3 Access Key ID / Secret Access Key pair.
    The TernakHub API server uses the Cloudflare REST API with Bearer auth,
    not the S3-compatible endpoint.

## Required Non-secret Environment Variables

These are not credentials; they may be stored as shared Replit env vars.

- [ ] `CLOUDFLARE_R2_ACCOUNT_ID`
  - Your Cloudflare account ID (visible in the dashboard URL or Overview page).
- [ ] `CLOUDFLARE_R2_BUCKET_NAME`
  - Exact name of the R2 bucket (e.g. `ternakhub-images`).

## Optional Non-secret Environment Variable

- [ ] `CLOUDFLARE_R2_PUBLIC_URL`
  - Public base URL for served objects (custom domain or the `r2.dev` URL).
  - When omitted, the service derives `https://<bucket>.<account-id>.r2.dev/<key>`.
  - Requires **Public Access** enabled on the bucket in the Cloudflare dashboard.

## Security Rules

- Never use the `VITE_` prefix for R2 variables (that would expose them to the browser).
- Never put R2 credentials in source files, `.env` committed to Git, or browser code.
- The API token should be scoped to the minimum required permissions and a single bucket.
- Health check and upload endpoints run server-side only (`server/` directory).
