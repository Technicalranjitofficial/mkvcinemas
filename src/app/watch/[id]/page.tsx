import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ArrowLeft } from 'lucide-react';
import prisma from '@/lib/prisma';
import VideoEmbedPlayer from '@/components/VideoEmbedPlayer';
import StreamPlayer from '@/components/StreamPlayer';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) return { title: 'Watch - MKVCinemas' };
  return {
    title: `Watch ${movie.title} (${movie.year}) Online - MKVCinemas`,
    description: `Stream ${movie.title} online in HD. ${movie.plot.substring(0, 120)}`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;

  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) notFound();

  const hasEmbedPlayer = Boolean(movie.tmdbId);
  const hasStreamLinks = movie.streamLinks && movie.streamLinks.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-red-500">Home</Link>
        <span>&gt;</span>
        <Link href={`/movie/${movie.id}`} className="hover:text-red-500 truncate max-w-xs">
          {movie.title}
        </Link>
        <span>&gt;</span>
        <span className="text-white">Watch</span>
      </nav>

      {/* Movie Info Bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-14 h-20 object-cover rounded border border-neutral-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">
            {movie.title} <span className="text-neutral-400 font-normal">({movie.year})</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm">
            <span className="flex items-center gap-1 text-yellow-500 font-semibold">
              <Star size={13} fill="currentColor" /> {movie.rating}/10
            </span>
            <span className="bg-red-900/50 text-red-400 text-xs px-2 py-0.5 rounded border border-red-800">
              {movie.quality}
            </span>
            <span className="text-neutral-500 text-xs">{movie.audio}</span>
          </div>
          <div className="mt-1">
            <Link
              href={`/movie/${movie.id}`}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Back to movie details
            </Link>
          </div>
        </div>
      </div>

      {/* Embed Player (TMDb-based multi-server) */}
      {hasEmbedPlayer && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-white mb-3 border-l-4 border-red-600 pl-3">
            Online Streaming
          </h2>
          <VideoEmbedPlayer media={{ id: movie.tmdbId!, type: 'movie' }} />
        </div>
      )}

      {/* Fallback: Manual Stream Links */}
      {hasStreamLinks && (
        <div className={hasEmbedPlayer ? 'mb-8' : 'mb-8'}>
          {hasEmbedPlayer && (
            <h2 className="text-base font-bold text-white mb-3 border-l-4 border-neutral-600 pl-3">
              Additional Servers
            </h2>
          )}
          <StreamPlayer streamLinks={movie.streamLinks as { server: string; url: string }[]} />
        </div>
      )}

      {/* No streams available */}
      {!hasEmbedPlayer && !hasStreamLinks && (
        <div className="text-center py-20 text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-900/50">
          <p className="text-lg mb-2">No streams available yet.</p>
          <p className="text-sm">Check back later or download the movie below.</p>
          <Link
            href={`/movie/${movie.id}`}
            className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            <ArrowLeft size={16} /> View Download Links
          </Link>
        </div>
      )}
    </div>
  );
}
