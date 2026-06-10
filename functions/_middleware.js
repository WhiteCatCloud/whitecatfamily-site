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
const EU_FRENCH_SPEAKING = new Set(['FR', 'MC']);
const EU_SLOVAK = new Set(['SK']);
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB',
  // EEA non-EU — treat as EU for footer purposes (harmless overestimate)
  'NO', 'IS', 'LI',
]);

const VALID_LOCALES = new Set(['en-US', 'en-EU', 'de', 'fr', 'sk']);

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

// EN-side pages with translated /de/ filenames (privacy → datenschutz, etc.).
// FR + SK are homepage-only for now, so they always link to their root.
const UNPAIRED_PATHS = new Set([
  '/digital-heroin', '/digital-heroin/', '/digital-heroin.html',
]);
const TRANSLATED_BASENAMES = {
  privacy: 'datenschutz',
  terms: 'agb',
  thankyou: 'danke',
};
const REVERSE_BASENAMES = Object.fromEntries(
  Object.entries(TRANSLATED_BASENAMES).map(([en, de]) => [de, en])
);

// Returns canonical paths for each available locale, given the current pathname.
// Used for both the locale switcher and hreflang link tags. A value of null
// means the locale isn't published for this page yet (e.g. /fr/faq doesn't
// exist, so on /faq the FR locale entry points at /fr/ instead).
function buildLocaleUrls(pathname) {
  const isDe = pathname === '/de' || pathname.startsWith('/de/');
  const isFr = pathname === '/fr' || pathname.startsWith('/fr/');
  const isSk = pathname === '/sk' || pathname.startsWith('/sk/');
  const isEnEU = pathname === '/en' || pathname.startsWith('/en/');

  // Unpaired pages — only the EN US side exists
  if (UNPAIRED_PATHS.has(pathname) || pathname.startsWith('/digital-heroin/')) {
    return { 'en-US': pathname, 'en-EU': null, de: null, fr: null, sk: null };
  }

  // Root or US homepage variants
  if (pathname === '/' || pathname === '/index.html') {
    return { 'en-US': '/', 'en-EU': '/en/', de: '/de/', fr: '/fr/', sk: '/sk/' };
  }

  if (isDe) {
    const base = pathname.replace(/^\/de\//, '').replace(/\.html$/, '');
    if (pathname === '/de' || pathname === '/de/') {
      return { 'en-US': '/', 'en-EU': '/en/', de: pathname, fr: '/fr/', sk: '/sk/' };
    }
    const enBase = REVERSE_BASENAMES[base] || base;
    return {
      'en-US': '/' + enBase,
      'en-EU': '/en/' + (enBase === 'index' ? '' : enBase),
      de: pathname,
      fr: '/fr/',
      sk: '/sk/',
    };
  }

  if (isFr || isSk) {
    // FR + SK are homepage-only, anything under them maps back to root variants
    return {
      'en-US': '/',
      'en-EU': '/en/',
      de: '/de/',
      fr: '/fr/',
      sk: '/sk/',
    };
  }

  if (isEnEU) {
    const base = pathname.replace(/^\/en\//, '').replace(/\.html$/, '');
    if (pathname === '/en' || pathname === '/en/') {
      return { 'en-US': '/', 'en-EU': pathname, de: '/de/', fr: '/fr/', sk: '/sk/' };
    }
    const dePath = '/de/' + (TRANSLATED_BASENAMES[base] || base);
    return {
      'en-US': '/' + base,
      'en-EU': pathname,
      de: dePath,
      fr: '/fr/',
      sk: '/sk/',
    };
  }

  // EN-US side (root path like /faq, /privacy, etc.)
  const base = pathname.replace(/^\//, '').replace(/\.html$/, '');
  return {
    'en-US': pathname,
    'en-EU': '/en/' + base,
    de: '/de/' + (TRANSLATED_BASENAMES[base] || base),
    fr: '/fr/',
    sk: '/sk/',
  };
}

// Legacy 2-entry shape for back-compat with existing replace calls
function buildLocaleSwitchUrls(pathname) {
  const u = buildLocaleUrls(pathname);
  return { en: u['en-US'], de: u.de };
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
  if (EU_FRENCH_SPEAKING.has(country)) return 'fr';
  if (EU_SLOVAK.has(country)) return 'sk';
  if (country === 'CH') {
    const accept = (req.headers.get('accept-language') || '').toLowerCase();
    if (accept.startsWith('de')) return 'de';
    if (accept.startsWith('fr')) return 'fr';
    return 'en-EU';
  }
  if (EU_COUNTRIES.has(country)) return 'en-EU';
  return 'en-US';
}

// Where should a locale's homepage live?
function homeFor(locale) {
  if (locale === 'de') return '/de/';
  if (locale === 'fr') return '/fr/';
  if (locale === 'sk') return '/sk/';
  if (locale === 'en-EU') return '/en/';
  return '/';
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

  // Path-aware locale: any page under /de/, /fr/, /sk/, /en/ forces that
  // locale regardless of visitor IP — US visitor manually opening /de/impressum
  // still gets the EU-DE footer. For the root path, fall back to geo+cookie.
  let pathLocale = null;
  if (url.pathname === '/de' || url.pathname.startsWith('/de/')) pathLocale = 'de';
  else if (url.pathname === '/fr' || url.pathname.startsWith('/fr/')) pathLocale = 'fr';
  else if (url.pathname === '/sk' || url.pathname.startsWith('/sk/')) pathLocale = 'sk';
  else if (url.pathname === '/en' || url.pathname.startsWith('/en/')) pathLocale = 'en-EU';
  const locale = pathLocale || classifyLocale(request);

  // Auto-redirect from root: send each visitor to their locale's homepage.
  // EU visitors → /en/ /de/ /fr/ /sk/ (keeps US-USD site for US visitors only).
  // US/ROW → stay on root.
  const isRoot = url.pathname === '/' || url.pathname === '/index.html';
  if (isRoot && locale !== 'en-US') {
    const home = homeFor(locale);
    if (home !== '/') {
      return new Response(null, {
        status: 302,
        headers: {
          location: home + (url.search || ''),
          'cache-control': 'private, max-age=0',
        },
      });
    }
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

    // Phase 8 (5-locale): locale switcher + hreflang
    const allUrls = buildLocaleUrls(url.pathname);
    const switchPartial = (partials['header-locale-switch'] || '')
      .replace('{{US_URL}}', allUrls['en-US'] || '/')
      .replace('{{EN_URL}}', allUrls['en-EU'] || '/en/')
      .replace('{{DE_URL}}', allUrls.de || '/de/')
      .replace('{{FR_URL}}', allUrls.fr || '/fr/')
      .replace('{{SK_URL}}', allUrls.sk || '/sk/');
    html = html.replaceAll('<!-- LOCALE-SWITCH -->', switchPartial);

    // Hreflang: emit only locales that exist for this page (others omitted)
    const host = url.host;
    const hreflangPairs = [
      ['en', allUrls['en-US']],
      ['en-gb', allUrls['en-EU']],
      ['de', allUrls.de],
      ['fr', allUrls.fr],
      ['sk', allUrls.sk],
    ];
    let hreflangLines = hreflangPairs
      .filter(([, p]) => p)
      .map(([lang, p]) => `<link rel="alternate" hreflang="${lang}" href="${makeAbsolute(host, p)}">`)
      .join('\n        ');
    // x-default points at the US root
    if (allUrls['en-US']) {
      hreflangLines += `\n        <link rel="alternate" hreflang="x-default" href="${makeAbsolute(host, allUrls['en-US'])}">`;
    }
    html = html.replaceAll('<!-- HREFLANG -->', hreflangLines);

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
