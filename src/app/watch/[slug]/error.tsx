'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl mb-6">🎬</p>
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-neutral-400 text-sm mb-8">
        We couldn&apos;t load this movie. Try refreshing or go back home.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
