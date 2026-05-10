'use client'

import { AlertCircle, CheckCircle2, Zap } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
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

      {/* Critical Issues */}
      {audit.topFixes.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Critical Issues to Fix
          </h3>
          <div className="space-y-2">
            {audit.topFixes.map((fix, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <h4 className="min-w-0 flex-1 break-words text-sm font-medium">{fix.title}</h4>
                  <Badge className={`${getImpactColor(fix.impact)} shrink-0`}>{fix.impact}</Badge>
                </div>
                <p className="break-words text-xs leading-5 text-muted-foreground">{fix.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
