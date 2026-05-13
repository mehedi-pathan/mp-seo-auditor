'use client'

import { MobileShell } from '@/components/layout/MobileShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Plan, UserProfile } from '@/types'
import { getEffectivePlan } from '@/lib/planAccess'
import { getPlanDisplay } from '@/lib/planDisplay'
import { subscribeGlobalScan, type ClientScanJobSnapshot } from '@/lib/clientScanManager'
import { useScanProgress } from '@/hooks/useScanProgress'
import { LoadingMark } from '@/components/loading/RouteLoading'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  ExternalLink,
  Mail,
  MessageCircle,
  RefreshCw,
  User,
} from 'lucide-react'

const dashboardRoutes = [
  '/dashboard',
  '/scan',
  '/history',
  '/backlinks',
  '/profile',
  '/trends',
  '/tips',
  '/upgrade',
]

const desktopNavItems = [
  { label: 'Dashboard', href: '/dashboard', iconSrc: '/desktop-home-icon.svg' },
  { label: 'Scan', href: '/scan', iconSrc: '/desktop-search-icon.svg' },
  { label: 'Tips Library', href: '/tips', iconSrc: '/desktop-tips-icon.svg' },
  { label: 'History', href: '/history', iconSrc: '/desktop-history-icon.svg' },
  { label: 'Backlinks', href: '/backlinks', iconSrc: '/desktop-link-icon.svg' },
  { label: 'Trends', href: '/trends', iconSrc: '/desktop-trending-icon.svg' },
  { label: 'Profile', href: '/profile', iconSrc: '/desktop-profile-icon.svg' },
]

const whatsappUrl = 'https://wa.me/8801622839616?text=Hi%20MP%20SEO%20team%2C%20I%20need%20help%20improving%20my%20website%20SEO%2C%20speed%2C%20and%20performance.'
const emailUrl = 'mailto:mehedipathantext@gmail.com?subject=Website%20improvement%20request&body=Hi%20MP%20SEO%20team%2C%0A%0AI%20need%20help%20improving%20my%20website%20SEO%2C%20speed%2C%20and%20performance.%0A%0AWebsite%20URL%3A%20'

interface GlobalScanStatusProps {
  scan: ClientScanJobSnapshot | null
  progress: number
  collapsed?: boolean
}

function GlobalScanStatus({ scan, progress, collapsed = false }: GlobalScanStatusProps) {
  if (!scan) return null

  const domain = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const isRunning = scan.status === 'running'
  const isComplete = scan.status === 'complete'
  const displayedProgress = Math.round(Math.max(1, Math.min(100, progress)))
  const label = isRunning ? `Scanning ${displayedProgress}%` : isComplete ? 'Report ready' : 'Scan failed'
  const Icon = isComplete ? CheckCircle2 : scan.status === 'error' ? AlertTriangle : RefreshCw

  if (collapsed) {
    return (
      <Link
        href="/scan"
        prefetch
        className={`group relative grid h-11 w-11 place-items-center rounded-2xl border shadow-sm transition-colors ${
          isComplete
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
            : scan.status === 'error'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'
              : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200'
        }`}
        title={label}
      >
        <Icon className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0b1626]" />}
        <span className="pointer-events-none absolute right-[calc(100%+10px)] z-50 max-w-56 truncate rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 opacity-0 shadow-lg shadow-blue-100/60 transition-opacity delay-500 duration-200 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:shadow-black/30">
          {label}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/scan"
      prefetch
      className="block rounded-[22px] border border-blue-100 bg-blue-50/80 p-3 text-sm shadow-sm transition-colors hover:bg-blue-100/80 dark:border-blue-400/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-200">
          <Icon className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''}`} />
        </span>
        <span className="min-w-0">
          <span className="block font-black text-slate-950 dark:text-white">{label}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{domain}</span>
        </span>
      </div>
      {isRunning && (
        <span className="mt-3 block h-2 overflow-hidden rounded-full bg-white dark:bg-white/10">
          <span className="block h-full rounded-full bg-blue-400 transition-[width] duration-500" style={{ width: `${Math.max(8, Math.min(100, displayedProgress))}%` }} />
        </span>
      )}
    </Link>
  )
}

interface DesktopRightSidebarProps {
  user: UserProfile | null
  plan: Plan
  scansUsed: number
  scansLimit: number | null
  collapsed: boolean
  scanStatus: ClientScanJobSnapshot | null
  scanProgress: number
  onToggleCollapsed: () => void
  onLogout: () => void
}

function DesktopRightSidebar({
  user,
  plan,
  scansUsed,
  scansLimit,
  collapsed,
  scanStatus,
  scanProgress,
  onToggleCollapsed,
  onLogout,
}: DesktopRightSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const activePlan = getPlanDisplay(plan)
  const PlanIcon = activePlan.icon
  const isDarkTheme = resolvedTheme === 'dark'
  const fullName = user?.name?.trim() || 'User'
  const creditsLabel =
    scansLimit === null ? 'Unlimited audits' : `${Math.max(scansLimit - scansUsed, 0)} of ${scansLimit} audits left`
  const usagePercent = scansLimit === null ? 100 : Math.min(100, (scansUsed / scansLimit) * 100)
  const showUpgrade = plan !== 'pro' && plan !== 'business' && plan !== 'agency'

  return (
    <aside
      className={`absolute bottom-0 right-0 top-0 z-30 hidden max-h-screen flex-col overflow-visible border-l border-blue-200 bg-[linear-gradient(180deg,#eaf5ff_0%,#f8fbff_48%,#edf7ff_100%)] shadow-[-24px_0_70px_rgba(96,165,250,0.16)] backdrop-blur-2xl transition-[width,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex dark:border-blue-400/15 dark:bg-[linear-gradient(180deg,#07111f_0%,#0b1626_54%,#08111f_100%)] dark:shadow-black/30 ${
        collapsed ? 'w-[84px] p-3.5' : 'w-[280px] p-4'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute -left-2.5 top-8 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-[#eaf5ff] shadow-sm shadow-blue-200/60 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:border-blue-400/20 dark:bg-[#0b1626] dark:shadow-black/30"
        aria-label={collapsed ? 'Expand desktop sidebar' : 'Collapse desktop sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <img
          src="/desktop-sidebar-toggle-icon.webp"
          alt=""
          className={`sidebar-toggle-swing h-4 w-4 object-contain opacity-95 drop-shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-100 dark:invert ${
            collapsed ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      <div className="flex min-h-[56px] items-center justify-center transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <Link href="/dashboard" prefetch className={`flex shrink-0 items-center justify-center overflow-hidden transition-[width,height,padding,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 ${
          collapsed
            ? 'h-10 w-10 rounded-2xl border border-blue-100/70 bg-white/55 p-1 shadow-sm shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20'
            : 'h-14 w-[220px] rounded-none border border-transparent bg-transparent px-0 py-1 shadow-none'
        }`} title="Go to dashboard">
          <img
            src={collapsed ? '/mp-seo-logo-icon-blue.svg' : '/mp-seo-logo-full.svg'}
            alt="MP SEO Auditor brand logo"
            className="h-full w-full object-contain dark:hidden"
          />
          <img
            src={collapsed ? '/mp-seo-logo-icon-dark.png' : '/mp-seo-logo-full-dark.png'}
            alt="MP SEO Auditor brand logo"
            className="hidden h-full w-full object-contain dark:block"
          />
        </Link>
      </div>

      <div className={collapsed ? 'mt-3 grid place-items-center' : 'mt-3'}>
        <GlobalScanStatus scan={scanStatus} progress={scanProgress} collapsed={collapsed} />
      </div>

      <div className={`overflow-hidden rounded-[24px] border bg-[linear-gradient(135deg,#f8fbff,#edf7ff)] shadow-lg shadow-blue-100/50 transition-[max-height,margin,opacity,padding,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-[linear-gradient(135deg,#101b2d,#0d1727)] dark:shadow-black/20 ${
        collapsed
          ? 'mt-0 max-h-0 border-transparent p-0 opacity-0'
          : 'mt-3 max-h-36 border-blue-100 p-4 opacity-100 delay-200 dark:border-white/10'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-950 dark:text-white">{fullName}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email || 'No email available'}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${activePlan.badgeClass}`}>
            <PlanIcon className="h-3.5 w-3.5" />
            {activePlan.label}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Audit credits</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{creditsLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-white/10">
            <div className="h-full rounded-full bg-blue-400" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
      </div>

      <nav className={`mt-3 min-h-0 flex-1 overflow-y-auto ${
        collapsed
          ? 'flex w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-blue-100 bg-blue-50/60 px-2.5 py-4 dark:border-white/10 dark:bg-white/[0.04]'
          : 'grid content-start gap-0.5 pr-1'
      }`}>
        {desktopNavItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const isScan = item.href === '/scan'
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`group relative rounded-2xl text-sm font-semibold transition-colors ${
                collapsed ? 'grid h-11 w-11 place-items-center p-0' : 'flex items-center gap-3 px-2.5 py-1.5'
              } ${
                isActive
                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20'
                  : isScan
                    ? 'bg-blue-50/75 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/15 dark:hover:bg-blue-500/15'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-blue-200'
              }`}
              title={item.label}
            >
              <span className={`flex items-center justify-center rounded-xl transition-colors ${
                collapsed ? 'h-11 w-11 bg-transparent' : 'h-9 w-9 bg-blue-50 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300'
              }`}>
                <img
                  src={item.iconSrc}
                  alt=""
                  className={`mx-auto block h-6 w-6 shrink-0 select-none object-contain object-center transition-opacity duration-300 dark:invert ${
                    isActive ? 'opacity-100' : 'opacity-75'
                  }`}
                />
              </span>
              {collapsed && (
                <span className="pointer-events-none absolute right-[calc(100%+10px)] z-50 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 opacity-0 shadow-lg shadow-blue-100/60 transition-opacity delay-500 duration-200 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:shadow-black/30">
                  {item.label}
                </span>
              )}
              <span
                aria-hidden={collapsed}
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-36 opacity-100 delay-200'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className={`shrink-0 space-y-3 pt-3 ${collapsed ? 'grid place-items-center' : ''}`}>
        {showUpgrade && (
          <Link
            href="/upgrade"
            prefetch
            className={`flex items-center justify-between rounded-[22px] border border-amber-200 bg-amber-50 text-sm font-bold text-amber-800 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200 ${
              collapsed ? 'h-12 w-12 justify-center p-0' : 'px-4 py-3'
            }`}
            title="Upgrade Plan"
          >
            <span className="inline-flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className={collapsed ? 'sr-only' : ''}>Upgrade Plan</span>
            </span>
            {!collapsed && <ExternalLink className="h-4 w-4 opacity-70" />}
          </Link>
        )}

        <div className={`overflow-hidden rounded-[24px] border bg-blue-50/70 transition-[max-height,opacity,padding,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-white/[0.04] ${
          collapsed
            ? 'max-h-0 border-transparent p-0 opacity-0'
            : 'max-h-36 border-blue-100 p-3 opacity-100 delay-200 dark:border-white/10'
        }`}>
          <p className="font-bold text-slate-950 dark:text-white">Need website help?</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            For redesign your site or only SEO improvement, contact MP SEO team.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="group grid h-14 place-items-center rounded-2xl border border-emerald-200 bg-white/85 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-[#0d1727] dark:text-emerald-300"
              aria-label="Contact on WhatsApp"
              title="WhatsApp"
            >
              <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="sr-only">WhatsApp</span>
            </a>
            <a
              href={emailUrl}
              className="group grid h-14 place-items-center rounded-2xl border border-blue-200 bg-white/85 text-blue-700 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-400/20 dark:bg-[#0d1727] dark:text-blue-300"
              aria-label="Send email"
              title="Email"
            >
              <Mail className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>

        <div className={`overflow-hidden rounded-[24px] border border-blue-100 bg-blue-50/70 dark:border-white/10 dark:bg-white/[0.04] ${collapsed ? 'grid gap-2 border-0 bg-transparent dark:bg-transparent' : 'grid grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
            className={`flex flex-col items-center justify-center gap-2 text-sm font-bold text-slate-900 transition-colors hover:bg-blue-100/70 dark:text-white dark:hover:bg-white/[0.08] ${
              collapsed ? 'h-12 w-12 rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10' : 'min-h-[78px] border-r border-blue-100 dark:border-white/10'
            }`}
            title={isDarkTheme ? 'Light mode' : 'Dark mode'}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-400/15 dark:text-blue-200">
              <img
                src={isDarkTheme ? '/theme-sun-icon.webp' : '/theme-moon-icon.webp'}
                alt=""
                className="h-6 w-6 object-contain"
              />
            </span>
            <span className={collapsed ? 'sr-only' : ''}>{isDarkTheme ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`flex flex-col items-center justify-center gap-2 text-sm font-bold text-red-800 transition-colors hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-500/10 ${
              collapsed ? 'h-12 w-12 rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-400/20 dark:bg-red-500/10' : 'min-h-[78px]'
            }`}
            title="Sign out"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm dark:bg-red-400/15 dark:text-red-200">
              <img
                src="/sidebar-sign-out-icon.svg"
                alt=""
                className="h-5 w-5 object-contain dark:invert"
              />
            </span>
            <span className={collapsed ? 'sr-only' : ''}>Sign out</span>
          </button>
        </div>

      </div>
    </aside>
  )
}

function DesktopTopNavbar({
  user,
  plan,
}: {
  user: UserProfile | null
  plan: Plan
}) {
  const pathname = usePathname()
  const activePlan = getPlanDisplay(plan)
  const PlanIcon = activePlan.icon
  const currentItem = desktopNavItems.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))

  return (
    <header className="hidden shrink-0 border-b border-blue-200 bg-[linear-gradient(135deg,#eaf5ff_0%,#f8fbff_55%,#edf7ff_100%)] px-8 py-4 backdrop-blur-2xl lg:block dark:border-blue-400/15 dark:bg-[linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)]">
      <div className="mx-auto flex h-12 max-w-[1160px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <img src="/mp-seo-logo-icon-blue.svg" alt="MP SEO Auditor desktop logo" className="h-full w-full object-contain dark:hidden" />
            <img src="/mp-seo-logo-icon-dark.png" alt="MP SEO Auditor desktop logo" className="hidden h-full w-full object-contain dark:block" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              {currentItem?.label || 'Workspace'}
            </p>
            <h1 className="truncate text-xl font-black text-slate-950 dark:text-white">MP SEO Auditor</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-center">
          <Link
            href="/upgrade"
            prefetch
            className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${activePlan.badgeClass}`}
          >
            <PlanIcon className="h-4 w-4" />
            {activePlan.label}
          </Link>
          <Link
            href="/scan"
            prefetch
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-blue-200/70 transition-colors hover:bg-blue-300 dark:shadow-blue-950/20"
          >
            <img src="/desktop-search-icon.svg" alt="" className="h-4 w-4 object-contain" />
            New scan
          </Link>
          <Link href="/profile" prefetch className="relative flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
            <span className="absolute inset-0 overflow-hidden rounded-full">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User profile avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </span>
              )}
            </span>
            {(plan === 'pro' || plan === 'business' || plan === 'agency') && (
              <span className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white px-1 text-[9px] font-black shadow-sm dark:border-[#07111f] ${
                plan === 'pro'
                  ? 'bg-blue-500 text-white'
                  : 'bg-amber-400 text-amber-950'
              }`}>
                {plan === 'pro' ? 'PRO' : <PlanIcon className="h-3 w-3" />}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [scansUsed, setScansUsed] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const [scanStatus, setScanStatus] = useState<ClientScanJobSnapshot | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{
    x: number
    y: number
    edgeBack: boolean
    canPullRefresh: boolean
  } | null>(null)
  const router = useRouter()
  const liveScanProgress = useScanProgress(scanStatus?.status === 'running' ? scanStatus.sessionId : null)
  const globalScanProgress = scanStatus?.status === 'complete'
    ? 100
    : Math.max(liveScanProgress.progress || 0, scanStatus?.progress || 0, scanStatus?.status === 'running' ? 8 : 0)
  const effectivePlan = user ? getEffectivePlan(user.plan, user.planExpiresAt) : 'free'

  const getLimit = (plan?: string | null) => {
    if (plan === 'business' || plan === 'agency') return null
    if (plan === 'pro') return 100
    return 5
  }

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      setScansUsed(profile.scans_today || 0)
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatar_url || null,
        phone: profile.phone || null,
        workDescription: profile.work_description || null,
        profileLastEditedAt: profile.profile_last_edited_at || null,
        plan: profile.plan,
        billingInterval: profile.billing_interval || null,
        planStartedAt: profile.plan_started_at || null,
        planExpiresAt: profile.plan_expires_at || null,
        scansToday: profile.scans_today || 0,
        scansResetAt: profile.scans_reset_at || new Date().toISOString(),
        createdAt: profile.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at || new Date().toISOString(),
      })
    } else {
      const fallbackProfile = {
        id: session.user.id,
        name:
          session.user.user_metadata?.name ||
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          null,
        email: session.user.email || '',
        plan: 'free' as Plan,
        avatar_url:
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          null,
        scans_today: 0,
      }

      await supabase.from('profiles').upsert(fallbackProfile)
      setUser({
        id: fallbackProfile.id,
        name: fallbackProfile.name,
        email: fallbackProfile.email,
        avatarUrl: fallbackProfile.avatar_url,
        phone: null,
        workDescription: null,
        profileLastEditedAt: null,
        plan: 'free',
        billingInterval: 'monthly',
        planStartedAt: null,
        planExpiresAt: null,
        scansToday: 0,
        scansResetAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      await loadProfile()
      setIsLoading(false)
      dashboardRoutes.forEach(route => router.prefetch(route))
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const handleAuditCompleted = () => {
      setScansUsed((current) => current + 1)
    }

    window.addEventListener('audit-completed', handleAuditCompleted)
    return () => window.removeEventListener('audit-completed', handleAuditCompleted)
  }, [])

  useEffect(() => {
    return subscribeGlobalScan(setScanStatus)
  }, [])

  useEffect(() => {
    const handlePlanUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ plan?: Plan }>).detail

      if (detail?.plan) {
        setUser(current => current ? { ...current, plan: detail.plan as Plan } : current)
      }

      void loadProfile()
    }

    window.addEventListener('plan-updated', handlePlanUpdated)
    return () => window.removeEventListener('plan-updated', handlePlanUpdated)
  }, [])

  useEffect(() => {
    if (isLoading || !user) return

    window.dispatchEvent(new CustomEvent('profile-plan-loaded', {
      detail: {
        plan: effectivePlan,
        planExpiresAt: user.planExpiresAt,
      },
    }))
  }, [effectivePlan, isLoading, user])

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; email?: string; avatarUrl?: string }>).detail

      setUser(current => current ? {
        ...current,
        name: detail.name ?? current.name,
        email: detail.email ?? current.email,
        avatarUrl: detail.avatarUrl ?? current.avatarUrl,
      } : current)
    }

    window.addEventListener('profile-updated', handleProfileUpdated)
    return () => window.removeEventListener('profile-updated', handleProfileUpdated)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (sidebarOpen || isPullRefreshing) return

    const touch = event.touches[0]
    const scrollTop = scrollRef.current?.scrollTop ?? 0

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      edgeBack: touch.clientX <= 24,
      canPullRefresh: scrollTop <= 0,
    }
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    if (!start || !start.canPullRefresh || isPullRefreshing) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    const isVerticalPull = deltaY > 12 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2

    if (scrollTop <= 0 && isVerticalPull) {
      setPullDistance(Math.min(96, deltaY * 0.55))
    }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    if (!start) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const isBackSwipe = start.edgeBack && deltaX > 86 && Math.abs(deltaY) < 72

    touchStartRef.current = null

    if (isBackSwipe) {
      setPullDistance(0)
      router.back()
      return
    }

    if (pullDistance >= 72) {
      setIsPullRefreshing(true)
      window.location.reload()
      return
    }

    setPullDistance(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMark label="Loading your dashboard" />
      </div>
    )
  }

  return (
    <MobileShell>
      <div className="lg:hidden">
        <TopBar userName={user?.name} plan={effectivePlan} onMenuOpen={() => setSidebarOpen(true)} />
      </div>
      <div
        className="hidden transition-[padding-right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block lg:pr-[var(--desktop-sidebar-width)]"
        style={{ '--desktop-sidebar-width': desktopSidebarCollapsed ? '84px' : '280px' } as CSSProperties}
        onMouseDown={() => {
          if (!desktopSidebarCollapsed) setDesktopSidebarCollapsed(true)
        }}
      >
        <DesktopTopNavbar user={user} plan={effectivePlan} />
      </div>
      {(pullDistance > 0 || isPullRefreshing) && (
        <div
          className="pointer-events-none absolute left-1/2 top-[72px] z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-lg backdrop-blur transition-all lg:hidden"
          style={{ transform: `translate(-50%, ${Math.min(pullDistance, 58)}px)` }}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-primary ${isPullRefreshing ? 'animate-spin' : ''}`} />
          {isPullRefreshing ? 'Refreshing...' : pullDistance >= 72 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      <div
        ref={scrollRef}
        data-dashboard-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28 transition-[padding-right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pb-0 lg:pr-[var(--desktop-sidebar-width)]"
        style={{ '--desktop-sidebar-width': desktopSidebarCollapsed ? '84px' : '280px' } as CSSProperties}
        onMouseDown={() => {
          if (!desktopSidebarCollapsed) setDesktopSidebarCollapsed(true)
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartRef.current = null
          setPullDistance(0)
        }}
      >
        {children}
        <footer className="px-4 pb-6 pt-3 text-center text-[11px] leading-5 text-muted-foreground lg:mx-auto lg:max-w-[1160px] lg:px-0 lg:pb-8 lg:pt-4">
          <p className="text-xs font-medium text-muted-foreground">"Design is how it works." <span className="text-muted-foreground/70">Steve Jobs</span></p>
          <p className="mt-1">
          Developed by{' '}
          <a
            href="https://mehedipathan.online"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Mehedi Pathan
          </a>
          </p>
        </footer>
      </div>
      <div className="lg:hidden">
        <BottomNav avatarUrl={user?.avatarUrl} />
      </div>
      <DesktopRightSidebar
        user={user ? { ...user, plan: effectivePlan } : user}
        plan={effectivePlan}
        scansUsed={scansUsed}
        scansLimit={getLimit(effectivePlan)}
        collapsed={desktopSidebarCollapsed}
        scanStatus={scanStatus}
        scanProgress={globalScanProgress}
        onToggleCollapsed={() => setDesktopSidebarCollapsed(current => !current)}
        onLogout={handleLogout}
      />
      <div className="lg:hidden">
        <AppSidebar
          open={sidebarOpen}
          user={user ? { ...user, plan: effectivePlan } : user}
          scansUsed={scansUsed}
          scansLimit={getLimit(effectivePlan)}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </MobileShell>
  )
}
