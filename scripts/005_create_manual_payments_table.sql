-- Create manual payment submissions table
create table if not exists manual_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text not null check (plan in ('pro', 'business')),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'yearly')),
  amount integer not null,
  method text not null check (method in ('bkash', 'nagad')),
  payment_number text not null,
  sender_number text not null,
  transaction_id text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  subscription_starts_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table manual_payments enable row level security;

drop policy if exists "Users can create own manual payments" on manual_payments;
create policy "Users can create own manual payments"
  on manual_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own manual payments" on manual_payments;
create policy "Users can view own manual payments"
  on manual_payments for select
  using (auth.uid() = user_id);

create index if not exists manual_payments_user_id_idx on manual_payments(user_id);
create index if not exists manual_payments_status_idx on manual_payments(status);
create index if not exists manual_payments_created_at_idx on manual_payments(created_at desc);
