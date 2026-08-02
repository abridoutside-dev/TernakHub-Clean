-- DB-001A / 005 — Workspace, livestock, batch and movement tables.

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type workspace_type NOT NULL,
  status workspace_status NOT NULL DEFAULT 'Pending',
  description text,
  icon text,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  farm_code text UNIQUE,
  province text,
  city text,
  district text,
  village text,
  address text,
  latitude numeric(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  phone text,
  email text,
  website text,
  established_year integer CHECK (established_year IS NULL OR established_year BETWEEN 1800 AND 2200),
  verification_status verification_status_enum NOT NULL DEFAULT 'Unverified',
  trust_score integer NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'Viewer',
  status member_status NOT NULL DEFAULT 'Aktif',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  email text NOT NULL,
  role member_role NOT NULL DEFAULT 'Viewer',
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Accepted', 'Expired', 'Revoked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id_a uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workspace_id_b uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  status relationship_status NOT NULL DEFAULT 'Pending',
  initiated_by uuid REFERENCES workspaces(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (workspace_id_a <> workspace_id_b),
  UNIQUE (workspace_id_a, workspace_id_b, relationship_type)
);

CREATE TABLE ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  from_user_id uuid NOT NULL REFERENCES auth.users(id),
  to_user_id uuid NOT NULL REFERENCES auth.users(id),
  status ownership_transfer_status NOT NULL DEFAULT 'Draft',
  reason text,
  notes text,
  workspace_snapshot jsonb,
  requested_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE workspace_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'Trial',
  started_at timestamptz,
  expires_at timestamptz,
  trial_ends_at timestamptz,
  billing_cycle text CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'yearly')),
  auto_renew boolean NOT NULL DEFAULT false,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE livestock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text,
  species text NOT NULL,
  breed text,
  sex sex_enum,
  birth_date date,
  birth_date_estimated boolean NOT NULL DEFAULT false,
  birth_weight_kg numeric(6,2) CHECK (birth_weight_kg IS NULL OR birth_weight_kg >= 0),
  current_weight_kg numeric(6,2) CHECK (current_weight_kg IS NULL OR current_weight_kg >= 0),
  health_status health_status_enum NOT NULL DEFAULT 'Sehat',
  location_status location_status_enum NOT NULL DEFAULT 'Di Kandang',
  location_detail text,
  program text,
  digital_identity_verified boolean NOT NULL DEFAULT false,
  digital_identity_issued_by text,
  digital_identity_registered_date date,
  archive_reason archive_reason_enum,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (location_status <> 'Arsip' OR archive_reason IS NOT NULL),
  CHECK (location_status = 'Arsip' OR archive_reason IS NULL)
);

CREATE TABLE livestock_extended_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid UNIQUE NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  ear_tag text,
  internal_code text,
  notes text,
  breed_category text,
  cross_breed text,
  color text,
  horn text,
  tail text,
  special_marks text,
  purchase_date date,
  purchase_price bigint CHECK (purchase_price IS NULL OR purchase_price >= 0),
  supplier text,
  origin_farm text,
  sibling_count integer CHECK (sibling_count IS NULL OR sibling_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE livestock_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  changes jsonb NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pedigree_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  relative_id uuid NOT NULL REFERENCES livestock(id) ON DELETE RESTRICT,
  role pedigree_role_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (livestock_id <> relative_id),
  UNIQUE (livestock_id, relative_id, role)
);

CREATE TABLE livestock_ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  owner_name text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),
  start_date date NOT NULL,
  end_date date,
  method ownership_method_enum NOT NULL,
  notes text,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE livestock_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  storage_url text NOT NULL,
  thumbnail_url text,
  caption text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  taken_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE livestock_weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  recorded_by uuid REFERENCES auth.users(id),
  weight_kg numeric(7,3) NOT NULL CHECK (weight_kg >= 0),
  date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label text NOT NULL,
  species text,
  status batch_status_enum NOT NULL DEFAULT 'Aktif',
  start_date date,
  finished_date date,
  target_weight_kg numeric(6,2) CHECK (target_weight_kg IS NULL OR target_weight_kg >= 0),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (finished_date IS NULL OR start_date IS NULL OR finished_date >= start_date)
);

CREATE TABLE batch_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE RESTRICT,
  joined_date date NOT NULL,
  removed_date date,
  removal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (removed_date IS NULL OR removed_date >= joined_date)
);

CREATE TABLE batch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  performed_by uuid REFERENCES auth.users(id),
  event_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE batch_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  operation_type text NOT NULL,
  status text,
  target_livestock_ids uuid[],
  operation_data jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE livestock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  transfer_type transfer_type_enum NOT NULL,
  from_location text,
  to_location text,
  destination text,
  reason text,
  archive_reason archive_reason_enum,
  notes text,
  transferred_by uuid REFERENCES auth.users(id),
  transfer_date date NOT NULL,
  return_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (transfer_type = 'Keluar Permanen' OR archive_reason IS NULL),
  CHECK (return_date IS NULL OR return_date >= transfer_date)
);

CREATE TABLE mutation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  destination_workspace_id uuid REFERENCES workspaces(id),
  livestock_ids uuid[] NOT NULL CHECK (cardinality(livestock_ids) > 0),
  mutation_type text CHECK (mutation_type IS NULL OR mutation_type IN ('Individual', 'Batch')),
  status mutation_status_enum NOT NULL DEFAULT 'Draft',
  effective_date date,
  reason text,
  notes text,
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (destination_workspace_id IS NULL OR destination_workspace_id <> workspace_id)
);