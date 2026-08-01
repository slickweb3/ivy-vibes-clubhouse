create table if not exists public.pond_pads (
  id uuid primary key default gen_random_uuid(),
  day date not null default (now() at time zone 'utc')::date,
  croak text not null,
  note_index smallint not null,
  x real not null,
  y real not null,
  created_at timestamptz not null default now()
);

grant select on public.pond_pads to anon, authenticated;
grant all on public.pond_pads to service_role;

alter table public.pond_pads enable row level security;

create policy "Anyone can read todays pond"
on public.pond_pads
for select
to anon, authenticated
using (day = (now() at time zone 'utc')::date);

create index if not exists pond_pads_day_idx on public.pond_pads (day, created_at);

create table if not exists public.pond_planters (
  day date not null,
  planter_hash text not null,
  pad_id uuid not null references public.pond_pads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (day, planter_hash)
);

grant all on public.pond_planters to service_role;

alter table public.pond_planters enable row level security;

create policy "Service role manages planters"
on public.pond_planters
for all
to service_role
using (true)
with check (true);

alter table public.pond_pads replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pond_pads'
    ) then
      alter publication supabase_realtime add table public.pond_pads;
    end if;
  end if;
end $$;