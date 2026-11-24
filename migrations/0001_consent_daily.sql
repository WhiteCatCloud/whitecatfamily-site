-- Cookie banner outcomes per day and country, counts only: no IP, no cookie,
-- no visitor ID. functions/consent.js adds one per beacon from wc-cookie.js.
--   shown  = a page view where the banner opened by itself (no choice yet)
--   accept = Accept clicked, reject = Reject clicked
CREATE TABLE consent_daily (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  event TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country, event)
);
