-- =============================================
-- Le Grimoire Culinaire — Schéma initial
-- =============================================

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles visibles par tous"
  on profiles for select using (true);

create policy "L'utilisateur peut modifier son profil"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', new.email));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Recipes
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  author_name text,
  author_date date,
  category text not null default 'autre',
  tags text[] default '{}',
  servings int,
  prep_time int,
  cook_time int,
  is_tested boolean default false,
  tested_at timestamptz,
  tested_notes text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(author_name, '')), 'C')
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index recipes_search_idx on recipes using gin(search_vector);
create index recipes_user_id_idx on recipes(user_id);
create index recipes_category_idx on recipes(category);

alter table recipes enable row level security;

create policy "Recettes visibles par tous"
  on recipes for select using (true);

create policy "L'utilisateur peut créer ses recettes"
  on recipes for insert with check (auth.uid() = user_id);

create policy "L'utilisateur peut modifier ses recettes"
  on recipes for update using (auth.uid() = user_id);

create policy "L'utilisateur peut supprimer ses recettes"
  on recipes for delete using (auth.uid() = user_id);

-- Recipe images
create table if not exists recipe_images (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  storage_path text not null,
  type text not null check (type in ('source', 'step', 'result')),
  step_number int,
  position int default 0,
  created_at timestamptz default now()
);

create index recipe_images_recipe_id_idx on recipe_images(recipe_id);

alter table recipe_images enable row level security;

create policy "Images visibles par tous"
  on recipe_images for select using (true);

create policy "Le propriétaire peut gérer les images"
  on recipe_images for insert with check (
    auth.uid() = (select user_id from recipes where id = recipe_id)
  );

create policy "Le propriétaire peut supprimer les images"
  on recipe_images for delete using (
    auth.uid() = (select user_id from recipes where id = recipe_id)
  );

-- Likes
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);

create index likes_recipe_id_idx on likes(recipe_id);
create index likes_user_id_idx on likes(user_id);

alter table likes enable row level security;

create policy "Likes visibles par tous"
  on likes for select using (true);

create policy "Utilisateur authentifié peut liker"
  on likes for insert with check (auth.uid() = user_id);

create policy "Utilisateur peut retirer son like"
  on likes for delete using (auth.uid() = user_id);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index comments_recipe_id_idx on comments(recipe_id);

alter table comments enable row level security;

create policy "Commentaires visibles par tous"
  on comments for select using (true);

create policy "Utilisateur authentifié peut commenter"
  on comments for insert with check (auth.uid() = user_id);

create policy "Utilisateur peut supprimer ses commentaires"
  on comments for delete using (auth.uid() = user_id);

-- Storage buckets (à créer manuellement dans le dashboard Supabase)
-- insert into storage.buckets (id, name, public) values ('recipe-sources', 'recipe-sources', true);
-- insert into storage.buckets (id, name, public) values ('recipe-photos', 'recipe-photos', true);
