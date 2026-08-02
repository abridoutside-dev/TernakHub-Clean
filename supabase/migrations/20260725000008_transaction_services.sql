-- DB-001A / 008 — Transaction room, escrow and service workspace tables.

CREATE TABLE transaction_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_transaction_id uuid UNIQUE NOT NULL REFERENCES marketplace_transactions(id),
  buyer_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  seller_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  status room_status_enum NOT NULL DEFAULT 'Open',
  has_escrow boolean NOT NULL DEFAULT false,
  has_transport boolean NOT NULL DEFAULT false,
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_workspace_id <> seller_workspace_id)
);

CREATE TABLE transaction_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  role participant_role_enum NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, workspace_id, role)
);

CREATE TABLE transaction_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id) ON DELETE CASCADE,
  uploaded_by_workspace_id uuid REFERENCES workspaces(id),
  file_name text NOT NULL,
  file_type text,
  storage_url text NOT NULL,
  description text,
  attachment_type text CHECK (
    attachment_type IS NULL OR attachment_type IN
    ('Dokumen', 'Foto', 'Invoice', 'Bukti Pembayaran', 'Lainnya')
  ),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid UNIQUE NOT NULL REFERENCES transaction_rooms(id),
  receipt_number text UNIQUE NOT NULL,
  amount bigint NOT NULL CHECK (amount >= 0),
  escrow_fee bigint NOT NULL DEFAULT 0 CHECK (escrow_fee >= 0),
  transport_fee bigint NOT NULL DEFAULT 0 CHECK (transport_fee >= 0),
  total bigint NOT NULL CHECK (total >= 0),
  payment_method text,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id),
  escrow_account_id uuid REFERENCES escrow_accounts(id),
  amount bigint NOT NULL CHECK (amount >= 0),
  fee bigint NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status escrow_status_enum NOT NULL DEFAULT 'Pending',
  funded_at timestamptz,
  released_at timestamptz,
  release_requested_by participant_role_enum,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE layanan_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  vehicle_type text,
  capacity text,
  coverage_area text[],
  base_price bigint CHECK (base_price IS NULL OR base_price >= 0),
  price_per_km bigint CHECK (price_per_km IS NULL OR price_per_km >= 0),
  status layanan_status_enum NOT NULL DEFAULT 'Aktif',
  description text,
  available_days text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE layanan_dokter_hewan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nama text NOT NULL,
  nama_klinik text,
  kategori text,
  sub_kategori text,
  sipv_number text,
  spesialisasi text[],
  hewan_ditangani text[],
  mode_pelayanan text[],
  lokasi text,
  status layanan_status_enum NOT NULL DEFAULT 'Aktif',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE layanan_klinik_hewan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nama_klinik text NOT NULL,
  nomor_izin text,
  fasilitas text[],
  hewan_ditangani text[],
  jam_operasional jsonb,
  lokasi text,
  status layanan_status_enum NOT NULL DEFAULT 'Aktif',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id),
  provider_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  service_type text CHECK (
    service_type IS NULL OR service_type IN ('Transport', 'DokterHewan', 'KlinikHewan')
  ),
  service_detail jsonb,
  price bigint NOT NULL CHECK (price >= 0),
  status quotation_status_enum NOT NULL DEFAULT 'Draft',
  valid_until timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transport_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id),
  transport_workspace_id uuid REFERENCES workspaces(id),
  transport_listing_id uuid REFERENCES marketplace_listings(id),
  quotation_id uuid REFERENCES service_quotations(id),
  origin text,
  destination text,
  scheduled_date date,
  fee bigint CHECK (fee IS NULL OR fee >= 0),
  status transport_status_enum NOT NULL DEFAULT 'Pending',
  vehicle_type text,
  driver_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid UNIQUE NOT NULL REFERENCES transaction_rooms(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES transaction_conversations(id) ON DELETE CASCADE,
  sender_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  sender_role participant_role_enum,
  content text NOT NULL,
  message_type text CHECK (message_type IS NULL OR message_type IN ('Text', 'System', 'Image')),
  attachment_url text,
  is_read_by uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id) ON DELETE CASCADE,
  submitted_by_workspace_id uuid NOT NULL REFERENCES workspaces(id),
  evidence_type text NOT NULL CHECK (
    evidence_type IN ('Foto Barang', 'Invoice', 'Bukti Transfer', 'Dokumen', 'Lainnya')
  ),
  storage_url text NOT NULL,
  description text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES transaction_rooms(id) ON DELETE CASCADE,
  actor_workspace_id uuid REFERENCES workspaces(id),
  actor_role participant_role_enum,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  event_at timestamptz NOT NULL DEFAULT now()
);

-- The two sides of the marketplace/room relationship form the only intentional
-- cycle in the audited schema. Add the reverse edge after both tables exist.
ALTER TABLE marketplace_transactions
  ADD CONSTRAINT marketplace_transactions_transaction_room_fk
  FOREIGN KEY (transaction_room_id) REFERENCES transaction_rooms(id);