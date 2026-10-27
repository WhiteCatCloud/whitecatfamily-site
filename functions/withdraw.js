// functions/withdraw.js
// The "withdraw from contract" function required for online sales to EU
// consumers since 19 June 2026 (Consumer Rights Directive art. 11a). Buyers
// have no account with us, so they identify the purchase themselves; the
// form on /pl/odstapienie is the confirmation step.
//
// The withdrawal goes to sales@ through the same queue as the contact form.
// The buyer gets a reference number and the time of receipt on screen at once;
// sales@ then sends the written confirmation and the free return instructions.
const PAGES = {
    pl: { form: '/pl/odstapienie', done: '/pl/odstapienie-wyslane' },
};

export async function onRequestPost(context) {
    const { request, env } = context;

    let name, email, order, reason, locale;
    try {
        const data = await request.formData();
        name = (data.get('name') || '').trim().slice(0, 200);
        email = (data.get('email') || '').trim().slice(0, 200);
        order = (data.get('order') || '').trim().slice(0, 200);
        reason = (data.get('reason') || '').trim().slice(0, 2000);
        locale = (data.get('locale') || 'pl').trim();
    } catch {
        name = '';
    }
    const pages = PAGES[locale] || PAGES.pl;

    if (!name || !email || !order) {
        return Response.redirect(new URL(pages.form + '?error=1', request.url).href, 303);
    }

    const submitted_at = new Date().toISOString();
    const ref = 'WD-' + submitted_at.slice(0, 10).replaceAll('-', '') + '-'
        + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 5);

    try {
        await env.LEADS_QUEUE.send({
            type: 'withdrawal',
            ref, name, email, order, reason, locale, submitted_at,
            // The deployed worker falls back to the preorder email if it does
            // not know this type yet, so the withdrawal is never silently lost.
            plan: `WITHDRAWAL ${ref} — order: ${order}${reason ? ' — reason: ' + reason : ''}`,
        });
    } catch (err) {
        console.error('Queue send failed:', err.message);
        return Response.redirect(new URL(pages.form + '?error=1', request.url).href, 303);
    }

    const done = new URL(pages.done, request.url);
    done.searchParams.set('ref', ref);
    done.searchParams.set('t', submitted_at);
    return Response.redirect(done.href, 303);
}
