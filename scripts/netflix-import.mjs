/**
 * MKVCinemas Netflix Import Bot
 * Imports Netflix Originals (movies + series) via TMDB network filter.
 *
 * Run: node --env-file=.env scripts/netflix-import.mjs
 *
 * TMDB Network IDs used:
 *   213  = Netflix
 *   1024 = Amazon Prime Video (bonus — comment out if not wanted)
 *   2739 = Disney+
 *   2552 = Apple TV+
 *   49   = HBO / Max
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TMDB_BASE   = 'https://api.themoviedb.org/3';
const TMDB_KEY    = process.env.TMDB_API_KEY;
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const RATE_MS     = 300;

// ── OTT Sources ───────────────────────────────────────────────────────────────
// Each entry maps to a TMDB discover query filtered by network/watch-provider.
// pages: how many TMDB result pages to fetch (20 items/page).
// streamLabel: shown as the category tag on the site.
const SOURCES = [
  // ── Netflix Movies ────────────────────────────────────────────────────────
  { label: 'Netflix Movies (Popular)',   isTV: false, pages: 5,
    params: { with_watch_providers: '8', watch_region: 'IN', sort_by: 'popularity.desc' } },
  { label: 'Netflix Movies 2026',        isTV: false, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Netflix Movies 2025',        isTV: false, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', primary_release_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Netflix Movies 2024',        isTV: false, pages: 2,
    params: { with_watch_providers: '8', watch_region: 'IN', primary_release_year: '2024', sort_by: 'popularity.desc' } },

  // ── Netflix Series / Web Series ──────────────────────────────────────────
  { label: 'Netflix Series (Popular)',   isTV: true, pages: 5,
    params: { with_watch_providers: '8', watch_region: 'IN', sort_by: 'popularity.desc' } },
  { label: 'Netflix Series 2026',        isTV: true, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', first_air_date_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Netflix Series 2025',        isTV: true, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', first_air_date_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Netflix Series 2024',        isTV: true, pages: 2,
    params: { with_watch_providers: '8', watch_region: 'IN', first_air_date_year: '2024', sort_by: 'popularity.desc' } },

  // ── Hindi Netflix Originals ───────────────────────────────────────────────
  { label: 'Netflix Hindi Movies',       isTV: false, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc' } },
  { label: 'Netflix Hindi Series',       isTV: true, pages: 3,
    params: { with_watch_providers: '8', watch_region: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc' } },

  // ── South Indian Netflix Originals ────────────────────────────────────────
  { label: 'Netflix Tamil Movies',       isTV: false, pages: 2,
    params: { with_watch_providers: '8', watch_region: 'IN', with_original_language: 'ta', sort_by: 'popularity.desc' } },
  { label: 'Netflix Telugu Movies',      isTV: false, pages: 2,
    params: { with_watch_providers: '8', watch_region: 'IN', with_original_language: 'te', sort_by: 'popularity.desc' } },
  { label: 'Netflix Malayalam Movies',   isTV: false, pages: 2,
    params: { with_watch_providers: '8', watch_region: 'IN', with_original_language: 'ml', sort_by: 'popularity.desc' } },
];

// ── Language → site category ──────────────────────────────────────────────────
const LANG_CATEGORY = {
  hi:'Bollywood', bho:'Bollywood', mr:'Bollywood', pa:'Bollywood',
  gu:'Bollywood', ur:'Bollywood',  bn:'Bollywood', as:'Bollywood',
  ne:'Nepali',
  ta:'South Indian', te:'South Indian', ml:'South Indian',
  kn:'South Indian', or:'South Indian',
  en:'Hollywood', fr:'Hollywood', de:'Hollywood', es:'Hollywood',
  ja:'Hollywood', ko:'Hollywood', zh:'Hollywood', it:'Hollywood',
  pt:'Hollywood', ru:'Hollywood', tr:'Hollywood', ar:'Hollywood',
  th:'Hollywood', id:'Hollywood',
};

const MOVIE_GENRE_MAP = {
  28:'Action', 12:'Action', 16:'Comedy', 35:'Comedy', 80:'Thriller',
  99:'Drama',  18:'Drama',  10751:'Drama', 14:'Drama', 36:'Drama',
  27:'Horror', 10402:'Drama', 9648:'Thriller', 10749:'Drama',
  878:'Action', 10770:'Drama', 53:'Thriller', 10752:'Action', 37:'Action',
};

const TV_GENRE_MAP = {
  10759:'Action', 16:'Comedy', 35:'Comedy', 80:'Thriller', 99:'Drama',
  18:'Drama', 10751:'Drama', 10762:'Drama', 9648:'Thriller', 10763:'Drama',
  10764:'Drama', 10765:'Action', 10766:'Drama', 10767:'Drama',
  10768:'Action', 37:'Action',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tmdbGet(path, params = {}, attempt = 1) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MKVCinemas-Bot/1.0', 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    if (attempt < 3) {
      console.log(`    ⚠  Retry ${attempt}/3 ${path} — ${err.message}`);
      await sleep(attempt * 1500);
      return tmdbGet(path, params, attempt + 1);
    }
    throw new Error(`TMDB ${path}: ${err.message}`);
  }
}

async function fetchCandidates() {
  const seenMovies = new Set(), seenTV = new Set(), all = [];
  for (const src of SOURCES) {
    const isTV = src.isTV, seen = isTV ? seenTV : seenMovies;
    const discoverPath = isTV ? '/discover/tv' : '/discover/movie';
    const fetched = [];
    for (let p = 1; p <= src.pages; p++) {
      try {
        const d = await tmdbGet(discoverPath, { ...src.params, page: String(p) });
        fetched.push(...(d.results ?? []));
        await sleep(150);
      } catch (e) {
        console.log(`    ⚠  ${src.label} p${p}: ${e.message}`);
        break;
      }
    }
    const uniq = fetched.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    console.log(`    ${(src.label + (isTV ? ' [TV]' : '')).padEnd(32)} → ${String(fetched.length).padStart(3)} fetched, ${String(uniq.length).padStart(3)} new`);
    all.push(...uniq.map(m => ({ id: m.id, title: m.title ?? m.name ?? 'Unknown', isTV })));
  }
  return all;
}

async function fetchMovieDetails(id) {
  const [details, credits] = await Promise.all([
    tmdbGet(`/movie/${id}`),
    tmdbGet(`/movie/${id}/credits`),
  ]);
  const director = credits.crew?.find(c => c.job === 'Director')?.name ?? '';
  const cast = credits.cast?.slice(0, 8).map(c => c.name).join(', ') ?? '';
  return { details, director, cast };
}

async function fetchTvDetails(id) {
  const [details, credits] = await Promise.all([
    tmdbGet(`/tv/${id}`),
    tmdbGet(`/tv/${id}/credits`),
  ]);
  details.title = details.name ?? details.original_name;
  details.release_date = details.first_air_date;
  const director = credits.crew?.find(c =>
    ['Director', 'Executive Producer', 'Creator'].includes(c.job)
  )?.name ?? '';
  const cast = credits.cast?.slice(0, 8).map(c => c.name).join(', ') ?? '';
  return { details, director, cast };
}

function buildCategories(details, genreMap, extraCats = []) {
  const cats = new Set(extraCats);
  const lc = LANG_CATEGORY[details.original_language];
  if (lc) cats.add(lc);
  for (const g of details.genres ?? []) {
    const m = genreMap[g.id];
    if (m) cats.add(m);
  }
  if (cats.size === 0) cats.add('Hollywood');
  return [...cats];
}

function audioLabel(lang) {
  if (['hi', 'bho', 'ur'].includes(lang)) return 'Hindi';
  if (['ta', 'te', 'ml', 'kn', 'or'].includes(lang)) return 'Tamil/Telugu';
  const map = { mr: 'Marathi', pa: 'Punjabi', bn: 'Bengali', ne: 'Nepali', gu: 'Gujarati' };
  return map[lang] ?? 'English';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!TMDB_KEY) { console.error('❌  TMDB_API_KEY not set.'); process.exit(1); }
  console.log(`\n🎬  MKVCinemas Netflix Import Bot — ${new Date().toISOString()}`);
  console.log('─'.repeat(60));

  console.log('📡  Fetching Netflix candidates…\n');
  const candidates = await fetchCandidates();
  const movies = candidates.filter(c => !c.isTV);
  const series = candidates.filter(c => c.isTV);
  console.log(`\n    Total candidates : ${candidates.length}  (${movies.length} movies + ${series.length} series)`);

  // Check what's already in DB
  const existing = await prisma.movie.findMany({ select: { tmdbId: true, categories: true } });
  const exMovies = new Set(existing.filter(r => !r.categories?.includes('Web Series')).map(r => r.tmdbId).filter(Boolean));
  const exTV     = new Set(existing.filter(r =>  r.categories?.includes('Web Series')).map(r => r.tmdbId).filter(Boolean));
  console.log(`    DB already has   : ${exMovies.size} movies + ${exTV.size} series\n`);

  const newItems = candidates.filter(c => c.isTV ? !exTV.has(String(c.id)) : !exMovies.has(String(c.id)));
  const nm = newItems.filter(c => !c.isTV).length;
  const ns = newItems.filter(c =>  c.isTV).length;
  console.log(`🆕  ${newItems.length} new items to import  (${nm} movies + ${ns} series).\n`);

  if (!newItems.length) {
    console.log('✅  Nothing new — all Netflix content already in DB.\n');
    return;
  }

  let added = 0, skipped = 0, failed = 0;
  for (const item of newItems) {
    try {
      await sleep(RATE_MS);
      const { details, director, cast } = item.isTV
        ? await fetchTvDetails(item.id)
        : await fetchMovieDetails(item.id);

      if (!details.poster_path || !details.overview?.trim()) {
        console.log(`⏭   No poster/plot: ${details.title}`);
        skipped++;
        continue;
      }
      if (!details.release_date) {
        console.log(`⏭   No release date: ${details.title}`);
        skipped++;
        continue;
      }

      const year = new Date(details.release_date).getFullYear();
      const genreMap = item.isTV ? TV_GENRE_MAP : MOVIE_GENRE_MAP;
      // Always tag Netflix content with "Netflix" category so it's filterable
      const categories = buildCategories(details, genreMap, item.isTV ? ['Web Series', 'Netflix'] : ['Netflix']);

      await prisma.movie.create({
        data: {
          title: details.title,
          year,
          rating: Math.round((details.vote_average ?? 0) * 10) / 10,
          quality: '1080p',
          audio: audioLabel(details.original_language),
          size: 'N/A',
          plot: details.overview,
          director,
          cast,
          posterUrl: `${POSTER_BASE}${details.poster_path}`,
          tmdbId: String(details.id),
          screenshots: [],
          categories,
          downloadLinks: [],
          streamLinks: [],
        },
      });

      added++;
      console.log(`${item.isTV ? '📺' : '🎬'} [${added}]  ${details.title} (${year}) — ${categories.join(', ')}`);
    } catch (err) {
      if (err.message?.includes('Unique constraint')) {
        skipped++;
      } else {
        failed++;
        console.error(`✗  ${item.title}: ${err.message}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🏁  Done!  Added: ${added}  Skipped: ${skipped}  Failed: ${failed}\n`);
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
