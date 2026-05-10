export type ScoreLevel = 'excellent' | 'good' | 'poor'
export type ImpactLevel = 'high' | 'medium' | 'low'
export type Plan = 'free' | 'pro' | 'business' | 'agency'
export type BillingInterval = 'monthly' | 'yearly'
export type Status = 'pass' | 'fail' | 'warning'

export interface MetaAnalysis {
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

export interface HeadingAnalysis {
  h1: {
    count: number
    items: string[]
    issues: string[]
    status: Status
  }
  h2: {
    count: number
    items: string[]
  }
  h3: {
    count: number
    items: string[]
  }
  h4: {
    count: number
    items: string[]
  }
  h5: {
    count: number
    items: string[]
  }
  h6: {
    count: number
    items: string[]
  }
  hierarchyIssues: string[]
  status: Status
}

export interface ContentAnalysis {
  wordCount: number
  wordCountRating: 'excellent' | 'good' | 'low'
  readabilityScore: number
  topKeywords: Array<{
    keyword: string
    count: number
    density: number
  }>
  keywordStuffingWarning: boolean
}

export interface TechnicalCheck {
  name: string
  status: Status
  description: string
}

export interface TechnicalChecklist {
  checks: TechnicalCheck[]
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

export interface SocialAnalysis {
  score: number
  openGraphComplete: boolean
  twitterCardComplete: boolean
  missingFields: string[]
}

export interface LinkAnalysis {
  internal: {
    count: number
    links: string[]
  }
  external: {
    count: number
    links: string[]
  }
  nofollow: number
  broken: number
  equityScore: number
}

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

export interface PageSpeedMetrics {
  firstContentfulPaint: string | null
  largestContentfulPaint: string | null
  totalBlockingTime: string | null
  cumulativeLayoutShift: string | null
  speedIndex: string | null
}

export interface PageSpeedAnalysis {
  strategy: 'mobile' | 'desktop'
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  metrics: PageSpeedMetrics
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
  meta: MetaAnalysis
  headings: HeadingAnalysis
  content: ContentAnalysis
  technical: TechnicalChecklist
  social: SocialAnalysis
  links: LinkAnalysis
  pageSpeed?: PageSpeedAnalysis
  aiSummary: string
  topFixes: Fix[]
  quickWins: string[]
  createdAt: string
}

export interface BacklinkAnalysis {
  totalBacklinks: number
  referringDomains: number
  domainAuthority: number
  dofollowRatio: number
  toxicPercent: number
  topBacklinks: Array<{
    domain: string
    anchor: string
    da: number
    quality: 'Excellent' | 'Good' | 'Average' | 'Poor'
  }>
  anchorDistribution: Array<{
    anchor: string
    frequency: number
  }>
  growthTrend: 'growing' | 'stable' | 'declining'
  insights: string
}

export interface KeywordTrack {
  id: string
  keyword: string
  targetUrl: string
  currentRank: number | null
  previousRank: number | null
  rankChange: number | null
  searchVolume: number | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
  lastChecked: string | null
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string | null
  email: string
  avatarUrl?: string | null
  plan: Plan
  billingInterval?: BillingInterval | null
  planStartedAt?: string | null
  planExpiresAt?: string | null
  scansToday: number
  scansResetAt: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  createdAt: string
  updatedAt: string
}

export interface SEOTip {
  id: string
  title: string
  description: string
  category: 'on-page' | 'technical' | 'content' | 'performance' | 'backlinks' | 'local'
  impact: ImpactLevel
  difficulty: 'Easy' | 'Medium' | 'Hard'
  steps: string[]
  resources: string[]
}
