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
// Rollout: launched 2026-06-10 — enabled by default everywhere. Set
// EU_LAUNCH_ENABLED=false in the Pages env to kill-switch back to
// pass-through (markers stay invisible comments, no redirect).

const EU_GERMAN_SPEAKING = new Set(['DE', 'AT']);
const EU_FRENCH_SPEAKING = new Set(['FR', 'MC']);
const EU_SLOVAK = new Set(['SK']);
const EU_POLISH = new Set(['PL']);
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB',
  // EEA non-EU — treat as EU for footer purposes (harmless overestimate)
  'NO', 'IS', 'LI',
]);

const VALID_LOCALES = new Set(['en-US', 'en-EU', 'de', 'fr', 'sk', 'pl']);

function readCookie(req, name) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function footerFor(locale) {
  if (locale === 'de') return 'footer-eu-de';
  if (locale === 'fr') return 'footer-eu-fr';
  if (locale === 'sk') return 'footer-eu-sk';
  if (locale === 'pl') return 'footer-eu-pl';
  if (locale === 'en-EU') return 'footer-eu-en';
  return 'footer-us';
}

function ctaFor(locale) {
  // The US cannot buy hardware at all - FCC certification is pending and the
  // March 2026 import ban covers Chinese-made routers - so en-US gets an email
  // capture instead of any storefront link.
  if (locale === 'en-US') return 'cta-notify-us';
  if (locale === 'de') return 'cta-amazon-de';
  if (locale === 'fr') return 'cta-amazon-fr';
  if (locale === 'sk') return 'cta-amazon-sk';
  if (locale === 'pl') return 'cta-amazon-pl';
  return 'cta-amazon-en';
}

function subscribeFor(locale) {
  if (locale === 'de') return 'cta-subscribe-de';
  if (locale === 'fr') return 'cta-subscribe-fr';
  if (locale === 'sk') return 'cta-subscribe-sk';
  if (locale === 'pl') return 'cta-subscribe-pl';
  return 'cta-subscribe-en';
}

function cookieFor(locale) {
  if (locale === 'de') return 'cookie-banner-de';
  if (locale === 'fr') return 'cookie-banner-fr';
  if (locale === 'sk') return 'cookie-banner-sk';
  if (locale === 'pl') return 'cookie-banner-pl';
  return 'cookie-banner-en';
}

// EN-side pages with translated /de/ filenames (privacy → datenschutz, etc.).
// FR, SK and PL are homepage-only for now, so they always link to their root.
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

// EN root pages that have a published /de/ counterpart. Pages outside this
// set get no DE hreflang (pointing hreflang at a 404 is an SEO error).
// Bases that now exist in FR, SK and PL too. /guide is the URL printed on the
// box, so a French, Slovak or Polish buyer scanning it must land on their own
// language and the locale switcher must offer real pages rather than bouncing
// them home. Add to this set whenever a page is translated into FR/SK/PL.
const FR_SK_PL_PAIRED_BASES = new Set(['guide', 'faq']);

const DE_PAIRED_BASES = new Set([
  'faq', 'privacy', 'terms', 'impressum', 'opensource', 'accessibility',
  'guide', 'doc', 'thankyou',
]);

// Buyer-facing legal pages exist under different slugs per language, so they
// cannot be paired by base name. Each row lists the real page per locale;
// a missing locale is null (no hreflang, switcher falls back to that home).
const LEGAL_PAGE_GROUPS = [
  { 'en-EU': '/en/terms-of-sale', de: '/de/agb', sk: '/sk/obchodne-podmienky', pl: '/pl/regulamin' },
  { 'en-EU': '/en/withdraw', sk: '/sk/odstupenie', pl: '/pl/odstapienie' },
  { 'en-EU': '/en/withdraw-sent', sk: '/sk/odstupenie-odoslane', pl: '/pl/odstapienie-wyslane' },
  { 'en-EU': '/en/thank-you', sk: '/sk/dakujeme', pl: '/pl/dziekujemy' },
  { 'en-US': '/privacy', de: '/de/datenschutz', sk: '/sk/ochrana-sukromia', pl: '/pl/prywatnosc' },
];

function legalGroupFor(pathname) {
  const clean = pathname.replace(/\.html$/, '');
  const group = LEGAL_PAGE_GROUPS.find((g) => Object.values(g).includes(clean));
  if (!group) return null;
  return {
    'en-US': group['en-US'] || null, 'en-EU': group['en-EU'] || null,
    de: group.de || null, fr: null, sk: group.sk || null, pl: group.pl || null,
  };
}

// Returns canonical paths for each available locale, given the current pathname.
// Used for both the locale switcher and hreflang link tags. A value of null
// means the locale isn't published for this page yet (e.g. /fr/faq doesn't
// exist, so on /faq the FR locale entry points at /fr/ instead).
function buildLocaleUrls(pathname) {
  const legal = legalGroupFor(pathname);
  if (legal) return legal;

  const isDe = pathname === '/de' || pathname.startsWith('/de/');
  const isFr = pathname === '/fr' || pathname.startsWith('/fr/');
  const isSk = pathname === '/sk' || pathname.startsWith('/sk/');
  const isPl = pathname === '/pl' || pathname.startsWith('/pl/');
  const isEnEU = pathname === '/en' || pathname.startsWith('/en/');

  // Unpaired pages — only the EN US side exists
  if (UNPAIRED_PATHS.has(pathname) || pathname.startsWith('/digital-heroin/')) {
    return { 'en-US': pathname, 'en-EU': null, de: null, fr: null, sk: null, pl: null };
  }

  // Root or US homepage variants
  if (pathname === '/' || pathname === '/index.html') {
    return { 'en-US': '/', 'en-EU': '/en/', de: '/de/', fr: '/fr/', sk: '/sk/', pl: '/pl/' };
  }

  if (isDe) {
    const base = pathname.replace(/^\/de\//, '').replace(/\.html$/, '');
    if (pathname === '/de' || pathname === '/de/') {
      return { 'en-US': '/', 'en-EU': '/en/', de: pathname, fr: '/fr/', sk: '/sk/', pl: '/pl/' };
    }
    const enBase = REVERSE_BASENAMES[base] || base;
    // Only the DE homepage has EU-EN/FR/SK/PL counterparts; secondary DE pages
    // pair with their EN-US original only.
    return {
      'en-US': '/' + enBase,
      'en-EU': null,
      de: pathname,
      fr: FR_SK_PL_PAIRED_BASES.has(enBase) ? '/fr/' + enBase : null,
      sk: FR_SK_PL_PAIRED_BASES.has(enBase) ? '/sk/' + enBase : null,
      pl: FR_SK_PL_PAIRED_BASES.has(enBase) ? '/pl/' + enBase : null,
    };
  }

  if (isFr || isSk || isPl) {
    const homes = { 'en-US': '/', 'en-EU': '/en/', de: '/de/', fr: '/fr/', sk: '/sk/', pl: '/pl/' };
    if (['/fr', '/fr/', '/sk', '/sk/', '/pl', '/pl/'].includes(pathname)) return homes;

    const base = pathname.replace(/^\/(fr|sk|pl)\//, '').replace(/\.html$/, '');
    if (FR_SK_PL_PAIRED_BASES.has(base)) {
      return {
        'en-US': '/' + base,
        'en-EU': null,
        de: '/de/' + (TRANSLATED_BASENAMES[base] || base),
        fr: '/fr/' + base,
        sk: '/sk/' + base,
        pl: '/pl/' + base,
      };
    }
    // Anything else under /fr/, /sk/ or /pl/ is untranslated — fall back to homepages
    // rather than emitting an hreflang that 404s.
    return homes;
  }

  if (isEnEU) {
    const base = pathname.replace(/^\/en\//, '').replace(/\.html$/, '');
    if (pathname === '/en' || pathname === '/en/') {
      return { 'en-US': '/', 'en-EU': pathname, de: '/de/', fr: '/fr/', sk: '/sk/', pl: '/pl/' };
    }
    const dePath = '/de/' + (TRANSLATED_BASENAMES[base] || base);
    return {
      'en-US': '/' + base,
      'en-EU': pathname,
      de: dePath,
      fr: '/fr/',
      sk: '/sk/',
      pl: '/pl/',
    };
  }

  // EN-US side (root path like /faq, /privacy, etc.). Only /en/ (homepage)
  // exists on the EU-EN side, and FR/SK/PL are homepage-only — emitting their
  // homepage as an "alternate" of a secondary page is an hreflang error, so
  // unpaired locales return null and the hreflang filter drops them.
  const base = pathname.replace(/^\//, '').replace(/\.html$/, '');
  return {
    'en-US': pathname,
    'en-EU': null,
    de: DE_PAIRED_BASES.has(base) ? '/de/' + (TRANSLATED_BASENAMES[base] || base) : null,
    fr: FR_SK_PL_PAIRED_BASES.has(base) ? '/fr/' + base : null,
    sk: FR_SK_PL_PAIRED_BASES.has(base) ? '/sk/' + base : null,
    pl: FR_SK_PL_PAIRED_BASES.has(base) ? '/pl/' + base : null,
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

// Amazon.de is the only Amazon storefront we have. There is no US listing and
// there will not be one while the FCC import ban stands, so en-US never reaches
// this (see ctaFor).
//
// The fallback is the product detail page (ASIN B0HJYRBGPW, live since 09-2026).
// It used to be a brand SEARCH while the listing did not exist yet, but a search
// lands buyers in a results list where other products and ads can rank above
// ours. Never use a /stores/ path: it 404s unless a Brand Store is published.
function amazonUrlFor(env) {
  return env.WHITECAT_AMAZON_DE_URL || 'https://www.amazon.de/dp/B0HJYRBGPW';
}

// Direct checkout for buyers outside Germany (AT, CZ, PL, SK). Until the Stripe
// payment link exists, degrade to email rather than to a dead link.
//
// Poland has its own link: a native PLN price (299 zł) that ships to Poland
// only, so the cheaper price cannot be bought for delivery elsewhere.
//
// Partner attribution: a visitor who lands with ?ref= or ?utm_source= gets
// that label passed to Stripe as client_reference_id, so each payment in the
// Stripe dashboard shows which partner link it came from. Nothing is stored
// on the visitor's device, so the label only survives on the landing page.
function stripeUrlFor(env, url, locale) {
  const base = (locale === 'pl' && env.WHITECAT_STRIPE_URL_PL)
    || env.WHITECAT_STRIPE_URL || 'mailto:sales@whitecatcloud.com';
  const ref = attributionFor(url);
  if (!ref || !base.startsWith('https://')) return base;
  const link = new URL(base);
  link.searchParams.set('client_reference_id', ref);
  return link.toString();
}

// Stripe accepts letters, digits, dashes and underscores, up to 200 chars.
function attributionFor(url) {
  const clean = (v) => (v || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60);
  const p = url.searchParams;
  const source = clean(p.get('ref') || p.get('utm_source'));
  if (!source) return '';
  const medium = clean(p.get('utm_medium'));
  return medium ? `${source}_${medium}` : source;
}

function classifyLocale(req) {
  const override = readCookie(req, 'wc_locale');
  if (override && VALID_LOCALES.has(override)) return override;

  const country = (req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (EU_GERMAN_SPEAKING.has(country)) return 'de';
  if (EU_FRENCH_SPEAKING.has(country)) return 'fr';
  if (EU_SLOVAK.has(country)) return 'sk';
  if (EU_POLISH.has(country)) return 'pl';
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
  if (locale === 'pl') return '/pl/';
  if (locale === 'en-EU') return '/en/';
  return '/';
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Launched: enabled by default. EU_LAUNCH_ENABLED=false is the kill switch;
  // preview hosts and ?eu=1 stay enabled even then for testing.
  const host = url.host;
  const isPreviewHost =
    host.startsWith('canary.') ||
    host.endsWith('.pages.dev') ||
    host === 'localhost' || host.startsWith('localhost:');
  const enabled =
    env.EU_LAUNCH_ENABLED !== 'false' ||
    url.searchParams.get('eu') === '1' ||
    isPreviewHost;
  if (!enabled) return next();

  // Bypass non-HTML assets (images, css, js, fonts, sitemap.xml, robots.txt).
  // A path is an HTML route if it is the root, ends with '/' (directory index),
  // ends with '.html', or is EXTENSIONLESS — i.e. its last segment has no dot.
  // Extensionless covers every clean URL at any depth: '/faq', '/de/faq',
  // '/digital-heroin/<slug>'. The previous single-segment regex wrongly
  // bypassed every multi-segment clean URL, so /de/* and /digital-heroin/*
  // shipped with unreplaced FOOTER/COOKIE/HREFLANG markers.
  const lastSegment = url.pathname.split('?')[0].split('/').pop();
  const isHtmlRoute =
    url.pathname === '/' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    !lastSegment.includes('.');
  if (!isHtmlRoute) {
    return next();
  }

  // Path-aware locale: any page under /de/, /fr/, /sk/, /pl/, /en/ forces that
  // locale regardless of visitor IP — US visitor manually opening /de/impressum
  // still gets the EU-DE footer. For the root path, fall back to geo+cookie.
  let pathLocale = null;
  if (url.pathname === '/de' || url.pathname.startsWith('/de/')) pathLocale = 'de';
  else if (url.pathname === '/fr' || url.pathname.startsWith('/fr/')) pathLocale = 'fr';
  else if (url.pathname === '/sk' || url.pathname.startsWith('/sk/')) pathLocale = 'sk';
  else if (url.pathname === '/pl' || url.pathname.startsWith('/pl/')) pathLocale = 'pl';
  else if (url.pathname === '/en' || url.pathname.startsWith('/en/')) pathLocale = 'en-EU';
  const locale = pathLocale || classifyLocale(request);

  // Auto-redirect from root: send each visitor to their locale's homepage.
  // EU visitors → /en/ /de/ /fr/ /sk/ /pl/ (keeps US-USD site for US visitors only).
  // US/ROW → stay on root.
  // Box-printed /guide (and /faq) follow the visitor's language like the root
  // does: a buyer in DE/AT/FR/SK/PL scanning the box lands on their own
  // translation. /guide itself still serves 200 to everyone else, and anyone
  // who picked a language in the switcher (wc_locale cookie) gets that choice.
  if (!pathLocale && ['de', 'fr', 'sk', 'pl'].includes(locale)) {
    const base = url.pathname.replace(/^\//, '').replace(/\.html$/, '');
    if (FR_SK_PL_PAIRED_BASES.has(base)) {
      return new Response(null, {
        status: 302,
        headers: {
          location: `/${locale}/${base}` + (url.search || ''),
          'cache-control': 'private, max-age=0',
        },
      });
    }
  }

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
    const cta = (partials[ctaFor(locale)] || '')
      .replaceAll('{{AMAZON_URL}}', amazonUrlFor(env))
      .replaceAll('{{STRIPE_URL}}', stripeUrlFor(env, url, locale));
    html = html.replaceAll('<!-- CTA-AMAZON -->', cta);
    html = html.replaceAll('<!-- CTA-SUBSCRIBE -->', partials[subscribeFor(locale)] || '');
    html = html.replaceAll('<!-- COOKIE -->', partials[cookieFor(locale)] || '');

    // Phase 8 (6-locale): locale switcher + hreflang
    const allUrls = buildLocaleUrls(url.pathname);
    const switchPartial = (partials['header-locale-switch'] || '')
      .replace('{{US_URL}}', allUrls['en-US'] || '/')
      .replace('{{EN_URL}}', allUrls['en-EU'] || '/en/')
      .replace('{{DE_URL}}', allUrls.de || '/de/')
      .replace('{{FR_URL}}', allUrls.fr || '/fr/')
      .replace('{{SK_URL}}', allUrls.sk || '/sk/')
      .replace('{{PL_URL}}', allUrls.pl || '/pl/');
    html = html.replaceAll('<!-- LOCALE-SWITCH -->', switchPartial);

    // Hreflang: emit only locales that exist for this page (others omitted)
    const host = url.host;
    const hreflangPairs = [
      ['en', allUrls['en-US']],
      ['en-gb', allUrls['en-EU']],
      ['de', allUrls.de],
      ['fr', allUrls.fr],
      ['sk', allUrls.sk],
      ['pl', allUrls.pl],
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
        // Injected content varies by the wc_locale cookie (and geo); declare it
        // so no future edge cache can serve one locale's render to another.
        'vary': 'Cookie',
      },
    });
  } catch (err) {
    // Log but don't propagate — visitor gets the cloned raw HTML.
    console.error('EU launch middleware error:', err);
    return fallback;
  }
}
