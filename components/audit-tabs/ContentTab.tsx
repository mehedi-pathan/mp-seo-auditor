'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ContentAnalysis } from '@/types'

interface ContentTabProps {
  content: ContentAnalysis
}

export function ContentTab({ content }: ContentTabProps) {
  return (
    <div className="space-y-6">
      {/* Word Count */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Word Count
          {content.wordCountRating === 'excellent' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </h3>
        <div className="text-center bg-muted rounded-lg p-6 mb-2">
          <div className="text-4xl font-bold">{content.wordCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">Total words on page</div>
        </div>
        <p className="text-sm text-muted-foreground">
          {content.wordCountRating === 'excellent'
            ? 'Excellent: Your page has substantial content'
            : content.wordCountRating === 'good'
              ? 'Good: Consider expanding your content'
              : 'Too short: Add more content (300+ words recommended)'}
        </p>
      </div>

      {/* Readability Score */}
      <div>
        <h3 className="font-semibold mb-3">Readability Score</h3>
        <div className="text-center bg-muted rounded-lg p-6 mb-2">
          <div className="text-4xl font-bold">{content.readabilityScore}</div>
          <div className="text-sm text-muted-foreground mt-1">Flesch Reading Ease</div>
        </div>
        <p className="text-sm text-muted-foreground">
          {content.readabilityScore > 60 ? 'Easy to read for most people' : 'Consider simplifying your content'}
        </p>
      </div>

      {/* Top Keywords */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Top 10 Keywords
          {content.keywordStuffingWarning && <AlertCircle className="w-5 h-5 text-amber-600" />}
        </h3>

        {content.keywordStuffingWarning && (
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 mb-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Warning: Keyword density above 5% detected. Avoid over-optimization.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {content.topKeywords.map((kw, i) => (
            <div key={i} className="border border-border rounded-lg p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-medium">{kw.keyword}</span>
                <div className="flex shrink-0 gap-2">
                  <Badge variant="outline">{kw.count}x</Badge>
                  <Badge variant="outline">{kw.density.toFixed(2)}%</Badge>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    kw.density > 5
                      ? 'bg-red-500'
                      : kw.density > 2
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, kw.density * 10)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
