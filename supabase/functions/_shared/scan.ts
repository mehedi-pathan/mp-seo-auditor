import * as cheerio from 'npm:cheerio@1.2.0'

type ScoreLevel = 'excellent' | 'good' | 'poor'
type ImpactLevel = 'high' | 'medium' | 'low'
type Status = 'pass' | 'fail' | 'warning'

export interface Fix {
  title: string
  description: string
  impact: ImpactLevel
}

export interface PageSpeedAudit {
  id: string
  title: string
  description: string
  score: number | null
  displayValue: string | null
  savingsMs?: number
  savingsBytes?: number
}

export interface PageSpeedAnalysis {
  strategy: 'mobile' | 'desktop'
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  metrics: {
    firstContentfulPaint: string | null
    largestContentfulPaint: string | null
    totalBlockingTime: string | null
    cumulativeLayoutShift: string | null
    speedIndex: string | null
  }
  opportunities: PageSpeedAudit[]
  diagnostics: PageSpeedAudit[]
  passedAudits: number
  fetchedAt: string
  source: 'pagespeed-insights'
  error?: string
}

export interface AuditResult {
  id: string
  url: string
  domain: string
  scores: {
    seo: number
    performance: number
    accessibility: number
  }
  meta: {
    title: string | null
    titleLength: number
    titleScore: ScoreLevel
    description: string | null
    descriptionLength: number
    descriptionScore: ScoreLevel
    canonical: string | null
    robots: string | null
    openGraph: {
      title: string | null
      description: string | null
      image: string | null
      type: string | null
      complete: boolean
    }
    twitter: {
      card: string | null
      title: string | null
      description: string | null
      image: string | null
      complete: boolean
    }
  }
  headings: {
    h1: { count: number; items: string[]; issues: string[]; status: Status }
    h2: { count: number; items: string[] }
    h3: { count: number; items: string[] }
    h4: { count: number; items: string[] }
    h5: { count: number; items: string[] }
    h6: { count: number; items: string[] }
    hierarchyIssues: string[]
    status: Status
  }
  content: {
    wordCount: number
    wordCountRating: 'excellent' | 'good' | 'low'
    readabilityScore: number
    topKeywords: Array<{ keyword: string; count: number; density: number }>
    keywordStuffingWarning: boolean
  }
  technical: {
    checks: Array<{ name: string; status: Status; description: string }>
    https: Status
    viewport: Status
    sitemap: Status
    robotsTxt: Status
    structuredData: Status
    gzip: Status
    caching: Status
    minifiedCss: Status
    minifiedJs: Status
    imageAltTags: Status
    pageSpeedGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    loadTime: number
    canonicalTag: Status
    hreflangs: Status
  }
  social: {
    score: number
    openGraphComplete: boolean
    twitterCardComplete: boolean
    missingFields: string[]
  }
  links: {
    internal: { count: number; links: string[] }
    external: { count: number; links: string[] }
    nofollow: number
    broken: number
    equityScore: number
  }
  pageSpeed?: PageSpeedAnalysis
  aiSummary: string
  topFixes: Fix[]
  quickWins: string[]
  createdAt: string
}

type ProgressCallback = (progress: number, step: string, status?: 'running' | 'complete' | 'error') => Promise<void>

const stopWords = new Set(['that', 'this', 'from', 'with', 'have', 'been', 'were', 'will', 'your', 'which', 'there', 'their'])

const textList = ($: cheerio.CheerioAPI, selector: string) =>
  $(selector)
    .map((_, el) => $(el).text().trim().replace(/\s+/g, ' '))
    .get()
    .filter(Boolean)

const statusFrom = (value: boolean): Status => (value ? 'pass' : 'warning')

export async function scanWebsite(url: string, onProgress?: ProgressCallback): Promise<AuditResult> {
  await onProgress?.(10, 'Fetching page content')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 18000)
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MPSEOBot/1.0)' },
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new Error(`SITE_UNREACHABLE:${response.status}`)
  }

  const html = await response.text()
  await onProgress?.(30, 'Parsing HTML structure')

  const $ = cheerio.load(html)
  const domain = new URL(url).hostname
  const title = $('title').text().trim() || null
  const description = $('meta[name="description"]').attr('content') || null
  const canonical = $('link[rel="canonical"]').attr('href') || null
  const robots = $('meta[name="robots"]').attr('content') || null
  const ogTitle = $('meta[property="og:title"]').attr('content') || null
  const ogDescription = $('meta[property="og:description"]').attr('content') || null
  const ogImage = $('meta[property="og:image"]').attr('content') || null
  const ogType = $('meta[property="og:type"]').attr('content') || null
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || null
  const twitterTitle = $('meta[name="twitter:title"]').attr('content') || null
  const twitterDescription = $('meta[name="twitter:description"]').attr('content') || null
  const twitterImage = $('meta[name="twitter:image"]').attr('content') || null
  const h1 = textList($, 'h1')
  const h2 = textList($, 'h2')
  const h3 = textList($, 'h3')
  const h4 = textList($, 'h4')
  const h5 = textList($, 'h5')
  const h6 = textList($, 'h6')
  const hierarchyIssues: string[] = []

  if (h1.length === 0) hierarchyIssues.push('Missing H1 tag')
  if (h1.length > 1) hierarchyIssues.push(`Multiple H1 tags (${h1.length})`)
  if (h1.length > 0 && h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
    hierarchyIssues.push('Heading hierarchy broken: H1 should be followed by H2')
  }

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length
  const words = bodyText.toLowerCase().split(/\W+/).filter(word => word.length > 3 && !stopWords.has(word))
  const frequencies = words.reduce<Record<string, number>>((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {})
  const topKeywords = Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count, density: wordCount > 0 ? (count / wordCount) * 100 : 0 }))

  const hasHttps = url.startsWith('https')
  const hasViewport = Boolean($('meta[name="viewport"]').attr('content'))
  const hasSitemap = html.includes('sitemap')
  const hasRobots = html.includes('robots')
  const hasSchemaData = html.includes('application/ld+json') || html.includes('schema.org')
  const hasGzip = response.headers.get('content-encoding')?.includes('gzip') ?? false
  const cacheControl = response.headers.get('cache-control')
  const images = $('img')
  const imagesWithAlt = $('img[alt]').length
  const altTagRatio = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100
  const cssCount = (html.match(/<style[^>]*>/gi) || []).length
  const isMinified = cssCount === 0 || !html.includes(';\n')
  const hasCanonical = Boolean(canonical)
  const hasHreflang = Boolean($('link[rel="alternate"]').attr('hreflang'))
  const technicalChecks = [
    { name: 'HTTPS/SSL', status: hasHttps ? 'pass' : 'fail', description: hasHttps ? 'Website uses HTTPS' : 'Website not secured with HTTPS' },
    { name: 'Mobile Friendly Viewport', status: hasViewport ? 'pass' : 'fail', description: hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta tag' },
    { name: 'XML Sitemap', status: statusFrom(hasSitemap), description: hasSitemap ? 'Sitemap reference found' : 'No sitemap reference detected' },
    { name: 'Robots.txt', status: statusFrom(hasRobots), description: hasRobots ? 'Robots.txt reference found' : 'No robots.txt reference detected' },
    { name: 'Structured Data', status: statusFrom(hasSchemaData), description: hasSchemaData ? 'JSON-LD schema found' : 'No structured data detected' },
    { name: 'Gzip Compression', status: statusFrom(hasGzip), description: hasGzip ? 'Gzip enabled' : 'Gzip compression not detected' },
    { name: 'Browser Caching', status: statusFrom(Boolean(cacheControl)), description: cacheControl ? 'Cache headers present' : 'No cache headers found' },
    { name: 'Image Alt Tags', status: altTagRatio === 100 ? 'pass' : altTagRatio > 80 ? 'warning' : 'fail', description: `${Math.round(altTagRatio)}% of images have alt text` },
    { name: 'Canonical Tag', status: statusFrom(hasCanonical), description: hasCanonical ? 'Canonical URL defined' : 'No canonical URL' },
  ] satisfies Array<{ name: string; status: Status; description: string }>

  const internalLinks: string[] = []
  const externalLinks: string[] = []
  let nofollowCount = 0
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const rel = $(el).attr('rel') || ''
    if (rel.includes('nofollow')) nofollowCount += 1
    if (href.startsWith('http')) {
      try {
        const linkDomain = new URL(href).hostname
        if (linkDomain === domain) internalLinks.push(href)
        else externalLinks.push(href)
      } catch {
        // Ignore malformed anchors.
      }
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      internalLinks.push(href)
    }
  })

  await onProgress?.(55, 'Analyzing SEO signals')

  const metaScore = (value: string | null, min: number, max: number): ScoreLevel =>
    value && value.length >= min && value.length <= max ? 'excellent' : value && value.length > 30 ? 'good' : 'poor'
  const titleScore = metaScore(title, 50, 60)
  const descriptionScore = metaScore(description, 150, 160)
  let seoScore = 0
  if (titleScore === 'excellent') seoScore += 15
  else if (title) seoScore += 8
  if (descriptionScore === 'excellent') seoScore += 15
  else if (description) seoScore += 8
  if (h1.length === 1) seoScore += 15
  if (h1.length === 1 && hierarchyIssues.length === 0) seoScore += 10
  if (canonical) seoScore += 10
  if (ogTitle && ogDescription && ogImage && ogType) seoScore += 10
  if (wordCount > 300) seoScore += 5
  if (!topKeywords.some(keyword => keyword.density > 5)) seoScore += 5
  if (internalLinks.length > 3) seoScore += 5
  if (hasHttps) seoScore += 10
  if (hasSchemaData) seoScore += 10

  let performanceScore = 0
  if (html.length < 50000) performanceScore += 20
  else if (html.length < 100000) performanceScore += 10
  if (hasHttps) performanceScore += 20
  if (hasGzip) performanceScore += 20
  if (cacheControl) performanceScore += 15
  if ((html.match(/<link[^>]*\.css/gi) || []).length < 3) performanceScore += 10
  if ((html.match(/<script[^>]*\.js/gi) || []).length < 5) performanceScore += 10

  let accessibilityScore = 0
  if (altTagRatio === 100) accessibilityScore += 30
  if (hasViewport) accessibilityScore += 20
  if ($('html').attr('lang')) accessibilityScore += 20
  if (h1.length === 1) accessibilityScore += 15
  if ($('[style]').length === 0) accessibilityScore += 15

  return {
    id: '',
    url,
    domain,
    scores: {
      seo: Math.min(100, seoScore),
      performance: Math.min(100, performanceScore),
      accessibility: Math.min(100, accessibilityScore),
    },
    meta: {
      title,
      titleLength: title?.length || 0,
      titleScore,
      description,
      descriptionLength: description?.length || 0,
      descriptionScore,
      canonical,
      robots,
      openGraph: { title: ogTitle, description: ogDescription, image: ogImage, type: ogType, complete: Boolean(ogTitle && ogDescription && ogImage && ogType) },
      twitter: { card: twitterCard, title: twitterTitle, description: twitterDescription, image: twitterImage, complete: Boolean(twitterCard && twitterTitle && twitterDescription && twitterImage) },
    },
    headings: {
      h1: { count: h1.length, items: h1, issues: h1.length !== 1 ? ['Invalid H1'] : [], status: h1.length === 1 ? 'pass' : 'fail' },
      h2: { count: h2.length, items: h2 },
      h3: { count: h3.length, items: h3 },
      h4: { count: h4.length, items: h4 },
      h5: { count: h5.length, items: h5 },
      h6: { count: h6.length, items: h6 },
      hierarchyIssues,
      status: hierarchyIssues.length === 0 ? 'pass' : hierarchyIssues.length === 1 ? 'warning' : 'fail',
    },
    content: {
      wordCount,
      wordCountRating: wordCount > 300 ? 'excellent' : wordCount > 100 ? 'good' : 'low',
      readabilityScore: Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (wordCount / Math.max(1, bodyText.split(/[.!?]+/).length))))),
      topKeywords,
      keywordStuffingWarning: topKeywords.some(keyword => keyword.density > 5),
    },
    technical: {
      checks: technicalChecks,
      https: hasHttps ? 'pass' : 'fail',
      viewport: hasViewport ? 'pass' : 'fail',
      sitemap: statusFrom(hasSitemap),
      robotsTxt: statusFrom(hasRobots),
      structuredData: statusFrom(hasSchemaData),
      gzip: statusFrom(hasGzip),
      caching: statusFrom(Boolean(cacheControl)),
      minifiedCss: statusFrom(isMinified),
      minifiedJs: 'warning',
      imageAltTags: altTagRatio === 100 ? 'pass' : altTagRatio > 80 ? 'warning' : 'fail',
      pageSpeedGrade: html.length < 50000 ? 'A' : html.length < 100000 ? 'B' : html.length < 200000 ? 'C' : 'F',
      loadTime: 0,
      canonicalTag: statusFrom(hasCanonical),
      hreflangs: statusFrom(hasHreflang),
    },
    social: {
      score: ([ogTitle, ogDescription, ogImage, ogType, twitterCard, twitterTitle, twitterDescription].filter(Boolean).length / 8) * 100,
      openGraphComplete: Boolean(ogTitle && ogDescription && ogImage && ogType),
      twitterCardComplete: Boolean(twitterCard && twitterTitle && twitterDescription),
      missingFields: [
        !ogTitle ? 'og:title' : '',
        !ogDescription ? 'og:description' : '',
        !ogImage ? 'og:image' : '',
        !twitterCard ? 'twitter:card' : '',
      ].filter(Boolean),
    },
    links: {
      internal: { count: internalLinks.length, links: [...new Set(internalLinks)] },
      external: { count: externalLinks.length, links: [...new Set(externalLinks)].slice(0, 20) },
      nofollow: nofollowCount,
      broken: 0,
      equityScore: internalLinks.length > 3 ? 80 : internalLinks.length > 0 ? 50 : 20,
    },
    aiSummary: '',
    topFixes: [],
    quickWins: [],
    createdAt: new Date().toISOString(),
  }
}

