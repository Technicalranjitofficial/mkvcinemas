/**
 * MKVCinemas Prime Video Import Bot
 * Imports Amazon Prime Video content (movies + series) via TMDB watch-provider filter.
 *
 * Run: node --env-file=.env scripts/prime-import.mjs
 *
 * TMDB Watch Provider IDs used:
 *   9   = Amazon Prime Video (global)
 *   119 = Amazon Prime Video (India)
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TMDB_BASE   = 'https://api.themoviedb.org/3';
const TMDB_KEY    = process.env.TMDB_API_KEY;
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const RATE_MS     = 300;

// ── OTT Sources ───────────────────────────────────────────────────────────────
const SOURCES = [
  // ── Prime Video Movies ────────────────────────────────────────────────────
  { label: 'Prime Movies (Popular)',     isTV: false, pages: 10,
    params: { with_watch_providers: '9|119', watch_region: 'IN', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2026',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2025',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2024',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2024', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2023',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2023', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2022',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2022', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2021',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2021', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2020',          isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2020', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2019',          isTV: false, pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2019', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies 2018',          isTV: false, pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', primary_release_year: '2018', sort_by: 'popularity.desc' } },
  { label: 'Prime Movies Older',         isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', 'primary_release_date.lte': '2017-12-31', sort_by: 'popularity.desc' } },

  // ── Prime Video Series / Web Series ──────────────────────────────────────
  { label: 'Prime Series (Popular)',     isTV: true,  pages: 10,
    params: { with_watch_providers: '9|119', watch_region: 'IN', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2026',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2026', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2025',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2025', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2024',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2024', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2023',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2023', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2022',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2022', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2021',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2021', sort_by: 'popularity.desc' } },
  { label: 'Prime Series 2020',          isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', first_air_date_year: '2020', sort_by: 'popularity.desc' } },
  { label: 'Prime Series Older',         isTV: true,  pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', 'first_air_date.lte': '2019-12-31', sort_by: 'popularity.desc' } },

  // ── Hindi Prime Originals ─────────────────────────────────────────────────
  { label: 'Prime Hindi Movies',         isTV: false, pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc' } },
  { label: 'Prime Hindi Series',         isTV: true,  pages: 5,
    params: { with_watch_providers: '9|119', watch_region: 'IN', with_original_language: 'hi', sort_by: 'popularity.desc' } },

  // ── South Indian Prime Originals ──────────────────────────────────────────
  { label: 'Prime Tamil Movies',         isTV: false, pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', with_original_language: 'ta', sort_by: 'popularity.desc' } },
  { label: 'Prime Telugu Movies',        isTV: false, pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', with_original_language: 'te', sort_by: 'popularity.desc' } },
  { label: 'Prime Malayalam Movies',     isTV: false, pages: 3,
    params: { with_watch_providers: '9|119', watch_region: 'IN', with_original_language: 'ml', sort_by: 'popularity.desc' } },
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
  console.log(`\n🎬  MKVCinemas Prime Video Import Bot — ${new Date().toISOString()}`);
  console.log('─'.repeat(60));

  console.log('📡  Fetching Prime Video candidates…\n');
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
    console.log('✅  Nothing new — all Prime Video content already in DB.\n');
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
      const categories = buildCategories(details, genreMap, item.isTV ? ['Web Series', 'Prime Video'] : ['Prime Video']);

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
