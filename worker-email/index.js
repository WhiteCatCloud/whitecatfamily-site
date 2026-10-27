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

const REPLIES = {
    pl: [
        `Dzień dobry,`, ``,
        `potwierdzamy otrzymanie odstąpienia od umowy {ref} w dniu {date}.`,
        `Router prosimy odesłać w ciągu 14 dni. Koszt odesłania pokrywamy my: [instrukcja / etykieta zwrotna].`,
        `Pieniądze zwrócimy tą samą metodą płatności po otrzymaniu routera lub dowodu jego odesłania.`, ``,
        `Pozdrawiamy,`, `WhiteCat Family (Cluster s.r.o.)`,
    ],
    sk: [
        `Dobrý deň,`, ``,
        `potvrdzujeme prijatie odstúpenia od zmluvy {ref} dňa {date}.`,
        `Router nám, prosím, pošlite späť do 14 dní. Poštovné platíme my: [pokyny / štítok na vrátenie].`,
        `Peniaze vrátime rovnakým spôsobom platby po prijatí routera alebo dokladu o jeho odoslaní.`, ``,
        `S pozdravom`, `WhiteCat Family (Cluster s.r.o.)`,
    ],
    en: [
        `Hello,`, ``,
        `we confirm that we received your withdrawal from the contract, reference {ref}, on {date}.`,
        `Please send the router back within 14 days. We pay for the return: [instructions / return label].`,
        `We refund you using the same payment method once we have the router or proof that you have sent it.`, ``,
        `Kind regards,`, `WhiteCat Family (Cluster s.r.o.)`,
    ],
};

function suggestedReply(locale, ref, date) {
    const lang = REPLIES[locale] ? locale : 'en';
    return [``, `--- Suggested reply (${lang.toUpperCase()}) ---`,
        ...REPLIES[lang].map((line) => line.replace('{ref}', ref).replace('{date}', date))];
}

// A buyer withdrew from a purchase through /withdraw. Reply-To is the buyer, so
// answering this email sends the written confirmation the law asks for.
async function sendWithdrawalEmail(env, { ref, name, email, order, reason, locale, submitted_at }) {
    const encoded = new TextEncoder().encode([
        `From: WhiteCat Returns <noreply@whitecatfamily.com>`,
        `To: sales@whitecatcloud.com`,
        `Reply-To: ${email}`,
        `Subject: [${(locale || 'pl').toUpperCase()}] Withdrawal ${ref} from ${name}`,
        `Message-ID: <${Date.now()}.withdrawal@whitecatfamily.com>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `A buyer withdrew from a purchase on whitecatfamily.com.`,
        `Reply to confirm in writing and send the free return instructions.`,
        `Refund within 14 days of ${submitted_at} (may wait for the router or proof of posting).`,
        ``,
        `Reference: ${ref}`,
        `Received:  ${submitted_at}`,
        `Name:      ${name}`,
        `Email:     ${email}`,
        `Order:     ${order}`,
        `Locale:    ${locale}`,
        `Reason:    ${reason || '—'}`,
        ``,
        ...suggestedReply(locale, ref, submitted_at.slice(0, 10)),
    ].join('\r\n'));

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoded);
            controller.close();
        },
    });

    await env.EMAIL.send(new EmailMessage('noreply@whitecatfamily.com', 'sales@whitecatcloud.com', stream));
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
                } else if (type === 'withdrawal') {
                    await sendWithdrawalEmail(env, msg.body);
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
