'use client';

import React, { useState, useEffect } from 'react';
import { Play, Monitor, ChevronDown, Tv } from 'lucide-react';
import { EMBED_PROVIDERS, ProviderKey, EmbedQuery } from '@/utils/embedProviders';

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

interface VideoEmbedPlayerProps {
  media: EmbedQuery;
  /** Season metadata from TMDB — pass for TV shows to enable episode picker */
  seasons?: Season[];
}


// Fallback seasons when TMDB data not available
const FALLBACK_SEASONS: Season[] = Array.from({ length: 5 }, (_, i) => ({
  season_number: i + 1,
  episode_count: 24,
  name: `Season ${i + 1}`,
}));

export default function VideoEmbedPlayer({ media, seasons = [] }: VideoEmbedPlayerProps) {
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('videasy');
  const [activeSeason, setActiveSeason] = useState(media.season ?? 1);
  const [activeEpisode, setActiveEpisode] = useState(media.episode ?? 1);
  // Prevent SSR — iframe must only render on the client so the embed URL is
  // never baked into server HTML (avoids hydration mismatch and own-page flash)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isTV = media.type === 'tv';
  const resolvedSeasons = isTV ? (seasons.length > 0 ? seasons : FALLBACK_SEASONS) : [];
  const currentSeason = resolvedSeasons.find(s => s.season_number === activeSeason) ?? resolvedSeasons[0];
  const episodeCount = currentSeason?.episode_count ?? 24;

  const getEmbedUrl = (): string => {
    const provider = EMBED_PROVIDERS[activeProvider];
    if (!isTV) return provider.getMovieUrl(media.id);
    return provider.getTvUrl(media.id, activeSeason, activeEpisode);
  };

  const handleSeasonChange = (sNum: number) => {
    setActiveSeason(sNum);
    setActiveEpisode(1); // reset to Ep 1 when season changes
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
      {/* Player Header */}
      <div className="bg-black border-b border-neutral-800 px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-2 text-red-500 font-bold">
          <Play size={18} fill="currentColor" />
          <span className="text-sm">{isTV ? `S${activeSeason} E${activeEpisode}` : 'Watch Online'}</span>
        </div>
        {isTV && (
          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 border border-purple-800/50 px-2 py-0.5 rounded ml-1">
            <Tv size={11} /> Web Series
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500">
          <Monitor size={13} />
          <span>HD Stream</span>
        </div>
      </div>

      {/* ── Season / Episode Selector (TV only) ─────────────────────────── */}
      {isTV && (
        <div className="bg-neutral-950 border-b border-neutral-800 p-3">
          {/* Season row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-neutral-500 shrink-0 font-medium">Season:</span>
            <div className="flex gap-1.5 flex-wrap">
              {resolvedSeasons.map((s) => (
                <button
                  key={s.season_number}
                  onClick={() => handleSeasonChange(s.season_number)}
                  title={s.name}
                  className={`px-3 py-1 text-xs rounded font-semibold transition-all duration-150 ${
                    activeSeason === s.season_number
                      ? 'bg-red-600 text-white shadow ring-1 ring-red-500'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  S{s.season_number}
                </button>
              ))}
            </div>
          </div>

          {/* Episode grid */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-neutral-500 shrink-0 font-medium">Episode:</span>
            <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
                <button
                  key={ep}
                  onClick={() => setActiveEpisode(ep)}
                  className={`min-w-[2.2rem] px-2 py-1 text-xs rounded transition-all duration-150 font-medium ${
                    activeEpisode === ep
                      ? 'bg-red-600 text-white ring-1 ring-red-500'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>

          {/* Now playing indicator */}
          <p className="text-[11px] text-neutral-500 mt-1">
            Now playing: <span className="text-white font-semibold">Season {activeSeason}, Episode {activeEpisode}</span>
            {currentSeason?.name && currentSeason.name !== `Season ${activeSeason}` && (
              <span className="text-neutral-500"> — {currentSeason.name}</span>
            )}
          </p>
        </div>
      )}

      {/* 16:9 Aspect Ratio Wrapper */}
      <div className="relative w-full aspect-video bg-neutral-950">
        {mounted ? (
          <iframe
            key={`${activeProvider}-${media.id}-${activeSeason}-${activeEpisode}`}
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
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
