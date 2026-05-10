import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { scanWebsite } from '../_shared/scan.ts'
import { normalizeWebsiteUrl } from '../_shared/normalize-url.ts'

interface ScanPayload {
  url?: string
  sessionId?: string
}

async function updateProgress(sessionId: string | undefined, progress: number, step: string, status: 'running' | 'complete' | 'error' = 'running') {
  if (!sessionId) return

  try {
    const supabase = createServiceClient()
    await supabase
      .from('scan_sessions')
      .update({
        progress,
        step,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  } catch (error) {
    console.error('[scan-url] progress update failed', error)
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const payload = (await req.json()) as ScanPayload
    if (!payload.url) return errorResponse('URL is required', 400)

    const url = normalizeWebsiteUrl(payload.url)

    try {
      new URL(url)
    } catch {
      return errorResponse('Invalid URL format', 400)
    }

    const audit = await scanWebsite(url, (progress, step, status) =>
      updateProgress(payload.sessionId, progress, step, status),
    )

    return jsonResponse({ audit })
  } catch (error) {
    console.error('[scan-url]', error)
    const message = error instanceof Error ? error.message : 'Failed to scan URL'
    const isUnreachable = message.includes('SITE_UNREACHABLE') || message.includes('AbortError')
    return errorResponse(
      isUnreachable
        ? 'This site is not reachable. Please check and fix the URL, then enter the actual working website URL.'
        : 'Failed to scan URL',
      isUnreachable ? 422 : 500,
      isUnreachable ? 'SITE_UNREACHABLE' : undefined,
    )
  }
})
