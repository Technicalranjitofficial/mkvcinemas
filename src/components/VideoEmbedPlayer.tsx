'use client';

import React, { useState } from 'react';
import { Play, Monitor } from 'lucide-react';
import { EMBED_PROVIDERS, ProviderKey, EmbedQuery } from '@/utils/embedProviders';

interface VideoEmbedPlayerProps {
  media: EmbedQuery;
}

export default function VideoEmbedPlayer({ media }: VideoEmbedPlayerProps) {
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('videasy');

  const getEmbedUrl = (): string => {
    const provider = EMBED_PROVIDERS[activeProvider];
    if (media.type === 'movie') {
      return provider.getMovieUrl(media.id);
    }
    const season = media.season ?? 1;
    const episode = media.episode ?? 1;
    return provider.getTvUrl(media.id, season, episode);
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
      {/* Player Header */}
      <div className="bg-black border-b border-neutral-800 px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-2 text-red-500 font-bold">
          <Play size={18} fill="currentColor" />
          <span className="text-sm">Watch Online</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500">
          <Monitor size={13} />
          <span>HD Stream</span>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Wrapper */}
      <div className="relative w-full aspect-video bg-neutral-950">
        <iframe
          key={`${activeProvider}-${media.id}`}
          src={getEmbedUrl()}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>

      {/* Server Selector */}
      <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Streaming Servers</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            If video buffers or fails, try switching to an alternate mirror below.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(EMBED_PROVIDERS) as ProviderKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveProvider(key)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors duration-200 ${
                activeProvider === key
                  ? 'bg-red-600 text-white shadow-md ring-1 ring-red-500'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {EMBED_PROVIDERS[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-neutral-950 text-xs text-neutral-600 text-center border-t border-neutral-800">
        We do not host any video content. All streams are provided by third-party embed services.
      </div>
    </div>
  );
}
