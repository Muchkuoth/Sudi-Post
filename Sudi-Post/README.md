# Sudi-Post

Website and applications for **Sudi-Post Delivery Services** — a private postal, courier and
logistics network connecting South Sudan and Ethiopia.

The project is a static site: hand-written HTML, CSS and vanilla JavaScript, assembled by a small
Node.js generator. There is no framework, no bundler, no runtime dependency and no external
service. Maps, icons, fonts and every other asset are produced in-house.

---

## Quick start

```bash
node build/build.mjs      # generate the site into the repository root
node build/audit.mjs      # structural + accessibility audit of the generated HTML
```

Then open `index.html` in a browser, or serve the folder:

```bash
npx serve .               # or: python -m http.server 8000
```

Nothing else is required. There is no `npm install` step because there are no dependencies.

> Opening the generated files with `file://` works, but a local HTTP server is recommended so that
> `localStorage` behaves consistently across browsers.

---

## Demo accounts

Authentication is simulated in the browser. Use any of these on the sign-in page, or use the
one-click demo buttons.

| Role     | Email                    | Password      | Lands on   |
| -------- | ------------------------ | ------------- | ---------- |
| Customer | `customer@sudipost.com`  | `sudipost123` | `account.html` |
| Admin    | `admin@sudipost.com`     | `admin123`    | `admin.html` |
| Driver   | `driver@sudipost.com`    | `driver123`   | `driver.html` |

A known tracking reference for the public tracker is `SUD-2026-000125`.

Sessions, shipments, invoices, addresses, pickup requests, messages and notifications are held in
`localStorage` under the `sudipost:v1:` prefix. **Account → Reset local data** clears everything and
restores the seed data.

---

## Pages

| Page            | Source                        | What it does |
| --------------- | ----------------------------- | ------------ |
| `index.html`    | `build/pages/home.html`       | Home: hero, services, coverage map, rates teaser, trust signals |
| `about.html`    | `build/pages/about.html`      | Story, values, team, coverage footprint |
| `services.html` | `build/pages/services.html`   | Nine services with detail, comparison table and booking CTAs |
| `rates.html`    | `build/pages/rates.html`      | Full rate card plus an interactive cost calculator |
| `locations.html`| `build/pages/locations.html`  | 17 branches and pickup points, filterable, with a regional map |
| `send.html`     | `build/pages/send.html`       | Four-step booking wizard with a live quote and a tracking number |
| `track.html`    | `build/pages/track.html`      | Public tracking with a full event timeline and proof of delivery |
| `news.html`     | `build/pages/news.html`       | Newsroom with category filter, search and article modal |
| `business.html` | `build/pages/business.html`   | Business solutions, SLAs, volumes and enquiry form |
| `contact.html`  | `build/pages/contact.html`    | Contact form, topic chips, WhatsApp hand-off, office map, FAQ |
| `login.html`    | `build/pages/login.html`      | Sign in, demo sign-in, forgot password |
| `register.html` | `build/pages/register.html`   | Registration with live password strength |
| `payment.html`  | `build/pages/payment.html`    | Five payment methods, validation, simulated processing, receipt |
| `account.html`  | `build/pages/account.html`    | Customer portal: shipments, pickups, invoices, addresses, messages, settings |
| `admin.html`    | `build/pages/admin.html`      | Operations console: 11 views, filters, CSV export, pricing and content |
| `driver.html`   | `build/pages/driver.html`     | Driver app: manifest, navigation, proof of delivery, offline sync queue |
| `privacy.html`  | `build/pages/privacy.html`    | Privacy policy |
| `terms.html`    | `build/pages/terms.html`      | Terms of service |

`account.html`, `admin.html` and `driver.html` are built with `"chrome": false`. They render as
standalone app shells without the public header and footer, and carry
`<meta name="robots" content="noindex, nofollow">` so they never appear in search results.

---

## Project layout

```
build/
  build.mjs          static site generator
  audit.mjs          HTML/DOM/JS audit
  manifest.json      page inventory, written by the build
  layout.html        shared document shell
  partials/          header.html, footer.html
  pages/             AUTHORITATIVE page sources
assets/
  css/               base.css (tokens, layout) · components.css · pages.css
  js/                data.js · store.js · ui.js · map.js + one script per page
  img/               logo.jpg · favicon.svg · route-map.svg · van.jpg · air.jpg · time.jpg
                     pipo.jpg · loc.jpg · log.jpg · Do.png · exp.png
                     sou.jpg · ethio.jpg · ke.jpg · ug.jpg
index.html …         GENERATED — never edit these directly
```

**The generated HTML in the repository root is build output.** Edit `build/pages/*.html` and re-run
the build. Editing a root `*.html` file loses the change on the next build.

---

## How a page is defined

Each source page opens with a JSON meta block:

```html
<!--meta
{
  "title": "Track & Trace | Sudi-Post",
  "desc": "Follow your parcel...",
  "out": "track.html",
  "scripts": ["assets/js/track.js"]
}
meta-->
```

| Key        | Required | Purpose |
| ---------- | -------- | ------- |
| `title`    | yes      | `<title>`, `og:title`, `twitter:title` |
| `desc`     | yes      | Meta description, `og:description` |
| `out`      | yes      | Output filename |
| `scripts`  | no       | Extra scripts loaded after the shared ones |
| `head`     | no       | Extra markup injected into `<head>` |
| `chrome`   | no       | `false` omits the public header/footer and adds `noindex` |

`assets/js/data.js`, `assets/js/store.js` and `assets/js/ui.js` load on every page; page scripts are
appended after them. A page with no `scripts` key gets only the shared three.

The generator also injects Open Graph and Twitter tags, a canonical URL and JSON-LD
(`Organization` site-wide, `WebSite` + `SearchAction` on the home page).

---

## Architecture

### `data.js` — the single source of mock data
Brand details, the nine services, the rate card, seventeen locations, shipments, invoices, drivers,
customers, testimonials, FAQs, news articles and status vocabularies. Also `SP.API`, a promise-based
facade over the seed data, and the formatters (`SP.fmt.money`, `.date`, `.time`, `.weight`) and
helpers (`SP.ship.normaliseTracking`, `SP.ship.timeline`).

### `store.js` — persistence and the API seam
Wraps `localStorage` in a namespaced, memory-backed store, and exposes two things the UI depends on:

- `SP.store` — `listShipments` (async), `getShipment`, `addShipment`, `updateShipment`,
  `listInvoices` / `getInvoice` / `patchInvoice`, addresses, pickups, messages, notifications,
  `resetAll`.
- `SP.auth` — `register`, `login`, `loginDemo`, `logout`, `session`, `current`, `update`,
  `changePassword`.

**To move to a real backend, replace the bodies of `SP.API` and `SP.auth` with `fetch` calls.**
Nothing else in the codebase touches `localStorage` or knows the data is local. The method names and
return shapes are already the ones an HTTP client would need.

Seed records are treated as authoritative: a local record whose tracking number matches a seed
shipment is a *shadow* that overrides it (this is how driver and payment updates persist), and any
other local record is a genuinely new shipment.

### `ui.js` — the shared kernel
Icon set, DOM helpers, form validation driven by `data-rules` attributes, modal system, toasts,
tabs, chips, counters, scroll reveal, sticky header, active-nav marking, and safe navigation via
`SP.redirect` (which refuses absolute and protocol-relative targets).

Validation rules in use: `required`, `minlen:n`, `maxlen:n`, `int`, `email`, `phone`, `min:n`,
`max:n`, `luhn`, `date`.

### `map.js` — dependency-free maps
Projects latitude/longitude into an SVG coordinate space and draws the regional basemap, the
Juba–Addis corridor, and location pins. Used by the locations and contact pages. Deep links open
OpenStreetMap in a new tab, so no tile server, API key or third-party script is required.

---

## Going to production

The forms are deliberately simulated. Each one carries a comment marking the endpoint it should call:

| Area        | Endpoint to build |
| ----------- | ----------------- |
| Registration, sign-in | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` |
| Password    | `PATCH /api/v1/account/password` |
| Booking     | `POST /api/v1/shipments` |
| Payments    | `POST /api/v1/payments/intent`, provider webhook for settlement |
| Driver sync | `POST /api/v1/driver/sync` — send signature and photo as multipart form data, not JSON |
| Enquiries   | `POST /api/v1/enquiries` |

Also required before launch:

- Replace `SP.auth` with real tokens and server-side session checks. The role gates in the app shells
  are a UX affordance, not a security control.
- Move payment method fields into the provider's hosted fields or SDK so card data never touches
  this origin.
- Have counsel review `privacy.html` and `terms.html`. Both are written as complete, readable
  drafts and are clearly marked as demonstrations, but neither has been through legal review.
- Add a `Content-Security-Policy` and real caching headers at the host.

---

## Accessibility and quality

- Skip link, one `<main>` per page, labelled landmarks, and a visible focus ring throughout.
- Every icon is inline SVG with `aria-hidden="true"`; icons never carry meaning on their own.
- Every form control has a `<label>`; errors are wired with `aria-describedby` and `role="alert"`.
- The heading outline is sequential. The app shells hold a single `<h1>` that swaps between the
  signed-out gate and the app view, so exactly one `<h1>` exists in either state.
- `prefers-reduced-motion` disables reveal, counter and skeleton animations.
- Interactive targets are at least 44 × 44 px.
- Colour contrast meets WCAG 2.1 AA for body text and UI components.

`node build/audit.mjs` enforces the mechanical parts of this: icon names resolve, JS `querySelector`
targets exist in the page, local links resolve, one `<main>` per page, no duplicate `id`s, images
have `alt` text, and no page is orphaned from navigation.

---

## Brand — Deep Olive, Soft Cream and Warm Beige

| Role               | Token                  | Value     |
| ------------------ | ---------------------- | --------- |
| Deep Olive         | `--sp-navy-900`        | `#3B4626` |
| Deep Olive deepest | `--sp-navy-950`        | `#232A16` |
| Deep Olive mid     | `--sp-navy-600`        | `#6B784D` |
| Soft Cream         | `--sp-grey-50`         | `#F5EFE9` |
| Card Cream         | `--band-card`          | `#FCFAF7` |
| Pure White         | `--sp-white`           | `#FFFFFF` |
| Warm Beige         | `--sp-gold-500`        | `#D8BCAB` |
| Warm Beige deep    | `--sp-gold-700`        | `#8C6A57` |
| Warm Ink           | `--sp-grey-900`        | `#2B2620` |
| Muted Ink          | `--sp-grey-500`        | `#756958` |
| Sand border        | `--sp-grey-300`        | `#D8CCBE` |

The token names `--sp-navy-*` and `--sp-gold-*` are historical and were deliberately kept so existing
rules did not have to be renamed. They now hold Olive and Beige ramps respectively. Full 50–950
scales for both are defined at the top of `assets/css/base.css`.

### Home page bands

The home page is built as seven deliberate colour bands, exposed as reusable section classes in
`assets/css/base.css`:

| # | Section                                    | Class                     | Value     |
| - | ------------------------------------------ | ------------------------- | --------- |
| 1 | Navbar                                     | `.site-header`            | `#3B4626` |
| 2 | Hero                                       | `.hero`                   | `#F5EFE9` |
| 3 | Services                                   | `.section--cream`         | `#F5EFE9` |
| 4 | Package tracking                           | `.section--beige`         | `#D8BCAB` |
| 5 | Why Sudi-Post — customer stories           | `.section--olive`         | `#3B4626` |
| 6 | Service Areas                              | `.section--cream`         | `#F5EFE9` |
| 7 | Final CTA                                  | `.cta-band--beige`        | `#D8BCAB` |

Deep Olive carries the navigation, the trust band and every primary control. Soft Cream is the page
canvas and the card ground. Warm Beige marks the tracking band and the closing call to action, and is
used sparingly elsewhere so it keeps its emphasis.

### About statistics photographs

The About statistics band renders six `.stat` tiles. Two of them, *Branches & pickup points* and
*Customer rating*, keep their line icons inside a `.stat__icon` plate. The other four use the
photographs supplied in `assets/img/`:

| Tile | File | Subject |
| --- | --- | --- |
| Shipments delivered | `van.jpg` | delivery van |
| International destinations | `air.jpg` | air freight |
| On-time delivery rate (%) | `time.jpg` | delivery window |
| People employed | `pipo.jpg` | staff and agents |

Each slot is a `.stat__photo` plate: a 4:3 Olive gradient with the original line icon sitting
underneath and the photograph layered on top at `z-index: 1`. If a file is ever moved or removed the
`onerror` handler removes only the `<img>`, so the tile falls back to its icon on the gradient rather
than showing an empty box. `object-fit: cover` keeps every image filling the plate without distortion,
including the portrait `air.jpg`. Because the photographs are real assets they are validated normally
by `build/build.mjs` and `build/audit.mjs` — unlike the Service Area slots below.

### Service photographs

Every one of the nine services carries a `photo` field in `SP.SERVICES` (`assets/js/data.js`):

| Service | File | Subject |
| --- | --- | --- |
| Domestic Delivery | `van.jpg` | delivery van |
| International Delivery | `air.jpg` | air freight |
| Express Courier | `exp.png` | parcels on a counter |
| Door-to-Door Delivery | `Do.png` | door-step handover |
| Document Delivery | `exp.png` | parcels on a counter |
| Parcel Delivery | `van.jpg` | delivery van |
| E-Commerce Delivery | `van.jpg` | delivery van |
| Business Logistics | `log.jpg` | cargo and freight |
| Student Package Delivery | `exp.png` | parcels on a counter |

`SP.servicePhoto(service, className)` in `assets/js/ui.js` is the single renderer for all of them. It
emits the original line icon first and the `<img>` second, so the photograph always covers the icon at
`z-index: 1` and the icon stays visible as a fallback if a file is moved or removed. Because the three
call sites share one helper, adding or swapping a service photograph is a one-line data change.

`SP.servicePhoto` is used in the three places that render `SP.SERVICES`:

| Call site | Host | Plate |
| --- | --- | --- |
| `home.js` | `#homeServices` | `.service-card__icon--photo` (132×83) |
| `services.js` `serviceIndex()` | `#serviceIndex` | `.service-card__icon--photo` (132×83) |
| `services.js` `serviceDetails()` | `#serviceDetails` | `.icon-box--photo` (108×68) |

Plates are 16:10 with `object-fit: cover`. The other `.service-card__icon` and `.icon-box` usages —
surcharges on `rates.html`, assurance tiles on `send.html`, About pillars, and the Business preview —
are not services and deliberately keep their plain line icons.

### Service Area country badges

Each of the four Service Area figures is a self-contained Olive gradient panel — there are no
photograph slots to break. A single `.area-photo__flag` badge sits in the **top-left** corner of each
panel: 34×34px, with a white ring and shadow. The company mark that used to sit beside the flag was
removed, so the flag stands alone and the corner to its right is clear.

The figures declare `--area-inset`, `--area-badge` and `--area-badge-band`; the `figcaption` is
capped at `calc(100% - var(--area-badge-band))`, which reserves the top strip so the badge can never
cover the country name or the location count, however narrow the viewport or however long the
label wraps. `build/build.mjs` and `build/audit.mjs` therefore have no optional or exempt assets — every
image the site references must
exist.

Semantic colours (success `#3F6B33`, warning `#8A6A2F`, danger `#A3342A`, info `#3B4626`) and the
eight shipment-status colours `--st-*` are intentionally kept outside the brand ramp so that status
stays unambiguous for users.

| Currency     | SSP, quoted at 1 USD = 1,300 SSP |
| Type         | system UI stack for body, monospace for references |

No web fonts are downloaded. The wordmark and route map are SVG in `assets/img/`.

## Maps

All maps cover exactly four countries: **Kenya, Uganda, Ethiopia, South Sudan**. Country outlines are
baked into `assets/js/map-network.js` at build time from Natural Earth boundaries, so the maps make
no network requests at runtime. The map on `locations.html` and `contact.html` is draggable and
supports wheel, pinch, button, and keyboard zoom between 1x and 5x.

Regenerate the geometry or the static `assets/img/route-map.svg` with the helper in
`C:\Users\hp\AppData\Local\Temp\opencode\genmap.js`; verify country containment with `verify.js`.

---

## Known limitations

- All data is seeded or held in the browser. There is no server, so nothing is shared between
  browsers or devices.
- Payments, SMS and WhatsApp notifications are simulated; no provider is contacted.
- The regional map is schematic, not survey-accurate. It is drawn to show corridors and relative
  position, not for navigation.
- Driver proof-of-delivery photos and signatures are stored as data URLs in `localStorage`, which is
  fine for a demonstration and would not scale to real uploads.
- Locations, services and rates are representative of a plausible network, not a live network.
