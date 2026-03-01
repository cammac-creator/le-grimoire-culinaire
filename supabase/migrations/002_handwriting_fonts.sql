-- ============================================
-- Migration : Polices d'écriture manuscrite
-- ============================================

-- Table principale des polices
create table public.handwriting_fonts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  font_name text not null,
  storage_path text,
  character_coverage jsonb default '{}',
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Images sources pour l'extraction de caractères
create table public.font_source_images (
  id uuid primary key default gen_random_uuid(),
  font_id uuid references public.handwriting_fonts(id) on delete cascade not null,
  storage_path text not null,
  extraction_result jsonb,
  created_at timestamptz default now()
);

-- Lien recette → police manuscrite
alter table public.recipes
  add column handwriting_font_id uuid references public.handwriting_fonts(id) on delete set null;

-- Index
create index idx_handwriting_fonts_user on public.handwriting_fonts(user_id);
create index idx_font_source_images_font on public.font_source_images(font_id);
create index idx_recipes_handwriting_font on public.recipes(handwriting_font_id);

-- RLS : handwriting_fonts
alter table public.handwriting_fonts enable row level security;

create policy "Les utilisateurs voient leurs propres polices"
  on public.handwriting_fonts for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs créent leurs propres polices"
  on public.handwriting_fonts for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs modifient leurs propres polices"
  on public.handwriting_fonts for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs suppriment leurs propres polices"
  on public.handwriting_fonts for delete
  using (auth.uid() = user_id);

-- Lecture publique pour afficher les polices sur les recettes partagées
create policy "Lecture publique des polices ready"
  on public.handwriting_fonts for select
  using (status = 'ready');

-- RLS : font_source_images
alter table public.font_source_images enable row level security;

create policy "Les utilisateurs voient les images de leurs polices"
  on public.font_source_images for select
  using (
    exists (
      select 1 from public.handwriting_fonts
      where id = font_source_images.font_id
      and user_id = auth.uid()
    )
  );

create policy "Les utilisateurs ajoutent des images à leurs polices"
  on public.font_source_images for insert
  with check (
    exists (
      select 1 from public.handwriting_fonts
      where id = font_source_images.font_id
      and user_id = auth.uid()
    )
  );

create policy "Les utilisateurs suppriment les images de leurs polices"
  on public.font_source_images for delete
  using (
    exists (
      select 1 from public.handwriting_fonts
      where id = font_source_images.font_id
      and user_id = auth.uid()
    )
  );

-- Trigger updated_at
create trigger set_handwriting_fonts_updated_at
  before update on public.handwriting_fonts
  for each row
  execute function public.handle_updated_at();

-- Bucket Storage (à créer manuellement dans le dashboard Supabase)
-- insert into storage.buckets (id, name, public) values ('handwriting-fonts', 'handwriting-fonts', true);
