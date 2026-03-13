import { EmailMessage } from 'cloudflare:email';

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
            const body = [
                `New preorder request from whitecatfamily.com`,
                ``,
                `Name:  ${name}`,
                `Email: ${email}`,
                `Plan:  ${plan}`,
            ].join('\n');

            const rawEmail = [
                `From: WhiteCat Preorder <noreply@whitecatfamily.com>`,
                `To: sales@whitecatcloud.com`,
                `Subject: New Preorder: ${name} — ${plan}`,
                `MIME-Version: 1.0`,
                `Content-Type: text/plain; charset=utf-8`,
                ``,
                body,
            ].join('\r\n');

            const encoded = new TextEncoder().encode(rawEmail);
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoded);
                    controller.close();
                },
            });

            const message = new EmailMessage(
                'noreply@whitecatfamily.com',
                'sales@whitecatcloud.com',
                stream
            );
            await env.EMAIL.send(message);
        } catch (err) {
            console.error('Email send failed:', err);
            // Still redirect — don't block the user
        }
    }

    return Response.redirect(new URL('/thankyou.html', request.url).href, 303);
}
