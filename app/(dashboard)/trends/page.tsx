'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useAuditStore } from '@/store/useAuditStore'

type Range = '7d' | '30d' | '90d' | 'All'

const ranges: Range[] = ['7d', '30d', '90d', 'All']

const rangeCutoff = (range: Range) => {
  if (range === 'All') return 0
  const days = Number(range.replace('d', ''))
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.getTime()
}

export default function TrendsPage() {
  const { audits, isLoading, loadAudits } = useAuditStore()
  const [selectedDomain, setSelectedDomain] = useState('')
  const [range, setRange] = useState<Range>('30d')

  useEffect(() => {
    void loadAudits()
  }, [loadAudits])

  const domains = useMemo(() => {
    return Array.from(new Set(audits.map(audit => audit.domain))).sort()
  }, [audits])

  useEffect(() => {
    if (!selectedDomain && domains[0]) setSelectedDomain(domains[0])
  }, [domains, selectedDomain])

  const domainAudits = useMemo(() => {
    const cutoff = rangeCutoff(range)

    return audits
      .filter(audit => audit.domain === selectedDomain)
      .filter(audit => range === 'All' || new Date(audit.created_at).getTime() >= cutoff)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [audits, range, selectedDomain])

  const chartData = useMemo(() => {
    return domainAudits.map((audit, index) => ({
      label: `${index + 1}`,
      date: new Date(audit.created_at).toLocaleDateString(),
      seo: audit.seo_score,
      performance: audit.performance_score,
      accessibility: audit.accessibility_score,
    }))
  }, [domainAudits])

  const stats = useMemo(() => {
    if (domainAudits.length === 0) {
      return { best: null, worst: null, average: null, total: 0, change: null }
    }

    const scores = domainAudits.map(audit => audit.seo_score)
    const first = scores[0]
    const latest = scores[scores.length - 1]

    return {
      best: Math.max(...scores),
      worst: Math.min(...scores),
      average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      total: domainAudits.length,
      change: latest - first,
    }
  }, [domainAudits])

  return (
    <div className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">SEO Trends</h1>
        <p className="text-sm text-muted-foreground">
          Track how each domain improves across repeated audits.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Select Domain</label>
        <select
          value={selectedDomain}
          onChange={event => setSelectedDomain(event.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        >
          {domains.length === 0 ? (
            <option value="">No domains yet</option>
          ) : (
            domains.map(domain => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Time Period</label>
        <div className="grid grid-cols-4 gap-2">
          {ranges.map(item => (
            <Button
              key={item}
              variant={range === item ? 'default' : 'outline'}
              size="sm"
              className="min-w-0"
              onClick={() => setRange(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Best Score</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : (stats.best ?? '-')}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Worst Score</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : (stats.worst ?? '-')}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : (stats.average ?? '-')}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Audits</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
        </Card>
      </div>

      {stats.change !== null && (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">SEO movement</p>
            <p className="text-sm text-muted-foreground">
              Compared from first audit to latest audit in this period.
            </p>
          </div>
          <Badge
            className={
              stats.change >= 0
                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
            }
          >
            {stats.change >= 0 ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
            {stats.change >= 0 ? '+' : ''}
            {stats.change}
          </Badge>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-4">
          <h2 className="font-semibold">Score Trend</h2>
          <p className="text-xs text-muted-foreground">
            SEO, performance, and accessibility scores over saved audits.
          </p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Scan a domain more than once to see improvement trends.
            </p>
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                  }}
                />
                <Line type="monotone" dataKey="seo" name="SEO" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="performance" name="Performance" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="accessibility" name="A11y" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {domains.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Domains List</h2>
          <div className="space-y-2">
            {domains.map(domain => {
              const count = audits.filter(audit => audit.domain === domain).length
              return (
                <button
                  key={domain}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-accent"
                  onClick={() => setSelectedDomain(domain)}
                >
                  <span className="min-w-0 truncate text-sm font-medium">{domain}</span>
                  <Badge variant="outline">{count} audits</Badge>
                </button>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

