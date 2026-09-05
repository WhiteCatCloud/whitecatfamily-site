# CLAUDE.md — WhiteCat Family Site

Marketing and pre-order landing page for WhiteCat Family. Live at **whitecatfamily.com**.

## Stack

- **Static HTML/CSS/JS** — vanilla, no framework
- **Bootstrap 5** + custom CSS (`assets/css/main.css`)
- **Cloudflare Pages** — hosting + deployment (`wrangler.toml`, `pages_build_output_dir = "public"`)
- **Cloudflare Workers** — serverless functions (`functions/`, `worker-email/`)
- **Cloudflare Queues** — pre-order lead capture (`LEADS_QUEUE` → `preorder-leads` queue)

## What the Site Does

**Primary goal**: capture pre-order reservations at $79.

**Key sections:**
- Hero: "The screen time rules kids can't bypass" — CTA opens pre-order modal
- Why WhiteCat: pain points (late-night usage, workarounds, etc.)
- Features: DNS-level blocking, no surveillance, works on all devices
- App section: mobile app screenshots
- Pricing: $79 pre-order
- Hardware: ZBT-Z8103AX router specs
- Team
- FAQ (`/faq`)
- Digital Heroin content page (`/digital-heroin`) — educational content

**Pre-order flow**: Modal → form submit → Cloudflare Queue (`preorder-leads`) → Worker processes lead

## Product Positioning

- **"Privacy-first"** — no surveillance, no parental spying, trust-based
- **"Can't bypass"** — works at DNS/network level, not app-level
- **Target audience**: families (parents frustrated with screen time battles) + grandparents (scam protection)
- **Price**: $79 pre-order, Wi-Fi 6 router

## Deploy

```bash
# Deploy via Wrangler
wrangler pages deploy public

# Or push to main branch → Cloudflare Pages auto-deploys
```

## Key Rules

- Keep the site fast and simple — static HTML, no build step
- Pre-order leads flow through Cloudflare Queue — check `functions/` and `worker-email/` for processing logic
- Google Analytics: `G-J6R7922H8N`
- **Do not add heavy JS frameworks** — this is a marketing page, performance matters for SEO

## Permanent URLs — printed on the box (NEVER rename, NEVER 404)

These URLs are printed on physical product packaging and in-app onboarding.
Renaming requires reprinting boxes — treat as immovable.

| Path | Purpose | Stamped where |
|---|---|---|
| `/doc` | EU Declaration of Conformity (RED 2014/53/EU Art. 10(9)) | Box, product label |
| `/guide` | Setup guide (router + app) | Box, in-app onboarding |

Reject any PR that renames, redirects-away, or 404s these paths. The
`scripts/check-permanent-urls.sh` guard enforces this in CI.

## Marker rule — no inline footers, banners, or CTAs

Shared chunks (footer, cookie banner, Amazon CTA, locale switcher) live
ONLY in `partials/`. Page HTML files carry markers:

- `<!-- FOOTER -->`
- `<!-- COOKIE -->`
- `<!-- CTA-AMAZON -->`
- `<!-- LOCALE-SWITCH -->`
- `<!-- HREFLANG -->`

The Pages Function (`functions/_middleware.js`) replaces them at request time
with the locale-appropriate partial.

### Editing a partial: build and commit, or it does nothing

`partials/` is the source. **`public/_partials/` is what actually ships.**

`functions/_partials.js` fetches `/_partials/<name>.html` through the Pages
ASSETS binding, and `wrangler.toml` deploys `public/` with no build command —
so the committed `public/_partials/` copy is the deployed artifact.
`scripts/build.sh` (via `npm run build`) copies one to the other; nothing in
the deploy pipeline runs it for you.

Editing `partials/` alone fails **silently**: CI passes, the deploy succeeds,
and the site keeps serving the old content. This is how the German buy button
kept pointing at an empty Amazon search after it had supposedly been switched
to Stripe (fixed in `ed4e1a3`).

```bash
npm run build && git add public/_partials
```

`scripts/check-partials-synced.sh` enforces this in CI, in both directions —
a source edited without rebuilding, and a built copy whose source is gone.

NEVER paste a `<footer>...</footer>` block into a page HTML file. The
`scripts/check-markers-present.sh` script enforces this; CI fails the build if a page is
missing FOOTER + COOKIE markers (phase-controlled via `MARKER_PHASE`).
