'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

interface TabNavProps {
  tabs: string[]
  activeTab: number
  onChange: (index: number) => void
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -160 : 160,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative -mx-4 border-b border-border">
      <button
        type="button"
        aria-label="Scroll tabs left"
        onClick={() => scrollTabs('left')}
        className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll tabs right"
        onClick={() => scrollTabs('right')}
        className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background via-background/80 to-transparent" />
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto overscroll-x-contain scroll-smooth px-11 [touch-action:pan-x] [scrollbar-width:thin]"
      >
        <div className="flex w-max min-w-full gap-1 px-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`relative shrink-0 rounded-t-lg px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === i ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === i && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
