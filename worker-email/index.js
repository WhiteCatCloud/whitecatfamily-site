import { EmailMessage } from 'cloudflare:email';

async function sendLeadEmail(env, name, email, plan, submitted_at) {
    const encoded = new TextEncoder().encode([
        `From: WhiteCat Preorder <noreply@whitecatfamily.com>`,
        `To: sales@whitecatcloud.com`,
        `Subject: New Preorder: ${name} — ${plan}`,
        `Message-ID: <${Date.now()}.preorder@whitecatfamily.com>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `New preorder from whitecatfamily.com`,
        ``,
        `Name:  ${name}`,
        `Email: ${email}`,
        `Plan:  ${plan}`,
        `Time:  ${submitted_at}`,
    ].join('\r\n'));

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoded);
            controller.close();
        },
    });

    const message = new EmailMessage('noreply@whitecatfamily.com', 'sales@whitecatcloud.com', stream);
    await env.EMAIL.send(message);
}

export default {
    async fetch() {
        return new Response('Not found', { status: 404 });
    },

    async queue(batch, env) {
        for (const msg of batch.messages) {
            const { name, email, plan, submitted_at } = msg.body;
            try {
                await sendLeadEmail(env, name, email, plan, submitted_at);
                console.log(`Email sent for ${email}`);
                msg.ack();
            } catch (err) {
                console.error('Failed to send email:', err.message);
                msg.retry();
            }
        }
    },
};
