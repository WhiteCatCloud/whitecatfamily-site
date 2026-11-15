// functions/kids.js
// GET /kids — short link to WhiteCat Kids, the free app that goes on a
// child's iPhone or iPad (both the US app and the EU router app pair with it).
// iPhone/iPad → App Store; anything else → the homepage, which explains it.

const KIDS_URL = 'https://apps.apple.com/app/id6829137355';

export function onRequestGet(context) {
  const ua = context.request.headers.get('user-agent') || '';
  const target = /iPhone|iPad|iPod/i.test(ua) ? KIDS_URL : '/';
  return new Response(null, {
    status: 302,
    headers: { location: target, 'cache-control': 'no-store', vary: 'User-Agent' },
  });
}
