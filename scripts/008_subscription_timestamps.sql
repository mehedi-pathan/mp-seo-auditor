-- Add subscription duration fields for package access.
alter table public.profiles
  add column if not exists billing_interval text default 'monthly' check (billing_interval in ('monthly', 'yearly')),
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz;

alter table public.manual_payments
  add column if not exists billing_interval text default 'monthly' check (billing_interval in ('monthly', 'yearly')),
  add column if not exists subscription_starts_at timestamptz,
  add column if not exists subscription_expires_at timestamptz;

-- Backfill existing paid users that were upgraded before subscription dates existed.
update public.profiles
set
  billing_interval = coalesce(billing_interval, 'monthly'),
  plan_started_at = coalesce(plan_started_at, now()),
  plan_expires_at = coalesce(
    plan_expires_at,
    case
      when coalesce(billing_interval, 'monthly') = 'yearly' then now() + interval '1 year'
      else now() + interval '1 month'
    end
  ),
  updated_at = now()
where plan in ('pro', 'business', 'agency')
  and (plan_started_at is null or plan_expires_at is null);

create or replace function approve_manual_payment(payment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  payment_row manual_payments%rowtype;
  starts_at timestamptz;
  expires_at timestamptz;
begin
  select * into payment_row
  from manual_payments
  where id = payment_id
    and status = 'pending';

  if not found then
    raise exception 'Pending payment not found';
  end if;

  starts_at := coalesce(payment_row.subscription_starts_at, now());
  expires_at := coalesce(
    payment_row.subscription_expires_at,
    case
      when payment_row.billing_interval = 'yearly' then starts_at + interval '1 year'
      else starts_at + interval '1 month'
    end
  );

  update profiles
  set
    plan = payment_row.plan,
    billing_interval = payment_row.billing_interval,
    plan_started_at = starts_at,
    plan_expires_at = expires_at,
    scans_today = 0,
    scans_reset_at = starts_at + interval '1 month',
    updated_at = now()
  where id = payment_row.user_id;

  update manual_payments
  set
    status = 'approved',
    subscription_starts_at = starts_at,
    subscription_expires_at = expires_at,
    updated_at = now()
  where id = payment_id;
end;
$$;
