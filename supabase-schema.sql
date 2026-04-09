-- Formatory Supabase Schema
-- Zaženi ta SQL v Supabase SQL Editorju (supabase.com → projekt → SQL Editor)

-- 1. Števec pretvorb in analitika orodij
create table conversions (
  id bigint generated always as identity primary key,
  tool_id text not null,
  created_at timestamptz default now()
);

-- Index za hitro štetje po orodju
create index idx_conversions_tool on conversions(tool_id);
create index idx_conversions_date on conversions(created_at);

-- 2. Kontaktni obrazec
create table messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- 3. RLS (Row Level Security) - dovoli anonnim uporabnikom vstavljanje
alter table conversions enable row level security;
alter table messages enable row level security;

-- Dovoli anonnim uporabnikom vstavljanje pretvorb
create policy "Anon can insert conversions"
  on conversions for insert
  to anon
  with check (true);

-- Dovoli anonnim branje agregatov (števec)
create policy "Anon can read conversions"
  on conversions for select
  to anon
  using (true);

-- Dovoli anonnim pošiljanje sporočil
create policy "Anon can insert messages"
  on messages for insert
  to anon
  with check (true);

-- View za statistiko orodij
create or replace view tool_stats as
select
  tool_id,
  count(*) as total,
  count(*) filter (where created_at > now() - interval '24 hours') as last_24h,
  count(*) filter (where created_at > now() - interval '7 days') as last_7d
from conversions
group by tool_id
order by total desc;

-- Dovoli branje view-a
grant select on tool_stats to anon;
