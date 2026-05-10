import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Plan } from '@/types'
import { getSubscriptionWindow } from '@/lib/planAccess'

const businessCoupon = process.env.BUSINESS_COUPON_CODE || 'MP100'

interface CouponPayload {
  code?: string
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = (await req.json()) as CouponPayload
    const normalizedCode = code?.trim().toUpperCase()

    if (!normalizedCode) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    if (normalizedCode !== businessCoupon.toUpperCase()) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }

    const plan: Plan = 'business'
    const now = new Date().toISOString()
    const subscription = getSubscriptionWindow('yearly')
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan,
        billing_interval: 'yearly',
        plan_started_at: subscription.startedAt,
        plan_expires_at: subscription.expiresAt,
        scans_today: 0,
        scans_reset_at: now,
        updated_at: now,
      })
      .eq('id', user.id)

    if (error) {
      const { error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .update({
          plan,
          scans_today: 0,
          scans_reset_at: now,
          updated_at: now,
        })
        .eq('id', user.id)

      if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    }

    return NextResponse.json({
      plan,
      billingInterval: 'yearly',
      planStartedAt: subscription.startedAt,
      planExpiresAt: subscription.expiresAt,
      message: 'Business plan unlocked',
    })
  } catch (error) {
    console.error('[coupon]', error)
    return NextResponse.json({ error: 'Unable to redeem coupon' }, { status: 500 })
  }
}
