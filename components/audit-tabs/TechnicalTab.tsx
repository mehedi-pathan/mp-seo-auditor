'use client'

import { CheckCircle2, AlertCircle, Lock, Monitor, Smartphone, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PageSpeedAnalysis, PageSpeedDeviceAnalysis, TechnicalChecklist } from '@/types'

interface TechnicalTabProps {
  technical: TechnicalChecklist
  pageSpeed?: PageSpeedAnalysis
  pageSpeedDevices?: PageSpeedDeviceAnalysis
  showAdvancedPageSpeed?: boolean
}

const statusIcons = {
  pass: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-600" />,
  fail: <XCircle className="w-5 h-5 text-red-600" />,
}

const scoreTone = (score: number) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return null
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function TechnicalTab({ technical, pageSpeed, pageSpeedDevices, showAdvancedPageSpeed = false }: TechnicalTabProps) {
  const passCount = technical.checks.filter(c => c.status === 'pass').length
  const totalCount = technical.checks.length
  const deviceRuns = [
    pageSpeedDevices?.mobile || (pageSpeed?.strategy === 'mobile' ? pageSpeed : null),
    pageSpeedDevices?.desktop || (pageSpeed?.strategy === 'desktop' ? pageSpeed : null),
  ].filter((item): item is PageSpeedAnalysis => Boolean(item))
  const primaryPageSpeed = deviceRuns.find(item => !item.error) || pageSpeed

  return (
    <div className="space-y-6">
      {deviceRuns.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Google PageSpeed Insights</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Mobile and desktop Lighthouse crawls from {primaryPageSpeed ? new Date(primaryPageSpeed.fetchedAt).toLocaleString() : 'PageSpeed Insights'}.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {deviceRuns.map(run => {
              const DeviceIcon = run.strategy === 'mobile' ? Smartphone : Monitor

              return (
                <div key={run.strategy} className="rounded-2xl border border-border bg-card/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                        <DeviceIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black capitalize">{run.strategy}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{new Date(run.fetchedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {run.error && <Badge variant="outline" className="shrink-0 text-amber-600">Limited</Badge>}
                  </div>

                  {run.error ? (
                    <p className="text-xs leading-5 text-muted-foreground">{run.error}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['Performance', run.scores.performance],
                          ['SEO', run.scores.seo],
                          ...(showAdvancedPageSpeed ? [
                            ['Accessibility', run.scores.accessibility],
                            ['Best Practices', run.scores.bestPractices],
                          ] as Array<[string, number]> : []),
                        ].map(([label, score]) => (
                          <div key={label} className="rounded-xl border border-border p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`text-2xl font-bold ${scoreTone(Number(score))}`}>{score}</p>
                          </div>
                        ))}
                      </div>
                      {run.snapshot?.data && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/40">
                          <img
                            src={run.snapshot.data}
                            alt={`${run.strategy} PageSpeed visual snapshot`}
                            className="max-h-56 w-full object-contain"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {!showAdvancedPageSpeed && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Pro and Business users can see Core Web Vitals, accessibility, best-practice details, developer opportunities, and diagnostics for both mobile and desktop crawls.</p>
              </div>
            </div>
          )}

          {showAdvancedPageSpeed && primaryPageSpeed && !primaryPageSpeed.error && (
          <div className="rounded-lg border border-border p-3">
            <h4 className="mb-3 text-sm font-semibold">Core Metrics</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">FCP</p>
                <p className="font-medium">{primaryPageSpeed.metrics.firstContentfulPaint || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">LCP</p>
                <p className="font-medium">{primaryPageSpeed.metrics.largestContentfulPaint || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TBT</p>
                <p className="font-medium">{primaryPageSpeed.metrics.totalBlockingTime || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CLS</p>
                <p className="font-medium">{primaryPageSpeed.metrics.cumulativeLayoutShift || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Speed Index</p>
                <p className="font-medium">{primaryPageSpeed.metrics.speedIndex || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passed audits</p>
                <p className="font-medium">{primaryPageSpeed.passedAudits}</p>
              </div>
            </div>
          </div>
          )}

          {showAdvancedPageSpeed && primaryPageSpeed && primaryPageSpeed.opportunities.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Developer Opportunities</h4>
              <div className="space-y-2">
                {primaryPageSpeed.opportunities.slice(0, 5).map(item => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-words text-sm font-medium">{item.title}</p>
                      {item.displayValue && <Badge variant="outline" className="shrink-0 whitespace-normal break-words text-right">{item.displayValue}</Badge>}
                    </div>
                    <p className="break-words text-xs leading-5 text-muted-foreground">{item.description}</p>
                    {(item.savingsMs || item.savingsBytes) && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Potential saving: {[item.savingsMs ? `${Math.round(item.savingsMs)} ms` : null, formatBytes(item.savingsBytes)].filter(Boolean).join(' / ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAdvancedPageSpeed && primaryPageSpeed && primaryPageSpeed.diagnostics.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">SEO & Crawl Diagnostics</h4>
              <div className="space-y-2">
                {primaryPageSpeed.diagnostics.slice(0, 5).map(item => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="break-words text-sm font-medium">{item.title}</p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pageSpeed?.error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          PageSpeed Insights could not finish: {pageSpeed.error}
        </div>
      )}

      {/* Summary */}
      <div className="bg-muted rounded-lg p-6 text-center">
        <div className="text-3xl font-bold mb-1">
          {passCount}/{totalCount}
        </div>
        <p className="text-sm text-muted-foreground">Technical checks passed</p>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(passCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Checks Grid */}
      <div className="space-y-2">
        {technical.checks.map((check, i) => (
          <div key={i} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition">
            <div className="flex items-start gap-3">
              {statusIcons[check.status]}
              <div className="flex-1 min-w-0">
                <h4 className="break-words text-sm font-medium">{check.name}</h4>
                <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">{check.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Details */}
      <div>
        <h3 className="font-semibold mb-3">Performance Grade</h3>
        <div className="bg-muted rounded-lg p-6 text-center">
          <div className="text-5xl font-bold text-primary">{technical.pageSpeedGrade}</div>
          <p className="text-sm text-muted-foreground mt-2">Overall Page Speed Grade</p>
        </div>
      </div>
    </div>
  )
}
