-- Transport Drivers schema — TRANSPORT-SCHEMA-002
-- Adds the missing transport_drivers table so the Armada module can manage
-- driver data persistently instead of deriving drivers from transaction rows.

CREATE TABLE transport_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nama text NOT NULL,
  nomor_sim text,
  kategori_sim text,
  kendaraan_id uuid REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Aktif',
  pengalaman_tahun int NOT NULL DEFAULT 0,
  nomor_hp text,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transport_drivers_workspace
  ON transport_drivers (workspace_id);

CREATE INDEX idx_transport_drivers_vehicle
  ON transport_drivers (kendaraan_id);

ALTER TABLE transport_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_driver_member ON transport_drivers
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY transport_driver_admin ON transport_drivers
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
