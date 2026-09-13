-- The identity becomes the email (R39 revised, 2026-09-13): a writer is an
-- address, so Supabase's own recovery can send a reset. Nobody had claimed a
-- name yet, so the table is reshaped in place. Applied through the connector
-- as `writers_by_email`.

alter table public.names rename to writers;
alter table public.writers rename column name to email;
alter policy "names: signed-in writers read" on public.writers rename to "writers: signed-in writers read";
alter policy "names: own row updates" on public.writers rename to "writers: own row updates";

drop function if exists public.name_taken(text);
create or replace function public.email_taken(candidate text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.writers w where w.email = candidate::extensions.citext);
$$;
grant execute on function public.email_taken(text) to anon, authenticated;

create or replace function public.my_name()
returns text language sql stable security definer set search_path = public as $$
  select w.email::text from public.writers w where w.user_id = auth.uid();
$$;

create or replace function public.share_project(p_project text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not public.is_owner(p_project) then raise exception 'Only the owner can share a project'; end if;
  select user_id into target from public.writers where email = p_name::extensions.citext;
  if target is null then raise exception 'No writer with the address "%"', p_name; end if;
  insert into public.members (project_id, user_id, role) values (p_project, target, 'writer') on conflict do nothing;
  return (select email::text from public.writers where user_id = target);
end;
$$;

create or replace function public.project_people(p_project text)
returns table (name text, role text, user_id uuid) language sql stable security definer set search_path = public as $$
  select w.email::text, m.role, m.user_id
  from public.members m join public.writers w on w.user_id = m.user_id
  where m.project_id = p_project and public.is_member(p_project)
  order by (m.role = 'owner') desc, m.added_at;
$$;

create or replace function public.my_projects()
returns table (id text, record jsonb, reminders jsonb, rev integer, updated_at timestamptz, owner uuid, people text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.record, p.reminders, p.rev, p.updated_at, p.owner,
    array(select w.email::text from public.members m2 join public.writers w on w.user_id = m2.user_id
          where m2.project_id = p.id order by (m2.role = 'owner') desc, m2.added_at) as people
  from public.projects p
  where public.is_member(p.id) or p.owner = auth.uid()
  order by p.updated_at desc;
$$;
