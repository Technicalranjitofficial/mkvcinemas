import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mkvcinemas.world'),
  title: {
    default: "MKVCinemas - Download Movies & Web Series | mkvcinemas.world",
    template: "%s | MKVCinemas",
  },
  description: "MKVCinemas - The best site to download 480p, 720p, 1080p Movies and Web Series in Dual Audio. Fast, Free, and Secure downloads at mkvcinemas.world.",
  keywords: ["MKVCinemas", "mkvcinemas.world", "Download Movies", "Web Series", "Dual Audio Movies", "480p Movies", "720p Movies", "1080p Movies", "Bollywood Movies", "Hollywood Movies"],
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
    title: 'MKVCinemas - Download Movies & Web Series',
    description: 'Download Movies & Web Series. Free and Fast on MKVCinemas.',
    url: 'https://mkvcinemas.world',
    siteName: 'MKVCinemas',
    locale: 'en_US',
    type: 'website',
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
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-P2JWSP7GYG"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-P2JWSP7GYG');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
