import { EmailMessage } from 'cloudflare:email';

async function sendContactEmail(env, name, email, message, locale, submitted_at) {
    const subjectPrefix = (locale === 'de' || locale === 'en-EU' || locale === 'fr' || locale === 'sk') ? '[EU] ' : '';

    const encoded = new TextEncoder().encode([
        `From: WhiteCat Contact <noreply@whitecatfamily.com>`,
        `To: sales@whitecatcloud.com`,
        `Subject: ${subjectPrefix}Website question from ${name}`,
        `Message-ID: <${Date.now()}.contact@whitecatfamily.com>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `New question from whitecatfamily.com contact form`,
        ``,
        `Name:   ${name}`,
        `Email:  ${email}`,
        `Locale: ${locale || 'en-US'}`,
        `Time:   ${submitted_at}`,
        ``,
        `Question:`,
        message,
    ].join('\r\n'));

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoded);
            controller.close();
        },
    });

    const msg = new EmailMessage('noreply@whitecatfamily.com', 'sales@whitecatcloud.com', stream);
    await env.EMAIL.send(msg);
}

async function sendLeadEmail(env, name, email, plan, locale, utm, submitted_at) {
    const utmLines = Object.keys(utm || {}).length
        ? [``, `Source: ${utm.utm_source || '—'}`, `Medium: ${utm.utm_medium || '—'}`, `Campaign: ${utm.utm_campaign || '—'}`]
        : [];

    // Tag EU leads in the subject so sales can route to SK shipping
    const subjectPrefix = (locale === 'de' || locale === 'en-EU') ? '[EU] ' : '';

    const encoded = new TextEncoder().encode([
        `From: WhiteCat Preorder <noreply@whitecatfamily.com>`,
        `To: sales@whitecatcloud.com`,
        `Subject: ${subjectPrefix}New Preorder: ${name} — ${plan}`,
        `Message-ID: <${Date.now()}.preorder@whitecatfamily.com>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `New preorder from whitecatfamily.com`,
        ``,
        `Name:   ${name}`,
        `Email:  ${email}`,
        `Plan:   ${plan}`,
        `Locale: ${locale || 'en-US'}`,
        `Time:   ${submitted_at}`,
        ...utmLines,
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
            const { type, name, email, plan, message, locale, utm, submitted_at } = msg.body;
            try {
                if (type === 'contact') {
                    await sendContactEmail(env, name, email, message, locale, submitted_at);
                } else {
                    await sendLeadEmail(env, name, email, plan, locale, utm, submitted_at);
                }
                console.log(`Email sent for ${email} (locale=${locale || 'en-US'})`);
                msg.ack();
            } catch (err) {
                console.error('Failed to send email:', err.message);
                msg.retry();
            }
        }
    },
};
