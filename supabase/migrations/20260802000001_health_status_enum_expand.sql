-- LIVESTOCK-REAL-003C: Expand health_status_enum with the two missing values.
--
-- The UI has always exposed five statuses but the enum only contained three,
-- causing 'Dalam Perawatan' and 'Karantina' to be coerced to 'Pemantauan' on
-- every save.  ADD VALUE is safe and non-destructive on existing rows.

ALTER TYPE health_status_enum ADD VALUE IF NOT EXISTS 'Dalam Perawatan';
ALTER TYPE health_status_enum ADD VALUE IF NOT EXISTS 'Karantina';
