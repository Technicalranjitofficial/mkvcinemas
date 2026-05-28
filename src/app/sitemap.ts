
import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const BASE_URL = 'https://mkvcinemas.world';
const CATEGORIES = ['bollywood', 'hollywood', 'south-indian', 'web-series', 'dual-audio', 'action', 'thriller', 'comedy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const movies = await prisma.movie.findMany({
        select: { id: true, updatedAt: true },
    });

    const movieEntries: MetadataRoute.Sitemap = movies.map((movie) => ({
        url: `${BASE_URL}/movie/${movie.id}`,
        lastModified: movie.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const watchEntries: MetadataRoute.Sitemap = movies
        .filter((m) => true) // include all; /watch shows stream or fallback message
        .map((movie) => ({
            url: `${BASE_URL}/watch/${movie.id}`,
            lastModified: movie.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.6,
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
        ...movieEntries,
        ...watchEntries,
    ];
}
