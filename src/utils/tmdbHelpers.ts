// Client-safe TMDB utility helpers (no 'use server')

export function suggestAudio(originalLanguage: string): string {
    const map: Record<string, string> = {
        hi: 'Hindi',
        en: 'English',
        ta: 'Tamil',
        te: 'Telugu',
        ml: 'Malayalam',
        kn: 'Kannada',
        mr: 'Marathi',
        bn: 'Bengali',
        pa: 'Punjabi',
    };
    return map[originalLanguage] ?? 'Hindi';
}
