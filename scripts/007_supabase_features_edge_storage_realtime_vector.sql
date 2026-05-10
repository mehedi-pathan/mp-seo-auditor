-- Supabase feature upgrade for MP SEO Auditor.
-- Run this in Supabase SQL Editor after enabling the project.

create extension if not exists vector;

alter table public.audits
  add column if not exists pdf_url text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists embedding vector(1536);

create table if not exists public.scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  step text not null default 'Queued',
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'error')),
  audit_id uuid references public.audits(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scan_sessions enable row level security;

drop policy if exists "Users can read their scan sessions" on public.scan_sessions;
create policy "Users can read their scan sessions"
on public.scan_sessions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their scan sessions" on public.scan_sessions;
create policy "Users can create their scan sessions"
on public.scan_sessions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their scan sessions" on public.scan_sessions;
create policy "Users can update their scan sessions"
on public.scan_sessions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scan_sessions'
  ) then
    alter publication supabase_realtime add table public.scan_sessions;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audit-reports', 'audit-reports', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf'];

drop policy if exists "Users can read their audit reports" on storage.objects;
create policy "Users can read their audit reports"
on storage.objects for select
to authenticated
using (
  bucket_id = 'audit-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload their audit reports" on storage.objects;
create policy "Users can upload their audit reports"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'audit-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their audit reports" on storage.objects;
create policy "Users can update their audit reports"
on storage.objects for update
to authenticated
using (
  bucket_id = 'audit-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'audit-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.match_audits(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float default 0.72,
  match_count int default 20
)
returns table (
  id uuid,
  url text,
  domain text,
  seo_score int,
  performance_score int,
  accessibility_score int,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    audits.id,
    audits.url,
    audits.domain,
    audits.seo_score,
    audits.performance_score,
    audits.accessibility_score,
    audits.created_at,
    1 - (audits.embedding <=> query_embedding) as similarity
  from public.audits
  where audits.user_id = match_user_id
    and audits.embedding is not null
    and 1 - (audits.embedding <=> query_embedding) > match_threshold
  order by audits.embedding <=> query_embedding
  limit match_count;
$$;

