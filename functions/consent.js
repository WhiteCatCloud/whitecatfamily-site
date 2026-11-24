// functions/consent.js
// Counts cookie banner outcomes so we know the acceptance rate. wc-cookie.js
// sends a beacon ("shown", "accept" or "reject") and this adds 1 to that
// day's count for the visitor's country. Nothing about the visitor is kept:
// no IP, no cookie, no ID; just the day, the country code and the count.
const EVENTS = new Set(['shown', 'accept', 'reject']);

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const event = (await request.text()).trim().slice(0, 10);
        if (EVENTS.has(event) && env.DB) {
            const country = (request.headers.get('cf-ipcountry') || 'XX').toUpperCase().slice(0, 2);
            const day = new Date().toISOString().slice(0, 10);
            await env.DB.prepare(
                'INSERT INTO consent_daily (day, country, event, n) VALUES (?1, ?2, ?3, 1) ' +
                'ON CONFLICT (day, country, event) DO UPDATE SET n = n + 1'
            ).bind(day, country, event).run();
        }
    } catch (err) {
        console.error('consent count failed:', err.message);
    }
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}
