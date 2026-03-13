import { EmailMessage } from 'cloudflare:email';

export default {
    async queue(batch, env) {
        for (const msg of batch.messages) {
            const { name, email, plan, submitted_at } = msg.body;

            const rawEmail = [
                `From: WhiteCat Preorder <noreply@whitecatfamily.com>`,
                `To: sales@whitecatcloud.com`,
                `Subject: New Preorder: ${name} — ${plan}`,
                `MIME-Version: 1.0`,
                `Content-Type: text/plain; charset=utf-8`,
                ``,
                `New preorder from whitecatfamily.com`,
                ``,
                `Name:  ${name}`,
                `Email: ${email}`,
                `Plan:  ${plan}`,
                `Time:  ${submitted_at}`,
            ].join('\r\n');

            try {
                const message = new EmailMessage(
                    'noreply@whitecatfamily.com',
                    'sales@whitecatcloud.com',
                    rawEmail
                );
                await env.EMAIL.send(message);
                msg.ack();
            } catch (err) {
                console.error('Failed to send email:', err);
                msg.retry();
            }
        }
    },
};
