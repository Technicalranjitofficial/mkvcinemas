'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
    { href: '/category/bollywood', label: 'Bollywood' },
    { href: '/category/hollywood', label: 'Hollywood' },
    { href: '/category/web-series', label: 'Web Series' },
    { href: '/category/dual-audio', label: 'Dual Audio', highlight: true },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/?q=${encodeURIComponent(query.trim())}`);
            setOpen(false);
        }
    };

    return (
        <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
                {/* Logo */}
                <Link href="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
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
                    {NAV_LINKS.map(({ href, label, highlight }) => (
                        <Link key={href} href={href} className={`hover:text-white transition-colors ${highlight ? 'text-yellow-500' : ''}`}>
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Search Bar - Desktop */}
                <form
                    onSubmit={handleSearch}
                    className="hidden md:flex items-center bg-black border border-neutral-700 rounded-md overflow-hidden max-w-xs w-full ml-4"
                >
                    <input
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search movies..."
                        autoComplete="off"
                        className="bg-transparent border-none text-sm text-white px-3 py-2 w-full focus:outline-none placeholder-neutral-500"
                    />
                    <button type="submit" className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400" aria-label="Search">
                        <Search size={18} />
                    </button>
                </form>

                {/* Mobile: Search icon + Hamburger */}
                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={() => setOpen(prev => !prev)}
                        className="text-white p-1"
                        aria-label="Toggle menu"
                    >
                        {open ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {open && (
                <div className="md:hidden bg-neutral-900 border-t border-neutral-800 px-4 pb-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="flex items-center bg-black border border-neutral-700 rounded-md overflow-hidden mt-3 mb-3">
                        <input
                            type="search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search movies..."
                            autoComplete="off"
                            autoFocus
                            className="bg-transparent border-none text-sm text-white px-3 py-2.5 w-full focus:outline-none placeholder-neutral-500"
                        />
                        <button type="submit" className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400" aria-label="Search">
                            <Search size={18} />
                        </button>
                    </form>

                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col gap-1">
                        {NAV_LINKS.map(({ href, label, highlight }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className={`py-2.5 px-3 rounded-md text-sm font-medium transition-colors hover:bg-neutral-800 hover:text-white ${highlight ? 'text-yellow-500' : 'text-neutral-300'}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
