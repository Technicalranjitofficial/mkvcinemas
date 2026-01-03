'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface StreamLink {
    server: string;
    url: string;
}

export default function StreamPlayer({ streamLinks }: { streamLinks: StreamLink[] }) {
    const [activeStream, setActiveStream] = useState(streamLinks[0]);

    if (!streamLinks || streamLinks.length === 0) {
        return null;
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            {/* Header / Tabs */}
            <div className="bg-black border-b border-neutral-800 p-2 flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-2 text-red-500 font-bold px-3 border-r border-neutral-800 mr-2">
                    <Play size={20} fill="currentColor" /> Watch Online
                </div>

                {streamLinks.map((link, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveStream(link)}
                        className={`px-4 py-1.5 text-sm font-medium rounded whitespace-nowrap transition-colors ${activeStream.url === link.url
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                            }`}
                    >
                        {link.server || `Server ${idx + 1}`}
                    </button>
                ))}
            </div>

            {/* Player Container */}
            <div className="aspect-video w-full bg-black relative">
                <iframe
                    src={activeStream.url}
                    title={activeStream.server}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>

            <div className="p-3 bg-neutral-950 text-xs text-neutral-500 text-center">
                If the video doesn't play, try switching servers. We do not host any videos.
            </div>
        </div>
    );
}
