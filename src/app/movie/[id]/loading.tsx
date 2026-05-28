export default function MovieLoading() {
    return (
        <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-4 bg-neutral-800 rounded w-48 mb-6" />
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="aspect-[2/3] bg-neutral-800 rounded-lg" />
                </div>
                <div className="flex-1 space-y-4">
                    <div className="h-8 bg-neutral-800 rounded w-3/4" />
                    <div className="h-4 bg-neutral-800 rounded w-1/3" />
                    <div className="h-24 bg-neutral-800 rounded" />
                    <div className="h-4 bg-neutral-800 rounded w-1/2" />
                    <div className="h-4 bg-neutral-800 rounded w-2/3" />
                </div>
            </div>
            <div className="h-64 bg-neutral-800 rounded-lg mb-8" />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-neutral-800 rounded" />
                ))}
            </div>
        </div>
    );
}
