import Link from 'next/link';
import { Info } from 'lucide-react';

export default function AnnouncementBanner() {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 text-center">
            <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
                <Info size={20} className="flex-shrink-0" />
                <p className="text-sm md:text-base font-medium">
                    🎬 We are restoring all movies! Till then, join our{' '}
                    <Link
                        href="https://t.me/mkvcinemasworld"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold hover:text-blue-200 transition-colors"
                    >
                        Telegram Channel
                    </Link>
                    {' '}for updates and requests! 📢
                </p>
            </div>
        </div>
    );
}
