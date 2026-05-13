'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CircleHelp,
  Eye,
  Lock,
  Loader2,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { FacebookIcon } from '@/components/auth/FacebookIcon'
import { GitHubIcon } from '@/components/auth/GitHubIcon'
import { GoogleIcon } from '@/components/auth/GoogleIcon'
import { LoadingMark } from '@/components/loading/RouteLoading'

type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  initialMode: AuthMode
}

type AuthValidationMode = AuthMode | 'reset'

type AuthValidationInput = {
  mode: AuthValidationMode
  email: string
  password: string
  name: string
  confirmPassword: string
}

type AuthValidationResult = {
  isValid: boolean
  errors: Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthScreen({ initialMode }: AuthScreenProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [subscribeTips, setSubscribeTips] = useState(false)

  const isRegister = mode === 'register'

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace('/dashboard')
        return
      }

      setCheckingAuth(false)
    }

    void checkSession()
  }, [router])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setIsResetMode(false)
    setErrorMessage('')
    setSuccessMessage('')
    setSubmitAttempted(false)
    setShowPrivacyNote(false)
    window.history.pushState(null, '', nextMode === 'login' ? '/login' : '/register')
  }

  useEffect(() => {
    const handlePopState = () => {
      setMode(window.location.pathname.includes('/register') ? 'register' : 'login')
      setIsResetMode(false)
      setErrorMessage('')
      setSuccessMessage('')
      setSubmitAttempted(false)
      setShowPrivacyNote(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleGoogleAuth = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setIsLoading(false)
      setErrorMessage(error.message)
      toast.error(error.message)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitAttempted(true)
    setErrorMessage('')
    setSuccessMessage('')

    const validation = getAuthValidation({ mode: 'login', email, password, name, confirmPassword })
    if (!validation.isValid) {
      setErrorMessage('Please fix the highlighted fields.')
      toast.error('Please fix the highlighted fields.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      toast.success('Logged in successfully!')
      router.replace('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log in'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitAttempted(true)
    setErrorMessage('')
    setSuccessMessage('')

    const validation = getAuthValidation({ mode: 'register', email, password, name, confirmPassword })
    if (!validation.isValid) {
      setErrorMessage('Please fix the highlighted fields.')
      toast.error('Please fix the highlighted fields.')
      return
    }

    if (!agreedToTerms) {
      setErrorMessage('Please agree to the Terms of Service to continue.')
      toast.error('Please agree to the Terms of Service to continue.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          // Preferences can be moved into a profile table when the Terms page is added.
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      if (data.session) {
        toast.success('Account created successfully!')
        router.replace('/dashboard')
        router.refresh()
      } else {
        toast.success('Account created! Please check your email to verify.')
        switchMode('login')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitAttempted(true)
    setErrorMessage('')
    setSuccessMessage('')

    const validation = getAuthValidation({ mode: 'reset', email, password, name, confirmPassword })
    if (!validation.isValid) {
      setErrorMessage('Please enter a valid email address.')
      toast.error('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = (await response.json()) as { message?: string; error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email')
      }

      const message = result.message || 'Password reset email sent. Check your inbox for the recovery link.'
      setSuccessMessage(message)
      toast.success(message)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const passwordMeta = useMemo(() => {
    const strength = password.length >= 10 ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'
    const color =
      strength === 'Strong'
        ? 'bg-emerald-500'
        : strength === 'Medium'
          ? 'bg-amber-500'
          : 'bg-slate-200 dark:bg-slate-700'
    const width = password.length >= 10 ? 'w-full' : password.length >= 6 ? 'w-2/3' : password.length > 0 ? 'w-1/3' : 'w-0'
    return { strength, color, width }
  }, [password])

  const validationMode: AuthValidationMode = isResetMode ? 'reset' : isRegister ? 'register' : 'login'
  const validation = getAuthValidation({ mode: validationMode, email, password, name, confirmPassword })
  const canSubmit = validation.isValid && !isLoading && (!isRegister || agreedToTerms)
  const showNameError = submitAttempted || name.length > 0
  const showEmailError = submitAttempted || email.length > 0
  const showPasswordError = submitAttempted || password.length > 0
  const showConfirmPasswordError = submitAttempted || confirmPassword.length > 0

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingMark label="Checking your session" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(138,199,255,0.26),transparent_30%),linear-gradient(135deg,#f8fbff_0%,#f6f8fc_52%,#eef5ff_100%)] p-2 text-slate-950 dark:bg-[radial-gradient(circle_at_18%_8%,rgba(96,165,250,0.18),transparent_30%),linear-gradient(135deg,#08111f_0%,#0b1324_58%,#10172d_100%)] dark:text-white sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto grid min-h-[calc(100svh-16px)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-blue-100 bg-white/88 shadow-2xl shadow-blue-100/70 backdrop-blur xl:grid-cols-[0.86fr_1fr] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/30 sm:min-h-[calc(100svh-32px)]"
      >
        <aside className="relative hidden overflow-hidden border-r border-blue-100 bg-[radial-gradient(circle_at_72%_22%,rgba(138,199,255,0.24),transparent_24%),linear-gradient(135deg,#eaf5ff_0%,#f8fbff_68%,#eef6ff_100%)] p-8 xl:flex xl:flex-col dark:border-white/10 dark:bg-[radial-gradient(circle_at_72%_18%,rgba(96,165,250,0.16),transparent_26%),linear-gradient(135deg,#07111f_0%,#101b2d_68%,#08111f_100%)]">
          <motion.div
            className="absolute -right-32 top-24 h-[520px] w-[520px] rounded-full border border-blue-200/70 dark:border-blue-400/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -right-44 top-40 h-[700px] w-[700px] rounded-full border border-blue-100/80 dark:border-white/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 44, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute right-12 top-36 h-52 w-52" aria-hidden="true">
            <div className="absolute inset-6 rounded-full border border-blue-200/70 dark:border-blue-300/15" />
            <div className="absolute inset-12 rounded-full border border-blue-100/80 dark:border-white/10" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute left-1/2 top-2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-blue-500 shadow-lg shadow-blue-300/60" />
            </motion.div>
            <motion.div
              className="absolute inset-8"
              animate={{ rotate: -360 }}
              transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-200/60" />
            </motion.div>
            <motion.div
              className="absolute inset-16"
              animate={{ rotate: 360 }}
              transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-400 shadow-lg shadow-amber-200/60" />
            </motion.div>
            <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-blue-100 bg-white/70 shadow-xl shadow-blue-100/60 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
              <img src="/mp-seo-logo-icon-blue.svg" alt="" className="h-10 w-10 rounded-2xl object-contain dark:hidden" />
              <img src="/mp-seo-logo-icon-dark.png" alt="" className="hidden h-10 w-10 rounded-2xl object-contain dark:block" />
            </div>
          </div>

          <Link href="/" className="relative z-10 inline-flex w-fit items-center rounded-3xl bg-white px-4 py-2 shadow-sm ring-1 ring-blue-100 dark:bg-white/[0.04] dark:ring-white/10">
            <img src="/mp-seo-logo-full.svg" alt="MP SEO Auditor full brand logo" className="h-12 w-auto max-w-[220px] object-contain dark:hidden" />
            <img src="/mp-seo-logo-full-dark.png" alt="MP SEO Auditor full brand logo" className="hidden h-12 w-auto max-w-[220px] object-contain dark:block" />
          </Link>

          <div className="relative z-10 mt-14 max-w-xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
              SEO made clear
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight">
              Improve your SEO.<br />
              Rank higher.<br />
              <span className="text-blue-600 dark:text-blue-300">Grow faster.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
              Audit your website, find the issues that matter, and turn every result into a clear action plan.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: '/auth-seo-audit-icon.svg', title: 'Complete website audit', text: 'Review SEO, speed, content, links, and accessibility in one report.' },
                { icon: '/auth-comparison-icon.svg', title: 'Compare and prioritize', text: 'See what matters first so your team can fix the highest impact issues.' },
                { icon: '/auth-progress-icon.svg', title: 'Track real progress', text: 'Save reports and monitor improvements as your website gets stronger.' },
              ].map(item => {
                return (
                  <div key={item.title} className="flex items-center gap-4 rounded-3xl border border-white/60 bg-white/45 p-3 shadow-sm shadow-blue-100/50 backdrop-blur dark:border-white/10 dark:bg-white/[0.035] dark:shadow-black/10">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                      <img src={item.icon} alt={`${item.title} icon`} className="h-7 w-7 object-contain opacity-80 grayscale" />
                    </span>
                    <span>
                      <span className="block font-black">{item.title}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.text}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative z-10 mt-auto grid max-w-lg grid-cols-3 gap-3 rounded-[22px] border border-white/80 bg-white/78 p-4 text-center shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            {[
              ['5', 'Free Audits'],
              ['35+', 'SEO Tips'],
              ['7', 'Audit Areas'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-300">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex min-h-full items-center justify-center p-3 sm:p-6 xl:p-8">
          <Card className="w-full max-w-md rounded-[28px] border-blue-100 bg-white/92 p-4 shadow-2xl shadow-blue-100/60 backdrop-blur dark:border-white/10 dark:bg-[#0d1727]/92 dark:shadow-black/25 sm:p-6 xl:max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                <img src="/home.svg" alt="Back to home" className="h-5 w-5 opacity-80 dark:invert" />
              </Link>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-blue-100 dark:bg-white/[0.04] dark:ring-white/10">
                <img src="/mp-seo-logo-icon-blue.svg" alt="MP SEO Auditor logo" className="h-full w-full object-contain dark:hidden" />
                <img src="/mp-seo-logo-icon-dark.png" alt="MP SEO Auditor logo" className="hidden h-full w-full object-contain dark:block" />
              </span>
              <button
                type="button"
                aria-expanded={showPrivacyNote}
                aria-label="Privacy and data safety information"
                onClick={() => setShowPrivacyNote(current => !current)}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.06] dark:hover:text-blue-300"
              >
                <CircleHelp className="h-5 w-5" />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showPrivacyNote && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    <p className="font-black text-slate-950 dark:text-white">Privacy first</p>
                    <p className="mt-1">
                      We do not collect or store sensitive personal data. MP SEO Auditor follows applicable privacy laws, platform rules, and security requirements for account access and reports.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isResetMode && (
              <div className="relative mb-5 grid grid-cols-2 overflow-hidden rounded-full border border-blue-100 bg-slate-100/80 p-1 text-sm font-black shadow-inner shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.04]">
                <motion.span
                  className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-white shadow-md shadow-blue-100/70 dark:bg-white/10 dark:shadow-black/20"
                  animate={{ left: isRegister ? '50%' : '4px' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`relative z-10 rounded-full px-4 py-2.5 text-center transition ${!isRegister ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'}`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`relative z-10 rounded-full px-4 py-2.5 text-center transition ${isRegister ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300'}`}
                >
                  Create Account
                </button>
              </div>
            )}

            <motion.div
              key={isResetMode ? 'reset' : mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-5 text-center">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {isResetMode ? 'Reset your password' : isRegister ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                  {isResetMode ? 'Enter your registered email to receive a recovery link.' : isRegister ? 'Start auditing your website in seconds' : 'Log in to continue your SEO journey'}
                </p>
              </div>

              <form onSubmit={isResetMode ? handlePasswordReset : isRegister ? handleRegister : handleLogin} className="space-y-4">
                {isRegister && (
                  <AuthField id="name" label="Full Name" icon={<User className="h-5 w-5" />} error={showNameError ? validation.errors.name : undefined}>
                    <Input id="name" type="text" autoComplete="name" minLength={2} placeholder="Enter your full name" className="h-12 rounded-2xl border-blue-100 bg-white pl-12 text-base shadow-sm dark:border-white/10 dark:bg-[#08111f]" value={name} onChange={(event) => setName(event.target.value)} disabled={isLoading} aria-invalid={Boolean(showNameError && validation.errors.name)} />
                  </AuthField>
                )}

                <AuthField id="email" label="Email" icon={<Mail className="h-5 w-5" />} error={showEmailError ? validation.errors.email : undefined}>
                  <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" className="h-12 rounded-2xl border-blue-100 bg-white pl-12 text-base shadow-sm dark:border-white/10 dark:bg-[#08111f]" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} aria-invalid={Boolean(showEmailError && validation.errors.email)} />
                </AuthField>

                {!isResetMode && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor="password" className="block text-sm font-black text-slate-900 dark:text-white">
                        Password
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-300 sm:text-sm"
                          onClick={() => {
                            setErrorMessage('')
                            setSuccessMessage('')
                            setSubmitAttempted(false)
                            setIsResetMode(true)
                          }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} minLength={isRegister ? 6 : undefined} placeholder={isRegister ? 'Create a password' : 'Enter your password'} className="h-12 rounded-2xl border-blue-100 bg-white pl-12 pr-12 text-base shadow-sm dark:border-white/10 dark:bg-[#08111f]" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading} aria-invalid={Boolean(showPasswordError && validation.errors.password)} />
                      <button type="button" onClick={() => setShowPassword(current => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                    {showPasswordError && validation.errors.password && (
                      <p className="mt-1.5 text-xs font-semibold text-destructive">{validation.errors.password}</p>
                    )}
                    {isRegister && (
                      <>
                        <div className="mt-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
                          <span>Password strength</span>
                          <span className={passwordMeta.strength === 'Strong' ? 'text-emerald-600 dark:text-emerald-300' : passwordMeta.strength === 'Medium' ? 'text-amber-500' : ''}>{password ? passwordMeta.strength : 'Required'}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all ${passwordMeta.color} ${passwordMeta.width}`} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isRegister && (
                  <AuthField id="confirmPassword" label="Confirm Password" icon={<Lock className="h-5 w-5" />} error={showConfirmPasswordError ? validation.errors.confirmPassword : undefined}>
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" className="h-12 rounded-2xl border-blue-100 bg-white pl-12 pr-12 text-base shadow-sm dark:border-white/10 dark:bg-[#08111f]" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isLoading} aria-invalid={Boolean(showConfirmPasswordError && validation.errors.confirmPassword)} />
                    <button type="button" onClick={() => setShowConfirmPassword(current => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      <Eye className="h-5 w-5" />
                    </button>
                  </AuthField>
                )}

                {isRegister && (
                  <div className="space-y-2.5 rounded-3xl border border-blue-100 bg-blue-50/40 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                    <label className="flex cursor-pointer items-start gap-3 text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(event) => setAgreedToTerms(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-blue-200 accent-blue-600"
                      />
                      <span>
                        I agree to the{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-300">Terms of Service</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={subscribeTips}
                        onChange={(event) => setSubscribeTips(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-blue-200 accent-blue-600"
                      />
                      <span>Subscribe to SEO tips and updates</span>
                    </label>
                    {submitAttempted && !agreedToTerms && (
                      <p className="text-xs font-semibold text-destructive">Please agree to the Terms of Service.</p>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-300">
                    {successMessage}
                  </div>
                )}

                <Button type="submit" className="h-12 w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-xl shadow-blue-200/70 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:text-white/80 dark:shadow-blue-950/30" disabled={!canSubmit}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isResetMode ? 'Sending link...' : isRegister ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {isResetMode ? 'Send Reset Link' : isRegister ? 'Create Account' : 'Log In'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {!isResetMode && (
                <>
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground">or continue with</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button type="button" variant="outline" className="h-16 flex-col gap-1 rounded-2xl border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-950 dark:border-slate-200 dark:bg-white dark:text-slate-800 dark:hover:bg-slate-50 dark:hover:text-slate-950" disabled={isLoading} onClick={handleGoogleAuth}>
                      <GoogleIcon />
                      Google
                    </Button>

                    <Button type="button" className="relative h-16 flex-col gap-1 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-100 dark:border-slate-200 dark:bg-white dark:text-slate-800" disabled>
                      <AppleIcon />
                      Apple
                      <span className="absolute right-2 top-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-slate-600">
                        Soon
                      </span>
                    </Button>

                    <Button type="button" className="relative h-16 flex-col gap-1 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-100 dark:border-slate-200 dark:bg-white dark:text-slate-800" disabled>
                      <GitHubIcon />
                      GitHub
                      <span className="absolute right-2 top-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-slate-600">
                        Soon
                      </span>
                    </Button>

                    <Button type="button" className="relative h-16 flex-col gap-1 rounded-2xl border border-[#1877f2]/25 bg-white text-sm font-bold text-slate-800 shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-100 dark:bg-white dark:text-slate-800" disabled>
                      <FacebookIcon />
                      Facebook
                      <span className="absolute right-2 top-1 rounded-full bg-[#1877f2]/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#1877f2]">
                        Soon
                      </span>
                    </Button>
                  </div>
                </>
              )}

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {isResetMode ? (
                    <>
                      Remembered your password?{' '}
                      <button
                        type="button"
                        className="font-bold text-blue-600 hover:underline dark:text-blue-300"
                        onClick={() => {
                          setErrorMessage('')
                          setSuccessMessage('')
                          setSubmitAttempted(false)
                          setIsResetMode(false)
                        }}
                      >
                        Back to sign in
                      </button>
                    </>
                  ) : isRegister ? (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('login')} className="font-bold text-blue-600 hover:underline dark:text-blue-300">
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => switchMode('register')} className="font-bold text-blue-600 hover:underline dark:text-blue-300">
                        Create one
                      </button>
                    </>
                  )}
                </p>
              </div>

              <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-50">
                <div className="flex items-center gap-4">
                  <img
                    src="/safe-lock-privacy-policy.webp"
                    alt="Safe privacy lock icon"
                    className="h-14 w-14 shrink-0 rounded-2xl object-contain"
                  />
                  <div>
                    <p className="font-black">{isRegister ? 'No credit card required' : 'Your data is safe with us'}</p>
                    <p className="text-sm leading-6 text-emerald-700 dark:text-emerald-200/80">{isRegister ? 'Start with free audits. We only ask for what your account needs.' : 'We use secure authentication and never collect unnecessary sensitive data.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Designed & Developed by{' '}
              <a href="https://mehedipathan.online" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                Mehedi Pathan
              </a>
            </p>
          </Card>
        </main>
      </motion.div>
    </div>
  )
}

function AuthField({
  id,
  label,
  icon,
  children,
  error,
}: {
  id: string
  label: string
  icon: ReactNode
  children: ReactNode
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-black text-slate-900 dark:text-white">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>
      )}
    </div>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.36 1.45c.02 1.38-.51 2.55-1.36 3.48-.9.98-2.25 1.73-3.55 1.63-.18-1.32.5-2.7 1.31-3.58.91-1 2.47-1.75 3.6-1.53ZM20.83 17.4c-.54 1.22-.8 1.77-1.49 2.86-.97 1.49-2.34 3.35-4.04 3.37-1.5.02-1.89-.98-3.93-.97-2.03 0-2.46 1-3.97.98-1.69-.02-2.98-1.7-3.95-3.19-2.7-4.15-2.98-9.02-1.32-11.6 1.18-1.84 3.04-2.92 4.8-2.92 1.8 0 2.93.99 4.42.99 1.45 0 2.33-.99 4.42-.99 1.58 0 3.25.86 4.42 2.35-3.88 2.13-3.25 7.67.64 9.12Z"
      />
    </svg>
  )
}

function getAuthValidation({
  mode,
  email,
  password,
  name,
  confirmPassword,
}: AuthValidationInput): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = 'Email address is required.'
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (mode === 'reset') {
    return { isValid: Object.keys(errors).length === 0, errors }
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (mode === 'register' && password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  }

  if (mode === 'register') {
    if (!name.trim()) {
      errors.name = 'Full name is required.'
    } else if (name.trim().length < 2) {
      errors.name = 'Enter your full name.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.'
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}
