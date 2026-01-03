import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="MKVCinemas"
                        width={150}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-neutral-300">
                    <Link href="/category/bollywood" className="hover:text-white transition-colors">Bollywood</Link>
                    <Link href="/category/hollywood" className="hover:text-white transition-colors">Hollywood</Link>
                    <Link href="/category/web-series" className="hover:text-white transition-colors">Web Series</Link>
                    <Link href="/category/dual-audio" className="hover:text-white transition-colors text-yellow-500">Dual Audio</Link>
                </nav>

                {/* Search Bar - Desktop */}
                <div className="hidden md:flex items-center bg-black border border-neutral-700 rounded-md overflow-hidden max-w-xs w-full ml-4">
                    <input
                        type="text"
                        placeholder="Search movies..."
                        className="bg-transparent border-none text-sm text-white px-3 py-2 w-full focus:outline-none placeholder-neutral-500"
                    />
                    <button className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400">
                        <Search size={18} />
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden text-white">
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}
