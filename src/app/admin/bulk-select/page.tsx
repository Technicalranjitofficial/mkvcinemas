'use client';

import { useState, useEffect, useTransition } from 'react';
import { CheckCircle2, Circle, Loader2, Download, Trash2, RefreshCw, Tv } from 'lucide-react';
import { getTrendingMovies, getMoviesByLanguage, getTrendingTv, getTvByLanguage } from '@/app/actions/tmdb';
import type { TmdbTvResult } from '@/app/actions/tmdb';
import { bulkImportFromTmdb, TmdbBulkMovie } from '@/app/actions/movie';
import type { TmdbSearchResult } from '@/app/actions/tmdb';
import { suggestAudio } from '@/utils/tmdbHelpers';

const QUALITY_OPTIONS = ['480p', '720p', '720p HEVC', '1080p', '1080p HEVC', '1080p x265', '2160p 4K', '4K HDR'];
const AUDIO_OPTIONS = ['Hindi', 'English', 'Dual Audio [Hin-Eng]', 'Dual Audio [Hin-Tamil]', 'Dual Audio [Hin-Tel]', 'Multi Audio', 'Tamil', 'Telugu', 'Hindi Dubbed'];

const TABS = [
  { key: 'trending',  label: '🔥 Trending',     isTV: false },
  { key: 'bollywood', label: '🎬 Bollywood',     isTV: false },
  { key: 'hollywood', label: '🎥 Hollywood',     isTV: false },
  { key: 'south',     label: '🌟 South Indian',  isTV: false },
  { key: 'action',    label: '💥 Action',        isTV: false },
  { key: 'webseries', label: '📺 Web Series',    isTV: true  },
  { key: 'hinditv',   label: '📺 Hindi Series',  isTV: true  },
] as const;

type Tab = typeof TABS[number]['key'];

// Language map for movie tabs
const MOVIE_LANG_MAP: Partial<Record<Tab, string>> = {
  bollywood: 'hi',
  hollywood: 'en',
  south: 'ta',
  action: 'te',
};

// Language map for TV tabs
const TV_LANG_MAP: Partial<Record<Tab, string>> = {
  hinditv: 'hi',
};

// Normalize TV results to match movie result shape for unified grid rendering
function normalizeTv(tv: TmdbTvResult): TmdbSearchResult {
  return {
    id: tv.id,
    title: tv.name,
    release_date: tv.first_air_date || '',
    poster_path: tv.poster_path,
    overview: tv.overview,
    vote_average: tv.vote_average,
    original_language: tv.original_language,
  };
}

export default function BulkSelectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [movies, setMovies] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quality, setQuality] = useState('1080p HEVC');
  const [audio, setAudio] = useState('Hindi');
  const [size, setSize] = useState('');
  const [result, setResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMovies = (tab: Tab) => {
    setLoading(true);
    setMovies([]);

    const tabDef = TABS.find(t => t.key === tab)!;

    if (tabDef.isTV) {
      const lang = TV_LANG_MAP[tab];
      const fetcher = lang ? getTvByLanguage(lang) : getTrendingTv();
      fetcher.then((data) => { setMovies(data.map(normalizeTv)); setLoading(false); });
    } else {
      const lang = MOVIE_LANG_MAP[tab];
      const fetcher = lang ? getMoviesByLanguage(lang) : getTrendingMovies();
      fetcher.then((data) => { setMovies(data); setLoading(false); });
    }
  };

  useEffect(() => { loadMovies('trending'); }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelected(new Set());
    loadMovies(tab);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(movies.map(m => m.id)));
  const clearAll = () => setSelected(new Set());

  const handleImport = () => {
    const isTV = TABS.find(t => t.key === activeTab)?.isTV ?? false;
    const toImport: TmdbBulkMovie[] = movies
      .filter(m => selected.has(m.id))
      .map(m => ({
        tmdbId: String(m.id),
        title: m.title,
        year: m.release_date ? new Date(m.release_date).getFullYear() : new Date().getFullYear(),
        rating: Math.round(m.vote_average * 10) / 10,
        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        plot: m.overview || '',
        original_language: m.original_language ?? 'en',
        ...(isTV ? { forceCategories: ['Web Series'] } : {}),
      }));

    startTransition(async () => {
      const res = await bulkImportFromTmdb(toImport, quality, audio, size);
      setResult(res);
      setSelected(new Set());
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Import from TMDB</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {TABS.find(t => t.key === activeTab)?.isTV
              ? '📺 Importing as Web Series — episodes will be playable via the embed player.'
              : 'Select movies and import them to your database in one click.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadMovies(activeTab)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm border border-neutral-800 px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border ${result.errors.length > 0 ? 'bg-yellow-900/20 border-yellow-700' : 'bg-green-900/20 border-green-700'}`}>
          <p className="font-semibold text-white">
            ✅ {result.success} imported &nbsp;·&nbsp; ⏭ {result.skipped} skipped (already exist)
            {result.errors.length > 0 && <span className="text-yellow-400"> &nbsp;·&nbsp; ⚠ {result.errors.length} errors</span>}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs text-yellow-300 space-y-0.5">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setResult(null)} className="mt-2 text-xs text-neutral-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-neutral-800 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${activeTab === tab.key ? 'bg-neutral-800 text-white border-b-2 border-red-500' : 'text-neutral-500 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Select controls */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded">Select All</button>
        <button onClick={clearAll} className="text-xs text-neutral-400 hover:text-white border border-neutral-700 px-2 py-1 rounded flex items-center gap-1"><Trash2 size={11} /> Clear</button>
        <span className="text-xs text-neutral-500">{selected.size} of {movies.length} selected</span>
        {TABS.find(t => t.key === activeTab)?.isTV && (
          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 border border-purple-800 px-2 py-1 rounded">
            <Tv size={11} /> Web Series mode — episodes auto-enabled
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-neutral-500 gap-2">
          <Loader2 size={20} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {movies.map(movie => {
            const isSelected = selected.has(movie.id);
            const isTVCard = TABS.find(t => t.key === activeTab)?.isTV ?? false;
            return (
              <button
                key={movie.id}
                type="button"
                onClick={() => toggleSelect(movie.id)}
                className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-150 text-left ${isSelected ? 'border-red-500 shadow-lg shadow-red-900/40' : 'border-neutral-800 hover:border-neutral-600'}`}
              >
                {movie.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full aspect-2/3 object-cover"
                  />
                ) : (
                  <div className="w-full aspect-2/3 bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs p-2 text-center">{movie.title}</div>
                )}

                {/* Selection overlay */}
                <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-red-600/20' : 'bg-transparent'}`} />

                {/* Checkbox */}
                <div className="absolute top-1.5 right-1.5">
                  {isSelected
                    ? <CheckCircle2 size={18} className="text-red-500 bg-white rounded-full" />
                    : <Circle size={18} className="text-white/50 group-hover:text-white/80" />
                  }
                </div>

                {/* Year badge + TV badge */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                  <span className="bg-black/70 text-neutral-300 text-[9px] px-1 py-0.5 rounded">{movie.release_date?.split('-')[0]}</span>
                  {isTVCard && (
                    <span className="bg-purple-700 text-white text-[9px] px-1 py-0.5 rounded font-bold">TV</span>
                  )}
                </div>

                {/* Title + rating */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-1.5">
                  <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">{movie.title}</p>
                  <p className="text-yellow-400 text-[10px]">⭐ {movie.vote_average?.toFixed(1)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky bottom import bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className={`text-sm font-bold ${selected.size > 0 ? 'text-white' : 'text-neutral-600'}`}>
              {selected.size} {TABS.find(t => t.key === activeTab)?.isTV ? 'series' : 'movie'}{selected.size !== 1 ? 's' : ''} selected
            </span>
          </div>

          <select
            value={quality}
            onChange={e => setQuality(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white"
          >
            {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <select
            value={audio}
            onChange={e => setAudio(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white"
          >
            {AUDIO_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <input
            type="text"
            value={size}
            onChange={e => setSize(e.target.value)}
            placeholder="Size (e.g. 1.4GB)"
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white w-36 placeholder:text-neutral-600"
          />

          <button
            onClick={handleImport}
            disabled={selected.size === 0 || isPending}
            className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isPending ? 'Importing...' : `Import ${selected.size > 0 ? selected.size : ''} ${TABS.find(t => t.key === activeTab)?.isTV ? 'Series' : 'Movies'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
