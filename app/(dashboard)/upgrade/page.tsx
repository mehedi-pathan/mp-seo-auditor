'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Copy, Gift, Loader2, Smartphone, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { BillingInterval, Plan } from '@/types'
import { getPlanDisplay } from '@/lib/planDisplay'

const paymentNumber = '+8801622839616'
const yearlyDiscountPercent = 20
const planRank: Record<Plan, number> = {
  free: 0,
  pro: 1,
  business: 2,
  agency: 2,
}

interface UpgradePlan {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: Array<{ text: string; included: boolean }>
  cta: string
  planId: Plan
  highlighted: boolean
}

const plans: UpgradePlan[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: [
      { text: '5 site audits per month', included: true },
      { text: '7-tab basic audit', included: true },
      { text: 'SEO + Performance scores', included: true },
      { text: 'Scan history (10 recent)', included: true },
      { text: 'Tips library', included: true },
      { text: 'CSV export', included: false },
      { text: 'Competitor comparison', included: false },
      { text: 'Backlink monitor', included: false },
      { text: 'Trend dashboard', included: false },
    ],
    cta: 'Current Plan',
    planId: 'free',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 1900,
    yearlyPrice: 18240,
    description: 'For serious SEO work',
    features: [
      { text: '100 site audits per month', included: true },
      { text: 'Full 7-tab deep audit', included: true },
      { text: 'AI executive summary', included: true },
      { text: 'Spreadsheet CSV export', included: true },
      { text: 'Competitor comparison', included: true },
      { text: 'Backlink monitor', included: true },
      { text: 'Full trend dashboard', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'Upgrade to Pro',
    planId: 'pro',
    highlighted: true,
  },
  {
    name: 'Business',
    monthlyPrice: 4900,
    yearlyPrice: 47040,
    description: 'For businesses that audit often',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited SEO audits', included: true },
      { text: 'Unlimited domain tracking', included: true },
      { text: 'Business diagnostics', included: true },
      { text: 'API access', included: true },
      { text: '5 team members', included: true },
      { text: 'Bulk URL scanning', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    cta: 'Upgrade to Business',
    planId: 'business',
    highlighted: false,
  },
]

const formatPrice = (amount: number) => `৳${amount.toLocaleString('en-US')}`

const formatPlanPrice = (plan: UpgradePlan, interval: BillingInterval) => {
  const amount = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  return formatPrice(amount)
}

const formatRegularYearlyPrice = (plan: UpgradePlan) => formatPrice(plan.monthlyPrice * 12)

const formatDate = (value: string | null) => {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function UpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash')
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [currentBillingInterval, setCurrentBillingInterval] = useState<BillingInterval | null>(null)
  const [planStartedAt, setPlanStartedAt] = useState<string | null>(null)
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    const loadCurrentPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('plan,billing_interval,plan_started_at,plan_expires_at')
        .eq('id', user.id)
        .single()

      if (error) {
        const fallback = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        setCurrentPlan((fallback.data?.plan || 'free') as Plan)
        return
      }

      setCurrentPlan((data?.plan || 'free') as Plan)
      setCurrentBillingInterval((data?.billing_interval || null) as BillingInterval | null)
      setPlanStartedAt(data?.plan_started_at || null)
      setPlanExpiresAt(data?.plan_expires_at || null)
    }

    void loadCurrentPlan()
  }, [])

  const copyPaymentNumber = async () => {
    await navigator.clipboard.writeText(paymentNumber)
    toast.success('Payment number copied')
  }

  const openManualPayment = (plan: (typeof plans)[number]) => {
    if (plan.planId === 'free') return
    if (planRank[plan.planId] <= planRank[currentPlan]) return
    setSelectedPlan(plan)
    setSenderNumber('')
    setTransactionId('')
  }

  const submitManualPayment = async () => {
    if (!selectedPlan || selectedPlan.planId === 'free') return

    setLoadingPlan(selectedPlan.planId)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Please sign in before upgrading.')
        return
      }

      const response = await fetch('/api/payment/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.planId,
          method: paymentMethod,
          senderNumber,
          transactionId,
          billingInterval,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not submit payment')
      }

      toast.success('Payment submitted. Your plan will update after verification.')
      setSelectedPlan(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment submission failed')
    } finally {
      setLoadingPlan(null)
    }
  }

  const redeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter your coupon code')
      return
    }

    setIsRedeemingCoupon(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Please sign in before redeeming a coupon.')
        return
      }

      const response = await fetch('/api/coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = (await response.json()) as {
        plan?: Plan
        billingInterval?: BillingInterval
        planStartedAt?: string
        planExpiresAt?: string
        error?: string
        message?: string
      }

      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Coupon could not be redeemed')
      }

      toast.success(data.message || `${data.plan === 'pro' ? 'Pro' : 'Business'} plan unlocked`)
      setCurrentPlan(data.plan)
      setCurrentBillingInterval(data.billingInterval || 'yearly')
      setPlanStartedAt(data.planStartedAt || new Date().toISOString())
      setPlanExpiresAt(data.planExpiresAt || null)
      setCouponCode('')
      window.dispatchEvent(new CustomEvent('plan-updated', { detail: { plan: data.plan, planExpiresAt: data.planExpiresAt || null } }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Coupon could not be redeemed')
    } finally {
      setIsRedeemingCoupon(false)
    }
  }

  const manualPaymentCard = selectedPlan && (
    <Card className="space-y-4 border-primary/40 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Manual payment for {selectedPlan.name}</h2>
          <p className="text-sm text-muted-foreground">
            Send {formatPlanPrice(selectedPlan, billingInterval)} for the {billingInterval} package by bKash or Nagad, then submit your transaction ID.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">Payment number</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-semibold">{paymentNumber}</p>
          <Button variant="outline" size="sm" onClick={copyPaymentNumber}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={paymentMethod === 'bkash' ? 'default' : 'outline'}
          onClick={() => setPaymentMethod('bkash')}
        >
          bKash
        </Button>
        <Button
          variant={paymentMethod === 'nagad' ? 'default' : 'outline'}
          onClick={() => setPaymentMethod('nagad')}
        >
          Nagad
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Your sender number</label>
          <Input
            value={senderNumber}
            onChange={(event) => setSenderNumber(event.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="tel"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Transaction ID</label>
          <Input
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            placeholder="Enter bKash/Nagad TrxID"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setSelectedPlan(null)}>
          Cancel
        </Button>
        <Button
          onClick={submitManualPayment}
          disabled={loadingPlan === selectedPlan.planId || !senderNumber || !transactionId}
        >
          Submit
        </Button>
      </div>
    </Card>
  )
  const currentPlanDisplay = getPlanDisplay(currentPlan)
  const CurrentPlanIcon = currentPlanDisplay.icon
  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'business' || currentPlan === 'agency'
  const isPlanUnavailable = (plan: UpgradePlan) => planRank[plan.planId] <= planRank[currentPlan]
  const getPlanButtonLabel = (plan: UpgradePlan) => {
    if (plan.planId === currentPlan) return 'Current Package'
    if (isPlanUnavailable(plan)) return currentPlan === 'business' || currentPlan === 'agency' ? 'Included in Business' : 'Already Included'
    if (loadingPlan === plan.planId) return 'Submitting...'
    return plan.cta
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Pricing Plans</h1>
        <p className="text-muted-foreground">Choose the right plan for your needs</p>
      </div>

      <Card className={`p-4 ${currentPlanDisplay.cardClass}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${currentPlanDisplay.badgeClass}`}>
            <CurrentPlanIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your current package</p>
            <h2 className="text-lg font-bold">{currentPlanDisplay.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{currentPlanDisplay.description}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Billing</p>
            <p className="mt-1 font-semibold capitalize">{currentBillingInterval || (currentPlan === 'free' ? 'Free' : 'Active')}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Renews / ends</p>
            <p className="mt-1 font-semibold">{formatDate(planExpiresAt)}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Package started</p>
            <p className="mt-1 font-semibold">{formatDate(planStartedAt)}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="font-semibold">Choose subscription length</h2>
          <p className="text-sm text-muted-foreground">Monthly is flexible. Yearly saves {yearlyDiscountPercent}% on Pro and Business.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          <Button
            type="button"
            variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </Button>
          <Button
            type="button"
            variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly
          </Button>
        </div>
      </Card>

      {!isPaidPlan && (
        <Card className="space-y-3 border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Have a Pro or Business coupon?</h2>
              <p className="text-sm text-muted-foreground">
                Redeem a valid coupon to unlock Pro or Business without manual payment. Coupon codes are not case sensitive.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Input
              value={couponCode}
              onChange={event => setCouponCode(event.target.value)}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
            />
            <Button onClick={redeemCoupon} disabled={isRedeemingCoupon || !couponCode.trim()} className="w-full">
              {isRedeemingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              Redeem Coupon
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.name} className="space-y-4">
            <Card
              className={`p-6 relative ${plan.planId === currentPlan ? 'border-amber-300 ring-2 ring-amber-200' : plan.highlighted ? 'border-primary border-2 ring-1 ring-primary/20' : ''}`}
            >
              {plan.planId === currentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${currentPlanDisplay.badgeClass}`}>
                    Current Package
                  </div>
                </div>
              )}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className={plan.highlighted ? 'mt-4' : ''}>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{formatPlanPrice(plan, billingInterval)}</span>
                  <span className="text-muted-foreground">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                  {billingInterval === 'yearly' && plan.planId !== 'free' && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground line-through">{formatRegularYearlyPrice(plan)}</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                        Save {yearlyDiscountPercent}% yearly
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <Button
                  className="w-full mb-6"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  disabled={isPlanUnavailable(plan) || loadingPlan === plan.planId}
                  onClick={() => openManualPayment(plan)}
                >
                  {getPlanButtonLabel(plan)}
                </Button>

                {selectedPlan?.planId === plan.planId && (
                  <div className="mb-6">
                    {manualPaymentCard}
                  </div>
                )}

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${feature.included ? 'text-green-600' : 'text-gray-300'}`}
                      />
                      <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <Card className="p-6 bg-muted">
        <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">Can I cancel anytime?</p>
            <p className="text-muted-foreground">Yes, cancel your subscription anytime without penalties.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Is there a free trial?</p>
            <p className="text-muted-foreground">Start with our Free plan - no credit card required.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Do you offer discounts?</p>
            <p className="text-muted-foreground">Contact us for annual billing discounts on Pro and Business plans.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
