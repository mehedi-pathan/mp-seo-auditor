'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface SemanticAuditResult {
  id: string
  url: string
  domain: string
  seo_score: number
  performance_score: number
  accessibility_score: number
  created_at: string
  similarity?: number
}

interface SemanticSearchResponse {
  results?: SemanticAuditResult[]
  source?: 'semantic' | 'text'
  error?: string
}

export function useSemanticSearch(query: string) {
  const [results, setResults] = useState<SemanticAuditResult[] | null>(null)
  const [source, setSource] = useState<'semantic' | 'text' | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults(null)
      setSource(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearching(true)

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const response = await fetch('/api/semantic-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        })

        const json = (await response.json()) as SemanticSearchResponse
        if (!response.ok) throw new Error(json.error || 'Search failed')

        setResults(json.results || [])
        setSource(json.source || 'text')
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[semantic-search]', error)
          setResults([])
          setSource('text')
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, source, isSearching }
}

