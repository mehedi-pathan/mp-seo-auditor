import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

interface SearchPayload {
  query?: string
}

interface OpenAiEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>
}

interface AuditSearchRow {
  id: string
  url: string
  domain: string
  seo_score: number
  performance_score: number
  accessibility_score: number
  created_at: string
  similarity?: number
}

const toVectorLiteral = (values: number[]) => `[${values.join(',')}]`

async function getUserId(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

async function textFallback(userId: string, query: string): Promise<AuditSearchRow[]> {
  const supabase = createServiceClient()
  const normalized = `%${query.trim()}%`
  const { data, error } = await supabase
    .from('audits')
    .select('id,url,domain,seo_score,performance_score,accessibility_score,created_at')
    .eq('user_id', userId)
    .or(`domain.ilike.${normalized},url.ilike.${normalized},ai_summary.ilike.${normalized}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data || []) as AuditSearchRow[]
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const userId = await getUserId(req)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { query } = (await req.json()) as SearchPayload
    const trimmedQuery = query?.trim()
    if (!trimmedQuery) return jsonResponse({ results: [] })

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return jsonResponse({ results: await textFallback(userId, trimmedQuery), source: 'text' })
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: trimmedQuery }),
    })

    if (!embeddingResponse.ok) {
      return jsonResponse({ results: await textFallback(userId, trimmedQuery), source: 'text' })
    }

    const embeddingJson = (await embeddingResponse.json()) as OpenAiEmbeddingResponse
    const embedding = embeddingJson.data?.[0]?.embedding
    if (!embedding || embedding.length !== 1536) {
      return jsonResponse({ results: await textFallback(userId, trimmedQuery), source: 'text' })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('match_audits', {
      query_embedding: toVectorLiteral(embedding),
      match_user_id: userId,
      match_threshold: 0.72,
      match_count: 20,
    })

    if (error) throw error
    const results = (data || []) as AuditSearchRow[]

    return jsonResponse({
      results: results.length > 0 ? results : await textFallback(userId, trimmedQuery),
      source: results.length > 0 ? 'semantic' : 'text',
    })
  } catch (error) {
    console.error('[semantic-search]', error)
    return errorResponse('Unable to search audits', 500)
  }
})

