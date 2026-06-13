create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  interest text not null,
  source text default 'artex_landing_page',
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

revoke all on table public.waitlist from public;
revoke all on table public.waitlist from anon;
revoke all on table public.waitlist from authenticated;
grant insert on table public.waitlist to anon;
grant select, insert, update, delete on table public.waitlist to service_role;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist'
  loop
    execute format('drop policy if exists %I on public.waitlist', policy_record.policyname);
  end loop;
end $$;

create policy "waitlist anonymous inserts"
on public.waitlist
for insert
to anon
with check (
  email = lower(email)
  and length(email) between 6 and 254
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and interest = 'General ArtEx waitlist'
  and source = 'artex_landing_page'
  and (name is null or length(name) between 1 and 120)
);

drop function if exists public.waitlist_count();
