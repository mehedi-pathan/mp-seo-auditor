import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getAppUrl,
  getSslcommerzBaseUrl,
  getSslcommerzCredentials,
  isPaidPlan,
  sslcommerzPlans,
} from '@/lib/sslcommerz'

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

    const { planId } = await req.json()

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,name,email')
      .eq('id', authData.user.id)
      .single()

    const plan = sslcommerzPlans[planId]
    const { storeId, storePassword } = getSslcommerzCredentials()
    const appUrl = getAppUrl()
    const tranId = `MP${Date.now()}${planId === 'pro' ? 'P' : 'B'}`
    const customerName =
      profile?.name ||
      authData.user.user_metadata?.name ||
      authData.user.user_metadata?.full_name ||
      authData.user.email?.split('@')[0] ||
      'MP SEO User'
    const customerEmail = profile?.email || authData.user.email || 'customer@example.com'

    const payload = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: String(plan.amount),
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${appUrl}/api/payment/sslcommerz/success`,
      fail_url: `${appUrl}/api/payment/sslcommerz/fail`,
      cancel_url: `${appUrl}/api/payment/sslcommerz/cancel`,
      ipn_url: `${appUrl}/api/payment/sslcommerz/ipn`,
      product_name: `MP SEO Auditor ${plan.name}`,
      product_category: 'SaaS Subscription',
      product_profile: 'general',
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: '01622839616',
      shipping_method: 'NO',
      num_of_item: '1',
      value_a: authData.user.id,
      value_b: planId,
      value_c: tranId,
    })

    const response = await fetch(`${getSslcommerzBaseUrl()}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload,
    })

    const data = await response.json()

    if (!response.ok || !data.GatewayPageURL) {
      return NextResponse.json(
        { error: data.failedreason || 'Unable to start SSLCommerz payment' },
        { status: 502 },
      )
    }

    return NextResponse.json({ url: data.GatewayPageURL, sessionKey: data.sessionkey })
  } catch (error) {
    console.error('[sslcommerz:initiate]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment initiation failed' },
      { status: 500 },
    )
  }
}
