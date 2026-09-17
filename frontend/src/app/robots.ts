import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/vault/', '/api/', '/payment/'],
    },
    sitemap: 'https://myaevum.space/sitemap.xml',
  };
}
