'use client'

import { useMemo, useState, type ComponentType } from 'react'
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Gauge,
  Gem,
  Globe2,
  Link2,
  Lightbulb,
  MapPin,
  PenLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type TipCategory = 'All' | 'On-Page' | 'Technical' | 'Content' | 'Performance' | 'Backlinks' | 'Off-Page' | 'Local SEO'
type TipImpact = 'High' | 'Medium' | 'Low'
type TipDifficulty = 'Easy' | 'Medium' | 'Hard'

interface SeoTip {
  id: string
  icon: string
  title: string
  description: string
  category: Exclude<TipCategory, 'All'>
  impact: TipImpact
  difficulty: TipDifficulty
  steps: string[]
  badExample: string
  goodExample: string
  stat: string
}

const categoryMeta: Record<Exclude<TipCategory, 'All'>, {
  icon: ComponentType<{ className?: string }>
  tone: string
  description: string
}> = {
  'On-Page': {
    icon: Sparkles,
    tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
    description: 'Make each page clear, clickable, and easy for Google to understand.',
  },
  Technical: {
    icon: ShieldCheck,
    tone: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
    description: 'Fix crawl, index, structure, and site health issues.',
  },
  Content: {
    icon: PenLine,
    tone: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900',
    description: 'Create pages that answer questions and move buyers closer to action.',
  },
  Performance: {
    icon: Gauge,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
    description: 'Improve speed, mobile experience, and conversion flow.',
  },
  Backlinks: {
    icon: Link2,
    tone: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900',
    description: 'Earn trust signals from relevant websites.',
  },
  'Off-Page': {
    icon: Globe2,
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900',
    description: 'Grow authority through reputation, mentions, and brand visibility.',
  },
  'Local SEO': {
    icon: MapPin,
    tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
    description: 'Win local map searches, calls, and nearby customers.',
  },
}

const categories: TipCategory[] = ['All', 'On-Page', 'Technical', 'Content', 'Performance', 'Backlinks', 'Off-Page', 'Local SEO']

const tips: SeoTip[] = [
  {
    id: 'title-tags',
    icon: '🏷️',
    title: 'Write search-focused title tags',
    description: 'Use a clear keyword, benefit, and page promise so Google and searchers instantly understand the page.',
    category: 'On-Page',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Put the main keyword near the start.', 'Keep it around 50 to 60 characters.', 'Add product type, location, offer, or brand when useful.'],
    badExample: 'Home | Best Company',
    goodExample: 'Organic Skincare Products in Dhaka | Free Delivery',
    stat: 'Pages with clear titles often earn more clicks even before ranking higher.',
  },
  {
    id: 'meta-descriptions',
    icon: '🧾',
    title: 'Improve meta descriptions for buyers',
    description: 'Write a short search result pitch that explains why the page is worth clicking.',
    category: 'On-Page',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Keep it around 140 to 160 characters.', 'Mention offer, delivery, warranty, or service area.', 'Make every important page unique.'],
    badExample: 'We sell products. Visit our website.',
    goodExample: 'Shop premium running shoes with fast delivery, easy returns, and verified customer reviews.',
    stat: 'Better snippets can improve click-through from the same Google position.',
  },
  {
    id: 'heading-structure',
    icon: '🧭',
    title: 'Use one H1 and helpful headings',
    description: 'Structure headings so users can scan the page and Google can understand the content hierarchy.',
    category: 'On-Page',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Use one clear H1 for the main topic.', 'Use H2s for benefits, specs, FAQs, and pricing.', 'Avoid generic headings like Welcome or Details.'],
    badExample: 'Multiple H1 tags saying Sale, Welcome, and Products',
    goodExample: 'H1: Men’s Running Shoes, H2: Size Guide, H2: Delivery, H2: Reviews',
    stat: 'Clear page structure helps both accessibility and search understanding.',
  },
  {
    id: 'url-slugs',
    icon: '🔗',
    title: 'Clean up URL slugs',
    description: 'Short descriptive URLs are easier to share, easier to read, and better aligned with page topics.',
    category: 'On-Page',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Use lowercase words separated by hyphens.', 'Remove random numbers and unnecessary parameters.', 'Keep the main keyword in the slug.'],
    badExample: '/product?id=8837&cat=12',
    goodExample: '/mens-running-shoes',
    stat: 'Readable URLs improve trust and make page purpose obvious.',
  },
  {
    id: 'image-alt',
    icon: '🖼️',
    title: 'Add useful image alt text',
    description: 'Describe important images so Google Images and screen readers understand what they show.',
    category: 'On-Page',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Describe the product, service, or scene naturally.', 'Avoid stuffing repeated keywords.', 'Leave purely decorative images empty when appropriate.'],
    badExample: 'best best best shoes keyword shoes',
    goodExample: 'Black leather office shoes for men with lace-up design',
    stat: 'Image search can become an extra discovery channel for products.',
  },
  {
    id: 'internal-links',
    icon: '🕸️',
    title: 'Build helpful internal links',
    description: 'Connect related pages so users discover more and ranking signals flow to key URLs.',
    category: 'On-Page',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Link category pages to best-selling products.', 'Link blog posts to related service pages.', 'Use descriptive anchor text.'],
    badExample: 'Click here',
    goodExample: 'Compare our SEO audit service packages',
    stat: 'Strong internal linking can help important pages get crawled and ranked faster.',
  },
  {
    id: 'first-screen-message',
    icon: '🎯',
    title: 'Make the first screen instantly clear',
    description: 'Tell visitors what you offer, who it is for, and why they should continue before they scroll.',
    category: 'On-Page',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Write a direct headline with the product or service name.', 'Add one sentence explaining the main benefit.', 'Place the primary action button where users can see it immediately.'],
    badExample: 'Welcome to our website',
    goodExample: 'Premium office furniture in Dhaka with delivery and installation',
    stat: 'Clear first-screen messaging can reduce bounce and keep buyers moving.',
  },
  {
    id: 'product-copy',
    icon: '🛒',
    title: 'Write unique product descriptions',
    description: 'Replace supplier copy with helpful product details that reduce buyer hesitation.',
    category: 'Content',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Explain who the product is for.', 'Add size, material, use, delivery, and return details.', 'Include real benefits, not only features.'],
    badExample: 'High quality product. Buy now.',
    goodExample: 'Breathable cotton polo for daily office wear, available in 5 sizes with 3-day delivery.',
    stat: 'Unique descriptions help product pages avoid thin or duplicate content problems.',
  },
  {
    id: 'buyer-faqs',
    icon: '❓',
    title: 'Add buyer-focused FAQs',
    description: 'Answer common objections before users leave the page to search elsewhere.',
    category: 'Content',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Collect questions from customers, chat, and sales calls.', 'Answer price, delivery, warranty, and comparison questions.', 'Place FAQs near the buying section.'],
    badExample: 'FAQ: What is your company?',
    goodExample: 'FAQ: How long does delivery take in Dhaka?',
    stat: 'Helpful FAQs can increase trust and keep buyers on your website longer.',
  },
  {
    id: 'comparison-content',
    icon: '⚖️',
    title: 'Create comparison content',
    description: 'Help users compare options honestly so they can make a confident decision.',
    category: 'Content',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Compare products, plans, materials, or services.', 'Show pros, cons, price range, and best use case.', 'Link to the relevant product or service page.'],
    badExample: 'Our product is always the best.',
    goodExample: 'Cotton vs polyester: which fabric is better for summer?',
    stat: 'Comparison searches often come from users close to buying.',
  },
  {
    id: 'content-refresh',
    icon: '♻️',
    title: 'Refresh old pages regularly',
    description: 'Improve existing pages with updated facts, better sections, and current buyer intent.',
    category: 'Content',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Find pages losing traffic.', 'Update outdated examples, screenshots, and prices.', 'Add missing sections competitors already cover.'],
    badExample: 'Leaving a 2022 guide unchanged for years',
    goodExample: 'Updated 2026 pricing, screenshots, FAQ, and product recommendations',
    stat: 'Refreshing old pages is often faster than creating new content from zero.',
  },
  {
    id: 'case-studies',
    icon: '📈',
    title: 'Show proof with case studies',
    description: 'Use real results, photos, reviews, and stories to build trust before the sale.',
    category: 'Content',
    impact: 'Medium',
    difficulty: 'Medium',
    steps: ['Show the problem, work, and result.', 'Add numbers where possible.', 'Link case studies to service pages.'],
    badExample: 'We are trusted by many clients.',
    goodExample: 'Reduced page load time by 42% and increased leads by 18%.',
    stat: 'Proof-based content improves trust for both users and search quality signals.',
  },
  {
    id: 'crawl-index',
    icon: '🧩',
    title: 'Fix crawl and index issues',
    description: 'Make sure important pages are accessible, indexable, and not accidentally blocked.',
    category: 'Technical',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Check robots.txt and noindex tags.', 'Submit sitemap in Google Search Console.', 'Inspect important URLs after publishing.'],
    badExample: 'Blocking /products/ in robots.txt',
    goodExample: 'Allow product pages and submit updated sitemap URLs',
    stat: 'A blocked page cannot rank, no matter how good the content is.',
  },
  {
    id: 'canonical-tags',
    icon: '🧷',
    title: 'Use canonical tags correctly',
    description: 'Tell Google which version of similar or duplicate pages should be treated as the main URL.',
    category: 'Technical',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Set canonical to the preferred page.', 'Avoid canonicalizing every page to the homepage.', 'Check filtered category URLs carefully.'],
    badExample: 'Every product canonical points to /',
    goodExample: '/red-running-shoes canonical points to itself',
    stat: 'Canonical mistakes can hide valuable pages from search results.',
  },
  {
    id: 'schema-markup',
    icon: '🧠',
    title: 'Add structured data',
    description: 'Use schema markup to help Google understand products, reviews, organization, FAQs, and local business details.',
    category: 'Technical',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Use Product schema for e-commerce pages.', 'Use LocalBusiness for local services.', 'Validate with Google Rich Results Test.'],
    badExample: 'Fake review schema on pages with no reviews',
    goodExample: 'Product schema with real price, availability, and ratings',
    stat: 'Structured data can make search results richer and more useful.',
  },
  {
    id: 'sitemap-health',
    icon: '🗺️',
    title: 'Keep XML sitemap clean',
    description: 'Your sitemap should include important live pages, not broken, redirected, or duplicate URLs.',
    category: 'Technical',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Remove 404 and redirected URLs.', 'Include canonical product, category, and service pages.', 'Update sitemap after major site changes.'],
    badExample: 'Sitemap contains deleted product URLs',
    goodExample: 'Sitemap only lists live indexable pages',
    stat: 'Clean sitemaps help Google discover important pages efficiently.',
  },
  {
    id: 'mobile-usability',
    icon: '📱',
    title: 'Fix mobile usability issues',
    description: 'Make buttons, menus, product cards, and forms easy to use on small screens.',
    category: 'Technical',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Use readable font sizes.', 'Make tap targets large enough.', 'Avoid content wider than the screen.'],
    badExample: 'Tiny checkout buttons on mobile',
    goodExample: 'Large sticky checkout button with readable product summary',
    stat: 'Most users browse and compare from mobile before buying.',
  },
  {
    id: 'https-security',
    icon: '🔒',
    title: 'Use HTTPS everywhere',
    description: 'Secure every page so users and browsers trust the site.',
    category: 'Technical',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Install SSL properly.', 'Redirect HTTP to HTTPS.', 'Fix mixed content warnings.'],
    badExample: 'Checkout page loads images over HTTP',
    goodExample: 'All pages and assets load securely over HTTPS',
    stat: 'Security warnings can destroy trust at the exact moment users are ready to buy.',
  },
  {
    id: 'page-speed',
    icon: '⚡',
    title: 'Improve Core Web Vitals',
    description: 'Speed up loading, interaction, and layout stability so visitors stay and convert.',
    category: 'Performance',
    impact: 'High',
    difficulty: 'Hard',
    steps: ['Compress and resize images.', 'Reduce unused JavaScript and CSS.', 'Prevent layout shifts from images, ads, and banners.'],
    badExample: 'Huge hero image loads before all content',
    goodExample: 'Optimized hero image with fixed dimensions and lazy-loaded below-fold images',
    stat: 'Fast pages support better user experience and conversion rates.',
  },
  {
    id: 'image-compression',
    icon: '🖼️',
    title: 'Compress large images',
    description: 'Reduce image file size without making product photos look low quality.',
    category: 'Performance',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Use WebP or AVIF where possible.', 'Resize images to display size.', 'Compress before upload.'],
    badExample: 'Uploading 5000px product photos directly',
    goodExample: 'Serving a 900px compressed WebP product image',
    stat: 'Images are often the biggest reason small business websites feel slow.',
  },
  {
    id: 'checkout-speed',
    icon: '💳',
    title: 'Speed up checkout and forms',
    description: 'Remove friction from purchase, booking, and contact forms.',
    category: 'Performance',
    impact: 'High',
    difficulty: 'Medium',
    steps: ['Ask only for necessary fields.', 'Use clear error messages.', 'Keep checkout buttons visible and easy to tap.'],
    badExample: 'A long form asking unnecessary details before checkout',
    goodExample: 'Short checkout with phone, address, payment, and order summary',
    stat: 'Every extra step can reduce completed purchases.',
  },
  {
    id: 'cache-assets',
    icon: '🚀',
    title: 'Cache static assets',
    description: 'Let browsers reuse files like fonts, CSS, JS, and images so repeat visits are faster.',
    category: 'Performance',
    impact: 'Medium',
    difficulty: 'Medium',
    steps: ['Set cache headers for static files.', 'Use a CDN when possible.', 'Version files when deploying changes.'],
    badExample: 'No cache headers on images and scripts',
    goodExample: 'Long cache for versioned assets and CDN delivery',
    stat: 'Repeat visitors should not download the same assets again and again.',
  },
  {
    id: 'font-loading',
    icon: '🔤',
    title: 'Optimize font loading',
    description: 'Fonts should not block important text or cause visible layout movement.',
    category: 'Performance',
    impact: 'Low',
    difficulty: 'Medium',
    steps: ['Use fewer font weights.', 'Preload critical fonts.', 'Use font-display swap.'],
    badExample: 'Six font families with many weights',
    goodExample: 'One brand font with regular and bold only',
    stat: 'Clean font loading makes pages feel faster and more polished.',
  },
  {
    id: 'quality-backlinks',
    icon: '🤝',
    title: 'Earn relevant backlinks',
    description: 'Get links from websites that make sense for your business, industry, or location.',
    category: 'Backlinks',
    impact: 'High',
    difficulty: 'Hard',
    steps: ['Create resources worth referencing.', 'Ask partners and suppliers for mentions.', 'Avoid spam link packages.'],
    badExample: 'Buying 1,000 random links overnight',
    goodExample: 'Supplier page links to your official retailer profile',
    stat: 'Relevant backlinks are stronger than large numbers of weak links.',
  },
  {
    id: 'digital-pr',
    icon: '📰',
    title: 'Turn PR into backlinks',
    description: 'Use news, launches, data, and stories to earn mentions from trusted websites.',
    category: 'Backlinks',
    impact: 'Medium',
    difficulty: 'Hard',
    steps: ['Publish a useful story or data point.', 'Pitch relevant local or industry websites.', 'Ask for a link when they mention your brand.'],
    badExample: 'Generic press release with no useful angle',
    goodExample: 'Local store shares annual buying trend report with city media',
    stat: 'Brand mentions from trusted publications can support authority.',
  },
  {
    id: 'supplier-links',
    icon: '🏭',
    title: 'Ask suppliers for retailer links',
    description: 'Many suppliers, partners, and distributors have pages listing official sellers or clients.',
    category: 'Backlinks',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['List current suppliers and partners.', 'Find their dealer or partner pages.', 'Request your business be added with a link.'],
    badExample: 'Asking unrelated websites for links',
    goodExample: 'Official brand lists your shop as an authorized seller',
    stat: 'Existing relationships are often the easiest source of clean backlinks.',
  },
  {
    id: 'broken-link-outreach',
    icon: '🛠️',
    title: 'Use broken link outreach',
    description: 'Find broken resources on relevant websites and suggest your useful replacement page.',
    category: 'Backlinks',
    impact: 'Low',
    difficulty: 'Hard',
    steps: ['Find broken pages in your niche.', 'Create or identify a strong replacement resource.', 'Send a helpful short outreach message.'],
    badExample: 'Sending mass spam templates',
    goodExample: 'Noticed your guide links to a dead page; this updated guide may help.',
    stat: 'Helpful outreach works best when it genuinely fixes a problem.',
  },
  {
    id: 'brand-mentions',
    icon: '📣',
    title: 'Convert brand mentions into links',
    description: 'When websites mention your brand without linking, politely ask them to add the link.',
    category: 'Off-Page',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Search for unlinked brand mentions.', 'Contact the page owner politely.', 'Send the exact URL they should link to.'],
    badExample: 'Demanding links aggressively',
    goodExample: 'Thanks for mentioning us. Could you link our brand name to our official site?',
    stat: 'Unlinked mentions are warm opportunities because the website already knows your brand.',
  },
  {
    id: 'social-proof',
    icon: '⭐',
    title: 'Build off-page social proof',
    description: 'Improve trust outside your site through reviews, communities, and visible customer conversations.',
    category: 'Off-Page',
    impact: 'Medium',
    difficulty: 'Medium',
    steps: ['Ask customers for honest public feedback.', 'Share useful posts in relevant communities.', 'Show real customer results and stories.'],
    badExample: 'Fake reviews or copied testimonials',
    goodExample: 'Verified customer review with product photo and practical detail',
    stat: 'Trust signals outside your website can influence searchers before they click.',
  },
  {
    id: 'directory-citations',
    icon: '📚',
    title: 'List your business in trusted directories',
    description: 'Use relevant industry, local, and professional directories to improve discoverability.',
    category: 'Off-Page',
    impact: 'Low',
    difficulty: 'Easy',
    steps: ['Choose trusted directories only.', 'Keep name, address, phone, and website consistent.', 'Avoid low-quality directory farms.'],
    badExample: 'Submitting to hundreds of spam directories',
    goodExample: 'Listed in official chamber, marketplace, and industry directories',
    stat: 'Consistent citations help users and search engines verify business details.',
  },
  {
    id: 'influencer-collabs',
    icon: '🎯',
    title: 'Collaborate with niche creators',
    description: 'Partner with creators whose audience matches your product or service.',
    category: 'Off-Page',
    impact: 'Medium',
    difficulty: 'Medium',
    steps: ['Choose creators with relevant audience, not only follower count.', 'Offer a useful product, guide, or experience.', 'Ask for honest coverage with a natural link where appropriate.'],
    badExample: 'Paying unrelated creators for generic posts',
    goodExample: 'A local food blogger reviews your restaurant menu and links to booking page',
    stat: 'Relevant creator mentions can drive both traffic and brand search demand.',
  },
  {
    id: 'google-business-profile',
    icon: '📍',
    title: 'Strengthen Google Business Profile',
    description: 'Complete your profile so customers can find, trust, call, and visit your business.',
    category: 'Local SEO',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Fill services, products, hours, and contact details.', 'Upload real photos regularly.', 'Post offers and updates.'],
    badExample: 'Empty profile with old hours and no photos',
    goodExample: 'Complete profile with products, service areas, photos, and weekly updates',
    stat: 'A strong Google Business Profile can bring calls before users visit your website.',
  },
  {
    id: 'local-reviews',
    icon: '💬',
    title: 'Collect and respond to reviews',
    description: 'Reviews build local trust and help customers choose you before competitors.',
    category: 'Local SEO',
    impact: 'High',
    difficulty: 'Easy',
    steps: ['Ask happy customers for honest Google reviews.', 'Reply to every review professionally.', 'Mention service and location naturally when relevant.'],
    badExample: 'Ignoring negative reviews for months',
    goodExample: 'Thank you for visiting our Gulshan store. Glad the delivery was fast.',
    stat: 'Review quality and freshness can strongly influence local customer decisions.',
  },
  {
    id: 'location-pages',
    icon: '🏙️',
    title: 'Create useful location pages',
    description: 'Build dedicated pages for real service areas with useful local details.',
    category: 'Local SEO',
    impact: 'Medium',
    difficulty: 'Medium',
    steps: ['Create pages only for real locations served.', 'Add local proof, photos, FAQs, and contact details.', 'Avoid copy-paste city pages.'],
    badExample: 'Same page duplicated for 20 cities with only city name changed',
    goodExample: 'SEO services in Dhaka with local case studies and service coverage',
    stat: 'Useful location pages can rank for high-intent local searches.',
  },
  {
    id: 'nap-consistency',
    icon: '☎️',
    title: 'Keep NAP details consistent',
    description: 'Use the same business name, address, and phone across your website and listings.',
    category: 'Local SEO',
    impact: 'Medium',
    difficulty: 'Easy',
    steps: ['Audit website footer, contact page, and directories.', 'Fix old phone numbers or addresses.', 'Match Google Business Profile details.'],
    badExample: 'Different phone numbers on Facebook, Google, and website',
    goodExample: 'Same name, address, phone, and website everywhere',
    stat: 'Consistency helps customers and search engines trust local business data.',
  },
]

const impactClass: Record<TipImpact, string> = {
  High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  Low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
}

const difficultyClass: Record<TipDifficulty, string> = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  Hard: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
}

const featureHighlights = [
  {
    icon: Target,
    title: 'Actionable',
    description: 'Real steps you can implement today',
    className: 'bg-blue-500/15 text-blue-300 ring-blue-400/20',
  },
  {
    icon: ShieldCheck,
    title: 'Proven',
    description: 'Tips that improve rankings and traffic',
    className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  },
  {
    icon: Zap,
    title: 'Easy to Apply',
    description: 'Simple strategies for faster results',
    className: 'bg-violet-500/15 text-violet-300 ring-violet-400/20',
  },
  {
    icon: TrendingUp,
    title: 'Growth Focused',
    description: 'More visibility, more customers',
    className: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  },
]

export default function TipsPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<TipCategory>('All')
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<TipCategory, number>>((counts, category) => {
      counts[category] = category === 'All'
        ? tips.length
        : tips.filter(tip => tip.category === category).length
      return counts
    }, {
      All: 0,
      'On-Page': 0,
      Technical: 0,
      Content: 0,
      Performance: 0,
      Backlinks: 0,
      'Off-Page': 0,
      'Local SEO': 0,
    })
  }, [])

  const filteredTips = useMemo(() => {
    return tips.filter(tip => {
      const matchesCategory = activeCategory === 'All' || tip.category === activeCategory
      const matchesQuery = !normalizedQuery || `${tip.title} ${tip.description}`.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, normalizedQuery])

  const resultLabel = activeCategory === 'All'
    ? `Showing ${filteredTips.length} SEO tips`
    : `Showing ${filteredTips.length} tips for ${activeCategory} SEO`

  return (
    <div className="-mx-4 -mb-24 min-h-full space-y-5 bg-[#f6f8fc] px-4 pb-28 pt-4 text-slate-950 dark:bg-[#08111f] dark:text-slate-100">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_82%_16%,rgba(245,158,11,0.22),transparent_24%),radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,#ffffff_0%,#eef5ff_48%,#f4efff_100%)] p-5 shadow-2xl shadow-slate-200/80 dark:border-white/10 dark:bg-[radial-gradient(circle_at_82%_16%,rgba(245,158,11,0.28),transparent_24%),radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.2),transparent_28%),linear-gradient(135deg,#0b1626_0%,#10172d_48%,#17102c_100%)] dark:shadow-black/25">
        <div className="grid gap-5">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-violet-200 bg-violet-100 text-violet-700 shadow-lg shadow-violet-200/60 dark:border-violet-300/25 dark:bg-violet-500/25 dark:text-white dark:shadow-violet-950/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">SEO growth guide</p>
              <h1 className="mt-2 text-4xl font-black leading-none text-slate-950 dark:text-white">
                Tips <span className="text-violet-600 dark:text-violet-300">Library</span>
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                Practical SEO actions for owners who want more Google visibility, more visitors, and better sales from every important page.
              </p>
            </div>
          </div>

          <div className="relative mx-auto h-36 w-full max-w-[260px]">
            <div className="absolute bottom-2 left-8 h-16 w-44 -skew-x-12 rounded-2xl border border-violet-200 bg-violet-200/80 shadow-xl shadow-violet-200/50 dark:border-violet-300/20 dark:bg-violet-500/35 dark:shadow-black/30" />
            <div className="absolute bottom-8 left-12 h-20 w-44 -skew-x-12 rounded-2xl border border-violet-300 bg-violet-300/80 shadow-xl shadow-violet-300/40 dark:border-violet-200/30 dark:bg-violet-400/35 dark:shadow-violet-950/40" />
            <div className="absolute bottom-14 left-24 rounded-xl border border-violet-400/30 px-4 py-2 text-2xl font-black text-violet-800/60 dark:border-violet-200/20 dark:text-violet-200/70">
              SEO
            </div>
            <div className="absolute right-8 top-2 flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/60 bg-amber-300 text-amber-950 shadow-[0_0_36px_rgba(251,191,36,0.5)]">
              <Lightbulb className="h-10 w-10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-inner shadow-white dark:border-white/10 dark:bg-white/[0.06] dark:shadow-white/5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-300/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-950 dark:text-white">{categories.length - 1}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Categories</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full w-7/12 rounded-full bg-blue-400" />
              </div>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-inner shadow-white dark:border-white/10 dark:bg-white/[0.06] dark:shadow-white/5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-300/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-950 dark:text-white">{tips.length}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Action tips</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full w-8/12 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white/80 p-4 shadow-inner shadow-white dark:border-white/10 dark:bg-white/[0.06] dark:shadow-white/5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-300/20">
                <Globe2 className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-slate-950 dark:text-white">Google</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Focused</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full w-9/12 rounded-full bg-violet-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-[26px] border border-slate-200 bg-white/80 p-3 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/10">
        <div className="grid grid-cols-2 gap-3">
          {featureHighlights.map(feature => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0c1727]/80">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${feature.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950 dark:text-white">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-[26px] border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-200/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#08111f]/90 dark:shadow-black/20">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search tips..."
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pr-11 pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-blue-400 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {categories.map(category => {
              const isActive = activeCategory === category

              return (
                <button
                  key={category}
                  type="button"
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200 dark:border-blue-400 dark:shadow-blue-950/40'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1] dark:hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveCategory(category)
                    setExpandedTipId(null)
                  }}
                >
                  {category}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                  }`}>
                    {categoryCounts[category]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{resultLabel}</p>
      </section>

      <section className="space-y-3">
        {filteredTips.map(tip => {
          const isExpanded = expandedTipId === tip.id
          const categoryTone = categoryMeta[tip.category].tone

          return (
            <Card key={tip.id} className="overflow-hidden rounded-[24px] border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-[#0d1727] dark:text-slate-100 dark:shadow-black/15">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl ring-1 ring-slate-200 dark:bg-white/[0.08] dark:ring-white/10">
                  {tip.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold leading-snug text-slate-950 dark:text-white">{tip.title}</span>
                  <span className="mt-1 block overflow-hidden text-sm leading-6 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-slate-400">
                    {tip.description}
                  </span>
                  <span className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${categoryTone}`}>{tip.category}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${impactClass[tip.impact]}`}>{tip.impact}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyClass[tip.difficulty]}`}>{tip.difficulty}</span>
                  </span>
                </span>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#0a1322]">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{tip.description}</p>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Step by step action</h3>
                    <ol className="mt-3 space-y-2">
                      {tip.steps.map((step, index) => (
                        <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-300/20">
                            {index + 1}
                          </span>
                          <span className="min-w-0 break-words">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid gap-2">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm dark:border-red-400/20 dark:bg-red-500/10">
                      <p className="font-semibold text-red-700 dark:text-red-300">Bad</p>
                      <p className="mt-1 leading-6 text-red-900/80 dark:text-red-100/80">{tip.badExample}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">Good</p>
                      <p className="mt-1 leading-6 text-emerald-900/80 dark:text-emerald-100/80">{tip.goodExample}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-300/20 dark:bg-amber-300/10">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
                      <Gem className="h-4 w-4" />
                      Insight
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-50/80">{tip.stat}</p>
                  </div>
                </div>
              )}
            </Card>
          )
        })}

        {filteredTips.length === 0 && (
          <Card className="rounded-[24px] border-slate-200 bg-white p-6 text-center text-slate-950 dark:border-white/10 dark:bg-[#0d1727] dark:text-slate-100">
            <Search className="mx-auto h-6 w-6 text-slate-400 dark:text-slate-500" />
            <h2 className="mt-3 font-semibold text-slate-950 dark:text-white">No results found</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try another keyword or choose a different category.</p>
          </Card>
        )}
      </section>
    </div>
  )
}
