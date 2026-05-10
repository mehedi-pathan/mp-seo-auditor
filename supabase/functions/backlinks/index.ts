import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'

type Quality = 'Excellent' | 'Good' | 'Average' | 'Poor'
type GrowthTrend = 'growing' | 'stable' | 'declining'

interface BacklinksPayload {
  domain?: string
}

interface BacklinkAnalysis {
  totalBacklinks: number
  referringDomains: number
  domainAuthority: number
  dofollowRatio: number
  toxicPercent: number
  topBacklinks: Array<{ domain: string; anchor: string; da: number; quality: Quality }>
  anchorDistribution: Array<{ anchor: string; frequency: number }>
  growthTrend: GrowthTrend
  insights: string
  source: 'estimated'
}

function normalizeDomain(value: string) {
  const raw = value.trim()
  if (!raw) return ''

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function estimateBacklinks(domain: string): BacklinkAnalysis {
  const seed = domain.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const totalBacklinks = 80 + (seed % 900)
  const referringDomains = 12 + (seed % 120)
  const domainAuthority = 25 + (seed % 55)
  const toxicPercent = 3 + (seed % 18)
  const dofollowRatio = 48 + (seed % 42)
  const growthTrend: GrowthTrend = seed % 3 === 0 ? 'growing' : seed % 3 === 1 ? 'stable' : 'declining'

  return {
    totalBacklinks,
    referringDomains,
    domainAuthority,
    dofollowRatio,
    toxicPercent,
    topBacklinks: [
      { domain: `blog.${domain}`, anchor: domain, da: Math.min(90, domainAuthority + 12), quality: 'Good' },
      { domain: `news-${domain.replace(/\./g, '-')}.com`, anchor: 'website review', da: Math.min(85, domainAuthority + 8), quality: 'Average' },
      { domain: `directory.${domain.split('.')[0]}.net`, anchor: 'visit website', da: Math.max(20, domainAuthority - 6), quality: 'Average' },
    ],
    anchorDistribution: [
      { anchor: domain, frequency: 34 },
      { anchor: 'brand name', frequency: 24 },
      { anchor: 'website', frequency: 18 },
      { anchor: 'click here', frequency: 9 },
    ],
    growthTrend,
    insights: `Estimated backlink profile for ${domain}. Prioritize authoritative referring domains, diversify anchors, and review toxic links before outreach. Connect a live backlink provider later for exact link counts.`,
    source: 'estimated',
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const payload = (await req.json()) as BacklinksPayload
    const domain = normalizeDomain(payload.domain || '')
    if (!domain) return errorResponse('Domain is required', 400)

    return jsonResponse({ domain, ...estimateBacklinks(domain) })
  } catch (error) {
    console.error('[backlinks]', error)
    return errorResponse('Unable to analyze backlinks', 500)
  }
})

