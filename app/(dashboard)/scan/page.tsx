'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CheckCircle2, Copy, Crown, Download, GitCompareArrows, Link2, Lock, RefreshCw, Search, Share2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AuditResult, Plan } from '@/types'
import { useScanProgress } from '@/hooks/useScanProgress'
import { generatePDF } from '@/lib/pdfExport'
import { getEffectivePlan, getPlanEntitlements } from '@/lib/planAccess'
import { getPlanDisplay } from '@/lib/planDisplay'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'
import { findLocalAuditByCacheId, findLocalAuditByUrl, saveLocalAudit } from '@/lib/localAuditArchive'
import {
  clearActiveScan,
  clearStickyScanResult,
  getRunningClientScanJob,
  getStickyScanResult,
  startClientScanJob,
  subscribeClientScanJob,
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
  const tone = scoreTone(score)

  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-[28px] bg-slate-50 shadow-inner shadow-slate-200/80 dark:bg-slate-950/60 dark:shadow-black/20 sm:h-56 sm:w-56">
      <div
        className="absolute h-36 w-36 rounded-full sm:h-40 sm:w-40"
        style={{
          background: `conic-gradient(${tone.ring} ${score * 3.6}deg, rgba(226,232,240,.9) 0deg)`,
        }}
      />
      <div className="absolute h-28 w-28 rounded-full bg-white shadow-sm dark:bg-slate-900 sm:h-32 sm:w-32" />
      <div className="relative text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">SEO Score</p>
        <p className={cn('mt-1 text-4xl font-black tracking-tight sm:text-5xl', tone.text)}>{score}<span className="text-2xl text-slate-500 dark:text-slate-400">/100</span></p>
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

const openPdfBlob = (blob: Blob, domain: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer')

  if (!opened) {
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${domain || 'audit'}-seo-report.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
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
  const [pdfLoading, setPdfLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [userPlan, setUserPlan] = useState<Plan>('free')
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const autoStartedUrlRef = useRef('')
  const liveProgress = useScanProgress(step === 'scanning' ? scanSessionId : null)
  const effectivePlan = getEffectivePlan(userPlan, planExpiresAt)
  const entitlements = getPlanEntitlements(effectivePlan)
  const planDisplay = getPlanDisplay(effectivePlan)

  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('plan,plan_expires_at')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserPlan((data.plan || 'free') as Plan)
        setPlanExpiresAt(data.plan_expires_at || null)
        return
      }

      const fallback = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      setUserPlan((fallback.data?.plan || 'free') as Plan)
    }

    void loadPlan()
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
    setActiveTab(0)
    setLoading(false)
    setStep('input')
  }

  const handleScan = async (url: string) => {
    setLoading(true)
    const normalizedUrl = normalizeWebsiteUrl(url)
    setScanningUrl(normalizedUrl)
    setStep('scanning')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const job = startClientScanJob(normalizedUrl, user?.id)
      setScanSessionId(job.sessionId)
      const data = await job.promise

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
      if (job.status === 'complete' && job.audit) {
        setAudit(job.audit)
        setStep('results')
        setLoading(false)
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

  const openStoredOrGeneratedPdf = async () => {
    if (!audit) return
    if (!entitlements.canExportPdf) {
      showUpgradePrompt('PDF export')
      return
    }
    setPdfLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (token && audit.id) {
        const cachedResponse = await fetch(`/api/pdf?auditId=${audit.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (cachedResponse.ok) {
          const cached = (await cachedResponse.json()) as { signedUrl?: string }
          if (cached.signedUrl) {
            window.open(cached.signedUrl, '_blank', 'noopener,noreferrer')
            return
          }
        }
      }

      const blob = await generatePDF(audit)

      if (token && audit.id) {
        const formData = new FormData()
        formData.append('auditId', audit.id)
        formData.append('file', blob, 'report.pdf')

        const uploadResponse = await fetch('/api/pdf', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const uploaded = (await uploadResponse.json()) as { signedUrl?: string; error?: string }

        if (uploadResponse.ok && uploaded.signedUrl) {
          window.open(uploaded.signedUrl, '_blank', 'noopener,noreferrer')
          return
        }

        console.warn('[pdf] Storage unavailable, downloading generated PDF locally:', uploaded.error)
        toast.info('PDF storage is not ready yet, downloading the report directly.')
        openPdfBlob(blob, audit.domain)
        return
      }

      openPdfBlob(blob, audit.domain)
    } catch (error) {
      console.error('[pdf]', error)
      toast.error(error instanceof Error ? error.message : 'Unable to export PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const createShareLink = async () => {
    if (!audit) return

    if (!audit.id) {
      toast.error('Save the audit first before creating a public share link.')
      return
    }

    setShareLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      if (!token) {
        toast.error('Please log in to share this report.')
        return
      }

      const response = await fetch('/api/reports/share', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auditId: audit.id, action: 'enable' }),
      })

      const result = (await response.json()) as { publicUrl?: string; error?: string }

      if (!response.ok || !result.publicUrl) {
        throw new Error(result.error || 'Unable to create public report link')
      }

      setShareUrl(result.publicUrl)
      setShareModalOpen(true)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error(error.message || 'Unable to share report')
      }
    } finally {
      setShareLoading(false)
    }
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Public report link copied')
  }

  if (step === 'input') {
    return <ScanInput onScan={handleScan} loading={loading} initialUrl={initialUrl} />
  }

  if (step === 'scanning') {
    return <ScanProgress url={scanningUrl} progressState={liveProgress} />
  }

  if (!audit) {
    return null
  }

  const auditStats = getAuditStats(audit)
  const maxAuditStat = Math.max(auditStats.failed, auditStats.warnings, auditStats.passed, 1)
  const tone = scoreTone(audit.scores.seo)

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
        return <TechnicalTab technical={audit.technical} pageSpeed={audit.pageSpeed} />
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
            <h2 className="break-words text-2xl font-black leading-tight sm:text-3xl lg:text-4xl lg:text-slate-950 dark:lg:text-white">{audit.url}</h2>
            <p className="mt-1 text-sm text-muted-foreground">General SEO checkup score for {audit.domain}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => entitlements.canCompare ? setActiveTab(7) : showUpgradePrompt('Competitor comparison')}
              title="Compare competitor"
            >
              <GitCompareArrows className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="hidden h-10 rounded-xl px-4 font-bold sm:inline-flex" onClick={resetForNewScan} title="Scan another URL">
              <RefreshCw className="h-4 w-4" />
              Scan another URL
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl sm:hidden" onClick={resetForNewScan} title="Scan another URL">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr] xl:items-center">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/30">
            <AuditScoreGauge score={audit.scores.seo} />
            <div className="mt-4 border-t border-slate-200 pt-4 text-center dark:border-white/10">
              <p className="text-sm text-muted-foreground">
                Average SEO score target: <span className="font-bold text-foreground">75+</span>
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
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
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-400/20 dark:bg-orange-500/10 xl:flex xl:items-center xl:justify-between xl:gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold">Want to fix these issues and track progress?</p>
              <p className="text-sm text-muted-foreground">Create a shareable report, compare competitors, or export a PDF for your developer.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 xl:mt-0 xl:flex xl:shrink-0">
            <Button variant="outline" size="sm" onClick={openStoredOrGeneratedPdf} disabled={pdfLoading} className="w-full bg-white/80 dark:bg-slate-950/40 xl:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {pdfLoading ? 'Preparing' : entitlements.canExportPdf ? 'PDF' : 'PDF Pro'}
            </Button>
            <Button size="sm" onClick={createShareLink} disabled={shareLoading} className="w-full bg-orange-500 text-white hover:bg-orange-600 xl:w-auto">
              <Share2 className="w-4 h-4 mr-2" />
              {shareLoading ? 'Creating' : 'Share'}
            </Button>
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

      {!entitlements.canViewFullReport && (
        <div className="px-4 lg:mx-auto lg:max-w-[1160px] lg:px-0">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/25">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-muted-foreground">
                You are on the {planDisplay.label} package. This preview shows scores, a short summary, and a few fixes. Upgrade to unlock all report tabs, PDF export, and competitor comparison.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-w-0 px-4 pb-4 lg:mx-auto lg:max-w-[1160px] lg:px-0 lg:pb-10 [&_*]:min-w-0 [&_p]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_li]:break-words">
        {renderTab()}
      </div>

      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-[calc(100vw-32px)] rounded-[28px] border-blue-100 p-0 sm:max-w-md dark:border-white/10">
          <div className="overflow-hidden rounded-[28px]">
            <DialogHeader className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 text-left dark:border-white/10 dark:from-blue-500/10 dark:to-slate-950">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                <Share2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black">Share SEO report</DialogTitle>
              <DialogDescription>
                Anyone with this public link can view the overview report without logging in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Public report link</p>
                <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">{shareUrl}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={copyShareLink} className="rounded-2xl">
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${audit.domain} SEO report: ${shareUrl}`)}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${audit.domain} SEO report`)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">
                    X
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={`mailto:?subject=${encodeURIComponent(`${audit.domain} SEO report`)}&body=${encodeURIComponent(`Here is the SEO report: ${shareUrl}`)}`}>
                    Email
                  </a>
                </Button>
              </div>

              <Button asChild variant="ghost" className="w-full rounded-2xl">
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <Link2 className="h-4 w-4" />
                  Open public report
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
