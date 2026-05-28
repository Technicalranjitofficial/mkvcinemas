
import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { movieSlug } from '@/lib/slug';

const BASE_URL = 'https://mkvcinemas.world';
const CATEGORIES = ['bollywood', 'hollywood', 'south-indian', 'web-series', 'dual-audio', 'action', 'thriller', 'comedy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const movies = await prisma.movie.findMany({
        select: { id: true, title: true, updatedAt: true },
    });

    const watchEntries: MetadataRoute.Sitemap = movies.map((movie) => ({
        url: `${BASE_URL}/watch/${movieSlug(movie.title, movie.id)}`,
        lastModified: movie.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((slug) => ({
        url: `${BASE_URL}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...categoryEntries,
        ...watchEntries,
    ];
}
