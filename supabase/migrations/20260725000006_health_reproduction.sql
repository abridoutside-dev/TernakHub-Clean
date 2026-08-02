-- DB-001A / 006 — Health, medicine stock and reproduction tables.

CREATE TABLE health_checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  checkup_date date NOT NULL,
  examiner text,
  examiner_type text,
  temperature numeric(4,1),
  weight_kg numeric(7,3) CHECK (weight_kg IS NULL OR weight_kg >= 0),
  body_condition_score integer CHECK (body_condition_score IS NULL OR body_condition_score BETWEEN 1 AND 9),
  health_status health_status_enum NOT NULL,
  findings text,
  diagnosis text,
  recommendations text,
  follow_up_date date,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  checkup_id uuid REFERENCES health_checkups(id),
  treatment_date date NOT NULL,
  treatment_type treatment_type_enum NOT NULL,
  drug_id uuid REFERENCES drug_catalog(id),
  drug_name text,
  dosage text,
  route text,
  duration_days integer CHECK (duration_days IS NULL OR duration_days >= 0),
  next_treatment_date date,
  cost bigint CHECK (cost IS NULL OR cost >= 0),
  veterinarian text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_control_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  livestock_id uuid REFERENCES livestock(id),
  batch_id uuid REFERENCES batches(id),
  schedule_type text,
  scheduled_date date NOT NULL,
  status text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (livestock_id IS NOT NULL OR batch_id IS NOT NULL)
);

CREATE TABLE stok_obat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  drug_id uuid REFERENCES drug_catalog(id),
  drug_name text NOT NULL,
  category_id uuid REFERENCES drug_categories(id),
  quantity numeric(10,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL,
  min_stock numeric(10,3) CHECK (min_stock IS NULL OR min_stock >= 0),
  expiry_date date,
  batch_number text,
  status stok_status_enum NOT NULL DEFAULT 'Aktif',
  location text,
  purchase_price bigint CHECK (purchase_price IS NULL OR purchase_price >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reproduksi_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text,
  status program_status_enum NOT NULL DEFAULT 'Draft',
  start_date date,
  end_date date,
  participant_ids uuid[],
  target_breed text,
  mating_method text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pelaksanaan_reproduksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES reproduksi_programs(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  execution_date date NOT NULL,
  method text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE monitoring_reproduksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES reproduksi_programs(id) ON DELETE CASCADE,
  pelaksanaan_id uuid REFERENCES pelaksanaan_reproduksi(id),
  event_type text NOT NULL,
  event_date date NOT NULL,
  description text,
  data jsonb,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pemeriksaan_kebuntingan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES reproduksi_programs(id),
  livestock_id uuid NOT NULL REFERENCES livestock(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  check_date date NOT NULL,
  method text,
  result text NOT NULL,
  days_pregnant integer CHECK (days_pregnant IS NULL OR days_pregnant >= 0),
  examiner text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kebuntingan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES reproduksi_programs(id),
  pemeriksaan_id uuid UNIQUE NOT NULL REFERENCES pemeriksaan_kebuntingan(id),
  dam_id uuid NOT NULL REFERENCES livestock(id),
  sire_id uuid REFERENCES livestock(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  conception_date date,
  expected_birth_date date,
  actual_birth_date date,
  status pregnancy_status_enum NOT NULL DEFAULT 'Aktif',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sire_id IS NULL OR dam_id <> sire_id)
);

CREATE TABLE kelahiran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kebuntingan_id uuid UNIQUE NOT NULL REFERENCES kebuntingan(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  birth_date date NOT NULL,
  birth_time time,
  birth_process text,
  total_born integer NOT NULL DEFAULT 1 CHECK (total_born >= 0),
  total_alive integer NOT NULL DEFAULT 1 CHECK (total_alive >= 0),
  total_dead integer NOT NULL DEFAULT 0 CHECK (total_dead >= 0),
  complications text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_alive + total_dead <= total_born)
);

CREATE TABLE registrasi_anak (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelahiran_id uuid NOT NULL REFERENCES kelahiran(id) ON DELETE CASCADE,
  livestock_id uuid UNIQUE REFERENCES livestock(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  birth_order integer CHECK (birth_order IS NULL OR birth_order > 0),
  sex sex_enum,
  birth_weight_kg numeric(6,2) CHECK (birth_weight_kg IS NULL OR birth_weight_kg >= 0),
  condition text NOT NULL CHECK (condition IN ('Hidup', 'Mati')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sapih (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  registrasi_id uuid NOT NULL REFERENCES registrasi_anak(id),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  weaning_date date NOT NULL,
  age_at_weaning_days integer CHECK (age_at_weaning_days IS NULL OR age_at_weaning_days >= 0),
  weight_at_weaning_kg numeric(6,2) CHECK (weight_at_weaning_kg IS NULL OR weight_at_weaning_kg >= 0),
  method text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registrasi_id)
);

CREATE TABLE stok_obat_masuk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  source text,
  supplier text,
  purchase_price bigint CHECK (purchase_price IS NULL OR purchase_price >= 0),
  invoice_number text,
  received_date date NOT NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stok_obat_keluar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  treatment_id uuid REFERENCES health_treatments(id),
  quantity numeric(10,3) NOT NULL CHECK (quantity > 0),
  reason text,
  livestock_id uuid REFERENCES livestock(id),
  usage_date date NOT NULL,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stok_obat_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stok_obat_id uuid NOT NULL REFERENCES stok_obat(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  quantity_before numeric(10,3) NOT NULL CHECK (quantity_before >= 0),
  quantity_after numeric(10,3) NOT NULL CHECK (quantity_after >= 0),
  quantity_delta numeric(10,3) NOT NULL,
  reason text NOT NULL,
  adjusted_by uuid REFERENCES auth.users(id),
  adjusted_at timestamptz NOT NULL DEFAULT now()
);