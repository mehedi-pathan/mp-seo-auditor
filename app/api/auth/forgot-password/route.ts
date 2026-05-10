import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'

interface ForgotPasswordPayload {
  email?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as ForgotPasswordPayload
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: 'Unable to check this email right now' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'This email is not registered to our database' }, { status: 404 })
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${req.nextUrl.origin}/profile?password_reset=true`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 })
    }

    return NextResponse.json({
      message: 'Password reset email sent. Check your inbox for the recovery link.',
    })
  } catch (error) {
    console.error('[forgot-password]', error)
    return NextResponse.json({ error: 'Unable to send password reset email' }, { status: 500 })
  }
}
