'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { SocialAnalysis } from '@/types'

interface SocialTabProps {
  social: SocialAnalysis
}

export function SocialTab({ social }: SocialTabProps) {
  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="bg-muted rounded-lg p-6 text-center">
        <div className="text-4xl font-bold mb-1">{Math.round(social.score)}/100</div>
        <p className="text-sm text-muted-foreground">Social Tags Completion</p>
      </div>

      {/* Open Graph */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          Open Graph
          {social.openGraphComplete && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </h3>
        <div className="bg-slate-900 text-white rounded-lg p-4 text-sm space-y-2">
          <div className="font-semibold">Facebook Preview</div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-xs text-gray-400">(Image preview would appear here)</div>
          </div>
          {social.missingFields.filter(f => f.startsWith('og:')).length > 0 && (
            <div className="text-red-400 text-xs mt-2">
              Missing: {social.missingFields.filter(f => f.startsWith('og:')).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Twitter Card */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Twitter Card</h3>
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-sm">
          <div className="font-semibold text-slate-900 dark:text-slate-100">Tweet Preview</div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {social.missingFields.filter(f => f.startsWith('twitter:')).length > 0 ? (
              <span className="break-words">Missing: {social.missingFields.filter(f => f.startsWith('twitter:')).join(', ')}</span>
            ) : (
              <span className="text-green-600 dark:text-green-400">All Twitter Card tags present</span>
            )}
          </div>
        </div>
      </div>

      {/* Missing Fields */}
      {social.missingFields.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Missing social tags</h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
              {social.missingFields.map((field, i) => (
                <li key={i} className="break-all font-mono">{field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
