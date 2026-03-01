-- ============================================================
-- Migration : Nouvelles fonctionnalités
-- ============================================================
-- 1. Filtres alimentaires (dietary_tags sur recipes)
-- 2. Système de notes (ratings)
-- 3. Planificateur de repas (meal_plans)
-- 4. Informations nutritionnelles (nutrition sur recipes)
-- 5. Mise à jour search_vector et search_recipe_ids
-- ============================================================

-- 1. Filtres alimentaires : nouveau champ sur recipes
ALTER TABLE recipes ADD COLUMN dietary_tags text[] DEFAULT '{}';

-- 2. Ratings : nouvelle table
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);
CREATE INDEX ratings_recipe_id_idx ON ratings(recipe_id);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policies ratings
CREATE POLICY "Ratings visibles par tous"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Utilisateur insère sa propre note"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur met à jour sa propre note"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime sa propre note"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Planificateur de repas : nouvelle table
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, meal_type, recipe_id)
);
CREATE INDEX meal_plans_user_date_idx ON meal_plans(user_id, date);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies meal_plans
CREATE POLICY "Utilisateur voit ses propres plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses propres plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur met à jour ses propres plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime ses propres plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Nutrition : champ JSONB sur recipes
ALTER TABLE recipes ADD COLUMN nutrition jsonb;

-- 5. Mettre à jour search_vector trigger pour inclure dietary_tags
CREATE OR REPLACE FUNCTION update_recipes_search_vector() RETURNS trigger AS $$
DECLARE
  ing_text text;
  steps_text text;
  tags_text text;
  dietary_text text;
BEGIN
  SELECT coalesce(string_agg(elem->>'name', ' '), '')
  INTO ing_text
  FROM jsonb_array_elements(NEW.ingredients) AS elem;

  SELECT coalesce(string_agg(elem->>'text', ' '), '')
  INTO steps_text
  FROM jsonb_array_elements(NEW.steps) AS elem;

  tags_text := coalesce(array_to_string(NEW.tags, ' '), '');
  dietary_text := coalesce(array_to_string(NEW.dietary_tags, ' '), '');

  NEW.search_vector :=
    setweight(to_tsvector('french_unaccent', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french_unaccent', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(ing_text, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(tags_text, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(dietary_text, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(steps_text, '')), 'C') ||
    setweight(to_tsvector('french_unaccent', coalesce(NEW.author_name, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Mettre à jour search_recipe_ids RPC pour dietary_tags filter
CREATE OR REPLACE FUNCTION search_recipe_ids(
  query_text text DEFAULT '',
  category_filter text DEFAULT null,
  tags_filter text[] DEFAULT null,
  is_tested_filter boolean DEFAULT null,
  user_id_filter uuid DEFAULT null,
  p_favorites_only boolean DEFAULT false,
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0,
  dietary_filter text[] DEFAULT null
) RETURNS TABLE(recipe_id uuid, relevance float4) AS $$
DECLARE
  normalized text;
  tsq tsquery;
BEGIN
  normalized := f_unaccent(lower(trim(coalesce(query_text, ''))));

  -- Pas de texte → retourner les recettes filtrées par date
  IF normalized = '' THEN
    RETURN QUERY
    SELECT r.id, 0::float4
    FROM recipes r
    WHERE
      (category_filter IS NULL OR r.category = category_filter)
      AND (tags_filter IS NULL OR r.tags && tags_filter)
      AND (is_tested_filter IS NULL OR r.is_tested = is_tested_filter)
      AND (dietary_filter IS NULL OR r.dietary_tags @> dietary_filter)
      AND (NOT p_favorites_only OR user_id_filter IS NULL
           OR r.id IN (SELECT l.recipe_id FROM likes l WHERE l.user_id = user_id_filter))
    ORDER BY r.created_at DESC
    OFFSET p_offset
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Construire le tsquery (websearch avec fallback plain)
  BEGIN
    tsq := websearch_to_tsquery('french_unaccent', normalized);
  EXCEPTION WHEN OTHERS THEN
    tsq := plainto_tsquery('french_unaccent', normalized);
  END;

  RETURN QUERY
  SELECT r.id, (
    -- Score FTS pondéré (poids 10)
    coalesce(ts_rank_cd(r.search_vector, tsq, 32), 0) * 10 +
    -- Similarité trigramme sur le titre (poids 5)
    coalesce(similarity(f_unaccent(lower(r.title)), normalized), 0) * 5 +
    -- Correspondance sous-chaîne dans le titre (bonus 2)
    CASE WHEN f_unaccent(lower(r.title)) LIKE '%' || normalized || '%'
      THEN 2.0 ELSE 0.0 END +
    -- Correspondance dans les noms d'ingrédients (bonus 1)
    CASE WHEN EXISTS (
      SELECT 1 FROM jsonb_array_elements(r.ingredients) elem
      WHERE f_unaccent(lower(elem->>'name')) LIKE '%' || normalized || '%'
    ) THEN 1.0 ELSE 0.0 END
  )::float4 AS rel
  FROM recipes r
  WHERE
    -- Filtres
    (category_filter IS NULL OR r.category = category_filter)
    AND (tags_filter IS NULL OR r.tags && tags_filter)
    AND (is_tested_filter IS NULL OR r.is_tested = is_tested_filter)
    AND (dietary_filter IS NULL OR r.dietary_tags @> dietary_filter)
    AND (NOT p_favorites_only OR user_id_filter IS NULL
         OR r.id IN (SELECT l.recipe_id FROM likes l WHERE l.user_id = user_id_filter))
    -- Correspondance textuelle (au moins une condition)
    AND (
      r.search_vector @@ tsq
      OR similarity(f_unaccent(lower(r.title)), normalized) > 0.15
      OR f_unaccent(lower(r.title)) LIKE '%' || normalized || '%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(r.ingredients) elem
        WHERE f_unaccent(lower(elem->>'name')) LIKE '%' || normalized || '%'
      )
    )
  ORDER BY rel DESC, r.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Vue agrégée pour les ratings (avg + count)
CREATE OR REPLACE FUNCTION get_recipe_rating(rid uuid)
RETURNS TABLE(avg_score numeric, ratings_count bigint) AS $$
  SELECT COALESCE(AVG(score)::numeric(2,1), 0), COUNT(*)
  FROM ratings WHERE recipe_id = rid;
$$ LANGUAGE sql STABLE;

-- Permissions
GRANT EXECUTE ON FUNCTION search_recipe_ids TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recipe_rating TO anon, authenticated;

-- Backfill dietary_tags search vector
UPDATE recipes SET title = title;
