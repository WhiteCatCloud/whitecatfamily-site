PREORDER EMAIL SENDER — Cloudflare Worker
==========================================

WHAT IT DOES
------------
This Worker listens to the "preorder-leads" Cloudflare Queue.
When someone submits the "Reserve Yours" form on whitecatfamily.com,
the Pages Function (functions/reserve.js) drops the lead into that Queue.
This Worker picks it up and sends a notification email to sales@whitecatcloud.com
via Cloudflare Email Routing on whitecatfamily.com.

Flow:
  Form submit → /reserve (Pages Function) → Queue: preorder-leads → this Worker → email to Zoho inbox


FILES
-----
  index.js       — Worker code (Queue consumer + email sender)
  wrangler.toml  — Cloudflare config: Worker name, send_email binding, Queue consumer


HOW TO UPDATE
-------------
1. Edit index.js
2. From this directory, run:
   npx wrangler deploy

That's it. No dashboard changes needed.


DEPENDENCIES
------------
- Cloudflare Queue "preorder-leads" must exist (already created)
- Email Routing must be enabled on whitecatfamily.com (already enabled)
- Destination address sales@whitecatcloud.com must be verified (already verified)
- No npm packages required


FIRST-TIME SETUP (already done — for reference only)
------------------------------------------------------
1. Created Queue "preorder-leads" in Cloudflare dashboard
2. Enabled Email Routing on whitecatfamily.com
3. Verified sales@whitecatcloud.com as destination address
4. Ran: npx wrangler login
5. Ran: npx wrangler deploy
