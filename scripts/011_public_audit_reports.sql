-- Public share links for audit reports.
alter table public.audits
  add column if not exists public_share_token text,
  add column if not exists is_public boolean not null default false,
  add column if not exists public_shared_at timestamptz;

create unique index if not exists audits_public_share_token_idx
  on public.audits (public_share_token)
  where public_share_token is not null;

create index if not exists audits_public_reports_idx
  on public.audits (is_public, public_share_token)
  where is_public = true;

comment on column public.audits.public_share_token is 'Unguessable token used for public report URLs.';
comment on column public.audits.is_public is 'Whether the audit can be viewed through its public report URL.';
comment on column public.audits.public_shared_at is 'Timestamp for when the public report link was last enabled.';
