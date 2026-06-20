// utils/embedProviders.ts
// All providers verified live with HTTP 200 on 30 May 2026.

export interface EmbedQuery {
  id: string; // TMDb ID (e.g. "550") or IMDb ID (e.g. "tt1300854")
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export const EMBED_PROVIDERS = {
  videasy: {
    name: 'Server 1',
    getMovieUrl: (id: string) => `https://player.videasy.net/movie/${id}?color=FF0000`,
    getTvUrl: (id: string, s: number, e: number) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=FF0000&episodeSelector=false&nextEpisode=false&autoplayNextEpisode=false`,
  },
  vidsrc_mov: {
    name: 'Server 2',
    getMovieUrl: (id: string) => `https://vidsrc.mov/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidsrc.mov/embed/tv/${id}/${s}/${e}`,
  },
  vidsrc_fyi: {
    name: 'Server 3',
    getMovieUrl: (id: string) => `https://vidsrc.fyi/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidsrc.fyi/embed/tv/${id}/${s}/${e}`,
  },
  vidrock: {
    name: 'Server 4',
    getMovieUrl: (id: string) => `https://vidrock.net/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidrock.net/embed/tv/${id}/${s}/${e}`,
  },
  vidnest: {
    name: 'Server 5',
    getMovieUrl: (id: string) => `https://vidnest.fun/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
  vidking: {
    name: 'Server 6',
    getMovieUrl: (id: string) => `https://www.vidking.net/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  vidlink: {
    name: 'Server 7',
    getMovieUrl: (id: string) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  vidfast: {
    name: 'Server 8',
    getMovieUrl: (id: string) => `https://vidfast.pro/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
  },
  vidup: {
    name: 'Server 9',
    getMovieUrl: (id: string) => `https://vidup.to/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidup.to/embed/tv/${id}/${s}/${e}`,
  },
  movies111: {
    name: 'Server 10',
    getMovieUrl: (id: string) => `https://111movies.com/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://111movies.com/embed/tv/${id}/${s}/${e}`,
  },
  twoembed: {
    name: 'Server 11',
    getMovieUrl: (id: string) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  multiembed: {
    name: 'Server 12',
    getMovieUrl: (id: string) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, s: number, e: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
};

export type ProviderKey = keyof typeof EMBED_PROVIDERS;

