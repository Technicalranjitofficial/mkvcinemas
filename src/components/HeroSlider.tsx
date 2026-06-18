'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Star, Volume2, VolumeX } from 'lucide-react';
import { movieSlug } from '@/lib/slug';

export interface HeroMovie {
  id: string;
  title: string;
  year: number;
  quality: string;
  audio: string;
  plot: string;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  categories: string[];
  trailerKey: string | null;
}

export default function HeroSlider({ movies }: { movies: HeroMovie[] }) {
  const [current, setCurrent]     = useState(0);
  const [hovered, setHovered]     = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted]         = useState(true);
  const autoTimerRef              = useRef<ReturnType<typeof setInterval>>(undefined);
  const videoTimerRef             = useRef<ReturnType<typeof setTimeout>>(undefined);

  const goTo = useCallback((i: number) => {
    setShowVideo(false);
    clearTimeout(videoTimerRef.current);
    setCurrent((i + movies.length) % movies.length);
  }, [movies.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance only when NOT hovering
  useEffect(() => {
    if (hovered) return;
    autoTimerRef.current = setInterval(next, 5500);
    return () => clearInterval(autoTimerRef.current);
  }, [next, hovered]);

  // Video: starts 2s after hover begins, stops instantly on mouse-leave
  useEffect(() => {
    clearTimeout(videoTimerRef.current);
    if (hovered && movies[current]?.trailerKey) {
      videoTimerRef.current = setTimeout(() => setShowVideo(true), 2000);
    } else {
      setShowVideo(false);
    }
    return () => clearTimeout(videoTimerRef.current);
  }, [hovered, current, movies]);

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => {
    setHovered(false);
    setShowVideo(false);
    clearTimeout(videoTimerRef.current);
  };

  if (!movies.length) return null;

  const m = movies[current];
  const videoSrc = m.trailerKey
    ? `https://www.youtube.com/embed/${m.trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&disablekb=1&fs=0&playsinline=1&modestbranding=1&loop=1&playlist=${m.trailerKey}&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=0`
    : null;

  return (
    <div
      className="relative w-full h-100 sm:h-120 md:h-135 overflow-hidden bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Backdrop images (all pre-rendered, cross-fade via opacity) ── */}
      {movies.map((movie, i) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            className="object-cover object-top"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── YouTube trailer (renders over backdrop when ready) ── */}
      {showVideo && videoSrc && (
        <div className="absolute inset-0 z-15 transition-opacity duration-700 opacity-100">
          <iframe
            key={`${m.trailerKey}-${muted}`}
            src={videoSrc}
            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title={`${m.title} trailer`}
          />
          {/* Transparent blocker — prevents YouTube controls from ever showing */}
          <div className="absolute inset-0 z-10" />
        </div>
      )}

      {/* ── Gradients ── */}
      <div className="absolute inset-0 z-20 bg-linear-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 z-20 bg-linear-to-t from-black via-black/20 to-transparent" />

      {/* ── Content overlay ── */}
      <div className="absolute inset-0 z-30 flex items-end pb-14 px-5 sm:px-10 md:px-14">
        <div className="max-w-xl w-full">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {m.categories.slice(0, 3).map(cat => (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase().replace(/ /g, '-').replace('+', '-plus')}`}
                className="text-[10px] font-bold uppercase tracking-wide bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-sm transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-xl line-clamp-2">
            {m.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs sm:text-sm">
            {m.rating > 0 && (
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star size={13} fill="currentColor" />
                {m.rating.toFixed(1)}
              </span>
            )}
            <span className="text-neutral-400">{m.year}</span>
            <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-sm">{m.quality}</span>
            <span className="bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded-sm">
              {m.audio.length > 12 ? m.audio.split(' ').slice(0, 2).join(' ') : m.audio}
            </span>
            {showVideo && m.trailerKey && (
              <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold animate-pulse">
                ▶ Trailer Playing
              </span>
            )}
          </div>

          {/* Plot */}
          <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2 mb-5 max-w-md">
            {m.plot}
          </p>

          {/* CTA */}
          <Link
            href={`/watch/${movieSlug(m.title, m.id)}`}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-md transition-all text-sm shadow-lg shadow-red-900/40"
          >
            <Play size={15} fill="currentColor" /> Watch Now
          </Link>
        </div>
      </div>

      {/* ── Mute / Unmute button (only when trailer is playing) ── */}
      {showVideo && m.trailerKey && (
        <button
          onClick={() => setMuted(v => !v)}
          className="absolute bottom-16 right-4 sm:right-6 z-40 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-colors backdrop-blur-sm border border-white/20"
          aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      {/* ── Progress bar (only while auto-advancing, not on hover) ── */}
      {!hovered && (
        <div className="absolute bottom-0 left-0 right-0 z-40 h-0.5 bg-white/10">
          <div
            key={current}
            className="h-full bg-red-500 animate-[heroProgress_5.5s_linear_forwards]"
          />
        </div>
      )}

      {/* ── Prev / Next arrows ── */}
      <button
        onClick={prev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 sm:p-2 transition-colors backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 sm:p-2 transition-colors backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Dot / pill indicators ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-6 h-2 bg-red-500' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
