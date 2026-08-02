-- DB-001A / 009 — Publications, notifications, trust, media and platform services.

CREATE TABLE rss_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_source_id uuid NOT NULL REFERENCES rss_sources(id),
  original_url text NOT NULL,
  title text,
  raw_content text,
  status rss_queue_status_enum NOT NULL DEFAULT 'Pending',
  ai_score numeric(3,2) CHECK (ai_score IS NULL OR ai_score BETWEEN 0 AND 1),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rss_source_id, original_url)
);

CREATE TABLE rss_collector_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_source_id uuid NOT NULL REFERENCES rss_sources(id),
  run_type text CHECK (run_type IS NULL OR run_type IN ('Auto', 'Manual')),
  items_fetched integer NOT NULL DEFAULT 0 CHECK (items_fetched >= 0),
  items_new integer NOT NULL DEFAULT 0 CHECK (items_new >= 0),
  items_duplicate integer NOT NULL DEFAULT 0 CHECK (items_duplicate >= 0),
  items_failed integer NOT NULL DEFAULT 0 CHECK (items_failed >= 0),
  status text CHECK (status IS NULL OR status IN ('Success', 'Partial', 'Failed')),
  error_message text,
  run_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE news_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  summary text,
  thumbnail_url text,
  tipe_konten content_type_enum NOT NULL,
  kategori text,
  tags text[],
  status publication_status_enum NOT NULL DEFAULT 'Draft',
  source text CHECK (source IS NULL OR source IN ('Admin', 'Workspace', 'RSS')),
  source_url text,
  rss_source_id uuid REFERENCES rss_sources(id),
  author_name text,
  published_at timestamptz,
  event_start_date timestamptz,
  event_end_date timestamptz,
  event_location text,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_workspace_id uuid REFERENCES workspaces(id),
  notification_type notification_type_enum NOT NULL,
  source_module text,
  source_entity_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  icon text,
  action_label text,
  action_route text,
  action_params jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alert_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  livestock_id uuid REFERENCES livestock(id),
  reminder_type text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trust_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  verification_type verification_type_enum NOT NULL,
  status verification_status_enum NOT NULL DEFAULT 'Draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trust_verification_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES trust_verifications(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_url text NOT NULL,
  file_type text,
  description text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type media_type_enum NOT NULL,
  media_category media_category_enum NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  width integer CHECK (width IS NULL OR width >= 0),
  height integer CHECK (height IS NULL OR height >= 0),
  storage_url text NOT NULL,
  cdn_url text,
  owner_workspace_id uuid REFERENCES workspaces(id),
  created_by uuid REFERENCES auth.users(id),
  alt_text text,
  tags text[],
  status text NOT NULL DEFAULT 'active',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_module text NOT NULL,
  entity_type text,
  entity_id uuid,
  priority insight_priority_enum NOT NULL,
  title text NOT NULL,
  summary text,
  description text,
  recommendation text,
  confidence_score numeric(3,2) CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
  generated_by text CHECK (generated_by IS NULL OR generated_by IN ('rule_based', 'statistical', 'ai_model')),
  is_dismissed boolean NOT NULL DEFAULT false,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE global_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  keywords text,
  tags text[],
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(keywords, ''))
  ) STORED,
  status text NOT NULL DEFAULT 'active',
  last_indexed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);