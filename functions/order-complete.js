// Stripe redirects here after a successful payment.
import { buyerPagesFor } from './_buyer-pages.js';

export function onRequestGet({ request }) {
    return Response.redirect(new URL(buyerPagesFor(request).thanks, request.url).href, 302);
}
