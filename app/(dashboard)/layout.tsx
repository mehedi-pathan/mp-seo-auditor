'use client'

import { MobileShell } from '@/components/layout/MobileShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Plan, UserProfile } from '@/types'
import { getEffectivePlan } from '@/lib/planAccess'

const dashboardRoutes = [
  '/dashboard',
  '/scan',
  '/history',
  '/backlinks',
  '/profile',
  '/keywords',
  '/trends',
  '/tips',
  '/upgrade',
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [scansUsed, setScansUsed] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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

  const effectivePlan = user ? getEffectivePlan(user.plan, user.planExpiresAt) : 'free'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <MobileShell>
      <TopBar userName={user?.name} plan={effectivePlan} onMenuOpen={() => setSidebarOpen(true)} />
      <div className="flex-1">
        {children}
      </div>
      <div className="px-4 pb-28 pt-2 text-center text-[11px] text-muted-foreground">
        Designed & Developed by{' '}
        <a
          href="https://mehedipathan.online"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          Mehedi Pathan
        </a>
      </div>
      <BottomNav avatarUrl={user?.avatarUrl} />
      <AppSidebar
        open={sidebarOpen}
        user={user ? { ...user, plan: effectivePlan } : user}
        scansUsed={scansUsed}
        scansLimit={getLimit(effectivePlan)}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
    </MobileShell>
  )
}
