'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { FileCode2, Globe2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface TechnicalSeoLabProps {
  compact?: boolean
}

const aiCrawlerRules = [
  'User-agent: GPTBot',
  'Disallow: /',
  '',
  'User-agent: ChatGPT-User',
  'Disallow: /',
  '',
  'User-agent: CCBot',
  'Disallow: /',
  '',
  'User-agent: Google-Extended',
  'Disallow: /',
]

export function TechnicalSeoLab({ compact = false }: TechnicalSeoLabProps) {
  const [blockAiCrawlers, setBlockAiCrawlers] = useState(false)
  const [siteUrl, setSiteUrl] = useState('https://yourwebsite.com')

  const normalizedSite = useMemo(() => {
    const trimmed = siteUrl.trim() || 'https://yourwebsite.com'
    const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`

    try {
      const url = new URL(withProtocol)
      return `${url.protocol}//${url.hostname}`.replace(/\/$/, '')
    } catch {
      return 'https://yourwebsite.com'
    }
  }, [siteUrl])

  const robotsCode = useMemo(() => {
    const base = [
      'User-agent: *',
      'Allow: /',
      '',
      'Disallow: /admin/',
      'Disallow: /checkout/',
      'Disallow: /account/',
      '',
      `Sitemap: ${normalizedSite}/sitemap.xml`,
    ]

    return blockAiCrawlers ? [...base, '', '# Optional AI crawler controls', ...aiCrawlerRules].join('\n') : base.join('\n')
  }, [blockAiCrawlers, normalizedSite])

  const copyRobotsText = async () => {
    try {
      await navigator.clipboard.writeText(robotsCode)
      toast.success('Robots.txt copied')
    } catch {
      toast.error('Clipboard permission denied. Select and copy the robots.txt text manually.')
    }
  }

  return (
    <Card className="overflow-hidden rounded-[30px] border-blue-200 bg-white/92 shadow-xl shadow-blue-100/60 dark:border-blue-400/20 dark:bg-white/[0.06] dark:shadow-black/20">
      <div className={`grid gap-4 ${compact ? 'p-4' : 'p-5 lg:p-6'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Technical SEO Lab
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Crawl control, sitemap health, and robots rules in one place.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Built for developers who want cleaner indexing, safer crawler access, and a ready-to-edit robots.txt workflow.
            </p>
          </div>
          <Badge className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
            New workspace
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-3">
            <div className="rounded-[24px] border border-blue-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                  <Globe2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-950 dark:text-white">Sitemap Health</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Detect sitemap URLs, indexable coverage, stale pages, and discovery issues before Google misses important content.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">XML sitemap</Badge>
                    <Badge variant="outline" className="rounded-full">Index coverage</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0d1727]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-950 dark:text-white">Robots.txt Analysis</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Review blocked paths, missing sitemap references, accidental disallow rules, and crawler directives.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full">Crawler rules</Badge>
                    <Badge variant="outline" className="rounded-full">AI crawler controls</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-inner shadow-black/20 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-400/15 text-blue-200">
                  <FileCode2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black">robots.txt generator</p>
                  <p className="text-xs text-slate-400">Editable starter rules</p>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                <LockKeyhole className="h-3.5 w-3.5 text-amber-300" />
                Block AI Crawlers
                <Switch checked={blockAiCrawlers} onCheckedChange={setBlockAiCrawlers} aria-label="Block AI crawlers" />
              </label>
            </div>
            <div className="mt-4">
              <label htmlFor="robots-generator-url" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Website URL
              </label>
              <Input
                id="robots-generator-url"
                value={siteUrl}
                onChange={event => setSiteUrl(event.target.value)}
                placeholder="https://yourwebsite.com"
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-300"
              />
            </div>
            <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-[#07111f] p-4 text-xs leading-6 text-blue-50">
              <code>{robotsCode}</code>
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full bg-blue-400 text-slate-950 hover:bg-blue-300" onClick={copyRobotsText}>
                Generate and copy
              </Button>
              <Button size="sm" variant="outline" className="rounded-full border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white" onClick={copyRobotsText}>
                Copy template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
