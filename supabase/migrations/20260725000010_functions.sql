-- DB-001A / 010 — Database functions.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION is_workspace_member(
  p_workspace_id uuid,
  p_role text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'Aktif'
      AND (p_role IS NULL OR role::text = ANY (p_role))
  );
$$;

CREATE OR REPLACE FUNCTION sync_livestock_location_after_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transfer_type = 'Keluar Sementara' THEN
    UPDATE livestock
    SET location_status = 'Luar Kandang', location_detail = COALESCE(NEW.destination, NEW.to_location)
    WHERE id = NEW.livestock_id;
  ELSIF NEW.transfer_type = 'Masuk Kembali' THEN
    UPDATE livestock
    SET location_status = 'Di Kandang', location_detail = COALESCE(NEW.to_location, NEW.destination)
    WHERE id = NEW.livestock_id;
  ELSIF NEW.transfer_type = 'Keluar Permanen' THEN
    UPDATE livestock
    SET location_status = 'Arsip', archive_reason = NEW.archive_reason, archived_at = now()
    WHERE id = NEW.livestock_id;
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

CREATE OR REPLACE FUNCTION add_stok_obat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE marketplace_chat_rooms
  SET last_message_at = NEW.created_at,
      unread_buyer = CASE WHEN NEW.sender_role = 'Penjual' THEN unread_buyer + 1 ELSE unread_buyer END,
      unread_seller = CASE WHEN NEW.sender_role = 'Pembeli' THEN unread_seller + 1 ELSE unread_seller END
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_listing_wishlist_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings
    SET wishlist_count = wishlist_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings
    SET wishlist_count = GREATEST(wishlist_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION add_audit_event(
  p_workspace_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO global_audit_trail (
    workspace_id, user_id, action, entity_type, entity_id, old_data, new_data
  ) VALUES (
    p_workspace_id, p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data
  );
END;
$$;

CREATE OR REPLACE FUNCTION has_active_pregnancy(p_livestock_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kebuntingan
    WHERE dam_id = p_livestock_id AND status = 'Aktif'
  );
$$;

CREATE OR REPLACE FUNCTION calculate_adg(p_livestock_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_weight numeric;
  last_weight numeric;
  first_date date;
  last_date date;
  days_elapsed integer;
BEGIN
  SELECT weight_kg, date INTO first_weight, first_date
  FROM livestock_weight_entries
  WHERE livestock_id = p_livestock_id
  ORDER BY date ASC, created_at ASC
  LIMIT 1;

  SELECT weight_kg, date INTO last_weight, last_date
  FROM livestock_weight_entries
  WHERE livestock_id = p_livestock_id
  ORDER BY date DESC, created_at DESC
  LIMIT 1;

  IF first_date IS NULL OR last_date IS NULL THEN
    RETURN 0;
  END IF;
  days_elapsed := last_date - first_date;
  IF days_elapsed <= 0 THEN
    RETURN 0;
  END IF;
  RETURN (last_weight - first_weight) / days_elapsed;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_search_index(
  p_workspace_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_subtitle text,
  p_keywords text,
  p_tags text[]
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO search_index (
    workspace_id, entity_type, entity_id, title, subtitle, keywords, tags, last_indexed_at
  ) VALUES (
    p_workspace_id, p_entity_type, p_entity_id, p_title, p_subtitle, p_keywords, p_tags, now()
  )
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    workspace_id = EXCLUDED.workspace_id,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    keywords = EXCLUDED.keywords,
    tags = EXCLUDED.tags,
    last_indexed_at = now();
$$;

CREATE OR REPLACE FUNCTION close_current_ownership(
  p_livestock_id uuid,
  p_end_date date
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE livestock_ownership_history
  SET end_date = p_end_date, is_current = false
  WHERE livestock_id = p_livestock_id AND is_current = true;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM system_logs
  WHERE created_at < now() - interval '90 days';
$$;

CREATE OR REPLACE FUNCTION apply_stok_inventaris_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity numeric;
BEGIN
  SELECT quantity INTO current_quantity
  FROM stok_inventaris
  WHERE id = NEW.stok_id
  FOR UPDATE;
  IF current_quantity IS NULL THEN
    RAISE EXCEPTION 'Inventory item % does not exist', NEW.stok_id;
  END IF;
  IF current_quantity + NEW.quantity_delta < 0 THEN
    RAISE EXCEPTION 'Inventory quantity cannot become negative for %', NEW.stok_id;
  END IF;

  UPDATE stok_inventaris
  SET quantity = quantity + NEW.quantity_delta, updated_at = now()
  WHERE id = NEW.stok_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION reject_active_pregnancy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Aktif' AND has_active_pregnancy(NEW.dam_id) THEN
    RAISE EXCEPTION 'Dam % already has an active pregnancy', NEW.dam_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;