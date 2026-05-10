import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

interface EmbeddingPayload {
  auditId?: string
  text?: string
}

interface OpenAiEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>
}

const toVectorLiteral = (values: number[]) => `[${values.join(',')}]`

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const { auditId, text } = (await req.json()) as EmbeddingPayload
    if (!auditId || !text) return errorResponse('auditId and text are required', 400)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return jsonResponse({ skipped: true, reason: 'OPENAI_API_KEY is not configured' })
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    })

    if (!response.ok) {
      return errorResponse(`Embedding request failed with ${response.status}`, 502)
    }

    const json = (await response.json()) as OpenAiEmbeddingResponse
    const embedding = json.data?.[0]?.embedding
    if (!embedding || embedding.length !== 1536) return errorResponse('Invalid embedding response', 502)

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('audits')
      .update({ embedding: toVectorLiteral(embedding) })
      .eq('id', auditId)

    if (error) return errorResponse(error.message, 500)

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('[generate-embedding]', error)
    return errorResponse('Unable to generate embedding', 500)
  }
})

