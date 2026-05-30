
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://www.mkvcinemas.world';

    return {
        rules: [
            {
                userAgent: 'Googlebot',
                allow: ['/', '/movie/', '/watch/', '/category/'],
                disallow: ['/admin/', '/login/', '/api/', '/private/', '/extension/'],
            },
            {
                userAgent: 'Bingbot',
                allow: ['/', '/movie/', '/watch/', '/category/'],
                disallow: ['/admin/', '/login/', '/api/', '/private/', '/extension/'],
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/login/', '/api/', '/private/', '/extension/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
