/**
 * MKVCinemas Auto-Import Bot
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches today's trending + now-playing movies from TMDB and inserts any that
 * are not already in the database.
 *
 * Run manually:
 *   node --env-file=.env scripts/auto-import.mjs
 *
 * Or via the npm script:
 *   yarn bot
 *
 * Schedule automatically with GitHub Actions (.github/workflows/auto-import.yml)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Config ────────────────────────────────────────────────────────────────────
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const TMDB_KEY   = process.env.TMDB_API_KEY;
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

// How many ms to wait between per-movie detail calls (TMDB allows 40 req/10 s)
const RATE_DELAY_MS = 300;

// ── TMDB genre ID → our site category label ───────────────────────────────────
const GENRE_MAP = {
  28:    'Action',
  12:    'Action',   // Adventure
  16:    'Comedy',   // Animation
  35:    'Comedy',
  80:    'Thriller', // Crime
  99:    'Drama',    // Documentary
  18:    'Drama',
  10751: 'Drama',    // Family
  14:    'Drama',    // Fantasy
  36:    'Drama',    // History
  27:    'Horror',
  10402: 'Drama',    // Music
  9648:  'Thriller', // Mystery
  10749: 'Drama',    // Romance
  878:   'Action',   // Sci-Fi
  10770: 'Drama',    // TV Movie
  53:    'Thriller',
  10752: 'Action',   // War
  37:    'Action',   // Western
};

// TMDB original_language → our content category
const LANG_CATEGORY = {
  hi: 'Bollywood',
  ta: 'South Indian',
  te: 'South Indian',
  ml: 'South Indian',
  kn: 'South Indian',
  en: 'Hollywood',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function tmdbGet(path, params = {}, attempt = 1) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MKVCinemas-Bot/1.0',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.json();
  } catch (err) {
    if (attempt < 3) {
      const delay = attempt * 1500;
      console.log(`    ⚠  Retry ${attempt}/3 for ${path} (${err.message}) — waiting ${delay}ms…`);
      await sleep(delay);
      return tmdbGet(path, params, attempt + 1);
    }
    throw new Error(`TMDB ${path}: ${err.message}`);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Source definitions ────────────────────────────────────────────────────────
// Each entry describes one TMDB endpoint + how many pages to pull from it.
// Total candidates before dedup = sum of (pages × ~20 results).
const SOURCES = [
  // Global trending / popular
  { label: 'Trending (day)',    path: '/trending/movie/day',  pages: 2 },
  { label: 'Trending (week)',   path: '/trending/movie/week', pages: 3 },
  { label: 'Now Playing',       path: '/movie/now_playing',   pages: 3 },
  { label: 'Upcoming',          path: '/movie/upcoming',      pages: 3 },
  { label: 'Popular',           path: '/movie/popular',       pages: 5 },
  { label: 'Top Rated',         path: '/movie/top_rated',     pages: 5 },

  // Bollywood — Hindi-language discover
  { label: 'Bollywood (2026)',  path: '/discover/movie', pages: 3,
    params: { with_original_language: 'hi', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Bollywood (2025)',  path: '/discover/movie', pages: 3,
    params: { with_original_language: 'hi', primary_release_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Bollywood (2024)',  path: '/discover/movie', pages: 2,
    params: { with_original_language: 'hi', primary_release_year: '2024', sort_by: 'popularity.desc' } },

  // South Indian
  { label: 'Tamil (2026)',      path: '/discover/movie', pages: 2,
    params: { with_original_language: 'ta', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Tamil (2025)',      path: '/discover/movie', pages: 2,
    params: { with_original_language: 'ta', primary_release_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Telugu (2026)',     path: '/discover/movie', pages: 2,
    params: { with_original_language: 'te', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Telugu (2025)',     path: '/discover/movie', pages: 2,
    params: { with_original_language: 'te', primary_release_year: '2025', sort_by: 'popularity.desc' } },

  // Hollywood — current + recent years
  { label: 'Hollywood (2026)',  path: '/discover/movie', pages: 5,
    params: { with_original_language: 'en', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Hollywood (2025)',  path: '/discover/movie', pages: 5,
    params: { with_original_language: 'en', primary_release_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Hollywood (2024)',  path: '/discover/movie', pages: 3,
    params: { with_original_language: 'en', primary_release_year: '2024', sort_by: 'popularity.desc' } },
];

// ── Data fetchers ─────────────────────────────────────────────────────────────
async function fetchCandidates() {
  const seen = new Set();
  const all = [];

  for (const src of SOURCES) {
    const fetched = [];
    for (let page = 1; page <= src.pages; page++) {
      try {
        const data = await tmdbGet(src.path, { ...(src.params ?? {}), page: String(page) });
        fetched.push(...(data.results ?? []));
        await sleep(150); // small gap between pages
      } catch (err) {
        console.log(`    ⚠  ${src.label} page ${page} failed: ${err.message}`);
        break;
      }
    }
    const unique = fetched.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
    console.log(`    ${src.label.padEnd(22)} → ${fetched.length} fetched, ${unique.length} unique new`);
    all.push(...unique);
  }

  return all;
}

async function fetchMovieDetails(tmdbId) {
  const [details, credits] = await Promise.all([
    tmdbGet(`/movie/${tmdbId}`),
    tmdbGet(`/movie/${tmdbId}/credits`),
  ]);

  const director = credits.crew?.find(c => c.job === 'Director')?.name ?? '';
  const cast = credits.cast
    ?.slice(0, 8)
    .map(c => c.name)
    .join(', ') ?? '';

  return { details, director, cast };
}

// ── Category builder ──────────────────────────────────────────────────────────
function buildCategories(details) {
  const cats = new Set();

  // Language-based primary category
  const langCat = LANG_CATEGORY[details.original_language];
  if (langCat) cats.add(langCat);

  // Genre-based categories
  for (const genre of details.genres ?? []) {
    const mapped = GENRE_MAP[genre.id];
    if (mapped) cats.add(mapped);
  }

  // Fallback: if nothing matched, mark as Hollywood
  if (cats.size === 0) cats.add('Hollywood');

  return [...cats];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!TMDB_KEY) {
    console.error('❌  TMDB_API_KEY is not set. Aborting.');
    process.exit(1);
  }

  const now = new Date().toISOString();
  console.log(`\n🎬  MKVCinemas Auto-Import Bot — ${now}\n${'─'.repeat(55)}`);

  // 1. Fetch candidates from TMDB
  console.log('📡  Fetching candidates from TMDB…\n');
  const candidates = await fetchCandidates();
  console.log(`    Got ${candidates.length} unique candidates.`);

  // 2. Load existing tmdbIds from DB
  const existing = await prisma.movie.findMany({ select: { tmdbId: true } });
  const existingIds = new Set(existing.map(r => r.tmdbId).filter(Boolean));
  console.log(`    DB already has ${existingIds.size} movies.\n`);

  const newMovies = candidates.filter(m => !existingIds.has(String(m.id)));
  console.log(`🆕  ${newMovies.length} new movies to import.\n`);

  if (newMovies.length === 0) {
    console.log('✅  Nothing new today. Bot done.\n');
    return;
  }

  // 3. Import each new movie
  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of newMovies) {
    try {
      await sleep(RATE_DELAY_MS); // respect TMDB rate limit

      const { details, director, cast } = await fetchMovieDetails(candidate.id);

      // Skip entries without the minimum required data
      if (!details.poster_path || !details.overview?.trim()) {
        console.log(`⏭   Skipped (no poster/plot): ${details.title}`);
        skipped++;
        continue;
      }

      // Skip movies with no release date yet (pure future-dated entries)
      if (!details.release_date) {
        console.log(`⏭   Skipped (no release date): ${details.title}`);
        skipped++;
        continue;
      }

      const year = new Date(details.release_date).getFullYear();
      const categories = buildCategories(details);

      // Determine audio label based on original language
      let audio = 'English';
      if (details.original_language === 'hi') audio = 'Hindi';
      else if (['ta', 'te', 'ml', 'kn'].includes(details.original_language)) audio = 'Tamil/Telugu';

      await prisma.movie.create({
        data: {
          title:        details.title,
          year,
          rating:       Math.round((details.vote_average ?? 0) * 10) / 10,
          quality:      '1080p',
          audio,
          size:         'N/A',
          plot:         details.overview,
          director,
          cast,
          posterUrl:    `${POSTER_BASE}${details.poster_path}`,
          tmdbId:       String(details.id),
          screenshots:  [],
          categories,
          downloadLinks: [],
          streamLinks:   [],
        },
      });

      added++;
      console.log(`✓ [${added}]  ${details.title} (${year}) — ${categories.join(', ')}`);

    } catch (err) {
      failed++;
      console.error(`✗  Failed: ${candidate.title} — ${err.message}`);
    }
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`🏁  Bot finished.`);
  console.log(`    Added  : ${added}`);
  console.log(`    Skipped: ${skipped}`);
  console.log(`    Failed : ${failed}\n`);
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
