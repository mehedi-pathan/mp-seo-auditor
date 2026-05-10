import { NextRequest, NextResponse } from 'next/server'
import { scanUrl } from '@/lib/scanEngine'
import { analyzeAuditResults } from '@/lib/aiService'
import { getPageSpeedAnalysis } from '@/lib/pageSpeed'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { AuditResult, Fix } from '@/types'
import { getEffectivePlan, getPlanEntitlements } from '@/lib/planAccess'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'

interface ScanRequestBody {
  url?: string
  userId?: string
  sessionId?: string
}

interface ProfileRow {
  id: string
  plan: string | null
  plan_expires_at?: string | null
  scans_today: number | null
  scans_reset_at: string | null
}

interface ScanFunctionResponse {
  audit?: AuditResult
  error?: string
  code?: string
}

interface AiFunctionResponse {
  summary?: string
  topFixes?: Fix[]
  quickWins?: string[]
  error?: string
}

const nextMonthlyReset = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

const updateScanSession = async (
  sessionId: string | undefined,
  values: {
    progress: number
    step: string
    status: 'queued' | 'running' | 'complete' | 'error'
    user_id?: string
    url?: string
    audit_id?: string
    error_message?: string
  },
) => {
  if (!sessionId) return

  const payload = {
    ...values,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('scan_sessions')
    .upsert(
      {
        id: sessionId,
        ...payload,
      },
      { onConflict: 'id' },
    )

  if (error) {
    console.error('[scan] Session update error:', error)
  }
}

const runEdgeScan = async (url: string, sessionId?: string) => {
  const { data, error } = await supabaseAdmin.functions.invoke<ScanFunctionResponse>('scan-url', {
    body: { url, sessionId },
  })

  if (error || !data?.audit) {
    throw new Error(data?.error || error?.message || 'scan-url Edge Function unavailable')
  }

  return data.audit
}

const runEdgeAiSummary = async (audit: AuditResult, sessionId?: string) => {
  const { data, error } = await supabaseAdmin.functions.invoke<AiFunctionResponse>('ai-summary', {
    body: { audit, sessionId },
  })

  if (error || !data?.summary || !data.topFixes || !data.quickWins) {
    throw new Error(data?.error || error?.message || 'ai-summary Edge Function unavailable')
  }

  return {
    summary: data.summary,
    topFixes: data.topFixes,
    quickWins: data.quickWins,
  }
}

const buildEmbeddingText = (audit: AuditResult) => {
  return [
    audit.domain,
    audit.url,
    audit.aiSummary,
    `SEO ${audit.scores.seo}`,
    `Performance ${audit.scores.performance}`,
    `Accessibility ${audit.scores.accessibility}`,
    audit.topFixes.map(fix => `${fix.title}: ${fix.description}`).join('\n'),
    audit.quickWins.join('\n'),
    audit.meta.title || '',
    audit.meta.description || '',
  ].filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  let requestBody: ScanRequestBody | null = null

  try {
    requestBody = (await req.json()) as ScanRequestBody
    const { url: rawUrl, userId, sessionId } = requestBody

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const url = normalizeWebsiteUrl(rawUrl)

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    let profile: ProfileRow | null = null
    let scansToday = 0
    let scansResetAt = nextMonthlyReset()

    await updateScanSession(sessionId, {
      user_id: userId,
      url,
      progress: 0,
      step: 'Queued',
      status: 'queued',
    })

    if (userId) {
      let { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id,plan,plan_expires_at,scans_today,scans_reset_at')
        .eq('id', userId)
        .single()

      if (error) {
        const fallback = await supabaseAdmin
          .from('profiles')
          .select('id,plan,scans_today,scans_reset_at')
          .eq('id', userId)
          .single()

        data = fallback.data ? { ...fallback.data, plan_expires_at: null } : null
        error = fallback.error
      }

      if (error) {
        console.error('[scan] Profile lookup error:', error)
      } else if (data) {
        profile = data
        const resetAt = data.scans_reset_at ? new Date(data.scans_reset_at) : new Date(0)

        if (resetAt <= new Date()) {
          scansToday = 0
          scansResetAt = nextMonthlyReset()
          await supabaseAdmin
            .from('profiles')
            .update({ scans_today: 0, scans_reset_at: scansResetAt })
            .eq('id', userId)
        } else {
          scansToday = data.scans_today || 0
          scansResetAt = data.scans_reset_at || nextMonthlyReset()
        }

        const effectivePlan = getEffectivePlan(data.plan, data.plan_expires_at)
        const limit = getPlanEntitlements(effectivePlan).auditLimit

        if (limit !== null && scansToday >= limit) {
          return NextResponse.json(
            {
              error: `Monthly audit limit reached. Free includes 5 audits, Pro includes 100 audits, and Business is unlimited.`,
              code: 'AUDIT_LIMIT_REACHED',
              plan: effectivePlan,
              used: scansToday,
              limit,
            },
            { status: 402 }
          )
        }
      }
    }

    await updateScanSession(sessionId, {
      progress: 10,
      step: 'Fetching page content',
      status: 'running',
    })

    let auditResult: AuditResult
    try {
      auditResult = await runEdgeScan(url, sessionId)
    } catch (edgeError) {
      console.warn('[scan] Edge scan unavailable, using local scan engine:', edgeError)
      auditResult = await scanUrl(url)
    }

    const pageSpeed = await getPageSpeedAnalysis(url)

    if (pageSpeed) {
      auditResult.pageSpeed = pageSpeed

      if (!pageSpeed.error) {
        auditResult.scores.performance = pageSpeed.scores.performance || auditResult.scores.performance
        auditResult.scores.accessibility = pageSpeed.scores.accessibility || auditResult.scores.accessibility
        auditResult.scores.seo = Math.round((auditResult.scores.seo + pageSpeed.scores.seo) / 2)
      }
    }

    let aiAnalysis: { summary: string; topFixes: Fix[]; quickWins: string[] }
    try {
      aiAnalysis = await runEdgeAiSummary(auditResult, sessionId)
    } catch (edgeError) {
      console.warn('[scan] Edge AI summary unavailable, using local AI service:', edgeError)
      await updateScanSession(sessionId, {
        progress: 75,
        step: 'Running AI analysis',
        status: 'running',
      })
      aiAnalysis = await analyzeAuditResults(auditResult)
      await updateScanSession(sessionId, {
        progress: 90,
        step: 'Generating report',
        status: 'running',
      })
    }

    auditResult.aiSummary = aiAnalysis.summary
    auditResult.topFixes = aiAnalysis.topFixes
    auditResult.quickWins = aiAnalysis.quickWins

    // Save to database if user is authenticated
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('audits')
        .insert({
          user_id: userId,
          url,
          domain: auditResult.domain,
          seo_score: auditResult.scores.seo,
          performance_score: auditResult.scores.performance,
          accessibility_score: auditResult.scores.accessibility,
          audit_data: auditResult,
          ai_summary: auditResult.aiSummary,
          top_fixes: auditResult.topFixes,
        })
        .select('id')
        .single()

      if (error) {
        console.error('[scan] Database error:', error)
      } else if (data) {
        auditResult.id = data.id
        await updateScanSession(sessionId, {
          progress: 100,
          step: 'Complete',
          status: 'complete',
          audit_id: data.id,
        })
        void supabaseAdmin.functions.invoke('generate-embedding', {
          body: {
            auditId: data.id,
            text: buildEmbeddingText(auditResult),
          },
        }).then(({ error }) => {
          if (error) console.warn('[scan] Embedding function unavailable:', error.message)
        }).catch(error => {
          console.warn('[scan] Embedding function failed:', error)
        })
      }

      if (profile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            scans_today: scansToday + 1,
            scans_reset_at: scansResetAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      }
    } else {
      await updateScanSession(sessionId, {
        progress: 100,
        step: 'Complete',
        status: 'complete',
      })
    }

    return NextResponse.json(auditResult)
  } catch (error) {
    console.error('[scan] Error:', error)
    const message = error instanceof Error ? error.message : ''

    await updateScanSession(requestBody?.sessionId, {
      progress: 100,
      step: 'Scan failed',
      status: 'error',
      error_message: message || 'Failed to scan URL',
    })

    if (
      message.includes('SITE_UNREACHABLE') ||
      message.includes('fetch failed') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('Failed to scan URL')
    ) {
      return NextResponse.json(
        {
          error: 'This site is not reachable. Please check and fix the URL, then enter the actual working website URL.',
          code: 'SITE_UNREACHABLE',
        },
        { status: 422 },
      )
    }

    return NextResponse.json({ error: 'Failed to scan URL' }, { status: 500 })
  }
}
