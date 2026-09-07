/* Tawseela — tawseela.co marketing site runtime.
   Replaces the Claude Design DCLogic component from "Tawseela Website.dc.html"
   with plain DOM code: hash router, mobile nav, contact form. */
(function () {
  'use strict';

  /* Where the contact form posts. Empty by default: nothing is wired yet, so
     the form hands off to email rather than silently discarding the enquiry.
     Set this to your form endpoint (Formspree, a Lambda, your CRM webhook)
     before launch and the form will POST JSON to it. */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'hello@tawseela.co';

  var ROUTES = ['home', 'school', 'staff', 'transit', 'multimodal', 'platform', 'contact'];
  var TITLES = {
    home: 'Tawseela — People Mobility AI',
    school: 'School transport — Tawseela',
    staff: 'Corporate transport — Tawseela',
    transit: 'Public transit — Tawseela',
    multimodal: 'Multimodal commute — Tawseela',
    platform: 'Platform — Tawseela',
    contact: 'Talk to us — Tawseela'
  };

  var panels = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-route]'), function (el) {
    panels[el.getAttribute('data-route')] = el;
  });

  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('nav-toggle');
  var current = null;

  function routeFromHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    return ROUTES.indexOf(raw) !== -1 ? raw : 'home';
  }

  function markCurrent(page) {
    Array.prototype.forEach.call(document.querySelectorAll('.nav__link'), function (a) {
      if (a.getAttribute('href') === '#' + page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function render(page, opts) {
    if (page === current) return;
    ROUTES.forEach(function (name) {
      if (panels[name]) panels[name].hidden = name !== page;
    });
    current = page;
    document.title = TITLES[page] || TITLES.home;
    markCurrent(page);
    resetContactForm();
    if (!opts || opts.scroll !== false) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function () {
    closeNav();
    render(routeFromHash());
    // hashchange only fires when the hash actually changed; render() has
    // already scrolled to top for that case.
  });

  /* Clicking the link for the page you are already on does not fire
     hashchange, so scroll to top here. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var target = a.getAttribute('href').slice(1);
    if (ROUTES.indexOf(target) === -1) return;
    closeNav();
    if (target === current) {
      e.preventDefault();
      window.scrollTo(0, 0);
    }
  });

  /* ------------------------------------------------------------ skip link */

  var skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', function (e) {
      var main = document.getElementById('main');
      if (!main) return;
      e.preventDefault(); // do not put #main into the hash — it is not a route
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.scrollIntoView();
    });
  }

  /* ------------------------------------------------------------ mobile nav */

  function closeNav() {
    if (!header) return;
    header.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && header) {
    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  /* ---------------------------------------------------------- contact form */

  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  var submit = document.getElementById('contact-submit');

  function resetContactForm() {
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    status.className = 'form__status';
  }

  function say(kind, html) {
    if (!status) return;
    status.className = 'form__status form__status--' + kind;
    status.innerHTML = html;
    status.hidden = false;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function readFields() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value.trim();
    });
    return data;
  }

  function firstProblem(data) {
    if (!data.name) return { field: 'name', message: 'Please give us a name so we know who we are replying to.' };
    if (!data.email) return { field: 'email', message: 'A work email is required — that is where the reply goes.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { field: 'email', message: '“' + data.email + '” is not a valid email address.' };
    }
    return null;
  }

  function mailtoFor(data) {
    var body = [
      'Name: ' + (data.name || ''),
      'Organisation: ' + (data.org || ''),
      'Work email: ' + (data.email || ''),
      'What do you move: ' + (data.segment || ''),
      'Fleet size: ' + (data.fleet || '')
    ].join('\n');
    return 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Tawseela enquiry — ' + (data.org || data.name || '')) +
      '&body=' + encodeURIComponent(body);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      resetContactForm();

      var data = readFields();
      var problem = firstProblem(data);
      if (problem) {
        say('error', '<strong>That did not send.</strong>' + escapeHtml(problem.message));
        var field = form.elements[problem.field];
        if (field) field.focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        /* No backend is wired yet. Hand the enquiry to email rather than
           showing a thank-you for a message that went nowhere. The mailto is
           a link the visitor clicks, not an automatic redirect — a redirect
           looks broken on a machine with no mail client configured. */
        say('ok',
          'One more step — this form has no inbox behind it yet. ' +
          '<a href="' + mailtoFor(data) + '"><strong>Send these details to ' +
          CONTACT_EMAIL + '</strong></a>, or write to us directly at ' +
          '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.');
        return;
      }

      submit.disabled = true;
      var label = submit.textContent;
      submit.textContent = 'Sending…';

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.text().then(function (text) {
          if (!res.ok) {
            var detail = text && text.slice(0, 400);
            throw new Error(
              'The form endpoint returned ' + res.status + ' ' + (res.statusText || '') +
              (detail ? ': ' + detail : '')
            );
          }
        });
      }).then(function () {
        form.reset();
        say('ok', 'Thank you. We will reply within two working days.');
      }).catch(function (err) {
        say('error',
          '<strong>That did not send.</strong>' +
          escapeHtml(err && err.message ? err.message : String(err)) +
          ' Your details are still in the form — retry, or email ' +
          '<a href="' + mailtoFor(data) + '">' + CONTACT_EMAIL + '</a> directly.');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
    });
  }

  /* --------------------------------------------------------------- start */

  render(routeFromHash(), { scroll: false });
})();
