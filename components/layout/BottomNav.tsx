'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const navItems = [
  { iconSrc: '/bottom-home-icon.svg', label: 'Home', href: '/dashboard', id: 'home' },
  { iconSrc: '/bottom-history-icon.svg', label: 'History', href: '/history', id: 'history' },
  { iconSrc: '/bottom-search-icon.svg', label: 'Scan', href: '/scan', id: 'scan', primary: true },
  { iconSrc: '/bottom-backlinks-icon.svg', label: 'Backlinks', href: '/backlinks', id: 'backlinks' },
  { iconSrc: '/bottom-profile-icon.svg', label: 'Profile', href: '/profile', id: 'profile' },
]

interface BottomNavProps {
  avatarUrl?: string | null
}

export function BottomNav({ avatarUrl }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 px-4 pb-3">
      <motion.nav
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-5 items-end gap-2 rounded-[28px] border border-border/70 bg-background/95 px-3 py-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:bg-[#0d1727]/95 dark:shadow-black/30"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className="relative flex min-w-0 flex-col items-center rounded-2xl px-1 py-1 text-[11px] font-medium transition-colors"
              aria-label={item.label}
              title={item.label}
            >
              {item.primary ? (
                <span className="relative -mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                  <img
                    src={item.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="relative z-10 h-8 w-8 object-contain invert"
                  />
                  <motion.span
                    animate={{ scale: [1, 1.14, 1], opacity: [0.18, 0.06, 0.18] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </span>
              ) : (
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    isActive
                      ? 'bg-primary/25 text-primary ring-1 ring-primary/30'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.id === 'profile' && avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile image"
                      className={`h-8 w-8 rounded-full object-cover ${
                        isActive ? 'ring-2 ring-primary/50' : 'ring-1 ring-border'
                      }`}
                    />
                  ) : (
                    <img
                      src={item.iconSrc}
                      alt=""
                      aria-hidden="true"
                      className={`h-6 w-6 object-contain transition-all dark:invert ${
                        isActive ? 'opacity-100' : 'opacity-55'
                      }`}
                    />
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
