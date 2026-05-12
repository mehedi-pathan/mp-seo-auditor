'use client'

import { ReactNode } from 'react'

interface MobileShellProps {
  children: ReactNode
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-muted/30 p-0 md:bg-[radial-gradient(circle_at_top,rgba(138,199,255,0.18),transparent_34%),linear-gradient(135deg,#eef5ff,#f8fbff)] md:p-4 md:dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_34%),linear-gradient(135deg,#050b14,#0b1424_52%,#111029)] lg:min-h-screen lg:p-[5px] lg:dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_34%),linear-gradient(135deg,#050b14,#0b1424_52%,#111029)]">
      {/* Phone/tablet app frame, fluid rounded workspace on larger displays. */}
      <div className="relative flex h-[100dvh] min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden border-border bg-background shadow-2xl md:h-[min(860px,calc(100dvh-32px))] md:min-h-[812px] md:rounded-3xl md:border lg:h-[calc(100dvh-10px)] lg:min-h-0 lg:max-w-none lg:rounded-[26px] lg:shadow-xl dark:shadow-black/40">
        {children}
      </div>
    </div>
  )
}
