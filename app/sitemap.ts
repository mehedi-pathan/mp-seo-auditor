import type { MetadataRoute } from 'next'
import { publicAppUrl } from '@/lib/siteUrl'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: publicAppUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${publicAppUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${publicAppUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]
}
