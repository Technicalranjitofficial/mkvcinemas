'use server';

export interface TmdbSearchResult {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    overview: string;
    vote_average: number;
}

export interface TmdbMovieDetails {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    genres: { id: number; name: string }[];
    images: {
        backdrops: { file_path: string }[];
    };
    credits: {
        crew: { job: string; name: string }[];
        cast: { name: string; order: number }[];
    };
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
    } catch {
        return [];
    }
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
    } catch {
        return null;
    }
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
    } catch {
        return [];
    }
}
