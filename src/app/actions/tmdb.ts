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

// ── TV / Web Series ────────────────────────────────────────────────────────

export interface TmdbTvResult {
    id: number;
    name: string;              // TV uses 'name' not 'title'
    first_air_date: string;    // TV uses 'first_air_date' not 'release_date'
    poster_path: string | null;
    overview: string;
    vote_average: number;
    original_language: string;
}

export interface TmdbTvSeason {
    season_number: number;
    episode_count: number;
    name: string;
}

export async function getTrendingTv(): Promise<TmdbTvResult[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=en-US`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results ?? []).slice(0, 20);
    } catch { return []; }
}

export async function getTvByLanguage(lang: string): Promise<TmdbTvResult[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=${lang}&sort_by=popularity.desc&language=en-US`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results ?? []).slice(0, 20);
    } catch { return []; }
}

// Fetch season metadata for a TV show (used by episode selector)
export async function getTmdbTvSeasons(tmdbId: string): Promise<TmdbTvSeason[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=en-US`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.seasons ?? [])
            .filter((s: TmdbTvSeason) => s.season_number > 0) // skip "Specials" (season 0)
            .map((s: TmdbTvSeason) => ({
                season_number: s.season_number,
                episode_count: s.episode_count,
                name: s.name,
            }));
    } catch { return []; }
}

// ── Paginated discover functions ───────────────────────────────────────────

export interface DiscoverFilters {
    page?: number;     // 1-based TMDB page
    year?: number;     // primary_release_year / first_air_date_year
    genreId?: number;  // TMDB genre ID
}

export interface TmdbPagedResponse<T> {
    results: T[];
    totalPages: number;
    totalResults: number;
}

export async function getTrendingMoviesPaged(filters: DiscoverFilters = {}): Promise<TmdbPagedResponse<TmdbSearchResult>> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return { results: [], totalPages: 0, totalResults: 0 };
    try {
        const page = filters.page ?? 1;
        const res = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US&page=${page}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return { results: [], totalPages: 0, totalResults: 0 };
        const data = await res.json();
        return { results: data.results ?? [], totalPages: Math.min(data.total_pages ?? 1, 500), totalResults: data.total_results ?? 0 };
    } catch { return { results: [], totalPages: 0, totalResults: 0 }; }
}

export async function discoverMoviesPaged(lang: string, filters: DiscoverFilters = {}): Promise<TmdbPagedResponse<TmdbSearchResult>> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return { results: [], totalPages: 0, totalResults: 0 };
    try {
        const page = filters.page ?? 1;
        let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=${lang}&sort_by=popularity.desc&language=en-US&page=${page}`;
        if (filters.year) url += `&primary_release_year=${filters.year}`;
        if (filters.genreId) url += `&with_genres=${filters.genreId}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { results: [], totalPages: 0, totalResults: 0 };
        const data = await res.json();
        return { results: data.results ?? [], totalPages: Math.min(data.total_pages ?? 1, 500), totalResults: data.total_results ?? 0 };
    } catch { return { results: [], totalPages: 0, totalResults: 0 }; }
}

export async function getTrendingTvPaged(filters: DiscoverFilters = {}): Promise<TmdbPagedResponse<TmdbTvResult>> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return { results: [], totalPages: 0, totalResults: 0 };
    try {
        const page = filters.page ?? 1;
        const res = await fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=en-US&page=${page}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return { results: [], totalPages: 0, totalResults: 0 };
        const data = await res.json();
        return { results: data.results ?? [], totalPages: Math.min(data.total_pages ?? 1, 500), totalResults: data.total_results ?? 0 };
    } catch { return { results: [], totalPages: 0, totalResults: 0 }; }
}

export async function discoverTvPaged(lang: string, filters: DiscoverFilters = {}): Promise<TmdbPagedResponse<TmdbTvResult>> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') return { results: [], totalPages: 0, totalResults: 0 };
    try {
        const page = filters.page ?? 1;
        let url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=${lang}&sort_by=popularity.desc&language=en-US&page=${page}`;
        if (filters.year) url += `&first_air_date_year=${filters.year}`;
        if (filters.genreId) url += `&with_genres=${filters.genreId}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { results: [], totalPages: 0, totalResults: 0 };
        const data = await res.json();
        return { results: data.results ?? [], totalPages: Math.min(data.total_pages ?? 1, 500), totalResults: data.total_results ?? 0 };
    } catch { return { results: [], totalPages: 0, totalResults: 0 }; }
}
