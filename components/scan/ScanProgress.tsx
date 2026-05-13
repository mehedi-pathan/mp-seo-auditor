'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { FileSearch, FileText, Globe2, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react'
import type { ScanProgressState } from '@/hooks/useScanProgress'

const steps = [
  { label: 'Crawling', detail: 'Fetching live page content', cap: 22, icon: Globe2 },
  { label: 'Analyzing', detail: 'Reading metadata and structure', cap: 44, icon: FileSearch },
  { label: 'Checking issues', detail: 'Testing SEO, speed, and trust signals', cap: 76, icon: ShieldCheck },
  { label: 'Generating report', detail: 'Preparing charts and recommendations', cap: 96, icon: FileText },
]

const scanMessages = [
  'MP SEO uses a Google-style audit engine to inspect your page the way modern crawlers understand content, speed, links, and structure.',
  'Every scan checks 50+ SEO factors across metadata, headings, performance, accessibility, social previews, links, and technical health.',
  'We combine live page crawling with PageSpeed signals so developers can see what to fix first instead of guessing from generic advice.',
  'Your report is built for action: clear scores, priority issues, device insights, and exportable data your team can use immediately.',
  'A stronger SEO audit starts with better evidence, so we test the URL, refine the result, and turn the findings into practical next steps.',
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const realtimeProgress = progressState?.progress && progressState.progress > 0 ? progressState.progress : 0
  const hasRealtimeProgress = typeof progressState?.progress === 'number' && progressState.progress > 0

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
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const target = progressState?.status === 'complete' ? 100 : hasRealtimeProgress ? realtimeProgress : fallbackProgress
    setDisplayProgress(prev => Math.max(prev, Math.min(100, target)))
  }, [fallbackProgress, hasRealtimeProgress, realtimeProgress, progressState?.status])

  useEffect(() => {
    const siteHash = displayUrl(url)
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)
    setMessageIndex(siteHash % scanMessages.length)

    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % scanMessages.length)
    }, 6800)

    return () => clearInterval(interval)
  }, [url])

  const currentStep = useMemo(() => {
    const index = steps.findIndex(step => displayProgress <= step.cap)
    return index === -1 ? steps.length - 1 : index
  }, [displayProgress])

  const siteName = displayUrl(url)
  const isRefining = displayProgress >= 100 && progressState?.status !== 'complete'
  const isComplete = progressState?.status === 'complete'
  const estimatedTotalSeconds = 34
  const etaSeconds = isRefining || isComplete ? 0 : Math.max(3, Math.ceil(estimatedTotalSeconds * (1 - displayProgress / 100)))
  const timeLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  const stepLabel = isRefining
    ? 'Refining your report...'
    : isComplete
      ? 'Scan complete'
    : progressState?.step && progressState.step !== 'Queued'
      ? progressState.step
      : steps[currentStep].detail
  const roundedProgress = Math.round(displayProgress)
  const fillHeight = Math.max(8, Math.min(100, displayProgress))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto flex min-h-[680px] w-full max-w-5xl flex-col justify-center overflow-hidden px-4 py-8 text-center sm:px-6 lg:py-10"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(138,199,255,0.22),transparent_62%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(59,130,246,0.16),transparent_62%)]" />
      <div className="relative mx-auto w-full max-w-4xl rounded-[34px] border border-blue-100/80 bg-[#f7fbff]/78 p-5 shadow-[0_28px_90px_rgba(96,165,250,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1524]/72 dark:shadow-black/25 sm:p-8">
        <div className="relative mx-auto mb-6 h-56 w-56 sm:h-64 sm:w-64">
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-200/70 dark:border-blue-300/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.65)]" />
          </motion.div>
          <motion.div
            className="absolute inset-8 rounded-full border border-emerald-200/70 dark:border-emerald-300/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute bottom-1/2 right-0 h-2.5 w-2.5 translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)]" />
          </motion.div>
          <motion.div
            className="absolute inset-14 rounded-full border border-violet-200/70 dark:border-violet-300/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 9.5, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_14px_rgba(139,92,246,0.6)]" />
          </motion.div>

          <div className="absolute inset-12 overflow-hidden rounded-full border-[7px] border-white/80 bg-[linear-gradient(180deg,#ffffff,#eff7ff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_50px_rgba(96,165,250,0.20)] dark:border-white/10 dark:bg-slate-950">
            <motion.div
              className="mp-scan-water absolute inset-x-0 bottom-0"
              animate={{ height: `${fillHeight}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 16 }}
            >
              <div className="mp-scan-wave mp-scan-wave-one" />
              <div className="mp-scan-wave mp-scan-wave-two" />
              <div className="mp-scan-wave mp-scan-wave-three" />
            </motion.div>

            <div className="absolute inset-0 grid place-items-center">
              <div className="px-5 py-4 text-center">
                <div className="text-4xl font-black tabular-nums text-slate-950 dark:text-white">{roundedProgress}%</div>
                <div className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isRefining ? 'Refining' : isComplete ? 'Complete' : 'Scanning'}
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                  ETA {timeLabel(etaSeconds)}
                </div>
              </div>
            </div>
          </div>

          <motion.div
            className="absolute inset-6 rounded-full border border-blue-100/70"
            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.65, 0.25] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">{stepLabel}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {isRefining ? 'The scan reached 100%. Sit back while we polish the final recommendations for ' : 'Crawling and analyzing '}
            <span className="font-black text-slate-900 dark:text-white">{siteName}</span>
            {isRefining ? '.' : '. Please keep this page open while the audit engine collects the best result.'}
          </p>
          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-blue-100/70 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa,#2563eb,#7c3aed)]"
              animate={{ width: `${displayProgress}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span>Elapsed {timeLabel(elapsedSeconds)}</span>
            <span>{roundedProgress}%</span>
          </div>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            const previousCap = i === 0 ? 0 : steps[i - 1].cap
            const complete = roundedProgress >= step.cap || isComplete
            const active = !complete && roundedProgress >= previousCap && i === currentStep
            const pending = !complete && !active
            return (
              <div key={step.label} className="relative flex flex-col items-center rounded-2xl border border-blue-100/70 bg-white/42 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="grid h-11 w-11 place-items-center">
                  {complete ? (
                    <img src="/scan-phase-complete.svg" alt="" className="h-8 w-8 object-contain" />
                  ) : active ? (
                    <img src="/scan-phase-reload.svg" alt="" className="h-8 w-8 animate-spin object-contain" />
                  ) : (
                    <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  )}
                </span>
                <p
                  className={`mt-2 text-xs font-black ${
                    complete
                      ? 'text-emerald-700 dark:text-emerald-200'
                      : active
                        ? 'text-blue-700 dark:text-blue-200'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 line-clamp-2 text-center text-[11px] leading-4 text-muted-foreground">{step.detail}</p>
                {pending && <span className="mt-2 h-1 w-8 rounded-full bg-slate-200 dark:bg-white/10" />}
              </div>
            )
          })}
        </div>

        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-blue-100/70 bg-blue-50/60 p-4 text-left dark:border-blue-400/15 dark:bg-blue-500/10"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{scanMessages[messageIndex]}</p>
        </motion.div>

        {isRefining && (
          <div className="mx-auto mt-8 w-full max-w-3xl space-y-4 rounded-3xl border border-blue-100/70 bg-white/50 p-5 text-left dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                <SearchCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-slate-950 dark:text-white">Report preview is being prepared</p>
                <p className="text-xs text-muted-foreground">Charts, issue groups, and developer fixes are loading into place.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
