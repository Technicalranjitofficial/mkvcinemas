import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Revalidate every 5 minutes for category pages
export const revalidate = 300;

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
    const itemsPerPage = 12;

    const categoryName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const where = { categories: { has: categoryName } };

    const [movies, totalMovies] = await Promise.all([
        prisma.movie.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: itemsPerPage,
            skip: (currentPage - 1) * itemsPerPage,
        }),
        prisma.movie.count({ where }),
    ]);

    const totalPages = Math.ceil(totalMovies / itemsPerPage);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2 flex justify-between items-end">
                        <span>Category: <span className="text-red-500">{categoryName}</span></span>
                        <div className="flex gap-2 text-sm">
                            {currentPage > 1 && (
                                <a href={`/category/${slug}?page=${currentPage - 1}`} className="text-red-500 hover:underline">Previous</a>
                            )}
                            {currentPage < totalPages && (
                                <a href={`/category/${slug}?page=${currentPage + 1}`} className="text-red-500 hover:underline">Next</a>
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
                            <p>No movies found in this category.</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center gap-2 text-sm">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <a
                                    key={p}
                                    href={`/category/${slug}?page=${p}`}
                                    className={`px-3 py-1 rounded ${p === currentPage ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                                >
                                    {p}
                                </a>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <Sidebar />
        </div>
    );
}
