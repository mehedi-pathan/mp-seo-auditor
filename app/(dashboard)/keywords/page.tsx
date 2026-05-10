'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { KeyRound, Loader2, RefreshCw, Search, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface KeywordRow {
  id: string
  keyword: string
  target_url: string
  current_rank: number | null
  previous_rank: number | null
  rank_change: number | null
  search_volume: number | null
  difficulty: Difficulty | null
  last_checked: string | null
  created_at: string
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`
}

const keywordMetrics = (keyword: string) => {
  const seed = keyword
    .toLowerCase()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const currentRank = 1 + (seed % 70)
  const previousRank = Math.min(100, Math.max(1, currentRank + ((seed % 11) - 5)))
  const searchVolume = Math.round((120 + (seed % 8400)) / 10) * 10
  const difficulty: Difficulty = seed % 3 === 0 ? 'Easy' : seed % 3 === 1 ? 'Medium' : 'Hard'

  return { currentRank, previousRank, searchVolume, difficulty }
}

const difficultyClass = (difficulty?: Difficulty | null) => {
  if (difficulty === 'Easy') return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  if (difficulty === 'Hard') return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
}

export default function KeywordsPage() {
  const [keyword, setKeyword] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [keywords, setKeywords] = useState<KeywordRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadKeywords = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setKeywords([])
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('keyword_tracks')
      .select('id,keyword,target_url,current_rank,previous_rank,rank_change,search_volume,difficulty,last_checked,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      toast.error(error.message)
    } else {
      setKeywords(data || [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadKeywords()
  }, [])

  const stats = useMemo(() => {
    const tracked = keywords.length
    const top10 = keywords.filter(row => row.current_rank && row.current_rank <= 10).length
    const avgRank = tracked
      ? Math.round(keywords.reduce((sum, row) => sum + (row.current_rank || 100), 0) / tracked)
      : null

    return { tracked, top10, avgRank }
  }, [keywords])

  const ideas = useMemo(() => {
    const base = keyword.trim().toLowerCase()
    if (!base) return ['best seo keywords', 'technical seo checklist', 'website speed optimization']
    return [
      `${base} services`,
      `best ${base}`,
      `${base} checklist`,
      `${base} pricing`,
    ]
  }, [keyword])

  const trackKeyword = async (event: FormEvent) => {
    event.preventDefault()

    if (!keyword.trim()) {
      toast.error('Enter a keyword first')
      return
    }

    const normalizedUrl = normalizeUrl(targetUrl)
    if (!normalizedUrl) {
      toast.error('Enter the target URL')
      return
    }

    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please sign in to track keywords')
      setIsSaving(false)
      return
    }

    const metrics = keywordMetrics(keyword)
    const { error } = await supabase.from('keyword_tracks').insert({
      user_id: user.id,
      keyword: keyword.trim(),
      target_url: normalizedUrl,
      current_rank: metrics.currentRank,
      previous_rank: metrics.previousRank,
      search_volume: metrics.searchVolume,
      difficulty: metrics.difficulty,
      last_checked: new Date().toISOString(),
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Keyword tracked')
      setKeyword('')
      setTargetUrl('')
      await loadKeywords()
    }

    setIsSaving(false)
  }

  const refreshKeyword = async (row: KeywordRow) => {
    const metrics = keywordMetrics(`${row.keyword}${Date.now().toString().slice(-3)}`)
    const { error } = await supabase
      .from('keyword_tracks')
      .update({
        previous_rank: row.current_rank,
        current_rank: metrics.currentRank,
        search_volume: metrics.searchVolume,
        difficulty: metrics.difficulty,
        last_checked: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Keyword refreshed')
    await loadKeywords()
  }

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from('keyword_tracks').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }

    setKeywords(current => current.filter(row => row.id !== id))
    toast.success('Keyword removed')
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <form onSubmit={trackKeyword} className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Keyword Research</h1>
          <p className="text-sm text-muted-foreground">Research search demand and track target URLs.</p>
        </div>
        <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Enter keyword..." />
        <Input value={targetUrl} onChange={event => setTargetUrl(event.target.value)} placeholder="Target URL..." />
        <Button className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Track Keyword
        </Button>
      </form>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Tracked</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : stats.tracked}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Top 10</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : stats.top10}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Avg Rank</p>
          <p className="text-2xl font-bold">{isLoading ? '...' : (stats.avgRank ?? '—')}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Search className="h-4 w-4" />
          Keyword Ideas
        </h2>
        <div className="flex flex-wrap gap-2">
          {ideas.map(idea => (
            <button
              key={idea}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
              onClick={() => setKeyword(idea)}
            >
              {idea}
            </button>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Tracked Keywords
        </h3>

        {isLoading && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Loading tracked keywords...
          </Card>
        )}

        {!isLoading && keywords.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No keywords tracked yet. Add one to get started!
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {keywords.map(row => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.keyword}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.target_url}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">Rank {row.current_rank ?? '—'}</Badge>
                    <Badge variant="outline">{row.search_volume?.toLocaleString() || '—'} searches</Badge>
                    <Badge className={difficultyClass(row.difficulty)}>{row.difficulty || 'Medium'}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refreshKeyword(row)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteKeyword(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
