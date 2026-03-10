import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/settings/',
          '/chat/',
          '/funnels/',
          '/assets/',
          '/intelligence/',
          '/performance/',
          '/content/',
          '/brands/',
          '/campaigns/',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com'}/sitemap.xml`,
  };
}
