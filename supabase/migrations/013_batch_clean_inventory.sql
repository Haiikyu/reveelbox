-- Fonction de nettoyage par batch pour éviter les timeouts
-- Supprime les items par lots de 100

CREATE OR REPLACE FUNCTION clear_user_inventory_batch(
  p_user_id uuid,
  p_batch_size integer DEFAULT 100
)
RETURNS TABLE(
  total_deleted integer,
  batches_processed integer
) AS $$
DECLARE
  v_total_deleted integer := 0;
  v_batch_deleted integer;
  v_batches integer := 0;
BEGIN
  LOOP
    -- Supprimer un batch d'items
    WITH items_to_delete AS (
      SELECT id
      FROM user_inventory
      WHERE user_id = p_user_id
        AND is_sold = false
      LIMIT p_batch_size
    )
    DELETE FROM user_inventory
    WHERE id IN (SELECT id FROM items_to_delete);

    GET DIAGNOSTICS v_batch_deleted = ROW_COUNT;

    -- Si aucun item supprimé, on a fini
    EXIT WHEN v_batch_deleted = 0;

    v_total_deleted := v_total_deleted + v_batch_deleted;
    v_batches := v_batches + 1;

    -- Petit délai pour éviter de saturer la DB
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN QUERY SELECT v_total_deleted, v_batches;
END;
$$ LANGUAGE plpgsql;

-- Fonction de nettoyage des doublons par batch
CREATE OR REPLACE FUNCTION clean_duplicates_batch(
  p_user_id uuid,
  p_batch_size integer DEFAULT 100
)
RETURNS TABLE(
  total_deleted integer,
  batches_processed integer
) AS $$
DECLARE
  v_total_deleted integer := 0;
  v_batch_deleted integer;
  v_batches integer := 0;
BEGIN
  LOOP
    -- Supprimer un batch de doublons
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
      LIMIT p_batch_size * 2  -- On prend plus car on va filtrer
    ),
    to_delete AS (
      SELECT id FROM duplicates WHERE rn > 1
    )
    DELETE FROM user_inventory
    WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS v_batch_deleted = ROW_COUNT;

    -- Si aucun doublon supprimé, on a fini
    EXIT WHEN v_batch_deleted = 0;

    v_total_deleted := v_total_deleted + v_batch_deleted;
    v_batches := v_batches + 1;

    -- Petit délai
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN QUERY SELECT v_total_deleted, v_batches;
END;
$$ LANGUAGE plpgsql;
