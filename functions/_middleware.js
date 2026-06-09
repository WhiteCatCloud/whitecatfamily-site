// functions/_middleware.js
// Cloudflare Pages Function — runs on every request.
//
// Phase 1: classify locale from cf-ipcountry + cookie. No content injection yet.
// Phase 2+ adds marker replacement INSIDE the existing try block.
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

  // Rollout gate: until EU_LAUNCH_ENABLED=true, behave as pure pass-through.
  // Lets us deploy Function code to prod safely; flip the env var to activate.
  // (Override per-request with ?eu=1 during preview testing.)
  const enabled = env.EU_LAUNCH_ENABLED === 'true' || url.searchParams.get('eu') === '1';
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

  const locale = classifyLocale(request);

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

    // Phase 1: set data-locale attribute only; no other injection.
    // Use replaceAll for marker swaps in later phases (NOT replace) — markers
    // may legitimately appear more than once on a page (e.g. multiple CTAs).
    html = html.replace(/<html(\s[^>]*)?>/i, (m, attrs) => {
      const cleaned = (attrs || '').replace(/\s+data-locale="[^"]*"/g, '');
      return `<html${cleaned} data-locale="${locale}">`;
    });

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
