-- Create table for storing social media generator templates/history
create table if not exists public.social_media_templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  subtitle text,
  rows jsonb not null default '[]'::jsonb,
  settings jsonb default '{}'::jsonb, -- store extra settings like boolean flags if needed
  is_favorite boolean default false
);

-- Add RLS policies (allowing all access for now as it is an admin tool)
alter table public.social_media_templates enable row level security;

create policy "Enable all access for authenticated users"
on public.social_media_templates
for all
to authenticated
using (true)
with check (true);

create policy "Enable all access for anon users (dev mode)"
on public.social_media_templates
for all
to anon
using (true)
with check (true);
