// utils/embedProviders.ts

export interface EmbedQuery {
  id: string; // TMDb ID (e.g. "550") or IMDb ID (e.g. "tt1300854")
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export const EMBED_PROVIDERS = {
  videasy: {
    name: 'Server 1',
    getMovieUrl: (id: string) =>
      `https://player.videasy.net/movie/${id}?color=FF0000&overlay=true`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://player.videasy.net/tv/${id}/${s}/${e}?color=FF0000&episodeSelector=false&nextEpisode=false&autoplayNextEpisode=false&overlay=true`,
  },
  vidsrc: {
    name: 'Server 2',
    getMovieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  smashy: {
    name: 'Server 3',
    getMovieUrl: (id: string) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
  },
  embedsu: {
    name: 'Server 4',
    getMovieUrl: (id: string) => `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  twoembed: {
    name: 'Server 5',
    getMovieUrl: (id: string) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  vidsrcme: {
    name: 'Server 6',
    getMovieUrl: (id: string) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  vidlink: {
    name: 'Server 7',
    getMovieUrl: (id: string) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  multiembed: {
    name: 'Server 8',
    getMovieUrl: (id: string) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  autoembed: {
    name: 'Server 9',
    getMovieUrl: (id: string) => `https://autoembed.cc/movie/tmdb/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://autoembed.cc/tv/tmdb/${id}-${s}-${e}`,
  },
  moviesapi: {
    name: 'Server 10',
    getMovieUrl: (id: string) => `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
};

export type ProviderKey = keyof typeof EMBED_PROVIDERS;
