# DB-001A — Laporan Audit Database Production TernakHub

**Tanggal Audit**: 2026-07-24  
**Branch**: feature/production-readiness  
**Tujuan**: Memetakan seluruh data aplikasi ke skema Supabase production-ready  
**Status**: AUDIT ONLY — tidak ada migration, tidak ada perubahan kode

---

## RINGKASAN EKSEKUTIF

TernakHub adalah platform manajemen ternak terintegrasi dengan 16 domain data utama. Seluruh data saat ini tersimpan sebagai in-memory TypeScript stores (array/Map/Record). Audit ini mengidentifikasi **81 tabel production**, **6 storage bucket**, **27 RLS policy group**, **14 fungsi PostgreSQL**, **18 trigger**, **11 view**, dan **3 materialized view**.

---

## BAGIAN 1 — DAFTAR SELURUH TABEL PRODUCTION

### 1.1 AUTHENTICATION (2 tabel)

#### `auth.users` *(Supabase built-in — tidak dibuat manual)*
- Dikelola penuh oleh Supabase Auth
- Field tambahan: `user_metadata.system_admin`, `user_metadata.role`, `user_metadata.workspace_ids`

#### `user_profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users.id` ON DELETE CASCADE |
| `full_name` | `text` | |
| `display_name` | `text` | |
| `phone_number` | `text` | |
| `avatar_url` | `text` | URL media dari storage |
| `cover_url` | `text` | |
| `bio` | `text` | |
| `ktp_number` | `text` | KTP ID (encrypted at rest) |
| `ktp_verified` | `boolean` DEFAULT false | |
| `ktp_front_url` | `text` | |
| `ktp_back_url` | `text` | |
| `whatsapp_number` | `text` | |
| `notification_preferences` | `jsonb` | |
| `security_preferences` | `jsonb` | 2FA, dll |
| `onboarding_completed` | `boolean` DEFAULT false | |
| `onboarding_step` | `int` DEFAULT 0 | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### 1.2 WORKSPACE (5 tabel)

#### `workspaces`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `name` | `text` NOT NULL | |
| `type` | `workspace_type` ENUM | `Farm`, `FeedStore`, `VeterinaryClinic`, `VeterinaryDoctor`, `Transport`, `Marketplace` |
| `status` | `workspace_status` ENUM | `Aktif`, `Nonaktif`, `Diarsipkan`, `Pending` |
| `description` | `text` | |
| `icon` | `text` | emoji/karakter ikon |
| `owner_id` | `uuid` NOT NULL FK → `auth.users.id` | |
| `farm_code` | `text` UNIQUE | kode unik farm |
| `province` | `text` | |
| `city` | `text` | |
| `district` | `text` | |
| `village` | `text` | |
| `address` | `text` | |
| `latitude` | `decimal(10,7)` | |
| `longitude` | `decimal(10,7)` | |
| `phone` | `text` | |
| `email` | `text` | |
| `website` | `text` | |
| `established_year` | `int` | |
| `verification_status` | `verification_status` ENUM | `Unverified`, `Pending`, `Verified`, `Rejected`, `Suspended` |
| `trust_score` | `int` DEFAULT 0 | 0-100 |
| `metadata` | `jsonb` | konfigurasi tambahan per workspace type |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |
| `archived_at` | `timestamptz` | |

**Index**: `idx_workspaces_owner_id`, `idx_workspaces_type`, `idx_workspaces_status`  
**Unique**: `farm_code`

---

#### `workspace_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `user_id` | `uuid` NOT NULL FK → `auth.users.id` ON DELETE CASCADE | |
| `role` | `member_role` ENUM | `Owner`, `Admin`, `Staff`, `Viewer`, `Guest` |
| `status` | `member_status` ENUM | `Aktif`, `Nonaktif`, `Diundang`, `Ditangguhkan` |
| `invited_by` | `uuid` FK → `auth.users.id` | |
| `joined_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(workspace_id, user_id)`  
**Index**: `idx_workspace_members_workspace_id`, `idx_workspace_members_user_id`

---

#### `workspace_invitations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `invited_by` | `uuid` NOT NULL FK → `auth.users.id` | |
| `email` | `text` NOT NULL | |
| `role` | `member_role` ENUM | |
| `token` | `text` UNIQUE NOT NULL | token rahasia undangan |
| `status` | `text` | `Pending`, `Accepted`, `Expired`, `Revoked` |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `workspace_relationships`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id_a` | `uuid` NOT NULL FK → `workspaces.id` | |
| `workspace_id_b` | `uuid` NOT NULL FK → `workspaces.id` | |
| `relationship_type` | `relationship_type` ENUM | `Supplier`, `Buyer`, `Partner`, `Afiliasi`, `Kompetitor`, `Mitra`, `Lainnya` |
| `status` | `relationship_status` ENUM | `Aktif`, `Nonaktif`, `Pending`, `Ditolak`, `Diputus` |
| `initiated_by` | `uuid` FK → `workspaces.id` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(workspace_id_a, workspace_id_b, relationship_type)`

---

#### `ownership_transfers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | workspace yang ditransfer |
| `from_user_id` | `uuid` NOT NULL FK → `auth.users.id` | pemilik lama |
| `to_user_id` | `uuid` NOT NULL FK → `auth.users.id` | pemilik baru |
| `status` | `ownership_transfer_status` ENUM | `Draft`, `Requested`, `PendingVerification`, `Approved`, `Rejected`, `Completed`, `Cancelled`, `Failed` |
| `reason` | `text` | |
| `notes` | `text` | |
| `workspace_snapshot` | `jsonb` | snapshot data workspace saat transfer |
| `requested_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### 1.3 SUBSCRIPTION (3 tabel)

#### `subscription_plans` *(seed data — tidak diubah oleh user)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `plan_key` | `text` UNIQUE NOT NULL | `Free`, `Starter`, `Professional`, `Enterprise` |
| `name` | `text` NOT NULL | |
| `price_monthly` | `int` | Rp |
| `price_yearly` | `int` | Rp |
| `max_livestock` | `int` | null = unlimited |
| `max_members` | `int` | |
| `max_batches` | `int` | |
| `max_listings` | `int` | |
| `features` | `jsonb` | array FeatureKey yang aktif |
| `is_active` | `boolean` DEFAULT true | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `workspace_subscriptions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` UNIQUE NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `plan_id` | `uuid` NOT NULL FK → `subscription_plans.id` | |
| `status` | `subscription_status` ENUM | `Aktif`, `Trial`, `Kadaluarsa`, `Dibatalkan`, `Ditangguhkan` |
| `started_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | |
| `trial_ends_at` | `timestamptz` | |
| `billing_cycle` | `text` | `monthly`, `yearly` |
| `auto_renew` | `boolean` DEFAULT false | |
| `payment_method` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `feature_policies` *(seed data)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `feature_key` | `text` UNIQUE NOT NULL | 113 feature keys dari subscriptionFeaturePolicy.ts |
| `min_plan` | `text` | `Free`, `Starter`, `Professional`, `Enterprise` |
| `module` | `text` | 33 modul yang ada |
| `description` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.4 LIVESTOCK — MASTER DATA (7 tabel)

#### `livestock`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | format: `lv-{uuid}` |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `name` | `text` | null = belum diberi nama |
| `species` | `text` NOT NULL | `Sapi`, `Kambing`, `Domba`, `Kerbau`, `Babi`, `Unggas`, `Ikan` |
| `breed` | `text` | ras/breed |
| `sex` | `sex_enum` ENUM | `Jantan`, `Betina` |
| `birth_date` | `date` | |
| `birth_date_estimated` | `boolean` DEFAULT false | |
| `birth_weight_kg` | `decimal(6,2)` | |
| `current_weight_kg` | `decimal(6,2)` | |
| `health_status` | `health_status_enum` ENUM | `Sehat`, `Sakit`, `Pemantauan` |
| `location_status` | `location_status_enum` ENUM | `Di Kandang`, `Luar Kandang`, `Arsip` |
| `location_detail` | `text` | nama kandang/blok |
| `program` | `text` | program pemeliharaan |
| `digital_identity_verified` | `boolean` DEFAULT false | |
| `digital_identity_issued_by` | `text` | |
| `digital_identity_registered_date` | `date` | |
| `archive_reason` | `archive_reason_enum` ENUM | `Mati`, `Terjual`, `Hibah` — nullable |
| `archived_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_livestock_workspace_id`, `idx_livestock_species`, `idx_livestock_location_status`, `idx_livestock_health_status`  
**Check**: `archive_reason IS NOT NULL WHEN location_status = 'Arsip'`

---

#### `livestock_extended_metadata`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` UNIQUE NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `ear_tag` | `text` | |
| `internal_code` | `text` | |
| `notes` | `text` | |
| `breed_category` | `text` | |
| `cross_breed` | `text` | |
| `color` | `text` | |
| `horn` | `text` | |
| `tail` | `text` | |
| `special_marks` | `text` | |
| `purchase_date` | `date` | |
| `purchase_price` | `bigint` | Rp |
| `supplier` | `text` | |
| `origin_farm` | `text` | |
| `sibling_count` | `int` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `livestock_edit_history`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `edited_by` | `uuid` NOT NULL FK → `auth.users.id` | |
| `reason` | `text` | |
| `changes` | `jsonb` NOT NULL | array `{field, before, after}` |
| `edited_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_livestock_edit_history_livestock_id`

---

#### `pedigree_links`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `relative_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE RESTRICT | |
| `role` | `pedigree_role_enum` ENUM | `Induk`, `Pejantan`, `Anak`, `Kakek`, `Nenek`, `Buyut` |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(livestock_id, relative_id, role)`  
**Check**: `livestock_id <> relative_id` (self-parent guard)

---

#### `livestock_ownership_history`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `owner_name` | `text` NOT NULL | |
| `workspace_id` | `uuid` FK → `workspaces.id` | |
| `start_date` | `date` NOT NULL | |
| `end_date` | `date` | null = pemilik saat ini |
| `method` | `ownership_method_enum` ENUM | `Lahir`, `Pembelian`, `Penjualan`, `Hibah`, `Beli Kembali`, `Transfer`, `Registrasi Manual`, `Impor`, `Transfer Masuk`, `Lainnya` |
| `notes` | `text` | |
| `is_current` | `boolean` DEFAULT false | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_ownership_history_livestock_id`

---

#### `livestock_photos`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `uploaded_by` | `uuid` FK → `auth.users.id` | |
| `storage_url` | `text` NOT NULL | Supabase Storage URL |
| `thumbnail_url` | `text` | |
| `caption` | `text` | |
| `is_primary` | `boolean` DEFAULT false | |
| `sort_order` | `int` DEFAULT 0 | |
| `taken_at` | `date` | tanggal foto diambil |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_livestock_photos_livestock_id`

---

#### `livestock_weight_entries`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `weight_kg` | `decimal(7,3)` NOT NULL | |
| `date` | `date` NOT NULL | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_weight_entries_livestock_id`, `idx_weight_entries_date`

---

### 1.5 BATCH (4 tabel)

#### `batches`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `label` | `text` NOT NULL | nama batch (bukan program) |
| `species` | `text` | spesies target |
| `status` | `batch_status_enum` ENUM | `Aktif`, `Selesai`, `Diarsipkan` |
| `start_date` | `date` | |
| `finished_date` | `date` | null = belum selesai |
| `target_weight_kg` | `decimal(6,2)` | |
| `notes` | `text` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_batches_workspace_id`, `idx_batches_status`

---

#### `batch_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `batch_id` | `uuid` NOT NULL FK → `batches.id` ON DELETE CASCADE | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE RESTRICT | |
| `joined_date` | `date` NOT NULL | |
| `removed_date` | `date` | null = masih aktif |
| `removal_reason` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(batch_id, livestock_id)` WHERE `removed_date IS NULL`  
**Index**: `idx_batch_members_batch_id`, `idx_batch_members_livestock_id`

---

#### `batch_history`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `batch_id` | `uuid` NOT NULL FK → `batches.id` ON DELETE CASCADE | |
| `event_type` | `text` NOT NULL | `Created`, `MemberAdded`, `MemberRemoved`, `StatusChanged`, `Finished`, `Archived` |
| `event_data` | `jsonb` | detail event |
| `performed_by` | `uuid` FK → `auth.users.id` | |
| `event_at` | `timestamptz` DEFAULT now() | |

---

#### `batch_operations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `batch_id` | `uuid` NOT NULL FK → `batches.id` ON DELETE CASCADE | |
| `operation_type` | `text` NOT NULL | `FeedBatch`, `HealthTreatment`, `Vaccination`, `Deworming`, `WeightCheck`, `Transfer`, `Sorting` |
| `status` | `text` | `Draft`, `InProgress`, `Completed`, `Failed` |
| `target_livestock_ids` | `uuid[]` | |
| `operation_data` | `jsonb` | detail operasi |
| `performed_by` | `uuid` FK → `auth.users.id` | |
| `performed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.6 TRANSFER & MUTASI (2 tabel)

#### `livestock_transfers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `transfer_type` | `transfer_type_enum` ENUM | `Keluar Sementara`, `Masuk Kembali`, `Keluar Permanen` |
| `from_location` | `text` | |
| `to_location` | `text` | |
| `destination` | `text` | nama tempat tujuan |
| `reason` | `text` | |
| `archive_reason` | `archive_reason_enum` ENUM | `Mati`, `Terjual`, `Hibah` — hanya untuk Keluar Permanen |
| `notes` | `text` | |
| `transferred_by` | `uuid` FK → `auth.users.id` | |
| `transfer_date` | `date` NOT NULL | |
| `return_date` | `date` | null = belum kembali |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_transfers_livestock_id`, `idx_transfers_workspace_id`

---

#### `mutation_requests`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | workspace asal |
| `destination_workspace_id` | `uuid` FK → `workspaces.id` | |
| `livestock_ids` | `uuid[]` NOT NULL | hewan yang dimutasi |
| `mutation_type` | `text` | `Individual`, `Batch` |
| `status` | `mutation_status_enum` ENUM | `Draft`, `Pending`, `Approved`, `Completed`, `Rejected`, `Cancelled` |
| `effective_date` | `date` | |
| `reason` | `text` | |
| `notes` | `text` | |
| `requested_by` | `uuid` FK → `auth.users.id` | |
| `approved_by` | `uuid` FK → `auth.users.id` | |
| `approved_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Check**: `destination_workspace_id <> workspace_id`

---

### 1.7 KESEHATAN HEWAN (8 tabel)

#### `health_checkups`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `checkup_date` | `date` NOT NULL | |
| `examiner` | `text` | nama pemeriksa |
| `examiner_type` | `text` | `Internal`, `Dokter Hewan` |
| `temperature` | `decimal(4,1)` | °C |
| `weight_kg` | `decimal(7,3)` | |
| `body_condition_score` | `int` | 1-9 |
| `health_status` | `health_status_enum` ENUM | `Sehat`, `Sakit`, `Pemantauan` |
| `findings` | `text` | temuan pemeriksaan |
| `diagnosis` | `text` | |
| `recommendations` | `text` | |
| `follow_up_date` | `date` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_health_checkups_livestock_id`, `idx_health_checkups_date`

---

#### `health_treatments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `checkup_id` | `uuid` FK → `health_checkups.id` | opsional, jika lanjutan checkup |
| `treatment_date` | `date` NOT NULL | |
| `treatment_type` | `treatment_type_enum` ENUM | `Pengobatan`, `Vaksinasi`, `Deworming`, `Vitamin`, `Operasi`, `Infus`, `Lainnya` |
| `drug_id` | `uuid` FK → `drug_catalog.id` | |
| `drug_name` | `text` | fallback jika drug tidak di katalog |
| `dosage` | `text` | |
| `route` | `text` | `Oral`, `Injeksi`, `Topikal`, `Lainnya` |
| `duration_days` | `int` | |
| `next_treatment_date` | `date` | |
| `cost` | `bigint` | Rp |
| `veterinarian` | `text` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_health_treatments_livestock_id`, `idx_health_treatments_workspace_id`

---

#### `health_control_schedules`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `livestock_id` | `uuid` FK → `livestock.id` | null = berlaku untuk workspace |
| `batch_id` | `uuid` FK → `batches.id` | |
| `schedule_type` | `text` | `Vaksinasi`, `Deworming`, `Pemeriksaan Rutin`, `Vitamin` |
| `scheduled_date` | `date` NOT NULL | |
| `status` | `text` | `Terjadwal`, `Selesai`, `Dilewati`, `Dibatalkan` |
| `notes` | `text` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `disease_catalog` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | |
| `local_name` | `text` | nama lokal/daerah |
| `category_id` | `uuid` FK → `disease_categories.id` | |
| `affected_species` | `text[]` | array spesies yang terpengaruh |
| `symptoms` | `text[]` | |
| `causes` | `text` | |
| `prevention` | `text` | |
| `treatment` | `text` | |
| `severity` | `text` | `Ringan`, `Sedang`, `Berat`, `Sangat Berat` |
| `is_zoonotic` | `boolean` DEFAULT false | bisa menular ke manusia |
| `is_notifiable` | `boolean` DEFAULT false | wajib dilaporkan ke dinas |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `disease_categories` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` UNIQUE NOT NULL | |
| `description` | `text` | |
| `icon` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `drug_catalog` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | |
| `generic_name` | `text` | |
| `category_id` | `uuid` FK → `drug_categories.id` | |
| `sub_category_id` | `uuid` FK → `drug_sub_categories.id` | |
| `species_targets` | `text[]` | |
| `dosage_form` | `text` | `Tablet`, `Injeksi`, `Cair`, `Serbuk`, `Salep`, `Lainnya` |
| `standard_dosage` | `text` | |
| `withdrawal_period_days` | `int` | |
| `requires_prescription` | `boolean` DEFAULT false | |
| `manufacturer` | `text` | |
| `description` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `drug_categories` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` UNIQUE NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | |
| `icon` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `drug_sub_categories` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `category_id` | `uuid` NOT NULL FK → `drug_categories.id` | |
| `name` | `text` NOT NULL | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.8 STOK OBAT (4 tabel)

#### `stok_obat`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `drug_id` | `uuid` FK → `drug_catalog.id` | opsional |
| `drug_name` | `text` NOT NULL | nama obat |
| `category_id` | `uuid` FK → `drug_categories.id` | |
| `quantity` | `decimal(10,3)` DEFAULT 0 | stok saat ini |
| `unit` | `text` NOT NULL | `tablet`, `ml`, `gram`, `botol`, dll |
| `min_stock` | `decimal(10,3)` | ambang batas stok minimum |
| `expiry_date` | `date` | |
| `batch_number` | `text` | |
| `status` | `stok_status_enum` ENUM | `Aktif`, `Habis`, `Kadaluarsa`, `Diarsipkan` |
| `location` | `text` | lokasi penyimpanan |
| `purchase_price` | `bigint` | Rp per unit |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `stok_obat_masuk`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `stok_obat_id` | `uuid` NOT NULL FK → `stok_obat.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `quantity` | `decimal(10,3)` NOT NULL | |
| `source` | `text` | `Pembelian`, `Hibah`, `Produksi Sendiri`, `Transfer`, `Lainnya` |
| `supplier` | `text` | |
| `purchase_price` | `bigint` | |
| `invoice_number` | `text` | |
| `received_date` | `date` NOT NULL | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `stok_obat_keluar`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `stok_obat_id` | `uuid` NOT NULL FK → `stok_obat.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `treatment_id` | `uuid` FK → `health_treatments.id` | jika terkait tindakan |
| `quantity` | `decimal(10,3)` NOT NULL | |
| `reason` | `text` | `Penggunaan`, `Kadaluarsa`, `Rusak`, `Hilang`, `Transfer`, `Lainnya` |
| `livestock_id` | `uuid` FK → `livestock.id` | jika untuk hewan tertentu |
| `usage_date` | `date` NOT NULL | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `stok_obat_adjustments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `stok_obat_id` | `uuid` NOT NULL FK → `stok_obat.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `quantity_before` | `decimal(10,3)` NOT NULL | |
| `quantity_after` | `decimal(10,3)` NOT NULL | |
| `quantity_delta` | `decimal(10,3)` NOT NULL | positif = masuk, negatif = keluar |
| `reason` | `text` NOT NULL | |
| `adjusted_by` | `uuid` FK → `auth.users.id` | |
| `adjusted_at` | `timestamptz` DEFAULT now() | |

---

### 1.9 REPRODUKSI (9 tabel)

#### `reproduksi_programs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `name` | `text` NOT NULL | |
| `species` | `text` | |
| `status` | `program_status_enum` ENUM | `Aktif`, `Selesai`, `Dihentikan`, `Draft` |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `participant_ids` | `uuid[]` | livestock IDs peserta |
| `target_breed` | `text` | |
| `mating_method` | `text` | `Alami`, `IB`, `TE`, `Lainnya` |
| `notes` | `text` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `pelaksanaan_reproduksi`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `program_id` | `uuid` NOT NULL FK → `reproduksi_programs.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `execution_date` | `date` NOT NULL | |
| `method` | `text` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `monitoring_reproduksi`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `program_id` | `uuid` NOT NULL FK → `reproduksi_programs.id` ON DELETE CASCADE | |
| `pelaksanaan_id` | `uuid` FK → `pelaksanaan_reproduksi.id` | |
| `event_type` | `text` NOT NULL | |
| `event_date` | `date` NOT NULL | |
| `description` | `text` | |
| `data` | `jsonb` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `pemeriksaan_kebuntingan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `program_id` | `uuid` NOT NULL FK → `reproduksi_programs.id` | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` | induk betina |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `check_date` | `date` NOT NULL | |
| `method` | `text` | `Palpasi`, `USG`, `Hormon`, `Visual` |
| `result` | `text` NOT NULL | `Bunting`, `Tidak Bunting`, `Tidak Pasti` |
| `days_pregnant` | `int` | estimasi umur kebuntingan |
| `examiner` | `text` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `kebuntingan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `program_id` | `uuid` NOT NULL FK → `reproduksi_programs.id` | |
| `pemeriksaan_id` | `uuid` UNIQUE NOT NULL FK → `pemeriksaan_kebuntingan.id` | 1:1 |
| `dam_id` | `uuid` NOT NULL FK → `livestock.id` | induk betina |
| `sire_id` | `uuid` FK → `livestock.id` | pejantan (nullable jika IB/TE) |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `conception_date` | `date` | |
| `expected_birth_date` | `date` | |
| `actual_birth_date` | `date` | |
| `status` | `pregnancy_status_enum` ENUM | `Aktif`, `Selesai`, `Gugur`, `Dibatalkan` |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Check**: `dam_id <> sire_id`

---

#### `kelahiran`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `kebuntingan_id` | `uuid` UNIQUE NOT NULL FK → `kebuntingan.id` | 1:1 |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `birth_date` | `date` NOT NULL | |
| `birth_time` | `time` | |
| `birth_process` | `text` | `Normal`, `Dibantu`, `Caesar` |
| `total_born` | `int` NOT NULL DEFAULT 1 | |
| `total_alive` | `int` NOT NULL DEFAULT 1 | |
| `total_dead` | `int` NOT NULL DEFAULT 0 | |
| `complications` | `text` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `registrasi_anak`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `kelahiran_id` | `uuid` NOT NULL FK → `kelahiran.id` ON DELETE CASCADE | |
| `livestock_id` | `uuid` UNIQUE FK → `livestock.id` | null jika mati, FK ke record baru di livestock |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `birth_order` | `int` | urutan anak (1, 2, 3...) |
| `sex` | `sex_enum` ENUM | `Jantan`, `Betina` |
| `birth_weight_kg` | `decimal(6,2)` | |
| `condition` | `text` NOT NULL | `Hidup`, `Mati` |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `sapih`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `livestock_id` | `uuid` NOT NULL FK → `livestock.id` ON DELETE CASCADE | anak yang disapih |
| `registrasi_id` | `uuid` NOT NULL FK → `registrasi_anak.id` | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `weaning_date` | `date` NOT NULL | |
| `age_at_weaning_days` | `int` | |
| `weight_at_weaning_kg` | `decimal(6,2)` | |
| `method` | `text` | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.10 PAKAN & FORMULA (7 tabel)

#### `feed_formulas`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `name` | `text` NOT NULL | |
| `status` | `formula_status_enum` ENUM | `Aktif`, `Draft`, `Arsip` |
| `target_species` | `text[]` | |
| `target_age_group` | `text` | |
| `description` | `text` | |
| `total_cost_per_kg` | `decimal(10,2)` | kalkulasi |
| `notes` | `text` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |
| `archived_at` | `timestamptz` | |

---

#### `feed_formula_ingredients`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `formula_id` | `uuid` NOT NULL FK → `feed_formulas.id` ON DELETE CASCADE | |
| `source_type` | `text` NOT NULL | `Master Pakan`, `Produk Komersial` |
| `master_pakan_id` | `uuid` FK → `master_pakan_catalog.id` | |
| `produk_komersial_id` | `uuid` FK → `produk_komersial_products.id` | |
| `ingredient_name` | `text` NOT NULL | fallback display |
| `percentage` | `decimal(5,2)` NOT NULL | % dari total |
| `amount_kg` | `decimal(10,3)` | |
| `cost_per_kg` | `decimal(10,2)` | |
| `notes` | `text` | |
| `sort_order` | `int` DEFAULT 0 | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Check**: `percentage > 0 AND percentage <= 100`

---

#### `feed_formula_productions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `formula_id` | `uuid` NOT NULL FK → `feed_formulas.id` | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `production_date` | `date` NOT NULL | |
| `quantity_kg` | `decimal(10,3)` NOT NULL | |
| `batch_code` | `text` | |
| `status` | `text` | `Rencana`, `Proses`, `Selesai`, `Gagal` |
| `notes` | `text` | |
| `produced_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `stok_inventaris` *(inventaris pakan)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `source_type` | `text` NOT NULL | `Master Pakan`, `Produk Komersial`, `Formula` |
| `master_pakan_id` | `uuid` FK → `master_pakan_catalog.id` | |
| `formula_id` | `uuid` FK → `feed_formulas.id` | |
| `item_name` | `text` NOT NULL | |
| `quantity` | `decimal(10,3)` DEFAULT 0 | kg |
| `unit` | `text` | |
| `min_stock` | `decimal(10,3)` | |
| `purchase_price_per_kg` | `decimal(10,2)` | |
| `status` | `stok_status_enum` ENUM | `Aktif`, `Habis`, `Kadaluarsa`, `Diarsipkan` |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `stok_inventaris_transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `stok_id` | `uuid` NOT NULL FK → `stok_inventaris.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `transaction_type` | `text` NOT NULL | `Masuk`, `Keluar`, `Penyesuaian` |
| `quantity_delta` | `decimal(10,3)` NOT NULL | positif = masuk, negatif = keluar |
| `quantity_before` | `decimal(10,3)` | |
| `quantity_after` | `decimal(10,3)` | |
| `reason` | `text` | |
| `reference_id` | `uuid` | ID pemberian pakan, produksi, dll |
| `reference_type` | `text` | `PemberianPakan`, `Produksi`, `Pembelian`, `Penyesuaian` |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `transaction_date` | `date` NOT NULL | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `jadwal_pemberian_pakan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `livestock_id` | `uuid` FK → `livestock.id` | null = untuk batch |
| `batch_id` | `uuid` FK → `batches.id` | |
| `formula_id` | `uuid` FK → `feed_formulas.id` | |
| `schedule_name` | `text` | |
| `frequency` | `text` | `1x Sehari`, `2x Sehari`, `3x Sehari`, `Ad Libitum` |
| `time_slots` | `text[]` | jam pemberian |
| `amount_per_session_kg` | `decimal(7,3)` | |
| `is_active` | `boolean` DEFAULT true | |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `notes` | `text` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `pemberian_pakan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `jadwal_id` | `uuid` FK → `jadwal_pemberian_pakan.id` | |
| `livestock_id` | `uuid` FK → `livestock.id` | |
| `batch_id` | `uuid` FK → `batches.id` | |
| `formula_id` | `uuid` FK → `feed_formulas.id` | |
| `feed_date` | `date` NOT NULL | |
| `feed_time` | `time` | |
| `amount_kg` | `decimal(7,3)` NOT NULL | |
| `notes` | `text` | |
| `recorded_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.11 MASTER PAKAN (4 tabel — seedable)

#### `master_pakan_categories`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` UNIQUE NOT NULL | `rumput`, `jagung`, `konsentrat`, dll |
| `name` | `text` NOT NULL | |
| `icon` | `text` | |
| `description` | `text` | |
| `sort_order` | `int` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `master_pakan_catalog`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `category_id` | `uuid` NOT NULL FK → `master_pakan_categories.id` | |
| `name` | `text` NOT NULL | |
| `local_name` | `text` | |
| `latin_name` | `text` | |
| `species_suitability` | `text[]` | spesies yang cocok |
| `nutritional_content` | `jsonb` | `{protein, lemak, serat, air, abu, bk}` % |
| `dry_matter_pct` | `decimal(5,2)` | |
| `description` | `text` | |
| `preparation_notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `produk_komersial_brands` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `category_id` | `uuid` NOT NULL FK → `produk_komersial_categories.id` | |
| `name` | `text` NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | |
| `logo_url` | `text` | |
| `description` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `produk_komersial_categories` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` UNIQUE NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | |
| `icon` | `text` | |
| `description` | `text` | |
| `sort_order` | `int` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `produk_komersial_series` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `brand_id` | `uuid` NOT NULL FK → `produk_komersial_brands.id` | |
| `name` | `text` NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | |
| `description` | `text` | |
| `target_species` | `text[]` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `produk_komersial_products` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `series_id` | `uuid` NOT NULL FK → `produk_komersial_series.id` | |
| `brand_id` | `uuid` NOT NULL FK → `produk_komersial_brands.id` | |
| `category_id` | `uuid` NOT NULL FK → `produk_komersial_categories.id` | |
| `name` | `text` NOT NULL | |
| `packaging` | `text` | `5kg`, `25kg`, dll |
| `price_estimate` | `bigint` | Rp estimasi |
| `nutritional_content` | `jsonb` | |
| `composition` | `text` | |
| `description` | `text` | |
| `is_active` | `boolean` DEFAULT true | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.12 MARKETPLACE (8 tabel)

#### `marketplace_listings`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | penjual |
| `kategori_slug` | `text` NOT NULL FK → `marketplace_categories.slug` | |
| `title` | `text` NOT NULL | |
| `description` | `text` | |
| `price` | `bigint` NOT NULL | Rp |
| `negotiable` | `boolean` DEFAULT false | |
| `status` | `listing_status_enum` ENUM | `Draft`, `Aktif`, `Terjual`, `Ditarik`, `Moderasi`, `Kedaluwarsa`, `Diarsipkan` |
| `condition` | `text` | `Baru`, `Bekas`, `Bibit` |
| `location` | `text` | |
| `province` | `text` | |
| `asset_type` | `text` | `Livestock`, `Transport`, `DokterHewan`, `KlinikHewan`, `StokObat`, `StokPakan`, `Lainnya` |
| `asset_ref_id` | `uuid` | ID di tabel aset asal (livestock.id, dll) |
| `asset_metadata` | `jsonb` | snapshot data aset saat listing dibuat |
| `view_count` | `int` DEFAULT 0 | |
| `wishlist_count` | `int` DEFAULT 0 | |
| `published_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_listings_workspace_id`, `idx_listings_status`, `idx_listings_kategori_slug`, `idx_listings_asset_type`  
**FTS Index**: `idx_listings_fts` on `to_tsvector('indonesian', title || ' ' || description)`

---

#### `marketplace_listing_photos`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `listing_id` | `uuid` NOT NULL FK → `marketplace_listings.id` ON DELETE CASCADE | |
| `storage_url` | `text` NOT NULL | |
| `thumbnail_url` | `text` | |
| `is_primary` | `boolean` DEFAULT false | |
| `sort_order` | `int` DEFAULT 0 | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `marketplace_categories` *(seedable)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` UNIQUE NOT NULL | |
| `name` | `text` NOT NULL | |
| `icon` | `text` | |
| `description` | `text` | |
| `sort_order` | `int` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `marketplace_wishlists`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` NOT NULL FK → `auth.users.id` ON DELETE CASCADE | |
| `listing_id` | `uuid` NOT NULL FK → `marketplace_listings.id` ON DELETE CASCADE | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(user_id, listing_id)`

---

#### `marketplace_negotiations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `listing_id` | `uuid` NOT NULL FK → `marketplace_listings.id` | |
| `chat_room_id` | `uuid` FK → `marketplace_chat_rooms.id` | |
| `buyer_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `seller_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `offered_price` | `bigint` NOT NULL | |
| `counter_price` | `bigint` | |
| `status` | `negotiation_status_enum` ENUM | `Pending`, `Countered`, `Accepted`, `Rejected`, `Expired`, `Cancelled` |
| `message` | `text` | |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `marketplace_transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `listing_id` | `uuid` NOT NULL FK → `marketplace_listings.id` | |
| `transaction_room_id` | `uuid` FK → `transaction_rooms.id` | |
| `buyer_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `seller_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `agreed_price` | `bigint` NOT NULL | |
| `status` | `marketplace_transaction_status_enum` ENUM | `Baru`, `Dikonfirmasi`, `Proses`, `Dikirim`, `Diterima`, `Selesai`, `Dibatalkan`, `Sengketa` |
| `payment_method` | `text` | |
| `shipping_address` | `jsonb` | |
| `notes` | `text` | |
| `asset_synced` | `boolean` DEFAULT false | sync ke stok setelah Selesai |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `marketplace_chat_rooms`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `listing_id` | `uuid` NOT NULL FK → `marketplace_listings.id` | |
| `buyer_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `seller_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `status` | `text` | `Aktif`, `Ditutup`, `Diblokir` |
| `unread_buyer` | `int` DEFAULT 0 | |
| `unread_seller` | `int` DEFAULT 0 | |
| `last_message_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(listing_id, buyer_workspace_id)` — satu chat per pasangan pembeli-listing

---

#### `marketplace_chat_messages`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `marketplace_chat_rooms.id` ON DELETE CASCADE | |
| `sender_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `sender_role` | `text` NOT NULL | `Pembeli`, `Penjual` |
| `message_type` | `text` | `Text`, `Image`, `Offer`, `System` |
| `content` | `text` | |
| `attachment_url` | `text` | |
| `metadata` | `jsonb` | untuk pesan Offer, dll |
| `is_read` | `boolean` DEFAULT false | |
| `read_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_chat_messages_room_id`, `idx_chat_messages_created_at`

---

#### `marketplace_moderations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `listing_id` | `uuid` FK → `marketplace_listings.id` | |
| `reported_by_workspace_id` | `uuid` FK → `workspaces.id` | |
| `moderation_type` | `text` | `Laporan`, `Review Admin`, `Auto-Flag` |
| `reason` | `text` | |
| `status` | `moderation_status_enum` ENUM | `Pending`, `UnderReview`, `Resolved`, `Ditolak` |
| `action_taken` | `text` | |
| `reviewed_by` | `uuid` FK → `auth.users.id` | admin |
| `reviewed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.13 TRANSACTION ROOM & ESCROW (9 tabel)

#### `transaction_rooms`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `marketplace_transaction_id` | `uuid` UNIQUE FK → `marketplace_transactions.id` | |
| `buyer_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `seller_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `status` | `room_status_enum` ENUM | `Open`, `EscrowRequested`, `EscrowActive`, `TransportArranged`, `InTransit`, `DeliveryConfirmed`, `ReceiverConfirmed`, `Completed`, `Disputed`, `Cancelled`, `Refunded`, `Closed` |
| `has_escrow` | `boolean` DEFAULT false | |
| `has_transport` | `boolean` DEFAULT false | |
| `total_amount` | `bigint` | |
| `notes` | `text` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_participants`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` ON DELETE CASCADE | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `role` | `participant_role_enum` ENUM | `Buyer`, `Seller`, `Transport`, `Escrow`, `Judge`, `Observer` |
| `joined_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(room_id, workspace_id, role)`

---

#### `transaction_attachments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` ON DELETE CASCADE | |
| `uploaded_by_workspace_id` | `uuid` FK → `workspaces.id` | |
| `file_name` | `text` NOT NULL | |
| `file_type` | `text` | |
| `storage_url` | `text` NOT NULL | |
| `description` | `text` | |
| `attachment_type` | `text` | `Dokumen`, `Foto`, `Invoice`, `Bukti Pembayaran`, `Lainnya` |
| `uploaded_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_receipts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` UNIQUE NOT NULL FK → `transaction_rooms.id` | |
| `receipt_number` | `text` UNIQUE NOT NULL | |
| `amount` | `bigint` NOT NULL | |
| `escrow_fee` | `bigint` DEFAULT 0 | |
| `transport_fee` | `bigint` DEFAULT 0 | |
| `total` | `bigint` NOT NULL | |
| `payment_method` | `text` | |
| `issued_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `escrow_transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` | |
| `escrow_account_id` | `uuid` FK → `escrow_accounts.id` | |
| `amount` | `bigint` NOT NULL | |
| `fee` | `bigint` DEFAULT 0 | |
| `status` | `escrow_status_enum` ENUM | `Pending`, `Funded`, `Held`, `Released`, `Refunded`, `Disputed`, `Cancelled` |
| `funded_at` | `timestamptz` | |
| `released_at` | `timestamptz` | |
| `release_requested_by` | `participant_role_enum` ENUM | siapa yang meminta rilis |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `escrow_accounts` *(seed/master data)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `bank_name` | `text` NOT NULL | |
| `account_number` | `text` NOT NULL | |
| `account_holder` | `text` NOT NULL | |
| `account_type` | `text` | `Tabungan`, `Giro`, `Virtual Account` |
| `is_active` | `boolean` DEFAULT true | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `transport_transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` | |
| `transport_workspace_id` | `uuid` FK → `workspaces.id` | workspace penyedia transport |
| `transport_listing_id` | `uuid` FK → `marketplace_listings.id` | |
| `quotation_id` | `uuid` FK → `service_quotations.id` | |
| `origin` | `text` | |
| `destination` | `text` | |
| `scheduled_date` | `date` | |
| `fee` | `bigint` | |
| `status` | `transport_status_enum` ENUM | `Pending`, `Confirmed`, `InTransit`, `Delivered`, `Cancelled` |
| `vehicle_type` | `text` | |
| `driver_name` | `text` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_conversations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` UNIQUE NOT NULL FK → `transaction_rooms.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_conversation_messages`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `conversation_id` | `uuid` NOT NULL FK → `transaction_conversations.id` ON DELETE CASCADE | |
| `sender_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `sender_role` | `participant_role_enum` ENUM | |
| `content` | `text` NOT NULL | |
| `message_type` | `text` | `Text`, `System`, `Image` |
| `attachment_url` | `text` | |
| `is_read_by` | `uuid[]` | workspace IDs yang sudah baca |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_evidence`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` ON DELETE CASCADE | |
| `submitted_by_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `evidence_type` | `text` NOT NULL | `Foto Barang`, `Invoice`, `Bukti Transfer`, `Dokumen`, `Lainnya` |
| `storage_url` | `text` NOT NULL | |
| `description` | `text` | |
| `submitted_at` | `timestamptz` DEFAULT now() | |

---

#### `transaction_audit_trail`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` ON DELETE CASCADE | |
| `actor_workspace_id` | `uuid` FK → `workspaces.id` | |
| `actor_role` | `participant_role_enum` ENUM | |
| `event_type` | `text` NOT NULL | |
| `description` | `text` NOT NULL | |
| `metadata` | `jsonb` | |
| `event_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_audit_trail_room_id`, `idx_audit_trail_event_at`

---

### 1.14 LAYANAN WORKSPACE (3 tabel)

#### `layanan_transport`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `name` | `text` NOT NULL | |
| `vehicle_type` | `text` | |
| `capacity` | `text` | |
| `coverage_area` | `text[]` | wilayah layanan |
| `base_price` | `bigint` | |
| `price_per_km` | `bigint` | |
| `status` | `layanan_status_enum` ENUM | `Aktif`, `Nonaktif`, `Diarsipkan` |
| `description` | `text` | |
| `available_days` | `text[]` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `layanan_dokter_hewan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `nama` | `text` NOT NULL | nama dokter |
| `nama_klinik` | `text` | |
| `kategori` | `text` | |
| `sub_kategori` | `text` | |
| `sipv_number` | `text` | nomor SIPV |
| `spesialisasi` | `text[]` | |
| `hewan_ditangani` | `text[]` | spesies yang ditangani |
| `mode_pelayanan` | `text[]` | `Kunjungan`, `Klinik`, `Online` |
| `lokasi` | `text` | |
| `status` | `layanan_status_enum` ENUM | |
| `description` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `layanan_klinik_hewan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `nama_klinik` | `text` NOT NULL | |
| `nomor_izin` | `text` | |
| `fasilitas` | `text[]` | |
| `hewan_ditangani` | `text[]` | |
| `jam_operasional` | `jsonb` | `{senin: "08:00-17:00", ...}` |
| `lokasi` | `text` | |
| `status` | `layanan_status_enum` ENUM | |
| `description` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `service_quotations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `room_id` | `uuid` NOT NULL FK → `transaction_rooms.id` | |
| `provider_workspace_id` | `uuid` NOT NULL FK → `workspaces.id` | |
| `service_type` | `text` | `Transport`, `DokterHewan`, `KlinikHewan` |
| `service_detail` | `jsonb` | detail layanan |
| `price` | `bigint` NOT NULL | |
| `status` | `quotation_status_enum` ENUM | `Draft`, `Sent`, `Accepted`, `Rejected`, `Expired` |
| `valid_until` | `timestamptz` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### 1.15 PUBLIKASI & BERITA (4 tabel)

#### `news_publications`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` FK → `workspaces.id` | null = dari admin/RSS |
| `title` | `text` NOT NULL | |
| `slug` | `text` UNIQUE NOT NULL | |
| `content` | `text` | |
| `summary` | `text` | |
| `thumbnail_url` | `text` | |
| `tipe_konten` | `content_type_enum` ENUM | `Berita`, `Artikel`, `Event`, `Pengumuman`, `Tips`, `Regulasi` |
| `kategori` | `text` | topik/kategori |
| `tags` | `text[]` | |
| `status` | `publication_status_enum` ENUM | `Draft`, `PendingReview`, `Published`, `Rejected`, `Archived` |
| `source` | `text` | `Admin`, `Workspace`, `RSS` |
| `source_url` | `text` | URL asli jika dari RSS |
| `rss_source_id` | `uuid` FK → `rss_sources.id` | |
| `author_name` | `text` | |
| `published_at` | `timestamptz` | |
| `event_start_date` | `timestamptz` | untuk tipe Event |
| `event_end_date` | `timestamptz` | |
| `event_location` | `text` | |
| `view_count` | `int` DEFAULT 0 | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_news_status`, `idx_news_tipe_konten`, `idx_news_published_at`  
**FTS**: `idx_news_fts` on `to_tsvector('indonesian', title || ' ' || summary)`

---

#### `rss_sources`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | |
| `url` | `text` UNIQUE NOT NULL | |
| `category` | `text` | `Government`, `University`, `Industry`, `International` |
| `is_active` | `boolean` DEFAULT true | |
| `last_fetched_at` | `timestamptz` | |
| `fetch_interval_minutes` | `int` DEFAULT 60 | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `rss_queue`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `rss_source_id` | `uuid` NOT NULL FK → `rss_sources.id` | |
| `original_url` | `text` NOT NULL | |
| `title` | `text` | |
| `raw_content` | `text` | |
| `status` | `rss_queue_status_enum` ENUM | `Pending`, `Processing`, `Approved`, `Rejected`, `Duplicate` |
| `ai_score` | `decimal(3,2)` | relevance score 0-1 |
| `processed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(rss_source_id, original_url)`

---

#### `rss_collector_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `rss_source_id` | `uuid` NOT NULL FK → `rss_sources.id` | |
| `run_type` | `text` | `Auto`, `Manual` |
| `items_fetched` | `int` | |
| `items_new` | `int` | |
| `items_duplicate` | `int` | |
| `items_failed` | `int` | |
| `status` | `text` | `Success`, `Partial`, `Failed` |
| `error_message` | `text` | |
| `run_at` | `timestamptz` DEFAULT now() | |

---

### 1.16 NOTIFIKASI (2 tabel)

#### `notifications`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `recipient_user_id` | `uuid` NOT NULL FK → `auth.users.id` ON DELETE CASCADE | |
| `recipient_workspace_id` | `uuid` FK → `workspaces.id` | |
| `notification_type` | `notification_type_enum` ENUM | `Info`, `Peringatan`, `Kritis`, `Transaksi`, `Sistem`, `Promosi` |
| `source_module` | `text` | `livestock`, `marketplace`, `health`, dll |
| `source_entity_id` | `uuid` | ID entitas sumber |
| `title` | `text` NOT NULL | |
| `message` | `text` NOT NULL | |
| `icon` | `text` | |
| `action_label` | `text` | |
| `action_route` | `text` | |
| `action_params` | `jsonb` | |
| `is_read` | `boolean` DEFAULT false | |
| `read_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_notifications_recipient`, `idx_notifications_is_read`, `idx_notifications_created_at`

---

#### `alert_reminders`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `livestock_id` | `uuid` FK → `livestock.id` | |
| `alert_type` | `text` | `VaksinasiJatuhTempo`, `ObatHabis`, `BeratTargetTercapai`, `CheckupDiperlukan`, dll |
| `title` | `text` NOT NULL | |
| `message` | `text` | |
| `severity` | `text` | `Info`, `Warning`, `Critical` |
| `due_date` | `date` | |
| `is_dismissed` | `boolean` DEFAULT false | |
| `dismissed_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

### 1.17 TRUST & VERIFIKASI (2 tabel)

#### `trust_verifications`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `verification_type` | `verification_type_enum` ENUM | `KTP`, `NPWP`, `SIUP`, `Sertifikat`, `LokasiUsaha`, `Rekening`, `Lainnya` |
| `status` | `verification_status_enum` ENUM | `Draft`, `Submitted`, `UnderReview`, `Approved`, `Rejected`, `Expired`, `Suspended` |
| `submitted_at` | `timestamptz` | |
| `reviewed_at` | `timestamptz` | |
| `reviewed_by` | `uuid` FK → `auth.users.id` | admin |
| `rejection_reason` | `text` | |
| `expires_at` | `timestamptz` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

#### `trust_verification_evidence`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `verification_id` | `uuid` NOT NULL FK → `trust_verifications.id` ON DELETE CASCADE | |
| `file_name` | `text` NOT NULL | |
| `storage_url` | `text` NOT NULL | |
| `file_type` | `text` | |
| `description` | `text` | |
| `uploaded_at` | `timestamptz` DEFAULT now() | |

---

### 1.18 MEDIA (1 tabel)

#### `media`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `media_type` | `media_type_enum` ENUM | `image`, `document`, `attachment`, `avatar`, `cover`, `gallery`, `audio`, `video`, `pdf`, `spreadsheet` |
| `media_category` | `media_category_enum` ENUM | `livestock`, `marketplace`, `health`, `feed`, `transaction`, `profile`, `workspace`, `trust`, `news`, `admin`, `system`, dll |
| `file_name` | `text` NOT NULL | |
| `mime_type` | `text` | |
| `file_size_bytes` | `bigint` | |
| `width` | `int` | untuk image/video |
| `height` | `int` | |
| `storage_url` | `text` NOT NULL | |
| `cdn_url` | `text` | |
| `owner_workspace_id` | `uuid` FK → `workspaces.id` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `alt_text` | `text` | |
| `tags` | `text[]` | |
| `status` | `text` | `active`, `pending`, `deleted` |
| `deleted_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### 1.19 AI INSIGHT (1 tabel)

#### `ai_insights`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` NOT NULL FK → `workspaces.id` ON DELETE CASCADE | |
| `source_module` | `text` NOT NULL | `livestock`, `batch`, `health`, `feed`, `reproduction`, `marketplace`, `finance`, `system` |
| `entity_type` | `text` | `livestock`, `batch`, `formula`, dll |
| `entity_id` | `uuid` | ID entitas yang di-insight |
| `priority` | `insight_priority_enum` ENUM | `critical`, `high`, `medium`, `low`, `info` |
| `title` | `text` NOT NULL | |
| `summary` | `text` | |
| `description` | `text` | |
| `recommendation` | `text` | |
| `confidence_score` | `decimal(3,2)` | 0.00-1.00 |
| `generated_by` | `text` | `rule_based`, `statistical`, `ai_model` |
| `is_dismissed` | `boolean` DEFAULT false | |
| `expired_at` | `timestamptz` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_ai_insights_workspace_id`, `idx_ai_insights_source_module`, `idx_ai_insights_priority`

---

### 1.20 AUDIT TRAIL GLOBAL (1 tabel)

#### `global_audit_trail`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` FK → `workspaces.id` | |
| `user_id` | `uuid` FK → `auth.users.id` | |
| `action` | `text` NOT NULL | `CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`, `PUBLISH`, dll |
| `entity_type` | `text` NOT NULL | nama tabel/entitas |
| `entity_id` | `uuid` | |
| `old_data` | `jsonb` | snapshot sebelum |
| `new_data` | `jsonb` | snapshot sesudah |
| `ip_address` | `inet` | |
| `user_agent` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_audit_trail_workspace_id`, `idx_audit_trail_entity`, `idx_audit_trail_created_at`  
**Partisi rekomendasi**: RANGE on `created_at` per bulan (jika volume tinggi)

---

### 1.21 SEARCH INDEX (1 tabel)

#### `search_index`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `workspace_id` | `uuid` FK → `workspaces.id` | |
| `entity_type` | `text` NOT NULL | |
| `entity_id` | `uuid` NOT NULL | |
| `title` | `text` NOT NULL | |
| `subtitle` | `text` | |
| `keywords` | `text` | |
| `tags` | `text[]` | |
| `search_vector` | `tsvector` | generated dari title+keywords |
| `status` | `text` | `active`, `inactive` |
| `last_indexed_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(entity_type, entity_id)`  
**Index**: `idx_search_fts` USING GIN on `search_vector`

---

### 1.22 REFERENSI GLOBAL (1 tabel — seedable)

#### `global_reference`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `reference_type` | `text` NOT NULL | `ENTITY_TYPE`, `STATUS`, `CATEGORY`, `TAG`, dll |
| `code` | `text` NOT NULL | |
| `label` | `text` NOT NULL | |
| `value` | `text` | |
| `metadata` | `jsonb` | |
| `status` | `text` DEFAULT 'active' | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(reference_type, code)`

---

### 1.23 ADMIN (5 tabel)

#### `admin_announcements`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `title` | `text` NOT NULL | |
| `content` | `text` NOT NULL | |
| `announcement_type` | `text` | `Info`, `Warning`, `Critical`, `Maintenance` |
| `target_audience` | `text` | `All`, `Free`, `Starter`, `Professional`, `Enterprise` |
| `is_active` | `boolean` DEFAULT true | |
| `published_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | |
| `created_by` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `platform_config`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `key` | `text` UNIQUE NOT NULL | |
| `value` | `jsonb` NOT NULL | |
| `description` | `text` | |
| `is_public` | `boolean` DEFAULT false | bisa dibaca tanpa auth |
| `updated_by` | `uuid` FK → `auth.users.id` | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Seed entries**: `platform_initialized`, `maintenance_mode`, `allowed_species`, `escrow_enabled`, `marketplace_enabled`, dll

---

#### `data_master`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `category` | `text` NOT NULL | kategori master data |
| `key` | `text` NOT NULL | |
| `label` | `text` NOT NULL | |
| `value` | `text` | |
| `metadata` | `jsonb` | |
| `is_active` | `boolean` DEFAULT true | |
| `sort_order` | `int` DEFAULT 0 | |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**Unique**: `(category, key)`

---

#### `backup_records`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `backup_type` | `text` | `Full`, `Incremental`, `Schema`, `Media`, `Config` |
| `status` | `text` | `Scheduled`, `Running`, `Completed`, `Failed`, `Cancelled` |
| `file_name` | `text` | |
| `file_size_bytes` | `bigint` | |
| `storage_url` | `text` | |
| `triggered_by` | `uuid` FK → `auth.users.id` | null = auto-schedule |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `notes` | `text` | |
| `created_at` | `timestamptz` DEFAULT now() | |

---

#### `system_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK DEFAULT gen_random_uuid() | |
| `log_level` | `text` | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `source` | `text` | nama service/modul |
| `message` | `text` NOT NULL | |
| `metadata` | `jsonb` | |
| `workspace_id` | `uuid` FK → `workspaces.id` | |
| `user_id` | `uuid` FK → `auth.users.id` | |
| `created_at` | `timestamptz` DEFAULT now() | |

**Index**: `idx_system_logs_level`, `idx_system_logs_created_at`  
**Retention**: Hapus otomatis log > 90 hari via pg_cron atau trigger

---

## BAGIAN 2 — DAFTAR RELASI ANTAR TABEL

```
auth.users ──< user_profiles (1:1)
auth.users ──< workspace_members >── workspaces
workspaces ──< workspace_members
workspaces ──< workspace_invitations
workspaces ──< workspace_subscriptions >── subscription_plans
workspaces ──< workspace_relationships >── workspaces
workspaces ──< ownership_transfers

workspaces ──< livestock
livestock ──< livestock_extended_metadata (1:1)
livestock ──< livestock_edit_history
livestock ──< livestock_photos
livestock ──< livestock_weight_entries
livestock ──< livestock_ownership_history
livestock ──< pedigree_links (self-referencing M:M)
livestock ──< livestock_transfers
livestock ──< mutation_requests (M:M via livestock_ids array)
livestock ──< batch_members >── batches
batches ──< batch_history
batches ──< batch_operations

livestock ──< health_checkups
livestock ──< health_treatments
health_checkups ──< health_treatments (optional link)
health_treatments >── drug_catalog
drug_catalog >── drug_categories
drug_catalog >── drug_sub_categories
drug_sub_categories >── drug_categories
livestock ──< health_control_schedules
disease_catalog >── disease_categories

workspaces ──< stok_obat
stok_obat >── drug_catalog
stok_obat ──< stok_obat_masuk
stok_obat ──< stok_obat_keluar
stok_obat_keluar >── health_treatments
stok_obat ──< stok_obat_adjustments

workspaces ──< reproduksi_programs
reproduksi_programs ──< pelaksanaan_reproduksi
reproduksi_programs ──< monitoring_reproduksi
pelaksanaan_reproduksi ──< monitoring_reproduksi
livestock ──< pemeriksaan_kebuntingan >── reproduksi_programs
pemeriksaan_kebuntingan ──< kebuntingan (1:1)
livestock (dam) ──< kebuntingan
livestock (sire) ──< kebuntingan
kebuntingan ──< kelahiran (1:1)
kelahiran ──< registrasi_anak
registrasi_anak >── livestock (new child, optional)
registrasi_anak ──< sapih (1:1)

workspaces ──< feed_formulas
feed_formulas ──< feed_formula_ingredients
feed_formula_ingredients >── master_pakan_catalog
feed_formula_ingredients >── produk_komersial_products
feed_formulas ──< feed_formula_productions
workspaces ──< stok_inventaris
stok_inventaris >── master_pakan_catalog
stok_inventaris >── feed_formulas
stok_inventaris ──< stok_inventaris_transactions
workspaces ──< jadwal_pemberian_pakan
jadwal_pemberian_pakan ──< pemberian_pakan
livestock ──< pemberian_pakan
batches ──< pemberian_pakan
feed_formulas ──< pemberian_pakan

master_pakan_catalog >── master_pakan_categories
produk_komersial_products >── produk_komersial_series >── produk_komersial_brands >── produk_komersial_categories

workspaces ──< marketplace_listings
marketplace_listings ──< marketplace_listing_photos
marketplace_listings ──< marketplace_wishlists >── auth.users
marketplace_listings ──< marketplace_negotiations
marketplace_negotiations >── marketplace_chat_rooms
marketplace_listings ──< marketplace_chat_rooms
marketplace_chat_rooms ──< marketplace_chat_messages
marketplace_listings ──< marketplace_transactions
marketplace_listings ──< marketplace_moderations
marketplace_listings >── marketplace_categories

marketplace_transactions ──< transaction_rooms (1:1)
transaction_rooms ──< transaction_participants >── workspaces
transaction_rooms ──< transaction_attachments
transaction_rooms ──< transaction_receipts (1:1)
transaction_rooms ──< escrow_transactions
escrow_transactions >── escrow_accounts
transaction_rooms ──< transport_transactions
transport_transactions >── marketplace_listings
transport_transactions >── service_quotations
transaction_rooms ──< transaction_conversations (1:1)
transaction_conversations ──< transaction_conversation_messages
transaction_rooms ──< transaction_evidence
transaction_rooms ──< transaction_audit_trail

workspaces ──< layanan_transport
workspaces ──< layanan_dokter_hewan
workspaces ──< layanan_klinik_hewan
transaction_rooms ──< service_quotations

workspaces ──< trust_verifications
trust_verifications ──< trust_verification_evidence
workspaces ──< workspace_relationships >── workspaces

workspaces ──< notifications >── auth.users
workspaces ──< alert_reminders
workspaces ──< ai_insights
workspaces ──< news_publications
rss_sources ──< rss_queue
rss_sources ──< rss_collector_logs
news_publications >── rss_sources

workspaces ──< feed_store_workspace_profiles (1:1)
workspaces ──< farm_profiles (1:1)
workspaces ──< global_audit_trail
workspaces ──< search_index
```

---

## BAGIAN 3 — ERD TEKSTUAL

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                        │
│  auth.users ←─────── user_profiles                      │
└──────────────────────────┬──────────────────────────────┘
                           │ owner_id / user_id
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    WORKSPACE CORE                        │
│  workspaces ──┬── workspace_members                     │
│               ├── workspace_invitations                  │
│               ├── workspace_subscriptions                │
│               │     └── subscription_plans               │
│               ├── workspace_relationships                │
│               └── ownership_transfers                    │
└──────────────────────────┬──────────────────────────────┘
              workspace_id │
        ┌──────────────────┼───────────────────────┐
        ▼                  ▼                        ▼
┌────────────┐   ┌─────────────────┐   ┌───────────────────┐
│ LIVESTOCK  │   │  MARKETPLACE    │   │   TRANSACTION     │
│            │   │                 │   │   ROOM            │
│ livestock  │   │ listings ──────►│   │                   │
│  ├─ ext    │   │  ├─ photos      │   │ transaction_rooms  │
│  ├─ edit   │   │  ├─ wishlists   │   │  ├─ participants  │
│  ├─ photos │   │  ├─ negosias.   │   │  ├─ attachments   │
│  ├─ weight │   │  ├─ chat rooms  │   │  ├─ receipts      │
│  ├─ owner  │   │  │   └─ msgs    │   │  ├─ escrow        │
│  ├─ pedigr │   │  ├─ transaks.  ─┼──►│  ├─ transport     │
│  └─ transfr│   │  └─ moderasi   │   │  ├─ conversation   │
│            │   └─────────────────┘   │  │   └─ messages   │
│ ├─ batches │                         │  ├─ evidence       │
│ │  ├─ mbrs │                         │  └─ audit_trail    │
│ │  ├─ hist │                         └───────────────────┘
│ │  └─ ops  │
│ ├─ health  │   ┌─────────────────┐
│ │  ├─ chkup│   │    FEED/FORMULA │
│ │  ├─ trtmn│   │ feed_formulas   │
│ │  └─ sched│   │  └─ ingredients │
│ ├─ stok_ob │   │ stok_inventaris │
│ ├─ reprodk │   │  └─ transactions│
│ │  ├─ pgm  │   │ jadwal_pmbrian  │
│ │  ├─ plks │   │  └─ pemberian   │
│ │  ├─ mntr │   └─────────────────┘
│ │  ├─ kebun│
│ │  ├─ lahir│   ┌─────────────────┐
│ │  ├─ reg. │   │  REFERENCE DATA │
│ │  └─ sapih│   │ master_pakan_*  │
│ └─ mutation│   │ produk_komrsil_*│
└────────────┘   │ drug_catalog    │
                 │ disease_catalog │
                 │ marketplace_cat │
                 └─────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   PLATFORM SERVICES                       │
│  notifications   ai_insights    global_audit_trail        │
│  alert_reminders search_index   media                     │
│  news_publications              platform_config           │
│  rss_sources ─── rss_queue      data_master               │
│                └─ collector_logs system_logs               │
│  trust_verifications ─ evidence  backup_records           │
│  workspace_relationships                                   │
└──────────────────────────────────────────────────────────┘
```

---

## BAGIAN 4 — URUTAN MIGRATION

Migration harus dijalankan dalam urutan berikut untuk menghindari FK violation:

```
Batch 1 — Foundation (no dependencies)
  M001: CREATE TYPE (semua enum)
  M002: platform_config
  M003: global_reference
  M004: data_master

Batch 2 — Auth & Users
  M005: user_profiles (depends: auth.users)

Batch 3 — Reference/Seed Tables (no FK to user tables)
  M006: master_pakan_categories
  M007: master_pakan_catalog (depends: M006)
  M008: produk_komersial_categories
  M009: produk_komersial_brands (depends: M008)
  M010: produk_komersial_series (depends: M009)
  M011: produk_komersial_products (depends: M010)
  M012: drug_categories
  M013: drug_sub_categories (depends: M012)
  M014: drug_catalog (depends: M012, M013)
  M015: disease_categories
  M016: disease_catalog (depends: M015)
  M017: marketplace_categories
  M018: subscription_plans
  M019: feature_policies (depends: M018)
  M020: escrow_accounts
  M021: rss_sources

Batch 4 — Workspace Core
  M022: workspaces (depends: auth.users)
  M023: workspace_members (depends: M022)
  M024: workspace_invitations (depends: M022)
  M025: workspace_subscriptions (depends: M022, M018)
  M026: workspace_relationships (depends: M022)
  M027: ownership_transfers (depends: M022)

Batch 5 — Livestock Core
  M028: livestock (depends: M022)
  M029: livestock_extended_metadata (depends: M028)
  M030: livestock_edit_history (depends: M028)
  M031: livestock_photos (depends: M028)
  M032: livestock_weight_entries (depends: M028)
  M033: livestock_ownership_history (depends: M028, M022)
  M034: pedigree_links (depends: M028)
  M035: livestock_transfers (depends: M028)
  M036: mutation_requests (depends: M028, M022)

Batch 6 — Batch
  M037: batches (depends: M022)
  M038: batch_members (depends: M037, M028)
  M039: batch_history (depends: M037)
  M040: batch_operations (depends: M037)

Batch 7 — Health
  M041: health_checkups (depends: M028, M022)
  M042: health_treatments (depends: M028, M022, M041, M014)
  M043: health_control_schedules (depends: M022, M028, M037)
  M044: stok_obat (depends: M022, M014, M012)
  M045: stok_obat_masuk (depends: M044)
  M046: stok_obat_keluar (depends: M044, M042, M028)
  M047: stok_obat_adjustments (depends: M044)

Batch 8 — Reproduksi
  M048: reproduksi_programs (depends: M022)
  M049: pelaksanaan_reproduksi (depends: M048)
  M050: monitoring_reproduksi (depends: M048, M049)
  M051: pemeriksaan_kebuntingan (depends: M048, M028, M022)
  M052: kebuntingan (depends: M051, M028)
  M053: kelahiran (depends: M052)
  M054: registrasi_anak (depends: M053, M028, M022)
  M055: sapih (depends: M054, M028, M022)

Batch 9 — Pakan & Formula
  M056: feed_formulas (depends: M022)
  M057: feed_formula_ingredients (depends: M056, M007, M011)
  M058: feed_formula_productions (depends: M056, M022)
  M059: stok_inventaris (depends: M022, M007, M056)
  M060: stok_inventaris_transactions (depends: M059)
  M061: jadwal_pemberian_pakan (depends: M022, M028, M037, M056)
  M062: pemberian_pakan (depends: M022, M028, M037, M056, M061)

Batch 10 — Layanan Workspace
  M063: layanan_transport (depends: M022)
  M064: layanan_dokter_hewan (depends: M022)
  M065: layanan_klinik_hewan (depends: M022)

Batch 11 — Marketplace
  M066: marketplace_listings (depends: M022, M017)
  M067: marketplace_listing_photos (depends: M066)
  M068: marketplace_wishlists (depends: M066)
  M069: marketplace_chat_rooms (depends: M066, M022)
  M070: marketplace_chat_messages (depends: M069, M022)
  M071: marketplace_negotiations (depends: M066, M022, M069)
  M072: marketplace_transactions (depends: M066, M022)
  M073: marketplace_moderations (depends: M066, M022)

Batch 12 — Transaction Room
  M074: transaction_rooms (depends: M072, M022)
  M075: transaction_participants (depends: M074, M022)
  M076: transaction_attachments (depends: M074, M022)
  M077: transaction_receipts (depends: M074)
  M078: service_quotations (depends: M074, M022)
  M079: escrow_transactions (depends: M074, M020)
  M080: transport_transactions (depends: M074, M022, M066, M078)
  M081: transaction_conversations (depends: M074)
  M082: transaction_conversation_messages (depends: M081, M022)
  M083: transaction_evidence (depends: M074, M022)
  M084: transaction_audit_trail (depends: M074, M022)

Batch 13 — Platform Services
  M085: media (depends: M022)
  M086: notifications (depends: auth.users, M022)
  M087: alert_reminders (depends: M022, M028)
  M088: ai_insights (depends: M022)
  M089: trust_verifications (depends: M022)
  M090: trust_verification_evidence (depends: M089)
  M091: news_publications (depends: M022, M021)
  M092: rss_queue (depends: M021)
  M093: rss_collector_logs (depends: M021)
  M094: global_audit_trail (depends: M022)
  M095: search_index (depends: M022)
  M096: admin_announcements
  M097: backup_records
  M098: system_logs (depends: M022)
```

---

## BAGIAN 5 — DEPENDENCY MIGRATION

```
platform_config          ← (none)
global_reference         ← (none)
data_master              ← (none)
user_profiles            ← auth.users
workspaces               ← auth.users
workspace_members        ← workspaces, auth.users
workspace_subscriptions  ← workspaces, subscription_plans
livestock                ← workspaces
pedigree_links           ← livestock (self-ref)
batches                  ← workspaces
batch_members            ← batches, livestock
health_checkups          ← livestock, workspaces
health_treatments        ← livestock, workspaces, health_checkups, drug_catalog
stok_obat                ← workspaces, drug_catalog
stok_obat_keluar         ← stok_obat, health_treatments, livestock
reproduksi_programs      ← workspaces
kebuntingan              ← pemeriksaan_kebuntingan, livestock (dam), livestock (sire)
registrasi_anak          ← kelahiran, livestock (child — NULLABLE)
feed_formulas            ← workspaces
feed_formula_ingredients ← feed_formulas, master_pakan_catalog OR produk_komersial_products
stok_inventaris          ← workspaces, master_pakan_catalog, feed_formulas
marketplace_listings     ← workspaces, marketplace_categories
marketplace_chat_rooms   ← marketplace_listings, workspaces (buyer+seller)
marketplace_transactions ← marketplace_listings, workspaces, marketplace_chat_rooms
transaction_rooms        ← marketplace_transactions, workspaces
escrow_transactions      ← transaction_rooms, escrow_accounts
transport_transactions   ← transaction_rooms, workspaces, marketplace_listings, service_quotations
service_quotations       ← transaction_rooms, workspaces (harus ada sebelum transport_transactions)
trust_verifications      ← workspaces
notifications            ← auth.users, workspaces
ai_insights              ← workspaces
news_publications        ← workspaces (nullable), rss_sources (nullable)
global_audit_trail       ← workspaces (nullable), auth.users (nullable)
search_index             ← workspaces (nullable)
```

---

## BAGIAN 6 — STORAGE BUCKET

| Bucket | Tujuan | Akses | Ukuran Max |
|---|---|---|---|
| `livestock-photos` | Foto hewan ternak | Private (RLS by workspace) | 10MB/file |
| `marketplace-media` | Foto listing, lampiran transaksi | Mixed (listing publik, transaksi private) | 20MB/file |
| `trust-documents` | KTP, NPWP, SIUP, sertifikat untuk verifikasi | Private (owner + admin only) | 20MB/file |
| `news-media` | Thumbnail artikel, foto event | Public | 10MB/file |
| `workspace-media` | Avatar workspace, cover, galeri profil farm | Public (profile photos), Private (internal) | 10MB/file |
| `transaction-evidence` | Bukti pembayaran, dokumen transaksi, foto barang | Private (participants only) | 30MB/file |

### Kebijakan Storage

- **livestock-photos**: Owner dan Admin workspace bisa upload/delete. Publik bisa read jika listing aktif di marketplace.
- **marketplace-media**: Penjual bisa upload foto listing. Semua bisa read foto listing aktif.
- **trust-documents**: Hanya owner workspace bisa upload. Hanya admin platform dan owner bisa read.
- **news-media**: Admin platform bisa upload. Semua bisa read.
- **workspace-media**: Profil foto workspace bisa dibaca publik. Media internal hanya untuk anggota workspace.
- **transaction-evidence**: Hanya peserta transaksi yang bisa upload dan read.

---

## BAGIAN 7 — RLS POLICY

### 7.1 user_profiles
```sql
-- SELECT: user hanya bisa baca profil sendiri
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- UPDATE: user hanya bisa update profil sendiri
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- INSERT: hanya system (via trigger saat registrasi)
CREATE POLICY "user_profiles_insert_system"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());
```

### 7.2 workspaces
```sql
-- SELECT: member workspace bisa read
CREATE POLICY "workspaces_select_members"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND status = 'Aktif'
    )
  );

-- SELECT: publik bisa read workspace yang Verified
CREATE POLICY "workspaces_select_public"
  ON workspaces FOR SELECT
  USING (verification_status = 'Verified');

-- INSERT: user terautentikasi bisa buat workspace
CREATE POLICY "workspaces_insert_authenticated"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: hanya Owner dan Admin workspace
CREATE POLICY "workspaces_update_admin"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND role IN ('Owner', 'Admin')
      AND status = 'Aktif'
    )
  );
```

### 7.3 livestock
```sql
-- SELECT: member workspace bisa read ternak workspace sendiri
CREATE POLICY "livestock_select_workspace"
  ON livestock FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = livestock.workspace_id
      AND user_id = auth.uid()
      AND status = 'Aktif'
    )
  );

-- INSERT/UPDATE/DELETE: hanya Owner, Admin, Staff
CREATE POLICY "livestock_write_staff"
  ON livestock FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = livestock.workspace_id
      AND user_id = auth.uid()
      AND role IN ('Owner', 'Admin', 'Staff')
      AND status = 'Aktif'
    )
  );
```

### 7.4 marketplace_listings
```sql
-- SELECT: listing aktif bisa dibaca semua (termasuk guest)
CREATE POLICY "listings_select_public"
  ON marketplace_listings FOR SELECT
  USING (status = 'Aktif');

-- SELECT: pemilik bisa baca semua listing miliknya
CREATE POLICY "listings_select_owner"
  ON marketplace_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = marketplace_listings.workspace_id
      AND user_id = auth.uid()
      AND status = 'Aktif'
    )
  );

-- INSERT/UPDATE/DELETE: hanya pemilik workspace listing
CREATE POLICY "listings_write_owner"
  ON marketplace_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = marketplace_listings.workspace_id
      AND user_id = auth.uid()
      AND role IN ('Owner', 'Admin', 'Staff')
      AND status = 'Aktif'
    )
  );
```

### 7.5 marketplace_chat_messages
```sql
-- SELECT/INSERT: hanya peserta chat room
CREATE POLICY "chat_messages_participants"
  ON marketplace_chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_chat_rooms cr
      JOIN workspace_members wm ON (
        wm.workspace_id = cr.buyer_workspace_id
        OR wm.workspace_id = cr.seller_workspace_id
      )
      WHERE cr.id = marketplace_chat_messages.room_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'Aktif'
    )
  );
```

### 7.6 transaction_rooms & sub-tables
```sql
-- SELECT/INSERT: hanya peserta transaksi
CREATE POLICY "transaction_rooms_participants"
  ON transaction_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transaction_participants tp
      JOIN workspace_members wm ON wm.workspace_id = tp.workspace_id
      WHERE tp.room_id = transaction_rooms.id
      AND wm.user_id = auth.uid()
      AND wm.status = 'Aktif'
    )
  );
-- (Pola yang sama berlaku untuk sub-tabel: attachments, receipts, evidence, audit_trail, conversations)
```

### 7.7 notifications
```sql
-- SELECT: hanya penerima notifikasi
CREATE POLICY "notifications_select_recipient"
  ON notifications FOR SELECT
  USING (recipient_user_id = auth.uid());

-- UPDATE: hanya penerima (untuk mark as read)
CREATE POLICY "notifications_update_recipient"
  ON notifications FOR UPDATE
  USING (recipient_user_id = auth.uid());

-- INSERT: hanya service role (server-side)
CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### 7.8 trust_verifications
```sql
-- SELECT: workspace owner dan admin platform
CREATE POLICY "trust_select"
  ON trust_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = trust_verifications.workspace_id
      AND user_id = auth.uid()
      AND role IN ('Owner', 'Admin')
      AND status = 'Aktif'
    )
  );
```

### 7.9 global_audit_trail
```sql
-- SELECT: hanya admin platform (via system_admin metadata)
CREATE POLICY "audit_trail_admin_only"
  ON global_audit_trail FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'system_admin' = 'true'
  );

-- INSERT: service role only
CREATE POLICY "audit_trail_insert_service"
  ON global_audit_trail FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### 7.10 news_publications
```sql
-- SELECT: semua bisa baca yang Published
CREATE POLICY "news_select_published"
  ON news_publications FOR SELECT
  USING (status = 'Published');

-- INSERT/UPDATE: workspace owner untuk submisi, admin untuk semua
CREATE POLICY "news_write_workspace"
  ON news_publications FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = news_publications.workspace_id
      AND user_id = auth.uid()
      AND role IN ('Owner', 'Admin')
      AND status = 'Aktif'
    )
  );
```

### 7.11 ai_insights
```sql
-- SELECT/UPDATE: hanya anggota workspace yang bersangkutan
CREATE POLICY "ai_insights_workspace"
  ON ai_insights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = ai_insights.workspace_id
      AND user_id = auth.uid()
      AND status = 'Aktif'
    )
  );
```

---

## BAGIAN 8 — FUNCTION

```sql
-- F01: Otomatis buat user_profile saat user baru registrasi
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F02: Update updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F03: Cek apakah user adalah anggota workspace
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id uuid, p_role text[] DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
    AND status = 'Aktif'
    AND (p_role IS NULL OR role = ANY(p_role))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F04: Sync location_status livestock setelah transfer
CREATE OR REPLACE FUNCTION sync_livestock_location_after_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_type = 'Keluar Sementara' THEN
    UPDATE livestock SET location_status = 'Luar Kandang', location_detail = NEW.destination
    WHERE id = NEW.livestock_id;
  ELSIF NEW.transfer_type = 'Masuk Kembali' THEN
    UPDATE livestock SET location_status = 'Di Kandang', location_detail = NEW.to_location
    WHERE id = NEW.livestock_id;
  ELSIF NEW.transfer_type = 'Keluar Permanen' THEN
    UPDATE livestock SET location_status = 'Arsip', archive_reason = NEW.archive_reason, archived_at = now()
    WHERE id = NEW.livestock_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F05: Kurangi stok obat saat stok_obat_keluar INSERT
CREATE OR REPLACE FUNCTION deduct_stok_obat()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stok_obat
  SET quantity = quantity - NEW.quantity,
      status = CASE WHEN (quantity - NEW.quantity) <= 0 THEN 'Habis' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F06: Tambah stok obat saat stok_obat_masuk INSERT
CREATE OR REPLACE FUNCTION add_stok_obat()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stok_obat
  SET quantity = quantity + NEW.quantity,
      status = CASE WHEN status = 'Habis' THEN 'Aktif' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F07: Update last_message_at di chat room
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_chat_rooms
  SET last_message_at = NEW.created_at,
      unread_buyer = CASE WHEN NEW.sender_role = 'Penjual' THEN unread_buyer + 1 ELSE unread_buyer END,
      unread_seller = CASE WHEN NEW.sender_role = 'Pembeli' THEN unread_seller + 1 ELSE unread_seller END
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- F08: Sync wishlist_count di listing saat wishlist INSERT/DELETE
CREATE OR REPLACE FUNCTION sync_listing_wishlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings SET wishlist_count = wishlist_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings SET wishlist_count = GREATEST(wishlist_count - 1, 0) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- F09: Insert ke global_audit_trail (wrapper untuk SECURITY DEFINER)
CREATE OR REPLACE FUNCTION add_audit_event(
  p_workspace_id uuid, p_user_id uuid, p_action text,
  p_entity_type text, p_entity_id uuid,
  p_old_data jsonb DEFAULT NULL, p_new_data jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO global_audit_trail
    (workspace_id, user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES
    (p_workspace_id, p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F10: Check apakah livestock punya kebuntingan aktif (guard double-pregnancy)
CREATE OR REPLACE FUNCTION has_active_pregnancy(p_livestock_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kebuntingan
    WHERE dam_id = p_livestock_id AND status = 'Aktif'
  );
END;
$$ LANGUAGE plpgsql;

-- F11: Hitung ADG (Average Daily Gain) untuk livestock
CREATE OR REPLACE FUNCTION calculate_adg(p_livestock_id uuid)
RETURNS decimal AS $$
DECLARE
  v_first_weight decimal;
  v_last_weight decimal;
  v_first_date date;
  v_last_date date;
  v_days int;
BEGIN
  SELECT weight_kg, date INTO v_first_weight, v_first_date
  FROM livestock_weight_entries WHERE livestock_id = p_livestock_id
  ORDER BY date ASC LIMIT 1;

  SELECT weight_kg, date INTO v_last_weight, v_last_date
  FROM livestock_weight_entries WHERE livestock_id = p_livestock_id
  ORDER BY date DESC LIMIT 1;

  v_days := v_last_date - v_first_date;
  IF v_days <= 0 THEN RETURN 0; END IF;
  RETURN (v_last_weight - v_first_weight) / v_days;
END;
$$ LANGUAGE plpgsql;

-- F12: Rebuild search vector untuk entitas
CREATE OR REPLACE FUNCTION upsert_search_index(
  p_workspace_id uuid, p_entity_type text, p_entity_id uuid,
  p_title text, p_subtitle text, p_keywords text, p_tags text[]
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_index
    (workspace_id, entity_type, entity_id, title, subtitle, keywords, tags,
     search_vector, last_indexed_at)
  VALUES
    (p_workspace_id, p_entity_type, p_entity_id, p_title, p_subtitle, p_keywords, p_tags,
     to_tsvector('indonesian', p_title || ' ' || COALESCE(p_subtitle, '') || ' ' || COALESCE(p_keywords, '')),
     now())
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, keywords = EXCLUDED.keywords,
    tags = EXCLUDED.tags, search_vector = EXCLUDED.search_vector, last_indexed_at = now();
END;
$$ LANGUAGE plpgsql;

-- F13: Tandai livestock_ownership_history lama sebagai non-current
CREATE OR REPLACE FUNCTION close_current_ownership(p_livestock_id uuid, p_end_date date)
RETURNS void AS $$
BEGIN
  UPDATE livestock_ownership_history
  SET end_date = p_end_date, is_current = false
  WHERE livestock_id = p_livestock_id AND is_current = true;
END;
$$ LANGUAGE plpgsql;

-- F14: Bersihkan system_logs lama (> 90 hari)
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM system_logs WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## BAGIAN 9 — TRIGGER

```sql
-- T01: Buat user_profile otomatis saat user baru
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- T02-T20: update_updated_at untuk semua tabel dengan kolom updated_at
-- (workspaces, workspace_members, livestock, batches, health_checkups, health_treatments,
--  stok_obat, feed_formulas, marketplace_listings, marketplace_transactions,
--  transaction_rooms, escrow_transactions, notifications, trust_verifications, news_publications)
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (ulangi pola yang sama untuk semua tabel listed di atas)

-- T21: Sync livestock location setelah transfer
CREATE TRIGGER after_transfer_sync_location
  AFTER INSERT ON livestock_transfers
  FOR EACH ROW EXECUTE FUNCTION sync_livestock_location_after_transfer();

-- T22: Kurangi stok obat
CREATE TRIGGER after_stok_obat_keluar
  AFTER INSERT ON stok_obat_keluar
  FOR EACH ROW EXECUTE FUNCTION deduct_stok_obat();

-- T23: Tambah stok obat
CREATE TRIGGER after_stok_obat_masuk
  AFTER INSERT ON stok_obat_masuk
  FOR EACH ROW EXECUTE FUNCTION add_stok_obat();

-- T24: Update chat room saat pesan baru
CREATE TRIGGER after_chat_message
  AFTER INSERT ON marketplace_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_room_last_message();

-- T25: Sync wishlist count
CREATE TRIGGER sync_wishlist_count_insert
  AFTER INSERT ON marketplace_wishlists
  FOR EACH ROW EXECUTE FUNCTION sync_listing_wishlist_count();

CREATE TRIGGER sync_wishlist_count_delete
  AFTER DELETE ON marketplace_wishlists
  FOR EACH ROW EXECUTE FUNCTION sync_listing_wishlist_count();

-- T26: Update stok inventaris setelah transaksi
CREATE TRIGGER after_stok_inventaris_transaction
  AFTER INSERT ON stok_inventaris_transactions
  FOR EACH ROW EXECUTE FUNCTION (
    -- update stok_inventaris.quantity berdasarkan quantity_delta
  );

-- T27: Guard double-pregnancy sebelum INSERT kebuntingan
CREATE TRIGGER guard_active_pregnancy
  BEFORE INSERT ON kebuntingan
  FOR EACH ROW
  WHEN (has_active_pregnancy(NEW.dam_id))
  EXECUTE FUNCTION raise_exception('Dam already has an active pregnancy');
```

---

## BAGIAN 10 — VIEW

### V01: `v_livestock_with_status`
Livestock dengan lokasi status terkini dan data pedigree ringkas.
```sql
CREATE VIEW v_livestock_with_status AS
SELECT
  l.*,
  lem.ear_tag, lem.internal_code,
  (SELECT COUNT(*) FROM batch_members bm WHERE bm.livestock_id = l.id AND bm.removed_date IS NULL) AS active_batch_count,
  (SELECT MAX(lwe.date) FROM livestock_weight_entries lwe WHERE lwe.livestock_id = l.id) AS last_weight_date,
  (SELECT lwe.weight_kg FROM livestock_weight_entries lwe WHERE lwe.livestock_id = l.id ORDER BY date DESC LIMIT 1) AS last_weight_kg
FROM livestock l
LEFT JOIN livestock_extended_metadata lem ON lem.livestock_id = l.id;
```

### V02: `v_workspace_subscription_plan`
Workspace dengan data subscription dan plan aktif.
```sql
CREATE VIEW v_workspace_subscription_plan AS
SELECT
  w.id, w.name, w.type, w.status,
  ws.status AS sub_status, ws.expires_at,
  sp.plan_key, sp.name AS plan_name, sp.features
FROM workspaces w
LEFT JOIN workspace_subscriptions ws ON ws.workspace_id = w.id
LEFT JOIN subscription_plans sp ON sp.id = ws.plan_id;
```

### V03: `v_marketplace_listing_full`
Listing dengan info workspace penjual dan foto utama.
```sql
CREATE VIEW v_marketplace_listing_full AS
SELECT
  ml.*,
  w.name AS seller_name, w.verification_status AS seller_verification,
  (SELECT storage_url FROM marketplace_listing_photos mlp
   WHERE mlp.listing_id = ml.id AND mlp.is_primary = true LIMIT 1) AS primary_photo_url
FROM marketplace_listings ml
JOIN workspaces w ON w.id = ml.workspace_id
WHERE ml.status = 'Aktif';
```

### V04: `v_transaction_room_summary`
Ringkasan transaksi room beserta status escrow dan transport.
```sql
CREATE VIEW v_transaction_room_summary AS
SELECT
  tr.*,
  et.status AS escrow_status, et.amount AS escrow_amount,
  tt.status AS transport_status, tt.fee AS transport_fee,
  trc.id AS receipt_id
FROM transaction_rooms tr
LEFT JOIN escrow_transactions et ON et.room_id = tr.id
LEFT JOIN transport_transactions tt ON tt.room_id = tr.id
LEFT JOIN transaction_receipts trc ON trc.room_id = tr.id;
```

### V05: `v_stok_obat_summary`
Ringkasan stok obat per workspace dengan total in/out.
```sql
CREATE VIEW v_stok_obat_summary AS
SELECT
  so.*,
  dc.name AS drug_name_catalog, dc.category_id,
  COALESCE((SELECT SUM(quantity) FROM stok_obat_masuk WHERE stok_obat_id = so.id), 0) AS total_masuk,
  COALESCE((SELECT SUM(quantity) FROM stok_obat_keluar WHERE stok_obat_id = so.id), 0) AS total_keluar
FROM stok_obat so
LEFT JOIN drug_catalog dc ON dc.id = so.drug_id;
```

### V06: `v_active_notifications`
Notifikasi aktif (belum dibaca, belum expired).
```sql
CREATE VIEW v_active_notifications AS
SELECT * FROM notifications
WHERE is_read = false
AND (expires_at IS NULL OR expires_at > now())
ORDER BY created_at DESC;
```

### V07: `v_health_overview_per_livestock`
Ringkasan kesehatan per ternak (checkup terakhir, treatment terakhir).
```sql
CREATE VIEW v_health_overview_per_livestock AS
SELECT
  l.id AS livestock_id, l.name, l.health_status,
  MAX(hc.checkup_date) AS last_checkup_date,
  MAX(ht.treatment_date) AS last_treatment_date,
  COUNT(DISTINCT hcs.id) FILTER (WHERE hcs.status = 'Terjadwal' AND hcs.scheduled_date >= CURRENT_DATE) AS upcoming_schedules
FROM livestock l
LEFT JOIN health_checkups hc ON hc.livestock_id = l.id
LEFT JOIN health_treatments ht ON ht.livestock_id = l.id
LEFT JOIN health_control_schedules hcs ON hcs.livestock_id = l.id
GROUP BY l.id, l.name, l.health_status;
```

### V08: `v_reproduksi_program_summary`
Ringkasan program reproduksi beserta statistik.
```sql
CREATE VIEW v_reproduksi_program_summary AS
SELECT
  rp.*,
  COUNT(DISTINCT pk.id) AS total_pemeriksaan,
  COUNT(DISTINCT k.id) AS total_kebuntingan,
  COUNT(DISTINCT kl.id) AS total_kelahiran,
  COUNT(DISTINCT ra.id) FILTER (WHERE ra.condition = 'Hidup') AS total_anak_hidup
FROM reproduksi_programs rp
LEFT JOIN pemeriksaan_kebuntingan pk ON pk.program_id = rp.id
LEFT JOIN kebuntingan k ON k.program_id = rp.id
LEFT JOIN kelahiran kl ON kl.kebuntingan_id = k.id
LEFT JOIN registrasi_anak ra ON ra.kelahiran_id = kl.id
GROUP BY rp.id;
```

### V09: `v_feed_formula_cost`
Formula pakan dengan total biaya per kg kalkulasi live.
```sql
CREATE VIEW v_feed_formula_cost AS
SELECT
  ff.*,
  SUM(ffi.percentage) AS total_percentage,
  SUM(ffi.cost_per_kg * ffi.percentage / 100) AS calculated_cost_per_kg,
  COUNT(ffi.id) AS ingredient_count
FROM feed_formulas ff
LEFT JOIN feed_formula_ingredients ffi ON ffi.formula_id = ff.id
GROUP BY ff.id;
```

### V10: `v_workspace_trust_score`
Workspace dengan rincian status verifikasi.
```sql
CREATE VIEW v_workspace_trust_score AS
SELECT
  w.id, w.name, w.trust_score, w.verification_status,
  COUNT(tv.id) FILTER (WHERE tv.status = 'Approved') AS verified_count,
  COUNT(tv.id) FILTER (WHERE tv.status = 'Submitted') AS pending_count,
  ARRAY_AGG(tv.verification_type ORDER BY tv.verification_type) FILTER (WHERE tv.status = 'Approved') AS verified_types
FROM workspaces w
LEFT JOIN trust_verifications tv ON tv.workspace_id = w.id
GROUP BY w.id, w.name, w.trust_score, w.verification_status;
```

### V11: `v_rss_queue_pending`
Antrian RSS yang menunggu review admin.
```sql
CREATE VIEW v_rss_queue_pending AS
SELECT rq.*, rs.name AS source_name, rs.category AS source_category
FROM rss_queue rq
JOIN rss_sources rs ON rs.id = rq.rss_source_id
WHERE rq.status = 'Pending'
ORDER BY rq.ai_score DESC, rq.created_at ASC;
```

---

## BAGIAN 11 — MATERIALIZED VIEW

### MV01: `mv_workspace_livestock_summary`
Statistik hewan per workspace — di-refresh setiap 1 jam atau saat ada mutasi besar.
```sql
CREATE MATERIALIZED VIEW mv_workspace_livestock_summary AS
SELECT
  l.workspace_id,
  COUNT(*) FILTER (WHERE l.location_status = 'Di Kandang') AS total_di_kandang,
  COUNT(*) FILTER (WHERE l.location_status = 'Luar Kandang') AS total_luar_kandang,
  COUNT(*) FILTER (WHERE l.location_status = 'Arsip') AS total_arsip,
  COUNT(*) FILTER (WHERE l.health_status = 'Sakit') AS total_sakit,
  COUNT(*) FILTER (WHERE l.health_status = 'Pemantauan') AS total_pemantauan,
  COUNT(*) FILTER (WHERE l.sex = 'Betina') AS total_betina,
  COUNT(*) FILTER (WHERE l.sex = 'Jantan') AS total_jantan,
  now() AS refreshed_at
FROM livestock l
GROUP BY l.workspace_id
WITH DATA;

CREATE UNIQUE INDEX ON mv_workspace_livestock_summary (workspace_id);
```

### MV02: `mv_marketplace_stats`
Statistik marketplace global — di-refresh setiap 30 menit.
```sql
CREATE MATERIALIZED VIEW mv_marketplace_stats AS
SELECT
  kategori_slug,
  COUNT(*) FILTER (WHERE status = 'Aktif') AS active_listings,
  AVG(price) FILTER (WHERE status = 'Aktif') AS avg_price,
  MIN(price) FILTER (WHERE status = 'Aktif') AS min_price,
  MAX(price) FILTER (WHERE status = 'Aktif') AS max_price,
  now() AS refreshed_at
FROM marketplace_listings
GROUP BY kategori_slug
WITH DATA;

CREATE UNIQUE INDEX ON mv_marketplace_stats (kategori_slug);
```

### MV03: `mv_platform_dashboard_kpi`
KPI dashboard admin — di-refresh setiap 1 jam.
```sql
CREATE MATERIALIZED VIEW mv_platform_dashboard_kpi AS
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM workspaces WHERE status = 'Aktif') AS active_workspaces,
  (SELECT COUNT(*) FROM livestock WHERE location_status != 'Arsip') AS total_active_livestock,
  (SELECT COUNT(*) FROM marketplace_listings WHERE status = 'Aktif') AS active_listings,
  (SELECT COUNT(*) FROM marketplace_transactions WHERE status = 'Selesai') AS completed_transactions,
  (SELECT COUNT(*) FROM trust_verifications WHERE status = 'Submitted') AS pending_verifications,
  now() AS refreshed_at
WITH DATA;
```

---

## BAGIAN 12 — DATA REFERENSI YANG BOLEH DI-SEED

Data berikut adalah **referensi statis** yang boleh di-seed pada migration awal karena tidak bergantung pada data pengguna:

| Tabel | Jumlah Record | Keterangan |
|---|---|---|
| `master_pakan_categories` | ~13 kategori | Rumput, Jagung, Konsentrat, Kacang-Bijian, dll |
| `master_pakan_catalog` | ~200+ item | Catalog bahan pakan dari berbagai sumber |
| `produk_komersial_categories` | ~5 kategori | Konsentrat, Vitamin, Obat, Mineral, Suplemen |
| `produk_komersial_brands` | ~30+ brand | Feedmill brands |
| `produk_komersial_series` | ~60+ seri | Data dari konsentratSeriData.ts |
| `produk_komersial_products` | ~200+ produk | |
| `drug_categories` | ~9 kategori | Anti-biotik, Vitamin, Vaksin, dll |
| `drug_sub_categories` | ~20+ sub-kategori | |
| `drug_catalog` | ~32+ obat | Data dari masterObatDetailData.ts |
| `disease_categories` | ~10 kategori | Infeksi Bakteri, Virus, Parasit, dll |
| `disease_catalog` | ~50+ penyakit | Dari daftarPenyakitData.ts |
| `marketplace_categories` | ~10 kategori | Ternak, Pakan, Obat, Transport, dll |
| `subscription_plans` | 4 plan | Free, Starter, Professional, Enterprise |
| `feature_policies` | 113 feature keys | Dari subscriptionFeaturePolicy.ts |
| `escrow_accounts` | ~3-5 rekening | Rekening escrow resmi TernakHub |
| `rss_sources` | ~10-15 sumber | Sumber RSS pemerintah & industri |
| `global_reference` | ~50+ record | Reference codes untuk status, tipe, dll |
| `platform_config` | ~10-15 config | Konfigurasi platform awal |
| `data_master` | ~82 entri | Dari adminDataMasterData.ts |

### Data seed yang harus diverifikasi sebelum production:
- `escrow_accounts` → rekening bank nyata (harus dikonfirmasi tim keuangan)
- `subscription_plans` → harga dan fitur harus disetujui manajemen
- `platform_config` → nilai config production berbeda dari development

---

## BAGIAN 13 — DATA YANG TIDAK BOLEH DI-SEED

Data berikut **DILARANG** di-seed ke database production karena merupakan data pengguna nyata atau data demo/mock:

| Sumber | Alasan |
|---|---|
| `LIVESTOCK_DB` (75 ternak demo) | Data fiktif untuk QA |
| `PEDIGREE_DB` | Data relasi dari ternak demo |
| `OWNERSHIP_DB` | Data kepemilikan fiktif |
| Seluruh data health records demo | Mock data untuk testing |
| Seluruh data batch demo | Mock data untuk QA |
| Seluruh data marketplace listing demo | Data fiktif |
| Seluruh data transaksi demo | Data demo, bukan transaksi nyata |
| Seluruh data chat/conversation demo | Percakapan fiktif |
| Seluruh data escrow demo | Transaksi escrow fiktif |
| `adminUsersData.ts` — user demo | User test, bukan user production |
| `workspaceFoundationData.ts` (w1-w7) | Workspace demo untuk QA |
| Data notifikasi demo | Notifikasi yang dibuat untuk testing |
| Data AI Insight demo | Insight yang di-generate dari data demo |
| Data RSS queue demo | Artikel yang dikumpulkan untuk testing |
| Data backup record demo | Log backup fiktif |
| Data monitoring/activity demo | Event monitoring fiktif |
| Data trust verification demo | Pengajuan verifikasi fiktif |
| `window.ternakDevFactory` seed | SELURUH output seed dev factory DILARANG |

### Aturan Kritis:
> **Data dari `window.ternakDevFactory.seed()` adalah data QA development-only. TIDAK BOLEH ADA satu record pun dari dev factory yang masuk ke database production.**

---

## RINGKASAN STATISTIK AUDIT

| Kategori | Jumlah |
|---|---|
| Total tabel production | 81 |
| Storage bucket | 6 |
| RLS policy group | 11 (27+ policy individual) |
| PostgreSQL function | 14 |
| Trigger | 27+ (termasuk updated_at per tabel) |
| View | 11 |
| Materialized View | 3 |
| Tabel seedable | 19 |
| ENUM type yang dibutuhkan | 35+ |
| Migration batch | 13 batch, 98 migration step |

---

## CATATAN ARSITEKTUR

1. **UUID Standard**: Seluruh PK menggunakan `uuid` dengan `gen_random_uuid()`. Format `lv-{uuid}` pada livestock ID codebase harus distandarisasi ke UUID murni di database.

2. **Soft Delete**: Semua tabel utama menggunakan soft delete via `status = 'Diarsipkan'` atau `archived_at`. Hard delete tidak digunakan kecuali untuk log yang sudah retention-expire.

3. **Workspace Isolation**: Semua data operasional terisolasi per `workspace_id`. RLS memastikan data tidak bocor antar workspace.

4. **Realtime**: Tabel yang perlu Supabase Realtime: `marketplace_chat_messages`, `transaction_conversation_messages`, `notifications`, `transaction_rooms`.

5. **KTP Encryption**: `user_profiles.ktp_number` harus di-encrypt at rest menggunakan `pgsodium` atau `vault` extension Supabase sebelum production.

6. **Audit Trail Retention**: `global_audit_trail` dan `system_logs` perlu retention policy. Rekomendasi: audit trail 2 tahun, system logs 90 hari.

7. **Search Vector**: `search_index.search_vector` di-maintain via fungsi `upsert_search_index()` yang dipanggil dari aplikasi setelah setiap mutation penting.

8. **Materialized View Refresh**: Gunakan Supabase Edge Functions atau `pg_cron` untuk refresh MV secara periodik.

---

*Laporan ini dibuat berdasarkan audit menyeluruh terhadap 150+ file source code TernakHub. Tidak ada perubahan kode yang dilakukan. Migration DB-001 dapat dimulai berdasarkan dokumen ini.*
