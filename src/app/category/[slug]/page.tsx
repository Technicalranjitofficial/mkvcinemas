import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { movieSlug } from '@/lib/slug';

// Revalidate every 5 minutes for category pages
export const revalidate = 300;

const BASE_URL = 'https://www.mkvcinemas.world';

// Slug → exact DB category label (for slugs that can't be derived by capitalising)
const SLUG_TO_LABEL: Record<string, string> = {
    'netflix':       'Netflix',
    'prime-video':   'Prime Video',
    'disney-plus':   'Disney+',
    'apple-tv-plus': 'Apple TV+',
    'hbo':           'HBO',
    'hulu':          'Hulu',
    'zee5':          'Zee5',
    'sonyliv':       'SonyLIV',
    'jiocinema':     'JioCinema',
    'mx-player':     'MX Player',
    'aha':           'Aha',
};

const CATEGORY_META: Record<string, { title: string; description: string; keywords: string[] }> = {
    bollywood: {
        title: 'Bollywood Movies Download 480p 720p 1080p - MKVCinemas',
        description: 'Download latest Bollywood Hindi movies in 480p, 720p, 1080p quality. Best Bollywood movies free download at MKVCinemas.',
        keywords: ['Bollywood movies download', 'Hindi movies download', 'Bollywood HD', 'new Bollywood movies 2025', 'new Bollywood movies 2026', 'mkv bollywood'],
    },
    hollywood: {
        title: 'Hollywood Movies Download Dual Audio Hindi 480p 720p 1080p - MKVCinemas',
        description: 'Download Hollywood movies in Hindi Dual Audio 480p, 720p, 1080p. Latest Hollywood movies free download at MKVCinemas.',
        keywords: ['Hollywood movies download', 'Hollywood Hindi dubbed', 'dual audio Hollywood', 'new Hollywood movies 2025', 'new Hollywood movies 2026'],
    },
    'south-indian': {
        title: 'South Indian Movies Download Hindi Dubbed 480p 720p 1080p - MKVCinemas',
        description: 'Download South Indian Tamil, Telugu, Malayalam movies Hindi dubbed in HD quality. Free South Indian movies at MKVCinemas.',
        keywords: ['South Indian movies download', 'Tamil movies Hindi dubbed', 'Telugu movies download', 'Malayalam movies', 'South Indian HD'],
    },
    'web-series': {
        title: 'Web Series Download 480p 720p 1080p All Episodes - MKVCinemas',
        description: 'Download latest Web Series all episodes in 480p, 720p, 1080p. Netflix, Amazon Prime, Disney+ series free at MKVCinemas.',
        keywords: ['web series download', 'Netflix series download', 'Amazon Prime series', 'web series all episodes 2025', 'Hindi web series 2026'],
    },
    'dual-audio': {
        title: 'Dual Audio Movies Download Hindi-English 480p 720p 1080p - MKVCinemas',
        description: 'Download Dual Audio movies in Hindi-English 480p, 720p, 1080p. Largest collection of dual audio movies at MKVCinemas.',
        keywords: ['dual audio movies download', 'Hindi English dual audio', 'Hollywood dual audio', 'dual audio 1080p download'],
    },
    action: {
        title: 'Action Movies Download HD 480p 720p 1080p - MKVCinemas',
        description: 'Download latest Action movies in HD 480p, 720p, 1080p quality. Best Bollywood Hollywood action movies at MKVCinemas.',
        keywords: ['action movies download', 'action HD movies', 'new action movies 2025', 'new action movies 2026', 'Bollywood action', 'Hollywood action'],
    },
    thriller: {
        title: 'Thriller Movies Download HD 480p 720p 1080p - MKVCinemas',
        description: 'Download best Thriller and Suspense movies in HD quality. Latest thriller movies free download at MKVCinemas.',
        keywords: ['thriller movies download', 'suspense movies HD', 'best thriller 2025', 'best thriller 2026', 'crime thriller movies'],
    },
    comedy: {
        title: 'Comedy Movies Download HD 480p 720p 1080p - MKVCinemas',
        description: 'Download latest Comedy movies in 480p, 720p, 1080p quality. Funny Bollywood Hollywood comedy movies at MKVCinemas.',
        keywords: ['comedy movies download', 'funny movies HD', 'Bollywood comedy', 'Hollywood comedy movies 2025'],
    },
    // ── OTT Platforms ────────────────────────────────────────────────────
    netflix: {
        title: 'Netflix Movies & Series Download HD 480p 720p 1080p - MKVCinemas',
        description: 'Download latest Netflix original movies and web series in 480p, 720p, 1080p quality for free at MKVCinemas.',
        keywords: ['Netflix movies download', 'Netflix series download', 'Netflix originals HD', 'download Netflix 2025', 'download Netflix 2026'],
    },
    'prime-video': {
        title: 'Amazon Prime Video Movies & Series Download HD - MKVCinemas',
        description: 'Download Amazon Prime Video original movies and series in HD 480p, 720p, 1080p quality free at MKVCinemas.',
        keywords: ['Amazon Prime movies download', 'Prime Video series download', 'Prime originals HD', 'download Prime Video 2025'],
    },
    'disney-plus': {
        title: 'Disney+ Hotstar Movies & Series Download HD - MKVCinemas',
        description: 'Download Disney+ Hotstar movies and web series in HD 480p, 720p, 1080p quality free at MKVCinemas.',
        keywords: ['Disney Plus download', 'Disney+ Hotstar movies', 'Marvel series download', 'Star Wars download', 'Hotstar HD 2025'],
    },
    'apple-tv-plus': {
        title: 'Apple TV+ Movies & Series Download HD - MKVCinemas',
        description: 'Download Apple TV+ original movies and series in HD quality for free at MKVCinemas.',
        keywords: ['Apple TV Plus download', 'Apple TV+ originals', 'Apple TV series HD', 'download Apple TV 2025'],
    },
    hbo: {
        title: 'HBO / Max Movies & Series Download HD - MKVCinemas',
        description: 'Download HBO and Max original movies and series in HD 480p, 720p, 1080p quality free at MKVCinemas.',
        keywords: ['HBO movies download', 'HBO Max series download', 'HBO originals HD', 'download HBO 2025'],
    },
    zee5: {
        title: 'Zee5 Movies & Web Series Download HD - MKVCinemas',
        description: 'Download Zee5 original movies and web series in HD quality free at MKVCinemas.',
        keywords: ['Zee5 movies download', 'Zee5 web series download', 'Zee5 originals HD', 'download Zee5 2025'],
    },
    sonyliv: {
        title: 'SonyLIV Movies & Web Series Download HD - MKVCinemas',
        description: 'Download SonyLIV original movies and web series in HD quality free at MKVCinemas.',
        keywords: ['SonyLIV download', 'SonyLIV series HD', 'Sony originals download', 'download SonyLIV 2025'],
    },
    jiocinema: {
        title: 'JioCinema Movies & Web Series Download HD - MKVCinemas',
        description: 'Download JioCinema original movies and web series in HD quality free at MKVCinemas.',
        keywords: ['JioCinema download', 'JioCinema series HD', 'Jio originals download', 'download JioCinema 2025'],
    },
};

export async function generateStaticParams() {
    return Object.keys(CATEGORY_META).map((slug) => ({ slug }));
}


export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = parseInt(page || '1', 10);
    const meta = CATEGORY_META[slug];
    const categoryName = SLUG_TO_LABEL[slug] ?? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const title = meta?.title ?? `${categoryName} Movies Download HD - MKVCinemas`;
    const description = meta?.description ?? `Download ${categoryName} movies in 480p, 720p, 1080p quality for free at MKVCinemas.`;
    const keywords = meta?.keywords ?? [`${categoryName} movies download`, `${categoryName} HD`, 'MKVCinemas'];

    // Paginated category pages: noindex + canonical to page 1
    if (currentPage > 1) {
        return {
            title: `${title} – Page ${currentPage}`,
            description,
            keywords,
            robots: { index: false, follow: true },
            alternates: { canonical: `${BASE_URL}/category/${slug}` },
        };
    }

    return {
        title,
        description,
        keywords,
        alternates: { canonical: `${BASE_URL}/category/${slug}` },
        openGraph: {
            title,
            description,
            url: `${BASE_URL}/category/${slug}`,
            siteName: 'MKVCinemas',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const { slug } = await params;
    const { page } = await searchParams;
    const currentPage = parseInt(page || '1');
    const itemsPerPage = 24;

    const categoryName = SLUG_TO_LABEL[slug] ?? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const where = { categories: { has: categoryName } };

    const cardSelect = { id: true, title: true, year: true, posterUrl: true, quality: true, audio: true, tmdbId: true, rating: true, plot: true } as const;
    const [movies, totalMovies] = await Promise.all([
        prisma.movie.findMany({
            select: cardSelect,
            where,
            orderBy: [{ year: 'desc' }, { rating: 'desc' }, { updatedAt: 'desc' }],
            take: itemsPerPage,
            skip: (currentPage - 1) * itemsPerPage,
        }),
        prisma.movie.count({ where }),
    ]);

    const totalPages = Math.ceil(totalMovies / itemsPerPage);

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: categoryName, item: `${BASE_URL}/category/${slug}` },
        ],
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${categoryName} Movies`,
        url: `${BASE_URL}/category/${slug}`,
        numberOfItems: totalMovies,
        itemListElement: movies.map((movie, i) => ({
            '@type': 'ListItem',
            position: (currentPage - 1) * itemsPerPage + i + 1,
            url: `${BASE_URL}/watch/${movieSlug(movie.title, movie.id)}`,
            name: movie.title,
        })),
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            <div className="flex-1">
                <section className="mb-8">
                    <h1 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2">
                        Category: <span className="text-red-500">{categoryName}</span>
                        <span className="text-sm font-normal text-neutral-500 ml-3">({totalMovies} movies)</span>
                    </h1>

                    {movies.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {movies.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    id={movie.id}
                                    title={movie.title}
                                    year={movie.year}
                                    posterUrl={movie.posterUrl}
                                    quality={movie.quality}
                                    audio={movie.audio}
                                    rating={movie.rating}
                                    plot={movie.plot}
                                    tmdbId={movie.tmdbId}
                                    priority={currentPage === 1 && movies.indexOf(movie) < 4}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-500">
                            <p>No movies found in this category.</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex flex-wrap justify-center items-center gap-1.5 text-sm">
                            {/* Prev */}
                            {currentPage > 1 && (
                                <a href={`/category/${slug}?page=${currentPage - 1}`}
                                    className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors">
                                    ‹ Prev
                                </a>
                            )}

                            {/* Windowed page numbers */}
                            {(() => {
                                const pages: (number | '…')[] = [];
                                const delta = 2;
                                const left = currentPage - delta;
                                const right = currentPage + delta;

                                let last = 0;
                                for (let p = 1; p <= totalPages; p++) {
                                    if (p === 1 || p === totalPages || (p >= left && p <= right)) {
                                        if (last && p - last > 1) pages.push('…');
                                        pages.push(p);
                                        last = p;
                                    }
                                }

                                return pages.map((p, i) =>
                                    p === '…' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-neutral-600 select-none">…</span>
                                    ) : (
                                        <a key={p} href={`/category/${slug}?page=${p}`}
                                            className={`px-3 py-1.5 rounded transition-colors ${
                                                p === currentPage
                                                    ? 'bg-red-600 text-white font-bold'
                                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                            }`}>
                                            {p}
                                        </a>
                                    )
                                );
                            })()}

                            {/* Next */}
                            {currentPage < totalPages && (
                                <a href={`/category/${slug}?page=${currentPage + 1}`}
                                    className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors">
                                    Next ›
                                </a>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <Sidebar />
        </div>
    );
}
