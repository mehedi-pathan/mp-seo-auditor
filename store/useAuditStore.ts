'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface AuditSummaryRow {
  id: string
  url: string
  domain: string
  seo_score: number
  performance_score: number
  accessibility_score: number
  created_at: string
}

interface AuditState {
  audits: AuditSummaryRow[]
  isLoading: boolean
  error: string | null
  loadedAt: number | null
  loadAudits: (force?: boolean) => Promise<void>
  removeAudit: (id: string) => void
  invalidate: () => void
}

const cacheMs = 60_000

export const useAuditStore = create<AuditState>((set, get) => ({
  audits: [],
  isLoading: false,
  error: null,
  loadedAt: null,

  loadAudits: async (force = false) => {
    const state = get()
    const isFresh = state.loadedAt !== null && Date.now() - state.loadedAt < cacheMs

    if (!force && (state.isLoading || isFresh)) return

    set({ isLoading: true, error: null })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      set({ audits: [], isLoading: false, loadedAt: Date.now() })
      return
    }

    const { data, error } = await supabase
      .from('audits')
      .select('id,url,domain,seo_score,performance_score,accessibility_score,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      set({ error: error.message, isLoading: false })
      return
    }

    set({
      audits: (data || []) as AuditSummaryRow[],
      isLoading: false,
      loadedAt: Date.now(),
    })
  },

  removeAudit: (id: string) => {
    set(state => ({
      audits: state.audits.filter(audit => audit.id !== id),
    }))
  },

  invalidate: () => set({ loadedAt: null }),
}))

