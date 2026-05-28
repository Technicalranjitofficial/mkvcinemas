'use client';

import { useEffect } from 'react';

export default function MovieError({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Failed to load movie</h2>
            <p className="text-neutral-500 mb-6 text-sm">{error.message || 'An unexpected error occurred.'}</p>
            <button onClick={reset} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors">
                Try again
            </button>
        </div>
    );
}
