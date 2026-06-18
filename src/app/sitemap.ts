
import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { movieSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://www.mkvcinemas.world';
const CURRENT_YEAR = new Date().getFullYear();
const CATEGORIES = [
    'bollywood', 'hollywood', 'south-indian', 'web-series', 'dual-audio', 'action', 'thriller', 'comedy',
    'netflix', 'prime-video', 'disney-plus', 'apple-tv-plus', 'hbo', 'zee5', 'sonyliv', 'jiocinema', 'mx-player', 'aha', 'mubi',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let movies: { id: string; title: string; updatedAt: Date }[] = [];
    try {
        movies = await prisma.movie.findMany({
            select: { id: true, title: true, updatedAt: true },
            where: { year: { lte: CURRENT_YEAR }, rating: { gt: 0 } },
        });
    } catch (e) {
        console.error('Sitemap DB error:', e);
        // Return static-only sitemap if DB unavailable
    }

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
