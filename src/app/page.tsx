import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';

// Revalidate every 5 minutes (ISR - Incremental Static Regeneration)
export const revalidate = 300;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const itemsPerPage = 12;
  const query = q || '';

  const where = query ? {
    OR: [
      { title: { contains: query, mode: 'insensitive' as const } },
      { cast: { contains: query, mode: 'insensitive' as const } }
    ]
  } : {};

  const movies = await prisma.movie.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
  });

  const totalMovies = await prisma.movie.count({ where });
  const totalPages = Math.ceil(totalMovies / itemsPerPage);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2 flex justify-between items-end">
            <span>{query ? `Search Results for "${query}"` : 'Latest Movies'}</span>
            {/* Pagination Controls */}
            <div className="flex gap-2 text-sm">
              {currentPage > 1 && (
                <a href={`/?page=${currentPage - 1}${query ? `&q=${query}` : ''}`} className="text-red-500 hover:underline">Previous</a>
              )}
              {currentPage < totalPages && (
                <a href={`/?page=${currentPage + 1}${query ? `&q=${query}` : ''}`} className="text-red-500 hover:underline">Next</a>
              )}
            </div>
          </h2>

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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-500">
              <p>No movies found.</p>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar - still static for categories part, but could be dynamic */}
      <Sidebar />
    </div>
  );
}
