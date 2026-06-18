import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const { tmdbId } = await params;
  const TMDB_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_KEY || !tmdbId) return NextResponse.json({ key: null });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${TMDB_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ key: null });

    const data = await res.json();
    type Video = { site: string; type: string; key: string; official?: boolean };
    const videos: Video[] = data.results ?? [];

    const trailer =
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
      videos.find(v => v.site === 'YouTube' && v.type === 'Teaser');

    return NextResponse.json({ key: trailer?.key ?? null });
  } catch {
    return NextResponse.json({ key: null });
  }
}
