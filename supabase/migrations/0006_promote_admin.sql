-- Grant admin access to the store owner.
--
-- Roles live in public.profiles.role ('customer' | 'seller' | 'admin'). The
-- admin dashboard (and its server API) authorize on role = 'admin', so at least
-- one account must be promoted here. Change the email below to grant admin to a
-- different account. Idempotent: re-running just re-affirms the role.

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'theoreoluwajohnson@gmail.com';

-- Speeds up the role lookups the admin middleware performs on every request.
create index if not exists idx_profiles_role on public.profiles (role);
