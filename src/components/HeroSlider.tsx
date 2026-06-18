'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
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
}

export default function HeroSlider({ movies }: { movies: HeroMovie[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const goTo = useCallback((i: number) => {
    setCurrent((i + movies.length) % movies.length);
  }, [movies.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5500);
    return () => clearInterval(timerRef.current);
  }, [next, paused]);

  if (!movies.length) return null;

  const m = movies[current];

  return (
    <div
      className="relative w-full h-100 sm:h-120 md:h-135 overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrop stack — all rendered, transitions via opacity */}
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

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-20 bg-linear-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 z-20 bg-linear-to-t from-black via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 z-30 flex items-end pb-14 px-5 sm:px-10 md:px-14">
        <div className="max-w-xl w-full">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {m.categories.filter(c => c !== 'Bollywood' || m.categories.length === 1).slice(0, 3).map(cat => (
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
            <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-sm">
              {m.quality}
            </span>
            <span className="bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded-sm">
              {m.audio.length > 12 ? m.audio.split(' ').slice(0, 2).join(' ') : m.audio}
            </span>
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

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 z-40 h-0.5 bg-white/10">
          <div
            key={current}
            className="h-full bg-red-500 animate-[heroProgress_5.5s_linear_forwards]"
          />
        </div>
      )}

      {/* Prev / Next arrows */}
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

      {/* Dot / pill indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-red-500'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
