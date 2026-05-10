import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-04-22.dahlia',
})

export { stripe }

export const plans = {
  free: {
    name: 'Free',
    price: 0,
    scans: 5,
    features: ['7-tab audit', 'Basic scores', 'Tips library'],
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    price: 1999,
    scans: Infinity,
    features: [
      '100 audits per month',
      'Full 7-tab audit',
      'AI analysis',
      'PDF export',
      'Competitor comparison',
      'Backlink monitor',
      'Keyword tracking',
    ],
  },
  business: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS || process.env.STRIPE_PRICE_ID_AGENCY,
    price: 4999,
    scans: Infinity,
    features: [
      'Everything in Pro',
      'Unlimited SEO audits',
      'White-label reports',
      'API access',
      '5 team members',
      'Dedicated support',
    ],
  },
}

export async function createCheckoutSession(userId: string, planId: string) {
  if (planId !== 'pro' && planId !== 'business') {
    throw new Error('Invalid paid plan')
  }

  const plan = plans[planId]
  if (!plan.priceId) {
    throw new Error('Missing Stripe price ID')
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Would be fetched from user profile
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?canceled=true`,
    metadata: {
      userId,
      planId,
    },
  })

  return session
}

export async function getSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  })

  return subscriptions.data[0] || null
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return subscription
}
