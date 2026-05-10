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
import { Crown, Download, GitCompareArrows, Lock, RefreshCw, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AuditResult, Plan } from '@/types'
import { useScanProgress } from '@/hooks/useScanProgress'
import { generatePDF } from '@/lib/pdfExport'
import { getEffectivePlan, getPlanEntitlements } from '@/lib/planAccess'
import { getPlanDisplay } from '@/lib/planDisplay'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'

const tabs = ['Overview', 'Headings', 'Meta', 'Content', 'Technical', 'Social', 'Links', 'Compare']

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
  const [step, setStep] = useState<'input' | 'scanning' | 'results'>('input')
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [scanningUrl, setScanningUrl] = useState('')
  const [scanSessionId, setScanSessionId] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
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

  const handleScan = async (url: string) => {
    setLoading(true)
    setScanningUrl(url)
    const sessionId = crypto.randomUUID()
    setScanSessionId(sessionId)
    setStep('scanning')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userId: user?.id, sessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed')
      }

      setAudit(data)
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
    if (!initialUrl || loading || step !== 'input') return

    const normalizedUrl = normalizeWebsiteUrl(initialUrl)
    if (!normalizedUrl || autoStartedUrlRef.current === normalizedUrl) return

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

  const shareAudit = async () => {
    if (!audit) return

    const shareText = `${audit.domain} scored ${audit.scores.seo}/100 SEO in MP SEO Auditor.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MP SEO Auditor Report', text: shareText, url: audit.url })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${audit.url}`)
        toast.success('Report summary copied')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Unable to share report')
      }
    }
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
    <div className="w-full space-y-5">
      {/* Score Gauges */}
      <div className="px-4 pt-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold leading-tight sm:text-2xl">{audit.domain}</h2>
            <p className="break-all text-xs leading-5 text-muted-foreground">{audit.url}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => entitlements.canCompare ? setActiveTab(7) : showUpgradePrompt('Competitor comparison')}
              title="Compare competitor"
            >
              <GitCompareArrows className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setStep('input')} title="Run another scan">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mb-4 w-full"
          onClick={() => entitlements.canCompare ? setActiveTab(7) : showUpgradePrompt('Competitor comparison')}
        >
          <GitCompareArrows className="h-4 w-4" />
          Compare with Competitor
        </Button>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" onClick={openStoredOrGeneratedPdf} disabled={pdfLoading}>
            <Download className="w-4 h-4 mr-2" />
            {pdfLoading ? 'Preparing' : entitlements.canExportPdf ? 'PDF' : 'PDF Pro'}
          </Button>
          <Button variant="outline" size="sm" onClick={shareAudit}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
      <div className="px-4">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {!entitlements.canViewFullReport && (
        <div className="px-4">
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
      <div className="min-w-0 px-4 pb-4 [&_*]:min-w-0 [&_p]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_li]:break-words">
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
