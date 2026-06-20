/**
 * MKVCinemas — OTT Tag Script (Batch Edition)
 * Checks TMDB watch-providers for every untagged title and adds the
 * matching OTT platform tag(s) if found.
 *
 * Run: node --env-file=.env scripts/tag-netflix.mjs
 *
 * Rate math:
 *   BATCH_SIZE = 8 concurrent TMDB requests
 *   BATCH_DELAY = 350ms between batches
 *   → ~23 req/s  (TMDB hard limit = 40 req/s)
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TMDB_BASE   = 'https://api.themoviedb.org/3';
const TMDB_KEY    = process.env.TMDB_API_KEY;
const BATCH_SIZE  = 8;
const BATCH_DELAY = 350;
const RETRY_DELAY = 1500;

const OTT_PLATFORMS = [
  { tag: 'Netflix',     ids: [8]        },
  { tag: 'Prime Video', ids: [9, 119]   },
  { tag: 'Disney+',     ids: [337, 122] },
  { tag: 'Apple TV+',   ids: [350]      },
  { tag: 'HBO',         ids: [384, 1899]},
  { tag: 'Hulu',        ids: [15]       },
  { tag: 'Zee5',        ids: [232]      },
  { tag: 'SonyLIV',     ids: [237]      },
  { tag: 'JioCinema',   ids: [220]      },
  { tag: 'MX Player',   ids: [515]      },
  { tag: 'Aha',         ids: [532]      },
];

const ALL_OTT_TAGS = OTT_PLATFORMS.map(p => p.tag);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tmdbGet(path, attempt = 1) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MKVCinemas-Bot/1.0', Accept: 'application/json' },
    });
    if (res.status === 404) return null;
    if (res.status === 429) {
      const wait = parseInt(res.headers.get('Retry-After') ?? '3', 10);
      console.log(`\n  ⚠  Rate limited — waiting ${wait}s...`);
      await sleep(wait * 1000);
      return tmdbGet(path, attempt);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    if (attempt < 3) { await sleep(attempt * RETRY_DELAY); return tmdbGet(path, attempt + 1); }
    return null;
  }
}

async function detectOTT(tmdbId, isTV) {
  const type = isTV ? 'tv' : 'movie';
  const data = await tmdbGet(`/${type}/${tmdbId}/watch/providers`);
  if (!data?.results) return [];
  const foundIds = new Set();
  for (const region of Object.values(data.results)) {
    for (const p of [
      ...(region.flatrate ?? []),
      ...(region.rent     ?? []),
      ...(region.buy      ?? []),
      ...(region.free     ?? []),
    ]) foundIds.add(p.provider_id);
  }
  return OTT_PLATFORMS
    .filter(platform => platform.ids.some(id => foundIds.has(id)))
    .map(platform => platform.tag);
}

async function checkRecord(rec) {
  const isTV    = rec.categories?.includes('Web Series') ?? false;
  const ottTags = await detectOTT(rec.tmdbId, isTV);
  const newTags = ottTags.filter(t => !rec.categories?.includes(t));
  return { id: rec.id, newTags };
}

async function main() {
  if (!TMDB_KEY) { console.error('❌  TMDB_API_KEY not set.'); process.exit(1); }

  console.log(`\n🏷️   MKVCinemas — OTT Tag Script — ${new Date().toISOString()}`);
  console.log('─'.repeat(60));
  console.log('  Platforms:', ALL_OTT_TAGS.join(', '));
  console.log('─'.repeat(60));

  const records = await prisma.movie.findMany({
    select: { id: true, title: true, tmdbId: true, categories: true },
    where: { tmdbId: { not: null } },
  });

  const toCheck = records.filter(r =>
    !ALL_OTT_TAGS.some(tag => r.categories?.includes(tag))
  );

  const total = toCheck.length;
  const totalBatches = Math.ceil(total / BATCH_SIZE);
  console.log(`📦  ${total} titles to check  |  batch: ${BATCH_SIZE}  |  ~${totalBatches} batches\n`);

  let tagged = 0, notFound = 0, processed = 0;
  const tagCounts = Object.fromEntries(ALL_OTT_TAGS.map(t => [t, 0]));

  for (let b = 0; b < totalBatches; b++) {
    const batch = toCheck.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const results = await Promise.all(batch.map(checkRecord));

    const toUpdate = results.filter(r => r.newTags.length > 0);
    await Promise.all(
      toUpdate.map(({ id, newTags }) =>
        prisma.movie.update({
          where: { id },
          data: { categories: { push: newTags } },
        })
      )
    );

    for (const { newTags } of results) {
      if (newTags.length > 0) {
        tagged++;
        for (const t of newTags) if (tagCounts[t] !== undefined) tagCounts[t]++;
      } else {
        notFound++;
      }
    }
    processed += batch.length;

    const pct = Math.round((processed / total) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(
      `\r  [${bar}] ${pct}%  Batch ${b + 1}/${totalBatches}  ✅ Tagged: ${tagged}  ⬜ None: ${notFound}  `
    );

    if (b < totalBatches - 1) await sleep(BATCH_DELAY);
  }

  console.log(`\n\n${'─'.repeat(60)}`);
  console.log(`🏁  Done!  Total checked: ${processed}\n`);
  console.log('  Tags applied:');
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > 0) console.log(`    ${tag.padEnd(14)} → ${count}`);
  }
  console.log(`\n    ⬜  No OTT found  → ${notFound}\n`);
}

main()
  .catch(e => { console.error('\nFatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
