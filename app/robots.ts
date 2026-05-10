import type { MetadataRoute } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mp-seo-auditor.netlify.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/scan', '/history', '/profile', '/upgrade'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
