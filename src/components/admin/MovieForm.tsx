'use client';

import { Plus, Trash, Save, Search, Loader2, TrendingUp, Flame } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { searchTmdb, getTmdbDetails, getTrendingMovies, getMoviesByLanguage } from '@/app/actions/tmdb';
import { suggestAudio } from '@/utils/tmdbHelpers';
import type { TmdbSearchResult } from '@/app/actions/tmdb';

const ALL_CATEGORIES = ['Bollywood', 'Hollywood', 'South Indian', 'Web Series', 'Dual Audio', 'Action', 'Thriller', 'Comedy'];
const QUALITY_OPTIONS = ['480p', '720p', '720p HEVC', '1080p', '1080p HEVC', '1080p x265', '2160p 4K', '4K HDR', 'BluRay 480p', 'BluRay 720p', 'BluRay 1080p'];
const AUDIO_OPTIONS = ['Hindi', 'English', 'Dual Audio [Hin-Eng]', 'Dual Audio [Hin-Tamil]', 'Dual Audio [Hin-Tel]', 'Multi Audio', 'Tamil', 'Telugu', 'Hindi Dubbed', 'English Subtitles'];
const TMDB_GENRE_MAP: Record<string, string> = {
    'Action': 'Action',
    'Adventure': 'Action',
    'Thriller': 'Thriller',
    'Comedy': 'Comedy',
};

interface MovieFormProps {
    action: (formData: FormData) => Promise<void>;
    initialData?: {
        id?: string;
        title: string;
        year: number;
        rating: number;
        quality: string;
        audio: string;
        size: string;
        plot: string;
        director: string | null;
        cast: string | null;
        posterUrl: string;
        tmdbId?: string | null;
        categories: string[];
        screenshots: string[];
        downloadLinks: { label: string; url: string; color: string }[];
        streamLinks: { server: string; url: string }[];
    };
    isEdit?: boolean;
}

export default function MovieForm({ action, initialData, isEdit = false }: MovieFormProps) {
    // Controlled basic fields (so TMDB can auto-fill them)
    const [title, setTitle] = useState(initialData?.title || '');
    const [year, setYear] = useState(initialData?.year || new Date().getFullYear());
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [plot, setPlot] = useState(initialData?.plot || '');
    const [director, setDirector] = useState(initialData?.director || '');
    const [cast, setCast] = useState(initialData?.cast || '');
    const [posterUrl, setPosterUrl] = useState(initialData?.posterUrl || '');
    const [tmdbId, setTmdbId] = useState(initialData?.tmdbId || '');
    const [quality, setQuality] = useState(initialData?.quality || '1080p HEVC');
    const [audio, setAudio] = useState(initialData?.audio || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);

    // Dynamic arrays
    const [screenshots, setScreenshots] = useState<string[]>(initialData?.screenshots.length ? initialData.screenshots : ['']);
    const [downloadLinks, setDownloadLinks] = useState(initialData?.downloadLinks.length ? initialData.downloadLinks : [{ label: '', url: '', color: 'blue' }]);
    const [streamLinks, setStreamLinks] = useState(initialData?.streamLinks.length ? initialData.streamLinks : [{ server: '', url: '' }]);

    // TMDB search state
    const [tmdbQuery, setTmdbQuery] = useState('');
    const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
    const [trendingMovies, setTrendingMovies] = useState<TmdbSearchResult[]>([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [activeTab, setActiveTab] = useState<'trending' | 'bollywood' | 'hollywood' | 'south'>('trending');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        getTrendingMovies().then((movies) => {
            setTrendingMovies(movies);
            setLoadingTrending(false);
        });
    }, []);

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        if (tab === 'trending') return;
        setLoadingTrending(true);
        const langMap: Record<string, string> = { bollywood: 'hi', hollywood: 'en', south: 'ta' };
        getMoviesByLanguage(langMap[tab]).then((movies) => {
            setTrendingMovies(movies);
            setLoadingTrending(false);
        });
    };

    const handleTmdbSearch = () => {
        if (!tmdbQuery.trim()) return;
        startTransition(async () => {
            // If pure number → treat as TMDB ID, try movie first then TV
            const asId = parseInt(tmdbQuery.trim());
            if (!isNaN(asId)) {
                let details = await getTmdbDetails(asId, 'movie');
                let mediaType: 'movie' | 'tv' = 'movie';
                if (!details?.title) { details = await getTmdbDetails(asId, 'tv'); mediaType = 'tv'; }
                if (details) { handleTmdbSelectDetails(asId, mediaType, details); return; }
            }
            const results = await searchTmdb(tmdbQuery);
            setTmdbResults(results);
        });
    };

    const handleTmdbSelect = (result: TmdbSearchResult) => {
        startTransition(async () => {
            const mediaType = result.media_type ?? 'movie';
            const details = await getTmdbDetails(result.id, mediaType);
            if (!details) return;
            handleTmdbSelectDetails(result.id, mediaType, details);
        });
    };

    const handleTmdbSelectDetails = (
        id: number,
        mediaType: 'movie' | 'tv',
        details: Awaited<ReturnType<typeof getTmdbDetails>>
    ) => {
        if (!details) return;
        setTitle(details.title);
        if (details.release_date) setYear(new Date(details.release_date).getFullYear());
        setRating(Math.round(details.vote_average * 10) / 10);
        setPlot(details.overview || '');
        // Director: for TV use Creator / Executive Producer / Director
        const dir = details.credits?.crew?.find(c =>
            ['Director', 'Creator', 'Executive Producer'].includes(c.job)
        )?.name || '';
        setDirector(dir);
        const castList = details.credits?.cast?.slice(0, 6).map(c => c.name).join(', ') || '';
        setCast(castList);
        if (details.poster_path) setPosterUrl(`https://image.tmdb.org/t/p/w500${details.poster_path}`);
        setTmdbId(String(id));
        const suggested = suggestAudio(details.original_language ?? 'en');
        setAudio(suggested);
        const backdrops = (details.images?.backdrops ?? [])
            .slice(0, 4)
            .map(b => `https://image.tmdb.org/t/p/w780${b.file_path}`);
        if (backdrops.length > 0) setScreenshots(backdrops);
        const mappedCats = (details.genres ?? [])
            .map(g => TMDB_GENRE_MAP[g.name])
            .filter(Boolean) as string[];
        // Auto-add Web Series category for TV
        if (mediaType === 'tv' && !mappedCats.includes('Web Series')) mappedCats.push('Web Series');
        setSelectedCategories([...new Set(mappedCats)]);
        setTmdbResults([]);
        setTmdbQuery('');
    };

    const toggleCategory = (cat: string) =>
        setSelectedCategories((prev: string[]) => prev.includes(cat) ? prev.filter((c: string) => c !== cat) : [...prev, cat]);

    const addScreenshot = () => setScreenshots([...screenshots, '']);
    const removeScreenshot = (index: number) => setScreenshots(screenshots.filter((_: string, i: number) => i !== index));
    const updateScreenshot = (index: number, value: string) => {
        const next = [...screenshots]; next[index] = value; setScreenshots(next);
    };

    const addLink = () => setDownloadLinks([...downloadLinks, { label: '', url: '', color: 'blue' }]);
    const removeLink = (index: number) => setDownloadLinks(downloadLinks.filter((_: unknown, i: number) => i !== index));
    const updateLink = (index: number, field: string, value: string) => {
        const next = [...downloadLinks]; next[index] = { ...next[index], [field]: value }; setDownloadLinks(next);
    };

    const addStreamLink = () => setStreamLinks([...streamLinks, { server: '', url: '' }]);
    const removeStreamLink = (index: number) => setStreamLinks(streamLinks.filter((_: unknown, i: number) => i !== index));
    const updateStreamLink = (index: number, field: string, value: string) => {
        const next = [...streamLinks]; next[index] = { ...next[index], [field]: value }; setStreamLinks(next);
    };

    return (
        <form action={action} className="space-y-8">
            {/* TMDB Auto-fill */}
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">Auto-fill from TMDB</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tmdbQuery}
                        onChange={e => setTmdbQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleTmdbSearch())}
                        placeholder="Search title or paste TMDB ID (movies & series)…"
                        className="flex-1 bg-black border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={handleTmdbSearch}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Search
                    </button>
                </div>

                {/* Search results */}
                {tmdbResults.length > 0 && (
                    <div className="bg-black border border-neutral-800 rounded divide-y divide-neutral-800 max-h-64 overflow-y-auto">
                        {tmdbResults.map(result => (
                            <button
                                key={`${result.media_type}-${result.id}`}
                                type="button"
                                onClick={() => handleTmdbSelect(result)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-neutral-900 text-left transition-colors"
                            >
                                {result.poster_path ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={`https://image.tmdb.org/t/p/w92${result.poster_path}`} alt={result.title} className="w-10 h-14 object-cover rounded shrink-0" />
                                ) : (
                                    <div className="w-10 h-14 bg-neutral-800 rounded shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white text-sm truncate">{result.title}</p>
                                        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            result.media_type === 'tv'
                                                ? 'bg-purple-700 text-purple-200'
                                                : 'bg-blue-700 text-blue-200'
                                        }`}>
                                            {result.media_type === 'tv' ? 'TV' : 'Movie'}
                                        </span>
                                    </div>
                                    <p className="text-neutral-500 text-xs">{result.release_date?.split('-')[0]} · ⭐ {result.vote_average?.toFixed(1)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Trending movies grid (shown when no search is active) */}
                {tmdbResults.length === 0 && (
                    <div>
                        {/* Category Tabs */}
                        <div className="flex items-center gap-1 mb-3 border-b border-neutral-800 pb-2">
                            {([
                                { key: 'trending', label: '🔥 Trending' },
                                { key: 'bollywood', label: '🎬 Bollywood' },
                                { key: 'hollywood', label: '🎥 Hollywood' },
                                { key: 'south', label: '🌟 South Indian' },
                            ] as const).map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {loadingTrending ? (
                            <div className="flex items-center justify-center py-8 text-neutral-500 gap-2">
                                <Loader2 size={16} className="animate-spin" /> Loading trending movies...
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                                {trendingMovies.map(movie => (
                                    <button
                                        key={movie.id}
                                        type="button"
                                        onClick={() => handleTmdbSelect(movie)}
                                        disabled={isPending}
                                        className="group relative rounded overflow-hidden border border-neutral-800 hover:border-blue-500 transition-colors text-left"
                                    >
                                        {movie.poster_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                                                alt={movie.title}
                                                className="w-full aspect-[2/3] object-cover"
                                            />
                                        ) : (
                                            <div className="w-full aspect-[2/3] bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs p-1 text-center">{movie.title}</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                                            <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">{movie.title}</p>
                                            <p className="text-yellow-400 text-[10px]">⭐ {movie.vote_average?.toFixed(1)}</p>
                                        </div>
                                        <div className="absolute top-1 right-1 bg-black/70 text-yellow-400 text-[9px] font-bold px-1 rounded">
                                            {movie.release_date?.split('-')[0]}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-neutral-600 mt-2 flex items-center gap-1">
                            <TrendingUp size={11} /> Click any poster to auto-fill the form · Quality, Audio &amp; Size must be filled manually
                        </p>
                    </div>
                )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Movie Title</label>
                    <input required name="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. Pushpa 2: The Rule" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Year</label>
                    <input required name="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Rating (0-10)</label>
                    <input name="rating" type="number" step="0.1" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. 8.5" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Quality Label</label>
                    <select
                        required
                        name="quality"
                        value={quality}
                        onChange={e => setQuality(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2 text-white"
                    >
                        <option value="" disabled>Select quality...</option>
                        {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Audio</label>
                    <select
                        required
                        name="audio"
                        value={audio}
                        onChange={e => setAudio(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2 text-white"
                    >
                        <option value="" disabled>Select audio...</option>
                        {AUDIO_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Size</label>
                    <input name="size" type="text" defaultValue={initialData?.size} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. 1.4GB" />
                </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Plot Summary</label>
                    <textarea required name="plot" rows={4} value={plot} onChange={e => setPlot(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="Enter movie plot..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Director</label>
                        <input name="director" type="text" value={director} onChange={e => setDirector(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Cast</label>
                        <input name="cast" type="text" value={cast} onChange={e => setCast(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                    </div>
                </div>
            </div>

            {/* Poster & TMDb ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Poster URL</label>
                    <input required name="posterUrl" type="url" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">
                        TMDb ID
                        <span className="ml-2 text-xs text-neutral-600 font-normal">(auto-filled — powers Watch Online player)</span>
                    </label>
                    <input
                        name="tmdbId"
                        type="text"
                        value={tmdbId}
                        onChange={e => setTmdbId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2 font-mono"
                        placeholder="e.g. 550"
                    />
                </div>
                {posterUrl && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Preview</label>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={posterUrl} alt="Poster preview" className="h-32 rounded object-cover border border-neutral-800" />
                    </div>
                )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Categories</label>
                <div className="flex flex-wrap gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded">
                    {ALL_CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="categories"
                                value={cat}
                                checked={selectedCategories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="rounded bg-neutral-800 border-neutral-700"
                            />
                            <span>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Screenshots */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Screenshots URLs</label>
                    <button type="button" onClick={addScreenshot} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add URL
                    </button>
                </div>
                <div className="space-y-2">
                    {screenshots.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input type="url" value={url} onChange={(e) => updateScreenshot(idx, e.target.value)} className="flex-1 bg-black border border-neutral-800 rounded px-3 py-1 text-sm" placeholder="https://..." />
                            <button type="button" onClick={() => removeScreenshot(idx)} className="text-red-500 hover:text-red-400"><Trash size={18} /></button>
                        </div>
                    ))}
                    <input type="hidden" name="screenshots" value={screenshots.join(',')} />
                </div>
            </div>

            {/* Stream Links */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Streaming Links</label>
                    <button type="button" onClick={addStreamLink} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add Stream
                    </button>
                </div>
                <div className="space-y-3">
                    {streamLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-black p-2 rounded border border-neutral-800">
                            <input type="text" placeholder="Server Name (e.g. Server 1)" value={link.server} onChange={(e) => updateStreamLink(idx, 'server', e.target.value)} className="bg-neutral-900 border-none rounded px-2 py-1 flex-1 min-w-[120px]" />
                            <input type="url" placeholder="Iframe URL" value={link.url} onChange={(e) => updateStreamLink(idx, 'url', e.target.value)} className="bg-neutral-900 border-none rounded px-2 py-1 flex-2" />
                            <button type="button" onClick={() => removeStreamLink(idx)} className="text-red-500 p-1"><Trash size={16} /></button>
                        </div>
                    ))}
                    <input type="hidden" name="streamLinks" value={JSON.stringify(streamLinks)} />
                </div>
            </div>

            {/* Download Links */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Download Links</label>
                    <button type="button" onClick={addLink} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add Link
                    </button>
                </div>
                <div className="space-y-3">
                    {downloadLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-black p-2 rounded border border-neutral-800">
                            <input type="text" placeholder="Label (e.g. 720p)" value={link.label} onChange={(e) => updateLink(idx, 'label', e.target.value)} className="bg-neutral-900 border-none rounded px-2 py-1 flex-1 min-w-[120px]" />
                            <input type="url" placeholder="Download URL" value={link.url} onChange={(e) => updateLink(idx, 'url', e.target.value)} className="bg-neutral-900 border-none rounded px-2 py-1 flex-2" />
                            <select value={link.color} onChange={(e) => updateLink(idx, 'color', e.target.value)} className="bg-neutral-900 border-none rounded px-2 py-1 text-sm text-neutral-400">
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="red">Red</option>
                                <option value="yellow">Yellow</option>
                            </select>
                            <button type="button" onClick={() => removeLink(idx)} className="text-red-500 p-1"><Trash size={16} /></button>
                        </div>
                    ))}
                    <input type="hidden" name="downloadLinks" value={JSON.stringify(downloadLinks)} />
                </div>
            </div>

            <div className="pt-8">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                    <Save size={20} />
                    {isEdit ? 'Update Movie' : 'Save Movie'}
                </button>
            </div>
        </form>
    );
}
