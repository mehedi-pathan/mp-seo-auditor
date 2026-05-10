import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

interface SemanticSearchPayload {
  query?: string
}

interface SemanticSearchResponse {
  results?: unknown[]
  source?: 'semantic' | 'text'
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await req.json()) as SemanticSearchPayload
    const query = payload.query?.trim()

    if (!query) {
      return NextResponse.json({ results: [], source: 'text' })
    }

    const { data, error } = await supabaseAdmin.functions.invoke<SemanticSearchResponse>('semantic-search', {
      headers: { Authorization: authHeader },
      body: { query },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { results: [], source: 'text' })
  } catch (error) {
    console.error('[semantic-search route]', error)
    return NextResponse.json({ error: 'Unable to search audits' }, { status: 500 })
  }
}

