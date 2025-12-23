import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration
 * Guides search engine crawlers on what to index
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tripledmap.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
        ],
      },
      // Block AI training bots from scraping content
      {
        userAgent: [
          // OpenAI
          'GPTBot',
          'ChatGPT-User',
          // Anthropic
          'anthropic-ai',
          'Claude-Web',
          // Google AI training
          'Google-Extended',
          // Common Crawl (used by many AI companies)
          'CCBot',
          // Cohere
          'cohere-ai',
          // ByteDance / TikTok
          'Bytespider',
          // Meta / Facebook AI
          'FacebookBot',
          'Meta-ExternalAgent',
          // Apple AI training
          'Applebot-Extended',
          // Perplexity
          'PerplexityBot',
          // Other AI/data scrapers
          'Diffbot',
          'Omgilibot',
          'Omgili',
          'PetalBot',
          'Amazonbot',
          'YouBot',
          'img2dataset',
        ],
        disallow: ['/'],
      },
      // Block common scraping tools
      {
        userAgent: [
          'Scrapy',
          'Nutch',
          'MJ12bot',
          'BLEXBot',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
