-- Add richer profile details and a monthly edit lock timestamp.
alter table public.profiles
  add column if not exists phone text,
  add column if not exists work_description text,
  add column if not exists profile_last_edited_at timestamptz;

comment on column public.profiles.phone is 'Optional user phone number shown on the profile page.';
comment on column public.profiles.work_description is 'Short description of what the user does or what kind of business/site they manage.';
comment on column public.profiles.profile_last_edited_at is 'Timestamp used by the app to limit profile detail edits to once every 30 days.';
