import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { preload } from 'react-dom';

export const revalidate = 300;

const HOME_METADATA: Metadata = {
  title: 'MKVCinemas - Download Movies & Web Series in HD | mkvcinemas.world',
  description: 'MKVCinemas – Download latest Bollywood, Hollywood, South Indian movies and Web Series in 480p, 720p, 1080p 4K quality. Dual Audio, Hindi Dubbed, Free and Fast downloads.',
  keywords: [
    'MKVCinemas', 'mkvcinemas.world', 'mkv cinemas',
    'download movies free', 'bollywood movies download', 'hollywood movies download',
    'south indian movies hindi dubbed', 'dual audio movies', 'web series download',
    '480p movies', '720p movies', '1080p movies', '4K movies download',
    'hindi dubbed movies', 'latest movies 2025', 'latest movies 2026', 'new movies download',
    'free movies HD', 'movie download site',
  ],
  alternates: { canonical: 'https://mkvcinemas.world' },
  openGraph: {
    title: 'MKVCinemas - Download Movies & Web Series in HD',
    description: 'Download latest Bollywood, Hollywood, South Indian movies and Web Series in HD quality. Free and Fast at mkvcinemas.world.',
    url: 'https://mkvcinemas.world',
    siteName: 'MKVCinemas',
    type: 'website',
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Search results — keep out of index (thin/ever-changing content)
  if (q) {
    return {
      title: `Search: "${q}" – MKVCinemas`,
      description: `Search results for "${q}" on MKVCinemas.`,
      robots: { index: false, follow: true },
      alternates: { canonical: 'https://mkvcinemas.world' },
    };
  }

  // Paginated homepage — canonical points to page 1, page itself is noindex
  if (currentPage > 1) {
    return {
      ...HOME_METADATA,
      title: `MKVCinemas – Movies Page ${currentPage} | mkvcinemas.world`,
      robots: { index: false, follow: true },
      alternates: { canonical: 'https://mkvcinemas.world' },
    };
  }

  return HOME_METADATA;
}

const CATEGORIES = [
  { label: 'Bollywood',    slug: 'bollywood',    color: 'border-orange-500' },
  { label: 'Hollywood',    slug: 'hollywood',    color: 'border-blue-500'   },
  { label: 'South Indian', slug: 'south-indian', color: 'border-green-500'  },
  { label: 'Web Series',   slug: 'web-series',   color: 'border-purple-500' },
  { label: 'Dual Audio',   slug: 'dual-audio',   color: 'border-yellow-500' },
  { label: 'Action',       slug: 'action',       color: 'border-red-500'    },
];

// Only 6 fields needed for a card — keeps each query lean
const cardSelect = { id: true, title: true, year: true, posterUrl: true, quality: true, audio: true } as const;
const ITEMS_PER_PAGE = 12;

// ── Streamed latest-movies section ────────────────────────────────────────
async function LatestMoviesSection({ page }: { page: number }) {
  const [movies, totalMovies] = await Promise.all([
    prisma.movie.findMany({ select: cardSelect, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], take: ITEMS_PER_PAGE, skip: (page - 1) * ITEMS_PER_PAGE }),
    prisma.movie.count({}),
  ]);
  const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

  return (
    <section>
      <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-2">
        <h2 className="text-xl font-bold text-white">Latest Movies</h2>
        <div className="flex gap-3 text-sm">
          {page > 1 && <a href={`/?page=${page - 1}`} className="text-red-500 hover:underline">Previous</a>}
          {page < totalPages && <a href={`/?page=${page + 1}`} className="text-red-500 hover:underline">Next</a>}
        </div>
      </div>
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((m, i) => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} priority={i < 4} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500"><p>No movies yet.</p></div>
      )}
    </section>
  );
}

function LatestMoviesSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-2">
        <div className="h-6 bg-neutral-800 rounded w-36" />
        <div className="h-4 bg-neutral-800 rounded w-14" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <div key={i}>
            <div className="aspect-2/3 bg-neutral-800 rounded-md mb-2" />
            <div className="h-3 bg-neutral-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Streamed search-results section ──────────────────────────────────────
async function SearchResultsSection({ query, page }: { query: string; page: number }) {
  const where = {
    OR: [
      { title: { contains: query, mode: 'insensitive' as const } },
      { cast:  { contains: query, mode: 'insensitive' as const } },
    ],
  };
  const [movies, totalMovies] = await Promise.all([
    prisma.movie.findMany({ select: cardSelect, where, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], take: ITEMS_PER_PAGE, skip: (page - 1) * ITEMS_PER_PAGE }),
    prisma.movie.count({ where }),
  ]);
  const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

  return (
    <>
      <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2 flex justify-between items-end">
        <span>Search Results for &quot;{query}&quot;</span>
        <div className="flex gap-2 text-sm">
          {page > 1 && <a href={`/?page=${page - 1}&q=${query}`} className="text-red-500 hover:underline">Previous</a>}
          {page < totalPages && <a href={`/?page=${page + 1}&q=${query}`} className="text-red-500 hover:underline">Next</a>}
        </div>
      </h2>
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((m, i) => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} priority={i < 4} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500"><p>No movies found.</p></div>
      )}
    </>
  );
}

function SearchResultsSkeleton({ query }: { query: string }) {
  return (
    <section className="animate-pulse">
      <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-2">
        <div className="h-6 bg-neutral-800 rounded w-64" />
      </div>
      <p className="text-neutral-500 text-sm mb-4">Searching for &quot;{query}&quot;…</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-2/3 bg-neutral-800 rounded-md mb-2" />
            <div className="h-3 bg-neutral-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Streamed category section (renders independently via Suspense) ─────────
async function CategorySection({ cat }: { cat: (typeof CATEGORIES)[number] }) {
  const movies = await prisma.movie.findMany({
    select: cardSelect,
    where: { categories: { has: cat.label } },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    take: 6,
  });
  if (!movies.length) return null;
  return (
    <section>
      <div className={`flex justify-between items-center mb-5 border-b-2 ${cat.color} pb-2`}>
        <h2 className="text-xl font-bold text-white">{cat.label}</h2>
        <Link href={`/category/${cat.slug}`} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors">
          View All <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((m) => (
          <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} />
        ))}
      </div>
    </section>
  );
}

// Skeleton shown while a CategorySection is loading
function CategorySkeleton({ color }: { color: string }) {
  return (
    <section className="animate-pulse">
      <div className={`flex justify-between items-center mb-5 border-b-2 ${color} pb-2`}>
        <div className="h-6 bg-neutral-800 rounded w-28" />
        <div className="h-4 bg-neutral-800 rounded w-14" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-2/3 bg-neutral-800 rounded-md mb-2" />
            <div className="h-3 bg-neutral-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Route handler — zero DB work here, shell streams immediately ──────────
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const query = q || '';

  // --- Search mode ---
  if (query) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Suspense fallback={<SearchResultsSkeleton query={query} />}>
            <SearchResultsSection query={query} page={currentPage} />
          </Suspense>
        </div>
        <Sidebar />
      </div>
    );
  }

  // --- Homepage mode: all sections stream in independently via Suspense ---
  // Preload the LCP image (first poster) early so the browser starts fetching
  // it before the LatestMoviesSection Suspense boundary resolves.
  const lcpMovie = await prisma.movie.findFirst({
    select: { posterUrl: true },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
  });
  if (lcpMovie?.posterUrl) {
    preload(lcpMovie.posterUrl, { as: 'image', fetchPriority: 'high' });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-12">

        {/* Latest Movies — streams in as soon as its query resolves */}
        <Suspense fallback={<LatestMoviesSkeleton />}>
          <LatestMoviesSection page={currentPage} />
        </Suspense>

        {/* Category Sections — each streams in independently */}
        {CATEGORIES.map((cat) => (
          <Suspense key={cat.slug} fallback={<CategorySkeleton color={cat.color} />}>
            <CategorySection cat={cat} />
          </Suspense>
        ))}

      </div>
      <Sidebar />
    </div>
  );
}
