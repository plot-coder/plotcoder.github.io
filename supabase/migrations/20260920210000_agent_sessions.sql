-- A session for the hosted door (the to-do's B1, round twenty-two): what one
-- agent's session remembers from one request to the next — whether it has
-- read the wall, which advice it has been given, the questions it last read —
-- since the door is a server per request and remembers nothing itself. The
-- row is the writer's own: the door reads and writes it signed in as the
-- writer, so no service key is involved, and nobody reads another's. A new
-- session sweeps the writer's rows older than a day; an account deleted takes
-- its rows with it.

create table if not exists public.agent_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- A memory is a few flags and the last reading's questions, never a wall.
  constraint agent_sessions_small check (pg_column_size(memory) < 262144)
);

alter table public.agent_sessions enable row level security;

create policy "agent_sessions: own rows" on public.agent_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists agent_sessions_by_writer on public.agent_sessions (user_id, updated_at);
