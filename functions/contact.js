// functions/contact.js
// Handles the "Still have a question?" forms on /faq, /privacy, /terms.
//
// Dual-shape payload: the deployed worker-email consumer only knows the
// preorder shape ({name, email, plan, ...}), so the question text rides in
// `plan` until the worker is redeployed. The `type`/`message` fields are
// consumed by the newer worker-email branch once it ships.
export async function onRequestPost(context) {
    const { request, env } = context;

    let name, email, message, locale, token;
    try {
        const data = await request.formData();
        name = (data.get('name') || '').trim();
        email = (data.get('email') || '').trim();
        message = (data.get('message') || '').trim();
        locale = (data.get('locale') || 'en-US').trim();
        token = data.get('cf-turnstile-response') || '';
    } catch {
        return Response.redirect(new URL('/thankyou', request.url).href, 303);
    }

    // Bots get the same redirect as people, so they can't tell they were dropped.
    if (name && email && message && await isHuman(env, token, request)) {
        try {
            await env.LEADS_QUEUE.send({
                type: 'contact',
                name, email, message, locale,
                plan: `Question: ${message}`,
                submitted_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Queue send failed:', err.message);
        }
    }

    return Response.redirect(new URL('/thankyou', request.url).href, 303);
}

// Cloudflare Turnstile check. TURNSTILE_SECRET_KEY is a Pages secret
// (production + preview); without it the form would drop every question.
async function isHuman(env, token, request) {
    if (!env.TURNSTILE_SECRET_KEY) {
        console.error('TURNSTILE_SECRET_KEY not set; accepting unverified submission');
        return true;
    }
    if (!token) {
        console.warn('Turnstile token missing');
        return false;
    }
    try {
        const body = new FormData();
        body.append('secret', env.TURNSTILE_SECRET_KEY);
        body.append('response', token);
        const ip = request.headers.get('CF-Connecting-IP');
        if (ip) body.append('remoteip', ip);
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
        const outcome = await res.json();
        if (outcome.success !== true) console.warn('Turnstile rejected:', JSON.stringify(outcome['error-codes']));
        return outcome.success === true;
    } catch (err) {
        console.error('Turnstile verify failed:', err.message);
        return false;
    }
}
