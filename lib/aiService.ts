import { Anthropic } from '@anthropic-ai/sdk'
import type { AuditResult, Fix, BacklinkAnalysis } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeAuditResults(auditData: AuditResult): Promise<{ summary: string; topFixes: Fix[]; quickWins: string[] }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return buildRuleBasedAnalysis(auditData)
  }

  const systemPrompt = `You are an expert SEO analyst with 15 years of experience. Analyze the provided website audit data and return ONLY a valid JSON object with no markdown, no preamble, no explanation. Return exactly this shape:
{
  "summary": "3 clear sentences about the site",
  "topFixes": [
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" },
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" },
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" }
  ],
  "quickWins": ["string", "string", "string"],
  "overallVerdict": "1 sentence summary"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(auditData),
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    const parsed = JSON.parse(responseText)

    return {
      summary: parsed.summary,
      topFixes: parsed.topFixes,
      quickWins: parsed.quickWins,
    }
  } catch (error) {
    console.error('[aiService] Error analyzing audit:', error)
    return buildRuleBasedAnalysis(auditData)
  }
}

function buildRuleBasedAnalysis(audit: AuditResult): { summary: string; topFixes: Fix[]; quickWins: string[] } {
  const fixes: Fix[] = []
  const quickWins: string[] = []
  const strongSignals: string[] = []

  if (audit.meta.titleScore === 'poor') {
    fixes.push({
      title: audit.meta.title ? 'Rewrite the title tag' : 'Add a title tag',
      description: `The title is ${audit.meta.titleLength} characters. Aim for a clear 50-60 character title with the primary keyword and brand.`,
      impact: 'high',
    })
    quickWins.push('Rewrite the page title to 50-60 characters with the main keyword near the front.')
  } else {
    strongSignals.push('the title tag is usable')
  }

  if (audit.meta.descriptionScore === 'poor') {
    fixes.push({
      title: audit.meta.description ? 'Improve the meta description' : 'Add a meta description',
      description: `The description is ${audit.meta.descriptionLength} characters. Write a 150-160 character summary that explains the page value and includes a call to action.`,
      impact: 'high',
    })
    quickWins.push('Add a search-friendly meta description around 150-160 characters.')
  } else {
    strongSignals.push('the meta description is present')
  }

  if (audit.headings.h1.count !== 1) {
    fixes.push({
      title: audit.headings.h1.count === 0 ? 'Add one H1 heading' : 'Use only one H1 heading',
      description: `The scan found ${audit.headings.h1.count} H1 headings. Use one descriptive H1 that matches the page intent, then organize sections with H2 and H3 headings.`,
      impact: 'high',
    })
    quickWins.push('Fix the H1 structure so the page has exactly one main heading.')
  }

  if (audit.headings.hierarchyIssues.length > 0) {
    fixes.push({
      title: 'Clean up heading hierarchy',
      description: `${audit.headings.hierarchyIssues.join(' ')} A logical heading outline helps users, crawlers, and accessibility tools understand the page.`,
      impact: 'medium',
    })
  }

  if (audit.content.wordCount < 300) {
    fixes.push({
      title: 'Expand thin content',
      description: `The page has about ${audit.content.wordCount} words. Add helpful sections, FAQs, examples, and internal links so the page better satisfies search intent.`,
      impact: 'high',
    })
    quickWins.push('Add one useful section that answers the visitor’s next question.')
  } else {
    strongSignals.push(`${audit.content.wordCount} words of indexable body content were found`)
  }

  if (audit.content.keywordStuffingWarning) {
    fixes.push({
      title: 'Reduce keyword stuffing risk',
      description: 'At least one keyword appears above 5% density. Use natural phrasing, related terms, and clearer section coverage instead of repeating the same word.',
      impact: 'medium',
    })
  }

  if (!audit.meta.canonical) {
    fixes.push({
      title: 'Add a canonical URL',
      description: 'A canonical tag helps search engines consolidate duplicate or similar URL versions and protects ranking signals.',
      impact: 'medium',
    })
    quickWins.push('Add a canonical link tag that points to the preferred URL.')
  }

  if (!audit.meta.openGraph.complete || !audit.meta.twitter.complete) {
    fixes.push({
      title: 'Complete social preview tags',
      description: 'Open Graph and Twitter Card tags are incomplete. Add title, description, image, and card/type values so shared links look trustworthy.',
      impact: 'medium',
    })
    quickWins.push('Add missing OG/Twitter image and description tags for better sharing previews.')
  }

  if (audit.technical.imageAltTags !== 'pass') {
    fixes.push({
      title: 'Improve image alt text',
      description: 'Some images are missing alt text. Descriptive alt text improves accessibility and gives search engines more context about page media.',
      impact: 'medium',
    })
  }

  if (audit.technical.structuredData !== 'pass') {
    fixes.push({
      title: 'Add structured data',
      description: 'No JSON-LD structured data was detected. Add relevant Schema.org markup such as Organization, WebSite, Article, Product, or LocalBusiness where appropriate.',
      impact: 'medium',
    })
  }

  if (audit.links.internal.count <= 3) {
    fixes.push({
      title: 'Add more internal links',
      description: `Only ${audit.links.internal.count} internal links were found. Link to related service, article, and conversion pages using descriptive anchor text.`,
      impact: 'medium',
    })
    quickWins.push('Add 3-5 internal links to relevant pages with descriptive anchor text.')
  }

  if (audit.technical.gzip !== 'pass' || audit.technical.caching !== 'pass') {
    fixes.push({
      title: 'Improve delivery performance',
      description: 'Compression or browser caching was not detected. Enable gzip/Brotli and cache static assets to improve repeat visits and Core Web Vitals.',
      impact: 'medium',
    })
  }

  if (audit.pageSpeed && !audit.pageSpeed.error) {
    if (audit.pageSpeed.scores.performance < 70) {
      const topOpportunity = audit.pageSpeed.opportunities[0]
      fixes.push({
        title: topOpportunity ? `PageSpeed: ${topOpportunity.title}` : 'Improve Lighthouse performance',
        description: topOpportunity
          ? `${topOpportunity.description}${topOpportunity.displayValue ? ` Current finding: ${topOpportunity.displayValue}.` : ''}`
          : 'The mobile PageSpeed performance score is below 70. Review render-blocking resources, JavaScript execution, image delivery, and caching.',
        impact: 'high',
      })
    }

    if (audit.pageSpeed.scores.seo < 90) {
      const seoDiagnostic = audit.pageSpeed.diagnostics.find(item =>
        ['canonical', 'document-title', 'meta-description', 'crawlable-anchors', 'robots-txt', 'structured-data', 'is-crawlable'].includes(item.id)
      )

      if (seoDiagnostic) {
        fixes.push({
          title: `Lighthouse SEO: ${seoDiagnostic.title}`,
          description: seoDiagnostic.description,
          impact: 'high',
        })
      }
    }

    if (audit.pageSpeed.opportunities[0]) {
      quickWins.push(`PageSpeed priority: ${audit.pageSpeed.opportunities[0].title}.`)
    }
  }

  if (audit.technical.viewport !== 'pass') {
    fixes.push({
      title: 'Add a mobile viewport tag',
      description: 'The page is missing a viewport meta tag, which can make it render poorly on mobile devices.',
      impact: 'high',
    })
  }

  if (quickWins.length < 3 && audit.meta.titleScore !== 'poor') {
    quickWins.push('Make the title more benefit-driven while keeping it within the recommended length.')
  }
  if (quickWins.length < 3) {
    quickWins.push('Add descriptive alt text to every meaningful image.')
  }
  if (quickWins.length < 3) {
    quickWins.push('Add Schema.org JSON-LD for the page type and organization.')
  }

  const sortedFixes = fixes
    .sort((a, b) => {
      const weight = { high: 3, medium: 2, low: 1 }
      return weight[b.impact] - weight[a.impact]
    })
    .slice(0, 6)

  const pageSpeedSummary = audit.pageSpeed && !audit.pageSpeed.error
    ? ` PageSpeed mobile scores are ${audit.pageSpeed.scores.performance}/100 performance, ${audit.pageSpeed.scores.seo}/100 SEO, ${audit.pageSpeed.scores.accessibility}/100 accessibility, and ${audit.pageSpeed.scores.bestPractices}/100 best practices.`
    : ''
  const scoreSummary = `The site scored ${audit.scores.seo}/100 for SEO, ${audit.scores.performance}/100 for performance, and ${audit.scores.accessibility}/100 for accessibility.${pageSpeedSummary}`
  const strengthSummary = strongSignals.length > 0
    ? `Strong signals include ${strongSignals.slice(0, 2).join(' and ')}.`
    : 'The page needs stronger fundamentals before it will feel search-ready.'
  const prioritySummary = sortedFixes[0]
    ? `Start with "${sortedFixes[0].title}" because it has the clearest impact on visibility and user understanding.`
    : 'The audit did not find major blockers, so focus on content depth, internal links, and ongoing monitoring.'

  return {
    summary: `${scoreSummary} ${strengthSummary} ${prioritySummary}`,
    topFixes: sortedFixes.length > 0 ? sortedFixes : [
      {
        title: 'Keep improving content depth',
        description: 'Continue expanding useful sections, adding internal links, and refreshing metadata as the page evolves.',
        impact: 'low',
      },
    ],
    quickWins: [...new Set(quickWins)].slice(0, 5),
  }
}

export async function analyzeBacklinks(domain: string): Promise<BacklinkAnalysis> {
  const systemPrompt = `You are an expert link building analyst. Analyze the domain's backlink profile and return ONLY valid JSON with no markdown:
{
  "totalBacklinks": 0,
  "referringDomains": 0,
  "domainAuthority": 0,
  "dofollowRatio": 0,
  "toxicPercent": 0,
  "topBacklinks": [
    { "domain": "string", "anchor": "string", "da": 0, "quality": "Excellent" | "Good" | "Average" | "Poor" }
  ],
  "anchorDistribution": [
    { "anchor": "string", "frequency": 0 }
  ],
  "growthTrend": "growing" | "stable" | "declining",
  "insights": "4 sentences of expert analysis"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze backlink profile for: ${domain}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(responseText)

    return {
      totalBacklinks: parsed.totalBacklinks || 0,
      referringDomains: parsed.referringDomains || 0,
      domainAuthority: parsed.domainAuthority || 35,
      dofollowRatio: parsed.dofollowRatio || 65,
      toxicPercent: parsed.toxicPercent || 5,
      topBacklinks: parsed.topBacklinks || [],
      anchorDistribution: parsed.anchorDistribution || [],
      growthTrend: parsed.growthTrend || 'stable',
      insights: parsed.insights || 'Unable to provide detailed insights at this time.',
    }
  } catch (error) {
    console.error('[aiService] Error analyzing backlinks:', error)
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      domainAuthority: 0,
      dofollowRatio: 65,
      toxicPercent: 5,
      topBacklinks: [],
      anchorDistribution: [],
      growthTrend: 'stable',
      insights: 'Unable to analyze backlink profile.',
    }
  }
}
