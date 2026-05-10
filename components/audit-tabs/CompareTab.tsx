'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Trophy } from 'lucide-react'
import type { AuditResult } from '@/types'
import { toast } from 'sonner'

interface CompareTabProps {
  audit: AuditResult
}

const diffTone = (value: number) => {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

export function CompareTab({ audit }: CompareTabProps) {
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [competitor, setCompetitor] = useState<AuditResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runCompare = async () => {
    const url = normalizeUrl(competitorUrl)

    if (!url) {
      toast.error('Enter a competitor URL')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) throw new Error('Competitor scan failed')
      setCompetitor(await response.json())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Competitor scan failed')
    } finally {
      setIsLoading(false)
    }
  }

  const rows = competitor
    ? [
        ['SEO Score', audit.scores.seo, competitor.scores.seo],
        ['Performance', audit.scores.performance, competitor.scores.performance],
        ['Accessibility', audit.scores.accessibility, competitor.scores.accessibility],
        ['Title Length', audit.meta.titleLength, competitor.meta.titleLength],
        ['Description Length', audit.meta.descriptionLength, competitor.meta.descriptionLength],
        ['Word Count', audit.content.wordCount, competitor.content.wordCount],
        ['Internal Links', audit.links.internal.count, competitor.links.internal.count],
        ['External Links', audit.links.external.count, competitor.links.external.count],
        ['PageSpeed SEO', audit.pageSpeed?.scores.seo || 0, competitor.pageSpeed?.scores.seo || 0],
      ]
    : []

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold">Competitor Comparison</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan a competitor page and compare the signals developers can improve first.
        </p>
      </div>

      <div className="grid gap-2">
        <Input
          value={competitorUrl}
          onChange={event => setCompetitorUrl(event.target.value)}
          placeholder="competitor.com/page"
          disabled={isLoading}
        />
        <Button onClick={runCompare} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Compare
        </Button>
      </div>

      {!competitor && (
        <Card className="p-4 text-sm text-muted-foreground">
          Tip: compare pages with the same intent, like a service page against another service page.
        </Card>
      )}

      {competitor && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Your page</p>
              <p className="break-words font-semibold">{audit.domain}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Competitor</p>
              <p className="break-words font-semibold">{competitor.domain}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['SEO', audit.scores.seo, competitor.scores.seo],
              ['Speed', audit.scores.performance, competitor.scores.performance],
              ['A11y', audit.scores.accessibility, competitor.scores.accessibility],
              ['Words', audit.content.wordCount, competitor.content.wordCount],
            ].map(([label, mine, theirs]) => {
              const myValue = Number(mine)
              const theirValue = Number(theirs)
              const winner = myValue === theirValue ? 'Tie' : myValue > theirValue ? 'You' : 'Competitor'

              return (
                <Card key={label} className="p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{mine}</p>
                      <p className="text-[10px] text-muted-foreground">You</p>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">VS</span>
                    <div>
                      <p className="text-lg font-bold">{theirs}</p>
                      <p className="text-[10px] text-muted-foreground">Them</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-3 w-full justify-center gap-1 whitespace-normal">
                    <Trophy className="h-3 w-3" />
                    {winner}
                  </Badge>
                </Card>
              )
            })}
          </div>

          <div className="space-y-2">
            {rows.map(([label, mine, theirs]) => {
              const difference = Number(mine) - Number(theirs)
              return (
                <div key={label} className="grid grid-cols-[minmax(0,1.25fr)_auto_auto_auto] items-center gap-2 rounded-lg border border-border p-3 text-sm">
                  <span className="break-words font-medium">{label}</span>
                  <span>{mine}</span>
                  <span>{theirs}</span>
                  <span className={`font-semibold ${diffTone(difference)}`}>
                    {difference > 0 ? '+' : ''}{difference}
                  </span>
                </div>
              )
            })}
          </div>

          <Card className="p-4">
            <h4 className="mb-3 font-semibold">What to improve first</h4>
            <div className="space-y-2">
              {rows
                .filter(([, mine, theirs]) => Number(mine) < Number(theirs))
                .slice(0, 4)
                .map(([label, mine, theirs]) => (
                  <div key={label} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words">{label}</span>
                    <Badge variant="outline" className="shrink-0">Behind by {Number(theirs) - Number(mine)}</Badge>
                  </div>
                ))}
              {rows.every(([, mine, theirs]) => Number(mine) >= Number(theirs)) && (
                <p className="text-sm text-muted-foreground">
                  Your page is ahead on the compared numeric signals. Focus on message clarity, trust signals, and conversion content.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
