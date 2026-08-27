-- Transport Vehicles schema — TRANSPORT-SCHEMA-001
-- Adds the missing transport_vehicles table so the Armada module can manage
-- fleet data persistently instead of abusing layanan_transport as vehicles.

CREATE TABLE transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  jenis_kendaraan text NOT NULL,
  nomor_polisi text NOT NULL,
  kapasitas_kg int,
  status text NOT NULL DEFAULT 'Tersedia',
  tahun_beli int,
  jenis_layanan text[],
  catatan_operasional text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transport_vehicles_workspace
  ON transport_vehicles (workspace_id);

ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_vehicle_member ON transport_vehicles
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY transport_vehicle_admin ON transport_vehicles
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
