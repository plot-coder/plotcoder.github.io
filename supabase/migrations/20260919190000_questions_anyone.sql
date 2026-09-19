-- Help in the app (R64, Robert's word 2026-09-19): anyone may ask, signed in
-- or not. The answer lands in the public guide, so a question needs no
-- address; a signed-in writer's question keeps their id and email so they see
-- the answer under Your questions, a stranger's keeps neither. A question is
-- one paragraph at most. Applied through the Management API as
-- `questions_anyone`.

alter table public.questions alter column user_id drop not null;
alter table public.questions alter column email drop not null;
alter table public.questions add constraint questions_one_paragraph check (char_length(question) between 1 and 1000);
create policy "questions: anyone may ask" on public.questions
  for insert to anon with check (user_id is null and email is null);
