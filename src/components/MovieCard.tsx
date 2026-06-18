'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { movieSlug } from '@/lib/slug';

interface MovieCardProps {
    id: string;
    title: string;
    posterUrl: string;
    quality: string;
    audio: string;
    year: number;
    tmdbId?: string | null;
    priority?: boolean;
}

function getAudioBadge(audio: string): { label: string; color: string } {
    const a = audio.toLowerCase();
    if (a.includes('dual'))     return { label: 'Dual Audio',   color: 'bg-yellow-500 text-black' };
    if (a.includes('multi'))    return { label: 'Multi Audio',  color: 'bg-purple-600 text-white' };
    if (a.includes('tamil'))    return { label: 'Tamil',        color: 'bg-green-600 text-white'  };
    if (a.includes('telugu'))   return { label: 'Telugu',       color: 'bg-cyan-600 text-white'   };
    if (a.includes('malayalam'))return { label: 'Malayalam',    color: 'bg-teal-600 text-white'   };
    if (a.includes('hindi'))    return { label: 'Hindi',        color: 'bg-orange-500 text-white' };
    if (a.includes('english'))  return { label: 'English',      color: 'bg-blue-600 text-white'   };
    if (a.includes('kannada'))  return { label: 'Kannada',      color: 'bg-red-600 text-white'    };
    if (a.includes('bengali'))  return { label: 'Bengali',      color: 'bg-pink-600 text-white'   };
    return { label: audio.split(' ')[0], color: 'bg-neutral-600 text-white' };
}

export default function MovieCard({
    id, title, posterUrl, quality, audio, year, tmdbId, priority = false,
}: MovieCardProps) {
    const audioBadge = getAudioBadge(audio);

    // undefined = not yet fetched, null = no trailer, string = YouTube key
    const [trailerKey, setTrailerKey]   = useState<string | null | undefined>(undefined);
    const [hovered, setHovered]         = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const hoverTimerRef                 = useRef<ReturnType<typeof setTimeout>>(undefined);
    const videoTimerRef                 = useRef<ReturnType<typeof setTimeout>>(undefined);
    const fetchedRef                    = useRef(false);

    const handleMouseEnter = useCallback(() => {
        hoverTimerRef.current = setTimeout(() => {
            setHovered(true);
            if (!fetchedRef.current && tmdbId) {
                fetchedRef.current = true;
                fetch(`/api/trailer/${tmdbId}`)
                    .then(r => r.json())
                    .then(d => {
                        const key = d.key ?? null;
                        setTrailerKey(key);
                        if (key) videoTimerRef.current = setTimeout(() => setShowTrailer(true), 500);
                    })
                    .catch(() => setTrailerKey(null));
            } else if (trailerKey) {
                videoTimerRef.current = setTimeout(() => setShowTrailer(true), 300);
            }
        }, 600);
    }, [tmdbId, trailerKey]);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimerRef.current);
        clearTimeout(videoTimerRef.current);
        setHovered(false);
        setShowTrailer(false);
    }, []);

    return (
        <Link
            href={`/watch/${movieSlug(title, id)}`}
            className={`group block bg-neutral-900 rounded-md overflow-hidden transition-all duration-200 ${
                hovered
                    ? 'border border-neutral-500 shadow-xl shadow-black/60 scale-[1.03] z-10 relative'
                    : 'border border-neutral-800'
            }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative aspect-2/3 overflow-hidden bg-neutral-900">

                {/* Poster */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${showTrailer ? 'opacity-0' : 'opacity-100'}`}>
                    {posterUrl ? (
                        <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                            className="object-cover"
                            priority={priority}
                            loading={priority ? 'eager' : 'lazy'}
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-neutral-500 text-xs">No Image</span>
                        </div>
                    )}
                </div>

                {/* Trailer iframe — muted, all controls hidden */}
                {showTrailer && trailerKey && (
                    <div className="absolute inset-0">
                        <iframe
                            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
                            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            allow="autoplay; encrypted-media"
                            title={title}
                        />
                        {/* Transparent overlay blocks all YouTube UI */}
                        <div className="absolute inset-0 z-10" />
                    </div>
                )}

                {/* Badges — always on top */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                    <span className={`${audioBadge.color} text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase`}>
                        {audioBadge.label}
                    </span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        {quality}
                    </span>
                </div>

                <div className="absolute bottom-2 right-2 z-20">
                    <span className="bg-black/70 text-neutral-300 text-[10px] px-1.5 py-0.5 rounded-sm">
                        {year}
                    </span>
                </div>
            </div>

            <div className="p-2.5">
                <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 group-hover:text-red-500 transition-colors leading-tight" title={title}>
                    {title}
                </h3>
                <p className="mt-1 text-[11px] text-neutral-500 truncate">{audio}</p>
            </div>
        </Link>
    );
}
