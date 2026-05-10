'use client'

import { FormEvent, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link2, Loader2, Search, ShieldAlert, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { BacklinkAnalysis } from '@/types'

type BacklinkResult = BacklinkAnalysis & {
  domain: string
  source: 'ai' | 'estimated'
}

const qualityClass = (quality: string) => {
  if (quality === 'Excellent') return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  if (quality === 'Good') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
  if (quality === 'Poor') return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
}

export default function BacklinksPage() {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState<BacklinkResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analyzeDomain = async (event: FormEvent) => {
    event.preventDefault()

    if (!domain.trim()) {
      toast.error('Enter a domain first')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Backlink analysis failed')
      }

      setResult(data)
      toast.success('Backlink analysis ready')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to analyze backlinks')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <form onSubmit={analyzeDomain}>
        <label className="text-sm font-medium mb-2 block">Domain to Analyze</label>
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={event => setDomain(event.target.value)}
            placeholder="example.com"
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Backlinks</p>
          <p className="text-2xl font-bold">{result ? result.totalBacklinks.toLocaleString() : '—'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Referring Domains</p>
          <p className="text-2xl font-bold">{result ? result.referringDomains.toLocaleString() : '—'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Domain Authority</p>
          <p className="text-2xl font-bold">{result ? result.domainAuthority : '—'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Toxic Links %</p>
          <p className="text-2xl font-bold">{result ? `${result.toxicPercent}%` : '—'}</p>
        </Card>
      </div>

      {!result && (
        <Card className="p-6 text-center">
          <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            Enter a domain to analyze its backlinks
          </p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{result.domain}</p>
                <p className="text-xs text-muted-foreground">
                  {result.source === 'estimated' ? 'Estimated planning data' : 'AI backlink analysis'}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">{result.growthTrend}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{result.insights}</p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" />
              Top Backlink Opportunities
            </h2>
            <div className="space-y-3">
              {result.topBacklinks.map((link, index) => (
                <div key={`${link.domain}-${index}`} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{link.domain}</p>
                      <p className="truncate text-xs text-muted-foreground">Anchor: {link.anchor}</p>
                    </div>
                    <Badge className={qualityClass(link.quality)}>{link.quality}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">DA {link.da}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4" />
              Anchor Distribution
            </h2>
            <div className="space-y-2">
              {result.anchorDistribution.map(anchor => (
                <div key={anchor.anchor} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="truncate">{anchor.anchor}</span>
                  <span className="font-medium">{anchor.frequency}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
