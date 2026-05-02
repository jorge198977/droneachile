-- ============================================================
-- DroneaChile – Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- Auto-created when user registers via Supabase Auth trigger
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'creator', 'user')),
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- REGIONS
-- ============================================================
create table if not exists public.regions (
  id serial primary key,
  name text not null,
  slug text unique not null
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id serial primary key,
  name text not null
);

-- ============================================================
-- VIDEOS
-- ============================================================
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  source text not null default 'youtube' check (source in ('youtube', 'upload')),
  region_id int references public.regions(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  views_count int not null default 0,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VIDEO CATEGORIES (pivot)
-- ============================================================
create table if not exists public.video_categories (
  video_id uuid not null references public.videos(id) on delete cascade,
  category_id int not null references public.categories(id) on delete cascade,
  primary key (video_id, category_id)
);

-- ============================================================
-- LIKES
-- ============================================================
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, video_id)
);

-- Function: update likes_count on video when like is added/removed
create or replace function public.update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.videos set likes_count = likes_count + 1 where id = NEW.video_id;
  elsif TG_OP = 'DELETE' then
    update public.videos set likes_count = greatest(likes_count - 1, 0) where id = OLD.video_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_change on public.likes;
create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.update_likes_count();

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VIEWS
-- ============================================================
create table if not exists public.views (
  id uuid default gen_random_uuid() primary key,
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Function: update views_count on video when view is registered
create or replace function public.update_views_count()
returns trigger as $$
begin
  update public.videos set views_count = views_count + 1 where id = NEW.video_id;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_view_insert on public.views;
create trigger on_view_insert
  after insert on public.views
  for each row execute procedure public.update_views_count();

-- ============================================================
-- MODERATION LOGS
-- ============================================================
create table if not exists public.moderation_logs (
  id uuid default gen_random_uuid() primary key,
  video_id uuid not null references public.videos(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('approved', 'rejected')),
  reason text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.videos enable row level security;
alter table public.video_categories enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.views enable row level security;
alter table public.moderation_logs enable row level security;

-- PROFILES policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- REGIONS policies
create policy "Regions are viewable by everyone"
  on public.regions for select using (true);

create policy "Only admins can manage regions"
  on public.regions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- CATEGORIES policies
create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

create policy "Only admins can manage categories"
  on public.categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- VIDEOS policies
create policy "Published videos are viewable by everyone"
  on public.videos for select using (
    status = 'published' or
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Authenticated users can create videos"
  on public.videos for insert with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.videos for update using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can delete their own videos"
  on public.videos for delete using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- VIDEO CATEGORIES policies
create policy "Video categories are viewable by everyone"
  on public.video_categories for select using (true);

create policy "Video owners can manage categories"
  on public.video_categories for all using (
    exists (select 1 from public.videos where id = video_id and user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- LIKES policies
create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

create policy "Users can manage their own likes"
  on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COMMENTS policies
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- VIEWS policies
create policy "Views are insertable by everyone"
  on public.views for insert with check (true);

create policy "Views are viewable by admins"
  on public.views for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- MODERATION LOGS policies
create policy "Moderation logs are viewable by admins"
  on public.moderation_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can create moderation logs"
  on public.moderation_logs for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- SEED: 16 Regiones de Chile
-- ============================================================
insert into public.regions (name, slug) values
  ('Arica y Parinacota', 'arica-y-parinacota'),
  ('Tarapacá', 'tarapaca'),
  ('Antofagasta', 'antofagasta'),
  ('Atacama', 'atacama'),
  ('Coquimbo', 'coquimbo'),
  ('Valparaíso', 'valparaiso'),
  ('Región Metropolitana', 'region-metropolitana'),
  ('O''Higgins', 'ohiggins'),
  ('Maule', 'maule'),
  ('Ñuble', 'nuble'),
  ('Biobío', 'biobio'),
  ('La Araucanía', 'la-araucania'),
  ('Los Ríos', 'los-rios'),
  ('Los Lagos', 'los-lagos'),
  ('Aysén', 'aysen'),
  ('Magallanes', 'magallanes')
on conflict (slug) do nothing;

-- SEED: Categories
insert into public.categories (name) values
  ('Paisajes'),
  ('Ciudades'),
  ('Naturaleza'),
  ('Playas'),
  ('Montañas'),
  ('Desiertos'),
  ('Lagos y Ríos'),
  ('Glaciares'),
  ('Volcanes'),
  ('Patrimonio'),
  ('Valle'),
  ('Campo')
on conflict do nothing;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_videos_status on public.videos(status);
create index if not exists idx_videos_region_id on public.videos(region_id);
create index if not exists idx_videos_user_id on public.videos(user_id);
create index if not exists idx_videos_created_at on public.videos(created_at desc);
create index if not exists idx_likes_video_id on public.likes(video_id);
create index if not exists idx_comments_video_id on public.comments(video_id);
create index if not exists idx_views_video_id on public.views(video_id);
