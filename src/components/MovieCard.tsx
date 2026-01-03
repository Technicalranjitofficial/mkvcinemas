import Link from 'next/link';

interface MovieCardProps {
    id: string;
    title: string;
    posterUrl: string;
    quality: string; // e.g., "720p HEVC"
    audio: string; // e.g., "Dual Audio [Hin-Eng]"
    year: number;
}

export default function MovieCard({ id, title, posterUrl, quality, audio, year }: MovieCardProps) {
    return (
        <Link href={`/movie/${id}`} className="group block bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden hover:border-neutral-700 transition-colors">
            <div className="relative aspect-[2/3] overflow-hidden">
                {/* Poster Image - using a simple img tag for now if external, or next/image if configured */}
                <img
                    src={posterUrl}
                    alt={title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />

                {/* Overlay Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="bg-yellow-600 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                        {audio.includes("Dual") ? "Dual Audio" : "HINDI"}
                    </span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        {quality}
                    </span>
                </div>
            </div>

            <div className="p-3">
                <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 group-hover:text-red-500 transition-colors" title={title}>
                    {title} ({year})
                </h3>
                <div className="mt-2 text-xs text-neutral-500 flex justify-between">
                    <span>BluRay</span>
                    <span>{year}</span>
                </div>
            </div>
        </Link>
    );
}
