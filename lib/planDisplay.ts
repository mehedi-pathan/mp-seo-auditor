import { Gem, ShieldCheck, Sparkles } from 'lucide-react'
import type { Plan } from '@/types'

export const planDisplay = {
  free: {
    label: 'Free',
    title: 'Free package user',
    description: '5 audits per month with essential SEO checks.',
    icon: ShieldCheck,
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
    cardClass: 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/25',
  },
  pro: {
    label: 'Pro',
    title: 'Pro package user',
    description: '100 audits per month with PDF reports, trends, competitor comparison, and backlink tools.',
    icon: Sparkles,
    badgeClass: 'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
    cardClass: 'border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/25',
  },
  business: {
    label: 'Business',
    title: 'Business package user',
    description: 'Unlimited audits with premium SEO reporting, priority workflows, and business tools.',
    icon: Gem,
    badgeClass: 'border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-amber-900 shadow-sm shadow-amber-900/10 dark:border-amber-700 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-950 dark:text-amber-100',
    cardClass: 'border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:border-amber-800 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-amber-950/50',
  },
  agency: {
    label: 'Business',
    title: 'Business package user',
    description: 'Unlimited audits with premium SEO reporting, priority workflows, and business tools.',
    icon: Gem,
    badgeClass: 'border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-amber-900 shadow-sm shadow-amber-900/10 dark:border-amber-700 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-950 dark:text-amber-100',
    cardClass: 'border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:border-amber-800 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-amber-950/50',
  },
} satisfies Record<Plan, {
  label: string
  title: string
  description: string
  icon: typeof ShieldCheck
  badgeClass: string
  cardClass: string
}>

export const getPlanDisplay = (plan?: Plan | null) => planDisplay[plan || 'free'] || planDisplay.free
