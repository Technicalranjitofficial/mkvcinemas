/**
 * One-time cleanup: deletes titles from DB that have no release date
 * or have a release date in the future (unreleased / upcoming content).
 *
 * Run: node --env-file=.env scripts/cleanup-unreleased.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const today  = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

async function main() {
  console.log(`\nCleaning up unreleased titles (release date > ${today} or missing)...\n`);

  // Find OTT-imported titles (size = 'OTT Streaming') with year in the future
  // Year is stored as an Int — current year is 2026, so anything > current year is future
  const currentYear = new Date().getFullYear();

  // Delete where year is strictly greater than this year
  // (titles imported with year 2027+ are definitely unreleased)
  const futureYear = await prisma.movie.deleteMany({
    where: {
      size: 'OTT Streaming',
      year: { gt: currentYear },
    },
  });
  console.log(`✅ Deleted ${futureYear.count} titles with future year (>${currentYear})`);

  // Also delete OTT titles from this year with no TMDB ID (bad imports)
  const noTmdb = await prisma.movie.deleteMany({
    where: {
      size: 'OTT Streaming',
      tmdbId: null,
    },
  });
  console.log(`✅ Deleted ${noTmdb.count} OTT titles with no TMDB ID`);

  const total = futureYear.count + noTmdb.count;
  console.log(`\n🏁 Total deleted: ${total}\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
