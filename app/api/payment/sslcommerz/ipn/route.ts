import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getSslcommerzBaseUrl,
  getSslcommerzCredentials,
  isPaidPlan,
  nextMonthlyReset,
  sslcommerzPlans,
} from '@/lib/sslcommerz'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const valId = String(formData.get('val_id') || '')

    if (!valId) {
      return NextResponse.json({ error: 'Missing validation ID' }, { status: 400 })
    }

    const { storeId, storePassword } = getSslcommerzCredentials()
    const params = new URLSearchParams({
      val_id: valId,
      store_id: storeId,
      store_passwd: storePassword,
      v: '1',
      format: 'json',
    })

    const response = await fetch(`${getSslcommerzBaseUrl()}/validator/api/validationserverAPI.php?${params}`)
    const data = await response.json()

    if (!response.ok || (data.status !== 'VALID' && data.status !== 'VALIDATED')) {
      return NextResponse.json({ error: 'Payment validation failed' }, { status: 400 })
    }

    const userId = data.value_a || String(formData.get('value_a') || '')
    const planId = data.value_b || String(formData.get('value_b') || '')

    if (!userId || !isPaidPlan(planId)) {
      return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
    }

    const paidAmount = Number(data.amount)
    const expectedAmount = sslcommerzPlans[planId].amount

    if (data.currency !== 'BDT' || Math.round(paidAmount) !== expectedAmount) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        plan: planId,
        scans_today: 0,
        scans_reset_at: nextMonthlyReset(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[sslcommerz:ipn]', error)
    return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 })
  }
}
