create table if not exists public.visit_requests (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 6 and 32),
  visit_date date not null,
  message text not null default '' check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.visit_requests enable row level security;

revoke all on table public.visit_requests from anon, authenticated;
grant insert (name, phone, visit_date, message) on table public.visit_requests to anon, authenticated;
grant select on table public.visit_requests to authenticated;
grant usage, select on sequence public.visit_requests_id_seq to anon, authenticated;

create policy "Visitors submit visit requests"
  on public.visit_requests
  for insert
  to anon, authenticated
  with check (true);

create policy "Active CMS admins read visit requests"
  on public.visit_requests
  for select
  to authenticated
  using (public.is_cms_admin());
