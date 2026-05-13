import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Globe2, LockKeyhole, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { AuditResult, Fix } from '@/types'

export const dynamic = 'force-dynamic'

interface PublicReportPageProps {
  params: Promise<{ token: string }>
}

interface PublicAuditRow {
  id: string
  url: string
  domain: string
  seo_score: number
  performance_score: number
  accessibility_score: number
  audit_data: AuditResult | null
  ai_summary: string | null
  top_fixes: Fix[] | null
  created_at: string
  public_shared_at: string | null
}

const scoreTone = (score: number) => {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20'
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-200 dark:bg-blue-500/10 dark:border-blue-400/20'
  if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-500/10 dark:border-amber-400/20'
  return 'text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-500/10 dark:border-red-400/20'
}

const impactTone = (impact: string) => {
  if (impact === 'high') return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200'
  if (impact === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
  return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200'
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value))

async function getPublicAudit(token: string) {
  const { data, error } = await supabaseAdmin
    .from('audits')
    .select('id,url,domain,seo_score,performance_score,accessibility_score,audit_data,ai_summary,top_fixes,created_at,public_shared_at')
    .eq('public_share_token', token)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('[public report]', error)
    return null
  }

  return data as PublicAuditRow | null
}

export async function generateMetadata({ params }: PublicReportPageProps): Promise<Metadata> {
  const { token } = await params
  const audit = await getPublicAudit(token)

  if (!audit) {
    return {
      title: 'Shared SEO Report Not Found | MP SEO Auditor',
    }
  }

  return {
    title: `${audit.domain} SEO Report | MP SEO Auditor`,
    description: `${audit.domain} scored ${audit.seo_score}/100 for SEO. View the public audit summary from MP SEO Auditor.`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function PublicReportPage({ params }: PublicReportPageProps) {
  const { token } = await params
  const audit = await getPublicAudit(token)

  if (!audit) notFound()

  const report = audit.audit_data
  const topFixes = report?.topFixes?.length ? report.topFixes.slice(0, 5) : (audit.top_fixes || []).slice(0, 5)
  const quickWins = report?.quickWins?.slice(0, 5) || []
  const summary = report?.aiSummary || audit.ai_summary || 'This public report is ready for review.'
  const pageSpeed = report?.pageSpeed && !report.pageSpeed.error ? report.pageSpeed : null

  const scoreCards = [
    { label: 'SEO', value: audit.seo_score, icon: Search },
    { label: 'Performance', value: audit.performance_score, icon: Zap },
    { label: 'Accessibility', value: audit.accessibility_score, icon: ShieldCheck },
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(138,199,255,0.36),transparent_34%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_52%,#edf7ff_100%)] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_12%_0%,rgba(96,165,250,0.18),transparent_36%),linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-blue-100 bg-white/80 px-4 py-3 shadow-lg shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <img src="/mp-seo-logo-icon-blue.svg" alt="MP SEO Auditor brand logo" className="h-full w-full object-contain dark:hidden" />
              <img src="/mp-seo-logo-icon-dark.png" alt="MP SEO Auditor brand logo" className="hidden h-full w-full object-contain dark:block" />
            </span>
            <span>
              <span className="block text-base font-black">MP SEO Auditor</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Public SEO report</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-blue-200/70 transition-colors hover:bg-blue-300 dark:shadow-blue-950/20"
          >
            Run your own audit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="overflow-hidden rounded-[36px] border border-blue-200 bg-white/90 p-5 shadow-2xl shadow-blue-100/70 backdrop-blur dark:border-blue-400/20 dark:bg-white/[0.06] dark:shadow-black/20 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                <Globe2 className="h-3.5 w-3.5" />
                Shared audit overview
              </div>
              <h1 className="mt-4 break-words text-4xl font-black tracking-tight lg:text-5xl">{audit.domain}</h1>
              <p className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">{audit.url}</p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Scanned {formatDate(audit.created_at)}
                {audit.public_shared_at ? ` · Shared ${formatDate(audit.public_shared_at)}` : ''}
              </p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="max-w-xs leading-6">
                  Safe public view. Private account details, raw crawl data, and owner history are hidden.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {scoreCards.map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className={`rounded-[28px] border p-5 ${scoreTone(card.value)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black">{card.label}</span>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-5xl font-black">{card.value}</p>
                  <p className="mt-1 text-sm opacity-75">Score out of 100</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-blue-200 bg-blue-50/85 p-5 shadow-xl shadow-blue-100/50 dark:border-blue-400/20 dark:bg-blue-500/10 dark:shadow-black/20">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                AI Executive Summary
              </h2>
              <p className="mt-3 break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{summary}</p>
            </div>

            {topFixes.length > 0 && (
              <div className="rounded-[30px] border border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Priority Fixes
                </h2>
                <div className="mt-4 grid gap-3">
                  {topFixes.map((fix, index) => (
                    <div key={`${fix.title}-${index}`} className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 break-words text-sm font-black">{fix.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${impactTone(fix.impact)}`}>{fix.impact}</span>
                      </div>
                      <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{fix.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {quickWins.length > 0 && (
              <div className="rounded-[30px] border border-emerald-100 bg-emerald-50/85 p-5 shadow-xl shadow-emerald-100/50 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:shadow-black/20">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  Quick Wins
                </h2>
                <ul className="mt-4 space-y-3">
                  {quickWins.map((win, index) => (
                    <li key={`${win}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <span className="min-w-0 break-words">{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pageSpeed && (
              <div className="rounded-[30px] border border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
                <h2 className="text-xl font-black">PageSpeed Snapshot</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ['Performance', pageSpeed.scores.performance],
                    ['SEO', pageSpeed.scores.seo],
                    ['Accessibility', pageSpeed.scores.accessibility],
                    ['Best Practices', pageSpeed.scores.bestPractices],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-blue-50 bg-[#f8fbff] p-3 dark:border-white/10 dark:bg-[#0d1727]">
                      <p className="text-2xl font-black">{value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[30px] border border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
              <h2 className="text-xl font-black">Need the full report?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                This public page shows the client-safe overview. The audit owner can access full tabs, CSV exports, history, and private developer notes inside MP SEO Auditor.
              </p>
              <Link
                href="/register"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-400 px-5 text-sm font-bold text-slate-950 transition-colors hover:bg-blue-300"
              >
                Start free audit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
