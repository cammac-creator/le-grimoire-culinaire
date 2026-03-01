-- ============================================================
-- Migration : Moteur de recherche intelligent
-- ============================================================
-- Améliore la recherche avec :
-- - Full-text search sur TOUS les champs (ingrédients, étapes, tags)
-- - Insensibilité aux accents (crème ↔ creme)
-- - Correspondance floue / tolérance aux fautes (pg_trgm)
-- - Correspondance partielle (choco → chocolat)
-- - Classement par pertinence
-- ============================================================

-- 1. Extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- 2. Wrapper immutable pour unaccent (requis pour les index)
create or replace function f_unaccent(text) returns text as $$
  select public.unaccent('public.unaccent', $1)
$$ language sql immutable parallel safe strict;

-- 3. Config FTS française avec désaccentuation
do $$ begin
  create text search configuration french_unaccent (copy = french);
exception when duplicate_object then null;
end $$;

alter text search configuration french_unaccent
  alter mapping for hword, hword_part, word
  with unaccent, french_stem;

-- 4. Remplacer la colonne générée par une colonne classique + trigger
drop index if exists recipes_search_idx;
alter table recipes drop column if exists search_vector;
alter table recipes add column search_vector tsvector;

-- 5. Fonction trigger : construit le vecteur à partir de TOUS les champs
create or replace function update_recipes_search_vector() returns trigger as $$
declare
  ing_text text;
  steps_text text;
  tags_text text;
begin
  select coalesce(string_agg(elem->>'name', ' '), '')
  into ing_text
  from jsonb_array_elements(NEW.ingredients) as elem;

  select coalesce(string_agg(elem->>'text', ' '), '')
  into steps_text
  from jsonb_array_elements(NEW.steps) as elem;

  tags_text := coalesce(array_to_string(NEW.tags, ' '), '');

  NEW.search_vector :=
    setweight(to_tsvector('french_unaccent', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french_unaccent', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(ing_text, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(tags_text, '')), 'B') ||
    setweight(to_tsvector('french_unaccent', coalesce(steps_text, '')), 'C') ||
    setweight(to_tsvector('french_unaccent', coalesce(NEW.author_name, '')), 'C');

  return NEW;
end;
$$ language plpgsql;

-- 6. Trigger
drop trigger if exists recipes_search_vector_trigger on recipes;
create trigger recipes_search_vector_trigger
  before insert or update on recipes
  for each row execute function update_recipes_search_vector();

-- 7. Backfill : toucher les lignes existantes déclenche le trigger
update recipes set title = title;

-- 8. Index
create index recipes_search_idx on recipes using gin(search_vector);
create index recipes_title_trgm_idx on recipes using gin(f_unaccent(lower(title)) gin_trgm_ops);

-- 9. Fonction RPC de recherche intelligente
create or replace function search_recipe_ids(
  query_text text default '',
  category_filter text default null,
  tags_filter text[] default null,
  is_tested_filter boolean default null,
  user_id_filter uuid default null,
  p_favorites_only boolean default false,
  p_limit int default 12,
  p_offset int default 0
) returns table(recipe_id uuid, relevance float4) as $$
declare
  normalized text;
  tsq tsquery;
begin
  normalized := f_unaccent(lower(trim(coalesce(query_text, ''))));

  -- Pas de texte → retourner les recettes filtrées par date
  if normalized = '' then
    return query
    select r.id, 0::float4
    from recipes r
    where
      (category_filter is null or r.category = category_filter)
      and (tags_filter is null or r.tags && tags_filter)
      and (is_tested_filter is null or r.is_tested = is_tested_filter)
      and (not p_favorites_only or user_id_filter is null
           or r.id in (select l.recipe_id from likes l where l.user_id = user_id_filter))
    order by r.created_at desc
    offset p_offset
    limit p_limit;
    return;
  end if;

  -- Construire le tsquery (websearch avec fallback plain)
  begin
    tsq := websearch_to_tsquery('french_unaccent', normalized);
  exception when others then
    tsq := plainto_tsquery('french_unaccent', normalized);
  end;

  return query
  select r.id, (
    -- Score FTS pondéré (poids 10)
    coalesce(ts_rank_cd(r.search_vector, tsq, 32), 0) * 10 +
    -- Similarité trigramme sur le titre (poids 5)
    coalesce(similarity(f_unaccent(lower(r.title)), normalized), 0) * 5 +
    -- Correspondance sous-chaîne dans le titre (bonus 2)
    case when f_unaccent(lower(r.title)) like '%' || normalized || '%'
      then 2.0 else 0.0 end +
    -- Correspondance dans les noms d'ingrédients (bonus 1)
    case when exists (
      select 1 from jsonb_array_elements(r.ingredients) elem
      where f_unaccent(lower(elem->>'name')) like '%' || normalized || '%'
    ) then 1.0 else 0.0 end
  )::float4 as rel
  from recipes r
  where
    -- Filtres
    (category_filter is null or r.category = category_filter)
    and (tags_filter is null or r.tags && tags_filter)
    and (is_tested_filter is null or r.is_tested = is_tested_filter)
    and (not p_favorites_only or user_id_filter is null
         or r.id in (select l.recipe_id from likes l where l.user_id = user_id_filter))
    -- Correspondance textuelle (au moins une condition)
    and (
      r.search_vector @@ tsq
      or similarity(f_unaccent(lower(r.title)), normalized) > 0.15
      or f_unaccent(lower(r.title)) like '%' || normalized || '%'
      or exists (
        select 1 from jsonb_array_elements(r.ingredients) elem
        where f_unaccent(lower(elem->>'name')) like '%' || normalized || '%'
      )
    )
  order by rel desc, r.created_at desc
  offset p_offset
  limit p_limit;
end;
$$ language plpgsql stable;

-- 10. Permissions
grant execute on function search_recipe_ids to anon, authenticated;
