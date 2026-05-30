'use client';

import dynamic from 'next/dynamic';
import type { EmbedQuery } from '@/utils/embedProviders';

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

// ssr: false is only allowed inside a Client Component — hence this wrapper.
// The watch page (Server Component) imports this file instead of VideoEmbedPlayer directly.
const VideoEmbedPlayer = dynamic(() => import('./VideoEmbedPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
      <div className="relative w-full aspect-video bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  ),
});

export default function VideoEmbedPlayerWrapper({
  media,
  seasons,
}: {
  media: EmbedQuery;
  seasons?: Season[];
}) {
  return <VideoEmbedPlayer media={media} seasons={seasons} />;
}
