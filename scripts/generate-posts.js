#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

// --- Config ---
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'digital-heroin.html');
const OUT_DIR = path.join(ROOT, 'public', 'digital-heroin');
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const BASE_URL = 'https://whitecatfamily.com';

// --- Session map ---
const SESSIONS = {
  1: 'Session 1 — The Hook',
  2: 'Session 1 — The Hook',
  3: 'Session 1 — The Hook',
  4: 'Session 1 — The Hook',
  5: 'Session 1 — The Hook',
  6: 'Session 1 — The Hook',
  7: 'Session 1 — The Hook',
  8: 'Session 1 — The Hook',
  9: 'Session 1 — The Hook',
  10: 'Session 1 — The Hook',
  11: 'Session 2 — The Dealers',
  12: 'Session 2 — The Dealers',
  13: 'Session 2 — The Dealers',
  14: 'Session 2 — The Dealers',
  15: 'Session 2 — The Dealers',
  16: 'Session 2 — The Dealers',
  17: 'Session 3 — The Impact on Kids &amp; Teens',
  18: 'Session 3 — The Impact on Kids &amp; Teens',
  19: 'Session 3 — The Impact on Kids &amp; Teens',
  20: 'Session 3 — The Impact on Kids &amp; Teens',
  21: 'Session 3 — The Impact on Kids &amp; Teens',
  22: 'Session 3 — The Impact on Kids &amp; Teens',
  23: 'Session 4 — Scams &amp; Seniors',
  24: 'Session 4 — Scams &amp; Seniors',
  25: 'Session 4 — Scams &amp; Seniors',
  26: 'Session 4 — Scams &amp; Seniors',
  27: 'Session 4 — Scams &amp; Seniors',
  28: 'Session 4 — Scams &amp; Seniors',
  29: 'Session 4 — Scams &amp; Seniors',
  30: 'Session 4 — Scams &amp; Seniors',
  31: 'Session 4 — Scams &amp; Seniors',
  32: 'Session 5 — Seasonal &amp; Systemic',
  33: 'Session 5 — Seasonal &amp; Systemic',
  34: 'Session 6 — What Comes Next',
  35: 'Session 6 — What Comes Next',
};

// --- Slug ---
function toSlug(title) {
  return title
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // strip supplementary-plane emoji
    .replace(/[\u2000-\u2BFF]/g, '')           // strip misc symbols
    .replace(/[^\w\s-]/g, '')                  // strip non-word chars
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
    .replace(/-[^-]*$/, '')                    // trim trailing partial word
    .replace(/^-|-$/g, '');
}

// --- Extract POSTS using brace-depth counting ---
const html = fs.readFileSync(SOURCE, 'utf8');
const startMark = 'const POSTS = {';
const startIdx = html.indexOf(startMark);
if (startIdx === -1) { console.error('ERROR: POSTS not found in source'); process.exit(1); }

let depth = 0, i = startIdx + startMark.length - 1, end = -1;
for (; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
}
if (end === -1) { console.error('ERROR: Could not find end of POSTS object'); process.exit(1); }

const postsStr = html.slice(startIdx + 'const POSTS = '.length, end + 1);
let POSTS;
try { POSTS = eval('(' + postsStr + ')'); }  // eslint-disable-line no-eval
catch (e) { console.error('ERROR: Failed to parse POSTS:', e.message); process.exit(1); }

const ids = Object.keys(POSTS).map(Number).sort((a, b) => a - b);
console.log(`Found ${ids.length} posts. Generating pages...\n`);

// --- Generate pages ---
fs.mkdirSync(OUT_DIR, { recursive: true });

const generated = [];

ids.forEach(id => {
  const post = POSTS[id];
  const slug = `${id}-${toSlug(post.title)}`;
  const filename = `${slug}.html`;
  const url = `${BASE_URL}/digital-heroin/${filename}`;
  const imgUrl = `${BASE_URL}/assets/img/digital-heroin/post-${id}.jpg`;
  const imgLocal = `/assets/img/digital-heroin/post-${id}.jpg`;
  const session = SESSIONS[id] || '';

  // Meta description: first sentence of plain text, max 160 chars
  const plainText = post.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const firstSentence = (plainText.match(/^[^.!?]+[.!?]/) || [plainText.substring(0, 160)])[0].trim().substring(0, 160);

  const idx = ids.indexOf(id);
  const prevId = idx > 0 ? ids[idx - 1] : null;
  const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
  const prevSlug = prevId ? `${prevId}-${toSlug(POSTS[prevId].title)}` : null;
  const nextSlug = nextId ? `${nextId}-${toSlug(POSTS[nextId].title)}` : null;

  // Image — check file exists; omit tag if missing
  const imgExists = fs.existsSync(path.join(ROOT, 'public', 'assets', 'img', 'digital-heroin', `post-${id}.jpg`));
  const imgHtml = imgExists
    ? `<img src="${imgLocal}" class="img-fluid rounded mb-4 w-100" style="max-height:400px;object-fit:cover;" loading="lazy" alt="">`
    : '';

  const prevBtn = prevId
    ? `<a href="/digital-heroin/${prevSlug}.html" class="btn btn-outline-secondary btn-sm">← ${POSTS[prevId].tag.replace(/[<>]/g, '')}</a>`
    : `<a href="/digital-heroin.html" class="btn btn-outline-secondary btn-sm">← All posts</a>`;
  const nextBtn = nextId
    ? `<a href="/digital-heroin/${nextSlug}.html" class="btn btn-primary btn-sm" style="background:#5d57f4;border-color:#5d57f4;">→ ${POSTS[nextId].tag.replace(/[<>]/g, '')}</a>`
    : '';

  const safeTitle = post.title.replace(/[<>]/g, '').replace(/"/g, '&quot;');

  const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>${post.title.replace(/[<>]/g, '')} — WhiteCat Family</title>
  <meta name="description" content="${firstSentence.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="WhiteCat Family">
  <meta property="og:title" content="${safeTitle} — WhiteCat Family">
  <meta property="og:description" content="${firstSentence.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="${imgUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle} — WhiteCat Family">
  <meta name="twitter:description" content="${firstSentence.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${imgUrl}">
  <link href="/assets/img/favicon.png" rel="icon">
  <link href="/assets/img/apple-touch-icon.png" rel="apple-touch-icon">
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
  <link href="/assets/vendor/aos/aos.css" rel="stylesheet">
  <link href="/assets/css/main.css?v=13" rel="stylesheet">
</head>
<body class="index-page">

  <header id="header" class="header d-flex align-items-center fixed-top">
    <div class="container position-relative d-flex align-items-center justify-content-between">
      <a href="/index.html" class="logo d-flex align-items-center me-auto me-lg-0">
        <img src="/assets/img/Image%2010-26-25%20at%2017.31.png" alt="WhiteCat Family Logo">
        <h1 class="sitename">WhiteCat Family</h1><span>.</span>
      </a>
      <nav id="navmenu" class="navmenu">
        <ul>
          <li><a href="/index.html">Home</a></li>
          <li><a href="/index.html#pricing">Pricing</a></li>
          <li><a href="/digital-heroin.html" class="active">💊 Digital Heroin</a></li>
        </ul>
        <i class="mobile-nav-toggle d-lg-none bi bi-list" role="button" tabindex="0" aria-label="Toggle navigation" aria-expanded="false"></i>
      </nav>
    </div>
  </header>

  <main class="main" style="padding-top:80px;">
    <section class="section light-background">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8">

            <div class="mb-1">
              <span style="font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#999;">${session}</span>
            </div>
            <div class="mb-3">
              <span style="display:inline-block; background:color-mix(in srgb, #5d57f4, transparent 88%); color:#5d57f4; font-size:0.75rem; font-weight:600; padding:3px 12px; border-radius:20px; letter-spacing:0.05em;">${post.tag.replace(/[<>]/g, '')}</span>
            </div>
            <h1 style="font-size:clamp(1.4rem, 3vw, 2rem); font-weight:700; line-height:1.3; margin-bottom:1.5rem;">${post.title.replace(/[<>]/g, '')}</h1>

            ${imgHtml}

            <div style="font-size:0.97rem; line-height:1.8; color:#444;">
              ${post.content}
            </div>

            <div class="d-flex justify-content-between align-items-center mt-5 pt-4" style="border-top:1px solid #eee; gap:0.5rem; flex-wrap:wrap;">
              ${prevBtn}
              ${nextBtn}
            </div>

            <div class="mt-5 p-4 rounded" style="background:color-mix(in srgb,#5d57f4,transparent 93%); border:1px solid color-mix(in srgb,#5d57f4,transparent 80%); text-align:center;">
              <p class="mb-2" style="font-weight:600; font-size:1rem;">Knowledge is the first step. Protection is the second.</p>
              <p class="mb-3" style="font-size:0.9rem; color:#666;">WhiteCat is the router that quietly enforces the boundaries you set — no arguments, no workarounds.</p>
              <a href="/index.html#pricing" class="btn px-4 py-2" style="background-color:#5d57f4; border-color:#5d57f4; color:#fff;">See Plans →</a>
            </div>

            <div class="mt-3 text-center">
              <a href="/digital-heroin.html" style="font-size:0.85rem; color:#5d57f4;">← Back to all 35 posts</a>
            </div>

          </div>
        </div>
      </div>
    </section>
  </main>

  <footer id="footer" class="footer">
    <div class="container footer-top">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2" style="font-size:0.9rem;">
          <strong class="sitename">White Cat Cloud Inc.</strong>
          <span class="text-muted">&middot;</span>
          <a href="mailto:sales@whitecatcloud.com" class="text-muted text-decoration-none">sales@whitecatcloud.com</a>
          <span class="text-muted">&middot;</span>
          <a href="https://www.linkedin.com/company/white-cat-family/?viewAsMember=true" target="_blank" rel="noopener noreferrer" class="text-muted" aria-label="WhiteCat Family on LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
        </div>
        <div class="d-flex align-items-center gap-2" style="font-size:0.9rem;">
          <a href="/faq.html" class="text-muted text-decoration-none">FAQ</a>
          <span class="text-muted">&middot;</span>
          <a href="/terms.html" class="text-muted text-decoration-none">Terms</a>
          <span class="text-muted">&middot;</span>
          <a href="/privacy.html" class="text-muted text-decoration-none">Privacy</a>
        </div>
      </div>
    </div>
    <div class="container copyright text-center mt-3">
      <p>&copy; <strong class="sitename">White Cat Cloud Inc.</strong> All Rights Reserved</p>
    </div>
  </footer>

  <a href="#" id="scroll-top" class="scroll-top d-flex align-items-center justify-content-center" aria-label="Back to top"><i class="bi bi-arrow-up-short" aria-hidden="true"></i></a>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-J6R7922H8N"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-J6R7922H8N');
  </script>
  <script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="/assets/vendor/aos/aos.js"></script>
  <script src="/assets/js/main.js?v=4"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, filename), pageHtml, 'utf8');
  generated.push({ id, slug, filename, url });
  console.log(`  ✓ ${filename}`);
});

// --- Update sitemap.xml ---
let sitemap = fs.readFileSync(SITEMAP, 'utf8');
const toAdd = generated.filter(({ url }) => !sitemap.includes(url));
const addedCount = toAdd.length;

if (toAdd.length > 0) {
  const newEntries = toAdd
    .map(({ url }) => `    <url>\n        <loc>${url}</loc>\n        <changefreq>yearly</changefreq>\n        <priority>0.7</priority>\n    </url>`)
    .join('\n');
  sitemap = sitemap.replace('</urlset>', `${newEntries}\n</urlset>`);
  fs.writeFileSync(SITEMAP, sitemap, 'utf8');
  console.log(`\n✓ Added ${addedCount} new entries to sitemap.xml`);
} else {
  console.log('\n✓ Sitemap already up to date (0 new entries)');
}

console.log(`\n✅ Done — ${generated.length} post pages in public/digital-heroin/`);
