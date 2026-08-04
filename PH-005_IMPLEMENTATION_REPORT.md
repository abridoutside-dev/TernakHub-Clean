# PH-005 Implementation Report — Supabase Edge Functions Control Panel

## Summary

Replaced the stub `EdgeFunctionsConfigDrawer` in
`src/pages/admin/modules/PlatformHealthModule.tsx` with a full 6-section
Control Panel. No other files were changed.

---

## 1. Runtime Fields — Berhasil (real browser/Edge Function runtime)

| Section | Field | Sumber |
|---|---|---|
| 1 — Edge Function Status | Service Status | `supabase.functions.invoke('r2-storage', { action: 'get-config' })` |
| 1 — Edge Function Status | Latency | Round-trip ms dari invoke call yang sama |
| 1 — Edge Function Status | Last Checked | `new Date().toLocaleString('id-ID')` setelah invoke selesai |
| 2 — Deployed Functions | r2-storage | Status diketahui dari hasil invoke di Section 1 |
| 3 — Runtime | Runtime Status | Derived dari hasil invoke probe |
| 3 — Runtime | Region | Derived dari `VITE_SUPABASE_URL` (subdomain regional, misal `ap-southeast-1`) |
| 3 — Runtime | Invocation Status | HTTP class dari invoke response: `OK (2xx)` atau `Error` |
| 3 — Runtime | Last Response | Status message dari invoke call di sesi drawer ini |

**Mekanisme probe:** `useEffect` berjalan saat drawer dibuka, memanggil
`supabase.functions.invoke('r2-storage', { body: { action: 'get-config' } })`,
mengukur latency, lalu mengisi semua state Section 1 dan 3. Pola identik
dengan `SupabaseAuthConfigDrawer` (PH-004).

---

## 2. Runtime Fields — Tidak Dapat Diakses Browser

| Section | Field | Alasan |
|---|---|---|
| 2 — Deployed Functions | Other Functions | Memerlukan `SUPABASE_ACCESS_TOKEN` — server-side only |
| 4 — Secrets | Secrets Count | Secrets tidak boleh diekspos ke browser |
| 4 — Secrets | Secret Names | Idem |
| 4 — Secrets | Last Updated | Idem |
| 5 — Deployment | Current Version | Dikelola Supabase infrastructure, tidak ada client SDK untuk membacanya |
| 5 — Deployment | Previous Version | Idem |
| 5 — Deployment | Deploy Time | Idem |
| 5 — Deployment | Rollback | Idem |
| 6 — Logs | Invocation Count | Memerlukan Management API log endpoint |
| 6 — Logs | Error Count | Idem |
| 6 — Logs | Last Error | Idem |
| 6 — Logs | Execution Time | Idem |

**Label yang ditampilkan:**
- Section 2 (Other Functions), 4, 6 → `Not Yet Implemented` + hint endpoint
- Section 5 → `Managed by Supabase Dashboard` + link ke Supabase Dashboard

---

## 3. Endpoint Supabase Management API — Dibutuhkan Implementasi Berikutnya

| Kebutuhan | Endpoint |
|---|---|
| Daftar semua deployed functions | `GET /v1/projects/{ref}/functions` |
| Detail satu function | `GET /v1/projects/{ref}/functions/{slug}` |
| Secret names (bukan values) | `GET /v1/projects/{ref}/secrets` |
| Invocation logs, error count, execution time | `GET /v1/projects/{ref}/analytics/endpoints/logs.all?service=edge-functions` |
| Deployment history per function | `GET /v1/projects/{ref}/functions/{slug}` → `version`, `created_at` |

Semua endpoint di atas memerlukan header:
```
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
Token ini adalah personal access token atau service token — **tidak boleh
diekspos ke browser**. Harus diimplementasikan via Supabase Edge Function yang
menerima request dari admin dashboard dan meneruskan ke Management API
server-side.

---

## 4. Hasil TypeScript

```
npm run type-check

> ternakhub@0.1.0 type-check
> tsc -b --pretty false

(no output — 0 errors)
```

**Hasil: 0 TypeScript errors.**

---

## 5. Hasil ESLint

```
npx eslint src/pages/admin/modules/PlatformHealthModule.tsx

(no output — 0 warnings, 0 errors)
```

**Hasil: 0 ESLint warnings, 0 errors.**

---

## 6. Konfirmasi Tidak Ada Perubahan Scope

| Kategori | Status |
|---|---|
| Route | ✅ Tidak diubah |
| Layout (`AdminLayout`) | ✅ Tidak diubah |
| Style (warna, spacing, font, komponen UI) | ✅ Tidak diubah — menggunakan primitif yang sudah ada: `DrawerOverlay`, `DrawerHeader`, `DrawerFooter`, `SectionLabel`, `Field`, `fieldStyleRO`, `LiveBadge` |
| Arsitektur (repository pattern, Supabase client, health probe) | ✅ Tidak diubah |
| Komponen lain (`SupabaseConfigDrawer`, `StorageConfigDrawer`, `CloudflarePagesConfigDrawer`, `SupabaseAuthConfigDrawer`, `SystemServicesHealthWidget`, `PlatformHealthModule`) | ✅ Tidak diubah |
| Dummy / hardcode data | ✅ Tidak ada — semua field bertanda NYI menampilkan `Not Yet Implemented` dengan hint endpoint |
| File yang diubah | Hanya `src/pages/admin/modules/PlatformHealthModule.tsx` |

---

## File yang Diubah

```
src/pages/admin/modules/PlatformHealthModule.tsx
  − Stub EdgeFunctionsConfigDrawer (23 baris)
  + Full Control Panel PH-005 (259 baris):
      konstanta EF_NYI dan EF_DASH
      probe useEffect (invoke + latency + checkedAt)
      6 section sesuai spesifikasi
      footer dengan link Supabase Dashboard
```
