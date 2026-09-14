-- Test accounts (R44, 2026-09-13). A blind run (blind-runs/) works a throwaway
-- account, and when the round is over that account's work should go without a
-- trace. Every table already cascades off auth.users, so removing the account
-- removes the rows; what was missing was a way to be *sure* which accounts may
-- be removed at all.
--
-- The flag is the rail. `scripts/wipe-test-account.mjs` refuses any address
-- whose writer row does not carry it, so a real writer's work cannot be taken
-- by a mistyped address. Default false: an account is a writer's until someone
-- deliberately says otherwise.
--
-- Nothing in the client reads this column. It is not a kind of account, it is
-- permission for one destructive script.

alter table public.writers add column if not exists test boolean not null default false;

comment on column public.writers.test is
  'Throwaway account for a blind run; the only accounts scripts/wipe-test-account.mjs will touch.';
