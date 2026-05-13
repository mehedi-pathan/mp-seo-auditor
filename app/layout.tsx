import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { publicAppUrl } from '@/lib/siteUrl'
import './globals.css'

const siteTitle = 'MP SEO Auditor - AI SEO Audit Tool'
const siteDescription =
  'Scan any website, find SEO issues, and get clear AI-powered recommendations to improve Google rankings, speed, accessibility, and technical SEO.'
const ogImage = '/og-mp-seo-auditor.png'

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: {
    default: siteTitle,
    template: '%s | MP SEO Auditor',
  },
  description: siteDescription,
  applicationName: 'MP SEO Auditor',
  generator: 'Next.js',
  manifest: '/manifest.webmanifest',
  keywords: [
    'SEO audit tool',
    'AI SEO auditor',
    'website SEO checker',
    'Google SEO analysis',
    'PageSpeed Insights',
    'technical SEO',
    'SEO report',
    'MP SEO Auditor',
  ],
  authors: [{ name: 'Mehedi Pathan', url: 'https://mehedipathan.online' }],
  creator: 'Mehedi Pathan',
  publisher: 'MP SEO Auditor',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'MP SEO Auditor',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: ogImage,
        width: 1317,
        height: 828,
        alt: 'MP SEO Auditor landing page showing AI SEO audit preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
    creator: '@mehedipathan',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/mp-seo-logo-icon-blue.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'MP SEO Auditor',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'MP SEO Auditor',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#08111f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-center" />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
