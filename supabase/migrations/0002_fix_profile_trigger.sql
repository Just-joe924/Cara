-- Fix: profile auto-creation must not fail when a signup has no full_name.
--
-- The deployed `profiles.full_name` column was created NOT NULL, so the
-- on-signup trigger threw (and Supabase returned a 500) whenever a user signed
-- up without a name in their metadata (e.g. OAuth, API, or admin-created users).
-- This aligns the column with the intended schema (nullable) and makes the
-- trigger null-safe. Idempotent — safe to run once in the SQL editor.

alter table public.profiles alter column full_name drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
