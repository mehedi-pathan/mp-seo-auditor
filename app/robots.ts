import type { MetadataRoute } from 'next'
import { publicAppUrl } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/scan', '/history', '/profile', '/upgrade'],
    },
    sitemap: `${publicAppUrl}/sitemap.xml`,
  }
}
