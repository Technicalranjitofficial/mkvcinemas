'use client';

import { useState, useTransition, useRef } from 'react';
import { Upload, Download, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { bulkImportMovies } from '@/app/actions/movie';

interface ParsedMovie {
    title: string;
    year: number;
    quality: string;
    audio: string;
    size: string;
    plot: string;
    director: string;
    cast: string;
    posterUrl: string;
    screenshots: string[];
    categories: string[];
    rating: number;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim()); current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text: string): ParsedMovie[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const movies: ParsedMovie[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 9) continue;
        const [title, yearStr, quality, audio, size, plot, director, cast, posterUrl, screenshotsRaw, categoriesRaw, ratingStr] = cols;
        movies.push({
            title: title || '',
            year: parseInt(yearStr) || new Date().getFullYear(),
            quality: quality || '',
            audio: audio || '',
            size: size || '',
            plot: plot || '',
            director: director || '',
            cast: cast || '',
            posterUrl: posterUrl || '',
            screenshots: screenshotsRaw ? screenshotsRaw.split('|').map(s => s.trim()).filter(Boolean) : [],
            categories: categoriesRaw ? categoriesRaw.split('|').map(s => s.trim()).filter(Boolean) : [],
            rating: parseFloat(ratingStr) || 0,
        });
    }
    return movies;
}

const TEMPLATE_CSV = `title,year,quality,audio,size,plot,director,cast,posterUrl,screenshots,categories,rating
"Movie Title",2024,"720p HEVC","Dual Audio [Hin-Eng]","1.4GB","Plot summary here...","Director Name","Actor 1|Actor 2","https://image.tmdb.org/t/p/w500/poster.jpg","https://image.tmdb.org/t/p/w780/backdrop.jpg","Bollywood|Action",7.5`;

export default function ImportPage() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [movies, setMovies] = useState<ParsedMovie[]>([]);
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setMovies(parseCSV(text));
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'movies_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        if (movies.length === 0) return;
        startTransition(async () => {
            const res = await bulkImportMovies(movies);
            setResult(res);
            if (res.errors.length === 0) {
                setMovies([]);
                setFileName('');
                if (fileRef.current) fileRef.current.value = '';
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Bulk Import Movies</h1>
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded transition-colors"
                >
                    <Download size={16} /> Download Template
                </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6 space-y-4">
                <h2 className="font-bold text-neutral-300 flex items-center gap-2"><FileText size={18} /> CSV Format</h2>
                <p className="text-sm text-neutral-500">
                    Columns: <code className="text-blue-400">title, year, quality, audio, size, plot, director, cast, posterUrl, screenshots, categories, rating</code>
                </p>
                <p className="text-sm text-neutral-500">
                    Use <code className="text-yellow-400">|</code> to separate multiple screenshots or categories (e.g. <code className="text-yellow-400">Bollywood|Action</code>).
                    Download the template above for a ready-to-fill example.
                </p>
            </div>

            {/* Upload Area */}
            <div
                className="border-2 border-dashed border-neutral-700 rounded-lg p-10 text-center cursor-pointer hover:border-neutral-500 transition-colors mb-6"
                onClick={() => fileRef.current?.click()}
            >
                <Upload className="mx-auto text-neutral-600 mb-3" size={36} />
                <p className="text-neutral-400 font-medium">{fileName || 'Click to upload a CSV file'}</p>
                <p className="text-neutral-600 text-sm mt-1">Only .csv files are supported</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Result */}
            {result && (
                <div className={`rounded-lg p-4 mb-6 space-y-2 ${result.errors.length === 0 ? 'bg-green-950/40 border border-green-900' : 'bg-yellow-950/40 border border-yellow-900'}`}>
                    <p className="flex items-center gap-2 font-medium text-sm">
                        <CheckCircle size={16} className="text-green-500" />
                        {result.success} movie{result.success !== 1 ? 's' : ''} imported successfully
                    </p>
                    {result.errors.map((err, i) => (
                        <p key={i} className="flex items-start gap-2 text-sm text-yellow-400">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {err}
                        </p>
                    ))}
                </div>
            )}

            {/* Preview Table */}
            {movies.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-neutral-400 text-sm">{movies.length} movie{movies.length !== 1 ? 's' : ''} parsed and ready to import</p>
                        <button
                            onClick={handleImport}
                            disabled={isPending}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded transition-colors"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Import All
                        </button>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-black text-neutral-400 border-b border-neutral-800">
                                <tr>
                                    <th className="p-3">Title</th>
                                    <th className="p-3">Year</th>
                                    <th className="p-3">Quality</th>
                                    <th className="p-3">Categories</th>
                                    <th className="p-3">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {movies.map((m, i) => (
                                    <tr key={i} className="hover:bg-neutral-800/40">
                                        <td className="p-3 text-white font-medium">{m.title}</td>
                                        <td className="p-3 text-neutral-400">{m.year}</td>
                                        <td className="p-3 text-neutral-400">{m.quality}</td>
                                        <td className="p-3 text-neutral-400">{m.categories.join(', ')}</td>
                                        <td className="p-3 text-neutral-400">{m.rating}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
