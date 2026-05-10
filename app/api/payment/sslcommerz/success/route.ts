import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getAppUrl,
  getSslcommerzBaseUrl,
  getSslcommerzCredentials,
  isPaidPlan,
  nextMonthlyReset,
  sslcommerzPlans,
} from '@/lib/sslcommerz'

async function validatePayment(formData: FormData) {
  const valId = String(formData.get('val_id') || '')

  if (!valId) {
    throw new Error('Missing validation ID')
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
    throw new Error('Payment validation failed')
  }

  const userId = data.value_a || String(formData.get('value_a') || '')
  const planId = data.value_b || String(formData.get('value_b') || '')

  if (!userId || !isPaidPlan(planId)) {
    throw new Error('Invalid payment metadata')
  }

  const expectedAmount = sslcommerzPlans[planId].amount
  const paidAmount = Number(data.amount)

  if (data.currency !== 'BDT' || Math.round(paidAmount) !== expectedAmount) {
    throw new Error('Payment amount mismatch')
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

  return planId
}

export async function POST(req: NextRequest) {
  const appUrl = getAppUrl()

  try {
    const formData = await req.formData()
    const planId = await validatePayment(formData)

    return NextResponse.redirect(`${appUrl}/upgrade?payment=success&plan=${planId}`, 303)
  } catch (error) {
    console.error('[sslcommerz:success]', error)
    return NextResponse.redirect(`${appUrl}/upgrade?payment=validation_failed`, 303)
  }
}
