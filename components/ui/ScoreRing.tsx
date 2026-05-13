'use client'

import { useId } from 'react'

interface ScoreRingProps {
  score: number
  label: string
  color: string
  size?: 'sm' | 'md'
}

export function ScoreRing({ score, label, color, size = 'md' }: ScoreRingProps) {
  const id = useId().replace(/:/g, '')
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))
  const gaugeSize = size === 'sm' ? 112 : 132
  const strokeWidth = size === 'sm' ? 9 : 10
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalizedScore / 100) * circumference

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div
        className="relative grid place-items-center rounded-[2rem] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_45px_rgba(96,165,250,0.14)] ring-1 ring-blue-100/80 backdrop-blur dark:bg-white/[0.045] dark:shadow-black/20 dark:ring-white/10"
        style={{ height: gaugeSize, width: gaugeSize }}
      >
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`score-ring-${id}`} x1="16" y1="20" x2="104" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={color} stopOpacity="0.72" />
              <stop offset="52%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.82" />
            </linearGradient>
            <filter id={`score-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.20 0 0 0 0 0.54 0 0 0 0 0.96 0 0 0 0.22 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200/80 dark:text-white/10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(#score-ring-${id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            filter={`url(#score-glow-${id})`}
            className="origin-center -rotate-90 transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <div className="relative text-center">
          <p className={size === 'sm' ? 'text-3xl font-black leading-none text-slate-950 dark:text-white' : 'text-4xl font-black leading-none text-slate-950 dark:text-white'}>
            {normalizedScore}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">Score</p>
        </div>
      </div>
      <span className="max-w-full truncate text-center text-xs font-medium sm:text-sm">{label}</span>
    </div>
  )
}
