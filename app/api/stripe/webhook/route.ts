import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[webhook] Error verifying signature:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const planId =
          subscription.metadata?.planId ||
          (subscription.items.data[0]?.price.metadata?.planId || 'pro')

        const userId = subscription.metadata?.userId

        if (userId) {
          await supabaseAdmin.from('profiles').update({ plan: planId, stripe_subscription_id: subscription.id }).eq('id', userId)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', userId)
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        // Log successful payment
        console.log('[webhook] Invoice paid:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.error('[webhook] Invoice payment failed:', invoice.id)
        break
      }

      default:
        console.log('[webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[webhook] Error processing event:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
