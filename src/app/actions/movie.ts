'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createMovie(formData: FormData) {
    const title = formData.get('title') as string;
    const year = parseInt(formData.get('year') as string);
    const rating = parseFloat(formData.get('rating') as string);
    const quality = formData.get('quality') as string;
    const audio = formData.get('audio') as string;
    const size = formData.get('size') as string;
    const plot = formData.get('plot') as string;
    const director = formData.get('director') as string;
    const cast = formData.get('cast') as string;
    const posterUrl = formData.get('posterUrl') as string;
    const tmdbId = (formData.get('tmdbId') as string)?.trim() || null;

    // Handling arrays (simplified for now, ideally parsed from JSON or multiple inputs)
    const screenshots = (formData.get('screenshots') as string).split(',').map(s => s.trim()).filter(s => s);
    const categories = (formData.getAll('categories') as string[]);

    // Parse Download Links from a JSON string hidden field
    const downloadLinksJson = formData.get('downloadLinks') as string;
    let downloadLinks = [];
    try {
        downloadLinks = JSON.parse(downloadLinksJson);
    } catch (e) {
        console.error("Failed to parse download links", e);
    }

    // Parse Stream Links
    const streamLinksJson = formData.get('streamLinks') as string;
    let streamLinks = [];
    try {
        const parsed = JSON.parse(streamLinksJson);
        if (Array.isArray(parsed)) {
            streamLinks = parsed.filter((link: any) => link.server?.trim() !== '' && link.url?.trim() !== '');
        }
    } catch (e) {
        console.error("Failed to parse stream links", e);
    }

    await prisma.movie.create({
        data: {
            title,
            year,
            rating,
            quality,
            audio,
            size,
            plot,
            director,
            cast,
            posterUrl,
            tmdbId,
            screenshots,
            categories,
            downloadLinks,
            streamLinks,
        },
    });

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    redirect('/admin/dashboard');
}

export async function deleteMovie(id: string) {
    await prisma.movie.delete({
        where: { id },
    });
    revalidatePath('/admin/dashboard');
    revalidatePath('/');
}

export async function updateMovie(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const year = parseInt(formData.get('year') as string);
    const rating = parseFloat(formData.get('rating') as string);
    const quality = formData.get('quality') as string;
    const audio = formData.get('audio') as string;
    const size = formData.get('size') as string;
    const plot = formData.get('plot') as string;
    const director = formData.get('director') as string;
    const cast = formData.get('cast') as string;
    const posterUrl = formData.get('posterUrl') as string;
    const tmdbId = (formData.get('tmdbId') as string)?.trim() || null;

    const screenshots = (formData.get('screenshots') as string).split(',').map(s => s.trim()).filter(s => s);
    const categories = (formData.getAll('categories') as string[]);

    // Parse Download Links
    const downloadLinksJson = formData.get('downloadLinks') as string;
    let downloadLinks = [];
    try {
        downloadLinks = JSON.parse(downloadLinksJson);
    } catch (e) {
        console.error("Failed to parse download links", e);
    }

    // Parse Stream Links
    const streamLinksJson = formData.get('streamLinks') as string;
    let streamLinks = [];
    try {
        const parsed = JSON.parse(streamLinksJson);
        if (Array.isArray(parsed)) {
            streamLinks = parsed.filter((link: any) => link.server?.trim() !== '' && link.url?.trim() !== '');
        }
    } catch (e) {
        console.error("Failed to parse stream links", e);
    }

    await prisma.movie.update({
        where: { id },
        data: {
            title,
            year,
            rating,
            quality,
            audio,
            size,
            plot,
            director,
            cast,
            posterUrl,
            tmdbId,
            screenshots,
            categories,
            downloadLinks,
            streamLinks,
        },
    });

    revalidatePath('/');
    revalidatePath(`/movie/${id}`);
    revalidatePath('/admin/dashboard');
    redirect('/admin/dashboard');
}

interface BulkMovieInput {
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
    screenshots: string[];
    categories: string[];
}

export async function bulkImportMovies(
    movies: BulkMovieInput[]
): Promise<{ success: number; errors: string[] }> {
    const result = { success: 0, errors: [] as string[] };

    for (const movie of movies) {
        try {
            await prisma.movie.create({
                data: { ...movie, downloadLinks: [], streamLinks: [] },
            });
            result.success++;
        } catch (e) {
            result.errors.push(
                `"${movie.title}": ${e instanceof Error ? e.message : 'Unknown error'}`
            );
        }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return result;
}

export interface TmdbBulkMovie {
    tmdbId: string;
    title: string;
    year: number;
    rating: number;
    posterUrl: string;
    plot: string;
    original_language: string;
    /** Override auto-assigned categories (e.g. force ['Web Series'] for TV shows) */
    forceCategories?: string[];
}

export async function bulkImportFromTmdb(
    movies: TmdbBulkMovie[],
    quality: string,
    audio: string,
    size: string,
): Promise<{ success: number; skipped: number; errors: string[] }> {
    const result = { success: 0, skipped: 0, errors: [] as string[] };

    // Map original_language to category
    const langToCat: Record<string, string[]> = {
        hi: ['Bollywood'],
        en: ['Hollywood'],
        ta: ['South Indian'],
        te: ['South Indian'],
        ml: ['South Indian'],
        kn: ['South Indian'],
    };

    for (const movie of movies) {
        try {
            // Skip duplicates by tmdbId
            const existing = await prisma.movie.findFirst({ where: { tmdbId: movie.tmdbId } });
            if (existing) { result.skipped++; continue; }

            const categories = movie.forceCategories ?? langToCat[movie.original_language] ?? [];
            if (!movie.forceCategories && audio.toLowerCase().includes('dual')) categories.push('Dual Audio');

            await prisma.movie.create({
                data: {
                    title: movie.title,
                    year: movie.year,
                    rating: movie.rating,
                    quality,
                    audio,
                    size: size || 'N/A',
                    plot: movie.plot || '',
                    director: '',
                    cast: '',
                    posterUrl: movie.posterUrl,
                    tmdbId: movie.tmdbId,
                    screenshots: [],
                    categories,
                    downloadLinks: [],
                    streamLinks: [],
                },
            });
            result.success++;
        } catch (e) {
            result.errors.push(`"${movie.title}": ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return result;
}
