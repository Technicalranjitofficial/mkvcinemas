import Link from 'next/link';
import prisma from '@/lib/prisma';
import StreamPlayer from '@/components/StreamPlayer';
import { Download, Star } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Metadata } from 'next';

// Revalidate every 5 minutes for movie pages
export const revalidate = 300;

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    // We fetch the movie again here but Next.js request deduplication (fetch cache) might not work with Prisma direct calls.
    // However, for metadata it is necessary. In production with a cache layer it's better.
    // Using simple Prisma call here.
    const movie = await prisma.movie.findUnique({ where: { id } });

    if (!movie) {
        return {
            title: 'Movie Not Found - MKVCinemas',
        };
    }

    return {
        title: `Download ${movie.title} (${movie.year}) ${movie.quality} ${movie.audio} - MKVCinemas`,
        description: movie.plot.substring(0, 160),
        openGraph: {
            title: `${movie.title} (${movie.year}) Download`,
            description: movie.plot.substring(0, 200),
            images: [movie.posterUrl],
            type: 'video.movie',
        },
    };
}

export default async function MovieDetails({ params }: Props) {
    const { id } = await params;

    let movie;
    try {
        movie = await prisma.movie.findUnique({
            where: { id }
        });
    } catch (e) {
        console.error(e);
        notFound();
    }

    if (!movie) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movie.title,
        image: movie.posterUrl,
        datePublished: movie.year.toString(),
        description: movie.plot,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: movie.rating,
            bestRating: '10',
            worstRating: '0',
            ratingCount: '1000' // Placeholder as we don't have count yet
        },
        director: {
            '@type': 'Person',
            name: movie.director
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Breadcrumb */}
            <nav className="text-sm text-neutral-400 mb-6">
                <Link href="/" className="hover:text-red-500">Home</Link> &gt;
                <span className="text-white ml-1">{movie.title}</span>
            </nav>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="w-full md:w-64 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full rounded-lg shadow-lg border border-neutral-800"
                    />
                </div>

                <div className="flex-1 space-y-4">
                    <h1 className="text-3xl font-bold text-white">{movie.title} ({movie.year})</h1>

                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-yellow-500 font-bold">
                            <Star size={16} fill="currentColor" /> {movie.rating}/10
                        </span>
                        <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-300">
                            {movie.categories?.join(', ')}
                        </span>
                        <span className="text-neutral-400">{movie.size}</span>
                    </div>

                    <div className="border-t border-b border-neutral-800 py-3 space-y-2 text-sm text-neutral-300">
                        <p><span className="text-neutral-500 w-24 inline-block">Quality:</span> <span className="text-white font-medium">{movie.quality}</span></p>
                        <p><span className="text-neutral-500 w-24 inline-block">Audio:</span> <span className="text-white font-medium">{movie.audio}</span></p>
                        <p><span className="text-neutral-500 w-24 inline-block">Director:</span> {movie.director}</p>
                        <p><span className="text-neutral-500 w-24 inline-block">Cast:</span> {movie.cast}</p>
                    </div>

                    <div className="pt-2">
                        <h3 className="text-white font-bold mb-2">Plot Summary</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                            {movie.plot}
                        </p>
                    </div>
                </div>
            </div>

            {/* Screenshots */}
            {movie.screenshots && movie.screenshots.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-red-600 pl-3">Screenshots</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {movie.screenshots.slice(0, 6).map((src: string, i: number) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={src} alt={`Screenshot ${i + 1}`} className="rounded border border-neutral-800 hover:opacity-80 transition-opacity" />
                        ))}
                    </div>
                </div>
            )}

            {/* Streaming Player */}
            {movie.streamLinks && movie.streamLinks.length > 0 && (
                <div className="mb-10">
                    <StreamPlayer streamLinks={movie.streamLinks as any[]} />
                </div>
            )}

            {/* Download Links */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-green-600 pl-3">Download Links</h2>

                <div className="space-y-4">
                    {movie.downloadLinks?.map((link, idx) => (
                        <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-white">{link.label}</span>
                                <span className="text-xs px-2 py-1 bg-neutral-800 rounded text-neutral-400">External</span>
                            </div>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full text-white py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors ${link.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                                    link.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                                        link.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700 text-black' :
                                            'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                <Download size={18} /> {link.label}
                            </a>
                        </div>
                    ))}

                    {(!movie.downloadLinks || movie.downloadLinks.length === 0) && (
                        <div className="text-neutral-500 text-center">No download links available.</div>
                    )}
                </div>

                <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-center text-sm">
                    Please use VLC Player for better audio confirmation.
                </div>
            </div>
        </div>
    );
}
