/* ==========================================================================
   SUDI-POST — Homepage
   Renders the data-driven sections and wires the inline tracking widget.
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, fmt, statusBadge } = SP;
  const F = SP.fmt;

  /* ---------------- Services ---------------- */
  function renderServices() {
    const host = $("#homeServices");
    if (!host) return;
    host.innerHTML = SP.SERVICES.map(function (s, i) {
      return '' +
      '<article class="card card--interactive service-card reveal" data-reveal-delay="' + (i % 3) * 90 + '" data-service="' + s.id + '">' +
        SP.servicePhoto(s, "service-card__icon service-card__icon--photo") +
        '<h3 class="service-card__title">' + esc(s.title) + "</h3>" +
        '<p class="service-card__desc">' + esc(s.desc) + "</p>" +
        '<div class="service-card__meta">' +
          '<span>' + icon("clock") + esc(s.metric) + "</span>" +
          '<span>' + icon("check-circle") + esc(s.features.length) + " features</span>" +
        "</div>" +
      "</article>";
    }).join("");
    $$("[data-service]", host).forEach(function (card) {
      card.addEventListener("click", function () {
        window.location.href = "services.html#" + card.dataset.service;
      });
    });
  }

  /* ---------------- Corridor services ---------------- */
  function renderCorridor() {
    const host = $("#homeCorridorServices");
    if (!host) return;
    const items = [
      { icon: "graduation", title: "Student packages", desc: "Consolidated support parcels with a fixed weekly schedule." },
      { icon: "file", title: "Documents", desc: "Sealed, signed and tracked from door to door." },
      { icon: "box", title: "Personal belongings", desc: "Clothes, books, electronics and household items." },
      { icon: "briefcase", title: "Business parcels", desc: "Contract stock, samples and supplier shipments." },
      { icon: "layers", title: "Small shipments", desc: "Up to 50 kg per consignment with volumetric pricing." },
      { icon: "repeat", title: "Scheduled partnerships", desc: "Fixed road freight departures three times per week each way." }
    ];
    host.innerHTML = items.map(function (i) {
      return '' +
      '<div class="corridor__service">' + icon(i.icon) +
        "<div><h4>" + esc(i.title) + "</h4><p>" + esc(i.desc) + "</p></div>" +
      "</div>";
    }).join("");
  }

  /* ---------------- Process ---------------- */
  function renderProcess() {
    const host = $("#homeProcess");
    if (!host) return;
    host.innerHTML = SP.PROCESS.map(function (p, i) {
      return '' +
      '<div class="step reveal" data-reveal-delay="' + i * 90 + '">' +
        '<div class="step__num">' + esc(p.num) + "</div>" +
        '<h3 class="step__title">' + esc(p.title) + "</h3>" +
        '<p class="step__desc">' + esc(p.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  /* ---------------- Rate preview ---------------- */
  function renderRates() {
    const host = $("#homeRateTable");
    if (!host) return;
    const head =
      '<div class="rate-row rate-row__head"><span>Zone</span><span class="text-right">Standard from</span><span class="text-right">Express from</span></div>';
    const rows = SP.ZONES.map(function (z) {
      const std = z.base + 1 * z.perKg;
      const exp = Math.round(std * 1.75);
      return '' +
      '<a class="rate-row" href="rates.html#zone-' + z.id + '">' +
        "<span><span class=\"rate-row__zone\">" + esc(z.name) + "</span>" +
          '<span class="rate-row__type">' + esc(z.transit) + "</span></span>" +
        '<span class="rate-row__std">' + F.money(std) + "</span>" +
        '<span class="rate-row__exp">' + F.money(exp) + "</span>" +
      "</a>";
    }).join("");
    host.innerHTML = head + rows;
  }

  /* ---------------- Business preview ---------------- */
  function renderBusiness() {
    const host = $("#homeBusiness");
    if (!host) return;
    host.innerHTML = SP.BUSINESS_SOLUTIONS.slice(0, 4).map(function (b) {
      return '' +
      '<div class="flex gap-3">' +
        '<span class="icon-box icon-box--sm icon-box--soft">' + icon(b.icon) + "</span>" +
        "<div><h4 style=\"font-size:var(--fs-base)\">" + esc(b.title) + "</h4>" +
        '<p class="text-sm text-muted mt-1">' + esc(b.desc) + "</p></div>" +
      "</div>";
    }).join("");
  }

  /* ---------------- Volume chart ---------------- */
  function renderVolume() {
    const host = $("#homeVolumeChart");
    if (!host) return;
    const max = Math.max.apply(null, SP.MONTHLY_VOLUME.map(function (m) { return m.standard + m.express; }));
    host.innerHTML = SP.MONTHLY_VOLUME.map(function (m) {
      const total = m.standard + m.express;
      return '' +
      '<div class="chart__row">' +
        '<span class="chart__label">' + esc(m.month) + "</span>" +
        '<span class="chart__track"><span class="chart__fill chart__fill--gold" data-bar="' +
          Math.round((total / max) * 100) + '"></span></span>' +
        '<span class="chart__val">' + total.toLocaleString("en-US") + "</span>" +
      "</div>";
    }).join("");
    SP.initBars();
  }

  /* ---------------- Locations preview ---------------- */
  function renderLocations() {
    const host = $("#homeLocations");
    if (!host) return;
    const picks = ["juba-hq", "addis", "yei", "wau", "torit", "dire-dawa"];
    host.innerHTML = picks.map(function (id) {
      const l = SP.locationById(id);
      if (!l) return "";
      return '' +
      '<article class="card service-card reveal">' +
        '<div class="flex items-center justify-between gap-3">' +
          '<span class="badge badge--navy">' + esc(l.type) + "</span>" +
          (l.pickup ? '<span class="badge badge--success">Pickup</span>' : "") +
        "</div>" +
        '<h3 class="service-card__title mt-4">' + esc(l.name) + "</h3>" +
        '<p class="service-card__desc">' + esc(l.address) + "</p>" +
        '<div class="service-card__meta">' +
          '<span>' + icon("map-pin") + esc(l.city) + ", " + esc(l.country) + "</span>" +
        "</div>" +
        '<div class="flex items-center justify-between gap-3 mt-4">' +
          '<a class="text-sm fw-600" href="tel:' + esc(l.phone.replace(/\s/g, "")) + '">' + esc(l.phone) + "</a>" +
          '<a class="btn btn--outline btn--sm" href="locations.html#' + esc(l.id) + '">Details</a>' +
        "</div>" +
      "</article>";
    }).join("");
  }

  /* ---------------- Testimonials ---------------- */
  function renderTestimonials() {
    const host = $("#homeTestimonials");
    if (!host) return;
    host.innerHTML = SP.TESTIMONIALS.slice(0, 3).map(function (t, i) {
      const stars = Array.from({ length: 5 }, function (_, n) {
        return '<span style="color:' + (n < t.rating ? "var(--sp-gold-500)" : "var(--sp-grey-300)") + '">' + icon("star", "", { size: 15 }) + "</span>";
      }).join("");
      return '' +
      '<figure class="card card--pad reveal" data-reveal-delay="' + i * 90 + '">' +
        '<div class="flex gap-1" aria-label="' + t.rating + ' out of 5 stars">' + stars + "</div>" +
        '<blockquote style="margin-top:var(--sp-4);font-size:var(--fs-base);line-height:var(--lh-loose);color:var(--sp-grey-700)">“' + esc(t.text) + "”</blockquote>" +
        '<figcaption class="flex items-center gap-3 mt-5" style="padding-top:var(--sp-4);border-top:1px solid var(--color-border)">' +
          '<span class="avatar">' + esc(SP.initials(t.name)) + "</span>" +
          "<span><span class=\"fw-700\" style=\"display:block;font-size:var(--fs-sm);color:var(--sp-navy-800)\">" + esc(t.name) + "</span>" +
          '<span class="text-xs text-muted">' + esc(t.role) + "</span></span>" +
        "</figcaption>" +
      "</figure>";
    }).join("");
  }

  /* ---------------- News ---------------- */
  function renderNews() {
    const host = $("#homeNews");
    if (!host) return;
    host.innerHTML = SP.NEWS.slice(0, 3).map(function (n, i) {
      return '' +
      '<article class="card card--interactive reveal" data-reveal-delay="' + i * 90 + '">' +
        '<div class="news-card__media" style="background:linear-gradient(' + (135 + i * 40) + 'deg,#0F4A65,#5FA3BE)">' +
          '<span class="news-card__cat">' + esc(n.cat) + "</span>" +
          icon(["package", "map-pin", "globe"][i % 3], "", { size: 72 }) +
          (n.photo ? '<img src="assets/img/' + esc(n.photo) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : "") +
        "</div>" +
        '<div class="news-card__body">' +
          '<div class="news-card__date">' + icon("calendar") + F.date(n.date) + " • " + n.read + " min read</div>" +
          '<h3 class="news-card__title mt-3">' + esc(n.title) + "</h3>" +
          '<p class="news-card__excerpt">' + esc(n.excerpt) + "</p>" +
          '<a class="link-arrow mt-4" href="news.html#' + esc(n.id) + '">Read more ' + icon("arrow-right") + "</a>" +
        "</div>" +
      "</article>";
    }).join("");
  }

  /* ---------------- FAQ ---------------- */
  function renderFaq() {
    const host = $("#homeFaq");
    if (!host) return;
    host.innerHTML = SP.FAQS.slice(0, 6).map(function (f, i) {
      return '' +
      '<details class="accordion__item"' + (i === 0 ? " open" : "") + ">" +
        "<summary>" + esc(f.q) + "</summary>" +
        '<div class="accordion__body"><p>' + esc(f.a) + "</p></div>" +
      "</details>";
    }).join("");
  }

  /* ---------------- Inline tracking widget ---------------- */
  function initTrackWidget() {
    const form = $("#homeTrackForm");
    if (!form) return;
    const input = $("#homeTrackNo");
    SP.bindValidation(form);

    $$("[data-demo-track]").forEach(function (code) {
      code.addEventListener("click", function () {
        input.value = code.dataset.demoTrack;
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      });
    });

    /* deep link: /track.html?no=SUD-2026-000125 */
    const params = new URLSearchParams(window.location.search);
    if (params.get("no")) input.value = params.get("no").toUpperCase();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SP.validateForm(form)) return;
      const no = input.value.trim().toUpperCase();
      window.location.href = "track.html?no=" + encodeURIComponent(no);
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderServices();
    renderCorridor();
    renderProcess();
    renderRates();
    renderBusiness();
    renderVolume();
    renderLocations();
    renderTestimonials();
    renderNews();
    renderFaq();
    initTrackWidget();
    SP.initReveal();
    SP.initBars();
  });
})();
