-- Fonction ultra-simple qui supprime seulement 50 items à la fois
-- À appeler plusieurs fois de suite côté client

CREATE OR REPLACE FUNCTION delete_inventory_batch(
  p_user_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM user_inventory
  WHERE id IN (
    SELECT id
    FROM user_inventory
    WHERE user_id = p_user_id
      AND is_sold = false
    LIMIT p_limit
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer seulement les doublons (50 à la fois)
CREATE OR REPLACE FUNCTION delete_duplicates_batch(
  p_user_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  WITH duplicates AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, item_id, obtained_at, obtained_from, box_id
        ORDER BY id
      ) as rn
    FROM user_inventory
    WHERE user_id = p_user_id
      AND is_sold = false
    LIMIT p_limit * 3  -- On prend plus pour trouver des doublons
  )
  DELETE FROM user_inventory
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
