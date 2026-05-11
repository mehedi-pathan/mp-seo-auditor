import type { MetadataRoute } from 'next'

import { publicAppUrl } from '@/lib/siteUrl'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MP SEO Auditor',
    short_name: 'SEO Auditor',
    description:
      'Scan any website and get AI-powered SEO, speed, accessibility, and technical recommendations.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    background_color: '#08111f',
    theme_color: '#8ac7ff',
    categories: ['business', 'productivity', 'utilities'],
    lang: 'en',
    screenshots: [
      {
        src: `${publicAppUrl}/og-mp-seo-auditor.png`,
        sizes: '1317x828',
        type: 'image/png',
        form_factor: 'wide',
        label: 'MP SEO Auditor landing page and mobile preview',
      },
    ],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
