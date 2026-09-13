-- Files on the project (Roadmap 2, item 5; R36's picture, and the store the
-- horizon's takes will live in). One private bucket, a folder per project,
-- access by membership like the tables; an assets row per file so the app
-- and the mirror know what is there without listing the bucket.

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  kind text not null default 'file' check (kind in ('picture', 'take', 'file')),
  -- What the file is about: a character id, a card id, or empty.
  subject text not null default '',
  path text not null unique,
  name text not null,
  size integer not null default 0,
  content_type text not null default 'application/octet-stream',
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index assets_project_idx on public.assets (project_id, subject);

alter table public.assets enable row level security;
create policy "assets: members read" on public.assets
  for select to authenticated using (public.is_member(project_id));
create policy "assets: members add" on public.assets
  for insert to authenticated with check (public.is_member(project_id));
create policy "assets: members change" on public.assets
  for update to authenticated using (public.is_member(project_id)) with check (public.is_member(project_id));
create policy "assets: members remove" on public.assets
  for delete to authenticated using (public.is_member(project_id));

alter publication supabase_realtime add table public.assets;

insert into storage.buckets (id, name, public, file_size_limit)
values ('projects', 'projects', false, 209715200)
on conflict (id) do nothing;

-- Objects live at <project id>/<kind>/<file>; the first folder is the project.
create policy "project files: members read" on storage.objects
  for select to authenticated using (bucket_id = 'projects' and public.is_member(split_part(name, '/', 1)));
create policy "project files: members add" on storage.objects
  for insert to authenticated with check (bucket_id = 'projects' and public.is_member(split_part(name, '/', 1)));
create policy "project files: members change" on storage.objects
  for update to authenticated using (bucket_id = 'projects' and public.is_member(split_part(name, '/', 1)));
create policy "project files: members remove" on storage.objects
  for delete to authenticated using (bucket_id = 'projects' and public.is_member(split_part(name, '/', 1)));
