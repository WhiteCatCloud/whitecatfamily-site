export async function onRequestPost(context) {
    const { request, env } = context;

    let name, email, plan;
    try {
        const data = await request.formData();
        name = (data.get('name') || '').trim();
        email = (data.get('email') || '').trim();
        plan = (data.get('plan') || 'Not specified').trim();
    } catch {
        return Response.redirect(new URL('/thankyou.html', request.url).href, 303);
    }

    if (name && email) {
        try {
            await env.LEADS_QUEUE.send({ name, email, plan, submitted_at: new Date().toISOString() });
        } catch (err) {
            console.error('Queue send failed:', err);
        }
    }

    return Response.redirect(new URL('/thankyou.html', request.url).href, 303);
}
