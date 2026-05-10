'use client'

import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PageSpeedAnalysis, TechnicalChecklist } from '@/types'

interface TechnicalTabProps {
  technical: TechnicalChecklist
  pageSpeed?: PageSpeedAnalysis
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

export function TechnicalTab({ technical, pageSpeed }: TechnicalTabProps) {
  const passCount = technical.checks.filter(c => c.status === 'pass').length
  const totalCount = technical.checks.length

  return (
    <div className="space-y-6">
      {pageSpeed && !pageSpeed.error && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Google PageSpeed Insights</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Mobile Lighthouse crawl from {new Date(pageSpeed.fetchedAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Performance', pageSpeed.scores.performance],
              ['SEO', pageSpeed.scores.seo],
              ['Accessibility', pageSpeed.scores.accessibility],
              ['Best Practices', pageSpeed.scores.bestPractices],
            ].map(([label, score]) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${scoreTone(Number(score))}`}>{score}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border p-3">
            <h4 className="mb-3 text-sm font-semibold">Core Metrics</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">FCP</p>
                <p className="font-medium">{pageSpeed.metrics.firstContentfulPaint || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">LCP</p>
                <p className="font-medium">{pageSpeed.metrics.largestContentfulPaint || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TBT</p>
                <p className="font-medium">{pageSpeed.metrics.totalBlockingTime || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CLS</p>
                <p className="font-medium">{pageSpeed.metrics.cumulativeLayoutShift || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Speed Index</p>
                <p className="font-medium">{pageSpeed.metrics.speedIndex || 'n/a'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passed audits</p>
                <p className="font-medium">{pageSpeed.passedAudits}</p>
              </div>
            </div>
          </div>

          {pageSpeed.opportunities.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Developer Opportunities</h4>
              <div className="space-y-2">
                {pageSpeed.opportunities.slice(0, 5).map(item => (
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

          {pageSpeed.diagnostics.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">SEO & Crawl Diagnostics</h4>
              <div className="space-y-2">
                {pageSpeed.diagnostics.slice(0, 5).map(item => (
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
