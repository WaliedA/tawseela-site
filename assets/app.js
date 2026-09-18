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

  /* ------------------------------------------------------------- modules */

  /* The five platform modules shown on the home page, one tab each. Copy is
     verbatim from the design source. `image` is the only asset on the site
     still served from Gamma's CDN — if it does not load the <img> is dropped
     and the slot's label shows instead of a broken image. Download the five
     into assets/modules/ and repoint these to self-host them. */
  var MODULES = [
    {
      name: 'Manifest',
      slug: 'manifest',
      title: 'Every passenger accounted for, stop by stop',
      body: 'The journey manifest boards passengers at the stop, not at the depot. Anyone not boarded is flagged where it happened, and the manifest only closes when the count matches the roster.',
      stat: '42 / 44',
      statLabel: 'Boarded, live on duty card D-221',
      points: [
        'Boarding by tap-on or face match at the door',
        'Not-boarded flagged at the stop, in the moment',
        'Manifest closes only when the count reconciles'
      ],
      client: 'National school transport operator',
      outcome: 'Zero unaccounted passengers across two consecutive school years.',
      image: 'https://cdn.gamma.app/4gsjeiuj32pgkie/design-anything/wmL0IKfs6RZSU2LV7Ilmm/3pZGhq5tB_nk9DW4nadTN.jpg'
    },
    {
      name: 'Duty',
      slug: 'duty-card',
      title: 'The driver day on one card',
      body: 'Hours of service against the published roster, with fatigue and distraction state read at the edge. The card shows what the driver has actually done today, not what the plan said they would.',
      stat: '3h 12m',
      statLabel: 'On duty, inside the fatigue threshold',
      points: [
        'Hours of service measured against the roster',
        'Fatigue and distraction state from edge vision',
        'Relief triggered before the limit, not after'
      ],
      client: 'Corporate staff transport contract',
      outcome: 'Duty breaches stopped being discovered the following week.',
      image: 'https://cdn.gamma.app/4gsjeiuj32pgkie/design-anything/NHTSsCUzssjazl38WjxjO/fFzpQ9dfSYVrygWNESgUD.jpg'
    },
    {
      name: 'Guardian',
      slug: 'guardian',
      title: 'Guardians told before they ask',
      body: 'Pickup, drop and exception notifications go to the guardian on record through one channel. No driver phone numbers, no group chats, no calls to the depot to find out where the bus is.',
      stat: '< 60 s',
      statLabel: 'From exception to guardian notification',
      points: [
        'Pickup and drop confirmations per passenger',
        'Delay, no-show and route deviation alerts',
        'One channel per guardian, driver numbers withheld'
      ],
      client: 'School transport, 14 schools',
      outcome: 'Call volume to the transport office down by two thirds.',
      image: 'https://cdn.gamma.app/4gsjeiuj32pgkie/design-anything/ikP2lr8r7IIGatIUdDnrS/0YdNXNFmsdKntuSMxNAic.jpg'
    },
    {
      name: 'Roster',
      slug: 'roster',
      title: 'Relief planned, not scrambled',
      body: 'Rosters by route, shift and depot, with licence, permit and route qualification checked before a driver is assigned. Standby drivers are matched to the gap the moment it opens.',
      stat: '6',
      statLabel: 'Reliefs pre-assigned for the morning peak',
      points: [
        'Licence, permit and route qualification checks',
        'Standby pool matched to the open duty',
        'Depot handover board for the shift supervisor'
      ],
      client: 'Labour transport, 3 depots',
      outcome: 'Morning peak covered from the standby pool instead of the phone tree.',
      image: 'https://cdn.gamma.app/4gsjeiuj32pgkie/design-anything/g7szyeJ5d37keucGIIRmL/jfxQUqv5ZifeRJwNUbhp9.jpg'
    },
    {
      name: 'Coach',
      slug: 'coaching',
      title: 'Coaching that follows the incident',
      body: 'Harsh events, speed against the posted limit and in-cabin attention are scored per driver and per route. Coaching is issued against the specific journey, with the clip attached.',
      stat: '65%',
      statLabel: 'Fewer at-fault incidents',
      points: [
        'Driver score by route, shift and journey',
        'Coaching issued with the clip attached',
        'Repeat-risk drivers surfaced weekly'
      ],
      client: 'Public transit operator',
      outcome: 'At-fault incidents down two thirds in the first full year.',
      image: 'https://cdn.gamma.app/4gsjeiuj32pgkie/design-anything/v0YC1MnAaaKixCErRhesY/tuZDYXeWMWH6DartakKg8.jpg'
    }
  ];

  var tabList = document.getElementById('module-tabs');
  var modulePanel = document.getElementById('module-panel');
  var activeModule = 0;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderModule(index) {
    var mod = MODULES[index];
    activeModule = index;

    Array.prototype.forEach.call(tabList.children, function (btn, i) {
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      btn.tabIndex = i === index ? 0 : -1;
    });
    modulePanel.setAttribute('aria-labelledby', 'tab-' + mod.slug);
    modulePanel.textContent = '';

    var left = el('div');
    left.appendChild(el('p', 'module__slug', 'tawseela.co / ' + mod.slug));
    left.appendChild(el('h3', 'module__title', mod.title));
    left.appendChild(el('p', 'module__body', mod.body));

    var figures = el('div', 'module__figures');
    var stat = el('div', 'module__stat');
    stat.appendChild(el('p', 'module__stat-value', mod.stat));
    stat.appendChild(el('p', 'module__stat-label', mod.statLabel));
    figures.appendChild(stat);

    var points = el('ul', 'module__points');
    mod.points.forEach(function (point) { points.appendChild(el('li', null, point)); });
    figures.appendChild(points);
    left.appendChild(figures);

    var aside = el('div', 'module__aside');
    var shot = el('div', 'module__shot');
    shot.appendChild(el('p', 'module__shot-label', mod.name + ' module'));
    var img = new Image();
    img.alt = mod.name + ' module';
    img.loading = 'lazy';
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    });
    img.src = mod.image;
    shot.appendChild(img);
    aside.appendChild(shot);

    var outcome = el('div', 'module__outcome');
    outcome.appendChild(el('p', 'module__outcome-kicker', 'Operator outcome'));
    outcome.appendChild(el('p', 'module__outcome-who', mod.client));
    outcome.appendChild(el('p', 'module__outcome-quote', mod.outcome));
    aside.appendChild(outcome);

    modulePanel.appendChild(left);
    modulePanel.appendChild(aside);
  }

  if (tabList && modulePanel) {
    MODULES.forEach(function (mod, i) {
      var btn = el('button', 'tabs__btn', mod.name);
      btn.type = 'button';
      btn.id = 'tab-' + mod.slug;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', 'module-panel');
      btn.addEventListener('click', function () { renderModule(i); });
      tabList.appendChild(btn);
    });

    tabList.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var step = e.key === 'ArrowRight' ? 1 : MODULES.length - 1;
      var next = (activeModule + step) % MODULES.length;
      renderModule(next);
      tabList.children[next].focus();
    });

    renderModule(0);
  }

  /* --------------------------------------------------------------- start */

  render(routeFromHash(), { scroll: false });
})();
