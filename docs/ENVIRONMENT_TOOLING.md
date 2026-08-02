# Environment & Tooling Notes

## Runtime

- Node.js: `>=20.0.0`
- npm: `>=10.0.0`
- The Replit module and `.nvmrc` use Node 20.

The runtime requirement is driven by the current Supabase client dependency,
whose published package metadata requires Node 20 or newer.

## Dependency audit

The direct tooling dependencies use patched compatible releases:

- Vite `6.4.3` upgrades `esbuild` to `0.25.x`, resolving the Vite/esbuild
  development-server vulnerability without moving to Vite 7.
- React Router remains on major version 6 at `6.30.4`, the latest compatible
  6.x release. npm still reports two advisories whose official fix is only
  available in React Router 7; moving majors is intentionally out of scope
  because it can require application routing changes.

`xlsx@0.18.5` remains because it is the latest published SheetJS package
version used by the application's existing import/export code. npm audit
currently reports two advisories for this package and no official fix is
available. Replacing it would change the import/export implementation and is
outside environment/tooling scope; review or replace this dependency before
processing untrusted spreadsheet files in production.