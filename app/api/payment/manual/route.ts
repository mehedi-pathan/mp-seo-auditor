import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { isPaidPlan, sslcommerzPlans } from '@/lib/sslcommerz'
import { getSubscriptionWindow, type BillingInterval } from '@/lib/planAccess'

const paymentNumber = '+8801622839616'
const methods = ['bkash', 'nagad']
const billingIntervals: BillingInterval[] = ['monthly', 'yearly']
const yearlyDiscountMultiplier = 0.8

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { planId, method, senderNumber, transactionId, billingInterval = 'monthly', dryRun } = await req.json()

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!methods.includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    if (!billingIntervals.includes(billingInterval)) {
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 })
    }

    if (!senderNumber || String(senderNumber).trim().length < 8) {
      return NextResponse.json({ error: 'Sender number is required' }, { status: 400 })
    }

    if (!transactionId || String(transactionId).trim().length < 5) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    if (dryRun) {
      const { error } = await supabaseAdmin
        .from('manual_payments')
        .select('id')
        .limit(1)

      if (error) {
        return NextResponse.json(
          { error: 'Manual payment table is not ready. Run scripts/005_create_manual_payments_table.sql in Supabase.' },
          { status: 500 },
        )
      }

      return NextResponse.json({ ok: true, dryRun: true })
    }

    const subscription = getSubscriptionWindow(billingInterval)
    const amount = billingInterval === 'yearly'
      ? Math.round(sslcommerzPlans[planId].amount * 12 * yearlyDiscountMultiplier)
      : sslcommerzPlans[planId].amount
    const paymentPayload = {
      user_id: authData.user.id,
      plan: planId,
      amount,
      method,
      payment_number: paymentNumber,
      sender_number: String(senderNumber).trim(),
      transaction_id: String(transactionId).trim(),
      billing_interval: billingInterval,
      subscription_starts_at: subscription.startedAt,
      subscription_expires_at: subscription.expiresAt,
      status: 'pending',
    }

    const { error } = await supabaseAdmin.from('manual_payments').insert(paymentPayload)

    if (error) {
      const { error: fallbackError } = await supabaseAdmin.from('manual_payments').insert({
        user_id: authData.user.id,
        plan: planId,
        amount,
        method,
        payment_number: paymentNumber,
        sender_number: String(senderNumber).trim(),
        transaction_id: String(transactionId).trim(),
        status: 'pending',
      })

      if (fallbackError) {
        console.error('[manual-payment]', fallbackError)
        return NextResponse.json(
          { error: 'Manual payment table is not ready. Run scripts/005_create_manual_payments_table.sql and scripts/008_subscription_timestamps.sql in Supabase.' },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ ok: true, billingInterval, subscription })
  } catch (error) {
    console.error('[manual-payment]', error)
    return NextResponse.json({ error: 'Could not submit manual payment' }, { status: 500 })
  }
}
