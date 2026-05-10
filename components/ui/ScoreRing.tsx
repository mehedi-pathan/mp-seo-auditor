'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  label: string
  color: string
  size?: 'sm' | 'md'
}

export function ScoreRing({ score, label, color, size = 'md' }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (displayScore < score) {
      interval = setInterval(() => {
        setDisplayScore(prev => Math.min(prev + 2, score))
      }, 20)
    }
    return () => clearInterval(interval)
  }, [score, displayScore])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (displayScore / 100) * circumference
  const ringSize = size === 'sm' ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-32 w-32'
  const numberSize = size === 'sm' ? 'text-2xl sm:text-3xl' : 'text-3xl'

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className={`relative ${ringSize}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
          <motion.circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`${numberSize} font-bold`}>{displayScore}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </motion.div>
        </div>
      </div>
      <span className="max-w-full truncate text-center text-xs font-medium sm:text-sm">{label}</span>
    </div>
  )
}
