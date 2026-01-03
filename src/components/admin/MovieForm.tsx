'use client';

import { Plus, Trash, Save } from 'lucide-react';
import { useState } from 'react';

interface MovieFormProps {
    action: (formData: FormData) => Promise<void>;
    initialData?: {
        id?: string;
        title: string;
        year: number;
        rating: number;
        quality: string;
        audio: string;
        size: string;
        plot: string;
        director: string;
        cast: string;
        posterUrl: string;
        categories: string[];
        screenshots: string[];
        downloadLinks: { label: string; url: string; color: string }[];
        streamLinks: { server: string; url: string }[];
    };
    isEdit?: boolean;
}

export default function MovieForm({ action, initialData, isEdit = false }: MovieFormProps) {
    const [screenshots, setScreenshots] = useState<string[]>(initialData?.screenshots.length ? initialData.screenshots : ['']);
    const [downloadLinks, setDownloadLinks] = useState(initialData?.downloadLinks.length ? initialData.downloadLinks : [{ label: '', url: '', color: 'blue' }]);
    const [streamLinks, setStreamLinks] = useState(initialData?.streamLinks.length ? initialData.streamLinks : [{ server: '', url: '' }]);

    const addScreenshot = () => setScreenshots([...screenshots, '']);
    const removeScreenshot = (index: number) => setScreenshots(screenshots.filter((_, i) => i !== index));
    const updateScreenshot = (index: number, value: string) => {
        const newScreenshots = [...screenshots];
        newScreenshots[index] = value;
        setScreenshots(newScreenshots);
    };

    const addLink = () => setDownloadLinks([...downloadLinks, { label: '', url: '', color: 'blue' }]);
    const removeLink = (index: number) => setDownloadLinks(downloadLinks.filter((_, i) => i !== index));
    const updateLink = (index: number, field: string, value: string) => {
        const newLinks = [...downloadLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setDownloadLinks(newLinks);
    };

    const addStreamLink = () => setStreamLinks([...streamLinks, { server: '', url: '' }]);
    const removeStreamLink = (index: number) => setStreamLinks(streamLinks.filter((_, i) => i !== index));
    const updateStreamLink = (index: number, field: string, value: string) => {
        const newLinks = [...streamLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setStreamLinks(newLinks);
    };

    return (
        <form action={action} className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Movie Title</label>
                    <input required name="title" type="text" defaultValue={initialData?.title} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. Pushpa 2: The Rule" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Year</label>
                    <input required name="year" type="number" defaultValue={initialData?.year || new Date().getFullYear()} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Rating (0-10)</label>
                    <input name="rating" type="number" step="0.1" defaultValue={initialData?.rating} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. 8.5" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Quality Label</label>
                    <input required name="quality" type="text" defaultValue={initialData?.quality} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. 1080p HEVC" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Audio</label>
                    <input required name="audio" type="text" defaultValue={initialData?.audio} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. Dual Audio [Hin-Eng]" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Size</label>
                    <input name="size" type="text" defaultValue={initialData?.size} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="e.g. 1.4GB" />
                </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Plot Summary</label>
                    <textarea required name="plot" rows={4} defaultValue={initialData?.plot} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="Enter movie plot..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Director</label>
                        <input name="director" type="text" defaultValue={initialData?.director} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Cast</label>
                        <input name="cast" type="text" defaultValue={initialData?.cast} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Poster URL</label>
                <input required name="posterUrl" type="url" defaultValue={initialData?.posterUrl} className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2" placeholder="https://..." />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Categories</label>
                <div className="flex flex-wrap gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded">
                    {['Bollywood', 'Hollywood', 'South Indian', 'Web Series', 'Dual Audio', 'Action', 'Thriller', 'Comedy'].map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="categories"
                                value={cat}
                                defaultChecked={initialData?.categories?.includes(cat)}
                                className="rounded bg-neutral-800 border-neutral-700"
                            />
                            <span>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Dynamic Screenshots */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Screenshots URLs</label>
                    <button type="button" onClick={addScreenshot} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add URL
                    </button>
                </div>
                <div className="space-y-2">
                    {screenshots.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => updateScreenshot(idx, e.target.value)}
                                className="flex-1 bg-black border border-neutral-800 rounded px-3 py-1 text-sm"
                                placeholder="https://..."
                            />
                            <button type="button" onClick={() => removeScreenshot(idx)} className="text-red-500 hover:text-red-400">
                                <Trash size={18} />
                            </button>
                        </div>
                    ))}
                    <input type="hidden" name="screenshots" value={screenshots.join(',')} />
                </div>
            </div>

            {/* Dynamic Stream Links */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Streaming Links</label>
                    <button type="button" onClick={addStreamLink} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add Stream
                    </button>
                </div>
                <div className="space-y-3">
                    {streamLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-black p-2 rounded border border-neutral-800">
                            <input
                                type="text"
                                placeholder="Server Name (e.g. Server 1)"
                                value={link.server}
                                onChange={(e) => updateStreamLink(idx, 'server', e.target.value)}
                                className="bg-neutral-900 border-none rounded px-2 py-1 flex-1 min-w-[120px]"
                            />
                            <input
                                type="url"
                                placeholder="Iframe URL"
                                value={link.url}
                                onChange={(e) => updateStreamLink(idx, 'url', e.target.value)}
                                className="bg-neutral-900 border-none rounded px-2 py-1 flex-[2]"
                            />
                            <button type="button" onClick={() => removeStreamLink(idx)} className="text-red-500 p-1">
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                    <input type="hidden" name="streamLinks" value={JSON.stringify(streamLinks)} />
                </div>
            </div>

            {/* Dynamic Download Links */}
            <div className="space-y-4 border p-4 border-neutral-800 rounded bg-neutral-900/50">
                <div className="flex justify-between items-center">
                    <label className="font-bold">Download Links</label>
                    <button type="button" onClick={addLink} className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm">
                        <Plus size={16} /> Add Link
                    </button>
                </div>
                <div className="space-y-3">
                    {downloadLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-black p-2 rounded border border-neutral-800">
                            <input
                                type="text"
                                placeholder="Label (e.g. 720p)"
                                value={link.label}
                                onChange={(e) => updateLink(idx, 'label', e.target.value)}
                                className="bg-neutral-900 border-none rounded px-2 py-1 flex-1 min-w-[120px]"
                            />
                            <input
                                type="url"
                                placeholder="Download URL"
                                value={link.url}
                                onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                className="bg-neutral-900 border-none rounded px-2 py-1 flex-[2]"
                            />
                            <select
                                value={link.color}
                                onChange={(e) => updateLink(idx, 'color', e.target.value)}
                                className="bg-neutral-900 border-none rounded px-2 py-1 text-sm text-neutral-400"
                            >
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="red">Red</option>
                                <option value="yellow">Yellow</option>
                            </select>
                            <button type="button" onClick={() => removeLink(idx)} className="text-red-500 p-1">
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                    <input type="hidden" name="downloadLinks" value={JSON.stringify(downloadLinks)} />
                </div>
            </div>

            <div className="pt-8">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                    <Save size={20} />
                    {isEdit ? 'Update Movie' : 'Save Movie'}
                </button>
            </div>
        </form>
    );
}
