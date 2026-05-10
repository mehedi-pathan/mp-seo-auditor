import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getEffectivePlan, getPlanEntitlements } from '@/lib/planAccess'
import type { Plan } from '@/types'

interface AuditPdfRow {
  id: string
  user_id: string
  pdf_url: string | null
  pdf_generated_at: string | null
}

const bucketName = 'audit-reports'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

async function createSignedUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Unable to create signed report URL')
  }

  return data.signedUrl
}

async function canExportPdf(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('plan,plan_expires_at')
    .eq('id', userId)
    .single()

  if (error) {
    const fallback = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    const fallbackPlan = (fallback.data?.plan || 'free') as Plan
    return getPlanEntitlements(fallbackPlan).canExportPdf
  }

  const plan = getEffectivePlan((data?.plan || 'free') as Plan, data?.plan_expires_at || null)
  return getPlanEntitlements(plan).canExportPdf
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await canExportPdf(user.id))) {
      return NextResponse.json({ error: 'PDF export is available on Pro and Business packages.' }, { status: 402 })
    }

    const auditId = req.nextUrl.searchParams.get('auditId')
    if (!auditId) return NextResponse.json({ error: 'auditId is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('audits')
      .select('id,user_id,pdf_url,pdf_generated_at')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    const audit = data as AuditPdfRow
    if (!audit.pdf_url) return NextResponse.json({ error: 'PDF has not been generated' }, { status: 404 })

    const signedUrl = await createSignedUrl(audit.pdf_url)
    return NextResponse.json({ signedUrl, path: audit.pdf_url, generatedAt: audit.pdf_generated_at })
  } catch (error) {
    console.error('[pdf GET]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load PDF' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await canExportPdf(user.id))) {
      return NextResponse.json({ error: 'PDF export is available on Pro and Business packages.' }, { status: 402 })
    }

    const formData = await req.formData()
    const auditId = formData.get('auditId')
    const file = formData.get('file')

    if (typeof auditId !== 'string') {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 })
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
    }

    const { data: auditData, error: auditError } = await supabaseAdmin
      .from('audits')
      .select('id,user_id,pdf_url,pdf_generated_at')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 })
    if (!auditData) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    const existingAudit = auditData as AuditPdfRow
    if (existingAudit.pdf_url) {
      const signedUrl = await createSignedUrl(existingAudit.pdf_url)
      return NextResponse.json({ signedUrl, path: existingAudit.pdf_url, generatedAt: existingAudit.pdf_generated_at })
    }

    const path = `${user.id}/${auditId}/report.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(path, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const generatedAt = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        pdf_url: path,
        pdf_generated_at: generatedAt,
      })
      .eq('id', auditId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const signedUrl = await createSignedUrl(path)
    return NextResponse.json({ signedUrl, path, generatedAt })
  } catch (error) {
    console.error('[pdf POST]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to store PDF' }, { status: 500 })
  }
}
