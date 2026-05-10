'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  BarChart3,
  ChevronRight,
  Crown,
  ExternalLink,
  KeyRound,
  Lightbulb,
  LogOut,
  Mail,
  Moon,
  Sun,
  TrendingUp,
  User,
  MessageCircle,
} from 'lucide-react'
import type { UserProfile } from '@/types'

interface AppSidebarProps {
  open: boolean
  user: UserProfile | null
  scansUsed: number
  scansLimit: number | null
  onClose: () => void
  onLogout: () => void
}

const menuItems = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Trends', href: '/trends', icon: TrendingUp },
  { label: 'Keywords', href: '/keywords', icon: KeyRound },
  { label: 'Tips Library', href: '/tips', icon: Lightbulb },
  { label: 'Upgrade Plan', href: '/upgrade', icon: Crown },
]

const whatsappUrl = 'https://wa.me/8801622839616?text=Hi%20MP%20SEO%20team%2C%20I%20need%20help%20improving%20my%20website%20SEO%2C%20speed%2C%20and%20performance.'
const emailUrl = 'mailto:mehedipathantext@gmail.com?subject=Website%20improvement%20request&body=Hi%20MP%20SEO%20team%2C%0A%0AI%20need%20help%20improving%20my%20website%20SEO%2C%20speed%2C%20and%20performance.%0A%0AWebsite%20URL%3A%20'

export function AppSidebar({ open, user, scansUsed, scansLimit, onClose, onLogout }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const fullName = user?.name?.trim() || 'User'
  const creditLabel = scansLimit === null ? 'Unlimited audits' : `${Math.max(scansLimit - scansUsed, 0)} of ${scansLimit} audits left`
  const usagePercent = scansLimit === null ? 100 : Math.min(100, (scansUsed / scansLimit) * 100)
  const isPaidPlan = user?.plan === 'pro' || user?.plan === 'business' || user?.plan === 'agency'
  const visibleMenuItems = isPaidPlan ? menuItems.filter(item => item.href !== '/upgrade') : menuItems

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <div className="relative h-dvh w-full max-w-[430px] overflow-hidden bg-transparent md:h-[min(860px,calc(100dvh-32px))] md:rounded-3xl">
            <motion.aside
              className="absolute right-0 top-0 flex h-full w-[min(88%,352px)] flex-col overflow-hidden rounded-l-3xl border-l border-border bg-background shadow-2xl md:w-[min(82%,344px)] dark:bg-[#0d1727]"
              initial={{ x: '105%', opacity: 0.92 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '105%', opacity: 0.92 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.8 }}
              onClick={(event) => event.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-3 border-b border-border p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-sm">
                  <img
                    src="/mp-seo-logo.jpeg"
                    alt="MP SEO Auditor"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">MP SEO Auditor</p>
                  <a
                    href="https://mehedipathan.online"
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    Mehedi Pathan
                  </a>
                </div>
              </div>
              <motion.button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-white/[0.04]"
                aria-label="Close menu"
                title="Close menu"
                onClick={onClose}
                whileHover={{ scale: 1.04, rotate: -1 }}
                whileTap={{ scale: 0.9, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                <img
                  src="/menu-close-icon.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5 object-contain dark:invert"
                />
              </motion.button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
              <div className="rounded-xl border border-border bg-muted/35 p-3">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || 'No email available'}</p>
                  </div>
                  <span className="rounded-full bg-primary/35 px-3 py-1 text-xs font-medium text-primary">
                    {user?.plan || 'free'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current plan</span>
                    <span className="font-medium capitalize">{user?.plan || 'free'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-medium">{creditLabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent}%` }} />
                  </div>
                </div>
              </div>

              <nav className="grid gap-0.5">
                {visibleMenuItems.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={onClose}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-3 shadow-sm dark:border-blue-400/20 dark:from-blue-500/10 dark:via-white/[0.04] dark:to-emerald-500/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-slate-950 dark:text-white">Need website help?</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      For redesign your site or only SEO improvement, contact MP SEO team.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-[#0d1727] dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                  <a
                    href={emailUrl}
                    className="inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-400/20 dark:bg-[#0d1727] dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border bg-background p-3.5">
              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-left shadow-sm transition-colors hover:bg-blue-100/70 dark:border-blue-400/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-blue-500/15 dark:text-blue-300">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-red-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-red-500/10"
                onClick={onLogout}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm dark:bg-red-500/15 dark:text-red-300">
                  <LogOut className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">Sign out</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Log out from your account</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="px-2 pb-1 pt-3 text-center">
                <div className="mb-2 h-px bg-border" />
                <p className="text-[10px] text-muted-foreground">
                  Developed by{' '}
                  <a
                    href="https://mehedipathan.online"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    Mehedi Pathan
                  </a>
                </p>
              </div>
            </div>
            </motion.aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
