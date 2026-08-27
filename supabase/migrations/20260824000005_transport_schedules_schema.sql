-- Transport Schedules schema — TRANSPORT-SCHEMA-003
-- Adds transport_schedules for scheduled/waiting/pickup-ready transport requests.

CREATE TABLE transport_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rute text NOT NULL,
  tanggal date NOT NULL,
  status text NOT NULL DEFAULT 'Menunggu',
  driver_id uuid REFERENCES transport_drivers(id) ON DELETE SET NULL,
  kendaraan_id uuid REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  muatan text,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transport_schedules_workspace
  ON transport_schedules (workspace_id);

CREATE INDEX idx_transport_schedules_driver
  ON transport_schedules (driver_id);

CREATE INDEX idx_transport_schedules_vehicle
  ON transport_schedules (kendaraan_id);

ALTER TABLE transport_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_schedule_member ON transport_schedules
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY transport_schedule_admin ON transport_schedules
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
