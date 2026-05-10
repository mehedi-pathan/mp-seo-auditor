'use client'

import { Crown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/types'
import { getPlanDisplay } from '@/lib/planDisplay'

interface TopBarProps {
  userName?: string | null
  plan?: Plan | null
  onMenuOpen: () => void
}

export function TopBar({ plan = 'free', onMenuOpen }: TopBarProps) {
  const activePlan = getPlanDisplay(plan)
  const PlanIcon = activePlan.icon
  const isPaidPlan = plan === 'pro' || plan === 'business' || plan === 'agency'

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm dark:bg-[#08111f]/95">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/mp-seo-logo.jpeg"
            alt="MP SEO Auditor"
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-border"
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-foreground">SEO Auditor</h1>
            <motion.p className="truncate text-xs text-muted-foreground">
              Mehedi Pathan
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/upgrade"
            prefetch
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${activePlan.badgeClass}`}
            title={`${activePlan.label} plan`}
          >
            <PlanIcon className="h-3.5 w-3.5" />
            {activePlan.label}
          </Link>
          {!isPaidPlan && (
            <Button
              asChild
              size="sm"
              className="hidden h-8 rounded-full px-3 text-xs sm:inline-flex"
            >
              <Link href="/upgrade" prefetch>
                <Crown className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            </Button>
          )}
          <motion.button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-white/[0.04]"
            aria-label="Open menu"
            title="Open menu"
            onClick={onMenuOpen}
            whileHover={{ scale: 1.04, rotate: 1 }}
            whileTap={{ scale: 0.9, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          >
            <img
              src="/menu-button-icon.svg"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain dark:invert"
            />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
