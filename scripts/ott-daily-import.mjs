/**
 * OTT Full Catalogue Import Worker
 *
 * Fetches EVERY movie & series available on Netflix, Prime Video, Disney+,
 * Apple TV+, HBO Max, Zee5, SonyLIV, JioCinema, Paramount+, Voot, Aha,
 * MX Player and MUBI via the TMDB watch-provider discover API.
 *
 * No date filter — fetches all titles ever available on each platform.
 * All pages are fetched (TMDB max: 500 pages × 20 = up to 10,000 per query).
 *
 * Lifecycle:
 *   1. Runs immediately on startup
 *   2. Repeats every 24 hours to pick up new additions
 *
 * Run locally:  node --env-file=.env scripts/ott-daily-import.mjs
 * In Docker:    env vars injected by docker-compose
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TMDB_KEY   = process.env.TMDB_API_KEY;
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const DELAY      = 270;   // ms between HTTP requests (~3.7 req/s, well under 40/s limit)
const MAX_PAGES  = 500;   // TMDB hard limit

// ── OTT platforms to scan ─────────────────────────────────────────────────
// Each entry can have multiple watch-provider IDs (pipe-separated for TMDB).
// region: the country where the platform is active on TMDB.
const OTT_PLATFORMS = [
  // ── Indian OTT ──────────────────────────────────────────────────────────
  { tag: 'Netflix',     ids: '8',          region: 'IN' },
  { tag: 'Prime Video', ids: '9|119',      region: 'IN' },
  { tag: 'Disney+',     ids: '122|337',    region: 'IN' }, // Disney+ Hotstar IN
  { tag: 'Zee5',        ids: '232',        region: 'IN' },
  { tag: 'SonyLIV',     ids: '237',        region: 'IN' },
  { tag: 'JioCinema',   ids: '220',        region: 'IN' },
  { tag: 'Voot',        ids: '121',        region: 'IN' },
  { tag: 'Aha',         ids: '532',        region: 'IN' },
  { tag: 'MX Player',   ids: '515',        region: 'IN' },
  // ── International OTT (US catalogue) ────────────────────────────────────
  { tag: 'Apple TV+',   ids: '350',        region: 'US' },
  { tag: 'HBO',         ids: '384|1899',   region: 'US' }, // HBO Max / Max
  { tag: 'Paramount+',  ids: '531',        region: 'US' },
  { tag: 'MUBI',        ids: '11',         region: 'US' },
];

// ── Language → Audio label mapping ───────────────────────────────────────
const LANG_MAP = {
  hi: 'Hindi',   en: 'English',  ta: 'Tamil',    te: 'Telugu',
  ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali',  mr: 'Marathi',
  pa: 'Punjabi', gu: 'Gujarati', or: 'Odia',      ur: 'Urdu',
  ja: 'Japanese', ko: 'Korean',  zh: 'Chinese',   fr: 'French',
  es: 'Spanish', de: 'German',   it: 'Italian',   pt: 'Portuguese',
};

function langToAudio(code) {
  return LANG_MAP[code] ?? 'Multi Audio';
}

// ── Utilities ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'MKVCinemas-Worker/2.0' },
      });
      if (res.status === 429) {
        const wait = parseInt(res.headers.get('Retry-After') ?? '5', 10);
        console.log(`  ⚠  Rate limited — waiting ${wait}s`);
        await sleep(wait * 1000 + 500);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt === 4) { console.error(`  ✗  ${path}: ${e.message}`); return null; }
      await sleep(attempt * 800);
    }
  }
  return null;
}

/**
 * Fetch ALL pages for a platform + media type from TMDB discover.
 * Returns an array of all result items across every page.
 */
async function fetchAllPages(platform, type) {
  const results = [];
  let page = 1;
  let totalPages = 1; // will be updated from first response

  process.stdout.write(`     ${type.padEnd(6)} [page `);

  while (page <= totalPages && page <= MAX_PAGES) {
    const data = await tmdbFetch(`/discover/${type}`, {
      with_watch_providers: platform.ids,
      watch_region:         platform.region,
      sort_by:              'popularity.desc',
      'vote_count.gte':     2,
      include_adult:        false,
      page,
    });

    if (!data?.results?.length) break;

    if (page === 1) {
      totalPages = Math.min(data.total_pages ?? 1, MAX_PAGES);
      process.stdout.write(`1-${totalPages}]: `);
    }

    results.push(...data.results);

    // Progress dot every 10 pages
    if (page % 10 === 0) process.stdout.write('.');

    page++;
    await sleep(DELAY);
  }

  process.stdout.write(` ${results.length} titles\n`);
  return results;
}

/** Upsert one title — returns 'created' | 'tagged' | 'skip' */
async function upsertTitle(tmdbResult, type, ottTag) {
  const tmdbId = String(tmdbResult.id);

  // ── Already in DB? just ensure the OTT tag is present ───────────────────
  const existing = await prisma.movie.findFirst({ where: { tmdbId } });
  if (existing) {
    if (!existing.categories.includes(ottTag)) {
      await prisma.movie.update({
        where: { id: existing.id },
        data:  { categories: { push: ottTag } },
      });
      return 'tagged';
    }
    return 'skip';
  }

  // ── New title — fetch full details from TMDB ─────────────────────────────
  const details = await tmdbFetch(`/${type}/${tmdbId}`, { append_to_response: 'credits' });
  if (!details?.poster_path) return 'skip'; // no poster → skip

  await sleep(DELAY);

  const title       = (type === 'movie' ? details.title   : details.name)?.trim();
  if (!title) return 'skip';

  const releaseDate = type === 'movie' ? details.release_date : details.first_air_date;
  const year        = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : new Date().getFullYear();
  const plot        = details.overview?.trim() || 'No description available.';
  const rating      = Math.round((details.vote_average ?? 0) * 10) / 10;
  const posterUrl   = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
  const director    = details.credits?.crew?.find(c => c.job === 'Director')?.name ?? '';
  const cast        = details.credits?.cast?.slice(0, 6).map(c => c.name).join(', ') ?? '';
  const genres      = (details.genres ?? []).map(g => g.name);
  const audio       = langToAudio(details.original_language);

  // Build category list: OTT tag + genre tags + Web Series for TV
  const categories = [
    ...new Set([
      ottTag,
      ...genres,
      ...(type === 'tv' ? ['Web Series'] : []),
    ]),
  ];

  try {
    await prisma.movie.create({
      data: {
        title, year, rating,
        quality:       'HD',
        audio,
        size:          'OTT Streaming',
        plot, director, cast, posterUrl, tmdbId,
        screenshots:   [],
        categories,
        downloadLinks: [],
        streamLinks:   [],
      },
    });
    return 'created';
  } catch (e) {
    if (e.code === 'P2002') return 'skip'; // race-condition duplicate
    console.error(`  ✗ DB error for "${title}": ${e.message}`);
    return 'skip';
  }
}

// ── Main import run ───────────────────────────────────────────────────────
async function runImport() {
  if (!TMDB_KEY) {
    console.error('❌  TMDB_API_KEY not set — aborting.');
    return;
  }

  const startTime = Date.now();
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`🚀  OTT Full Catalogue Import — ${new Date().toISOString()}`);
  console.log(`    Platforms : ${OTT_PLATFORMS.length}  (movies + series, all pages)`);
  console.log(`${'═'.repeat(64)}`);

  let totalCreated = 0, totalTagged = 0, totalSkipped = 0;

  for (const platform of OTT_PLATFORMS) {
    console.log(`\n📺  ${platform.tag}  (region: ${platform.region})`);
    let pCreated = 0, pTagged = 0, pSkipped = 0;

    for (const type of ['movie', 'tv']) {
      const list = await fetchAllPages(platform, type);
      let cCreated = 0, cTagged = 0;

      for (const item of list) {
        const result = await upsertTitle(item, type, platform.tag);
        if (result === 'created')     { cCreated++; pCreated++; }
        else if (result === 'tagged') { cTagged++;  pTagged++;  }
        else                          { pSkipped++; }
        await sleep(DELAY);
      }

      console.log(`     └─ ✅ +${cCreated} new   🏷  +${cTagged} tagged`);
    }

    totalCreated += pCreated;
    totalTagged  += pTagged;
    totalSkipped += pSkipped;

    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`   Platform total: +${pCreated} new  +${pTagged} tagged  ${pSkipped} skipped  [${elapsed}m elapsed]`);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`🏁  Import complete in ${totalMin} minutes`);
  console.log(`    ✅ New titles added : ${totalCreated}`);
  console.log(`    🏷  OTT tags added  : ${totalTagged}`);
  console.log(`    ⬜ Already present  : ${totalSkipped}`);
  console.log(`${'─'.repeat(64)}\n`);
}

// ── Schedule: run immediately, then every 24 h ────────────────────────────
const INTERVAL_MS = 24 * 60 * 60 * 1000;

runImport()
  .then(() => {
    const next = new Date(Date.now() + INTERVAL_MS).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`⏰  Next run: ${next} IST`);
    setInterval(() => {
      runImport().catch(e => console.error('Import cycle error:', e.message));
    }, INTERVAL_MS);
  })
  .catch(async (e) => {
    console.error('Fatal error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n🛑  SIGTERM — graceful shutdown');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑  SIGINT — graceful shutdown');
  await prisma.$disconnect();
  process.exit(0);
});
