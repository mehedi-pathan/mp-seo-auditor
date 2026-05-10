'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { Camera, Edit3, Loader2, Save, User, X } from 'lucide-react'
import { toast } from 'sonner'
import type { BillingInterval, Plan } from '@/types'
import { getPlanDisplay } from '@/lib/planDisplay'

const formatDate = (value: string | null) => {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

interface ProfileData {
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  plan?: string | null
  billing_interval?: string | null
  plan_started_at?: string | null
  plan_expires_at?: string | null
}

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan>('free')
  const [billingInterval, setBillingInterval] = useState<BillingInterval | null>(null)
  const [planStartedAt, setPlanStartedAt] = useState<string | null>(null)
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name,email,avatar_url,plan,billing_interval,plan_started_at,plan_expires_at')
        .eq('id', user.id)
        .single()

      let profileData: ProfileData | null = data

      if (error) {
        const fallback = await supabase
          .from('profiles')
          .select('name,email,plan')
          .eq('id', user.id)
          .single()

        profileData = fallback.data
      }

      const loadedName = profileData?.name || user.user_metadata?.name || user.user_metadata?.full_name || ''
      const loadedEmail = profileData?.email || user.email || ''
      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      const loadedAvatar = profileData?.avatar_url || googleAvatar || null

      setName(loadedName)
      setEmail(loadedEmail)
      setAvatarUrl(loadedAvatar)
      setOriginalName(loadedName)
      setOriginalEmail(loadedEmail)
      setPlan((profileData?.plan || 'free') as Plan)
      setBillingInterval((profileData?.billing_interval || null) as BillingInterval | null)
      setPlanStartedAt(profileData?.plan_started_at || null)
      setPlanExpiresAt(profileData?.plan_expires_at || null)

      if (!profileData?.avatar_url && googleAvatar) {
        await supabase
          .from('profiles')
          .update({ avatar_url: googleAvatar, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [])

  const saveProfile = async () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in again')
      setIsSaving(false)
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const nameChanged = trimmedName !== originalName
    const emailChanged = trimmedEmail !== originalEmail && trimmedEmail !== user.email
    const passwordChanged = Boolean(trimmedPassword)

    if (!nameChanged && !emailChanged && !passwordChanged) {
      toast.info('No profile changes to save')
      setIsEditing(false)
      setIsSaving(false)
      return
    }

    const authUpdates: { email?: string; password?: string; data?: { name: string } } = {}

    if (nameChanged) authUpdates.data = { name: trimmedName }
    if (emailChanged) authUpdates.email = trimmedEmail
    if (passwordChanged) authUpdates.password = trimmedPassword

    const { error: authError } = await supabase.auth.updateUser(authUpdates)

    if (authError) {
      toast.error(authError.message)
      setIsSaving(false)
      return
    }

    const profileUpdates: { name?: string; email?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }

    if (nameChanged) profileUpdates.name = trimmedName
    if (emailChanged) profileUpdates.email = trimmedEmail

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    if (profileError) {
      toast.error(profileError.message)
    } else {
      toast.success(email !== user.email ? 'Profile saved. Confirm the new email to finish changing it.' : 'Profile saved')
      setOriginalName(trimmedName)
      setOriginalEmail(trimmedEmail)
      setName(trimmedName)
      setEmail(trimmedEmail)
      setPassword('')
      setIsEditing(false)
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: trimmedName, email: trimmedEmail } }))
    }

    setIsSaving(false)
  }

  const cancelEdit = () => {
    setName(originalName)
    setEmail(originalEmail)
    setPassword('')
    setIsEditing(false)
  }

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be smaller than 3MB')
      return
    }

    setIsUploadingAvatar(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please log in again')
        return
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/avatar.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`${uploadError.message}. Run scripts/009_profile_avatars.sql in Supabase if the bucket is not ready.`)
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(path)

      const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (profileError) throw new Error(profileError.message)

      setAvatarUrl(publicUrl)
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatarUrl: publicUrl } }))
      toast.success('Profile image updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not upload image')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const activePlan = getPlanDisplay(plan)
  const PlanIcon = activePlan.icon

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Update your account details and login credentials.</p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User profile avatar"
                className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/25 text-primary ring-2 ring-border">
                <User className="h-5 w-5" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent">
              {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploadingAvatar}
                onChange={event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void uploadAvatar(file)
                }}
              />
            </label>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{name || 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {avatarUrl ? 'Profile image connected' : 'Upload an image or use your Google photo'}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Full name</label>
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Your name"
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input
              value={email}
              onChange={event => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
              disabled={!isEditing}
            />
            <p className="mt-1 text-xs text-muted-foreground">Changing email may require confirmation.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">New password</label>
            <Input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type="password"
              placeholder="Leave blank to keep current password"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button className="w-full" onClick={saveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Edit3 className="h-4 w-4" />
            )}
            {isEditing ? 'Save changes' : 'Edit profile'}
          </Button>
          {isEditing && (
            <Button variant="outline" className="w-full" onClick={cancelEdit} disabled={isSaving}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card className={`p-4 ${activePlan.cardClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${activePlan.badgeClass}`}>
              <PlanIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current package</p>
              <p className="font-bold">{activePlan.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{activePlan.description}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${activePlan.badgeClass}`}>
            {activePlan.label}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Billing</p>
            <p className="mt-1 font-semibold capitalize">{billingInterval || (plan === 'free' ? 'Free' : 'Active')}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Renews / ends</p>
            <p className="mt-1 font-semibold">{formatDate(planExpiresAt)}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="text-muted-foreground">Package started</p>
            <p className="mt-1 font-semibold">{formatDate(planStartedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
