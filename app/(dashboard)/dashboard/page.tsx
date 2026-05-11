'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  Globe2,
  HeartHandshake,
  Lightbulb,
  Link2,
  Search,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuditStore } from '@/store/useAuditStore'
import { startClientScanJob } from '@/lib/clientScanManager'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'
import { supabase } from '@/lib/supabase/client'
import { TechnicalSeoLab } from '@/components/seo/TechnicalSeoLab'

const donateUrl = 'https://wa.me/8801622839616?text=I%20want%20to%20donate%20to%20support%20MP%20SEO%20Auditor'
const animatedPlaceholders = ['https://yourwebsite.com', 'mehedipathan.online', 'serverbd.net', 'shop.example.com']

const scoreClass = (score: number) => {
  if (score >= 90) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
  if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200'
}

const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.max(1, Math.round(diff / 36e5))
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

const MiniTrend = ({ color = 'blue' }: { color?: 'blue' | 'green' | 'violet' | 'orange' }) => {
  const stroke = {
    blue: '#2f80ed',
    green: '#22c55e',
    violet: '#8b5cf6',
    orange: '#f97316',
  }[color]

  return (
    <svg viewBox="0 0 96 32" className="h-7 w-20" aria-hidden="true">
      <path d="M4 24 C16 14 20 19 30 14 C42 8 45 18 55 15 C68 11 68 4 82 5 C88 5 91 2 92 1" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <circle cx="92" cy="1" r="3" fill={stroke} />
    </svg>
  )
}

const ScanIllustration = () => (
  <div className="relative hidden h-32 w-36 shrink-0 sm:block" aria-hidden="true">
    <div className="absolute right-1 top-1 h-24 w-28 rounded-2xl border border-blue-200 bg-white/85 shadow-xl shadow-blue-200/50 dark:border-white/10 dark:bg-white/10 dark:shadow-black/20">
      <div className="flex gap-1 rounded-t-2xl border-b border-blue-100 bg-blue-400/80 px-3 py-2 dark:border-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
      </div>
      <div className="space-y-2 p-3">
        <span className="block h-2 w-12 rounded-full bg-slate-200 dark:bg-white/20" />
        <span className="block h-2 w-9 rounded-full bg-slate-200 dark:bg-white/20" />
        <svg viewBox="0 0 90 36" className="mt-1 h-8 w-full">
          <path d="M4 28 L18 22 L30 24 L43 13 L57 17 L72 8 L86 6" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
    <div className="absolute bottom-0 right-0 flex h-16 w-16 items-center justify-center rounded-full border-[10px] border-blue-500/90 bg-white/30 shadow-lg shadow-blue-300/40 dark:bg-blue-950/20">
      <div className="h-8 w-8 rounded-full border border-blue-200 bg-white/50 dark:border-white/10 dark:bg-white/10" />
    </div>
    <span className="absolute bottom-2 right-0 h-8 w-3 rotate-[-42deg] rounded-full bg-blue-500 shadow-md" />
    <span className="absolute left-2 top-9 h-2 w-2 rounded-full bg-blue-300" />
    <span className="absolute left-7 top-20 h-3 w-3 rounded-full bg-blue-200" />
  </div>
)

const DesktopHeaderAnimation = () => (
  <div className="relative hidden h-36 w-80 shrink-0 overflow-visible xl:block" aria-hidden="true">
    <motion.div
      className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_42%_45%,rgba(125,190,255,0.32),transparent_45%)] blur-xl"
      animate={{ opacity: [0.68, 1, 0.68] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute left-6 top-6 h-24 w-24 rounded-full border-[12px] border-blue-400/85 bg-blue-50/40 shadow-2xl shadow-blue-200/70 dark:bg-blue-500/10 dark:shadow-black/20"
      animate={{ x: [0, 158, 94, 0], y: [0, 8, 46, 0], rotate: [0, 8, -6, 0] }}
      transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="absolute -bottom-6 -right-4 h-11 w-4 -rotate-45 rounded-full bg-blue-500 shadow-lg shadow-blue-300/50" />
      <span className="absolute inset-4 rounded-full border border-blue-200 bg-white/45 dark:border-white/10 dark:bg-white/10" />
    </motion.div>
    <motion.div
      className="absolute right-6 top-7 h-20 w-32 rounded-3xl border border-blue-200 bg-white/80 p-4 shadow-xl shadow-blue-100/70 dark:border-white/10 dark:bg-[#0d1727]/80"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="block h-2 w-12 rounded-full bg-slate-200 dark:bg-white/20" />
      <span className="mt-2 block h-2 w-16 rounded-full bg-blue-200 dark:bg-blue-400/25" />
      <span className="mt-2 block h-2 w-9 rounded-full bg-emerald-200 dark:bg-emerald-400/25" />
    </motion.div>
    <motion.span
      className="absolute bottom-7 left-11 h-2.5 w-2.5 rounded-full bg-emerald-400"
      animate={{ scale: [1, 1.55, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.span
      className="absolute right-9 top-4 h-2 w-2 rounded-full bg-violet-400"
      animate={{ y: [0, 14, 0], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div className="absolute bottom-4 left-8 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
      Live site scan
    </div>
  </div>
)

const desktopTips = [
  {
    title: 'Rewrite unclear title tags',
    detail: 'Make every important page title specific, benefit-led, and keyword-aware.',
    tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-400/20',
  },
  {
    title: 'Fix slow mobile pages first',
    detail: 'Prioritize LCP, unused CSS, compressed images, and lighter above-fold scripts.',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/20',
  },
  {
    title: 'Add buyer-focused FAQs',
    detail: 'Answer delivery, price, warranty, comparison, and trust questions before users leave.',
    tone: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:border-violet-400/20',
  },
]

export default function DashboardPage() {
  const { audits, isLoading, loadAudits, invalidate } = useAuditStore()
  const [auditUrl, setAuditUrl] = useState('')
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('')
  const router = useRouter()

  useEffect(() => {
    void loadAudits()

    const handleAuditCompleted = () => {
      invalidate()
      void loadAudits(true)
    }

    window.addEventListener('audit-completed', handleAuditCompleted)
    return () => window.removeEventListener('audit-completed', handleAuditCompleted)
  }, [invalidate, loadAudits])

  useEffect(() => {
    let phraseIndex = 0
    let charIndex = 0
    let deleting = false
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      const currentPhrase = animatedPlaceholders[phraseIndex]

      if (deleting) {
        charIndex -= 1
      } else {
        charIndex += 1
      }

      setAnimatedPlaceholder(currentPhrase.slice(0, Math.max(0, charIndex)))

      if (!deleting && charIndex === currentPhrase.length) {
        deleting = true
        timeoutId = setTimeout(tick, 1200)
        return
      }

      if (deleting && charIndex === 0) {
        deleting = false
        phraseIndex = (phraseIndex + 1) % animatedPlaceholders.length
      }

      timeoutId = setTimeout(tick, deleting ? 34 : 72)
    }

    timeoutId = setTimeout(tick, 300)
    return () => clearTimeout(timeoutId)
  }, [])

  const stats = useMemo(() => {
    const total = audits.length
    const scoreSum = audits.reduce((sum, audit) => sum + audit.seo_score, 0)
    const avgSeo = total ? Math.round(scoreSum / total) : null
    const bestScore = total ? Math.max(...audits.map(audit => audit.seo_score)) : null
    const domains = new Set(audits.map(audit => audit.domain)).size

    return { total, avgSeo, bestScore, domains }
  }, [audits])

  const recentAudits = audits.slice(0, 4)

  const startAuditFromDashboard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedUrl = auditUrl.trim()
    if (!trimmedUrl) {
      router.push('/scan')
      return
    }

    const normalizedUrl = normalizeWebsiteUrl(trimmedUrl)
    const { data: { user } } = await supabase.auth.getUser()
    startClientScanJob(normalizedUrl, user?.id)
    router.push('/scan')
  }

  const statCards = [
    { label: 'Total Scans', value: stats.total, icon: Activity, color: 'blue' as const, iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
    { label: 'Avg SEO Score', value: stats.avgSeo ?? '-', icon: Star, color: 'green' as const, iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { label: 'Best Score', value: stats.bestScore ?? '-', icon: Trophy, color: 'violet' as const, iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
    { label: 'Domains Tracked', value: stats.domains, icon: Globe2, color: 'orange' as const, iconClass: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  ]

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 p-4 pb-24 lg:hidden"
    >
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_62%,#eef6ff_100%)] p-4 shadow-xl shadow-blue-100/60 dark:border-blue-400/20 dark:bg-[radial-gradient(circle_at_78%_4%,rgba(96,165,250,0.2),transparent_30%),linear-gradient(135deg,#0b1626_0%,#10172d_70%,#08111f_100%)] dark:shadow-black/20"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-balance text-3xl font-black leading-[1.05] tracking-tight text-slate-950 dark:text-white">
                Scan <span className="text-blue-600 dark:text-blue-300">any website</span>
              </h1>
              <p className="mt-2 max-w-[20rem] text-sm leading-6 text-slate-600 dark:text-slate-300">
                Get a complete SEO audit and actionable insights in seconds.
              </p>
            </div>
            <ScanIllustration />
          </div>

          <form onSubmit={startAuditFromDashboard} className="rounded-[24px] border border-blue-200 bg-white/90 p-4 shadow-xl shadow-blue-100/70 backdrop-blur dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/10">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              Enter website URL
            </div>

            <div className="mt-3 grid gap-3">
              <div className="relative min-w-0">
                <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={auditUrl}
                  onChange={event => setAuditUrl(event.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="h-14 rounded-2xl border-blue-100 bg-white pl-12 pr-4 text-base shadow-inner shadow-slate-100 focus-visible:ring-blue-400 dark:border-white/10 dark:bg-[#0d1727] dark:text-white dark:shadow-black/10"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 rounded-2xl px-7 text-base shadow-lg shadow-blue-200/70 dark:shadow-blue-950/20">
                Scan Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
              {[
                { label: 'Secure', text: 'Private data', icon: ShieldCheck, color: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/15' },
                { label: 'Fast', text: 'Live progress', icon: Zap, color: 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/15' },
                { label: 'Accurate', text: 'AI insights', icon: Target, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="min-w-0 text-center">
                    <div className={`mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-2 truncate text-xs font-bold leading-tight text-slate-950 dark:text-white">{item.label}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Try your homepage, product page, or competitor URL.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="overflow-hidden rounded-[22px] border-slate-200 bg-white p-4 shadow-md shadow-slate-200/60 dark:border-white/10 dark:bg-[#0d1727] dark:shadow-black/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {isLoading ? '...' : card.value}
                  </p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex justify-end opacity-80">
                <MiniTrend color={card.color} />
              </div>
            </Card>
          )
        })}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <Card className="rounded-[24px] border-blue-200 bg-blue-50/70 p-4 shadow-lg shadow-blue-100/60 dark:border-blue-400/20 dark:bg-blue-500/10 dark:shadow-black/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-950 dark:text-white">{stats.total > 0 ? 'Review your SEO history' : 'Run Your First Audit'}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stats.total > 0 ? 'Track domains and score changes' : 'Analyze any website in seconds'}</p>
              </div>
            </div>
            <Button asChild className="h-12 shrink-0 rounded-xl px-4">
              <Link href={stats.total > 0 ? '/history' : '/scan'}>
                {stats.total > 0 ? 'History' : 'Scan Now'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-[24px] border-emerald-200 bg-emerald-50/70 p-4 shadow-lg shadow-emerald-100/50 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:shadow-black/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-950 dark:text-white">Support better UX</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                  Donate to help improve scans, reports, and developer tools.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-12 shrink-0 rounded-xl bg-white px-4 text-emerald-700 hover:text-emerald-800 dark:bg-background dark:text-emerald-200">
              <a href={donateUrl} target="_blank" rel="noreferrer">
                <HeartHandshake className="h-4 w-4" />
                Donate
              </a>
            </Button>
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
            <TrendingUp className="h-5 w-5" />
            Recent Scans
          </h2>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Card className="overflow-hidden rounded-[24px] border-slate-200 bg-white p-0 shadow-lg shadow-slate-200/70 dark:border-white/10 dark:bg-[#0d1727] dark:shadow-black/20">
          {isLoading && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading your saved scans...
            </div>
          )}

          {!isLoading && recentAudits.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No scans yet. Start your first audit!
            </div>
          )}

          {!isLoading && recentAudits.map((audit, index) => (
            <div key={audit.id} className={`flex items-center justify-between gap-3 p-4 ${index > 0 ? 'border-t border-slate-100 dark:border-white/10' : ''}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Globe2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950 dark:text-white">{audit.domain}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{audit.url}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge className={scoreClass(audit.seo_score)}>{audit.seo_score}</Badge>
                <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {timeAgo(audit.created_at)}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <Button variant="outline" className="h-14 w-full justify-start gap-2 rounded-2xl bg-card" disabled>
          <Target className="h-4 w-4" />
          <span className="min-w-0 flex-1 text-left">Competitor</span>
          <Badge variant="outline" className="text-[10px]">Soon</Badge>
        </Button>
        <Link href="/backlinks">
          <Button variant="outline" className="h-14 w-full justify-start gap-2 rounded-2xl bg-card">
            <Link2 className="h-4 w-4" />
            Backlinks
          </Button>
        </Link>
        <Link href="/history">
          <Button variant="outline" className="h-14 w-full justify-start gap-2 rounded-2xl bg-card">
            <Search className="h-4 w-4" />
            Search Audits
          </Button>
        </Link>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <TechnicalSeoLab compact />
      </motion.section>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden min-h-full bg-[radial-gradient(circle_at_0%_0%,rgba(138,199,255,0.32),transparent_30%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_48%,#edf7ff_100%)] p-8 lg:block xl:p-10 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(96,165,250,0.16),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)]"
    >
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              SEO command center
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 xl:text-5xl dark:text-white">
              Scan, track, and improve your SEO.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Review scores, recent searches, and growth tips in one clean workspace.
            </p>
          </div>
          <DesktopHeaderAnimation />
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(680px,1.55fr)_minmax(320px,0.65fr)]">
          <Card className="overflow-hidden rounded-[34px] border-blue-200 bg-white/90 p-6 shadow-2xl shadow-blue-100/70 backdrop-blur dark:border-blue-400/20 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="grid items-center gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                  <Search className="h-3.5 w-3.5" />
                  Start a full website audit
                </div>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  Search any URL and get a clear SEO action plan.
                </h2>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  Scan speed, accessibility, headings, metadata, links, content quality, and developer fixes without leaving the dashboard.
                </p>
                <form onSubmit={startAuditFromDashboard} className="mt-6 rounded-[30px] border border-blue-200 bg-[#f8fbff] p-5 shadow-xl shadow-blue-100/40 dark:border-white/10 dark:bg-[#0d1727] dark:shadow-black/10">
                  <label htmlFor="desktop-audit-url" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    Website URL
                  </label>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="desktop-audit-url"
                        value={auditUrl}
                        onChange={event => setAuditUrl(event.target.value)}
                        placeholder={animatedPlaceholder || 'https://yourwebsite.com'}
                        className="h-16 rounded-[22px] border-blue-100 bg-white pl-14 text-lg shadow-inner shadow-slate-100 focus-visible:ring-blue-400 dark:border-white/10 dark:bg-[#08111f] dark:shadow-black/10"
                      />
                    </div>
                    <Button type="submit" size="lg" className="h-16 rounded-[22px] px-8 text-base font-black shadow-lg shadow-blue-200/70 dark:shadow-blue-950/20">
                      Scan Now
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-blue-100 pt-4 sm:grid-cols-3 dark:border-white/10">
                    {[
                      { label: 'Private', text: 'User data is safe', icon: ShieldCheck },
                      { label: 'Live', text: 'Scan progress', icon: Zap },
                      { label: 'Actionable', text: 'Developer fixes', icon: Target },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 dark:bg-white/[0.04]">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-slate-950 dark:text-white">{item.label}</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">{item.text}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </form>

                <div className="mt-6 rounded-[28px] border border-blue-100 bg-white/72 p-4 shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                        Recent searches
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                        Domains you are tracking
                      </h3>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-full bg-white dark:bg-[#0d1727]">
                      <Link href="/history">
                        View history
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {recentAudits.length > 0 ? recentAudits.slice(0, 4).map(audit => (
                      <Link
                        key={audit.id}
                        href={`/scan?url=${encodeURIComponent(audit.url)}`}
                        className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-blue-50 bg-[#f8fbff] p-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-[#0d1727] dark:hover:bg-white/[0.06]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                            <Globe2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{audit.domain}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{audit.url}</p>
                          </div>
                        </div>
                        <Badge className={`${scoreClass(audit.seo_score)} shrink-0`}>{audit.seo_score}</Badge>
                      </Link>
                    )) : (
                      <div className="md:col-span-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-center dark:border-blue-400/20 dark:bg-blue-500/10">
                        <p className="font-bold text-slate-950 dark:text-white">No recent searches yet</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Start with your homepage, product page, or competitor URL.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid content-start gap-5">
            <Card className="rounded-[30px] border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">SEO health overview</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {stats.total > 0 ? 'Real audit data' : 'Ready for first scan'}
                  </h2>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {statCards.map(card => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className="rounded-3xl border border-slate-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{card.label}</p>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${card.iconClass}`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{isLoading ? '...' : card.value}</p>
                      <div className="mt-2 flex justify-end">
                        <MiniTrend color={card.color} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="rounded-[30px] border-emerald-100 bg-emerald-50/80 p-5 shadow-xl shadow-emerald-100/50 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:shadow-black/20">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm dark:bg-white/10 dark:text-emerald-200">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white">Support better UX</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Donate to improve scans, reports, and developer tools.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-2xl bg-white font-bold text-emerald-700 hover:text-emerald-800 dark:bg-[#0d1727] dark:text-emerald-200">
                <a href={donateUrl} target="_blank" rel="noreferrer">
                  <HeartHandshake className="h-4 w-4" />
                  Donate
                </a>
              </Button>
            </Card>
          </div>
        </section>

        <TechnicalSeoLab />

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[30px] border-blue-100 bg-white/90 p-0 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="flex items-center justify-between border-b border-blue-50 p-5 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Latest activity</p>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Recent Scans</h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl bg-white dark:bg-[#0d1727]">
                <Link href="/history">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {isLoading && <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading your saved scans...</div>}
            {!isLoading && recentAudits.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No scans yet. Start with a homepage, product page, or competitor URL.
              </div>
            )}
            {!isLoading && recentAudits.map((audit, index) => (
              <Link
                key={audit.id}
                href={`/scan?url=${encodeURIComponent(audit.url)}`}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 p-5 transition-colors hover:bg-blue-50/70 dark:hover:bg-white/[0.04] ${index > 0 ? 'border-t border-blue-50 dark:border-white/10' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-950 dark:text-white">{audit.domain}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{audit.url}</p>
                  </div>
                </div>
                <Badge className={scoreClass(audit.seo_score)}>{audit.seo_score} SEO</Badge>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{timeAgo(audit.created_at)}</p>
              </Link>
            ))}
          </Card>

          <Card className="rounded-[30px] border-blue-100 bg-white/90 p-5 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Growth guide</p>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">Tips Library</h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl bg-white dark:bg-[#0d1727]">
                <Link href="/tips">
                  Open tips
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {desktopTips.map(tip => (
                <div key={tip.title} className={`rounded-3xl border p-4 ${tip.tone}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 dark:bg-white/10">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black">{tip.title}</h3>
                      <p className="mt-1 text-sm leading-6 opacity-80">{tip.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {[
            { label: 'Backlink check', text: 'Review link opportunities and trust signals.', href: '/backlinks', icon: Link2 },
            { label: 'Trend tracking', text: 'Watch domains improve over time.', href: '/trends', icon: TrendingUp },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} prefetch className="rounded-[28px] border border-blue-100 bg-white/80 p-5 shadow-lg shadow-blue-100/40 transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
              </Link>
            )
          })}
        </section>
      </div>
    </motion.div>
    </>
  )
}
