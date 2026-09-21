-- An undo through the hosted door (round twenty-three, entries 70, 71; the
-- working list's X2). The door is a server per request, so the trail of what
-- an agent's session changed cannot live in memory: the last few walls as
-- they were ride rows of the writer's own, as the session's memory does
-- (agent_sessions). The door reads and writes them signed in as the writer;
-- no service key. Ten steps a session, swept after a day with the session,
-- and gone with the account.

create table if not exists public.agent_undo (
  seq bigint generated always as identity primary key,
  session_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id text not null default '',
  board_id text not null default '',
  what text not null,
  before jsonb not null,
  after_hash text not null,
  created_at timestamptz not null default now(),
  -- A wall, not a library: a board past this is not kept, and undo says there is no step.
  constraint agent_undo_small check (pg_column_size(before) < 4194304)
);

alter table public.agent_undo enable row level security;

create policy "agent_undo: own rows" on public.agent_undo
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists agent_undo_by_session on public.agent_undo (session_id, seq desc);
create index if not exists agent_undo_by_writer on public.agent_undo (user_id, created_at);
