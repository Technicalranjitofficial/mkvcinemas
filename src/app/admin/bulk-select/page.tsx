'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import {
  CheckCircle2, Circle, Loader2, Download, Trash2,
  RefreshCw, Tv, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  discoverMoviesPaged, getTrendingMoviesPaged,
  discoverTvPaged, getTrendingTvPaged,
} from '@/app/actions/tmdb';
import type { TmdbTvResult, TmdbSearchResult } from '@/app/actions/tmdb';
import { bulkImportFromTmdb, getExistingTmdbIds } from '@/app/actions/movie';
import type { TmdbBulkMovie } from '@/app/actions/movie';

const QUALITY_OPTIONS = ['480p', '720p', '720p HEVC', '1080p', '1080p HEVC', '1080p x265', '2160p 4K', '4K HDR'];
const AUDIO_OPTIONS   = ['Hindi', 'English', 'Dual Audio [Hin-Eng]', 'Dual Audio [Hin-Tamil]', 'Dual Audio [Hin-Tel]', 'Multi Audio', 'Tamil', 'Telugu', 'Hindi Dubbed'];

const MOVIE_GENRES = [
  { id: 0,     name: 'All Genres' },
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 18,    name: 'Drama' },
  { id: 14,    name: 'Fantasy' },
  { id: 27,    name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
];

const TV_GENRES = [
  { id: 0,     name: 'All Genres' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 9648,  name: 'Mystery' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10768, name: 'War & Politics' },
];

const PER_PAGE_OPTIONS = [20, 40, 60];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [0, ...Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i)];

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

const MOVIE_LANG_MAP: Partial<Record<Tab, string>> = {
  bollywood: 'hi',
  hollywood: 'en',
  south:     'ta',
  action:    'te',
};

const TV_LANG_MAP: Partial<Record<Tab, string>> = {
  hinditv: 'hi',
};

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
  const [activeTab,  setActiveTab]  = useState<Tab>('trending');
  const [movies,     setMovies]     = useState<TmdbSearchResult[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [quality,    setQuality]    = useState('1080p HEVC');
  const [audio,      setAudio]      = useState('Hindi');
  const [size,       setSize]       = useState('');
  const [result,     setResult]     = useState<{ success: number; skipped: number; errors: string[] } | null>(null);
  const [isPending,  startTransition] = useTransition();

  const [year,            setYear]            = useState(0);
  const [genreId,         setGenreId]         = useState(0);
  const [perPage,         setPerPage]         = useState(20);
  const [uiPage,          setUiPage]          = useState(1);
  const [totalUiPages,    setTotalUiPages]    = useState(1);
  const [notImportedOnly, setNotImportedOnly] = useState(false);
  const [existingIds,     setExistingIds]     = useState<Set<string>>(new Set());
  // Bumping this forces a re-fetch even when all other deps stay the same (e.g. after import on page 1)
  const [refreshKey,      setRefreshKey]      = useState(0);

  useEffect(() => {
    getExistingTmdbIds().then(ids => setExistingIds(new Set(ids)));
  }, []);

  const loadMovies = useCallback(async (tab: Tab, pg: number, yr: number, genre: number, pp: number) => {
    setLoading(true);
    setMovies([]);

    const tabDef        = TABS.find(t => t.key === tab)!;
    const pagesPerUi    = pp / 20;
    const tmdbStartPage = (pg - 1) * pagesPerUi + 1;
    const yearParam     = yr    > 0 ? yr    : undefined;
    const genreParam    = genre > 0 ? genre : undefined;

    type PagedResult = { results: TmdbSearchResult[]; totalPages: number; totalResults: number };

    try {
      const fetches: Promise<PagedResult>[] = [];

      for (let i = 0; i < pagesPerUi; i++) {
        const tmdbPage = tmdbStartPage + i;
        if (tabDef.isTV) {
          const lang = TV_LANG_MAP[tab];
          fetches.push(
            (lang
              ? discoverTvPaged(lang, { page: tmdbPage, year: yearParam, genreId: genreParam })
              : getTrendingTvPaged({ page: tmdbPage })
            ).then(r => ({ ...r, results: r.results.map(normalizeTv) }))
          );
        } else {
          const lang = MOVIE_LANG_MAP[tab];
          fetches.push(
            lang
              ? discoverMoviesPaged(lang, { page: tmdbPage, year: yearParam, genreId: genreParam })
              : getTrendingMoviesPaged({ page: tmdbPage })
          );
        }
      }

      const pages     = await Promise.all(fetches);
      const combined  = pages.flatMap(p => p.results);
      const tmdbTotal = pages[0]?.totalPages ?? 1;

      setMovies(combined);
      setTotalUiPages(Math.ceil(tmdbTotal / pagesPerUi));
    } catch {
      setMovies([]);
      setTotalUiPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies(activeTab, uiPage, year, genreId, perPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, uiPage, year, genreId, perPage, refreshKey]);

  const resetPage = () => { setUiPage(1); setSelected(new Set()); };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setGenreId(0);
    setYear(0);
    setUiPage(1);
    setSelected(new Set());
  };

  const visibleMovies = notImportedOnly
    ? movies.filter(m => !existingIds.has(String(m.id)))
    : movies;

  const toggleSelect = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(visibleMovies.map(m => m.id)));
  const clearAll  = () => setSelected(new Set());

  const handleImport = () => {
    const isTV = TABS.find(t => t.key === activeTab)?.isTV ?? false;
    const toImport: TmdbBulkMovie[] = visibleMovies
      .filter(m => selected.has(m.id))
      .map(m => ({
        tmdbId:            String(m.id),
        title:             m.title,
        year:              m.release_date ? new Date(m.release_date).getFullYear() : new Date().getFullYear(),
        rating:            Math.round(m.vote_average * 10) / 10,
        posterUrl:         m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
        plot:              m.overview || '',
        original_language: m.original_language ?? 'en',
        ...(isTV ? { forceCategories: ['Web Series'] } : {}),
      }));

    startTransition(async () => {
      const res = await bulkImportFromTmdb(toImport, quality, audio, size);
      setResult(res);
      setSelected(new Set());
      // Refresh the imported-ID set, reset to page 1, and force a fresh grid load
      const freshIds = await getExistingTmdbIds();
      setExistingIds(new Set(freshIds));
      setUiPage(1);
      setRefreshKey(k => k + 1);
    });
  };

  const currentTabDef = TABS.find(t => t.key === activeTab)!;
  const genres        = currentTabDef.isTV ? TV_GENRES : MOVIE_GENRES;
  const freshCount    = movies.filter(m => !existingIds.has(String(m.id))).length;

  function pageNumbers(): number[] {
    const total = Math.min(totalUiPages, 500);
    const win   = 7;
    if (total <= win)          return Array.from({ length: total }, (_, i) => i + 1);
    if (uiPage <= 4)           return Array.from({ length: win }, (_, i) => i + 1);
    if (uiPage >= total - 3)   return Array.from({ length: win }, (_, i) => total - win + 1 + i);
    return Array.from({ length: win }, (_, i) => uiPage - 3 + i);
  }

  return (
    <div className="max-w-6xl mx-auto pb-40">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Import from TMDB</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {currentTabDef.isTV
              ? '📺 Importing as Web Series — episodes auto-enabled.'
              : 'Select movies and import them to your database in one click.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadMovies(activeTab, uiPage, year, genreId, perPage)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm border border-neutral-800 px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border ${result.errors.length > 0 ? 'bg-yellow-900/20 border-yellow-700' : 'bg-green-900/20 border-green-700'}`}>
          <p className="font-semibold text-white">
            ✅ {result.success} imported &nbsp;·&nbsp; ⏭ {result.skipped} skipped
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
      <div className="flex gap-1 flex-wrap border-b border-neutral-800 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.key
                ? 'bg-neutral-800 text-white border-b-2 border-red-500'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 px-3 py-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800">
        <Filter size={13} className="text-neutral-500 shrink-0" />

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-neutral-400 shrink-0">Year</label>
          <select
            value={year}
            onChange={e => { setYear(Number(e.target.value)); resetPage(); }}
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y === 0 ? 'All Years' : y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-neutral-400 shrink-0">Genre</label>
          <select
            value={genreId}
            onChange={e => { setGenreId(Number(e.target.value)); resetPage(); }}
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          >
            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-neutral-400 shrink-0">Per page</label>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setUiPage(1); setSelected(new Set()); }}
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          >
            {PER_PAGE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={notImportedOnly}
            onChange={e => { setNotImportedOnly(e.target.checked); setSelected(new Set()); }}
            className="rounded accent-red-500"
          />
          <span className="text-xs text-neutral-300 whitespace-nowrap">Not imported only</span>
          <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-1.5 py-0.5 rounded">
            {freshCount} fresh
          </span>
        </label>
      </div>

      {/* Select controls */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded">Select All</button>
        <button onClick={clearAll}  className="text-xs text-neutral-400 hover:text-white border border-neutral-700 px-2 py-1 rounded flex items-center gap-1">
          <Trash2 size={11} /> Clear
        </button>
        <span className="text-xs text-neutral-500">{selected.size} of {visibleMovies.length} selected</span>
        {currentTabDef.isTV && (
          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-900/30 border border-purple-800 px-2 py-1 rounded">
            <Tv size={11} /> Web Series mode
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-neutral-500 gap-2">
          <Loader2 size={20} className="animate-spin" /> Loading…
        </div>
      ) : visibleMovies.length === 0 ? (
        <div className="text-center py-24 text-neutral-500">No movies found for the selected filters.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {visibleMovies.map(movie => {
            const isSelected = selected.has(movie.id);
            const isImported = existingIds.has(String(movie.id));
            return (
              <button
                key={movie.id}
                type="button"
                onClick={() => toggleSelect(movie.id)}
                className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-150 text-left ${
                  isImported
                    ? 'border-green-700/50 opacity-55'
                    : isSelected
                    ? 'border-red-500 shadow-lg shadow-red-900/40'
                    : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {movie.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full aspect-2/3 object-cover"
                  />
                ) : (
                  <div className="w-full aspect-2/3 bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs p-2 text-center">
                    {movie.title}
                  </div>
                )}

                <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-red-600/20' : 'bg-transparent'}`} />

                <div className="absolute top-1.5 right-1.5">
                  {isSelected
                    ? <CheckCircle2 size={18} className="text-red-500 bg-white rounded-full" />
                    : <Circle      size={18} className="text-white/50 group-hover:text-white/80" />
                  }
                </div>

                <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                  <span className="bg-black/70 text-neutral-300 text-[9px] px-1 py-0.5 rounded">
                    {movie.release_date?.split('-')[0] || '—'}
                  </span>
                  {currentTabDef.isTV && (
                    <span className="bg-purple-700 text-white text-[9px] px-1 py-0.5 rounded font-bold">TV</span>
                  )}
                  {isImported && (
                    <span className="bg-green-700 text-white text-[9px] px-1 py-0.5 rounded font-bold">✓ Added</span>
                  )}
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black via-black/70 to-transparent p-1.5">
                  <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">{movie.title}</p>
                  <p className="text-yellow-400 text-[10px]">⭐ {movie.vote_average?.toFixed(1)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalUiPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-8">
          <button
            onClick={() => setUiPage(1)}
            disabled={uiPage === 1}
            className="px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white"
          >«</button>
          <button
            onClick={() => setUiPage(p => Math.max(1, p - 1))}
            disabled={uiPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          {pageNumbers().map(n => (
            <button
              key={n}
              onClick={() => setUiPage(n)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                n === uiPage
                  ? 'bg-red-600 border-red-600 text-white font-bold'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setUiPage(p => Math.min(totalUiPages, p + 1))}
            disabled={uiPage === totalUiPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setUiPage(totalUiPages)}
            disabled={uiPage === totalUiPages}
            className="px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white"
          >»</button>

          <span className="text-xs text-neutral-500 ml-2">Page {uiPage} of {totalUiPages}</span>
        </div>
      )}

      {/* Sticky import bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <span className={`text-sm font-bold ${selected.size > 0 ? 'text-white' : 'text-neutral-600'}`}>
            {selected.size} {currentTabDef.isTV ? 'series' : 'movie'}{selected.size !== 1 ? 's' : ''} selected
          </span>

          <select value={quality} onChange={e => setQuality(e.target.value)} className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white">
            {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <select value={audio} onChange={e => setAudio(e.target.value)} className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white">
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
            {isPending ? 'Importing…' : `Import ${selected.size > 0 ? selected.size : ''} ${currentTabDef.isTV ? 'Series' : 'Movies'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
