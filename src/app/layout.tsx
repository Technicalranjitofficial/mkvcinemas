import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";

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
  twitter: {
    card: 'summary_large_image',
    site: '@mkvcinemas',
    title: 'MKVCinemas - Download Movies & Web Series',
    description: 'Download Movies & Web Series in HD. Free and Fast on MKVCinemas.',
  },
  alternates: {
    canonical: 'https://mkvcinemas.world',
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
        {/* Anti-popup & Ad-block script — runs before any third-party code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Completely kill window.open — the #1 popup vector
                window.open = function() { return null; };

                // 2. Popup-under / tab-under attack: re-focus immediately on blur
                var _blurLocked = false;
                window.addEventListener('blur', function() {
                  if (_blurLocked) return;
                  _blurLocked = true;
                  window.focus();
                  setTimeout(function() { _blurLocked = false; }, 100);
                });

                // 3. visibilitychange: if user is still on page but ad stole focus
                document.addEventListener('visibilitychange', function() {
                  if (!document.hidden) window.focus();
                });

                // 4. Block any _blank anchor that isn't explicitly marked safe
                document.addEventListener('click', function(e) {
                  var el = e.target;
                  while (el && el.tagName !== 'A') el = el.parentElement;
                  if (!el || el.tagName !== 'A') return;
                  var href = el.getAttribute('href') || '';
                  var isExternal = href && !href.startsWith('/') && !href.startsWith(window.location.origin) && !href.startsWith('#') && !href.startsWith('mailto:');
                  if (isExternal && el.target === '_blank' && !el.hasAttribute('data-safe')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);

                // 5. MutationObserver: remove injected full-screen ad overlays
                function killAdOverlay(node) {
                  if (!node || node.nodeType !== 1) return;
                  if (node.dataset && node.dataset.appRoot) return; // never touch our own app
                  try {
                    var s = window.getComputedStyle(node);
                    var z = parseInt(s.zIndex, 10);
                    if ((s.position === 'fixed' || s.position === 'absolute') && z > 99999) {
                      node.remove();
                      return;
                    }
                  } catch(e) {}
                }
                var mo = new MutationObserver(function(mutations) {
                  mutations.forEach(function(m) {
                    m.addedNodes.forEach(killAdOverlay);
                  });
                });
                document.addEventListener('DOMContentLoaded', function() {
                  mo.observe(document.body, { childList: true, subtree: false });
                });
              })();
            `,
          }}
        />
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
        <AnnouncementBanner />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
