-- Replace these two values, then run after you verify a bKash/Nagad payment.
-- Example:
-- select approve_manual_payment('manual-payment-id-here');

create or replace function approve_manual_payment(payment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  payment_row manual_payments%rowtype;
begin
  select * into payment_row
  from manual_payments
  where id = payment_id
    and status = 'pending';

  if not found then
    raise exception 'Pending payment not found';
  end if;

  update profiles
  set
    plan = payment_row.plan,
    billing_interval = coalesce(payment_row.billing_interval, 'monthly'),
    plan_started_at = coalesce(payment_row.subscription_starts_at, now()),
    plan_expires_at = coalesce(payment_row.subscription_expires_at, now() + interval '1 month'),
    scans_today = 0,
    scans_reset_at = now() + interval '1 month',
    updated_at = now()
  where id = payment_row.user_id;

  update manual_payments
  set
    status = 'approved',
    updated_at = now()
  where id = payment_id;
end;
$$;
