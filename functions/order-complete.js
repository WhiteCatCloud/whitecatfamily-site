// Stripe redirects here after a successful payment.
// ?paid=1 tells wc-cookie.js on the thank-you page to report the purchase
// (once, with consent only); a direct visit to the thank-you page sends nothing.
import { buyerPagesFor } from './_buyer-pages.js';

export function onRequestGet({ request }) {
    const target = new URL(buyerPagesFor(request).thanks, request.url);
    target.searchParams.set('paid', '1');
    return Response.redirect(target.href, 302);
}
