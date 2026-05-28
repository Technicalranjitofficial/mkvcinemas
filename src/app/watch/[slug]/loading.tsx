export default function WatchLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-4 bg-neutral-800 rounded w-10" />
        <div className="h-4 bg-neutral-800 rounded w-1" />
        <div className="h-4 bg-neutral-800 rounded w-36" />
      </div>

      {/* Movie header card skeleton */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Poster */}
          <div className="w-36 h-54 sm:w-44 sm:h-66 shrink-0 bg-neutral-800 rounded-lg" />

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="h-8 bg-neutral-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-800 rounded w-16" />
            </div>
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-6 bg-neutral-800 rounded w-16" />
              <div className="h-6 bg-neutral-800 rounded w-20" />
              <div className="h-6 bg-neutral-800 rounded w-14" />
            </div>
            {/* Meta */}
            <div className="space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-48" />
              <div className="h-4 bg-neutral-800 rounded w-64" />
              <div className="h-4 bg-neutral-800 rounded w-32" />
            </div>
            {/* Plot */}
            <div className="space-y-1.5">
              <div className="h-3 bg-neutral-800 rounded w-full" />
              <div className="h-3 bg-neutral-800 rounded w-full" />
              <div className="h-3 bg-neutral-800 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Player skeleton */}
      <div className="mb-8">
        <div className="h-5 bg-neutral-800 rounded w-28 mb-3" />
        <div className="aspect-video bg-neutral-800 rounded-lg" />
      </div>
    </div>
  );
}
