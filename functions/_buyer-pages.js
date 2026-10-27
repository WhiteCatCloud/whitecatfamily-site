// Pages a direct buyer needs, per country. Stripe allows one redirect URL per
// payment link and one terms-of-service URL per account, so those point at
// /order-complete and /terms-of-sale, which forward to the buyer's language.
// Czech and Austrian buyers have no page in their language yet: Czech readers
// get Slovak, everyone else English.
const PAGES = {
    pl: { thanks: '/pl/dziekujemy', terms: '/pl/regulamin' },
    sk: { thanks: '/sk/dakujeme', terms: '/sk/obchodne-podmienky' },
    en: { thanks: '/en/thank-you', terms: '/en/terms-of-sale' },
};

export function buyerPagesFor(request) {
    const country = (request.headers.get('cf-ipcountry') || '').toUpperCase();
    if (country === 'PL') return PAGES.pl;
    if (country === 'SK' || country === 'CZ') return PAGES.sk;
    return PAGES.en;
}
