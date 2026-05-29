import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import PopupBlocker from "@/components/PopupBlocker";

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
                  '@id': 'https://mkvcinemas.world/#website',
                  url: 'https://mkvcinemas.world',
                  name: 'MKVCinemas',
                  description: 'Download Movies & Web Series in HD quality. Free and Fast.',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://mkvcinemas.world/?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://mkvcinemas.world/#organization',
                  name: 'MKVCinemas',
                  url: 'https://mkvcinemas.world',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://mkvcinemas.world/favicon-6-192x192.png',
                    width: 192,
                    height: 192,
                  },
                  sameAs: ['https://mkvcinemas.world'],
                },
              ],
            }),
          }}
        />
        {/* Hardened popup / ad blocker — runs synchronously before ANY third-party code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var TRUSTED = ['mkvcinemas.world', 't.me', 'telegram.me'];
                function isTrusted(url) {
                  if (!url) return true;
                  var s = String(url);
                  if (s.charAt(0) === '/' || s.charAt(0) === '#') return true;
                  try { var h = new URL(s).hostname; return TRUSTED.some(function(d){ return h.indexOf(d) !== -1; }); } catch(e) { return false; }
                }

                // 1. Kill window.open completely
                window.open = function() { return null; };

                // 2. Block location.assign / replace navigating to external sites
                try {
                  var _assign = location.assign.bind(location);
                  var _replace = location.replace.bind(location);
                  location.assign  = function(u){ if(isTrusted(u)) _assign(u); };
                  location.replace = function(u){ if(isTrusted(u)) _replace(u); };
                } catch(e){}

                // 3. Block programmatic anchor.click() popup trick
                var _ce = document.createElement.bind(document);
                document.createElement = function(tag, opts) {
                  var el = _ce(tag, opts);
                  if (String(tag).toLowerCase() === 'a') {
                    var _click = el.click.bind(el);
                    el.click = function() {
                      if (el.target === '_blank' && !isTrusted(el.href)) return;
                      _click();
                    };
                  }
                  return el;
                };

                // 4. Block _blank clicks on injected anchors (capture phase)
                document.addEventListener('click', function(e) {
                  var el = e.target;
                  while (el && el.tagName !== 'A') el = el.parentElement;
                  if (!el) return;
                  var href = el.getAttribute('href') || '';
                  var tgt  = el.getAttribute('target') || '';
                  if ((tgt === '_blank' || tgt === '_new') && !isTrusted(href) && !el.hasAttribute('data-safe')) {
                    e.preventDefault(); e.stopImmediatePropagation();
                  }
                }, true);

                // 5. Popup-under defence: steal focus back immediately
                var _busy = false;
                window.addEventListener('blur', function() {
                  if (_busy) return; _busy = true;
                  window.focus();
                  setTimeout(function(){ _busy = false; }, 150);
                });

                // 6. MutationObserver — nuke injected overlays and ad iframes
                var AD_DOMAINS = ['doubleclick','googlesyndication','adservice','amazon-adsystem',
                  'adnxs','popads','popcash','propellerads','exoclick','adsterra',
                  'trafficjunky','juicyads','clickadu','yllix','hilltopads'];
                function isAd(src) { var s=(src||'').toLowerCase(); return AD_DOMAINS.some(function(d){ return s.indexOf(d)!==-1; }); }
                function killNode(node) {
                  if (!node || node.nodeType !== 1) return;
                  if (node.dataset && node.dataset.appRoot) return;
                  var tag = node.tagName;
                  if (tag === 'IFRAME' || tag === 'SCRIPT') {
                    if (isAd(node.getAttribute('src'))) { node.remove(); return; }
                  }
                  var s = node.style;
                  if (s && (s.position === 'fixed' || s.position === 'absolute')) {
                    var z = parseInt(s.zIndex || '0', 10);
                    var w = parseInt(s.width || '0', 10);
                    if (z > 999 && (w >= window.innerWidth * 0.8 || s.width === '100%' || s.width === '100vw')) {
                      node.remove(); return;
                    }
                  }
                }
                var mo = new MutationObserver(function(ms) {
                  ms.forEach(function(m){ m.addedNodes.forEach(killNode); });
                });
                // Observe immediately — don't wait for DOMContentLoaded
                (document.documentElement
                  ? mo.observe(document.documentElement, { childList: true, subtree: true })
                  : document.addEventListener('DOMContentLoaded', function() {
                      mo.observe(document.documentElement, { childList: true, subtree: true });
                    })
                );
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col`}
      >
        <AnnouncementBanner />
        <Header />
        {/* React-layer popup blocker — catches what the inline script misses post-hydration */}
        <PopupBlocker />
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
