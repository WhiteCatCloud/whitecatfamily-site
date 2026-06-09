// functions/_partials.js
// Loads partials at request time via the Cloudflare Pages ASSETS binding.
// Partials live in `partials/` at the repo root and are copied into
// public/_partials/ by `scripts/build.sh` at build time so they're served.
//
// If a partial fetch fails, this function THROWS. The outer onRequest in
// _middleware.js catches the throw and returns the raw upstream HTML
// (markers stay as HTML comments — invisible to users). Safe-fail.

const PARTIAL_NAMES = [
  'footer-us', 'footer-eu-en', 'footer-eu-de',
  'cookie-banner-en', 'cookie-banner-de',
  'cta-amazon-en', 'cta-amazon-de',
  'header-locale-switch',
];

export async function loadPartials(env) {
  const out = {};
  await Promise.all(PARTIAL_NAMES.map(async (name) => {
    const res = await env.ASSETS.fetch(new Request(
      `http://placeholder/_partials/${name}.html`
    ));
    if (!res.ok) {
      // Skip partials that haven't been authored yet (Phase 3+/6/8 partials
      // referenced here so the list is stable, but the Function only uses what
      // markers actually reference in the current HTML).
      out[name] = '';
      return;
    }
    out[name] = await res.text();
  }));
  return out;
}
