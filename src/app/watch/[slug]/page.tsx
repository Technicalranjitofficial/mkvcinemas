import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import VideoEmbedPlayer from '@/components/VideoEmbedPlayer';
import StreamPlayer from '@/components/StreamPlayer';
import { Metadata } from 'next';
import { getTmdbTvSeasons } from '@/app/actions/tmdb';
import { extractMovieId, movieSlug } from '@/lib/slug';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });
  return movies.map((m) => ({ slug: movieSlug(m.title, m.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = extractMovieId(slug);
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) return { title: 'Watch - MKVCinemas' };

  const canonical = `https://mkvcinemas.world/watch/${movieSlug(movie.title, movie.id)}`;
  const title = `Watch ${movie.title} (${movie.year}) Online Free in HD - MKVCinemas`;
  const description = `Watch ${movie.title} (${movie.year}) online free in ${movie.quality} ${movie.audio}. ${movie.plot.substring(0, 120)}`;

  return {
    title,
    description,
    keywords: [
      `watch ${movie.title} online`,
      `${movie.title} stream free`,
      `${movie.title} ${movie.year} watch online`,
      `${movie.title} full movie online`,
      `${movie.title} HD stream`,
      movie.title,
      `${movie.title} ${movie.year}`,
      'watch movies online free',
      'MKVCinemas stream',
      ...(movie.categories ?? []),
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: [{ url: movie.posterUrl, width: 500, height: 750, alt: movie.title }],
      url: canonical,
      type: 'video.movie',
      siteName: 'MKVCinemas',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [movie.posterUrl],
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const id = extractMovieId(slug);

  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) notFound();

  const hasEmbedPlayer = Boolean(movie.tmdbId);
  const hasStreamLinks = movie.streamLinks && movie.streamLinks.length > 0;
  const isTV = movie.categories?.includes('Web Series') ?? false;
  const tvSeasons = isTV && movie.tmdbId ? await getTmdbTvSeasons(movie.tmdbId) : [];

  const canonicalUrl = `https://mkvcinemas.world/watch/${movieSlug(movie.title, movie.id)}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: `${movie.title} (${movie.year})`,
      description: movie.plot,
      thumbnailUrl: movie.posterUrl,
      uploadDate: new Date(movie.createdAt).toISOString(),
      embedUrl: canonicalUrl,
      contentUrl: canonicalUrl,
      ...(movie.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: movie.rating,
          bestRating: '10',
          worstRating: '0',
          ratingCount: '1000',
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mkvcinemas.world' },
        { '@type': 'ListItem', position: 2, name: movie.title, item: canonicalUrl },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-400 mb-5">
        <Link href="/" className="hover:text-red-500 transition-colors">Home</Link>
        <span className="mx-1.5 text-neutral-600">/</span>
        <span className="text-white">{movie.title}</span>
      </nav>

      {/* Movie Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-5">

          {/* Poster — explicit dimensions guarantee portrait on every screen size */}
          <div className="w-36 h-54 sm:w-44 sm:h-66 shrink-0 relative overflow-hidden rounded-lg border border-neutral-700 shadow-lg">
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 144px, 176px"
              className="object-cover"
              priority
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {movie.title}
              </h1>
              <p className="text-neutral-400 text-base mt-0.5">{movie.year}</p>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded">
                <Star size={13} fill="currentColor" /> {movie.rating}/10
              </span>
              <span className="bg-red-900/60 text-red-300 text-xs font-semibold px-2 py-0.5 rounded border border-red-800">
                {movie.quality}
              </span>
              <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded border border-neutral-700">
                {movie.audio}
              </span>
              {movie.size && movie.size !== 'N/A' && (
                <span className="text-neutral-500 text-xs">{movie.size}</span>
              )}
            </div>

            {/* Meta grid */}
            <div className="text-sm text-neutral-300 space-y-1.5">
              {movie.director && (
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-16 shrink-0">Director</span>
                  <span>{movie.director}</span>
                </div>
              )}
              {movie.cast && (
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-16 shrink-0">Cast</span>
                  <span className="line-clamp-2">{movie.cast}</span>
                </div>
              )}
              {movie.categories && movie.categories.length > 0 && (
                <div className="flex gap-2 items-start">
                  <span className="text-neutral-500 w-16 shrink-0">Genre</span>
                  <div className="flex flex-wrap gap-1">
                    {movie.categories.map((cat) => (
                      <span key={cat} className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded border border-neutral-700">{cat}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plot */}
            <p className="text-neutral-400 text-sm leading-relaxed line-clamp-4 sm:line-clamp-none">
              {movie.plot}
            </p>
          </div>
        </div>
      </div>

      {/* Embed Player */}
      {hasEmbedPlayer && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-white mb-3 border-l-4 border-red-600 pl-3">
            Watch Online
          </h2>
          <VideoEmbedPlayer
            media={{ id: movie.tmdbId!, type: isTV ? 'tv' : 'movie' }}
            seasons={tvSeasons}
          />
        </div>
      )}

      {/* Manual Stream Links */}
      {hasStreamLinks && (
        <div className="mb-8">
          {hasEmbedPlayer && (
            <h2 className="text-base font-bold text-white mb-3 border-l-4 border-neutral-600 pl-3">
              Additional Servers
            </h2>
          )}
          <StreamPlayer streamLinks={movie.streamLinks as { server: string; url: string }[]} />
        </div>
      )}

      {/* No streams */}
      {!hasEmbedPlayer && !hasStreamLinks && (
        <div className="text-center py-16 text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-900/50 mb-8">
          <p className="text-lg mb-1">No streams available yet.</p>
          <p className="text-sm">Check back soon.</p>
        </div>
      )}

      {/* Screenshots */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 border-l-4 border-red-600 pl-3">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {movie.screenshots.slice(0, 6).map((src: string, i: number) => (
              <div key={i} className="relative aspect-video overflow-hidden rounded border border-neutral-800">
                <Image
                  src={src}
                  alt={`${movie.title} Screenshot ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover hover:opacity-80 transition-opacity"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
