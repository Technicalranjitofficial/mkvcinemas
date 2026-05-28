import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Home, Upload, Layers } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-neutral-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-black p-6 hidden md:block">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-red-600">MKV Admin</h2>
                </div>

                <nav className="space-y-4">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                    <Link href="/admin/add-movie" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                        <PlusCircle size={20} />
                        Add Movie
                    </Link>
                    <Link href="/admin/import" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                        <Upload size={20} />
                        Import CSV
                    </Link>
                    <Link href="/admin/bulk-select" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                        <Layers size={20} />
                        Bulk Import
                    </Link>

                    <div className="pt-8 border-t border-neutral-800 mt-8">
                        <Link href="/" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                            <Home size={20} />
                            View Site
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
