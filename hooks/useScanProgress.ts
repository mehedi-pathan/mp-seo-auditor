'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ScanProgressState {
  progress: number
  step: string
  status: 'queued' | 'running' | 'complete' | 'error'
  errorMessage: string | null
}

interface ScanSessionRow {
  progress: number
  step: string
  status: ScanProgressState['status']
  error_message: string | null
}

const initialProgress: ScanProgressState = {
  progress: 0,
  step: 'Queued',
  status: 'queued',
  errorMessage: null,
}

export function useScanProgress(sessionId: string | null) {
  const [progress, setProgress] = useState<ScanProgressState>(initialProgress)

  useEffect(() => {
    if (!sessionId) {
      setProgress(initialProgress)
      return
    }

    let mounted = true

    const loadInitial = async () => {
      const { data } = await supabase
        .from('scan_sessions')
        .select('progress,step,status,error_message')
        .eq('id', sessionId)
        .maybeSingle()

      if (mounted && data) {
        const row = data as ScanSessionRow
        setProgress({
          progress: row.progress,
          step: row.step,
          status: row.status,
          errorMessage: row.error_message,
        })
      }
    }

    void loadInitial()

    const channel = supabase
      .channel(`scan-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_sessions',
          filter: `id=eq.${sessionId}`,
        },
        payload => {
          const row = payload.new as Partial<ScanSessionRow>
          setProgress(current => ({
            progress: typeof row.progress === 'number' ? row.progress : current.progress,
            step: typeof row.step === 'string' ? row.step : current.step,
            status: row.status || current.status,
            errorMessage: row.error_message ?? current.errorMessage,
          }))
        },
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [sessionId])

  return progress
}

