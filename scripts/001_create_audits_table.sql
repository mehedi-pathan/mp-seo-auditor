-- Create audits table
create table audits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  url text not null,
  domain text not null,
  seo_score integer not null default 0,
  performance_score integer not null default 0,
  accessibility_score integer not null default 0,
  audit_data jsonb not null default '{}',
  ai_summary text,
  top_fixes jsonb default '[]',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table audits enable row level security;

-- Create policy so users can only see their own audits
create policy "Users see own audits"
  on audits for all
  using (auth.uid() = user_id);

-- Create indexes for performance
create index audits_user_id_idx on audits(user_id);
create index audits_domain_idx on audits(domain);
create index audits_created_at_idx on audits(created_at desc);
