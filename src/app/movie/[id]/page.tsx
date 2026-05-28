import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { movieSlug } from '@/lib/slug';

interface Props {
  params: Promise<{ id: string }>;
}

// Permanent redirect: /movie/[id] → /watch/[slug]
export default async function MovieRedirect({ params }: Props) {
  const { id } = await params;
  const movie = await prisma.movie.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!movie) notFound();
  redirect(`/watch/${movieSlug(movie.title, id)}`);
}
