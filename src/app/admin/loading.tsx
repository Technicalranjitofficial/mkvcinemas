export default function AdminLoading() {
    return (
        <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-neutral-800 rounded w-40" />
                <div className="h-6 bg-neutral-800 rounded w-32" />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="h-12 bg-black border-b border-neutral-800" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border-b border-neutral-800">
                        <div className="h-4 bg-neutral-800 rounded flex-1" />
                        <div className="h-4 bg-neutral-800 rounded w-20" />
                        <div className="h-4 bg-neutral-800 rounded w-16" />
                        <div className="h-4 bg-neutral-800 rounded w-24" />
                        <div className="h-4 bg-neutral-800 rounded w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
