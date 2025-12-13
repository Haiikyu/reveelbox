-- Script de nettoyage des items dupliqués dans l'inventaire
-- Ce script garde seulement 1 exemplaire de chaque item obtenu en même temps

-- 1. Afficher les statistiques avant nettoyage
SELECT
  user_id,
  COUNT(*) as total_items,
  COUNT(DISTINCT (item_id, obtained_at, obtained_from)) as unique_items
FROM user_inventory
WHERE is_sold = false
GROUP BY user_id
ORDER BY total_items DESC;

-- 2. Créer une fonction pour nettoyer les doublons d'un utilisateur
CREATE OR REPLACE FUNCTION clean_user_inventory_duplicates(p_user_id uuid)
RETURNS TABLE(
  deleted_count integer,
  kept_count integer
) AS $$
DECLARE
  v_deleted_count integer := 0;
  v_kept_count integer := 0;
BEGIN
  -- Supprimer les doublons en gardant le premier ID de chaque groupe
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
  )
  DELETE FROM user_inventory
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Compter les items restants
  SELECT COUNT(*) INTO v_kept_count
  FROM user_inventory
  WHERE user_id = p_user_id
    AND is_sold = false;

  RETURN QUERY SELECT v_deleted_count, v_kept_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Alternative : Supprimer TOUS les items d'un utilisateur
CREATE OR REPLACE FUNCTION clear_user_inventory(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM user_inventory
  WHERE user_id = p_user_id
    AND is_sold = false;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une fonction pour supprimer les items d'une battle spécifique
CREATE OR REPLACE FUNCTION remove_battle_items(p_user_id uuid, p_battle_id uuid)
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM user_inventory
  WHERE user_id = p_user_id
    AND obtained_from = 'battle'
    AND box_id IN (
      SELECT loot_box_id
      FROM battle_openings
      WHERE battle_id = p_battle_id
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Exemples d'utilisation :

-- Pour nettoyer les doublons d'un utilisateur spécifique :
-- SELECT * FROM clean_user_inventory_duplicates('USER_ID_HERE');

-- Pour supprimer TOUS les items d'un utilisateur :
-- SELECT clear_user_inventory('USER_ID_HERE');

-- Pour voir les statistiques après nettoyage :
-- SELECT
--   user_id,
--   COUNT(*) as total_items
-- FROM user_inventory
-- WHERE is_sold = false
-- GROUP BY user_id
-- ORDER BY total_items DESC;
