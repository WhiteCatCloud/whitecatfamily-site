// functions/_middleware.js
// Cloudflare Pages Function — runs on every request.
//
// Phase 1: classify locale from cf-ipcountry + cookie. No content injection.
// Phase 2: injects locale-appropriate footer via <!-- FOOTER --> marker.
// Phase 3+ adds CTA-AMAZON, COOKIE, LOCALE-SWITCH, HREFLANG markers.
//
// Every marker swap MUST be inside the try block so a partial fetch failure
// degrades to raw HTML (markers are invisible comments).

import { loadPartials } from './_partials.js';
//
// Rollout: gated by EU_LAUNCH_ENABLED env var. Without it set to "true" on prod,
// this Function is a pure pass-through. Override per-request with ?eu=1 for
// preview testing.

const EU_GERMAN_SPEAKING = new Set(['DE', 'AT']);
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB',
  // EEA non-EU — treat as EU for footer purposes (harmless overestimate)
  'NO', 'IS', 'LI',
]);

const VALID_LOCALES = new Set(['en-US', 'en-EU', 'de']);

function readCookie(req, name) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function footerFor(locale) {
  if (locale === 'de') return 'footer-eu-de';
  if (locale === 'en-EU') return 'footer-eu-en';
  return 'footer-us';
}

function ctaFor(locale) {
  return locale === 'de' ? 'cta-amazon-de' : 'cta-amazon-en';
}

function cookieFor(locale) {
  return locale === 'de' ? 'cookie-banner-de' : 'cookie-banner-en';
}

// Map an EN path → its DE counterpart and vice versa.
// Pages without a DE counterpart return de=null; Function emits no hreflang=de
// for them and the locale switcher links to the canonical DE root (/de/).
const UNPAIRED_PATHS = new Set([
  '/digital-heroin', '/digital-heroin/', '/digital-heroin.html',
]);
const TRANSLATED_BASENAMES = {
  // EN basename → DE basename (path under /de/)
  privacy: 'datenschutz',
  terms: 'agb',
  thankyou: 'danke',
};
const REVERSE_BASENAMES = Object.fromEntries(
  Object.entries(TRANSLATED_BASENAMES).map(([en, de]) => [de, en])
);

function buildLocaleSwitchUrls(pathname) {
  // EN side asks: where's the DE version?
  const isDe = pathname === '/de' || pathname.startsWith('/de/');

  if (!isDe) {
    if (UNPAIRED_PATHS.has(pathname) || pathname.startsWith('/digital-heroin/')) {
      return { en: pathname, de: null };
    }
    if (pathname === '/' || pathname === '/index.html') {
      return { en: '/', de: '/de/' };
    }
    // Strip leading slash, drop trailing index.html
    const base = pathname.replace(/^\//, '').replace(/\.html$/, '');
    const dePath = '/de/' + (TRANSLATED_BASENAMES[base] || base);
    return { en: pathname, de: dePath };
  }

  // DE side asks: where's the EN version?
  // /de/ → /
  if (pathname === '/de' || pathname === '/de/') {
    return { en: '/', de: pathname };
  }
  const base = pathname.replace(/^\/de\//, '').replace(/\.html$/, '');
  const enBase = REVERSE_BASENAMES[base] || base;
  return { en: '/' + enBase, de: pathname };
}

function makeAbsolute(host, p) {
  return p ? `https://${host}${p}` : null;
}

function amazonUrlFor(locale, env) {
  if (locale === 'de' || locale === 'en-EU') {
    return env.WHITECAT_AMAZON_DE_URL || 'https://www.amazon.de/stores/WhiteCat';
  }
  return env.WHITECAT_AMAZON_US_URL || 'https://www.amazon.com/stores/WhiteCat';
}

function classifyLocale(req) {
  const override = readCookie(req, 'wc_locale');
  if (override && VALID_LOCALES.has(override)) return override;

  const country = (req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (EU_GERMAN_SPEAKING.has(country)) return 'de';
  if (country === 'CH') {
    const accept = (req.headers.get('accept-language') || '').toLowerCase();
    if (accept.startsWith('de')) return 'de';
    return 'en-EU';
  }
  if (EU_COUNTRIES.has(country)) return 'en-EU';
  return 'en-US';
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Rollout gate: auto-active on canary + any preview host so we can test
  // without setting an env var; production must explicitly opt in via
  // EU_LAUNCH_ENABLED=true. ?eu=1 forces on anywhere for ad-hoc smoke tests.
  const host = url.host;
  const isPreviewHost =
    host.startsWith('canary.') ||
    host.endsWith('.pages.dev') ||
    host === 'localhost' || host.startsWith('localhost:');
  const enabled =
    env.EU_LAUNCH_ENABLED === 'true' ||
    url.searchParams.get('eu') === '1' ||
    isPreviewHost;
  if (!enabled) return next();

  // Bypass non-HTML: assets, images, fonts, etc.
  // Heuristic: only act on paths that end with '/', '.html', or look like a clean
  // single-segment route ('/de', '/faq', etc.).
  if (
    !url.pathname.endsWith('/') &&
    !url.pathname.endsWith('.html') &&
    url.pathname !== '/' &&
    !/^\/[a-z][a-z-]*$/i.test(url.pathname.split('?')[0])
  ) {
    return next();
  }

  // Path-aware locale: any page under /de/ is German, regardless of visitor IP.
  // A US visitor manually opening /de/impressum still gets the EU-DE footer.
  // For the EN side, fall back to geo + cookie classification.
  const onDePath = url.pathname === '/de' || url.pathname.startsWith('/de/');
  const locale = onDePath ? 'de' : classifyLocale(request);

  // Phase 4: redirect German-speakers from / to /de/ (canonical entry).
  // Anti-loop: only fires on the root; manual /de/* access always wins;
  // a cookie override is already respected by classifyLocale above.
  const isRoot = url.pathname === '/' || url.pathname === '/index.html';
  const isAlreadyDe = url.pathname === '/de' || url.pathname.startsWith('/de/');
  if (locale === 'de' && isRoot && !isAlreadyDe) {
    // Preserve query string so flags like ?eu=1 (preview-mode override) survive
    return new Response(null, {
      status: 302,
      headers: {
        location: '/de/' + (url.search || ''),
        'cache-control': 'private, max-age=0',
      },
    });
  }

  // Fallback contract: any failure inside the injection block falls through
  // to the raw upstream HTML (markers are HTML comments → invisible to users).
  // Never serve a 500 from the Function — degrade silently.
  //
  // CRITICAL: we clone the upstream response BEFORE consuming its body so the
  // catch can return the original. Calling next() twice is not safe — the
  // first call may have already mutated state, and the body of the first
  // response is already consumed by .text().
  const upstream = await next();
  const fallback = upstream.clone();
  try {
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return upstream;

    let html = await upstream.text();
    const partials = await loadPartials(env);

    // <html data-locale="..."> — single-replace (only one <html> per page)
    html = html.replace(/<html(\s[^>]*)?>/i, (m, attrs) => {
      const cleaned = (attrs || '').replace(/\s+data-locale="[^"]*"/g, '');
      return `<html${cleaned} data-locale="${locale}">`;
    });

    // Marker swaps — use replaceAll (markers may appear multiple times).
    html = html.replaceAll('<!-- FOOTER -->', partials[footerFor(locale)] || '');
    const cta = (partials[ctaFor(locale)] || '').replace('{{AMAZON_URL}}', amazonUrlFor(locale, env));
    html = html.replaceAll('<!-- CTA-AMAZON -->', cta);
    html = html.replaceAll('<!-- COOKIE -->', partials[cookieFor(locale)] || '');

    // Phase 8: locale switcher + hreflang
    const localeUrls = buildLocaleSwitchUrls(url.pathname);
    const switchPartial = (partials['header-locale-switch'] || '')
      .replace('{{EN_URL}}', localeUrls.en || '/')
      .replace('{{DE_URL}}', localeUrls.de || '/de/');
    html = html.replaceAll('<!-- LOCALE-SWITCH -->', switchPartial);

    // Hreflang: omit hreflang=de for unpaired pages
    const host = url.host;
    const absEn = makeAbsolute(host, localeUrls.en) || '';
    const absDe = makeAbsolute(host, localeUrls.de);
    let hreflangBlock = (partials['hreflang'] || '').replaceAll('{{EN_URL}}', absEn);
    if (absDe) {
      hreflangBlock = hreflangBlock.replaceAll('{{DE_URL}}', absDe);
    } else {
      // Strip the hreflang=de line entirely (and any unsubstituted {{DE_URL}})
      hreflangBlock = hreflangBlock.replace(/\s*<link rel="alternate" hreflang="de"[^>]*>\s*\n?/, '\n');
    }
    html = html.replaceAll('<!-- HREFLANG -->', hreflangBlock);

    return new Response(html, {
      status: upstream.status,
      headers: {
        ...Object.fromEntries(upstream.headers),
        'content-type': 'text/html; charset=utf-8',
        // Per-visitor injection makes HTML uncacheable at the edge.
        // Static assets bypass this Function entirely and remain CDN-cached.
        'cache-control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    // Log but don't propagate — visitor gets the cloned raw HTML.
    console.error('EU launch middleware error:', err);
    return fallback;
  }
}
