/* Shared enhancements on every page. Translation and chat are third-party services. */
(function () {
  "use strict";
  var button = document.querySelector('.translate-toggle');
  var panel = document.getElementById('translate-panel');
  var status = document.querySelector('.translate-status');
  var started = false;
  window.tetraTranslateReady = function () {
    if (!window.google || !google.translate || !google.translate.TranslateElement) {
      if (status) status.textContent = 'Translation is unavailable right now.';
      return;
    }
    new google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
    if (status) status.textContent = '';
  };
  function loadTranslator() {
    if (started || !panel) return;
    started = true;
    status.textContent = 'Loading languages…';
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=tetraTranslateReady';
    script.async = true;
    script.onerror = function () { status.textContent = 'Translation could not load. Please try again later.'; };
    document.head.appendChild(script);
    setTimeout(function () { if (!document.querySelector('.goog-te-combo') && status.textContent === 'Loading languages…') status.textContent = 'Translation is taking longer than expected or is unavailable.'; }, 12000);
  }
  if (button && panel) {
    button.addEventListener('click', function () {
      var opening = panel.hidden;
      panel.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
      if (opening) loadTranslator();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); button.focus(); }
    });
    // Google stores its selected language in a cookie; restore it across our pages.
    if (/(?:^|;\s*)googtrans=/.test(document.cookie)) loadTranslator();
  }
  var key = window.TETRATRADES_CONFIG && window.TETRATRADES_CONFIG.smartsuppKey;
  if (typeof key === 'string' && /^[a-zA-Z0-9_-]+$/.test(key)) {
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = key;
    if (!window.smartsupp) {
      var queue = function () { queue._.push(arguments); };
      queue._ = [];
      window.smartsupp = queue;
      var chat = document.createElement('script');
      chat.async = true; chat.charset = 'utf-8';
      chat.src = 'https://www.smartsuppchat.com/loader.js';
      document.head.appendChild(chat);
    }
    document.querySelectorAll('[data-chat-link]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        window.smartsupp('chat:open');
      });
    });
  }
})();
