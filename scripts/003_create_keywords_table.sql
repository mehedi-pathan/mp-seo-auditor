-- Create keyword_tracks table
create table keyword_tracks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  keyword text not null,
  target_url text not null,
  current_rank integer,
  previous_rank integer,
  rank_change integer generated always as 
    (previous_rank - current_rank) stored,
  search_volume integer,
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  last_checked timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table keyword_tracks enable row level security;

-- Create policy so users can only see their own keywords
create policy "Users see own keywords"
  on keyword_tracks for all
  using (auth.uid() = user_id);

-- Create indexes for performance
create index keyword_tracks_user_id_idx on keyword_tracks(user_id);
create index keyword_tracks_created_at_idx on keyword_tracks(created_at desc);
