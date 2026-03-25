#!/usr/bin/env node
'use strict';
/**
 * Wraps each .series-card in digital-heroin.html with an <a> tag so
 * Google can follow links to individual post pages, while the onclick
 * keeps the modal UX for human visitors.
 *
 * Idempotent: skips cards already wrapped (detects 'series-card-link').
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'digital-heroin.html');

function toSlug(title) {
  return title
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2000-\u2BFF]/g, '')
    .replace(/[^\w\s-]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
    .replace(/-[^-]*$/, '')
    .replace(/^-|-$/g, '');
}

// Extract POSTS using brace-depth counting
let html = fs.readFileSync(SOURCE, 'utf8');

// Idempotency check: if any card is already wrapped (as an element), abort
if (html.includes('class="series-card-link"')) {
  const existing = (html.match(/class="series-card-link"/g) || []).length;
  console.log(`ℹ️  Already wrapped (found ${existing} <a class="series-card-link">). Nothing to do.`);
  process.exit(0);
}

const startMark = 'const POSTS = {';
const startIdx = html.indexOf(startMark);
if (startIdx === -1) { console.error('ERROR: POSTS not found'); process.exit(1); }

let depth = 0, i = startIdx + startMark.length - 1, end = -1;
for (; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
}
const postsStr = html.slice(startIdx + 'const POSTS = '.length, end + 1);
const POSTS = eval('(' + postsStr + ')');  // eslint-disable-line no-eval

// Step 1: wrap opening <div class="series-card" data-post="N"> with <a>
let count = 0;
html = html.replace(/<div class="(series-card[^"]*)" data-post="(\d+)">/g, (match, cls, id) => {
  const post = POSTS[Number(id)];
  if (!post) return match;
  const slug = `${id}-${toSlug(post.title)}`;
  count++;
  // onclick: prevent default navigation, open modal (loadPost is the actual function name)
  // onclick only prevents navigation — the existing .series-card click listener opens the modal
  return `<a href="/digital-heroin/${slug}" class="series-card-link" onclick="event.preventDefault();"><div class="${cls}" data-post="${id}">`;
});

// Step 2: close each <a> after the series-card's closing </div>
// Structure: <div class="read-more-hint">Read full post →</div>\n                        </div>
// The second </div> closes the series-card. We insert </a> after it.
html = html.replace(
  /(<div class="read-more-hint">Read full post →<\/div>\s*<\/div>)/g,
  '$1</a>'
);

fs.writeFileSync(SOURCE, html, 'utf8');
console.log(`✅ Wrapped ${count} cards with <a> SEO links`);

// Verify: count <a class="series-card-link"> elements
const openers = (html.match(/class="series-card-link"/g) || []).length;
console.log(`   <a class="series-card-link"> elements: ${openers}`);
if (openers !== count) {
  console.warn(`⚠️  Mismatch: expected ${count}, found ${openers}. Check HTML.`);
} else {
  console.log('   ✓ All cards correctly wrapped');
}
