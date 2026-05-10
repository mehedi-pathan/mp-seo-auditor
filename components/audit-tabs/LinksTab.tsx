'use client'

import { ExternalLink, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { LinkAnalysis } from '@/types'

interface LinksTabProps {
  links: LinkAnalysis
}

export function LinksTab({ links }: LinksTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold mb-1">{links.internal.count}</div>
          <p className="text-xs text-muted-foreground">Internal Links</p>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold mb-1">{links.external.count}</div>
          <p className="text-xs text-muted-foreground">External Links</p>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold mb-1">{links.nofollow}</div>
          <p className="text-xs text-muted-foreground">No-Follow Links</p>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 mb-1">{links.broken}</div>
          <p className="text-xs text-muted-foreground">Broken Links</p>
        </div>
      </div>

      {/* Link Equity Score */}
      <div>
        <h3 className="font-semibold mb-3">Link Equity Score</h3>
        <div className="bg-muted rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-primary mb-1">{links.equityScore}/100</div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${links.equityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Internal Links */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Internal Links ({links.internal.count})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {links.internal.links.slice(0, 10).map((url, i) => (
            <div key={i} className="text-xs p-2 bg-muted rounded border border-border break-all hover:bg-muted/80 transition">
              {url}
            </div>
          ))}
          {links.internal.links.length > 10 && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              +{links.internal.links.length - 10} more
            </div>
          )}
        </div>
      </div>

      {/* External Links */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          External Links ({links.external.count})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {links.external.links.slice(0, 10).map((url, i) => (
            <div key={i} className="text-xs p-2 bg-muted rounded border border-border break-all hover:bg-muted/80 transition">
              {url}
            </div>
          ))}
          {links.external.links.length > 10 && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              +{links.external.links.length - 10} more
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
