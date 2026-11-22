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
    document.cookie.split('; ').forEach(function (c) {
      var name = c.split('=')[0];
      if (name === '_ga' || name.indexOf('_ga_') === 0) dropCookie(name);
    });
  }

  function init() {
    if (read() === 'granted') loadMetaPixel();

    var banner = document.getElementById('wc-cookie-banner');
    if (!banner) return;
    if (!read()) banner.hidden = false;
    var accept = document.getElementById('wc-cookie-accept');
    var reject = document.getElementById('wc-cookie-reject');
    if (accept) {
      accept.addEventListener('click', function () {
        set('granted');
        banner.hidden = true;
        grant();
      });
    }
    if (reject) {
      reject.addEventListener('click', function () {
        var was = read();
        set('denied');
        banner.hidden = true;
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
