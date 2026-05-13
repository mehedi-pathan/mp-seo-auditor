import type { PageSpeedAnalysis, PageSpeedAudit, PageSpeedDeviceAnalysis, PageSpeedSnapshot } from '@/types'

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
    data?: string
    timing?: number
    screenshot?: {
      data?: string
      width?: number
      height?: number
    }
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

const getSnapshot = (audits: Record<string, LighthouseAudit>): PageSpeedSnapshot | undefined => {
  const finalScreenshot = audits['final-screenshot']?.details
  const fullPageScreenshot = audits['full-page-screenshot']?.details?.screenshot
  const data = finalScreenshot?.data || fullPageScreenshot?.data

  if (!data) {
    return undefined
  }

  return {
    data,
    width: fullPageScreenshot?.width,
    height: fullPageScreenshot?.height,
  }
}

const emptyPageSpeedResult = (
  strategy: 'mobile' | 'desktop',
  error: string
): PageSpeedAnalysis => ({
  strategy,
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
  error,
})

const friendlyPageSpeedError = (error: unknown) => {
  if (error instanceof Error) {
    const message = error.message || ''
    if (error.name === 'AbortError' || message.toLowerCase().includes('aborted')) {
      return 'Google PageSpeed took too long to finish this device crawl. Your main SEO audit is still based on live page data.'
    }
    return message
  }

  return 'Google PageSpeed could not complete this device crawl. Your main SEO audit is still based on live page data.'
}

export async function getPageSpeedAnalysis(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedAnalysis | null> {
  const key = process.env.PAGESPEED_API_KEY

  if (!key) {
    return null
  }

  const params = new URLSearchParams({
    url,
    key,
    strategy,
    category: 'performance',
  })

  params.append('category', 'accessibility')
  params.append('category', 'best-practices')
  params.append('category', 'seo')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 65000)

  try {
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`, {
      next: { revalidate: 0 },
      signal: controller.signal,
    })

    if (!response.ok) {
      return emptyPageSpeedResult(strategy, `PageSpeed request failed with ${response.status}`)
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
      strategy,
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
      snapshot: getSnapshot(audits),
      source: 'pagespeed-insights',
    }
  } catch (error) {
    return emptyPageSpeedResult(strategy, friendlyPageSpeedError(error))
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getDualPageSpeedAnalysis(url: string): Promise<PageSpeedDeviceAnalysis | null> {
  const key = process.env.PAGESPEED_API_KEY

  if (!key) {
    return null
  }

  const [mobile, desktop] = await Promise.all([
    getPageSpeedAnalysis(url, 'mobile'),
    getPageSpeedAnalysis(url, 'desktop'),
  ])

  return { mobile, desktop }
}
