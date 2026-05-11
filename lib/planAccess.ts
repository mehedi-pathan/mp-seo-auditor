import type { Plan } from '@/types'

export type BillingInterval = 'monthly' | 'yearly'

export interface PlanEntitlements {
  plan: Plan
  auditLimit: number | null
  canViewFullReport: boolean
  canExportPdf: boolean
  canCompare: boolean
  canUseTrends: boolean
  canUseBacklinks: boolean
}

const entitlements: Record<Plan, PlanEntitlements> = {
  free: {
    plan: 'free',
    auditLimit: 5,
    canViewFullReport: false,
    canExportPdf: false,
    canCompare: false,
    canUseTrends: false,
    canUseBacklinks: false,
  },
  pro: {
    plan: 'pro',
    auditLimit: 100,
    canViewFullReport: true,
    canExportPdf: true,
    canCompare: true,
    canUseTrends: true,
    canUseBacklinks: true,
  },
  business: {
    plan: 'business',
    auditLimit: null,
    canViewFullReport: true,
    canExportPdf: true,
    canCompare: true,
    canUseTrends: true,
    canUseBacklinks: true,
  },
  agency: {
    plan: 'agency',
    auditLimit: null,
    canViewFullReport: true,
    canExportPdf: true,
    canCompare: true,
    canUseTrends: true,
    canUseBacklinks: true,
  },
}

export const getPlanEntitlements = (plan?: Plan | string | null) => {
  if (plan === 'pro' || plan === 'business' || plan === 'agency') return entitlements[plan]
  return entitlements.free
}

export const isPlanExpired = (expiresAt?: string | null) => {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}

export const getEffectivePlan = (plan?: Plan | string | null, expiresAt?: string | null): Plan => {
  if (isPlanExpired(expiresAt)) return 'free'
  if (plan === 'pro' || plan === 'business' || plan === 'agency') return plan
  return 'free'
}

export const getSubscriptionWindow = (interval: BillingInterval, start = new Date()) => {
  const end = new Date(start)

  if (interval === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }

  return {
    startedAt: start.toISOString(),
    expiresAt: end.toISOString(),
  }
}
