# Digital Heroin Series — SEO-Indexable Post Pages

**Date:** 2026-03-14
**Status:** Approved

## Problem

The 35 Digital Heroin series posts on `digital-heroin.html` are stored entirely in a JavaScript `POSTS` object and rendered into a Bootstrap modal on click. Google cannot crawl or index this content. The posts contain high-value, search-relevant text about screen addiction, child safety, and digital wellbeing — topics parents actively search for.

## Goal

Make all 35 posts indexable by Google while preserving the existing modal UX for human visitors.

## Approach

Static HTML generation: a one-time Node.js script reads the `POSTS` data from `digital-heroin.html` and writes 35 HTML files into `public/digital-heroin/`. Files are committed to the repo. No build step needed on Cloudflare Pages.

## URL Structure

Hybrid: number + slug. Slugs are generated from post titles by the algorithm below.

```
/digital-heroin/1-how-social-media-hooks-you-like-a-slot-machine.html
/digital-heroin/2-the-dark-tactics-of-addictive-app-design.html
...
/digital-heroin/35-the-parental-dilemma-just-talk-to-them-isnt-enough.html
```

Slugs are derived from post titles using this exact algorithm:
1. Strip leading emoji and punctuation
2. Lowercase
3. Replace spaces with hyphens
4. Strip any character that is not `a-z`, `0-9`, or `-`
5. Collapse multiple consecutive hyphens to one
6. Trim leading/trailing hyphens
7. Truncate to 50 characters at a hyphen boundary

Example: `"🎰 How Social Media Hooks You Like a Slot Machine"` → `how-social-media-hooks-you-like-a-slot-machine`

The full slug list is deterministic from this algorithm. No collision handling needed (all 35 post titles produce distinct slugs).

## Components

### 1. Generation script — `scripts/generate-posts.js`

**Working directory:** The script is run as `node scripts/generate-posts.js` from the repository root (`/path/to/whitecatfamily-site`). All file paths in the script are relative to the repo root.

- Reads `public/digital-heroin.html` with Node.js `fs`
- Extracts the `POSTS` object using brace-depth counting:
  1. Find the index of `const POSTS = {` in the file string
  2. Starting from the opening `{`, scan character-by-character tracking brace depth (increment on `{`, decrement on `}`)
  3. Stop when depth returns to 0 — that is the end of the `POSTS` object
  4. Evaluate the extracted string with `eval('(' + extracted + ')')` wrapped in a try/catch — safe for a local build script against known local source
- For each post (1–35):
  - Derives slug from title
  - Determines prev/next post numbers and slugs
  - Renders a full HTML file using a template
  - Writes to `public/digital-heroin/{N}-{slug}.html`
- Run once: `node scripts/generate-posts.js`

### 2. Post page template

Each generated page matches the existing site style:

**Path strategy:** All asset and internal links use root-relative paths (starting with `/`) so they work regardless of the page's directory depth.

- Same `<head>` as `digital-heroin.html` (Bootstrap, AOS, main.css, fonts) — all paths root-relative (e.g., `/assets/vendor/bootstrap/...`, `/assets/css/main.css`)
- Unique `<title>`: post title + " — WhiteCat Family"
- Unique `<meta name="description">`: first sentence of post content (stripped of HTML tags)
- `og:url`: `https://whitecatfamily.com/digital-heroin/{N}-{slug}.html`
- `og:title`: post title
- `og:description`: same as meta description
- `og:image`: `https://whitecatfamily.com/assets/img/digital-heroin/post-N.jpg` (absolute URL, using the post number)
- `<link rel="canonical">` pointing to the post's own absolute URL
- Same header/nav as `digital-heroin.html` (including mobile nav)
- Same footer
- Content section:
  - Session label (e.g., "Session 1 — The Hook")
  - Tag pill (e.g., "#1 · The Slot Machine Effect")
  - H1: post title
  - Post image: `/assets/img/digital-heroin/post-N.jpg` (root-relative, with `loading="lazy"`). All 35 post images already exist. If a file is missing, the `<img>` tag is omitted rather than left broken.
  - Full article HTML from `POSTS[N].content`
  - Prev / Next navigation (purple buttons, same style as existing site buttons)
  - CTA: "Protect your family — see WhiteCat plans →" linking to `/index.html#pricing` (root-relative)
  - Back link: "← Back to all 35 posts" linking to `/digital-heroin.html` (root-relative)
- Same `main.js` for scroll, nav toggle, AOS

### 3. Links in digital-heroin.html

Each `.series-card` div is wrapped in an `<a>` tag pointing to the post page:

```html
<a href="/digital-heroin/1-how-social-media-hooks-you-like-a-slot-machine.html"
   class="series-card-link"
   onclick="event.preventDefault(); openPost(1);">
  <div class="series-card" data-post="1">
    ...
  </div>
</a>
```

CSS: `.series-card-link { text-decoration: none; color: inherit; display: block; }` so the anchor is invisible to humans.

The `onclick` calls the existing modal-opening logic. Google ignores JS and follows the `href` directly.

### 4. Sitemap update

`public/sitemap.xml` gets 35 new `<url>` entries. **The generation script updates `sitemap.xml` automatically** — it reads the existing file, appends the 35 new entries before the closing `</urlset>` tag (skipping any that already exist to allow safe re-runs), and writes the file back.

```xml
<url>
  <loc>https://whitecatfamily.com/digital-heroin/1-how-social-media-hooks-you-like-a-slot-machine.html</loc>
  <changefreq>yearly</changefreq>
  <priority>0.7</priority>
</url>
```

The script prints the full list of generated slugs to stdout so the operator can verify.

## File Output

```
public/
  digital-heroin/
    1-how-social-media-hooks-you-like-a-slot-machine.html
    2-the-dark-tactics-of-addictive-app-design.html
    ...
    35-the-parental-dilemma-just-talk-to-them-isnt-enough.html
scripts/
  generate-posts.js
public/
  sitemap.xml   (updated — 35 new entries)
  digital-heroin.html  (updated — <a> wrappers on cards)
```

## SEO Notes

- Each page has a unique `<title>` and `<meta description>` — critical for Google ranking
- `<link rel="canonical">` prevents any duplicate content issues
- Post images already exist — they appear on the page, adding visual content signals
- Prev/next links create internal linking across all 35 posts, helping Google discover and crawl the full series
- `digital-heroin.html` cards link to all 35 post pages — Google follows those links from the already-submitted sitemap page

## What Doesn't Change

- The modal UX on `digital-heroin.html` is unchanged for human visitors
- No build step added to Cloudflare Pages deployment
- No new dependencies beyond Node.js (already available locally)
- The generation script is run locally and the output committed — Cloudflare Pages serves the static files as-is
