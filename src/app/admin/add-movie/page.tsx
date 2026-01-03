'use client';

import { createMovie } from '@/app/actions/movie';
import MovieForm from '@/components/admin/MovieForm';

export default function AddMoviePage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Add New Movie</h1>
            <MovieForm action={createMovie} />
        </div>
    );
}
