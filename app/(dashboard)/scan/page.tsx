'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ScanInput } from '@/components/scan/ScanInput'
import { ScanProgress } from '@/components/scan/ScanProgress'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { TabNav } from '@/components/ui/TabNav'
import { OverviewTab } from '@/components/audit-tabs/OverviewTab'
import { HeadingsTab } from '@/components/audit-tabs/HeadingsTab'
import { MetaTab } from '@/components/audit-tabs/MetaTab'
import { ContentTab } from '@/components/audit-tabs/ContentTab'
import { TechnicalTab } from '@/components/audit-tabs/TechnicalTab'
import { SocialTab } from '@/components/audit-tabs/SocialTab'
import { LinksTab } from '@/components/audit-tabs/LinksTab'
import { CompareTab } from '@/components/audit-tabs/CompareTab'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CalendarDays, CheckCircle2, ChevronDown, Crown, Download, FileSpreadsheet, FileText, GitCompareArrows, Lock, Monitor, Smartphone, Table2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AuditResult, PageSpeedAnalysis, Plan } from '@/types'
import { useScanProgress } from '@/hooks/useScanProgress'
import { getEffectivePlan, getPlanEntitlements } from '@/lib/planAccess'
import { getPlanDisplay } from '@/lib/planDisplay'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'
import { findLocalAuditByCacheId, findLocalAuditByUrl, saveLocalAudit } from '@/lib/localAuditArchive'
import { downloadAuditCsv } from '@/lib/csvExport'
import {
  clearActiveScan,
  clearStickyScanResult,
  getRunningClientScanJob,
  getStickyScanResult,
  startClientScanJob,
  subscribeGlobalScan,
  subscribeClientScanJob,
  type ClientScanJobSnapshot,
} from '@/lib/clientScanManager'

const tabs = ['Overview', 'Headings', 'Meta', 'Content', 'Technical', 'Social', 'Links', 'Compare']

const scoreTone = (score: number) => {
  if (score >= 85) return {
    text: 'text-emerald-600 dark:text-emerald-300',
    ring: '#10b981',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/20',
    label: 'Strong',
  }
  if (score >= 60) return {
    text: 'text-amber-600 dark:text-amber-300',
    ring: '#f59e0b',
    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/20',
    label: 'Needs work',
  }
  return {
    text: 'text-red-600 dark:text-red-300',
    ring: '#ef4444',
    bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/20',
    label: 'Critical',
  }
}

const getAuditStats = (audit: AuditResult) => {
  const highFixes = audit.topFixes.filter(fix => fix.impact === 'high').length
  const warningFixes = audit.topFixes.filter(fix => fix.impact !== 'high').length
  const failedChecks = audit.technical.checks.filter(check => check.status === 'fail').length
  const warningChecks = audit.technical.checks.filter(check => check.status === 'warning').length
  const passedChecks = audit.technical.checks.filter(check => check.status === 'pass').length
  const pageSpeedPassed = audit.pageSpeed?.passedAudits || 0
  const pageSpeedWarnings = audit.pageSpeed?.opportunities.slice(0, 8).length || 0
  const failed = Math.max(1, highFixes + failedChecks)
  const warnings = warningFixes + warningChecks + pageSpeedWarnings
  const passed = passedChecks + pageSpeedPassed + (audit.meta.title ? 1 : 0) + (audit.meta.description ? 1 : 0) + (audit.social.openGraphComplete ? 1 : 0)

  return { failed, warnings, passed }
}

function AuditScoreGauge({ score }: { score: number }) {
  const id = useId().replace(/:/g, '')
  const tone = scoreTone(score)
  const primaryColor = score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const softColor = score >= 85 ? 'rgba(16,185,129,0.12)' : score >= 60 ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.12)'
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 78
  const strokeWidth = 13
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalizedScore / 100) * circumference

  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-[32px] bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#f8fbff_52%,#eef6ff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_24px_60px_rgba(96,165,250,0.16)] ring-1 ring-blue-100 dark:bg-[radial-gradient(circle_at_50%_42%,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.78)_52%,rgba(30,41,59,0.48)_100%)] dark:shadow-black/25 dark:ring-white/10 sm:h-56 sm:w-56">
      <div className="absolute h-32 w-32 rounded-full blur-2xl sm:h-36 sm:w-36" style={{ backgroundColor: softColor }} />
      <svg viewBox="0 0 200 200" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`audit-score-${id}`} x1="42" y1="24" x2="158" y2="176" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.72" />
            <stop offset="48%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.84" />
          </linearGradient>
          <filter id={`audit-score-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.26 0 0 0 0 0.58 0 0 0 0 0.95 0 0 0 0.24 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/90 dark:text-white/10"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={`url(#audit-score-${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter={`url(#audit-score-glow-${id})`}
          className="origin-center -rotate-90 transition-[stroke-dashoffset] duration-[1200ms] ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div className="space-y-1">
          <p className={cn('text-5xl font-black leading-none tracking-tight sm:text-6xl', tone.text)}>{normalizedScore}</p>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">SEO score</p>
          <p className="text-sm font-black text-slate-600 dark:text-slate-300">/100</p>
        </div>
      </div>
    </div>
  )
}

function AuditStatBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const percentage = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
        <span className="tabular-nums">{value}</span>
        <span className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, background: color }} />
      </div>
    </div>
  )
}

function PageSpeedDeviceCard({ run, showAdvanced }: { run: PageSpeedAnalysis; showAdvanced: boolean }) {
  const DeviceIcon = run.strategy === 'mobile' ? Smartphone : Monitor
  const scoreItems = [
    ['Performance', run.scores.performance, 'text-blue-600 dark:text-blue-300'],
    ['SEO', run.scores.seo, 'text-emerald-600 dark:text-emerald-300'],
    ...(showAdvanced ? [
      ['A11y', run.scores.accessibility, 'text-violet-600 dark:text-violet-300'],
      ['Best', run.scores.bestPractices, 'text-orange-600 dark:text-orange-300'],
    ] as Array<[string, number, string]> : []),
  ] as Array<[string, number, string]>

  return (
    <div className="rounded-3xl border border-blue-100 bg-white/74 p-4 shadow-sm shadow-blue-100/40 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
            <DeviceIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black capitalize text-slate-950 dark:text-white">{run.strategy} crawl</p>
            <p className="truncate text-xs text-muted-foreground">{new Date(run.fetchedAt).toLocaleString()}</p>
          </div>
        </div>
        {run.error && <Badge variant="outline" className="shrink-0 text-amber-600">Limited</Badge>}
      </div>

      {run.error ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-5 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-black">PageSpeed device crawl needs another attempt.</p>
          <p className="mt-1 text-amber-700/90 dark:text-amber-100/80">{run.error}</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {scoreItems.map(([label, score, className]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-3 dark:border-white/10 dark:bg-[#0d1727]">
                <p className={`text-xl font-black ${className}`}>{score}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-blue-50/70 p-3 dark:bg-blue-500/10">
                <p className="font-bold text-slate-700 dark:text-slate-200">LCP</p>
                <p className="mt-1 text-muted-foreground">{run.metrics.largestContentfulPaint || 'n/a'}</p>
              </div>
              <div className="rounded-2xl bg-blue-50/70 p-3 dark:bg-blue-500/10">
                <p className="font-bold text-slate-700 dark:text-slate-200">TBT</p>
                <p className="mt-1 text-muted-foreground">{run.metrics.totalBlockingTime || 'n/a'}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PageSpeedDeviceSummary({
  audit,
  canViewFullReport,
  canViewBusinessInsights,
}: {
  audit: AuditResult
  canViewFullReport: boolean
  canViewBusinessInsights: boolean
}) {
  const deviceRuns = [
    audit.pageSpeedDevices?.mobile || (audit.pageSpeed?.strategy === 'mobile' ? audit.pageSpeed : null),
    audit.pageSpeedDevices?.desktop || (audit.pageSpeed?.strategy === 'desktop' ? audit.pageSpeed : null),
  ].filter((item): item is PageSpeedAnalysis => Boolean(item))

  if (deviceRuns.length === 0) return null

  return (
    <div className="rounded-[28px] border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-400/15 dark:bg-blue-500/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Device results</p>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Mobile and desktop PageSpeed</h3>
        </div>
        {(!canViewFullReport || !canViewBusinessInsights) && (
          <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            {canViewFullReport ? 'Business diagnostics locked' : 'Pro details locked'}
          </Badge>
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {deviceRuns.map(run => <PageSpeedDeviceCard key={run.strategy} run={run} showAdvanced={canViewBusinessInsights} />)}
      </div>
      {!canViewFullReport && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Upgrade to Pro or Business to unlock the full report, advanced tabs, export options, and competitor comparison.
        </p>
      )}
      {canViewFullReport && !canViewBusinessInsights && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Business unlocks accessibility, best-practices, Core Web Vitals, screenshots, and deeper developer diagnostics for both devices.
        </p>
      )}
    </div>
  )
}

export default function ScanPage() {
  const searchParams = useSearchParams()
  const initialUrl = searchParams.get('url') || ''
  const cacheId = searchParams.get('cacheId') || ''
  const [step, setStep] = useState<'input' | 'scanning' | 'results'>('input')
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [scanningUrl, setScanningUrl] = useState('')
  const [scanSessionId, setScanSessionId] = useState<string | null>(null)
  const [clientScanSnapshot, setClientScanSnapshot] = useState<ClientScanJobSnapshot | null>(null)
  const [globalScanSnapshot, setGlobalScanSnapshot] = useState<ClientScanJobSnapshot | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [userPlan, setUserPlan] = useState<Plan>('free')
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [planLoaded, setPlanLoaded] = useState(false)
  const autoStartedUrlRef = useRef('')
  const scanStartedAtRef = useRef(0)
  const liveProgress = useScanProgress(step === 'scanning' ? scanSessionId : null)
  const relevantGlobalScan =
    globalScanSnapshot &&
    (globalScanSnapshot.sessionId === scanSessionId || globalScanSnapshot.url === scanningUrl)
      ? globalScanSnapshot
      : null
  const mergedProgress = {
    ...liveProgress,
    progress: Math.max(liveProgress.progress || 0, clientScanSnapshot?.progress || 0, relevantGlobalScan?.progress || 0),
    status: clientScanSnapshot?.status === 'complete' || relevantGlobalScan?.status === 'complete'
      ? 'complete' as const
      : clientScanSnapshot?.status === 'error' || relevantGlobalScan?.status === 'error'
        ? 'error' as const
        : liveProgress.status,
    errorMessage: clientScanSnapshot?.error || relevantGlobalScan?.error || liveProgress.errorMessage,
  }
  const effectivePlan = getEffectivePlan(userPlan, planExpiresAt)
  const entitlements = getPlanEntitlements(effectivePlan)
  const planDisplay = getPlanDisplay(effectivePlan)

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('plan,plan_expires_at')
          .eq('id', user.id)
          .maybeSingle()

        if (!error && data) {
          setUserPlan((data.plan || 'free') as Plan)
          setPlanExpiresAt(data.plan_expires_at || null)
          return
        }

        const fallback = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle()

        setUserPlan((fallback.data?.plan || 'free') as Plan)
        setPlanExpiresAt(null)
      } finally {
        setPlanLoaded(true)
      }
    }

    void loadPlan()
  }, [])

  useEffect(() => {
    const handlePlanLoaded = (event: Event) => {
      const detail = (event as CustomEvent<{ plan?: Plan; planExpiresAt?: string | null }>).detail

      if (detail?.plan) {
        setUserPlan(detail.plan)
        setPlanExpiresAt(detail.planExpiresAt || null)
        setPlanLoaded(true)
      }
    }

    window.addEventListener('profile-plan-loaded', handlePlanLoaded)
    window.addEventListener('plan-updated', handlePlanLoaded)
    return () => {
      window.removeEventListener('profile-plan-loaded', handlePlanLoaded)
      window.removeEventListener('plan-updated', handlePlanLoaded)
    }
  }, [])

  useEffect(() => {
    return subscribeGlobalScan(setGlobalScanSnapshot)
  }, [])

  const previewAudit = useMemo(() => {
    if (!audit || entitlements.canViewFullReport) return audit

    return {
      ...audit,
      aiSummary: `${audit.aiSummary.split('. ').slice(0, 2).join('. ')}. Upgrade to Pro or Business to unlock the full developer report.`,
      topFixes: audit.topFixes.slice(0, 2),
      quickWins: audit.quickWins.slice(0, 2),
      pageSpeed: undefined,
    }
  }, [audit, entitlements.canViewFullReport])

  const showUpgradePrompt = (feature: string) => {
    toast.info(`${feature} is available on Pro and Business packages.`)
  }

  const resetForNewScan = () => {
    clearStickyScanResult()
    clearActiveScan()
    setAudit(null)
    setScanningUrl('')
    setScanSessionId(null)
    setClientScanSnapshot(null)
    setActiveTab(0)
    setLoading(false)
    setStep('input')
  }

  const rescanCurrentUrl = () => {
    if (!audit?.url) return
    clearStickyScanResult()
    clearActiveScan()
    setActiveTab(0)
    void handleScan(audit.url)
  }

  const handleScan = async (url: string) => {
    const scanStartedAt = Date.now()
    scanStartedAtRef.current = scanStartedAt
    setLoading(true)
    const normalizedUrl = normalizeWebsiteUrl(url)
    setScanningUrl(normalizedUrl)
    setClientScanSnapshot(null)
    setStep('scanning')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const job = startClientScanJob(normalizedUrl, user?.id)
      setScanSessionId(job.sessionId)
      setClientScanSnapshot(job)
      const data = await job.promise
      const minimumVisibleMs = 3600
      const remainingMs = minimumVisibleMs - (Date.now() - scanStartedAt)
      if (remainingMs > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingMs))
      }

      setAudit(data)
      saveLocalAudit(data)
      setStep('results')
      if (user) {
        window.dispatchEvent(new CustomEvent('audit-completed'))
      }
      toast.success(user ? 'Audit saved to history' : 'Audit complete')
    } catch (error) {
      console.error('Scan error:', error)
      setStep('input')
      toast.error(error instanceof Error ? error.message : 'Failed to scan URL. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!scanningUrl || step !== 'scanning') return

    return subscribeClientScanJob(scanningUrl, job => {
      setScanSessionId(job.sessionId)
      setClientScanSnapshot(job)
      if (job.status === 'complete' && job.audit) {
        const remainingMs = Math.max(0, 3600 - (Date.now() - scanStartedAtRef.current))
        window.setTimeout(() => {
          setAudit(job.audit)
          setStep('results')
          setLoading(false)
        }, remainingMs)
      }
      if (job.status === 'error' && job.error) {
        setStep('input')
        setLoading(false)
        toast.error(job.error)
      }
    })
  }, [scanningUrl, step])

  useEffect(() => {
    if (step !== 'input' || initialUrl || cacheId) return

    const runningJob = getRunningClientScanJob()
    if (runningJob) {
      setScanningUrl(runningJob.url)
      setScanSessionId(runningJob.sessionId)
      setClientScanSnapshot(runningJob)
      setLoading(true)
      setStep('scanning')
      return
    }

    const stickyAudit = getStickyScanResult()
    if (stickyAudit) {
      setAudit(stickyAudit)
      setStep('results')
    }
  }, [cacheId, initialUrl, step])

  useEffect(() => {
    if (cacheId && step === 'input') {
      const cached = findLocalAuditByCacheId(cacheId)
      if (cached) {
        setAudit(cached.audit)
        setStep('results')
        toast.success('Loaded from browser archive')
        return
      }
    }
  }, [cacheId, step])

  useEffect(() => {
    if (!initialUrl || loading || step !== 'input') return

    const normalizedUrl = normalizeWebsiteUrl(initialUrl)
    if (!normalizedUrl || autoStartedUrlRef.current === normalizedUrl) return

    const cached = findLocalAuditByUrl(normalizedUrl)
    if (cached) {
      autoStartedUrlRef.current = normalizedUrl
      setAudit(cached.audit)
      setStep('results')
      toast.success('Loaded recent audit from this browser')
      return
    }

    autoStartedUrlRef.current = normalizedUrl
    void handleScan(normalizedUrl)
	  }, [initialUrl, loading, step])

  useEffect(() => {
    if (step !== 'results' || !audit) return

    window.requestAnimationFrame(() => {
      const scroller = document.querySelector('[data-dashboard-scroll]')
      if (scroller instanceof HTMLElement) {
        scroller.scrollTo({ top: 0, behavior: 'smooth' })
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [audit, step])

  const exportCsvSpreadsheet = async () => {
    if (!audit) return
    setExportLoading(true)

    try {
      downloadAuditCsv(audit)
      toast.success('Spreadsheet CSV downloaded')
    } catch (error) {
      console.error('[csv-export]', error)
      toast.error(error instanceof Error ? error.message : 'Unable to export spreadsheet')
    } finally {
      setExportLoading(false)
    }
  }

  if (step === 'input') {
    return <ScanInput onScan={handleScan} loading={loading} initialUrl={initialUrl} />
  }

  if (step === 'scanning') {
    return <ScanProgress url={scanningUrl} progressState={mergedProgress} />
  }

  if (!audit) {
    return null
  }

  const auditStats = getAuditStats(audit)
  const maxAuditStat = Math.max(auditStats.failed, auditStats.warnings, auditStats.passed, 1)
  const tone = scoreTone(audit.scores.seo)
  const scanDate = new Date(audit.createdAt)
  const scanDateLabel = Number.isNaN(scanDate.getTime())
    ? 'Just now'
    : scanDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
  const deviceLabels = [
    audit.pageSpeedDevices?.mobile || audit.pageSpeed?.strategy === 'mobile' ? 'Mobile' : null,
    audit.pageSpeedDevices?.desktop || audit.pageSpeed?.strategy === 'desktop' ? 'Desktop' : null,
  ].filter(Boolean) as string[]
  const pageSnapshot = audit.pageSpeedDevices?.mobile?.snapshot || audit.pageSpeed?.snapshot

  const renderTab = () => {
    if (!entitlements.canViewFullReport && activeTab !== 0) {
      return <LockedReportCard feature={`${tabs[activeTab]} report`} currentPlan={planDisplay.label} />
    }

    switch (activeTab) {
      case 0:
        return <OverviewTab audit={previewAudit || audit} limited={!entitlements.canViewFullReport} />
      case 1:
        return <HeadingsTab headings={audit.headings} />
      case 2:
        return <MetaTab meta={audit.meta} />
      case 3:
        return <ContentTab content={audit.content} />
      case 4:
        return <TechnicalTab technical={audit.technical} pageSpeed={audit.pageSpeed} pageSpeedDevices={audit.pageSpeedDevices} showAdvancedPageSpeed={entitlements.canViewBusinessInsights} />
      case 5:
        return <SocialTab social={audit.social} />
      case 6:
        return <LinksTab links={audit.links} />
      case 7:
        return entitlements.canCompare ? <CompareTab audit={audit} /> : <LockedReportCard feature="Competitor comparison" currentPlan={planDisplay.label} />
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-5 lg:min-h-full lg:bg-[radial-gradient(circle_at_12%_0%,rgba(138,199,255,0.32),transparent_34%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_52%,#edf7ff_100%)] lg:p-8 xl:p-10 dark:lg:bg-[radial-gradient(circle_at_12%_0%,rgba(96,165,250,0.18),transparent_36%),linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)]">
      <div className="px-4 pt-5 lg:mx-auto lg:max-w-[1160px] lg:rounded-[34px] lg:border lg:border-blue-200 lg:bg-white/95 lg:p-6 lg:shadow-2xl lg:shadow-blue-100/60 lg:backdrop-blur dark:lg:border-blue-400/20 dark:lg:bg-white/[0.06] dark:lg:shadow-black/20">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5 dark:border-white/10">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', tone.bg)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {tone.label} audit
              </Badge>
              <span className="text-xs text-muted-foreground">Generated from live page data</span>
            </div>
            <h2 className="break-all text-2xl font-black leading-tight sm:break-words sm:text-3xl lg:text-4xl lg:text-slate-950 dark:lg:text-white">{audit.url}</h2>
            <p className="mt-1 text-sm text-muted-foreground">General SEO checkup score for {audit.domain}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                <CalendarDays className="h-3.5 w-3.5" />
                {scanDateLabel}
              </span>
              {deviceLabels.map(device => (
                <span key={device} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                  {device === 'Mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                  {device}
                </span>
              ))}
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[360px]">
            <Button
              variant="outline"
              size="sm"
              className="h-10 min-w-0 justify-center rounded-xl px-2 text-xs font-bold sm:text-sm"
              onClick={() => entitlements.canCompare ? setActiveTab(7) : showUpgradePrompt('Competitor comparison')}
              title="Compare with a competitor URL"
            >
              <img src="/report-vs.png" alt="" className="h-5 w-5 object-contain" />
              Compare
            </Button>
            <Button variant="outline" size="sm" className="h-10 min-w-0 justify-center rounded-xl px-2 text-xs font-bold sm:text-sm" onClick={rescanCurrentUrl} title="Run this same URL again">
              <img src="/report-refresh.png" alt="" className="h-4 w-4 object-contain" />
              Rescan
            </Button>
            <Button variant="outline" size="sm" className="h-10 min-w-0 justify-center rounded-xl px-2 text-xs font-bold sm:text-sm" onClick={resetForNewScan} title="Scan another URL">
              <img src="/desktop-search-icon.svg" alt="" className="h-4 w-4 object-contain" />
              New URL
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_1fr] lg:items-center">
          <div className="rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-sm shadow-blue-100/40 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.62),rgba(15,23,42,0.32))] dark:shadow-black/20">
            <AuditScoreGauge score={audit.scores.seo} />
            {pageSnapshot?.data && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <img
                  src={pageSnapshot.data}
                  alt={`${audit.domain} mobile PageSpeed visual snapshot`}
                  className="max-h-40 w-full object-contain"
                />
              </div>
            )}
            <div className="mt-4 border-t border-slate-200 pt-4 text-center dark:border-white/10">
              <p className="text-sm text-muted-foreground">
                Average SEO score target: <span className="font-bold text-foreground">75+</span>
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                This webpage received an SEO score of <span className="font-black text-slate-950 dark:text-white">{audit.scores.seo} out of 100</span>. Fix the most visible issues first, then monitor performance and accessibility as the site improves.
              </p>
            </div>
            <div className="space-y-4">
              <AuditStatBar label="Failed" value={auditStats.failed} color="#ef4444" max={maxAuditStat} />
              <AuditStatBar label="Warnings" value={auditStats.warnings} color="#f59e0b" max={maxAuditStat} />
              <AuditStatBar label="Passed" value={auditStats.passed} color="#10b981" max={maxAuditStat} />
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-center dark:border-blue-400/20 dark:bg-blue-500/10">
                <p className="text-xl font-black text-blue-600 dark:text-blue-300">{audit.scores.performance}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Speed</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-center dark:border-emerald-400/20 dark:bg-emerald-500/10">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-300">{audit.scores.accessibility}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">A11y</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3 text-center dark:border-violet-400/20 dark:bg-violet-500/10">
                <p className="text-xl font-black text-violet-600 dark:text-violet-300">{audit.content.wordCount}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Words</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3 text-center dark:border-orange-400/20 dark:bg-orange-500/10">
                <p className="text-xl font-black text-orange-600 dark:text-orange-300">{audit.links.external.count + audit.links.internal.count}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Links</p>
              </div>
            </div>
            <PageSpeedDeviceSummary
              audit={audit}
              canViewFullReport={entitlements.canViewFullReport}
              canViewBusinessInsights={entitlements.canViewBusinessInsights}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-400/20 dark:bg-orange-500/10 xl:flex xl:items-center xl:justify-between xl:gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold">Want to fix these issues and track progress?</p>
              <p className="text-sm text-muted-foreground">Export the audit as a spreadsheet, compare competitors, or hand clean data to your developer.</p>
            </div>
          </div>
          <div className="mt-3 flex xl:mt-0 xl:shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exportLoading} className="h-8 w-auto rounded-xl bg-white/80 px-3 text-xs font-bold dark:bg-slate-950/40">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {exportLoading ? 'Preparing' : 'Export'}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl">
                <DropdownMenuLabel>Download options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportCsvSpreadsheet} className="cursor-pointer rounded-xl">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Spreadsheet CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportCsvSpreadsheet} className="cursor-pointer rounded-xl">
                  <Table2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Full data CSV</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="rounded-xl">
                  <FileText className="h-4 w-4" />
                  <span>PDF report</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="rounded-xl">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel XLSX</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="rounded-xl">
                  <Download className="h-4 w-4" />
                  <span>Google Sheets</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10">Soon</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full lg:hidden"
          onClick={() => entitlements.canCompare ? setActiveTab(7) : showUpgradePrompt('Competitor comparison')}
        >
          <GitCompareArrows className="h-4 w-4" />
          Compare with Competitor
        </Button>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 lg:hidden">
          <div className="min-w-0 flex justify-center">
            <ScoreRing score={audit.scores.seo} label="SEO" color="#2563eb" size="sm" />
          </div>
          <div className="min-w-0 flex justify-center">
            <ScoreRing score={audit.scores.performance} label="Performance" color="#a855f7" size="sm" />
          </div>
          <div className="min-w-0 flex justify-center">
            <ScoreRing score={audit.scores.accessibility} label="A11y" color="#10b981" size="sm" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:mx-auto lg:max-w-[1160px] lg:px-0">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {planLoaded && !entitlements.canViewFullReport && (
        <div className="px-4 lg:mx-auto lg:max-w-[1160px] lg:px-0">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/25">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-muted-foreground">
                You are on the {planDisplay.label} package. This preview shows scores, a short summary, and a few fixes. Upgrade to unlock all report tabs, CSV export, and competitor comparison.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-w-0 px-4 pb-4 lg:mx-auto lg:max-w-[1160px] lg:px-0 lg:pb-10 [&_*]:min-w-0 [&_p]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_li]:break-words">
        {renderTab()}
      </div>
    </div>
  )
}

function LockedReportCard({ feature, currentPlan }: { feature: string; currentPlan: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-center dark:border-amber-900 dark:bg-amber-950/25">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-200 text-amber-900">
        <Crown className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">Unlock {feature}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Your current {currentPlan} package includes a limited audit preview. Upgrade to Pro for full reports or Business for unlimited audits.
      </p>
      <Button asChild className="mt-4 w-full">
        <Link href="/upgrade">
          <Crown className="h-4 w-4" />
          Upgrade Package
        </Link>
      </Button>
    </div>
  )
}
