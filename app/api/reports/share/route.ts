import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

interface ShareRequestBody {
  auditId?: string
  action?: 'enable' | 'disable' | 'regenerate'
}

interface ShareAuditRow {
  id: string
  user_id: string
  public_share_token: string | null
  is_public: boolean | null
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

function getPublicReportUrl(req: NextRequest, token: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const origin = configuredUrl || req.headers.get('origin') || req.nextUrl.origin
  return `${origin}/report/${token}`
}

function createShareToken() {
  return randomUUID().replaceAll('-', '')
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as ShareRequestBody
    if (!body.auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('audits')
      .select('id,user_id,public_share_token,is_public')
      .eq('id', body.auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    const audit = data as ShareAuditRow

    if (body.action === 'disable') {
      const { error: updateError } = await supabaseAdmin
        .from('audits')
        .update({ is_public: false, public_shared_at: null })
        .eq('id', audit.id)
        .eq('user_id', user.id)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      return NextResponse.json({ isPublic: false })
    }

    const token = body.action === 'regenerate' || !audit.public_share_token
      ? createShareToken()
      : audit.public_share_token

    const sharedAt = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        public_share_token: token,
        is_public: true,
        public_shared_at: sharedAt,
      })
      .eq('id', audit.id)
      .eq('user_id', user.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({
      isPublic: true,
      token,
      publicUrl: getPublicReportUrl(req, token),
      sharedAt,
    })
  } catch (error) {
    console.error('[reports/share]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create public report link' },
      { status: 500 },
    )
  }
}
