'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { Archive, ArrowRight, Calendar, ExternalLink, Globe2, ListChecks, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSemanticSearch } from '@/hooks/useSemanticSearch'
import { useAuditStore } from '@/store/useAuditStore'
import { loadLocalAuditArchive, removeLocalAudit, type LocalAuditArchiveItem } from '@/lib/localAuditArchive'
import Link from 'next/link'

type SortMode = 'latest' | 'highest' | 'lowest'

const scoreClass = (score: number) => {
  if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('latest')
  const [localArchive, setLocalArchive] = useState<LocalAuditArchiveItem[]>([])
  const { audits, isLoading, error, loadAudits, removeAudit } = useAuditStore()
  const { results: semanticResults, source: searchSource, isSearching } = useSemanticSearch(search)

  useEffect(() => {
    void loadAudits()
    setLocalArchive(loadLocalAuditArchive())
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

  const filteredLocalArchive = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? localArchive.filter(item =>
          item.audit.domain.toLowerCase().includes(query) ||
          item.audit.url.toLowerCase().includes(query)
        )
      : localArchive

    return [...filtered].sort((a, b) => {
      if (sort === 'highest') return b.audit.scores.seo - a.audit.scores.seo
      if (sort === 'lowest') return a.audit.scores.seo - b.audit.scores.seo
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    })
  }, [localArchive, search, sort])

  const deleteAudit = async (id: string) => {
    const { error } = await supabase.from('audits').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }

    removeAudit(id)
    toast.success('Audit deleted')
  }

  const deleteLocalAudit = (cacheId: string) => {
    removeLocalAudit(cacheId)
    setLocalArchive(loadLocalAuditArchive())
    toast.success('Removed from browser archive')
  }

  return (
    <div className="space-y-5 p-4 pb-24 lg:min-h-full lg:bg-[radial-gradient(circle_at_0%_0%,rgba(138,199,255,0.32),transparent_30%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_48%,#edf7ff_100%)] lg:p-8 xl:p-10 dark:lg:bg-[radial-gradient(circle_at_0%_0%,rgba(96,165,250,0.16),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)]">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <section className="rounded-[30px] border border-blue-200 bg-white/90 p-5 shadow-xl shadow-blue-100/60 backdrop-blur dark:border-blue-400/20 dark:bg-white/[0.06] dark:shadow-black/20 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                History
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white lg:text-4xl">Audit History</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Search saved scans, reopen browser archive results, and compare how domains are improving over time.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-[#f8fbff] p-1.5 dark:border-white/10 dark:bg-[#0d1727] lg:w-[360px]">
              {[
                ['latest', 'Latest'],
                ['highest', 'Highest'],
                ['lowest', 'Lowest'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={sort === value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-10 rounded-xl"
                  onClick={() => setSort(value as SortMode)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search naturally: "sites with slow performance"'
              className="h-12 rounded-2xl border-blue-100 bg-white pl-11 shadow-inner shadow-slate-100 dark:border-white/10 dark:bg-[#0d1727] dark:shadow-black/10"
            />
          </div>
          {search.trim().length > 1 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {isSearching
                ? 'Searching your audits...'
                : searchSource === 'semantic'
                  ? 'Showing semantic matches from saved audit insights.'
                  : 'Showing text matches from your saved audits.'}
            </p>
          )}
        </section>

        {domainStats.length > 0 && (
          <Card className="rounded-[28px] border-blue-100 bg-white/88 p-5 shadow-lg shadow-blue-100/45 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                Domains Checked
              </h2>
              <Badge variant="outline" className="rounded-full">{domainStats.length} domains</Badge>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {domainStats.slice(0, 6).map(domain => (
                <button
                  key={domain.domain}
                  className="min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-[#0d1727] dark:hover:bg-white/[0.06]"
                  onClick={() => setSearch(domain.domain)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950 dark:text-white">{domain.domain}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last checked {new Date(domain.latestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={scoreClass(domain.latestScore)}>SEO {domain.latestScore}</Badge>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{domain.count} saved audits</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {filteredLocalArchive.length > 0 && (
          <Card className="overflow-hidden rounded-[28px] border-blue-100 bg-white/88 shadow-lg shadow-blue-100/45 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="border-b border-blue-50 p-5 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <Archive className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                Browser Archive
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Recent scan results saved on this device. Open them again without database reads or rescanning.
              </p>
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredLocalArchive.slice(0, 9).map(item => (
                <div key={item.cacheId} className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        <Globe2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-950 dark:text-white">{item.audit.domain}</h3>
                        <p className="truncate text-xs text-muted-foreground">{item.audit.url}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Saved {new Date(item.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteLocalAudit(item.cacheId)}
                      title="Remove archived result"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Badge className={`justify-center ${scoreClass(item.audit.scores.seo)}`}>SEO {item.audit.scores.seo}</Badge>
                    <Badge className={`justify-center ${scoreClass(item.audit.scores.performance)}`}>Perf {item.audit.scores.performance}</Badge>
                    <Badge className={`justify-center ${scoreClass(item.audit.scores.accessibility)}`}>A11y {item.audit.scores.accessibility}</Badge>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 h-10 w-full rounded-xl bg-white dark:bg-[#08111f]">
                    <Link href={`/scan?cacheId=${encodeURIComponent(item.cacheId)}`}>
                      View archived result
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Saved Audits</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Showing {Math.min(filteredAudits.length, 10)} of {filteredAudits.length} matching scans.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full bg-white dark:bg-[#0d1727]">
              <Link href="/scan">
                New scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading && (
            <Card className="rounded-[24px] p-6 text-center text-sm text-muted-foreground">
              Loading saved audits...
            </Card>
          )}

          {!isLoading && filteredAudits.length === 0 && (
            <Card className="rounded-[24px] p-6 text-center">
              <p className="font-medium">No scans found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a scan while logged in and it will appear here.
              </p>
            </Card>
          )}

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredAudits.slice(0, 10).map(audit => (
              <Card key={audit.id} className="rounded-[24px] border-blue-100 bg-white/90 p-4 shadow-md shadow-blue-100/40 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-black text-slate-950 dark:text-white">{audit.domain}</h2>
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

                <div className="mt-4 flex items-center justify-between gap-2">
                  <a
                    href={audit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open website <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button asChild size="sm" variant="outline" className="h-9 rounded-xl bg-white dark:bg-[#08111f]">
                    <Link href={`/scan?url=${encodeURIComponent(audit.url)}`}>
                      Open report
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
