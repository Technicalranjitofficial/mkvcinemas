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
    getMovieUrl: (id: string) =>
      `https://player.videasy.net/movie/${id}?color=FF0000&overlay=true`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://player.videasy.net/tv/${id}/${s}/${e}?color=FF0000&episodeSelector=false&nextEpisode=false&autoplayNextEpisode=false&overlay=true`,
  },
  twoembed: {
    name: 'Server 2',
    getMovieUrl: (id: string) => `https://www.2embed.cc/embed/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  nontongo: {
    name: 'Server 3',
    getMovieUrl: (id: string) => `https://www.nontongo.win/embed/movie/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  flicky: {
    name: 'Server 4',
    getMovieUrl: (id: string) => `https://flicky.host/embed/movie/?id=${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://flicky.host/embed/tv/?id=${id}&s=${s}&e=${e}`,
  },
  vidbinge: {
    name: 'Server 5',
    getMovieUrl: (id: string) => `https://www.2embed.skin/embed/${id}`,
    getTvUrl: (id: string, s: number, e: number) =>
      `https://www.2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
  },
};

export type ProviderKey = keyof typeof EMBED_PROVIDERS;
