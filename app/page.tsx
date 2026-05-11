'use client'

import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Globe2,
  HeartHandshake,
  Lightbulb,
  Moon,
  ShieldCheck,
  Sun,
  Target,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { LucideIcon } from 'lucide-react'

const donateUrl = 'https://wa.me/8801622839616?text=I%20want%20to%20donate%20to%20support%20MP%20SEO%20Auditor'

const features = [
  {
    icon: Zap,
    title: 'AI SEO summary',
    description: 'Clear recommendations for titles, descriptions, headings, content, links, and technical issues.',
  },
  {
    icon: BarChart3,
    title: 'PageSpeed insights',
    description: 'See SEO, performance, accessibility, Core Web Vitals, and developer opportunities in one place.',
  },
  {
    icon: Lightbulb,
    title: 'Practical tips',
    description: 'Learn what to fix first with simple SEO actions made for owners, marketers, and developers.',
  },
]

const stats = [
  { label: 'Audit areas', value: '7' },
  { label: 'SEO tips', value: '35+' },
  { label: 'Free audits', value: '5' },
]

const steps = [
  'Enter any website URL',
  'Review live SEO and speed signals',
  'Export, compare, and improve',
]

const trustItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Private', icon: ShieldCheck },
  { label: 'Fast', icon: Zap },
  { label: 'Actionable', icon: Target },
]

const bangladeshBrandChips = [
  { name: 'Pathao', mark: 'P', color: '#ef233c', accent: '#111827', subline: 'Here with you' },
  { name: 'Rokomari', mark: 'R', color: '#f59e0b', accent: '#111827', subline: '.com' },
  { name: 'bKash', mark: 'b', color: '#d4145a', accent: '#111827', subline: 'mobile finance' },
  { name: 'BRAC Bank', mark: 'B', color: '#0072bc', accent: '#f6a313', subline: 'asttha obichol' },
  { name: 'Nagad', mark: 'N', color: '#ef233c', accent: '#f97316', subline: 'digital finance' },
  { name: 'Robi', mark: 'R', color: '#e30613', accent: '#f59e0b', subline: 'telecom' },
  { name: 'Walton', mark: 'W', color: '#27348b', accent: '#ef233c', subline: 'electronics' },
  { name: 'Square', mark: 'S', color: '#22b14c', accent: '#ed1c24', subline: 'group' },
  { name: 'Ghorer Bazar', mark: 'GB', color: '#fb8c1f', accent: '#111827', subline: 'grocery' },
  { name: 'Nahal', mark: 'N', color: '#d41f2a', accent: '#b8872b', subline: 'food' },
  { name: 'Premium Fruits BD', mark: 'PF', color: '#f59e0b', accent: '#111827', subline: 'fresh fruits' },
  { name: 'Chaldal', mark: 'C', color: '#f4a261', accent: '#111827', subline: '.com' },
]

const pricingPlans: Array<{
  name: string
  description: string
  icon: LucideIcon
  monthlyPrice: string
  yearlyPrice: string
  regularYearlyPrice?: string
  badge: string
  highlighted: boolean
  features: string[]
}> = [
  {
    name: 'Free',
    description: 'Start auditing and learn what needs fixing first.',
    icon: ShieldCheck,
    monthlyPrice: '৳0',
    yearlyPrice: '৳0',
    badge: 'Starter',
    highlighted: false,
    features: [
      '5 site audits per month',
      'Basic 7-tab SEO audit',
      'SEO and performance scores',
      '10 recent scans in history',
      'Tips library access',
    ],
  },
  {
    name: 'Pro',
    description: 'For site owners and marketers improving SEO every month.',
    icon: Crown,
    monthlyPrice: '৳1,900',
    yearlyPrice: '৳18,240',
    regularYearlyPrice: '৳22,800',
    badge: 'Most popular',
    highlighted: true,
    features: [
      '100 site audits per month',
      'Full 7-tab deep audit report',
      'AI executive summary',
      'PDF export with branding',
      'Competitor comparison',
      'Backlink monitor',
      'Competitor comparison and backlink tools',
    ],
  },
  {
    name: 'Business',
    description: 'For teams, agencies, and businesses that audit often.',
    icon: BarChart3,
    monthlyPrice: '৳4,900',
    yearlyPrice: '৳47,040',
    regularYearlyPrice: '৳58,800',
    badge: 'Unlimited',
    highlighted: false,
    features: [
      'Unlimited SEO audits',
      'Unlimited keyword tracking',
      'White-label PDF reports',
      'API access',
      '5 team members',
      'Bulk URL scanning',
      'Dedicated support',
    ],
  },
]

function HeroAppPreview() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[520px] sm:h-[560px] lg:h-[620px]">
      <div className="absolute inset-x-8 bottom-5 top-16 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/15" />
      <div className="absolute right-4 top-8 h-32 w-32 rounded-full border border-blue-200 bg-white/60 blur-xl dark:border-blue-400/20 dark:bg-blue-400/10" />
      <div className="absolute bottom-16 left-2 h-24 w-24 rounded-full border border-violet-200 bg-violet-100/50 blur-xl dark:border-violet-400/20 dark:bg-violet-500/10" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 top-16 z-10 w-[48%] min-w-[190px] max-w-[240px] rotate-[-7deg] overflow-hidden rounded-[34px] border border-white/80 bg-white p-1.5 shadow-2xl shadow-blue-200/70 dark:border-white/15 dark:bg-white/10 dark:shadow-black/30"
      >
        <div className="overflow-hidden rounded-[28px] bg-slate-100">
          <img
            src="/mp-seo-audit-image2.png"
            alt="MP SEO Auditor light mode mobile audit screen"
            className="h-[430px] w-full object-cover object-top dark:hidden sm:h-[480px] lg:h-[530px]"
          />
          <img
            src="/mp-seo-audit-image2-dark.png"
            alt="MP SEO Auditor dark mode mobile audit screen"
            className="hidden h-[430px] w-full object-cover object-top dark:block sm:h-[480px] lg:h-[530px]"
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
        className="absolute right-0 top-0 z-20 w-[56%] min-w-[220px] max-w-[290px] rotate-[5deg] overflow-hidden rounded-[38px] border border-blue-200 bg-white p-2 shadow-2xl shadow-blue-200/80 dark:border-blue-400/25 dark:bg-white/10 dark:shadow-black/35"
      >
        <div className="overflow-hidden rounded-[30px] bg-slate-100">
          <img
            src="/mp-seo-audit-image1.png"
            alt="MP SEO Auditor light mode dashboard scan preview"
            className="h-[500px] w-full object-cover object-top dark:hidden sm:h-[545px] lg:h-[610px]"
          />
          <img
            src="/mp-seo-audit-image1-dark.png"
            alt="MP SEO Auditor dark mode dashboard scan preview"
            className="hidden h-[500px] w-full object-cover object-top dark:block sm:h-[545px] lg:h-[610px]"
          />
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-blue-200 bg-white/90 px-4 py-3 text-sm font-bold text-slate-900 shadow-xl shadow-blue-100/80 backdrop-blur dark:border-white/10 dark:bg-[#0d1727]/90 dark:text-white dark:shadow-black/25">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        Real app preview
      </div>
    </div>
  )
}

export default function Home() {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace('/dashboard')
        return
      }

      setCheckingAuth(false)
    }

    void checkSession()
  }, [router])

  const isDark = mounted && (theme === 'dark' || resolvedTheme === 'dark')

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(138,199,255,0.22),transparent_30%),linear-gradient(135deg,#f8fbff_0%,#f6f8fc_52%,#eef5ff_100%)] text-foreground dark:bg-[radial-gradient(circle_at_18%_8%,rgba(96,165,250,0.18),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(139,92,246,0.14),transparent_26%),linear-gradient(135deg,#08111f_0%,#0b1324_56%,#10172d_100%)]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl dark:bg-[#08111f]/82">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/mp-seo-logo.jpeg"
              alt="MP SEO Auditor logo"
              className="h-10 w-10 rounded-2xl object-cover ring-1 ring-border"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-black text-foreground">MP SEO Auditor</p>
              <p className="truncate text-xs text-muted-foreground">Mehedi Pathan</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle color theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a href={donateUrl} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
              <Button variant="outline" className="h-9 gap-2 bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                <HeartHandshake className="h-4 w-4" />
                Donate
              </Button>
            </a>
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" className="h-9 text-foreground hover:bg-accent hover:text-accent-foreground">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="h-9 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/85">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24">
        <section className="grid items-center gap-8 py-8 text-center lg:grid-cols-[0.92fr_1.08fr] lg:py-14 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl space-y-6 lg:mx-0"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Your Website&apos;s SEO, Solved.
            </div>

            <div>
              <h1 className="mx-auto max-w-3xl text-balance text-4xl font-black leading-[1.04] tracking-tight text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:mx-0">
                Scan any website and improve its <span className="text-blue-600 dark:text-blue-300">Google SEO</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl lg:mx-0">
                Stop Guessing. Start Ranking.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8 lg:mx-0">
                See what is holding your site back, what to fix first, and how to make every page easier for people and Google to understand.
              </p>
            </div>

            <div className="rounded-[26px] border border-blue-200 bg-white/90 p-3 shadow-xl shadow-blue-100/70 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/25">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-slate-500 dark:border-white/10 dark:bg-[#0d1727] dark:text-slate-400">
                  <Globe2 className="h-5 w-5 shrink-0" />
                  <span className="truncate">https://yourwebsite.com</span>
                </div>
                <Button asChild className="h-14 rounded-2xl bg-primary px-6 text-primary-foreground hover:bg-primary/85">
                  <Link href="/register">
                    Start Free Audit
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                {trustItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-2 py-2 text-xs font-bold text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 lg:mx-0">
              {stats.map(item => (
                <div key={item.label} className="rounded-2xl border border-border bg-white/70 p-4 shadow-sm dark:bg-white/[0.04]">
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-300">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <HeroAppPreview />
          </motion.div>
        </section>

        <section className="py-7">
          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white/70 px-4 py-5 shadow-xl shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                Bangladesh-built momentum
              </p>
              <p className="mt-2 text-balance text-lg font-black text-slate-950 dark:text-white">
                From development to deployment, our first 30 days served 500+ scans, while 50+ real client websites improved through our SEO work.
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                The brands below are public benchmark scans used for research and marketing. Reports were prepared for the relevant authority or contact where possible. They are not paid clients, partners, or endorsements.
              </p>
            </div>

            <div className="relative mt-5 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/90 to-transparent dark:from-[#0c1727]/90" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/90 to-transparent dark:from-[#0c1727]/90" />
              <div className="brand-marquee flex w-max items-center gap-3">
                {[...bangladeshBrandChips, ...bangladeshBrandChips].map((brand, index) => (
                  <div
                    key={`${brand.name}-${index}`}
                    className="flex h-16 w-48 shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.08]"
                  >
                    <span
                      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl text-sm font-black text-white shadow-inner"
                      style={{ backgroundColor: brand.color }}
                    >
                      <span
                        className="absolute -right-2 -top-2 h-7 w-7 rotate-45 rounded-md opacity-90"
                        style={{ backgroundColor: brand.accent }}
                      />
                      <span className="relative">{brand.mark}</span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-base font-black leading-tight"
                        style={{ color: brand.color }}
                      >
                        {brand.name}
                      </span>
                      <span
                        className="block truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: brand.accent }}
                      >
                        {brand.subline}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[26px] border border-border bg-white/80 p-5 shadow-xl shadow-slate-200/60 dark:bg-white/[0.045] dark:shadow-black/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </motion.div>
            )
          })}
        </section>

        <section className="grid gap-5 py-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-border bg-white/80 p-6 shadow-xl shadow-slate-200/60 dark:bg-white/[0.045] dark:shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Workflow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">From scan to fix in minutes.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              MP SEO Auditor turns crawling, PageSpeed data, and AI recommendations into an easy repair list.
            </p>
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-[22px] border border-border bg-white/80 p-4 shadow-sm dark:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {index + 1}
                </div>
                <p className="font-bold text-slate-950 dark:text-white">{step}</p>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
              </div>
            ))}
          </div>
        </section>

        <section className="py-8" id="pricing">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Pricing</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Choose the right audit power for your website.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start free, then upgrade when you need deeper reports, competitor comparison, exports, and more monthly scans.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Save 20% on yearly Pro and Business plans
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => {
              const Icon = plan.icon
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className={`relative flex min-h-full flex-col rounded-[28px] border p-5 shadow-xl ${
                    plan.highlighted
                      ? 'border-blue-300 bg-[linear-gradient(145deg,#ffffff_0%,#eef6ff_100%)] shadow-blue-100/80 dark:border-blue-400/35 dark:bg-[linear-gradient(145deg,rgba(37,99,235,0.18)_0%,rgba(15,23,42,0.76)_100%)] dark:shadow-black/25'
                      : 'border-border bg-white/80 shadow-slate-200/60 dark:bg-white/[0.045] dark:shadow-black/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white dark:bg-blue-300 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">{plan.name}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/80 bg-white/70 p-4 dark:bg-black/10">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{plan.monthlyPrice}</span>
                      <span className="pb-1 text-sm font-semibold text-muted-foreground">/month</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{plan.yearlyPrice}/year</span>
                      {plan.regularYearlyPrice && (
                        <>
                          <span className="text-muted-foreground line-through">{plan.regularYearlyPrice}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                            20% off
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="mt-5 flex-1 space-y-3">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex gap-3 text-sm leading-5 text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`mt-6 h-12 rounded-2xl ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/85'
                        : 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                    }`}
                  >
                    <Link href="/register">
                      {plan.name === 'Free' ? 'Start Free' : `Choose ${plan.name}`}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-white/70 px-4 py-3 text-center text-sm text-muted-foreground dark:bg-white/[0.04]">
            Manual bKash and Nagad upgrade requests are available after signup. Business users get unlimited audits for active subscriptions.
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-[30px] border border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_100%)] p-6 text-center shadow-2xl shadow-blue-100/70 dark:border-blue-400/20 dark:bg-[linear-gradient(135deg,#0d1727_0%,#10172d_100%)] dark:shadow-black/25 md:p-10">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Ready to improve your website?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Start with a free audit, then use clear fixes to improve rankings, user experience, and conversions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/85">
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                <a href={donateUrl} target="_blank" rel="noreferrer">
                  <HeartHandshake className="h-4 w-4" />
                  Donate to Improve the App
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted-foreground">
          Developed by{' '}
          <a
            href="https://mehedipathan.online"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Mehedi Pathan
          </a>
        </div>
      </footer>
    </div>
  )
}
