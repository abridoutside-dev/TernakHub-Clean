-- Transport Vehicle Maintenance — TRANSPORT-MAINT-001
-- Tracks service/maintenance events per vehicle so fleet uptime and maintenance
-- spend are observable and traceable for financial reporting.
--
-- Depends on (already applied): transport_vehicles(id), workspaces(id).

CREATE TYPE transport_maintenance_type_enum AS ENUM (
  'Service Berkala','Oli','Ban','Rem','Mesin','Kelistrikan','Spare Part','Perbaikan','Lainnya'
);

CREATE TABLE transport_vehicle_maintenance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kendaraan_id  uuid NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  jenis_service transport_maintenance_type_enum NOT NULL DEFAULT 'Lainnya',
  tanggal       date NOT NULL DEFAULT CURRENT_DATE,
  odometer_km   int,
  biaya         bigint NOT NULL DEFAULT 0 CHECK (biaya >= 0),
  spare_part    text,
  vendor        text,
  status        text NOT NULL DEFAULT 'Selesai'
    CHECK (status IN ('Terjadwal','Sedang','Selesai','Dibatalkan')),
  catatan       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_workspace  ON transport_vehicle_maintenance (workspace_id);
CREATE INDEX idx_maintenance_vehicle    ON transport_vehicle_maintenance (kendaraan_id);
CREATE INDEX idx_maintenance_tanggal    ON transport_vehicle_maintenance (tanggal);

ALTER TABLE transport_vehicle_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_maintenance_member ON transport_vehicle_maintenance
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY transport_maintenance_admin ON transport_vehicle_maintenance
  FOR ALL USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE transport_vehicle_maintenance TO authenticated;
