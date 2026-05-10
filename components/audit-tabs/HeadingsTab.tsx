'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { HeadingAnalysis } from '@/types'

interface HeadingsTabProps {
  headings: HeadingAnalysis
}

const headingLevels = [
  { level: 'h1', label: 'H1 Headings', max: 1 },
  { level: 'h2', label: 'H2 Headings' },
  { level: 'h3', label: 'H3 Headings' },
  { level: 'h4', label: 'H4 Headings' },
  { level: 'h5', label: 'H5 Headings' },
  { level: 'h6', label: 'H6 Headings' },
] satisfies Array<{ level: keyof Pick<HeadingAnalysis, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>; label: string; max?: number }>

export function HeadingsTab({ headings }: HeadingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Status */}
      {headings.hierarchyIssues.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Perfect heading structure!</h3>
            <p className="text-sm text-green-800 dark:text-green-200">Your headings are properly organized.</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Heading issues detected</h3>
            <ul className="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1">
              {headings.hierarchyIssues.map((issue, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-600 rounded-full" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Heading Counts */}
      <div className="grid grid-cols-2 gap-3">
        {headingLevels.map(h => {
          const data = headings[h.level]
          const count = data?.count || 0
          const isH1 = h.level === 'h1'

          return (
          <div key={h.level} className="border border-border rounded-lg p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-medium uppercase">{h.label}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
              {isH1 && count !== 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Should have exactly 1</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Headings Content */}
      {headingLevels.map(h => {
        const data = headings[h.level]
        const items = data?.items || []

        if (items.length === 0) return null

        return (
          <div key={h.level}>
            <h3 className="font-semibold mb-2 text-sm">{h.label} Content</h3>
            <ul className="space-y-1">
              {items.map((text: string, i: number) => (
                <li key={i} className="break-words text-sm p-2 bg-muted rounded border-l-2 border-primary">
                  {text || '(empty)'}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
