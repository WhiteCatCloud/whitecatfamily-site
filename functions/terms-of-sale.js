// The terms-of-service link shown on the Stripe checkout.
import { buyerPagesFor } from './_buyer-pages.js';

export function onRequestGet({ request }) {
    return Response.redirect(new URL(buyerPagesFor(request).terms, request.url).href, 302);
}
