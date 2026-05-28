import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const revalidate = 300;

const CATEGORIES = [
  { label: 'Bollywood', slug: 'bollywood', color: 'border-orange-500' },
  { label: 'Hollywood', slug: 'hollywood', color: 'border-blue-500' },
  { label: 'South Indian', slug: 'south-indian', color: 'border-green-500' },
  { label: 'Web Series', slug: 'web-series', color: 'border-purple-500' },
  { label: 'Dual Audio', slug: 'dual-audio', color: 'border-yellow-500' },
  { label: 'Action', slug: 'action', color: 'border-red-500' },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const itemsPerPage = 12;
  const query = q || '';

  // --- Search mode ---
  if (query) {
    const where = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { cast: { contains: query, mode: 'insensitive' as const } },
      ],
    };
    const [movies, totalMovies] = await Promise.all([
      prisma.movie.findMany({ where, orderBy: { createdAt: 'desc' }, take: itemsPerPage, skip: (currentPage - 1) * itemsPerPage }),
      prisma.movie.count({ where }),
    ]);
    const totalPages = Math.ceil(totalMovies / itemsPerPage);

    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2 flex justify-between items-end">
            <span>Search Results for &quot;{query}&quot;</span>
            <div className="flex gap-2 text-sm">
              {currentPage > 1 && <a href={`/?page=${currentPage - 1}&q=${query}`} className="text-red-500 hover:underline">Previous</a>}
              {currentPage < totalPages && <a href={`/?page=${currentPage + 1}&q=${query}`} className="text-red-500 hover:underline">Next</a>}
            </div>
          </h2>
          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {movies.map((m) => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-500"><p>No movies found.</p></div>
          )}
        </div>
        <Sidebar />
      </div>
    );
  }

  // --- Homepage mode: latest + category sections ---
  const [latestMovies, ...categoryMovieLists] = await Promise.all([
    prisma.movie.findMany({ orderBy: { createdAt: 'desc' }, take: itemsPerPage, skip: (currentPage - 1) * itemsPerPage }),
    ...CATEGORIES.map((cat) =>
      prisma.movie.findMany({
        where: { categories: { has: cat.label } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
    ),
  ]);

  const totalMovies = await prisma.movie.count({});
  const totalPages = Math.ceil(totalMovies / itemsPerPage);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-12">

        {/* Latest Movies */}
        <section>
          <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-2">
            <h2 className="text-xl font-bold text-white">Latest Movies</h2>
            <div className="flex gap-3 text-sm">
              {currentPage > 1 && <a href={`/?page=${currentPage - 1}`} className="text-red-500 hover:underline">Previous</a>}
              {currentPage < totalPages && <a href={`/?page=${currentPage + 1}`} className="text-red-500 hover:underline">Next</a>}
            </div>
          </div>
          {latestMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {latestMovies.map((m) => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-500"><p>No movies yet.</p></div>
          )}
        </section>

        {/* Category Sections */}
        {CATEGORIES.map((cat, idx) => {
          const movies = categoryMovieLists[idx];
          if (!movies || movies.length === 0) return null;
          return (
            <section key={cat.slug}>
              <div className={`flex justify-between items-center mb-5 border-b-2 ${cat.color} pb-2`}>
                <h2 className="text-xl font-bold text-white">{cat.label}</h2>
                <Link href={`/category/${cat.slug}`} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 transition-colors">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies.map((m) => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} quality={m.quality} audio={m.audio} />)}
              </div>
            </section>
          );
        })}

      </div>
      <Sidebar />
    </div>
  );
}
