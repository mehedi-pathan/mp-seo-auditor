'use client'

import { ReactNode } from 'react'

interface MobileShellProps {
  children: ReactNode
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-0 md:bg-[radial-gradient(circle_at_top,rgba(138,199,255,0.18),transparent_34%),linear-gradient(135deg,#eef5ff,#f8fbff)] md:p-4 md:dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_34%),linear-gradient(135deg,#050b14,#0b1424_52%,#111029)]">
      {/* 430px centered frame for desktop */}
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden border-border bg-background shadow-2xl md:min-h-[812px] md:max-h-[860px] md:rounded-3xl md:border dark:shadow-black/40">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto pb-24">
          {children}
        </div>
      </div>
    </div>
  )
}
