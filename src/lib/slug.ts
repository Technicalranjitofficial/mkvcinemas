/**
 * Generates a SEO-friendly slug combining title + MongoDB ObjectId.
 * Example: "Avengers: Endgame (2019)", "6a18baa8c4a30a8781997e2d"
 *       -> "avengers-endgame-2019-6a18baa8c4a30a8781997e2d"
 */
export function movieSlug(title: string, id: string): string {
  const titlePart = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  return `${titlePart}-${id}`;
}

/**
 * Extracts the MongoDB ObjectId from a movie slug.
 * MongoDB ObjectIds are always exactly 24 hex characters.
 */
export function extractMovieId(slug: string): string {
  return slug.slice(-24);
}
