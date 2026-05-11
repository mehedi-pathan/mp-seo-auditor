'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { ScanProgressState } from '@/hooks/useScanProgress'

const steps = [
  { label: 'Fetching page...', cap: 22 },
  { label: 'Parsing HTML structure...', cap: 40 },
  { label: 'Analyzing SEO signals...', cap: 58 },
  { label: 'Running PageSpeed Insights...', cap: 84 },
  { label: 'Building developer report...', cap: 96 },
]

interface ScanProgressProps {
  url?: string
  progressState?: ScanProgressState
}

const displayUrl = (url?: string) => {
  if (!url) return 'your website'

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || url
  }
}

export function ScanProgress({ url, progressState }: ScanProgressProps) {
  const [fallbackProgress, setFallbackProgress] = useState(4)
  const [displayProgress, setDisplayProgress] = useState(4)
  const realtimeProgress = progressState?.progress && progressState.progress > 0 ? progressState.progress : 0

  useEffect(() => {
    const interval = setInterval(() => {
      setFallbackProgress(prev => {
        if (prev >= 100) return 100
        const step = prev < 60 ? 5 : prev < 90 ? 2.8 : 1.4
        return Math.min(100, prev + step + Math.random() * 1.4)
      })
    }, 650)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const target = progressState?.status === 'complete' ? 100 : Math.max(fallbackProgress, realtimeProgress)
    setDisplayProgress(prev => Math.max(prev, Math.min(100, target)))
  }, [fallbackProgress, realtimeProgress, progressState?.status])

  const currentStep = useMemo(() => {
    const index = steps.findIndex(step => displayProgress <= step.cap)
    return index === -1 ? steps.length - 1 : index
  }, [displayProgress])

  const siteName = displayUrl(url)
  const isRefining = displayProgress >= 100 && progressState?.status !== 'complete'
  const stepLabel = isRefining
    ? 'Refining your report...'
    : progressState?.step && progressState.step !== 'Queued'
      ? progressState.step
      : steps[currentStep].label

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[620px] w-full max-w-md flex-col justify-center px-4 py-10 text-center"
    >
      <div className="mb-8">
        <div className="relative mx-auto mb-7 h-36 w-36">
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/10"
            animate={{ scale: [1, 1.16, 1], opacity: [0.6, 0.12, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-4 rounded-full border-[6px] border-primary/15" />
          <motion.div
            className="absolute inset-4 rounded-full border-[6px] border-transparent border-t-primary border-r-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-7 rounded-full border-2 border-transparent border-b-primary/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{Math.round(displayProgress)}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">{stepLabel}</h2>
          <p className="mx-auto mb-4 max-w-xs text-sm text-muted-foreground">
            {isRefining ? 'The scan is complete. We are refining the final report for ' : 'Crawling and analyzing '}
            <span className="font-medium text-foreground">{siteName}</span>
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${displayProgress}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full"
              animate={{
                backgroundColor: i <= currentStep ? '#2563eb' : '#e5e7eb',
                scale: i === currentStep ? 1.25 : 1,
              }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
      </div>

      <p className="mx-auto max-w-xs text-sm text-muted-foreground">
        {isRefining
          ? 'Almost there. Preparing charts, insights, and developer friendly recommendations.'
          : 'PageSpeed Insights can take a little longer because Google runs a mobile Lighthouse crawl.'}
      </p>

      {isRefining && (
        <div className="mx-auto mt-8 w-full max-w-sm space-y-3 rounded-3xl border border-blue-100 bg-white/75 p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      )}
    </motion.div>
  )
}
