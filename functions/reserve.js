export async function onRequestPost(context) {
    const { request, env } = context;

    let name, email, plan, utm = {};
    try {
        const data = await request.formData();
        name = (data.get('name') || '').trim();
        email = (data.get('email') || '').trim();
        plan = (data.get('plan') || 'Not specified').trim();
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
            const val = data.get(key);
            if (val) utm[key] = val.trim();
        }
    } catch {
        return Response.redirect(new URL('/thankyou.html', request.url).href, 303);
    }

    if (name && email) {
        try {
            await env.LEADS_QUEUE.send({ name, email, plan, utm, submitted_at: new Date().toISOString() });
        } catch (err) {
            console.error('Queue send failed:', err.message);
        }
    }

    return Response.redirect(new URL('/thankyou.html', request.url).href, 303);
}
