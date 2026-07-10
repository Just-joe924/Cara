-- Allow the 'seller' role and make the seller-role trigger resilient.
--
-- The deployed profiles table has a CHECK constraint that only permitted
-- 'customer'/'admin', so onboarding a seller (which sets role='seller') failed.
-- This widens the allowed roles and makes the trigger non-fatal: seller-ness is
-- ultimately derived from the existence of a `sellers` row, so a role-update
-- hiccup must never block seller creation. Idempotent.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'seller', 'admin'));

create or replace function public.handle_new_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    update public.profiles
      set role = 'seller'
      where id = new.user_id and role <> 'admin';
  exception when others then
    null; -- role is informational only; ignore if it can't be set
  end;
  return new;
end;
$$;
