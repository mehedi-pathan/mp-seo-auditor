'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MetaAnalysis } from '@/types'

interface MetaTabProps {
  meta: MetaAnalysis
}

export function MetaTab({ meta }: MetaTabProps) {
  const getTitleColor = (score: string) => {
    switch (score) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900'
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900'
      default:
        return 'bg-red-100 dark:bg-red-900'
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Tag */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Title Tag</h3>
          <Badge>{meta.titleLength} chars</Badge>
        </div>
        <p className="mb-2 break-words rounded border border-border bg-muted p-3 text-sm">{meta.title || '(Missing)'}</p>
        <div className={`h-2 rounded-full ${getTitleColor(meta.titleScore)} mb-1`} style={{ width: `${Math.max(20, Math.min(100, (meta.titleLength / 70) * 100))}%` }} />
        <p className="text-xs text-muted-foreground">Optimal: 50-60 characters</p>
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Meta Description</h3>
          <Badge>{meta.descriptionLength} chars</Badge>
        </div>
        <p className="mb-2 break-words rounded border border-border bg-muted p-3 text-sm">{meta.description || '(Missing)'}</p>
        <div className={`h-2 rounded-full ${getTitleColor(meta.descriptionScore)} mb-1`} style={{ width: `${Math.max(20, Math.min(100, (meta.descriptionLength / 160) * 100))}%` }} />
        <p className="text-xs text-muted-foreground">Optimal: 150-160 characters</p>
      </div>

      {/* Canonical URL */}
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          Canonical URL
          {meta.canonical && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </h3>
        {meta.canonical ? (
          <p className="text-xs p-2 bg-green-50 dark:bg-green-950 rounded text-green-900 dark:text-green-100 break-all">{meta.canonical}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No canonical URL found</p>
        )}
      </div>

      {/* Robots Meta */}
      <div>
        <h3 className="font-semibold mb-2">Robots Meta</h3>
        <p className="text-sm p-2 bg-muted rounded">{meta.robots || 'Not specified'}</p>
      </div>

      {/* Open Graph */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Open Graph Tags
          {meta.openGraph.complete && <Badge className="bg-green-600">Complete</Badge>}
        </h3>
        <div className="space-y-2">
          {[
            { label: 'og:title', value: meta.openGraph.title },
            { label: 'og:description', value: meta.openGraph.description },
            { label: 'og:image', value: meta.openGraph.image },
            { label: 'og:type', value: meta.openGraph.type },
          ].map(tag => (
            <div key={tag.label} className="flex flex-wrap items-start gap-2">
              <span className="text-xs font-mono text-muted-foreground min-w-fit mt-1">{tag.label}</span>
              <span className="min-w-0 flex-1 break-all text-xs text-foreground">{tag.value || '(Missing)'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Twitter Card */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Twitter Card Tags
          {meta.twitter.complete && <Badge className="bg-blue-600">Complete</Badge>}
        </h3>
        <div className="space-y-2">
          {[
            { label: 'twitter:card', value: meta.twitter.card },
            { label: 'twitter:title', value: meta.twitter.title },
            { label: 'twitter:description', value: meta.twitter.description },
            { label: 'twitter:image', value: meta.twitter.image },
          ].map(tag => (
            <div key={tag.label} className="flex flex-wrap items-start gap-2">
              <span className="text-xs font-mono text-muted-foreground min-w-fit mt-1">{tag.label}</span>
              <span className="min-w-0 flex-1 break-all text-xs text-foreground">{tag.value || '(Missing)'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
