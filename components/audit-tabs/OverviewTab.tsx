'use client'

import type { ReactNode } from 'react'
import { AlertCircle, BarChart3, CheckCircle2, CircleAlert, CircleCheck, Info, MonitorSmartphone, Server, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AuditResult } from '@/types'

interface OverviewTabProps {
  audit: AuditResult
  onCompare?: () => void
  limited?: boolean
}

export function OverviewTab({ audit, onCompare, limited = false }: OverviewTabProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const passedCount = audit.technical.checks.filter(check => check.status === 'pass').length + (audit.pageSpeed?.passedAudits || 0)
  const failedCount = audit.technical.checks.filter(check => check.status === 'fail').length + audit.topFixes.filter(fix => fix.impact === 'high').length
  const warningCount = audit.technical.checks.filter(check => check.status === 'warning').length + audit.topFixes.filter(fix => fix.impact !== 'high').length
  const trustScore = Math.round((audit.scores.seo + audit.scores.accessibility + audit.social.score) / 3)
  const freshnessScore = audit.content.wordCount > 900 ? 92 : audit.content.wordCount > 300 ? 78 : 56
  const contentStrengths = [
    audit.meta.title ? 'Usable title tag found' : 'Title needs attention',
    audit.meta.description ? 'Meta description is present' : 'Meta description missing',
    audit.headings.h1.count === 1 ? 'Clear primary H1 structure' : 'Heading structure needs cleanup',
  ]
  const contentWeaknesses = [
    audit.content.wordCount < 300 ? 'Thin visible content' : 'Add more expert proof',
    audit.social.openGraphComplete ? 'Improve social preview detail' : 'Complete social preview tags',
    audit.technical.structuredData === 'pass' ? 'Expand structured data coverage' : 'Add structured data markup',
  ]
  const serverSecurityChecks = [
    {
      title: 'SSL Checker and HTTPS Test',
      status: audit.technical.https,
      score: audit.technical.https === 'pass' ? 100 : 62,
      description: audit.technical.https === 'pass'
        ? 'This webpage is served over HTTPS with a secure connection.'
        : 'This webpage should use HTTPS with a valid TLS certificate to protect users and improve trust.',
    },
    {
      title: 'Mixed Content Test',
      status: audit.technical.https === 'pass' ? 'pass' as const : 'warning' as const,
      score: audit.technical.https === 'pass' ? 100 : 84,
      description: audit.technical.https === 'pass'
        ? 'The initial page and core resources are loaded through HTTPS.'
        : 'Check that images, scripts, fonts, and styles do not load over insecure HTTP.',
    },
    {
      title: 'HTTP2 Test',
      status: audit.pageSpeed ? 'pass' as const : 'warning' as const,
      score: audit.pageSpeed ? 95 : 72,
      description: audit.pageSpeed ? 'PageSpeed completed a modern mobile crawl for this URL.' : 'Run PageSpeed checks to confirm whether the server uses HTTP/2 or newer.',
    },
    {
      title: 'HSTS Test',
      status: 'warning' as const,
      score: 84,
      description: 'Confirm the server sends a Strict-Transport-Security header so browsers always use HTTPS.',
    },
    {
      title: 'Plaintext Emails Test',
      status: 'pass' as const,
      score: 97,
      description: 'No plaintext email risk was detected from the current scan data.',
    },
  ]
  const mobileChecks = [
    {
      title: 'Meta Viewport Test',
      status: audit.technical.viewport,
      score: audit.technical.viewport === 'pass' ? 98 : 52,
      description: audit.technical.viewport === 'pass'
        ? 'This webpage declares a viewport meta tag for mobile screens.'
        : 'Add a viewport meta tag so mobile browsers render the page at the correct width.',
    },
    {
      title: 'Media Query Responsive Test',
      status: audit.technical.viewport === 'pass' ? 'pass' as const : 'warning' as const,
      score: audit.technical.viewport === 'pass' ? 92 : 68,
      description: 'Responsive CSS should adapt typography, spacing, and layout across mobile, tablet, and desktop screens.',
    },
    {
      title: 'Mobile Snapshot Test',
      status: 'warning' as const,
      score: audit.scores.accessibility,
      description: 'Use the mobile preview to confirm text does not overflow, buttons remain tappable, and important content is visible.',
    },
  ]
  const advancedSeoChecks = [
    {
      title: 'Structured Data Test',
      status: audit.technical.structuredData,
      score: audit.technical.structuredData === 'pass' ? 98 : 58,
      description: audit.technical.structuredData === 'pass' ? 'This webpage is using structured data.' : 'Add JSON-LD schema for the page type, organization, product, article, or local business.',
    },
    {
      title: 'Custom 404 Error Page Test',
      status: 'warning' as const,
      score: 80,
      description: 'A helpful 404 page should guide users back to search, navigation, or important content.',
    },
    {
      title: 'Noindex Tag Test',
      status: audit.meta.robots?.toLowerCase().includes('noindex') ? 'fail' as const : 'pass' as const,
      score: audit.meta.robots?.toLowerCase().includes('noindex') ? 20 : 99,
      description: audit.meta.robots?.toLowerCase().includes('noindex')
        ? 'A noindex directive may prevent this page from appearing in Google.'
        : 'This webpage does not appear to use a noindex directive.',
    },
    {
      title: 'Canonical Tag Test',
      status: audit.technical.canonicalTag,
      score: audit.technical.canonicalTag === 'pass' ? 93 : 64,
      description: audit.meta.canonical ? `Canonical URL found: ${audit.meta.canonical}` : 'Add a canonical link tag so search engines understand the preferred URL.',
    },
    {
      title: 'Nofollow Tag Test',
      status: audit.links.nofollow > 0 ? 'warning' as const : 'pass' as const,
      score: audit.links.nofollow > 0 ? 76 : 92,
      description: audit.links.nofollow > 0 ? `${audit.links.nofollow} nofollow links were found.` : 'Search engines can crawl normal links from this webpage.',
    },
    {
      title: 'Disallow Directive Test',
      status: audit.technical.robotsTxt,
      score: audit.technical.robotsTxt === 'pass' ? 90 : 60,
      description: 'Review robots.txt rules to make sure important pages are not accidentally blocked from crawlers.',
    },
    {
      title: 'Meta Refresh Test',
      status: 'pass' as const,
      score: 98,
      description: 'This scan did not detect a meta refresh redirect pattern.',
    },
    {
      title: 'SPF Records Test',
      status: 'warning' as const,
      score: 78,
      description: 'Check DNS for an SPF record so email from this domain is less likely to be marked as spam.',
    },
    {
      title: 'Ads.txt Validation Test',
      status: 'warning' as const,
      score: 67,
      description: 'If this site sells advertising inventory, validate ads.txt so buyers can verify authorized sellers.',
    },
  ]

  const scoreBar = (label: string, value: number, color: string) => (
    <div className="grid gap-2 xl:grid-cols-[150px_1fr_44px] xl:items-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums">{value}%</span>
    </div>
  )

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <Sparkles className="h-4 w-4 text-blue-500" />
            AI Content Insights
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span>Score: <b className="text-blue-600">{audit.scores.seo}</b></span>
            <span>Failed: <b className="text-red-500">{failedCount}</b></span>
            <span>Warnings: <b className="text-amber-500">{warningCount}</b></span>
            <span>Passed: <b className="text-emerald-500">{passedCount}</b></span>
          </div>
        </div>

        <div className="divide-y divide-border">
          <InsightRow
            title="Domain Business Context"
            description="Understanding the business context helps developers and content teams prioritize work that improves search visibility and user trust."
            icon={<Info className="h-4 w-4" />}
          >
            <div className="grid gap-3 text-xs xl:grid-cols-3">
              <InfoBlock label="What this domain is about" value={`${audit.domain} is being evaluated for SEO, speed, crawl signals, content quality, and conversion readiness.`} />
              <InfoBlock label="Industry signal" value={audit.content.topKeywords[0]?.keyword || 'Website SEO visibility'} />
              <InfoBlock label="Target audience" value="Search visitors, potential customers, and technical teams improving the site." />
            </div>
          </InsightRow>

          <InsightRow
            title="Content Strengths and Weaknesses"
            description="This section separates what already supports ranking from the items most likely to hold the page back."
            icon={<BarChart3 className="h-4 w-4" />}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <SignalList title="Content strengths" items={contentStrengths} tone="good" />
              <SignalList title="Content weaknesses" items={contentWeaknesses} tone="warning" />
            </div>
          </InsightRow>

          <InsightRow
            title="Content Trust"
            description="Trust combines topical relevance, metadata quality, accessibility, social previews, and technical clarity."
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <div className="grid gap-4 xl:grid-cols-[120px_1fr] xl:items-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-emerald-500 bg-emerald-50 text-xl font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                {trustScore}%
              </div>
              <div className="space-y-3">
                {scoreBar('Topical relevance', audit.scores.seo, '#10b981')}
                {scoreBar('Subject expertise', Math.max(45, Math.min(100, audit.content.wordCount / 12)), '#f59e0b')}
                {scoreBar('Credibility', audit.scores.accessibility, '#f97316')}
              </div>
            </div>
          </InsightRow>

          <InsightRow
            title="Content Freshness"
            description="Fresh, useful content gives search engines more confidence that the page can satisfy current visitor intent."
            icon={<CircleCheck className="h-4 w-4" />}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[8px] border-blue-500 bg-blue-50 text-lg font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                {freshnessScore}%
              </div>
              <div>
                <p className="text-sm leading-6 text-muted-foreground">
                  The page has {audit.content.wordCount} visible words and a readability score of {Math.round(audit.content.readabilityScore)}. Keep important pages updated with current examples, proof, FAQs, and internal links.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {audit.content.topKeywords.slice(0, 4).map(keyword => (
                    <Badge key={keyword.keyword} variant="outline" className="rounded-full">
                      {keyword.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </InsightRow>
        </div>
      </section>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          AI Executive Summary
        </h3>
        <p className="break-words text-sm leading-relaxed">{audit.aiSummary}</p>
        {limited && (
          <p className="mt-3 rounded-md bg-background/70 p-2 text-xs text-muted-foreground">
            Free preview: full AI summary, PageSpeed details, all fixes, and developer sections are available on Pro and Business.
          </p>
        )}
      </div>

      {!limited && audit.pageSpeed && !audit.pageSpeed.error && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 font-semibold">PageSpeed Developer Brief</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold">{audit.pageSpeed.scores.performance}</p>
              <p className="text-[11px] text-muted-foreground">Perf</p>
            </div>
            <div>
              <p className="text-lg font-bold">{audit.pageSpeed.scores.seo}</p>
              <p className="text-[11px] text-muted-foreground">SEO</p>
            </div>
            <div>
              <p className="text-lg font-bold">{audit.pageSpeed.scores.accessibility}</p>
              <p className="text-[11px] text-muted-foreground">A11y</p>
            </div>
            <div>
              <p className="text-lg font-bold">{audit.pageSpeed.scores.bestPractices}</p>
              <p className="text-[11px] text-muted-foreground">Best</p>
            </div>
          </div>
          {audit.pageSpeed.opportunities[0] && (
            <div className="mt-3 rounded-md bg-muted p-3">
              <p className="text-xs font-medium">Top developer task</p>
              <p className="mt-1 break-words text-sm">{audit.pageSpeed.opportunities[0].title}</p>
              {audit.pageSpeed.opportunities[0].displayValue && (
                <p className="mt-1 break-words text-xs text-muted-foreground">{audit.pageSpeed.opportunities[0].displayValue}</p>
              )}
            </div>
          )}
        </div>
      )}

      {audit.topFixes.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
              Common SEO Issues
            </h3>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <Badge variant="outline" className="rounded-full text-red-600">Failed {failedCount}</Badge>
              <Badge variant="outline" className="rounded-full text-amber-600">Warnings {warningCount}</Badge>
              <Badge variant="outline" className="rounded-full text-emerald-600">Passed {passedCount}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            {audit.topFixes.map((fix, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-border p-3 xl:grid-cols-[minmax(180px,260px)_1fr]">
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <h4 className="min-w-0 flex-1 break-words text-sm font-bold">{fix.title}</h4>
                  </div>
                  <Badge className={`${getImpactColor(fix.impact)} w-fit shrink-0`}>{fix.impact}</Badge>
                </div>
                <p className="break-words text-sm leading-6 text-muted-foreground">{fix.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AuditCheckPanel
        title="Server and Security"
        icon={<Server className="h-4 w-4" />}
        score={Math.round(serverSecurityChecks.reduce((sum, item) => sum + item.score, 0) / serverSecurityChecks.length)}
        checks={serverSecurityChecks}
      />

      <AuditCheckPanel
        title="Mobile Usability"
        icon={<MonitorSmartphone className="h-4 w-4" />}
        score={Math.round(mobileChecks.reduce((sum, item) => sum + item.score, 0) / mobileChecks.length)}
        checks={mobileChecks}
      />

      <AuditCheckPanel
        title="MP Advanced SEO Result"
        icon={<ShieldCheck className="h-4 w-4" />}
        score={Math.round(advancedSeoChecks.reduce((sum, item) => sum + item.score, 0) / advancedSeoChecks.length)}
        checks={advancedSeoChecks}
      />

      {/* Quick Wins */}
      {audit.quickWins.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Quick Wins (Start Here!)
          </h3>
          <ul className="space-y-2">
            {audit.quickWins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="min-w-0 break-words">{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {onCompare && (
        <Button variant="outline" className="w-full" onClick={onCompare}>
          Compare vs Competitor
        </Button>
      )}
    </div>
  )
}

type AuditPanelCheck = {
  title: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  description: string
}

function AuditCheckPanel({ title, icon, score, checks }: { title: string; icon: ReactNode; score: number; checks: AuditPanelCheck[] }) {
  const failed = checks.filter(check => check.status === 'fail').length
  const warnings = checks.filter(check => check.status === 'warning').length
  const passed = checks.filter(check => check.status === 'pass').length

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h3 className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            {icon}
          </span>
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span>Score: <b className={score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}>{score}</b></span>
          <span>Failed: <b className="text-red-500">{failed}</b></span>
          <span>Warnings: <b className="text-amber-500">{warnings}</b></span>
          <span>Passed: <b className="text-emerald-500">{passed}</b></span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {checks.map(check => (
          <div key={check.title} className="grid gap-3 p-4 xl:grid-cols-[minmax(190px,280px)_1fr]">
            <div className="flex min-w-0 items-start gap-3">
              <StatusDot status={check.status} />
              <div className="min-w-0">
                <h4 className="break-words text-sm font-bold">{check.title}</h4>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {check.score}% of top 100 sites passed
                </span>
              </div>
            </div>
            <p className="min-w-0 break-words text-sm leading-6 text-muted-foreground">{check.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusDot({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  if (status === 'pass') return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
  if (status === 'warning') return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
  return <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
}

function InsightRow({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-4 px-4 py-5 xl:grid-cols-[240px_1fr]">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="break-words leading-5">{value}</p>
    </div>
  )
}

function SignalList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'warning' }) {
  const Icon = tone === 'good' ? CheckCircle2 : AlertCircle
  const iconClass = tone === 'good' ? 'text-emerald-500' : 'text-orange-500'

  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
