type LoadingMarkProps = {
  label?: string
  compact?: boolean
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`mp-skeleton-shimmer rounded-2xl bg-blue-100/60 dark:bg-white/[0.06] ${className}`} />
}

export function LoadingMark({ label = 'Preparing workspace', compact = false }: LoadingMarkProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <div className="mp-neo-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  )
}

export function LandingRouteSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fbff,#eef7ff)] p-5 dark:bg-[linear-gradient(135deg,#08111f,#10172d)]">
      <div className="w-full max-w-5xl rounded-[32px] border border-blue-100 bg-white/80 p-6 shadow-2xl shadow-blue-100/70 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/30">
        <div className="mb-10 flex items-center justify-between">
          <SkeletonBlock className="h-11 w-44" />
          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-24" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.86fr]">
          <div className="space-y-5">
            <SkeletonBlock className="h-8 w-56" />
            <SkeletonBlock className="h-16 w-full max-w-xl" />
            <SkeletonBlock className="h-5 w-5/6" />
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-20 w-full max-w-lg" />
          </div>
          <div className="relative min-h-[300px] rounded-[30px] border border-blue-100 bg-blue-50/60 p-8 dark:border-white/10 dark:bg-white/[0.04]">
            <LoadingMark label="Loading MP SEO Auditor" />
            <div className="mt-8 grid grid-cols-3 gap-3">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export function DashboardRouteSkeleton() {
  return (
    <div className="min-h-full bg-[linear-gradient(135deg,#eaf5ff_0%,#f8fbff_48%,#edf7ff_100%)] p-4 dark:bg-[linear-gradient(135deg,#07111f_0%,#0b1626_55%,#08111f_100%)] sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-8 w-64" />
          </div>
          <LoadingMark label="Opening page" compact />
        </div>

        <section className="rounded-[30px] border border-blue-100 bg-white/78 p-6 shadow-xl shadow-blue-100/50 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
            <div className="space-y-5">
              <SkeletonBlock className="h-7 w-56" />
              <SkeletonBlock className="h-12 w-full max-w-2xl" />
              <SkeletonBlock className="h-5 w-5/6" />
              <div className="rounded-[26px] border border-blue-100 bg-blue-50/50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <SkeletonBlock className="h-5 w-32" />
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                  <SkeletonBlock className="h-14" />
                  <SkeletonBlock className="h-14" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SkeletonBlock className="h-16" />
                  <SkeletonBlock className="h-16" />
                  <SkeletonBlock className="h-16" />
                </div>
              </div>
            </div>
            <div className="rounded-[26px] border border-blue-100 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <SkeletonBlock className="h-6 w-44" />
              <div className="mt-5 grid grid-cols-2 gap-4">
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-64" />
        </div>
      </div>
    </div>
  )
}
