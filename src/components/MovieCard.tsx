import Link from 'next/link';

interface MovieCardProps {
    id: string;
    title: string;
    posterUrl: string;
    quality: string;
    audio: string;
    year: number;
}

function getAudioBadge(audio: string): { label: string; color: string } {
    const a = audio.toLowerCase();
    if (a.includes('dual')) return { label: 'Dual Audio', color: 'bg-yellow-500 text-black' };
    if (a.includes('multi')) return { label: 'Multi Audio', color: 'bg-purple-600 text-white' };
    if (a.includes('tamil')) return { label: 'Tamil', color: 'bg-green-600 text-white' };
    if (a.includes('telugu')) return { label: 'Telugu', color: 'bg-cyan-600 text-white' };
    if (a.includes('malayalam')) return { label: 'Malayalam', color: 'bg-teal-600 text-white' };
    if (a.includes('hindi')) return { label: 'Hindi', color: 'bg-orange-500 text-white' };
    if (a.includes('english')) return { label: 'English', color: 'bg-blue-600 text-white' };
    if (a.includes('kannada')) return { label: 'Kannada', color: 'bg-red-600 text-white' };
    if (a.includes('bengali')) return { label: 'Bengali', color: 'bg-pink-600 text-white' };
    return { label: audio.split(' ')[0], color: 'bg-neutral-600 text-white' };
}

export default function MovieCard({ id, title, posterUrl, quality, audio, year }: MovieCardProps) {
    const audioBadge = getAudioBadge(audio);

    return (
        <Link href={`/movie/${id}`} className="group block bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden hover:border-neutral-700 transition-colors">
            <div className="relative aspect-[2/3] overflow-hidden">
                <img
                    src={posterUrl}
                    alt={title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`${audioBadge.color} text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase`}>
                        {audioBadge.label}
                    </span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        {quality}
                    </span>
                </div>

                {/* Year badge bottom-right */}
                <div className="absolute bottom-2 right-2">
                    <span className="bg-black/70 text-neutral-300 text-[10px] px-1.5 py-0.5 rounded-sm">
                        {year}
                    </span>
                </div>
            </div>

            <div className="p-2.5">
                <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 group-hover:text-red-500 transition-colors leading-tight" title={title}>
                    {title}
                </h3>
                <p className="mt-1 text-[11px] text-neutral-500 truncate">{audio}</p>
            </div>
        </Link>
    );
}
