# tawseela.co

Public marketing site for Tawseela, the People Mobility AI vertical of Inbound.

Plain static HTML, CSS and JavaScript. No build step, no dependencies, no
framework. Any static host serves it as-is.

## Run locally

```bash
python -m http.server 5178 --directory .
```

Then open <http://localhost:5178>.

## Structure

```
index.html                  all seven views, one document
assets/styles.css           design tokens + components
assets/app.js               hash router, mobile nav, contact form
assets/tawseela-logo-red-clean.png
assets/favicon.png          logo mark, square
favicon.ico
assets/hero/*.jpg           segment hero photography (1200px, ~110-150 KB each)
assets/app/map-bg.png       street-map backdrop for the app mockups
assets/app/avatar.png       rider avatar in the app mockups
render.yaml                 Render static-site blueprint
```

## Views

Hash-routed, one document, no page reloads:

| Hash | View |
| --- | --- |
| `#home` | Home |
| `#school` | School transport |
| `#staff` | Corporate transport |
| `#transit` | Public transit |
| `#multimodal` | Multimodal commute |
| `#platform` | Platform |
| `#contact` | Talk to us |

Home is rendered visible in the markup, so the page still has content with
JavaScript disabled. Unknown hashes fall back to home.

Three parts of the page are data-driven or interactive rather than static
copy:

- **Journey manifest** (home) — a static snapshot of one morning journey,
  boarding counts per stop with the exception row highlighted.
- **Modules** (home) — five tabs (Manifest, Duty, Guardian, Roster, Coach)
  built by `assets/app.js` from the `MODULES` array, so each module's copy
  lives in one place. Arrow keys move between tabs.
- **Operations boards** (corporate, transit) — the relief roster and the
  service-delivery board. Both are a six-column half-hour grid; each bar is
  placed with `grid-column`, so its span is its duty or trip window.

## Design source

Ported from the Claude Design project **Tawseela slide deck planning**, file
`Tawseela Website.dc.html`. Positioning follows the Inbound Brand & Product
Architecture v2 §9.5.

The design source is a `.dc.html` component that depends on the Claude Design
runtime (`<x-dc>`, `<sc-if>`, `{{ handler }}` bindings, `style-hover`
attributes, `<x-import>` image slots). None of that runtime is carried over —
it was reimplemented in plain DOM code. Values, copy and layout are ported
verbatim.

### Design tokens

Colours: ink `#1d1516`, muted `#5f5252`, paper `#f4f0ef`, surface `#fbf9f8`,
line `#e0d6d5`, brand red `#CD3239`, brand deep `#B8242B`, rose `#F2B8B2`,
rose soft `#f8e1e0`, maroon `#2B0E10`, maroon-2 `#3a1418`, maroon line
`#5a2428`, dusty `#D9B5B3`.

Type: display Georgia serif (weight 500, letter-spacing −0.025 to −0.03em);
body Aptos / Segoe UI / Helvetica Neue; labels Cascadia Code / Consolas mono
12–13px uppercase, letter-spacing .1em. The app-screen mockups use Poppins
(Google Fonts), the font of the original Figma file.

Layout: max-width 1240px, 32px side padding (20px below 700px), section padding
80–96px, radii 4px (buttons) / 6–8px (cards) / 10px (large panels), sticky 72px
header with blur.

App screens (Multimodal hero): CTA `#5D63FF`, ring colours `#EB2026` `#22CBA9`
`#FFA640` `#F79E1B` `#A855F7`, chip `#FCE7E8`/`#E00035`, green `#4BA131`.

### Deliberate departures from the design source

- **Mobile navigation.** The design's six-item nav is `white-space: nowrap` and
  overflows below ~760px; the design handoff listed a hamburger as an open
  item. A hamburger is implemented here, in the design's own language.
- **Contact form.** See below.
- **Module illustrations.** The five images behind the Modules tabs are the
  only assets not self-hosted — they are still Gamma CDN URLs in the `MODULES`
  array in `assets/app.js`, because the CDN blocks the environment the site was
  built from. If one fails to load the `<img>` is removed and the slot's label
  shows, so a dead URL never renders as a broken image.
- **`assets/app/map-bg.png`.** The original 1173×696 asset could not be
  retrieved intact — only the top 51% of the PNG survived the design API's
  256 KiB per-file cap. The shipped file rebuilds full height by repeating the
  recovered band with a crossfaded seam, then downscales to 880px (the mockups
  never display it above 780px). Replace it with the original from the Figma
  file when convenient; nothing else needs to change.

## Content rules

- No client names on the public site (anonymised "national-scale school
  transport", "major UAE airline group").
- SaaS per-vehicle pricing only; no TaaS, marketplace or revenue share.
- Segment label is "Corporate", not "Staff & labour".
- Footer credit: "Powered by Inbound Automotive AI" → inbound.ae.

## Before launch

1. **Wire the contact form.** `FORM_ENDPOINT` at the top of `assets/app.js` is
   empty. While it is empty the form does not pretend to send: it validates,
   then hands the enquiry to the visitor's mail client prefilled for
   `hello@tawseela.co` and says so on screen. Set `FORM_ENDPOINT` to a real
   endpoint and it POSTs the fields as JSON, showing the endpoint's own error
   text if the post fails.
2. **Replace the contact placeholders** — `hello@tawseela.co` and "Dubai,
   United Arab Emirates" appear in `index.html` and in `CONTACT_EMAIL` in
   `assets/app.js`.
3. **Replace the hero photography.** `assets/hero/*.jpg` are the
   Gamma-generated placeholders from the design, downloaded and recompressed.
   Swap in owned photography.
4. **Self-host the module illustrations.** Download the five Gamma images
   referenced in `MODULES` (`assets/app.js`) into `assets/modules/` and
   repoint them, so the site carries no third-party image dependency.
5. **Decide on SEO.** Hash routing means the six inner views are not separately
   indexable. If organic search on segment terms matters, split them into real
   paths (`/school-transport`, `/corporate-transport`, …) — the markup is
   already one `<div data-route>` per view, so the split is mechanical.
6. **Add analytics and a privacy notice** if either is required.

## Deploy

Live at <https://tawseela-site.onrender.com> — Render static site
`tawseela-site`, auto-deploying on every push to `main`.

`render.yaml` is a Render static-site blueprint: publish path `.`, all paths
rewritten to `/index.html` so deep links survive a refresh, long cache on
`/assets/*`. Any other static host works the same way — the only requirement is
the SPA rewrite.

### Custom domain

`tawseela.co` is not attached yet. It currently sits on Above.com parking
nameservers, so records edited at the registrar have no effect until the
nameservers move first. [docs/DNS-SETUP.md](docs/DNS-SETUP.md) is the runbook:
current state, the two records Render needs, the order to do them in, and how to
verify.
