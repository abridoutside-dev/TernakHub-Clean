-- P1.4 — Stok Obat trigger workspace isolation
-- Adds workspace alignment checks to add_stok_obat() and deduct_stok_obat()
-- to prevent cross-workspace stock manipulation via stok_obat_masuk /
-- stok_obat_keluar.
--
-- SAFETY:
--   - Additive only. Does not delete or modify existing data.
--   - Does not change table schemas.
--   - Only tightens existing trigger functions with an extra guard.

CREATE OR REPLACE FUNCTION add_stok_obat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stok_obat
    WHERE id = NEW.stok_obat_id
      AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Stock item % does not belong to workspace %', NEW.stok_obat_id, NEW.workspace_id;
  END IF;

  UPDATE stok_obat
  SET quantity = quantity + NEW.quantity,
      status = CASE WHEN status = 'Habis' THEN 'Aktif' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item % does not exist', NEW.stok_obat_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_stok_obat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stok_obat
    WHERE id = NEW.stok_obat_id
      AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Stock item % does not belong to workspace %', NEW.stok_obat_id, NEW.workspace_id;
  END IF;

  SELECT quantity INTO current_quantity
  FROM stok_obat
  WHERE id = NEW.stok_obat_id
  FOR UPDATE;

  IF current_quantity IS NULL THEN
    RAISE EXCEPTION 'Stock item % does not exist', NEW.stok_obat_id;
  END IF;
  IF current_quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient medicine stock for %', NEW.stok_obat_id;
  END IF;

  UPDATE stok_obat
  SET quantity = quantity - NEW.quantity,
      status = CASE WHEN quantity - NEW.quantity <= 0 THEN 'Habis' ELSE status END,
      updated_at = now()
  WHERE id = NEW.stok_obat_id;
  RETURN NEW;
END;
$$;
