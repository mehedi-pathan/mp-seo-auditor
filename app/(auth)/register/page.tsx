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

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
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

  const handleGoogleRegister = async () => {
    setErrorMessage('')
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields')
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters')
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
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
        router.replace('/login')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
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
            Create your account to get started
          </p>

          <form onSubmit={handleRegister} className="space-y-2.5">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-semibold text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="h-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-foreground">
                Password
              </label>
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

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs font-semibold text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {errorMessage && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

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
            onClick={handleGoogleRegister}
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

          <div className="mt-3 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
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
