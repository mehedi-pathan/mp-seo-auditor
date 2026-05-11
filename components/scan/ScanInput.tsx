'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gauge,
  Globe2,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadLocalAuditArchive, type LocalAuditArchiveItem } from '@/lib/localAuditArchive'
import { TechnicalSeoLab } from '@/components/seo/TechnicalSeoLab'

interface ScanInputProps {
  onScan: (url: string) => Promise<void>
  loading?: boolean
  initialUrl?: string
}

const upcomingAuditChecks = [
  { title: 'Meta Title Test', text: 'Checks whether the page title is clear, keyword relevant, and search friendly.', category: 'Metadata' },
  { title: 'Meta Description Test', text: 'Reviews the search snippet summary for click appeal and accurate page context.', category: 'Metadata' },
  { title: 'Google SERP Preview', text: 'Shows how title, URL, and description may appear in Google results.', category: 'Metadata' },
  { title: 'Social Meta Tags Test', text: 'Validates Open Graph and Twitter previews for better shared links.', category: 'Metadata' },
  { title: 'Common Keywords Test', text: 'Finds repeated words and phrases to reveal what the page is really about.', category: 'Content' },
  { title: 'Keywords Usage Test', text: 'Checks if important keywords appear in body content, title, and description.', category: 'Content' },
  { title: 'Keywords Cloud Test', text: 'Creates a quick visual view of dominant content topics.', category: 'Content' },
  { title: 'Related Keywords Test', text: 'Surfaces ranking opportunities and search terms the page may already touch.', category: 'Content' },
  { title: 'Competitor Domains Test', text: 'Identifies competing domains to benchmark content, authority, and links.', category: 'Authority' },
  { title: 'Heading Tags Test', text: 'Audits H1 and H2 structure for users, crawlers, and AI answer engines.', category: 'On page' },
  { title: 'Robots.txt Test', text: 'Checks crawler access rules for search engines and modern AI crawlers.', category: 'Crawl' },
  { title: 'Sitemap Test', text: 'Looks for XML sitemap coverage to help search engines discover pages faster.', category: 'Crawl' },
  { title: 'Image Alt Test', text: 'Finds missing alt text for accessibility, image SEO, and crawler context.', category: 'Images' },
  { title: 'Responsive Image Test', text: 'Flags oversized images that waste bandwidth on smaller screens.', category: 'Images' },
  { title: 'Modern Image Format Test', text: 'Detects old image formats where WebP or AVIF could improve speed.', category: 'Images' },
  { title: 'Image Caching Test', text: 'Checks image cache headers for faster repeat visits.', category: 'Images' },
  { title: 'Google Analytics Test', text: 'Detects analytics setup so SEO improvements can be measured.', category: 'Tracking' },
  { title: 'Favicon Test', text: 'Verifies the favicon loads for brand visibility in tabs and search results.', category: 'Brand' },
  { title: 'Backlinks Test', text: 'Reviews external pages linking to the URL and highlights authority signals.', category: 'Authority' },
  { title: 'JS Error Test', text: 'Finds JavaScript errors that can break content or user actions.', category: 'Technical' },
  { title: 'Console Errors Test', text: 'Surfaces failed requests, browser warnings, and hidden frontend issues.', category: 'Technical' },
  { title: 'Charset Test', text: 'Confirms UTF-8 or another valid character encoding is declared.', category: 'Technical' },
  { title: 'HTML Page Size Test', text: 'Measures raw HTML weight to spot bloated markup and inline data.', category: 'Technical' },
  { title: 'DOM Size Test', text: 'Flags very large DOM trees that slow rendering and interaction.', category: 'Technical' },
  { title: 'HTML Compression Test', text: 'Checks whether HTML is served with Gzip or Brotli compression.', category: 'Speed' },
  { title: 'Site Loading Speed Test', text: 'Measures overall load time and the risk of users bouncing early.', category: 'Speed' },
  { title: 'JS Execution Time Test', text: 'Reports heavy JavaScript work that can hurt Core Web Vitals.', category: 'Speed' },
  { title: 'Render Blocking Test', text: 'Identifies CSS and JavaScript blocking the first visible render.', category: 'Speed' },
  { title: 'TTFB Test', text: 'Measures backend and network delay before the first byte arrives.', category: 'Core Web Vitals' },
  { title: 'FCP Test', text: 'Measures when the first visible content appears for users.', category: 'Core Web Vitals' },
  { title: 'LCP Test', text: 'Checks when the main visible content finishes loading.', category: 'Core Web Vitals' },
  { title: 'CLS Test', text: 'Measures unexpected layout movement during page load.', category: 'Core Web Vitals' },
  { title: 'Canonicalization Test', text: 'Checks if URL versions resolve to one preferred destination.', category: 'Indexing' },
  { title: 'Canonical Tag Test', text: 'Verifies the preferred page URL is declared for duplicate control.', category: 'Indexing' },
  { title: 'Noindex Tag Test', text: 'Warns when pages meant to rank are accidentally excluded.', category: 'Indexing' },
  { title: 'HTTPS and SSL Test', text: 'Checks TLS certificate health and secure HTTPS delivery.', category: 'Security' },
  { title: 'Mixed Content Test', text: 'Finds insecure HTTP resources loaded on HTTPS pages.', category: 'Security' },
  { title: 'HTTP/2 Test', text: 'Verifies modern protocol support for faster resource loading.', category: 'Security' },
  { title: 'HSTS Test', text: 'Checks strict HTTPS browser protection headers.', category: 'Security' },
  { title: 'Plaintext Emails Test', text: 'Finds exposed email addresses that can attract spam.', category: 'Security' },
  { title: 'Meta Viewport Test', text: 'Confirms mobile scaling is configured for responsive design.', category: 'Mobile' },
  { title: 'Responsive CSS Test', text: 'Checks media query usage for mobile first layout quality.', category: 'Mobile' },
  { title: 'Mobile Snapshot Test', text: 'Captures a mobile view to spot visual breakage and overflow.', category: 'Mobile' },
  { title: 'Structured Data Test', text: 'Detects schema markup for rich results and AI answer extraction.', category: 'Advanced SEO' },
  { title: 'Custom 404 Test', text: 'Checks whether missing pages keep users on a helpful branded path.', category: 'Advanced SEO' },
  { title: 'SPF Records Test', text: 'Checks mail authentication records for sender trust.', category: 'Domain Trust' },
  { title: 'Ads.txt Test', text: 'Validates publisher ad authorization files where relevant.', category: 'Domain Trust' },
]

function UpcomingAuditChecks() {
  return (
    <Card className="overflow-hidden rounded-[30px] border-blue-100 bg-white/88 p-4 shadow-xl shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            <Clock3 className="h-3.5 w-3.5" />
            Coming soon
          </div>
          <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white lg:text-2xl">
            Advanced SEO test library
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            These deeper checks are planned for upcoming versions, so the auditor can move from quick reports to a full technical SEO workspace.
          </p>
        </div>
      </div>

      <div className="mt-4 grid max-h-[430px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {upcomingAuditChecks.map(check => (
          <button
            key={check.title}
            type="button"
            disabled
            className="group min-h-[116px] cursor-not-allowed rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 text-left opacity-90 dark:border-white/10 dark:bg-[#0d1727]"
            title={`${check.title} is coming soon`}
          >
            <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-600 shadow-sm dark:bg-white/[0.06] dark:text-blue-300">
              {check.category}
            </span>
            <span className="mt-3 block text-sm font-black text-slate-950 dark:text-white">{check.title}</span>
            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600 dark:text-slate-300">{check.text}</span>
            <span className="mt-3 inline-flex rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
              Feature in progress
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export function ScanInput({ onScan, loading = false, initialUrl = '' }: ScanInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [recentArchive, setRecentArchive] = useState<LocalAuditArchiveItem[]>([])

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl)
    setRecentArchive(loadLocalAuditArchive().slice(0, 4))
  }, [initialUrl])

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`)
      return true
    } catch {
      return false
    }
  }

  const handleScan = async () => {
    setError('')

    if (!url.trim()) {
      setError('Please enter your website URL')
      return
    }

    if (!validateUrl(url)) {
      setError('Please enter the actual working URL, like example.com')
      return
    }

    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    await onScan(fullUrl)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && url.trim()) {
      handleScan()
    }
  }

  const recentSearches = recentArchive.slice(0, 4)

  const RecentSearchesCard = ({ compact = false }: { compact?: boolean }) => (
    <div className={`rounded-[28px] border border-blue-100 bg-white/72 shadow-lg shadow-blue-100/35 dark:border-white/10 dark:bg-white/[0.04] ${compact ? 'p-4' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            Recent searches
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
            Domains you are tracking
          </h3>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full bg-white dark:bg-[#0d1727]">
          <Link href="/history">
            View history
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {recentSearches.length > 0 ? recentSearches.map(item => (
          <Link
            key={item.cacheId}
            href={`/scan?cacheId=${encodeURIComponent(item.cacheId)}`}
            className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-blue-50 bg-[#f8fbff] p-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:bg-[#0d1727] dark:hover:bg-white/[0.06]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.audit.domain}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.audit.url}</p>
              </div>
            </div>
            <Badge className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">{item.audit.scores.seo}</Badge>
          </Link>
        )) : (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-center md:col-span-2 dark:border-blue-400/20 dark:bg-blue-500/10">
            <p className="font-bold text-slate-950 dark:text-white">No recent searches yet</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Start with your homepage, product page, or competitor URL.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-5 pb-28 lg:hidden"
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Google SEO readiness scan
          </div>
          <h1 className="text-balance text-3xl font-bold leading-tight">
            Audit your website and find what to improve for Google.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Check SEO, speed, accessibility, metadata, headings, links, and developer fixes in one mobile-friendly report.
          </p>
        </div>

        <Card className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Website URL</label>
            <div className="relative">
              <Input
                type="url"
                placeholder="example.com or https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="h-12 pl-10 pr-3 text-base"
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <Button
            onClick={handleScan}
            disabled={loading || !url.trim()}
            size="lg"
            className="h-12 w-full text-base"
          >
            {loading ? 'Scanning...' : 'Start SEO Audit'}
            <ArrowRight className="h-4 w-4" />
          </Button>

        </Card>

        <RecentSearchesCard compact />

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Gauge, label: 'Speed' },
            { icon: CheckCircle2, label: 'SEO' },
            { icon: ShieldCheck, label: 'Trust' },
          ].map(item => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="p-3 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-xs font-medium">{item.label}</p>
              </Card>
            )
          })}
        </div>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Better SEO starts with knowing what blocks crawling, ranking, and page experience.
        </p>

        <TechnicalSeoLab compact />

        <UpcomingAuditChecks />
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden min-h-full bg-[radial-gradient(circle_at_10%_0%,rgba(138,199,255,0.36),transparent_34%),linear-gradient(135deg,#eef6ff_0%,#f8fbff_52%,#edf7ff_100%)] p-8 lg:block xl:p-10 dark:bg-[radial-gradient(circle_at_12%_0%,rgba(96,165,250,0.18),transparent_36%),linear-gradient(135deg,#07111f_0%,#0b1626_58%,#08111f_100%)]"
    >
      <div className="mx-auto grid max-w-[1180px] gap-6 xl:grid-cols-[minmax(680px,1.55fr)_minmax(320px,0.65fr)]">
        <section className="overflow-hidden rounded-[36px] border border-blue-200 bg-white/88 p-8 shadow-2xl shadow-blue-100/70 backdrop-blur dark:border-blue-400/20 dark:bg-white/[0.06] dark:shadow-black/20">
          <div className="grid items-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Google SEO readiness scan
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-slate-950 dark:text-white">
                Search any URL and get a clear SEO action plan.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Scan speed, accessibility, headings, metadata, links, content quality, and developer fixes without leaving the dashboard.
              </p>

              <Card className="mt-8 rounded-[32px] border-blue-200 bg-[#f8fbff] p-6 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-[#0d1727] dark:shadow-black/20">
                <label htmlFor="desktop-scan-url" className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
                  <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  Website URL
                </label>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="desktop-scan-url"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={loading}
                      className="h-16 rounded-[22px] border-blue-100 bg-white pl-14 pr-5 text-lg shadow-inner shadow-slate-100 focus-visible:ring-blue-400 dark:border-white/10 dark:bg-[#08111f] dark:text-white dark:shadow-black/10"
                    />
                  </div>
                  <Button
                    onClick={handleScan}
                    disabled={loading || !url.trim()}
                    size="lg"
                    className="h-16 rounded-[22px] px-8 text-base font-black shadow-lg shadow-blue-200/70 dark:shadow-blue-950/20"
                  >
                    {loading ? 'Scanning...' : 'Scan Now'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
                {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

                <div className="mt-4 grid gap-3 border-t border-blue-100 pt-4 sm:grid-cols-3 dark:border-white/10">
                  {[
                    { label: 'Private', text: 'User data is safe', icon: ShieldCheck },
                    { label: 'Live', text: 'Scan progress', icon: Zap },
                    { label: 'Actionable', text: 'Developer fixes', icon: Target },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 dark:bg-white/[0.04]">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-slate-950 dark:text-white">{item.label}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{item.text}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <div className="mt-6">
                <RecentSearchesCard />
              </div>
            </div>

            <div className="relative hidden min-h-[300px] 2xl:block" aria-hidden="true">
              <div className="absolute inset-0 rounded-[36px] bg-blue-100/70 dark:bg-blue-500/10" />
              <div className="absolute left-7 top-7 w-[260px] rotate-[-6deg] rounded-[30px] border border-blue-200 bg-white p-5 shadow-2xl shadow-blue-200/70 dark:border-white/10 dark:bg-[#111d31] dark:shadow-black/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black tracking-[0.28em] text-blue-600 dark:text-blue-300">LIVE AUDIT</p>
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <p className="mt-4 truncate text-2xl font-black text-slate-950 dark:text-white">yourwebsite.com</p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ['92', 'SEO', 'text-blue-600'],
                    ['84', 'Speed', 'text-violet-600'],
                    ['98', 'Trust', 'text-emerald-600'],
                  ].map(([score, label, tone]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
                      <p className={`text-2xl font-black ${tone}`}>{score}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
                  <p className="text-sm font-black text-slate-950 dark:text-white">Next best fix</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    Improve titles, descriptions, and unused CSS before competitors outrank you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <Card className="rounded-[30px] border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-100/60 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">What gets checked</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A complete audit flow in one scan.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                { icon: Gauge, label: 'Performance', text: 'Speed and PageSpeed opportunities' },
                { icon: CheckCircle2, label: 'SEO', text: 'Titles, metadata, headings, crawl signals' },
                { icon: ShieldCheck, label: 'Trust', text: 'Accessibility, social tags, links, and structure' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-blue-50 bg-[#f8fbff] p-3 dark:border-white/10 dark:bg-[#0d1727]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950 dark:text-white">{item.label}</span>
                      <span className="block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-[30px] border-emerald-100 bg-emerald-50/80 p-5 shadow-xl shadow-emerald-100/50 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:shadow-black/20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 dark:bg-white/10 dark:text-emerald-200">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Built for action</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Each report explains what to fix first so developers and site owners can improve rankings, speed, and conversions.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <div className="mx-auto mt-6 max-w-[1180px] space-y-6">
        <TechnicalSeoLab />
        <UpcomingAuditChecks />
      </div>
    </motion.div>
    </>
  )
}
