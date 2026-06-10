// functions/contact.js
// Handles the "Still have a question?" forms on /faq, /privacy, /terms.
//
// Dual-shape payload: the deployed worker-email consumer only knows the
// preorder shape ({name, email, plan, ...}), so the question text rides in
// `plan` until the worker is redeployed. The `type`/`message` fields are
// consumed by the newer worker-email branch once it ships.
export async function onRequestPost(context) {
    const { request, env } = context;

    let name, email, message, locale;
    try {
        const data = await request.formData();
        name = (data.get('name') || '').trim();
        email = (data.get('email') || '').trim();
        message = (data.get('message') || '').trim();
        locale = (data.get('locale') || 'en-US').trim();
    } catch {
        return Response.redirect(new URL('/thankyou', request.url).href, 303);
    }

    if (name && email && message) {
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
