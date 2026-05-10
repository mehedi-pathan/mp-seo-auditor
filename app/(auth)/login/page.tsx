'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { GoogleIcon } from '@/components/auth/GoogleIcon'
import { GitHubIcon } from '@/components/auth/GitHubIcon'
import { FacebookIcon } from '@/components/auth/FacebookIcon'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

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

  const handleGoogleLogin = async () => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !password) {
      setErrorMessage('Please fill in all fields')
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Please enter your email address')
      toast.error('Please enter your email address')
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

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary/25 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className="border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur dark:bg-card">
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-2 rounded-xl px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <img src="/home.svg" alt="Home page icon" className="h-3.5 w-3.5 opacity-75 dark:invert" />
            Back to Home
          </Link>

          <div className="mb-2 flex justify-center">
            <img
              src="/mp-seo-logo.jpeg"
              alt="MP SEO Auditor logo"
              className="h-[52px] w-[52px] rounded-2xl object-cover ring-1 ring-border"
            />
          </div>

          <h1 className="text-center text-xl font-bold text-foreground">MP SEO Auditor</h1>
          <p className="mb-3 mt-0.5 text-center text-sm text-muted-foreground">
            {isResetMode ? 'Send a password reset link' : 'Sign in to your account'}
          </p>

          <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-2.5">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {!isResetMode && (
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => {
                      setErrorMessage('')
                      setSuccessMessage('')
                      setIsResetMode(true)
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
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

            <Button
              type="submit"
              className="h-9 w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isResetMode ? 'Sending link...' : 'Signing in...'}
                </>
              ) : isResetMode ? (
                'Send Reset Link'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {!isResetMode && (
            <>
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-9 w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-200 dark:bg-white dark:text-slate-800 dark:hover:bg-slate-50 dark:hover:text-slate-950"
                disabled={isLoading}
                onClick={handleGoogleLogin}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <Button
                type="button"
                className="relative mt-1.5 h-9 w-full border border-slate-200 bg-white text-slate-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-100 dark:border-slate-200 dark:bg-white dark:text-slate-800"
                disabled
              >
                <GitHubIcon />
                Continue with GitHub
                <span className="absolute right-2 top-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-slate-600">
                  Soon
                </span>
              </Button>

              <Button
                type="button"
                className="relative mt-1.5 h-9 w-full border border-[#1877f2]/25 bg-white text-slate-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-100 dark:bg-white dark:text-slate-800"
                disabled
              >
                <FacebookIcon />
                Continue with Facebook
                <span className="absolute right-2 top-1 rounded-full bg-[#1877f2]/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#1877f2]">
                  Soon
                </span>
              </Button>
            </>
          )}

          <div className="mt-3 text-center">
            <p className="text-sm text-muted-foreground">
              {isResetMode ? (
                <>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      setErrorMessage('')
                      setSuccessMessage('')
                      setIsResetMode(false)
                    }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Designed & Developed by{' '}
            <a href="https://mehedipathan.online" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              Mehedi Pathan
            </a>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
