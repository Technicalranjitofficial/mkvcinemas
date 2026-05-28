export default function CategoryLoading() {
    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
            <div className="flex-1">
                <div className="h-8 bg-neutral-800 rounded w-56 mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="aspect-[2/3] bg-neutral-800 rounded-lg" />
                            <div className="h-4 bg-neutral-800 rounded w-3/4" />
                            <div className="h-3 bg-neutral-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full lg:w-80 space-y-4">
                <div className="h-32 bg-neutral-800 rounded-md" />
                <div className="h-48 bg-neutral-800 rounded-md" />
            </div>
        </div>
    );
}
