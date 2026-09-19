-- Help in the app (R64): a writer's question the guide did not answer, kept on
-- PlotCoder's own project until a session answers it into the guide. A writer
-- writes and reads only their own; the app's maintainer tools read the list
-- with the service role, which never ships. Applied through the connector as
-- `questions`.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  question text not null,
  asked_at timestamptz not null default now(),
  answered_at timestamptz,
  answer text,
  section text
);

alter table public.questions enable row level security;

create policy "questions: own row inserts" on public.questions
  for insert to authenticated with check (user_id = auth.uid());
create policy "questions: own rows read" on public.questions
  for select to authenticated using (user_id = auth.uid());

create index if not exists questions_waiting on public.questions (asked_at) where answered_at is null;
