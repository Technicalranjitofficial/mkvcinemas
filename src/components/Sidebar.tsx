import Link from 'next/link';
import { Send } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
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
                    {['Bollywood', 'Hollywood', 'South Indian', 'Punjabi', 'Web Series', 'Dual Audio', 'Netflix', 'Amazon Prime'].map((cat) => (
                        <li key={cat}>
                            <Link href={`/category/${cat.toLowerCase().replace(' ', '-')}`} className="hover:text-red-500 transition-colors block py-1 border-b border-neutral-800/50">
                                {cat}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Recent Posts - text only list */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <h3 className="text-white font-bold mb-3 border-l-4 border-yellow-500 pl-3">
                    Recent Updates
                </h3>
                <ul className="space-y-3">
                    {[
                        "Pushpa 2: The Rule (2024)",
                        "Kalki 2898 AD (2024)",
                        "Deadpool & Wolverine (2024)",
                        "Stree 2 (2024)",
                        "Mirzapur Season 3"
                    ].map((item, i) => (
                        <li key={i}>
                            <Link href="#" className="text-xs text-neutral-300 hover:text-red-400 transition-colors line-clamp-2">
                                {item} Download 480p, 720p, 1080p
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
