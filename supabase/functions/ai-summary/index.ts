import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { analyzeWithClaude } from '../_shared/analysis.ts'
import type { AuditResult } from '../_shared/scan.ts'

interface AiSummaryPayload {
  audit?: AuditResult
  sessionId?: string
}

async function updateProgress(sessionId: string | undefined, progress: number, step: string) {
  if (!sessionId) return

  try {
    const supabase = createServiceClient()
    await supabase
      .from('scan_sessions')
      .update({
        progress,
        step,
        status: 'running',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  } catch (error) {
    console.error('[ai-summary] progress update failed', error)
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const payload = (await req.json()) as AiSummaryPayload
    if (!payload.audit) return errorResponse('Audit data is required', 400)

    await updateProgress(payload.sessionId, 75, 'Running AI analysis')
    const analysis = await analyzeWithClaude(payload.audit)
    await updateProgress(payload.sessionId, 90, 'Generating report')

    return jsonResponse(analysis)
  } catch (error) {
    console.error('[ai-summary]', error)
    return errorResponse('Unable to generate AI summary', 500)
  }
})

