-- PlotCoder's own project (D27 closed, 2026-09-13). Applied to the live
-- project through the Supabase connector as `names_projects_members_boards`;
-- kept here so the schema lives in git. A writer is a name (R39); a project
-- has members (R41); boards are documents with a revision, the shape the
-- app's dev bridge already speaks (R4).

create extension if not exists citext with schema extensions;

-- One name per writer. The auth email is synthetic (<name>@names.plotcoder.com);
-- this table is what people see and share by.
create table public.names (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name extensions.citext not null unique,
  created_at timestamptz not null default now()
);

create table public.projects (
  id text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record jsonb not null,
  reminders jsonb,
  rev integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'writer' check (role in ('owner', 'writer')),
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.boards (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  state jsonb not null,
  rev integer not null default 1,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);

create index members_user_idx on public.members (user_id);
create index boards_project_idx on public.boards (project_id);
create index projects_owner_idx on public.projects (owner);

-- Membership, readable from row-level security without recursion.
create or replace function public.is_member(p_project text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.project_id = p_project and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(p_project text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.owner = auth.uid()
  );
$$;

-- The owner is a member from the moment the project exists.
create or replace function public.add_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (project_id, user_id, role)
  values (new.id, new.owner, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger projects_owner_member
after insert on public.projects
for each row execute function public.add_owner_member();

alter table public.names enable row level security;
alter table public.projects enable row level security;
alter table public.members enable row level security;
alter table public.boards enable row level security;

-- Names are public among writers: that is what sharing by name means.
create policy "names: signed-in writers read" on public.names
  for select to authenticated using (true);
create policy "names: own row updates" on public.names
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "projects: members read" on public.projects
  for select to authenticated using (public.is_member(id) or owner = auth.uid());
create policy "projects: owner inserts" on public.projects
  for insert to authenticated with check (owner = auth.uid());
create policy "projects: members update" on public.projects
  for update to authenticated using (public.is_member(id)) with check (public.is_member(id));
create policy "projects: owner deletes" on public.projects
  for delete to authenticated using (owner = auth.uid());

create policy "members: members read" on public.members
  for select to authenticated using (public.is_member(project_id));
create policy "members: owner adds" on public.members
  for insert to authenticated with check (public.is_owner(project_id));
create policy "members: owner removes, or self leaves" on public.members
  for delete to authenticated using (public.is_owner(project_id) or user_id = auth.uid());

create policy "boards: members read" on public.boards
  for select to authenticated using (public.is_member(project_id));
create policy "boards: members insert" on public.boards
  for insert to authenticated with check (public.is_member(project_id));
create policy "boards: members update" on public.boards
  for update to authenticated using (public.is_member(project_id)) with check (public.is_member(project_id));
create policy "boards: members delete" on public.boards
  for delete to authenticated using (public.is_member(project_id));

-- Is a name taken? Asked from the door before anyone is signed in.
create or replace function public.name_taken(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.names n where n.name = candidate::extensions.citext);
$$;
grant execute on function public.name_taken(text) to anon, authenticated;

-- My name.
create or replace function public.my_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select n.name::text from public.names n where n.user_id = auth.uid();
$$;
grant execute on function public.my_name() to authenticated;

-- Share a project with a name. Owner only; the name must exist.
create or replace function public.share_project(p_project text, p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if not public.is_owner(p_project) then
    raise exception 'Only the owner can share a project';
  end if;
  select user_id into target from public.names where name = p_name::extensions.citext;
  if target is null then
    raise exception 'No writer called "%"', p_name;
  end if;
  insert into public.members (project_id, user_id, role) values (p_project, target, 'writer')
  on conflict do nothing;
  return (select name::text from public.names where user_id = target);
end;
$$;
grant execute on function public.share_project(text, text) to authenticated;

-- The people on a project, by name.
create or replace function public.project_people(p_project text)
returns table (name text, role text, user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select n.name::text, m.role, m.user_id
  from public.members m join public.names n on n.user_id = m.user_id
  where m.project_id = p_project and public.is_member(p_project)
  order by (m.role = 'owner') desc, m.added_at;
$$;
grant execute on function public.project_people(text) to authenticated;

-- Remove a person from a project (owner), or leave it (self).
create or replace function public.unshare_project(p_project text, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_owner(p_project) or p_user = auth.uid()) then
    raise exception 'Only the owner can remove someone';
  end if;
  if exists (select 1 from public.projects where id = p_project and owner = p_user) then
    raise exception 'The owner cannot be removed';
  end if;
  delete from public.members where project_id = p_project and user_id = p_user;
end;
$$;
grant execute on function public.unshare_project(text, uuid) to authenticated;

-- Every project I am on, with its people, for the picker and the wordmark sheet.
create or replace function public.my_projects()
returns table (id text, record jsonb, reminders jsonb, rev integer, updated_at timestamptz, owner uuid, people text[])
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.record, p.reminders, p.rev, p.updated_at, p.owner,
    array(select n.name::text from public.members m2 join public.names n on n.user_id = m2.user_id
          where m2.project_id = p.id order by (m2.role = 'owner') desc, m2.added_at) as people
  from public.projects p
  where public.is_member(p.id) or p.owner = auth.uid()
  order by p.updated_at desc;
$$;
grant execute on function public.my_projects() to authenticated;

-- Live changes (R41): boards, records and members reach everyone on the project.
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.members;
