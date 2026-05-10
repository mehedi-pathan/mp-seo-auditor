-- Create profiles table
create table profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  avatar_url text,
  plan text not null default 'free',
  scans_today integer not null default 0,
  scans_reset_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policy so users can only see their own profile
create policy "Users see own profile"
  on profiles for all
  using (auth.uid() = id);

-- Auto create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
