'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Gauge, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ScanInputProps {
  onScan: (url: string) => Promise<void>
  loading?: boolean
  initialUrl?: string
}

const examples = ['mehedipathan.online', 'serverbd.net']

export function ScanInput({ onScan, loading = false, initialUrl = '' }: ScanInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-5 pb-28"
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

          <div className="flex flex-wrap gap-2">
            {examples.map(example => (
              <button
                key={example}
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setUrl(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </Card>

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
      </div>
    </motion.div>
  )
}
