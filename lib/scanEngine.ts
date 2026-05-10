import * as cheerio from 'cheerio'
import type { AuditResult, MetaAnalysis, HeadingAnalysis, ContentAnalysis, TechnicalChecklist, SocialAnalysis, LinkAnalysis } from '@/types'

export async function scanUrl(url: string): Promise<AuditResult> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MPSEOBot/1.0)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`SITE_UNREACHABLE:${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const domain = new URL(url).hostname

    // Extract all signals
    const meta = extractMetaAnalysis($)
    const headings = extractHeadings($)
    const content = extractContent($, html)
    const technical = extractTechnical($, url, response, html)
    const social = extractSocial($)
    const links = extractLinks($, url)

    // Calculate scores
    const seoScore = calculateSeoScore(meta, headings, content, technical, links)
    const performanceScore = calculatePerformanceScore(response, html)
    const accessibilityScore = calculateA11yScore($, technical)

    const responseTime = Date.now() - startTime

    return {
      id: '',
      url,
      domain,
      scores: {
        seo: Math.min(100, seoScore),
        performance: Math.min(100, performanceScore),
        accessibility: Math.min(100, accessibilityScore),
      },
      meta,
      headings,
      content,
      technical,
      social,
      links,
      aiSummary: '',
      topFixes: [],
      quickWins: [],
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[scanEngine] Error scanning URL:', error)
    if (error instanceof Error && error.message.startsWith('SITE_UNREACHABLE')) {
      throw error
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('SITE_UNREACHABLE:timeout')
    }
    throw new Error(`Failed to scan URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function extractMetaAnalysis($: cheerio.CheerioAPI): MetaAnalysis {
  const title = $('title').text() || null
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

  return {
    title,
    titleLength: title?.length || 0,
    titleScore: title && title.length >= 50 && title.length <= 60 ? 'excellent' : title && title.length > 30 ? 'good' : 'poor',
    description,
    descriptionLength: description?.length || 0,
    descriptionScore: description && description.length >= 150 && description.length <= 160 ? 'excellent' : description && description.length > 120 ? 'good' : 'poor',
    canonical,
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      type: ogType,
      complete: !!(ogTitle && ogDescription && ogImage && ogType),
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      image: twitterImage,
      complete: !!(twitterCard && twitterTitle && twitterDescription && twitterImage),
    },
  }
}

function extractHeadings($: cheerio.CheerioAPI): HeadingAnalysis {
  const h1 = $('h1').map((_, el) => $(el).text()).get()
  const h2 = $('h2').map((_, el) => $(el).text()).get()
  const h3 = $('h3').map((_, el) => $(el).text()).get()
  const h4 = $('h4').map((_, el) => $(el).text()).get()
  const h5 = $('h5').map((_, el) => $(el).text()).get()
  const h6 = $('h6').map((_, el) => $(el).text()).get()

  const issues: string[] = []
  if (h1.length === 0) issues.push('Missing H1 tag')
  if (h1.length > 1) issues.push(`Multiple H1 tags (${h1.length})`)
  if (h1.length > 0 && h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
    issues.push('Heading hierarchy broken: H1 should be followed by H2')
  }

  return {
    h1: { count: h1.length, items: h1, issues: h1.length !== 1 ? ['Invalid H1'] : [], status: h1.length === 1 ? 'pass' : 'fail' },
    h2: { count: h2.length, items: h2 },
    h3: { count: h3.length, items: h3 },
    h4: { count: h4.length, items: h4 },
    h5: { count: h5.length, items: h5 },
    h6: { count: h6.length, items: h6 },
    hierarchyIssues: issues,
    status: issues.length === 0 ? 'pass' : issues.length === 1 ? 'warning' : 'fail',
  }
}

function extractContent($: cheerio.CheerioAPI, html: string): ContentAnalysis {
  const bodyText = $('body').text()
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length

  // Simple readability score (Flesch Reading Ease)
  const sentences = bodyText.split(/[.!?]+/).length
  const syllables = bodyText.split(/[aeiouy]+/).length
  const readabilityScore = Math.max(0, 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount))

  // Extract top keywords
  const words = bodyText
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3 && !['that', 'this', 'from', 'with', 'have', 'been', 'were', 'will', 'your', 'which'].includes(w))

  const wordFreq = words.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const topKeywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({
      keyword,
      count,
      density: (count / wordCount) * 100,
    }))

  return {
    wordCount,
    wordCountRating: wordCount > 300 ? 'excellent' : wordCount > 100 ? 'good' : 'low',
    readabilityScore: Math.round(readabilityScore),
    topKeywords,
    keywordStuffingWarning: topKeywords.some(k => k.density > 5),
  }
}

function extractTechnical($: cheerio.CheerioAPI, url: string, response: Response, html: string): TechnicalChecklist {
  const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; description: string }> = []

  // HTTPS
  const hasHttps = url.startsWith('https')
  checks.push({
    name: 'HTTPS/SSL',
    status: hasHttps ? 'pass' : 'fail',
    description: hasHttps ? 'Website uses HTTPS' : 'Website not secured with HTTPS',
  })

  // Viewport
  const hasViewport = !!$('meta[name="viewport"]').attr('content')
  checks.push({
    name: 'Mobile Friendly Viewport',
    status: hasViewport ? 'pass' : 'fail',
    description: hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta tag',
  })

  // Sitemap
  const hasSitemap = html.includes('sitemap')
  checks.push({
    name: 'XML Sitemap',
    status: hasSitemap ? 'pass' : 'warning',
    description: hasSitemap ? 'Sitemap reference found' : 'No sitemap reference detected',
  })

  // Robots.txt
  const hasRobots = html.includes('robots')
  checks.push({
    name: 'Robots.txt',
    status: hasRobots ? 'pass' : 'warning',
    description: hasRobots ? 'Robots.txt reference found' : 'No robots.txt reference detected',
  })

  // Structured Data
  const hasSchemaData = html.includes('application/ld+json') || html.includes('schema.org')
  checks.push({
    name: 'Structured Data',
    status: hasSchemaData ? 'pass' : 'warning',
    description: hasSchemaData ? 'JSON-LD schema found' : 'No structured data detected',
  })

  // Gzip
  const hasGzip = response.headers.get('content-encoding')?.includes('gzip') ?? false
  checks.push({
    name: 'Gzip Compression',
    status: hasGzip ? 'pass' : 'warning',
    description: hasGzip ? 'Gzip enabled' : 'Gzip compression not detected',
  })

  // Caching
  const cacheControl = response.headers.get('cache-control')
  checks.push({
    name: 'Browser Caching',
    status: cacheControl ? 'pass' : 'warning',
    description: cacheControl ? 'Cache headers present' : 'No cache headers found',
  })

  // Minified CSS
  const cssCount = (html.match(/<style[^>]*>/gi) || []).length
  const isMinified = cssCount === 0 || !html.includes(';\n') // Simple heuristic
  checks.push({
    name: 'Minified CSS',
    status: isMinified ? 'pass' : 'warning',
    description: 'CSS minification status',
  })

  // Minified JS
  const jsCount = (html.match(/<script[^>]*>/gi) || []).length
  checks.push({
    name: 'Minified JS',
    status: 'warning',
    description: `${jsCount} script tags found`,
  })

  // Image alt tags
  const images = $('img')
  const imagesWithAlt = $('img[alt]').length
  const altTagRatio = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100
  checks.push({
    name: 'Image Alt Tags',
    status: altTagRatio === 100 ? 'pass' : altTagRatio > 80 ? 'warning' : 'fail',
    description: `${Math.round(altTagRatio)}% of images have alt text`,
  })

  // Page speed (simplified)
  const pageSpeedGrade = html.length < 50000 ? 'A' : html.length < 100000 ? 'B' : html.length < 200000 ? 'C' : 'F'

  // Canonical
  const hasCanonical = !!$('link[rel="canonical"]').attr('href')
  checks.push({
    name: 'Canonical Tag',
    status: hasCanonical ? 'pass' : 'warning',
    description: hasCanonical ? 'Canonical URL defined' : 'No canonical URL',
  })

  // Hreflang
  const hasHreflang = !!$('link[rel="alternate"]').attr('hreflang')
  checks.push({
    name: 'Hreflang Tags',
    status: hasHreflang ? 'pass' : 'warning',
    description: hasHreflang ? 'Hreflang tags found' : 'No hreflang tags',
  })

  return {
    checks,
    https: hasHttps ? 'pass' : 'fail',
    viewport: hasViewport ? 'pass' : 'fail',
    sitemap: hasSitemap ? 'pass' : 'warning',
    robotsTxt: hasRobots ? 'pass' : 'warning',
    gzip: hasGzip ? 'pass' : 'warning',
    caching: cacheControl ? 'pass' : 'warning',
    minifiedCss: isMinified ? 'pass' : 'warning',
    minifiedJs: 'warning',
    imageAltTags: altTagRatio === 100 ? 'pass' : altTagRatio > 80 ? 'warning' : 'fail',
    pageSpeedGrade: pageSpeedGrade as 'A' | 'B' | 'C' | 'D' | 'F',
    loadTime: 0,
    canonicalTag: hasCanonical ? 'pass' : 'warning',
    hreflangs: hasHreflang ? 'pass' : 'warning',
    structuredData: hasSchemaData ? 'pass' : 'warning',
  }
}

function extractSocial($: cheerio.CheerioAPI): SocialAnalysis {
  const ogCount = $('meta[property^="og:"]').length
  const twitterCount = $('meta[name^="twitter:"]').length

  const ogTitle = !!$('meta[property="og:title"]').attr('content')
  const ogDesc = !!$('meta[property="og:description"]').attr('content')
  const ogImage = !!$('meta[property="og:image"]').attr('content')
  const ogType = !!$('meta[property="og:type"]').attr('content')

  const twitterCard = !!$('meta[name="twitter:card"]').attr('content')
  const twitterTitle = !!$('meta[name="twitter:title"]').attr('content')
  const twitterDesc = !!$('meta[name="twitter:description"]').attr('content')

  const missingFields: string[] = []
  if (!ogTitle) missingFields.push('og:title')
  if (!ogDesc) missingFields.push('og:description')
  if (!ogImage) missingFields.push('og:image')
  if (!twitterCard) missingFields.push('twitter:card')

  const presentCount = [ogTitle, ogDesc, ogImage, ogType, twitterCard, twitterTitle, twitterDesc].filter(Boolean).length

  return {
    score: (presentCount / 8) * 100,
    openGraphComplete: ogTitle && ogDesc && ogImage && ogType,
    twitterCardComplete: twitterCard && twitterTitle && twitterDesc,
    missingFields,
  }
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): LinkAnalysis {
  const baseDomain = new URL(baseUrl).hostname
  const internalLinks: string[] = []
  const externalLinks: string[] = []
  let nofollowCount = 0

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().trim()
    const rel = $(el).attr('rel') || ''

    if (rel.includes('nofollow')) nofollowCount++

    if (href.startsWith('http')) {
      try {
        const linkDomain = new URL(href).hostname
        if (linkDomain === baseDomain) {
          internalLinks.push(href)
        } else {
          externalLinks.push(href)
        }
      } catch {}
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      internalLinks.push(href)
    }
  })

  return {
    internal: {
      count: internalLinks.length,
      links: [...new Set(internalLinks)],
    },
    external: {
      count: externalLinks.length,
      links: [...new Set(externalLinks)].slice(0, 20),
    },
    nofollow: nofollowCount,
    broken: 0, // Would require additional checks
    equityScore: internalLinks.length > 3 ? 80 : internalLinks.length > 0 ? 50 : 20,
  }
}

function calculateSeoScore(meta: MetaAnalysis, headings: HeadingAnalysis, content: ContentAnalysis, technical: TechnicalChecklist, links: LinkAnalysis): number {
  let score = 0

  // Title
  if (meta.title && meta.titleLength >= 50 && meta.titleLength <= 60) score += 15
  else if (meta.title) score += 8

  // Description
  if (meta.description && meta.descriptionLength >= 150 && meta.descriptionLength <= 160) score += 15
  else if (meta.description) score += 8

  // Headings
  if (headings.h1.count === 1) score += 15
  if (headings.h1.count === 1 && headings.hierarchyIssues.length === 0) score += 10

  // Canonical
  if (meta.canonical) score += 10

  // Open Graph
  if (meta.openGraph.complete) score += 10

  // Content
  if (content.wordCount > 300) score += 5
  if (!content.keywordStuffingWarning) score += 5

  // Links
  if (links.internal.count > 3) score += 5

  // Technical
  if (technical.https === 'pass') score += 10
  if (technical.structuredData === 'pass') score += 10

  return Math.min(100, score)
}

function calculatePerformanceScore(response: Response, html: string): number {
  let score = 0

  // HTML size
  const htmlSize = html.length
  if (htmlSize < 50000) score += 20
  else if (htmlSize < 100000) score += 10

  // HTTPS
  if (response.url.startsWith('https')) score += 20

  // Gzip
  if (response.headers.get('content-encoding')?.includes('gzip')) score += 20

  // Caching
  if (response.headers.get('cache-control')) score += 15

  // Compression
  const cssCount = (html.match(/<link[^>]*\.css/gi) || []).length
  const jsCount = (html.match(/<script[^>]*\.js/gi) || []).length

  if (cssCount < 3) score += 10
  if (jsCount < 5) score += 10

  return Math.min(100, score)
}

function calculateA11yScore($: cheerio.CheerioAPI, technical: TechnicalChecklist): number {
  let score = 0

  // Alt tags
  const images = $('img')
  const imagesWithAlt = $('img[alt]').length
  if (images.length > 0 && imagesWithAlt / images.length === 1) score += 30

  // Viewport
  if (!!$('meta[name="viewport"]').attr('content')) score += 20

  // Lang attribute
  if (!!$('html').attr('lang')) score += 20

  // Heading hierarchy
  const h1 = $('h1').length
  const h2 = $('h2').length
  if (h1 === 1 && h2 >= 0) score += 15

  // No inline styles
  const inlineStyles = $('[style]').length
  if (inlineStyles === 0) score += 15

  return Math.min(100, score)
}
