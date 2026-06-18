import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',   // show text immediately with fallback font
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,    // monospace font not needed on first paint
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mkvcinemas.world'),
  title: {
    default: "MKVCinemas - Download Movies & Web Series | mkvcinemas.world",
    template: "%s | MKVCinemas",
  },
  description: "MKVCinemas – Download latest Bollywood, Hollywood & South Indian movies and Web Series in 480p, 720p, 1080p, 4K. Dual Audio, Hindi Dubbed. Free and Fast at mkvcinemas.world.",
  keywords: [
    "MKVCinemas", "mkvcinemas.world", "mkv cinemas",
    "Download Movies", "Web Series download", "Dual Audio Movies",
    "480p Movies", "720p Movies", "1080p Movies", "4K Movies",
    "Bollywood Movies download", "Hollywood Movies download",
    "South Indian Hindi dubbed", "new movies 2025", "new movies 2026",
  ],
  icons: {
    icon: [
      { url: '/favicon-6-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-6-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-6-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'MKVCinemas - Download Movies & Web Series in HD',
    description: 'Download latest Bollywood, Hollywood, South Indian movies and Web Series in 480p, 720p, 1080p, 4K. Dual Audio, Hindi Dubbed. Free and Fast at MKVCinemas.',
    url: 'https://www.mkvcinemas.world',
    siteName: 'MKVCinemas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mkvcinemas',
    title: 'MKVCinemas - Download Movies & Web Series in HD',
    description: 'Download latest Bollywood, Hollywood & South Indian movies and Web Series in HD. Dual Audio, Free and Fast on MKVCinemas.',
  },
  alternates: {
    canonical: 'https://www.mkvcinemas.world',
  },
  other: {
    'theme-color': '#0a0a0a',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Resource hints — tell the browser to open connections early */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Structured Data: WebSite + SearchAction (Google Sitelinks Searchbox) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.mkvcinemas.world/#website',
                  url: 'https://www.mkvcinemas.world',
                  name: 'MKVCinemas',
                  description: 'Watch Movies & Web Series online in HD quality.',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://www.mkvcinemas.world/?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://www.mkvcinemas.world/#organization',
                  name: 'MKVCinemas',
                  url: 'https://www.mkvcinemas.world',
                  description: 'Watch Bollywood, Hollywood and South Indian movies and Web Series online in HD quality.',
                  logo: {
                    '@type': 'ImageObject',
                    '@id': 'https://www.mkvcinemas.world/#logo',
                    url: 'https://www.mkvcinemas.world/logo.png',
                    contentUrl: 'https://www.mkvcinemas.world/logo.png',
                  },
                  sameAs: ['https://www.mkvcinemas.world'],
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col`}
      >
        <AnnouncementBanner />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
        {/* Google Analytics — deferred until after page is interactive (non-render-blocking) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P2JWSP7GYG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P2JWSP7GYG');`}
        </Script>
      </body>
    </html>
  );
}
