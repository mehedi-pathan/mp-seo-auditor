'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { Calendar, ExternalLink, ListChecks, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSemanticSearch } from '@/hooks/useSemanticSearch'
import { useAuditStore } from '@/store/useAuditStore'

type SortMode = 'latest' | 'highest' | 'lowest'

const scoreClass = (score: number) => {
  if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('latest')
  const { audits, isLoading, error, loadAudits, removeAudit } = useAuditStore()
  const { results: semanticResults, source: searchSource, isSearching } = useSemanticSearch(search)

  useEffect(() => {
    void loadAudits()
  }, [loadAudits])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const filteredAudits = useMemo(() => {
    const query = search.trim().toLowerCase()
    const baseAudits = query && semanticResults && semanticResults.length > 0 ? semanticResults : audits
    const filtered = query && (!semanticResults || semanticResults.length === 0)
      ? baseAudits.filter(audit =>
          audit.domain.toLowerCase().includes(query) ||
          audit.url.toLowerCase().includes(query)
        )
      : baseAudits

    return [...filtered].sort((a, b) => {
      if (sort === 'highest') return b.seo_score - a.seo_score
      if (sort === 'lowest') return a.seo_score - b.seo_score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [audits, semanticResults, search, sort])

  const domainStats = useMemo(() => {
    const grouped = audits.reduce<Record<string, {
      domain: string
      count: number
      latestScore: number
      latestDate: string
    }>>((acc, audit) => {
      const existing = acc[audit.domain]
      const isNewer = !existing || new Date(audit.created_at).getTime() > new Date(existing.latestDate).getTime()

      acc[audit.domain] = {
        domain: audit.domain,
        count: (existing?.count || 0) + 1,
        latestScore: isNewer ? audit.seo_score : existing.latestScore,
        latestDate: isNewer ? audit.created_at : existing.latestDate,
      }

      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))
  }, [audits])

  const deleteAudit = async (id: string) => {
    const { error } = await supabase.from('audits').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }

    removeAudit(id)
    toast.success('Audit deleted')
  }

  return (
    <div className="space-y-5 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Audit History</h1>
        <p className="text-sm text-muted-foreground">Search, compare, and clean up saved website scans.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder='Search naturally: "sites with slow performance"'
          className="h-10 pl-9"
        />
      </div>
      {search.trim().length > 1 && (
        <p className="text-xs text-muted-foreground">
          {isSearching
            ? 'Searching your audits...'
            : searchSource === 'semantic'
              ? 'Showing semantic matches from saved audit insights.'
              : 'Showing text matches from your saved audits.'}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          ['latest', 'Latest'],
          ['highest', 'Highest'],
          ['lowest', 'Lowest'],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={sort === value ? 'default' : 'outline'}
            size="sm"
            className="min-w-0"
            onClick={() => setSort(value as SortMode)}
          >
            {label}
          </Button>
        ))}
      </div>

      {domainStats.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4" />
            Domains Checked
          </h2>
          <div className="space-y-2">
            {domainStats.map(domain => (
              <button
                key={domain.domain}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-accent"
                onClick={() => setSearch(domain.domain)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{domain.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    Last checked {new Date(domain.latestDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="outline">{domain.count} audits</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">SEO {domain.latestScore}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Loading saved audits...
          </Card>
        )}

        {!isLoading && filteredAudits.length === 0 && (
          <Card className="p-6 text-center">
            <p className="font-medium">No scans found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run a scan while logged in and it will appear here.
            </p>
          </Card>
        )}

        {filteredAudits.slice(0, 10).map(audit => (
          <Card key={audit.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{audit.domain}</h2>
                <p className="truncate text-xs text-muted-foreground">{audit.url}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(audit.created_at).toLocaleString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteAudit(audit.id)}
                title="Delete audit"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Badge className={`justify-center ${scoreClass(audit.seo_score)}`}>SEO {audit.seo_score}</Badge>
              <Badge className={`justify-center ${scoreClass(audit.performance_score)}`}>Perf {audit.performance_score}</Badge>
              <Badge className={`justify-center ${scoreClass(audit.accessibility_score)}`}>A11y {audit.accessibility_score}</Badge>
            </div>

            <a
              href={audit.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open website <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {Math.min(filteredAudits.length, 10)} of {filteredAudits.length} matching scans.
      </p>
    </div>
  )
}
