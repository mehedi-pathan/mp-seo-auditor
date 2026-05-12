import type { AuditResult, Status } from '@/types'

type CsvCell = string | number | boolean | null | undefined
type CsvRow = CsvCell[]

const columns = [
  'Report Tab',
  'Category',
  'Metric or Test',
  'Result',
  'Status or Score',
  'Why This Matters',
  'Recommended Action',
  'URL or Reference',
] as const

const csvCell = (value: CsvCell) => {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`
}

const emptyRow = (rows: CsvRow[]) => rows.push(['', '', '', '', '', '', '', ''])

const section = (rows: CsvRow[], title: string, description: string) => {
  emptyRow(rows)
  rows.push([`=== ${title.toUpperCase()} ===`, description, '', '', '', '', '', ''])
  rows.push([...columns])
}

const addRow = (
  rows: CsvRow[],
  tab: string,
  category: string,
  metric: string,
  result: CsvCell,
  status: CsvCell,
  why: CsvCell,
  action: CsvCell,
  reference: CsvCell,
) => {
  rows.push([tab, category, metric, result ?? '', status ?? '', why ?? '', action ?? '', reference ?? ''])
}

const statusLabel = (status: Status | boolean | string | null | undefined) => {
  if (status === true) return 'Pass'
  if (status === false) return 'Warning'
  if (status === 'pass') return 'Pass'
  if (status === 'warning') return 'Warning'
  if (status === 'fail') return 'Failed'
  return status ?? ''
}

const statusAction = (status: Status | boolean | string | null | undefined) => {
  if (status === 'pass' || status === true) return 'Keep monitoring this signal during future audits.'
  if (status === 'warning' || status === false) return 'Review this item and improve it where possible.'
  if (status === 'fail') return 'Fix this item first because it can directly affect SEO, crawlability, speed, or UX.'
  return 'Use this data as supporting context for your next SEO improvement.'
}

const scoreAction = (score: number) => {
  if (score >= 85) return 'Strong result. Keep monitoring and protect this score during future changes.'
  if (score >= 70) return 'Good foundation. Improve the listed issues to push this score higher.'
  return 'Prioritize the failed and warning items before adding new SEO work.'
}

const scoreStatus = (score: number) => {
  if (score >= 85) return `${score}/100 strong`
  if (score >= 70) return `${score}/100 needs polish`
  return `${score}/100 priority fix`
}

export const generateAuditCsv = (audit: AuditResult) => {
  const rows: CsvRow[] = [
    ['MP SEO Auditor Spreadsheet Export', '', '', '', '', '', '', ''],
    ['Domain', audit.domain, '', '', '', '', '', audit.url],
    ['Scanned URL', audit.url, '', '', '', '', '', audit.url],
    ['Generated At', audit.createdAt, '', '', '', '', '', ''],
    ['How to read this file', 'Each section matches the main audit result categories. Use the Recommendation column as the developer handoff checklist.', '', '', '', '', '', ''],
  ]

  section(rows, '1. Overview', 'Overall SEO health, AI summary, priority fixes, and fast wins.')
  addRow(rows, 'Overview', 'Scores', 'SEO Score', audit.scores.seo, scoreStatus(audit.scores.seo), 'Measures overall search readiness across metadata, content, links, and technical signals.', scoreAction(audit.scores.seo), audit.url)
  addRow(rows, 'Overview', 'Scores', 'Performance Score', audit.scores.performance, scoreStatus(audit.scores.performance), 'Speed affects ranking, user experience, bounce rate, and conversion.', scoreAction(audit.scores.performance), audit.url)
  addRow(rows, 'Overview', 'Scores', 'Accessibility Score', audit.scores.accessibility, scoreStatus(audit.scores.accessibility), 'Accessible pages are easier for users, crawlers, and assistive technology to understand.', scoreAction(audit.scores.accessibility), audit.url)
  addRow(rows, 'Overview', 'AI Summary', 'Executive Summary', audit.aiSummary, 'Context', 'A plain language summary helps owners and developers agree on what matters first.', 'Start with the recommendation named in the summary, then review failed items by category.', audit.url)
  audit.topFixes.forEach((fix, index) => {
    addRow(rows, 'Overview', 'Priority Fixes', `${index + 1}. ${fix.title}`, fix.description, fix.impact.toUpperCase(), 'These are the highest impact issues found in the audit.', 'Assign this fix to the site owner, SEO specialist, or developer based on the issue type.', audit.url)
  })
  audit.quickWins.forEach((win, index) => {
    addRow(rows, 'Overview', 'Quick Wins', `${index + 1}. ${win}`, 'Recommended', 'Action', 'Quick wins are small changes that can improve clarity, crawlability, or trust.', 'Apply these before deeper technical work where possible.', audit.url)
  })

  section(rows, '2. Headings', 'H1 to H6 structure and heading hierarchy checks.')
  addRow(rows, 'Headings', 'H1', 'H1 Count', audit.headings.h1.count, statusLabel(audit.headings.h1.status), 'The H1 tells users and crawlers the primary topic of the page.', audit.headings.h1.count === 1 ? 'Keep one clear H1 that matches the page intent.' : 'Use one descriptive H1 and avoid missing or duplicated main headings.', audit.url)
  audit.headings.h1.items.forEach((heading, index) => {
    addRow(rows, 'Headings', 'H1', `H1 Text ${index + 1}`, heading, statusLabel(audit.headings.h1.status), 'This is the main page title crawlers see in the content.', 'Make sure the H1 is clear, specific, and aligned with the title tag.', audit.url)
  })
  audit.headings.h1.issues.forEach((issue, index) => {
    addRow(rows, 'Headings', 'H1 Issues', `Issue ${index + 1}`, issue, 'Warning', 'Weak heading structure makes content harder to scan and understand.', 'Fix the issue and keep heading order simple.', audit.url)
  })
  ;(['h2', 'h3', 'h4', 'h5', 'h6'] as const).forEach(level => {
    addRow(rows, 'Headings', level.toUpperCase(), `${level.toUpperCase()} Count`, audit.headings[level].count, 'Structure', `${level.toUpperCase()} tags organize supporting content under the main topic.`, 'Use headings to group helpful sections instead of styling text only.', audit.url)
    audit.headings[level].items.forEach((heading, index) => {
      addRow(rows, 'Headings', level.toUpperCase(), `${level.toUpperCase()} Text ${index + 1}`, heading, 'Content', 'Search engines use headings to understand page sections.', 'Keep headings useful, natural, and relevant to the page intent.', audit.url)
    })
  })
  audit.headings.hierarchyIssues.forEach((issue, index) => {
    addRow(rows, 'Headings', 'Hierarchy', `Hierarchy Issue ${index + 1}`, issue, 'Warning', 'Skipped heading levels can make the document outline confusing.', 'Reorder headings so sections flow from H1 to H2 to H3 naturally.', audit.url)
  })

  section(rows, '3. Meta', 'Search snippet, canonical, robots, Open Graph, and Twitter preview data.')
  addRow(rows, 'Meta', 'Search Snippet', 'Meta Title', audit.meta.title || 'Missing', audit.meta.titleScore, 'The title is one of the strongest on page signals and drives click through rate.', `Current length: ${audit.meta.titleLength}. Aim for a clear title around 50 to 60 characters.`, audit.url)
  addRow(rows, 'Meta', 'Search Snippet', 'Meta Description', audit.meta.description || 'Missing', audit.meta.descriptionScore, 'Descriptions improve organic clicks and help platforms summarize the page.', `Current length: ${audit.meta.descriptionLength}. Write a helpful 150 to 160 character summary.`, audit.url)
  addRow(rows, 'Meta', 'Canonical', 'Canonical URL', audit.meta.canonical || 'Missing', audit.meta.canonical ? 'Pass' : 'Warning', 'Canonical tags consolidate duplicate URL signals into one preferred page.', audit.meta.canonical ? 'Confirm it points to the preferred URL.' : 'Add a canonical link tag for the preferred URL.', audit.meta.canonical || audit.url)
  addRow(rows, 'Meta', 'Robots', 'Robots Meta', audit.meta.robots || 'Not declared', 'Context', 'Robots directives control indexing and following behavior.', 'Confirm important pages are indexable and not blocked by mistake.', audit.url)
  addRow(rows, 'Meta', 'Open Graph', 'Open Graph Complete', audit.meta.openGraph.complete, statusLabel(audit.meta.openGraph.complete), 'Open Graph controls link previews on Facebook, LinkedIn, WhatsApp, and many messengers.', audit.meta.openGraph.complete ? 'Keep title, description, image, and type updated.' : 'Add missing Open Graph title, description, image, and type values.', audit.url)
  addRow(rows, 'Meta', 'Open Graph', 'OG Title', audit.meta.openGraph.title || 'Missing', audit.meta.openGraph.title ? 'Pass' : 'Warning', 'This title appears when the URL is shared socially.', 'Use a human readable share title.', audit.url)
  addRow(rows, 'Meta', 'Open Graph', 'OG Description', audit.meta.openGraph.description || 'Missing', audit.meta.openGraph.description ? 'Pass' : 'Warning', 'This description appears in social previews.', 'Use a short benefit focused description.', audit.url)
  addRow(rows, 'Meta', 'Open Graph', 'OG Image', audit.meta.openGraph.image || 'Missing', audit.meta.openGraph.image ? 'Pass' : 'Warning', 'A strong image improves share visibility and trust.', 'Use a crawlable image with correct size and absolute URL.', audit.meta.openGraph.image || audit.url)
  addRow(rows, 'Meta', 'Twitter Card', 'Twitter Card Complete', audit.meta.twitter.complete, statusLabel(audit.meta.twitter.complete), 'Twitter cards control previews on X and other unfurlers.', audit.meta.twitter.complete ? 'Keep card values aligned with the page.' : 'Add missing Twitter card metadata.', audit.url)
  addRow(rows, 'Meta', 'Twitter Card', 'Twitter Card Type', audit.meta.twitter.card || 'Missing', audit.meta.twitter.card ? 'Pass' : 'Warning', 'Card type decides how the shared content is displayed.', 'Use summary_large_image for visual pages when appropriate.', audit.url)
  addRow(rows, 'Meta', 'Twitter Card', 'Twitter Image', audit.meta.twitter.image || 'Missing', audit.meta.twitter.image ? 'Pass' : 'Warning', 'Twitter images make shared links more noticeable.', 'Use a high quality image with an absolute URL.', audit.meta.twitter.image || audit.url)

  section(rows, '4. Content', 'Word count, readability, keywords, and content quality signals.')
  addRow(rows, 'Content', 'Body Copy', 'Word Count', audit.content.wordCount, audit.content.wordCountRating, 'Thin or unclear content usually struggles to satisfy search intent.', 'Add helpful sections, examples, FAQs, proof, internal links, and original detail.', audit.url)
  addRow(rows, 'Content', 'Readability', 'Readability Score', audit.content.readabilityScore, `${audit.content.readabilityScore}/100`, 'Readable pages keep users engaged and make key points easier to understand.', 'Shorten long paragraphs, clarify headings, and remove vague wording.', audit.url)
  addRow(rows, 'Content', 'Keyword Risk', 'Keyword Stuffing Warning', audit.content.keywordStuffingWarning, audit.content.keywordStuffingWarning ? 'Warning' : 'Pass', 'Unnatural repetition can reduce trust and content quality.', audit.content.keywordStuffingWarning ? 'Rewrite repeated phrases naturally and focus on search intent.' : 'Keep keyword usage natural.', audit.url)
  audit.content.topKeywords.forEach(keyword => {
    addRow(rows, 'Content', 'Top Keywords', keyword.keyword, `${keyword.count} uses`, `${keyword.density}% density`, 'Frequent terms show what topic the page appears to emphasize.', 'Make sure important keywords also align with the title, headings, and description.', audit.url)
  })

  section(rows, '5. Technical', 'Crawlability, indexing, security, images, performance, and PageSpeed developer data.')
  audit.technical.checks.forEach(check => {
    addRow(rows, 'Technical', 'Checklist', check.name, check.description, statusLabel(check.status), 'Technical issues can block crawling, slow pages, or lower trust.', statusAction(check.status), audit.url)
  })
  const technicalSignals: Array<[string, Status, string]> = [
    ['HTTPS', audit.technical.https, 'Secure HTTPS builds trust and is a lightweight ranking signal.'],
    ['Viewport', audit.technical.viewport, 'Viewport settings make the page usable on mobile devices.'],
    ['Sitemap', audit.technical.sitemap, 'Sitemaps help search engines discover and refresh pages.'],
    ['Robots.txt', audit.technical.robotsTxt, 'Robots.txt tells crawlers what they may access.'],
    ['Structured Data', audit.technical.structuredData, 'Structured data helps search engines understand entities and unlock rich results.'],
    ['GZIP Compression', audit.technical.gzip, 'Compression reduces transfer size and improves load speed.'],
    ['Caching', audit.technical.caching, 'Caching makes repeat visits faster.'],
    ['Minified CSS', audit.technical.minifiedCss, 'Minified CSS downloads faster and can improve render timing.'],
    ['Minified JS', audit.technical.minifiedJs, 'Minified JavaScript reduces parsing and download cost.'],
    ['Image Alt Tags', audit.technical.imageAltTags, 'Alt text improves accessibility and image understanding.'],
    ['Canonical Tag', audit.technical.canonicalTag, 'Canonical tags prevent duplicate URL signal splitting.'],
    ['Hreflangs', audit.technical.hreflangs, 'Hreflang supports international and language specific pages.'],
  ]
  technicalSignals.forEach(([name, status, why]) => {
    addRow(rows, 'Technical', 'Core Signals', name, statusLabel(status), statusLabel(status), why, statusAction(status), audit.url)
  })
  addRow(rows, 'Technical', 'Performance', 'PageSpeed Grade', audit.technical.pageSpeedGrade, audit.technical.pageSpeedGrade, 'A quick developer friendly view of technical speed quality.', 'Use PageSpeed opportunities below for the most specific fixes.', audit.url)
  addRow(rows, 'Technical', 'Performance', 'Load Time', `${audit.technical.loadTime}s`, 'Timing', 'Slow load time increases bounce rate and hurts conversions.', 'Reduce render blocking resources, optimize images, and improve caching.', audit.url)
  if (audit.pageSpeed) {
    addRow(rows, 'Technical', 'PageSpeed Scores', 'PageSpeed Strategy', audit.pageSpeed.strategy, audit.pageSpeed.source, 'PageSpeed scores are based on a Lighthouse crawl.', `Fetched at ${audit.pageSpeed.fetchedAt}.`, audit.url)
    addRow(rows, 'Technical', 'PageSpeed Scores', 'Performance', audit.pageSpeed.scores.performance, `${audit.pageSpeed.scores.performance}/100`, 'Performance score reflects loading, rendering, and main thread behavior.', scoreAction(audit.pageSpeed.scores.performance), audit.url)
    addRow(rows, 'Technical', 'PageSpeed Scores', 'SEO', audit.pageSpeed.scores.seo, `${audit.pageSpeed.scores.seo}/100`, 'PageSpeed SEO checks cover basic crawl and metadata requirements.', scoreAction(audit.pageSpeed.scores.seo), audit.url)
    addRow(rows, 'Technical', 'PageSpeed Scores', 'Accessibility', audit.pageSpeed.scores.accessibility, `${audit.pageSpeed.scores.accessibility}/100`, 'Accessibility improves usability and page quality.', scoreAction(audit.pageSpeed.scores.accessibility), audit.url)
    addRow(rows, 'Technical', 'PageSpeed Scores', 'Best Practices', audit.pageSpeed.scores.bestPractices, `${audit.pageSpeed.scores.bestPractices}/100`, 'Best practices cover security and modern browser expectations.', scoreAction(audit.pageSpeed.scores.bestPractices), audit.url)
    Object.entries(audit.pageSpeed.metrics).forEach(([metric, value]) => {
      addRow(rows, 'Technical', 'Core Web Vitals', metric, value || 'Not available', 'Metric', 'Core Web Vitals influence UX and search quality signals.', 'Improve the related PageSpeed opportunities for this metric.', audit.url)
    })
    audit.pageSpeed.opportunities.forEach(item => {
      addRow(rows, 'Technical', 'Developer Opportunities', item.title, item.displayValue || 'Review', item.score === null ? 'N/A' : item.score, item.description, 'Prioritize opportunities with the largest savings first.', item.id)
    })
    audit.pageSpeed.diagnostics.forEach(item => {
      addRow(rows, 'Technical', 'Diagnostics', item.title, item.displayValue || 'Review', item.score === null ? 'N/A' : item.score, item.description, 'Use diagnostics to guide deeper developer cleanup.', item.id)
    })
  }

  section(rows, '6. Social', 'Social preview readiness and missing share metadata.')
  addRow(rows, 'Social', 'Score', 'Social Score', audit.social.score, scoreStatus(audit.social.score), 'Social metadata improves previews when people share the URL.', scoreAction(audit.social.score), audit.url)
  addRow(rows, 'Social', 'Open Graph', 'Open Graph Complete', audit.social.openGraphComplete, statusLabel(audit.social.openGraphComplete), 'Open Graph powers rich previews across many platforms.', audit.social.openGraphComplete ? 'Keep Open Graph fields accurate.' : 'Add the missing Open Graph fields listed below.', audit.url)
  addRow(rows, 'Social', 'Twitter Card', 'Twitter Card Complete', audit.social.twitterCardComplete, statusLabel(audit.social.twitterCardComplete), 'Twitter cards improve link appearance on X and compatible platforms.', audit.social.twitterCardComplete ? 'Keep Twitter card fields accurate.' : 'Add missing Twitter card fields.', audit.url)
  audit.social.missingFields.forEach((field, index) => {
    addRow(rows, 'Social', 'Missing Fields', `Missing Field ${index + 1}`, field, 'Warning', 'Missing social fields can cause weak or broken link previews.', 'Add this field with a useful value.', audit.url)
  })

  section(rows, '7. Links', 'Internal links, external links, broken links, nofollow counts, and link equity.')
  addRow(rows, 'Links', 'Summary', 'Internal Link Count', audit.links.internal.count, 'Count', 'Internal links help crawlers and users find important pages.', 'Link to important pages with descriptive anchor text.', audit.url)
  addRow(rows, 'Links', 'Summary', 'External Link Count', audit.links.external.count, 'Count', 'External links should support trust and topical relevance.', 'Keep external links relevant and avoid low quality destinations.', audit.url)
  addRow(rows, 'Links', 'Summary', 'Nofollow Links', audit.links.nofollow, 'Count', 'Nofollow links do not pass normal link equity.', 'Use nofollow for sponsored or untrusted links only.', audit.url)
  addRow(rows, 'Links', 'Summary', 'Broken Links', audit.links.broken, audit.links.broken > 0 ? 'Warning' : 'Pass', 'Broken links hurt trust, UX, and crawl quality.', audit.links.broken > 0 ? 'Fix or remove broken links.' : 'Keep monitoring links during future audits.', audit.url)
  addRow(rows, 'Links', 'Summary', 'Link Equity Score', audit.links.equityScore, scoreStatus(audit.links.equityScore), 'This estimates how healthy the page linking pattern is.', scoreAction(audit.links.equityScore), audit.url)
  audit.links.internal.links.forEach((link, index) => {
    addRow(rows, 'Links', 'Internal Links', `Internal Link ${index + 1}`, link, 'Found', 'Internal URLs discovered on the page.', 'Review whether this link helps users move to a useful next page.', link)
  })
  audit.links.external.links.forEach((link, index) => {
    addRow(rows, 'Links', 'External Links', `External Link ${index + 1}`, link, 'Found', 'External URLs discovered on the page.', 'Confirm this destination is trustworthy and still reachable.', link)
  })

  return rows.map(csvRow => csvRow.map(csvCell).join(',')).join('\n')
}

export const downloadAuditCsv = (audit: AuditResult) => {
  const csv = generateAuditCsv(audit)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeDomain = audit.domain.replace(/[^a-z0-9.-]/gi, '-').replace(/-+/g, '-')

  link.href = objectUrl
  link.download = `${safeDomain || 'audit'}-seo-audit-spreadsheet.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
