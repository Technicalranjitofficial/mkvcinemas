import MovieCard from '@/components/MovieCard';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Revalidate every 5 minutes for category pages
export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Format slug to match DB category (simple matching)
    // e.g. "bollywood" -> "Bollywood"
    // "web-series" -> "Web Series"
    const categoryName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const movies = await prisma.movie.findMany({
        where: {
            categories: {
                has: categoryName // Array filtering in Mongo/Prisma
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2">
                        Category: <span className="text-red-500">{categoryName}</span>
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
                </section>
            </div>

            <Sidebar />
        </div>
    );
}
