/**
 * "Still have a question?" form — submit via fetch, show thank-you message.
 * Loaded on every page that carries #contactForm, next to the Turnstile script.
 */
(function() {
  "use strict";

  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // Turnstile is still deciding; the widget shows itself if it needs a click.
    const token = this.querySelector('[name="cf-turnstile-response"]');
    if (token && !token.value) return;
    fetch('/contact', { method: 'POST', body: new FormData(this) });
    this.style.display = 'none';
    document.getElementById('contactThanks').style.display = '';
  });

})();
