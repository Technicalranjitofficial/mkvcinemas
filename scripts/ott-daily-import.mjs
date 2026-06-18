/**
 * OTT Full Catalogue Import — FAST VERSION
 *
 * Speed improvements:
 *  1. Uses discover data directly — no extra TMDB detail API call per title
 *  2. Genre IDs resolved from a cached map (2 API calls total, not N)
 *  3. Bulk DB existence check pre-loaded into memory Set (1 query at start)
 *  4. Parallel DB inserts (10 concurrent, not sequential)
 *  5. Delay only between page fetches, not between every insert
 *
 * Run: node --env-file=.env scripts/ott-daily-import.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma    = new PrismaClient();
const TMDB_KEY  = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const PAGE_DELAY = 200;   // ms pause between page batches (not per page)
const BATCH_SIZE = 10;    // parallel DB inserts per batch
const MAX_PAGES  = 500;

const OTT_PLATFORMS = [
  { tag: 'Netflix',     ids: '8',        region: 'IN' },
  { tag: 'Prime Video', ids: '9|119',    region: 'IN' },
  { tag: 'Disney+',     ids: '122|337',  region: 'IN' },
  { tag: 'Zee5',        ids: '232',      region: 'IN' },
  { tag: 'SonyLIV',     ids: '237',      region: 'IN' },
  { tag: 'JioCinema',   ids: '220',      region: 'IN' },
  { tag: 'Voot',        ids: '121',      region: 'IN' },
  { tag: 'Aha',         ids: '532',      region: 'IN' },
  { tag: 'MX Player',   ids: '515',      region: 'IN' },
  { tag: 'Apple TV+',   ids: '350',      region: 'US' },
  { tag: 'HBO',         ids: '384|1899', region: 'US' },
  { tag: 'Paramount+',  ids: '531',      region: 'US' },
  { tag: 'MUBI',        ids: '11',       region: 'US' },
];

const LANG_MAP = {
  hi: 'Hindi',   en: 'English',  ta: 'Tamil',    te: 'Telugu',
  ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali',  mr: 'Marathi',
  pa: 'Punjabi', gu: 'Gujarati', or: 'Odia',      ur: 'Urdu',
  ja: 'Japanese', ko: 'Korean',  zh: 'Chinese',   fr: 'French',
  es: 'Spanish', de: 'German',   it: 'Italian',   pt: 'Portuguese',
};
const langToAudio = (code) => LANG_MAP[code] ?? 'Multi Audio';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function today()   { return new Date().toISOString().split('T')[0]; }

const SITE_URL      = 'https://www.mkvcinemas.world';
const INDEXNOW_KEY  = 'mkvcinemas-indexnow-7f3a2b8c4d1e9f0a';
const SITEMAP_URL   = `${SITE_URL}/sitemap.xml`;

/** Ping IndexNow with up to 10,000 URLs per call */
async function pingIndexNow(urls) {
  if (!urls.length) return;
  const chunks = [];
  for (let i = 0; i < urls.length; i += 10000) chunks.push(urls.slice(i, i + 10000));
  for (const chunk of chunks) {
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'www.mkvcinemas.world',
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: chunk,
        }),
      });
      console.log(`🔔  IndexNow: ${chunk.length} URLs pinged → HTTP ${res.status}`);
    } catch (e) {
      console.error(`⚠  IndexNow failed: ${e.message}`);
    }
  }
}

/** Ping Google & Bing sitemap endpoints */
async function pingSitemaps() {
  const endpoints = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      console.log(`🌐  Sitemap ping ${new URL(url).hostname}: HTTP ${r.status}`);
    } catch { /* non-blocking */ }
  }
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url.toString(), { headers: { 'User-Agent': 'MKVCinemas-Worker/3.0' } });
      if (res.status === 429) {
        const wait = parseInt(res.headers.get('Retry-After') ?? '5', 10);
        process.stdout.write(` [rate-limit ${wait}s] `);
        await sleep(wait * 1000 + 500);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt === 4) return null;
      await sleep(attempt * 800);
    }
  }
  return null;
}

async function buildGenreMap() {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch('/genre/movie/list'),
    tmdbFetch('/genre/tv/list'),
  ]);
  const map = new Map();
  for (const g of [...(movieGenres?.genres ?? []), ...(tvGenres?.genres ?? [])]) {
    map.set(g.id, g.name);
  }
  return map;
}

const PAGE_CONCURRENCY = 5; // fetch 5 pages at once — safe under TMDB's 40 req/s limit

async function fetchOnePage(platform, type, page, dateField) {
  return tmdbFetch(`/discover/${type}`, {
    with_watch_providers: platform.ids,
    watch_region:         platform.region,
    sort_by:              'popularity.desc',
    'vote_count.gte':     2,
    include_adult:        false,
    [`${dateField}.lte`]: today(),
    page,
  });
}

async function fetchAllPages(platform, type) {
  const results   = [];
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';

  process.stdout.write(`     ${type.padEnd(6)}: `);

  // Fetch page 1 first to get total_pages
  const first = await fetchOnePage(platform, type, 1, dateField);
  if (!first?.results?.length) { process.stdout.write(`0 titles\n`); return results; }

  const totalPages = Math.min(first.total_pages ?? 1, MAX_PAGES);
  results.push(...first.results);
  process.stdout.write(`[${totalPages}p] `);

  // Fetch remaining pages in parallel batches of PAGE_CONCURRENCY
  for (let page = 2; page <= totalPages; page += PAGE_CONCURRENCY) {
    const batch = [];
    for (let p = page; p < page + PAGE_CONCURRENCY && p <= totalPages; p++) {
      batch.push(fetchOnePage(platform, type, p, dateField));
    }
    const responses = await Promise.all(batch);
    for (const data of responses) {
      if (data?.results?.length) results.push(...data.results);
    }
    process.stdout.write('.');
    await sleep(PAGE_DELAY); // one short pause per batch, not per page
  }

  process.stdout.write(` ${results.length} titles\n`);
  return results;
}

async function processBatch(items, type, ottTag, genreMap, existingIds, newUrls) {
  let created = 0, tagged = 0;
  const todayStr = today();

  await Promise.all(items.map(async (item) => {
    const tmdbId = String(item.id);

    if (existingIds.has(tmdbId)) {
      try {
        const doc = await prisma.movie.findFirst({ where: { tmdbId }, select: { id: true, categories: true } });
        if (doc && !doc.categories.includes(ottTag)) {
          await prisma.movie.update({ where: { id: doc.id }, data: { categories: { push: ottTag } } });
          tagged++;
        }
      } catch { /* ignore */ }
      return;
    }

    if (!item.poster_path) return;
    const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
    if (!releaseDate || releaseDate > todayStr) return;

    const title = (type === 'movie' ? item.title : item.name)?.trim();
    if (!title) return;

    const year       = parseInt(releaseDate.split('-')[0], 10);
    const rating     = Math.round((item.vote_average ?? 0) * 10) / 10;
    const posterUrl  = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    const plot       = item.overview?.trim() || 'No description available.';
    const audio      = langToAudio(item.original_language);
    const genres     = (item.genre_ids ?? []).map(id => genreMap.get(id)).filter(Boolean);
    const categories = [...new Set([ottTag, ...genres, ...(type === 'tv' ? ['Web Series'] : [])])];

    try {
      const created_doc = await prisma.movie.create({
        data: {
          title, year, rating,
          quality: 'HD', audio,
          size: 'OTT Streaming',
          plot, director: '', cast: '',
          posterUrl, tmdbId,
          screenshots: [], categories,
          downloadLinks: [], streamLinks: [],
        },
      });
      existingIds.add(tmdbId);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,60);
      newUrls.push(`${SITE_URL}/watch/${slug}-${created_doc.id}`);
      created++;
    } catch (e) {
      if (e.code !== 'P2002') console.error(`  ✗ "${title}": ${e.message}`);
    }
  }));

  return { created, tagged };
}

async function runImport() {
  if (!TMDB_KEY) { console.error('TMDB_API_KEY not set'); return; }

  const startTime = Date.now();
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`🚀  OTT Fast Import — ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(64)}`);

  process.stdout.write('Loading genre map... ');
  const genreMap = await buildGenreMap();
  console.log(`${genreMap.size} genres`);

  process.stdout.write('Pre-loading existing tmdbIds... ');
  const existingDocs = await prisma.movie.findMany({ select: { tmdbId: true }, where: { tmdbId: { not: null } } });
  const existingIds  = new Set(existingDocs.map(d => d.tmdbId));
  console.log(`${existingIds.size} already in DB\n`);

  let totalCreated = 0, totalTagged = 0;
  const newUrls = [];

  for (const platform of OTT_PLATFORMS) {
    console.log(`📺  ${platform.tag}  (region: ${platform.region})`);
    let pCreated = 0, pTagged = 0;

    for (const type of ['movie', 'tv']) {
      const list = await fetchAllPages(platform, type);
      let cCreated = 0, cTagged = 0;

      for (let i = 0; i < list.length; i += BATCH_SIZE) {
        const { created, tagged } = await processBatch(list.slice(i, i + BATCH_SIZE), type, platform.tag, genreMap, existingIds, newUrls);
        cCreated += created;
        cTagged  += tagged;
      }

      console.log(`     └─ ✅ +${cCreated} new   🏷  +${cTagged} tagged`);
      pCreated += cCreated;
      pTagged  += cTagged;
    }

    totalCreated += pCreated;
    totalTagged  += pTagged;
    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`   Total: +${pCreated} new  +${pTagged} tagged  [${elapsed}m]\n`);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`${'─'.repeat(64)}`);
  console.log(`🏁  Done in ${totalMin} minutes  ✅ ${totalCreated} new  🏷 ${totalTagged} tagged`);
  console.log(`${'─'.repeat(64)}\n`);

  // ── Ping search engines ────────────────────────────────────────────────
  if (newUrls.length > 0) {
    console.log(`📡  Pinging search engines with ${newUrls.length} new URLs...`);
    await pingIndexNow(newUrls);
  }
  await pingSitemaps();
}

const INTERVAL_MS = 24 * 60 * 60 * 1000;

runImport()
  .then(() => {
    const next = new Date(Date.now() + INTERVAL_MS).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`⏰  Next run: ${next} IST`);
    setInterval(() => runImport().catch(e => console.error('Cycle error:', e.message)), INTERVAL_MS);
  })
  .catch(async (e) => { console.error('Fatal:', e); await prisma.$disconnect(); process.exit(1); });

process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
