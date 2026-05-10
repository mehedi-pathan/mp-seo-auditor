import type { PageSpeedAnalysis, PageSpeedAudit } from '@/types'

type LighthouseAudit = {
  id: string
  title: string
  description: string
  score: number | null
  scoreDisplayMode?: string
  displayValue?: string
  details?: {
    overallSavingsMs?: number
    overallSavingsBytes?: number
  }
}

type LighthouseCategory = {
  score?: number
  auditRefs?: Array<{
    id: string
    weight: number
    group?: string
  }>
}

type PageSpeedResponse = {
  lighthouseResult?: {
    fetchTime?: string
    categories?: {
      performance?: LighthouseCategory
      accessibility?: LighthouseCategory
      'best-practices'?: LighthouseCategory
      seo?: LighthouseCategory
    }
    audits?: Record<string, LighthouseAudit>
  }
}

const toScore = (score?: number) => Math.round((score ?? 0) * 100)

const compactAudit = (audit: LighthouseAudit): PageSpeedAudit => ({
  id: audit.id,
  title: audit.title,
  description: audit.description,
  score: audit.score,
  displayValue: audit.displayValue || null,
  savingsMs: audit.details?.overallSavingsMs,
  savingsBytes: audit.details?.overallSavingsBytes,
})

const metricValue = (audits: Record<string, LighthouseAudit>, id: string) =>
  audits[id]?.displayValue || null

export async function getPageSpeedAnalysis(url: string): Promise<PageSpeedAnalysis | null> {
  const key = process.env.PAGESPEED_API_KEY

  if (!key) {
    return null
  }

  const params = new URLSearchParams({
    url,
    key,
    strategy: 'mobile',
    category: 'performance',
  })

  params.append('category', 'accessibility')
  params.append('category', 'best-practices')
  params.append('category', 'seo')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

  try {
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`, {
      next: { revalidate: 0 },
      signal: controller.signal,
    })

    if (!response.ok) {
      return {
        strategy: 'mobile',
        scores: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
        },
        metrics: {
          firstContentfulPaint: null,
          largestContentfulPaint: null,
          totalBlockingTime: null,
          cumulativeLayoutShift: null,
          speedIndex: null,
        },
        opportunities: [],
        diagnostics: [],
        passedAudits: 0,
        fetchedAt: new Date().toISOString(),
        source: 'pagespeed-insights',
        error: `PageSpeed request failed with ${response.status}`,
      }
    }

    const json = (await response.json()) as PageSpeedResponse
    const lighthouse = json.lighthouseResult
    const audits = lighthouse?.audits || {}
    const categories = lighthouse?.categories || {}

    const auditList = Object.values(audits)
    const opportunities = auditList
      .filter(audit =>
        audit.scoreDisplayMode === 'metricSavings' &&
        audit.score !== null &&
        audit.score < 0.9
      )
      .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
      .slice(0, 8)
      .map(compactAudit)

    const diagnostics = [
      'render-blocking-resources',
      'unused-javascript',
      'unused-css-rules',
      'modern-image-formats',
      'uses-responsive-images',
      'uses-optimized-images',
      'canonical',
      'document-title',
      'meta-description',
      'crawlable-anchors',
      'robots-txt',
      'structured-data',
      'is-crawlable',
      'viewport',
    ]
      .map(id => audits[id])
      .filter((audit): audit is LighthouseAudit => Boolean(audit && audit.score !== null && audit.score < 1))
      .slice(0, 10)
      .map(compactAudit)

    return {
      strategy: 'mobile',
      scores: {
        performance: toScore(categories.performance?.score),
        accessibility: toScore(categories.accessibility?.score),
        bestPractices: toScore(categories['best-practices']?.score),
        seo: toScore(categories.seo?.score),
      },
      metrics: {
        firstContentfulPaint: metricValue(audits, 'first-contentful-paint'),
        largestContentfulPaint: metricValue(audits, 'largest-contentful-paint'),
        totalBlockingTime: metricValue(audits, 'total-blocking-time'),
        cumulativeLayoutShift: metricValue(audits, 'cumulative-layout-shift'),
        speedIndex: metricValue(audits, 'speed-index'),
      },
      opportunities,
      diagnostics,
      passedAudits: auditList.filter(audit => audit.score === 1).length,
      fetchedAt: lighthouse?.fetchTime || new Date().toISOString(),
      source: 'pagespeed-insights',
    }
  } catch (error) {
    return {
      strategy: 'mobile',
      scores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      },
      metrics: {
        firstContentfulPaint: null,
        largestContentfulPaint: null,
        totalBlockingTime: null,
        cumulativeLayoutShift: null,
        speedIndex: null,
      },
      opportunities: [],
      diagnostics: [],
      passedAudits: 0,
      fetchedAt: new Date().toISOString(),
      source: 'pagespeed-insights',
      error: error instanceof Error ? error.message : 'PageSpeed request failed',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
