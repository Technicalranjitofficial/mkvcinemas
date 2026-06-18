/**
 * OTT Daily Import Worker
 *
 * Fetches the latest movies & series from Netflix, Prime Video, Disney+,
 * Apple TV+, HBO, Zee5, SonyLIV and JioCinema via TMDB watch-providers,
 * then upserts them into MongoDB Atlas.
 *
 * Lifecycle:
 *   1. Runs immediately on startup (so the first run happens right after deploy)
 *   2. Repeats every 24 hours automatically
 *
 * Run locally:  node --env-file=.env scripts/ott-daily-import.mjs
 * In Docker:    env vars injected by docker-compose (no --env-file needed)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TMDB_KEY  = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const DELAY     = 280;   // ms between requests  (~3.5 req/s, well under 40/s limit)
const DAYS_BACK = 60;    // fetch titles released in the last N days

// ── OTT platforms to scan ─────────────────────────────────────────────────
const OTT_PLATFORMS = [
  { tag: 'Netflix',     ids: '8',        region: 'IN' },
  { tag: 'Prime Video', ids: '9|119',    region: 'IN' },
  { tag: 'Disney+',     ids: '337|122',  region: 'IN' },
  { tag: 'Apple TV+',   ids: '350',      region: 'US' },
  { tag: 'HBO',         ids: '384|1899', region: 'US' },
  { tag: 'Zee5',        ids: '232',      region: 'IN' },
  { tag: 'SonyLIV',     ids: '237',      region: 'IN' },
  { tag: 'JioCinema',   ids: '220',      region: 'IN' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'MKVCinemas-Worker/1.0' },
      });
      if (res.status === 429) {
        const wait = parseInt(res.headers.get('Retry-After') ?? '3', 10);
        console.log(`  ⚠  Rate limited — waiting ${wait}s`);
        await sleep(wait * 1000);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
      return res.json();
    } catch (e) {
      if (attempt === 3) { console.error(`  ✗  ${path}: ${e.message}`); return null; }
      await sleep(attempt * 600);
    }
  }
  return null;
}

/** Fetch 3 pages of discover results for one platform + type */
async function fetchOTTList(platform, type) {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const results   = [];
  for (let page = 1; page <= 3; page++) {
    const data = await tmdbFetch(`/discover/${type}`, {
      with_watch_providers: platform.ids,
      watch_region:         platform.region,
      [`${dateField}.gte`]: daysAgo(DAYS_BACK),
      sort_by:              `${dateField}.desc`,
      'vote_count.gte':     3,
      page,
    });
    if (!data?.results?.length) break;
    results.push(...data.results);
    await sleep(DELAY);
  }
  return results;
}

const LANG_MAP = {
  hi: 'Hindi', en: 'English', ta: 'Tamil', te: 'Telugu',
  ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali', mr: 'Marathi',
  pa: 'Punjabi', gu: 'Gujarati', or: 'Odia',
};

function langToAudio(code) {
  return LANG_MAP[code] ?? 'Multi Audio';
}

/** Upsert one title — returns 'created' | 'tagged' | 'skip' */
async function upsertTitle(tmdbResult, type, ottTag) {
  const tmdbId = String(tmdbResult.id);

  // ── Already in DB? ──────────────────────────────────────────────────────
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

  // ── Fetch full TMDB details ──────────────────────────────────────────────
  const details = await tmdbFetch(`/${type}/${tmdbId}`, { append_to_response: 'credits' });
  if (!details?.poster_path) return 'skip';

  await sleep(DELAY);

  const title       = type === 'movie' ? details.title   : details.name;
  const releaseDate = type === 'movie' ? details.release_date : details.first_air_date;
  const year        = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : new Date().getFullYear();
  const plot        = details.overview || 'No description available.';
  const rating      = Math.round((details.vote_average ?? 0) * 10) / 10;
  const posterUrl   = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
  const director    = details.credits?.crew?.find(c => c.job === 'Director')?.name ?? '';
  const cast        = details.credits?.cast?.slice(0, 6).map(c => c.name).join(', ') ?? '';
  const genres      = (details.genres ?? []).map(g => g.name);
  const audio       = langToAudio(details.original_language);

  const categories = [...new Set([ottTag, ...genres, ...(type === 'tv' ? ['Web Series'] : [])])];

  try {
    await prisma.movie.create({
      data: {
        title, year, rating,
        quality: 'HD',
        audio,
        size: 'OTT Streaming',
        plot, director, cast, posterUrl, tmdbId,
        screenshots:   [],
        categories,
        downloadLinks: [],
        streamLinks:   [],
      },
    });
    return 'created';
  } catch (e) {
    if (e.code === 'P2002') return 'skip'; // duplicate
    console.error(`  ✗ DB error for ${title}: ${e.message}`);
    return 'skip';
  }
}

// ── Main import run ───────────────────────────────────────────────────────
async function runImport() {
  if (!TMDB_KEY) { console.error('❌  TMDB_API_KEY not set — aborting.'); return; }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀  OTT Daily Import — ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(60)}`);

  let totalCreated = 0, totalTagged = 0, totalSkipped = 0;

  for (const platform of OTT_PLATFORMS) {
    console.log(`\n📺  ${platform.tag} (region: ${platform.region})`);
    let created = 0, tagged = 0;

    for (const type of ['movie', 'tv']) {
      const list = await fetchOTTList(platform, type);
      process.stdout.write(`   ${type.padEnd(6)}: ${list.length.toString().padStart(3)} found → `);

      for (const item of list) {
        const status = await upsertTitle(item, type, platform.tag);
        if (status === 'created') created++;
        else if (status === 'tagged') tagged++;
        else totalSkipped++;
        await sleep(DELAY);
      }
      console.log(`✅ +${created} new  🏷 +${tagged} tagged`);
    }

    console.log(`   Platform total: created ${created}  tagged ${tagged}`);
    totalCreated += created;
    totalTagged  += tagged;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🏁  Finished!`);
  console.log(`    ✅ New titles : ${totalCreated}`);
  console.log(`    🏷  OTT tags  : ${totalTagged}`);
  console.log(`    ⬜ Skipped    : ${totalSkipped}`);
  console.log(`${'─'.repeat(60)}\n`);
}

// ── Schedule: run now, then every 24h ─────────────────────────────────────
const INTERVAL_MS = 24 * 60 * 60 * 1000;

runImport()
  .then(() => {
    const nextRun = new Date(Date.now() + INTERVAL_MS).toISOString();
    console.log(`⏰  Next run at ${nextRun}`);
    setInterval(() => {
      runImport().catch(e => console.error('Import error:', e));
    }, INTERVAL_MS);
  })
  .catch(async (e) => {
    console.error('Fatal error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n🛑  SIGTERM received — shutting down worker');
  await prisma.$disconnect();
  process.exit(0);
});
