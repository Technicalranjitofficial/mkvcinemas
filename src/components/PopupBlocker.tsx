'use client';

import { useEffect } from 'react';

// Known ad / tracker domains — iframes and scripts from these are removed on sight
const AD_DOMAINS = [
  'doubleclick', 'googlesyndication', 'adservice', 'amazon-adsystem',
  'moatads', 'scorecardresearch', 'adsystem', 'adnxs', 'popads', 'popcash',
  'propellerads', 'revcontent', 'taboola', 'outbrain', 'adcash', 'exoclick',
  'trafficjunky', 'juicyads', 'adsterra', 'hilltopads', 'plugrush', 'popunder',
  'ero-advertising', 'adspyglass', 'clickadu', 'richpush', 'yllix',
];

// Trusted domains that are allowed to open links
const TRUSTED_DOMAINS = [
  'mkvcinemas.world', 't.me', 'telegram.me', 'tmdb.org',
  'vidsrc.mov', 'vidsrc.fyi', 'vidrock.net', 'vidnest.fun',
  'vidking.net', 'vidlink.pro', 'vidfast.pro', 'vidup.to',
  'videasy.net', '111movies.com', '2embed.cc', 'multiembed.mov'
];

function isAdSrc(src: string): boolean {
  const s = src.toLowerCase();
  return AD_DOMAINS.some((d) => s.includes(d));
}

function isTrustedHref(href: string): boolean {
  if (!href || href.startsWith('/') || href.startsWith('#')) return true;
  try {
    const url = new URL(href);
    return TRUSTED_DOMAINS.some((d) => url.hostname.includes(d));
  } catch {
    return false;
  }
}

export default function PopupBlocker() {
  useEffect(() => {
    // ── 1. Block window.open ──────────────────────────────────────────────
    const _originalOpen = window.open.bind(window);
    window.open = function (url?: string | URL, target?: string) {
      // Allow trusted same-site opens (e.g. Next.js prefetch)
      const href = url?.toString() ?? '';
      if (isTrustedHref(href)) {
        return _originalOpen(url, target);
      }
      return {
        closed: false,
        close: () => {},
        focus: () => {},
        blur: () => {},
        postMessage: () => {},
      } as any;
    };

    // ── 2. Block location.assign / replace (ad redirect scripts) ─────────
    const _originalAssign = location.assign.bind(location);
    const _originalReplace = location.replace.bind(location);

    try {
      window.location.assign = function (url: string) {
        if (isTrustedHref(url)) return _originalAssign(url);
      };
      window.location.replace = function (url: string) {
        if (isTrustedHref(url)) return _originalReplace(url);
      };
    } catch {
      // Read-only in some environments — safe to ignore
    }

    // ── 3. Intercept ALL link clicks — block external _blank targets ──────
    const onCapture = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';
      const isBlank =
        anchor.getAttribute('target') === '_blank' ||
        anchor.getAttribute('target') === '_new';

      if (isBlank && !isTrustedHref(href)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener('click', onCapture, true);

    // ── 4. Block middle-click (button 1) on external links ───────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (!isTrustedHref(href)) e.preventDefault();
    };
    document.addEventListener('mousedown', onMouseDown, true);

    // ── 5. Block document.createElement('a').click() popup trick ─────────
    const _originalCreateElement = document.createElement.bind(document);
    // Override document.createElement to intercept programmatic anchor clicks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.createElement = function <K extends keyof HTMLElementTagNameMap>(
      tag: K,
      options?: ElementCreationOptions,
    ): HTMLElementTagNameMap[K] {
      const el = _originalCreateElement(tag, options);
      if (tag.toString().toLowerCase() === 'a') {
        const a = el as HTMLAnchorElement;
        const _originalClick = a.click.bind(a);
        a.click = function () {
          if (a.target === '_blank' && !isTrustedHref(a.href)) return;
          _originalClick();
        };
      }
      return el;
    };

    // ── 6. MutationObserver — remove injected ad overlays in real time ─────
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;

          // Remove ad iframes / scripts by domain
          if (el.tagName === 'IFRAME' || el.tagName === 'SCRIPT') {
            const src = el.getAttribute('src') ?? el.getAttribute('data-src') ?? '';
            if (isAdSrc(src)) { el.remove(); continue; }
          }

          // Remove full-viewport overlay divs (classic popup trick)
          if (el.tagName === 'DIV' || el.tagName === 'A') {
            const s = el.style;
            const fixed =
              s.position === 'fixed' || s.position === 'absolute';
            const fullscreen =
              (parseInt(s.width) >= window.innerWidth * 0.85) ||
              s.width === '100vw' ||
              s.width === '100%';
            const highZ = parseInt(s.zIndex || '0') > 9000;

            if (fixed && highZ && fullscreen) {
              el.remove();
              continue;
            }
          }

          // Recursively check children
          el.querySelectorAll('iframe[src], script[src]').forEach((child) => {
            const src = child.getAttribute('src') ?? '';
            if (isAdSrc(src)) child.remove();
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.open = _originalOpen;
      try {
        window.location.assign = _originalAssign;
        window.location.replace = _originalReplace;
      } catch { /* ignore */ }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.createElement = _originalCreateElement;
      document.removeEventListener('click', onCapture, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
