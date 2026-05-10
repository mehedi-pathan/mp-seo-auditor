import type { AuditResult, Fix } from './scan.ts'

type ClaudeTextBlock = { type: 'text'; text: string }
type ClaudeResponse = { content?: ClaudeTextBlock[] }

const fixWeight = { high: 3, medium: 2, low: 1 } satisfies Record<Fix['impact'], number>

export function buildRuleBasedAnalysis(audit: AuditResult): { summary: string; topFixes: Fix[]; quickWins: string[] } {
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
      description: `The scan found ${audit.headings.h1.count} H1 headings. Use one descriptive H1 and organize sections with H2 and H3 headings.`,
      impact: 'high',
    })
    quickWins.push('Fix the H1 structure so the page has exactly one main heading.')
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

  if (audit.technical.structuredData !== 'pass') {
    fixes.push({
      title: 'Add structured data',
      description: 'No JSON-LD structured data was detected. Add relevant Schema.org markup such as Organization, WebSite, Article, Product, or LocalBusiness where appropriate.',
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

    if (audit.pageSpeed.opportunities[0]) {
      quickWins.push(`PageSpeed priority: ${audit.pageSpeed.opportunities[0].title}.`)
    }
  }

  if (quickWins.length < 3) quickWins.push('Add descriptive alt text to every meaningful image.')
  if (quickWins.length < 3) quickWins.push('Add Schema.org JSON-LD for the page type and organization.')

  const sortedFixes = fixes.sort((a, b) => fixWeight[b.impact] - fixWeight[a.impact]).slice(0, 6)
  const pageSpeedSummary = audit.pageSpeed && !audit.pageSpeed.error
    ? ` PageSpeed mobile scores are ${audit.pageSpeed.scores.performance}/100 performance, ${audit.pageSpeed.scores.seo}/100 SEO, ${audit.pageSpeed.scores.accessibility}/100 accessibility, and ${audit.pageSpeed.scores.bestPractices}/100 best practices.`
    : ''
  const strengthSummary = strongSignals.length > 0
    ? `Strong signals include ${strongSignals.slice(0, 2).join(' and ')}.`
    : 'The page needs stronger fundamentals before it will feel search-ready.'
  const prioritySummary = sortedFixes[0]
    ? `Start with "${sortedFixes[0].title}" because it has the clearest impact on visibility and user understanding.`
    : 'The audit did not find major blockers, so focus on content depth, internal links, and ongoing monitoring.'

  return {
    summary: `The site scored ${audit.scores.seo}/100 for SEO, ${audit.scores.performance}/100 for performance, and ${audit.scores.accessibility}/100 for accessibility.${pageSpeedSummary} ${strengthSummary} ${prioritySummary}`,
    topFixes: sortedFixes.length > 0 ? sortedFixes : [{
      title: 'Keep improving content depth',
      description: 'Continue expanding useful sections, adding internal links, and refreshing metadata as the page evolves.',
      impact: 'low',
    }],
    quickWins: [...new Set(quickWins)].slice(0, 5),
  }
}

export async function analyzeWithClaude(audit: AuditResult): Promise<{ summary: string; topFixes: Fix[]; quickWins: string[] }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return buildRuleBasedAnalysis(audit)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are an expert SEO analyst. Return only valid JSON with summary, topFixes, and quickWins.',
      messages: [{ role: 'user', content: JSON.stringify(audit) }],
    }),
  })

  if (!response.ok) return buildRuleBasedAnalysis(audit)

  const json = (await response.json()) as ClaudeResponse
  const text = json.content?.find(block => block.type === 'text')?.text || ''

  try {
    const parsed = JSON.parse(text) as { summary?: string; topFixes?: Fix[]; quickWins?: string[] }
    if (!parsed.summary || !parsed.topFixes || !parsed.quickWins) return buildRuleBasedAnalysis(audit)
    return { summary: parsed.summary, topFixes: parsed.topFixes, quickWins: parsed.quickWins }
  } catch {
    return buildRuleBasedAnalysis(audit)
  }
}

