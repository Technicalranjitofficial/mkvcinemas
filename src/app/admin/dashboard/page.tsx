import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Edit, Eye } from 'lucide-react';
import DeleteMovieButton from '@/components/admin/DeleteMovieButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const movies = await prisma.movie.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="text-neutral-400">
                    Total Movies: <span className="text-white font-bold">{movies.length}</span>
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black text-neutral-400 border-b border-neutral-800 font-medium">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Quality</th>
                            <th className="p-4">Year</th>
                            <th className="p-4">Date Added</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {movies.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-neutral-500">
                                    No movies found. <Link href="/admin/add-movie" className="text-blue-500 hover:underline">Add one now</Link>.
                                </td>
                            </tr>
                        ) : (
                            movies.map(movie => (
                                <tr key={movie.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4 font-medium text-white">{movie.title}</td>
                                    <td className="p-4 text-neutral-300">
                                        <span className="bg-neutral-800 px-2 py-1 rounded text-xs">{movie.quality}</span>
                                    </td>
                                    <td className="p-4 text-neutral-400">{movie.year}</td>
                                    <td className="p-4 text-neutral-400">{new Date(movie.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 flex justify-end gap-2">
                                        <Link href={`/movie/${movie.id}`} target="_blank" className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors" title="View">
                                            <Eye size={16} />
                                        </Link>
                                        <Link href={`/admin/edit-movie/${movie.id}`} className="p-2 bg-blue-900/50 hover:bg-blue-900 text-blue-500 rounded transition-colors" title="Edit">
                                            <Edit size={16} />
                                        </Link>
                                        <DeleteMovieButton id={movie.id} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
