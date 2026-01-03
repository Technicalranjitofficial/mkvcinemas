
import prisma from '@/lib/prisma';
import MovieForm from '@/components/admin/MovieForm';
import { updateMovie } from '@/app/actions/movie';
import { notFound } from 'next/navigation';

interface EditMoviePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditMoviePage({ params }: EditMoviePageProps) {
    const { id } = await params;
    const movie = await prisma.movie.findUnique({
        where: {
            id,
        },
    });

    if (!movie) {
        notFound();
    }

    // Transform explicit 'any' types if necessary, though direct passing usually works if types match
    // The MovieForm expects specific types, but Prisma return types should be compatible with optional fields if handled correctly.
    // We might need to ensure arrays are arrays.

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Edit Movie: {movie.title}</h1>
            <MovieForm
                action={updateMovie.bind(null, movie.id)}
                initialData={movie}
                isEdit={true}
            />
        </div>
    );
}
