// functions/app.js
// GET /app — one short URL that lands every phone on the right store.
//
// Why this exists: the setup guide and the homepage both need to say "get the
// app". Printing two store links (or two QR codes) makes the reader choose
// between iOS and Android before they can do anything. This route makes that
// choice for them from the User-Agent, so a single QR code works on any phone.
//
// Desktop/unknown falls through to the site root rather than guessing. The
// locale middleware then sends the visitor to their own homepage, which
// carries both store badges — no duplicate UI, nothing to translate here.
//
// Deliberately NOT box-printed. /guide and /doc are the immovable URLs; this
// one is free to change.

// Two parent apps since 2026-11: the US, Mexico and Canada get WhiteCat
// Parental Control (no router, Apple Screen Time); everyone else gets the
// router app. The US app is only on sale in those three storefronts.
const IOS_URL = 'https://apps.apple.com/app/id6754770126';
const IOS_US_URL = 'https://apps.apple.com/app/id6834835936';
const US_STOREFRONTS = new Set(['US', 'MX', 'CA']);
const PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.whitecatcloud.app';

export function onRequestGet(context) {
  const ua = context.request.headers.get('user-agent') || '';

  // iPadOS 13+ reports a desktop Safari UA, so the iPad token alone is not
  // enough. Checking for the Macintosh+touch combination is unreliable
  // server-side, so we accept the small miss: an iPad on the desktop UA gets
  // the root page, which still shows both badges.
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const country = (context.request.headers.get('cf-ipcountry') || '').toUpperCase();

  let target = '/';
  if (isIOS) target = US_STOREFRONTS.has(country) ? IOS_US_URL : IOS_URL;
  else if (isAndroid) target = PLAY_URL;

  return new Response(null, {
    status: 302,
    headers: {
      location: target,
      // Per-device answer — never let a CDN or browser cache one platform's
      // redirect and serve it to the other.
      'cache-control': 'no-store',
      vary: 'User-Agent, CF-IPCountry',
    },
  });
}
