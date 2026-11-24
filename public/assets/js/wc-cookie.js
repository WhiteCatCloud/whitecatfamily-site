(function () {
  // Meta Pixel (dataset "WhiteCat Family website"). Loaded ONLY after the
  // visitor accepts the cookie banner — never before, never on reject.
  var META_PIXEL_ID = '1126490086665904';

  function set(v) {
    document.cookie =
      'wc_consent=' + v + '; max-age=' + 365 * 24 * 3600 + '; path=/; samesite=lax';
  }
  function read() {
    var m = document.cookie.match(/(?:^|; )wc_consent=([^;]+)/);
    return m ? m[1] : null;
  }
  function dropCookie(name) {
    var host = location.hostname;
    var parts = host.split('.');
    var domains = ['', host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    else domains.push('.' + host);
    for (var i = 0; i < domains.length; i++) {
      document.cookie =
        name + '=; max-age=0; path=/' + (domains[i] ? '; domain=' + domains[i] : '');
    }
  }

  function loadMetaPixel() {
    if (window.fbq) {
      window.fbq('consent', 'grant');
      return;
    }
    /* Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function grant() {
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' });
    loadMetaPixel();
  }
  function revoke() {
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
    if (window.fbq) window.fbq('consent', 'revoke');
    dropCookie('_fbp');
    dropCookie('_fbc');
    dropCookie('wc_checkout');
    document.cookie.split('; ').forEach(function (c) {
      var name = c.split('=')[0];
      if (name === '_ga' || name.indexOf('_ga_') === 0) dropCookie(name);
    });
  }

  // Buy buttons (partials/cta-amazon-*.html, data-wc-buy) report a checkout
  // conversion: InitiateCheckout to Meta, begin_checkout to Google Analytics.
  // Only with consent; without it the click is a plain link, untouched.
  function onBuyClick(e) {
    var el = e.target && e.target.closest && e.target.closest('a[data-wc-buy]');
    if (!el || read() !== 'granted') return;
    var href = el.getAttribute('href') || '';
    if (href.indexOf('https://') !== 0) return; // mailto fallback: not a checkout
    var value = parseFloat(el.getAttribute('data-wc-value')) || 0;
    var currency = el.getAttribute('data-wc-currency') || 'EUR';
    var via = el.getAttribute('data-wc-buy');
    // Stripe checkout: remember this order so the thank-you page can report
    // the purchase with the same price (see reportPurchase). Amazon sales
    // never come back to us, so nothing to remember there.
    if (via === 'stripe') {
      var orderId = 'wc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      document.cookie = 'wc_checkout=' + orderId + '.' + value + '.' + currency +
        '; max-age=' + 2 * 24 * 3600 + '; path=/; samesite=lax';
    }
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: value, currency: currency, num_items: 1,
        content_ids: ['WCC-AX3000'], content_type: 'product',
        content_name: 'WhiteCat router', checkout: via,
      });
    }
    if (window.gtag) {
      gtag('event', 'begin_checkout', {
        value: value, currency: currency, checkout: via, transport_type: 'beacon',
        items: [{ item_id: 'WCC-AX3000', item_name: 'WhiteCat router', price: value, quantity: 1 }],
      });
    }
    holdNavigation(e, el, href);
  }

  // Thank-you page after a Stripe payment (functions/order-complete.js adds
  // ?paid=1): report Purchase to Meta and purchase to Google Analytics, once.
  // Needs consent and the wc_checkout cookie from the Buy click; both the flag
  // and the cookie are cleared so a reload or a later visit does not count again.
  function reportPurchase() {
    var params = new URLSearchParams(location.search);
    if (params.get('paid') !== '1') return;
    params.delete('paid');
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    var m = document.cookie.match(/(?:^|; )wc_checkout=([^;]+)/);
    if (!m || read() !== 'granted') return;
    dropCookie('wc_checkout');
    var parts = m[1].split('.');
    var orderId = parts[0], value = parseFloat(parts[1]) || 0, currency = parts[2] || 'EUR';
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value, currency: currency, num_items: 1,
        content_ids: ['WCC-AX3000'], content_type: 'product', content_name: 'WhiteCat router',
      }, { eventID: orderId });
    }
    if (window.gtag) {
      gtag('event', 'purchase', {
        transaction_id: orderId, value: value, currency: currency,
        items: [{ item_id: 'WCC-AX3000', item_name: 'WhiteCat router', price: value, quantity: 1 }],
      });
    }
  }

  // Same-tab links would unload the page before the events go out, so hold
  // the navigation briefly. New-tab and modifier clicks are left alone.
  function holdNavigation(e, el, href) {
    var newTab = el.target === '_blank' || e.button !== 0 ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (newTab || e.defaultPrevented) return;
    e.preventDefault();
    setTimeout(function () { location.href = href; }, 300);
  }

  // App Store / Google Play links: AppStoreClick (custom) to Meta,
  // app_store_click to Google Analytics. Consent only.
  function onAppStoreClick(e) {
    var el = e.target && e.target.closest &&
      e.target.closest('a[href*="apps.apple.com/"], a[href*="play.google.com/store/apps/"]');
    if (!el || read() !== 'granted') return;
    var href = el.getAttribute('href') || '';
    var store = href.indexOf('apps.apple.com') >= 0 ? 'app_store' : 'google_play';
    var m = store === 'app_store' ? href.match(/\/id(\d+)/) : href.match(/[?&]id=([^&]+)/);
    var params = { store: store, app_id: m ? m[1] : '', page: location.pathname };
    if (window.fbq) window.fbq('trackCustom', 'AppStoreClick', params);
    if (window.gtag) {
      gtag('event', 'app_store_click', {
        store: params.store, app_id: params.app_id, transport_type: 'beacon',
      });
    }
    holdNavigation(e, el, href);
  }

  // "Still have a question?" form (#contactForm on FAQ, privacy, terms):
  // Contact to Meta, generate_lead to Google Analytics. contact-form.js sends
  // the form; this only reports it. Skips a submit Turnstile is still holding.
  function onContactSubmit(e) {
    var form = e.target;
    if (!form || form.id !== 'contactForm' || read() !== 'granted') return;
    var token = form.querySelector('[name="cf-turnstile-response"]');
    if (token && !token.value) return;
    if (window.fbq) window.fbq('track', 'Contact', { page: location.pathname });
    if (window.gtag) gtag('event', 'generate_lead', { form: 'contact', transport_type: 'beacon' });
  }

  // ViewContent once per page, when the main buy button (EU homepages) or,
  // on pages without one, the first App Store badge is half on screen.
  // A visitor who accepts cookies later is still counted on the next scroll.
  function watchViewContent() {
    if (!('IntersectionObserver' in window)) return;
    var buy = document.querySelector('a.btn[data-wc-buy]');
    var target = buy || document.querySelector('a.store-badge');
    if (!target) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting || read() !== 'granted') continue;
        io.disconnect();
        if (buy) {
          var value = parseFloat(buy.getAttribute('data-wc-value')) || 0;
          var currency = buy.getAttribute('data-wc-currency') || 'EUR';
          if (window.fbq) {
            window.fbq('track', 'ViewContent', {
              value: value, currency: currency, content_ids: ['WCC-AX3000'],
              content_type: 'product', content_name: 'WhiteCat router',
            });
          }
          if (window.gtag) {
            gtag('event', 'view_item', {
              value: value, currency: currency,
              items: [{ item_id: 'WCC-AX3000', item_name: 'WhiteCat router', price: value, quantity: 1 }],
            });
          }
        } else {
          if (window.fbq) window.fbq('track', 'ViewContent', { content_name: 'WhiteCat app', content_type: 'product' });
          if (window.gtag) gtag('event', 'view_item', { items: [{ item_id: 'whitecat-app', item_name: 'WhiteCat app' }] });
        }
        return;
      }
    }, { threshold: 0.5 });
    io.observe(target);
  }

  // Acceptance rate: one beacon per banner outcome to functions/consent.js,
  // which only adds to a daily count per country. No cookie, no ID, nothing
  // about the visitor, so it is sent whatever they choose.
  function count(event) {
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/consent', event);
    } catch (e) { /* counting must never break the banner */ }
  }

  function init() {
    if (read() === 'granted') loadMetaPixel();
    document.addEventListener('click', onBuyClick);
    document.addEventListener('click', onAppStoreClick);
    document.addEventListener('submit', onContactSubmit);
    watchViewContent();
    reportPurchase();

    var banner = document.getElementById('wc-cookie-banner');
    if (!banner) return;
    if (!read()) {
      banner.hidden = false;
      count('shown');
    }
    var accept = document.getElementById('wc-cookie-accept');
    var reject = document.getElementById('wc-cookie-reject');
    if (accept) {
      accept.addEventListener('click', function () {
        set('granted');
        banner.hidden = true;
        count('accept');
        grant();
      });
    }
    if (reject) {
      reject.addEventListener('click', function () {
        var was = read();
        set('denied');
        banner.hidden = true;
        count('reject');
        if (was === 'granted') revoke();
      });
    }
    // "Cookie settings" link in the footer reopens the banner so consent
    // can be withdrawn as easily as it was given.
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest && e.target.closest('[data-wc-cookie-settings]');
      if (!el) return;
      e.preventDefault();
      banner.hidden = false;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
