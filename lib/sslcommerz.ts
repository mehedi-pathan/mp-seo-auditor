export type PaidPlanId = 'pro' | 'business'

export const sslcommerzPlans: Record<PaidPlanId, {
  name: string
  amount: number
  auditLimit: number | null
}> = {
  pro: {
    name: 'Pro',
    amount: 1900,
    auditLimit: 100,
  },
  business: {
    name: 'Business',
    amount: 4900,
    auditLimit: null,
  },
}

export function isPaidPlan(planId: string): planId is PaidPlanId {
  return planId === 'pro' || planId === 'business'
}

export function getSslcommerzBaseUrl() {
  return process.env.SSLCOMMERZ_IS_LIVE === 'true'
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com'
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function nextMonthlyReset() {
  const resetDate = new Date()
  resetDate.setMonth(resetDate.getMonth() + 1)
  return resetDate.toISOString()
}

export function getSslcommerzCredentials() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD

  if (!storeId || !storePassword) {
    throw new Error('Missing SSLCommerz credentials')
  }

  return { storeId, storePassword }
}
