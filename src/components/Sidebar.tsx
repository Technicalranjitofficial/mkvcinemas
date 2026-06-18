import Link from 'next/link';
import { Send } from 'lucide-react';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { movieSlug } from '@/lib/slug';

// ── Live "Recent Updates" — streamed via Suspense ─────────────────────────
async function RecentUpdatesList() {
    const recent = await prisma.movie.findMany({
        select: { id: true, title: true, year: true, quality: true, audio: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
    });

    return (
        <ul className="space-y-3">
            {recent.map((m) => (
                <li key={m.id}>
                    <Link
                        href={`/watch/${movieSlug(m.title, m.id)}`}
                        className="text-xs text-neutral-300 hover:text-red-400 transition-colors line-clamp-2 block leading-relaxed"
                    >
                        {m.title} ({m.year}) {m.quality} {m.audio}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function RecentUpdatesSkeleton() {
    return (
        <ul className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="space-y-1">
                    <div className="h-3 bg-neutral-800 rounded w-full" />
                    <div className="h-3 bg-neutral-800 rounded w-3/4" />
                </li>
            ))}
        </ul>
    );
}

export default function Sidebar() {
    return (
        <aside className="w-full lg:w-80 shrink-0 space-y-8">
            {/* Telegram Widget */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Send className="text-blue-500" size={20} />
                    Join Telegram
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                    Get instant updates on new movie releases and request movies.
                </p>
                <a
                    href="https://t.me/mkvcinemasworld"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-md font-medium transition-colors"
                >
                    Join Channel
                </a>
            </div>

            {/* Categories */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <h3 className="text-white font-bold mb-3 border-l-4 border-red-600 pl-3">
                    Categories
                </h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                    {[
                        { label: 'Bollywood',    slug: 'bollywood'    },
                        { label: 'Hollywood',    slug: 'hollywood'    },
                        { label: 'South Indian', slug: 'south-indian' },
                        { label: 'Web Series',   slug: 'web-series'   },
                        { label: 'Dual Audio',   slug: 'dual-audio'   },
                        { label: 'Action',       slug: 'action'       },
                    ].map(({ label, slug }) => (
                        <li key={slug}>
                            <Link
                                href={`/category/${slug}`}
                                className="hover:text-red-500 transition-colors block py-1 border-b border-neutral-800/50"
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* OTT Platforms */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <h3 className="text-white font-bold mb-3 border-l-4 border-sky-500 pl-3">
                    OTT Platforms
                </h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                    {[
                        { label: 'Netflix',     slug: 'netflix',       color: 'text-red-500'    },
                        { label: 'Prime Video', slug: 'prime-video',   color: 'text-sky-400'    },
                        { label: 'Disney+',     slug: 'disney-plus',   color: 'text-blue-400'   },
                        { label: 'HBO',         slug: 'hbo',           color: 'text-purple-400' },
                        { label: 'Zee5',        slug: 'zee5',          color: 'text-violet-400' },
                        { label: 'SonyLIV',     slug: 'sonyliv',       color: 'text-pink-400'   },
                        { label: 'JioCinema',   slug: 'jiocinema',     color: 'text-indigo-400' },
                        { label: 'Apple TV+',   slug: 'apple-tv-plus', color: 'text-neutral-300'},
                    ].map(({ label, slug, color }) => (
                        <li key={slug}>
                            <Link
                                href={`/category/${slug}`}
                                className={`${color} hover:brightness-125 transition-all block py-1 border-b border-neutral-800/50 font-medium`}
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Recent Updates — live DB data, streamed in via Suspense */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <h3 className="text-white font-bold mb-3 border-l-4 border-yellow-500 pl-3">
                    Recent Updates
                </h3>
                <Suspense fallback={<RecentUpdatesSkeleton />}>
                    <RecentUpdatesList />
                </Suspense>
            </div>
        </aside>
    );
}
