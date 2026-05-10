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
  KeyRound,
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

const donateUrl = 'https://wa.me/8801622839616?text=I%20want%20to%20donate%20to%20support%20MP%20SEO%20Auditor'

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

export default function DashboardPage() {
  const { audits, isLoading, loadAudits, invalidate } = useAuditStore()
  const [auditUrl, setAuditUrl] = useState('')
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

  const stats = useMemo(() => {
    const total = audits.length
    const scoreSum = audits.reduce((sum, audit) => sum + audit.seo_score, 0)
    const avgSeo = total ? Math.round(scoreSum / total) : null
    const bestScore = total ? Math.max(...audits.map(audit => audit.seo_score)) : null
    const domains = new Set(audits.map(audit => audit.domain)).size

    return { total, avgSeo, bestScore, domains }
  }, [audits])

  const recentAudits = audits.slice(0, 4)

  const startAuditFromDashboard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedUrl = auditUrl.trim()
    if (!trimmedUrl) {
      router.push('/scan')
      return
    }

    router.push(`/scan?url=${encodeURIComponent(trimmedUrl)}`)
  }

  const statCards = [
    { label: 'Total Scans', value: stats.total, icon: Activity, color: 'blue' as const, iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
    { label: 'Avg SEO Score', value: stats.avgSeo ?? '-', icon: Star, color: 'green' as const, iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { label: 'Best Score', value: stats.bestScore ?? '-', icon: Trophy, color: 'violet' as const, iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
    { label: 'Domains Tracked', value: stats.domains, icon: Globe2, color: 'orange' as const, iconClass: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 p-4 pb-24"
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
        <Link href="/keywords">
          <Button variant="outline" className="h-14 w-full justify-start gap-2 rounded-2xl bg-card">
            <KeyRound className="h-4 w-4" />
            Keywords
          </Button>
        </Link>
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
    </motion.div>
  )
}
