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
