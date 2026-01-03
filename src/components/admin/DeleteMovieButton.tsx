'use client';

import { deleteMovie } from '@/app/actions/movie';
import { Trash } from 'lucide-react';

export default function DeleteMovieButton({ id }: { id: string }) {
    return (
        <button
            onClick={async () => {
                if (confirm('Are you sure you want to delete this movie?')) {
                    await deleteMovie(id);
                }
            }}
            className="p-2 bg-red-900/50 hover:bg-red-900 text-red-500 rounded transition-colors"
            title="Delete"
        >
            <Trash size={16} />
        </button>
    );
}
