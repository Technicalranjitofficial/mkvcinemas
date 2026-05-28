'use server';

export interface TmdbSearchResult {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    overview: string;
    vote_average: number;
    original_language: string; // e.g. "hi", "en", "ta", "te"
}

export interface TmdbMovieDetails {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    original_language: string;
    spoken_languages: { iso_639_1: string; english_name: string; name: string }[];
    genres: { id: number; name: string }[];
    images: {
        backdrops: { file_path: string }[];
    };
    credits: {
        crew: { job: string; name: string }[];
        cast: { name: string; order: number }[];
    };
}

// Maps TMDB original_language to a suggested audio label
export function suggestAudio(originalLanguage: string): string {
    const map: Record<string, string> = {
        hi: 'Hindi',
        en: 'English',
        ta: 'Tamil',
        te: 'Telugu',
        ml: 'Malayalam',
        kn: 'Kannada',
        mr: 'Marathi',
        bn: 'Bengali',
        pa: 'Punjabi',
    };
    return map[originalLanguage] ?? 'Hindi';
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here' || !query.trim()) return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`,
            { cache: 'no-store' }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results ?? []).slice(0, 8);
    } catch { return []; }
}

export async function getTmdbDetails(tmdbId: number): Promise<TmdbMovieDetails | null> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits,images&language=en-US&include_image_language=en,null`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function getTrendingMovies(): Promise<TmdbSearchResult[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results ?? []).slice(0, 20);
    } catch { return []; }
}

// Fetch movies by original language via TMDB Discover
export async function getMoviesByLanguage(lang: string): Promise<TmdbSearchResult[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=${lang}&sort_by=popularity.desc&language=en-US`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results ?? []).slice(0, 20);
    } catch { return []; }
}
