// utils/embedProviders.ts

export interface EmbedQuery {
  id: string; // TMDb ID (e.g. "550") or IMDb ID (e.g. "tt1300854")
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export const EMBED_PROVIDERS = {
  videasy: {
    name: 'Videasy',
    getMovieUrl: (id: string) =>
      `https://player.videasy.net/movie/${id}?color=FF0000&overlay=true`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://player.videasy.net/tv/${id}/${s}/${e}?color=FF0000&episodeSelector=false&nextEpisode=false&autoplayNextEpisode=false&overlay=true`,
  },
  vidsrc: {
    name: 'VidSrc',
    getMovieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  smashy: {
    name: 'SmashyStream',
    getMovieUrl: (id: string) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
  },
  embedsu: {
    name: 'Embed.su',
    getMovieUrl: (id: string) => `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  twoembed: {
    name: '2Embed',
    getMovieUrl: (id: string) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
};

export type ProviderKey = keyof typeof EMBED_PROVIDERS;
