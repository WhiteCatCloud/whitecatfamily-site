(function () {
  function set(v) {
    document.cookie =
      'wc_consent=' + v + '; max-age=' + 365 * 24 * 3600 + '; path=/; samesite=lax';
  }
  function read() {
    var m = document.cookie.match(/(?:^|; )wc_consent=([^;]+)/);
    return m ? m[1] : null;
  }
  function init() {
    var banner = document.getElementById('wc-cookie-banner');
    if (!banner) return;
    if (!read()) banner.hidden = false;
    var accept = document.getElementById('wc-cookie-accept');
    var reject = document.getElementById('wc-cookie-reject');
    if (accept) {
      accept.addEventListener('click', function () {
        set('granted');
        banner.hidden = true;
        if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' });
      });
    }
    if (reject) {
      reject.addEventListener('click', function () {
        set('denied');
        banner.hidden = true;
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
