/* ==========================================================================
   SUDI-POST — Services page
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc } = SP;

  const TRANSIT = {
    domestic: "1–4 days", international: "7–21 days", express: "24–72 hours",
    "door-to-door": "Same day – 2 days", documents: "Same day – 2 days",
    parcel: "1–5 days", ecommerce: "1–4 days", business: "Scheduled",
    student: "3–6 days (Juba ⇄ Addis)"
  };
  const BEST_FOR = {
    domestic: "Letters, documents and parcels within South Sudan",
    international: "Parcels to Africa, the Middle East and beyond",
    express: "Urgent documents, medical and time-critical items",
    "door-to-door": "Customers who cannot come to a branch",
    documents: "Certificates, contracts, legal and exam papers",
    parcel: "Boxes of any size up to 50 kg",
    ecommerce: "Online sellers and marketplace orders",
    business: "Companies, NGOs and institutions with regular volume",
    student: "Students and their families across the border"
  };
  const USABLE = ["domestic", "international", "express", "door-to-door", "documents", "parcel"];

  function serviceIndex() {
    const host = $("#serviceIndex");
    host.innerHTML = SP.SERVICES.map(function (s, i) {
      return '' +
      '<a class="card card--interactive service-card reveal" href="#' + s.id + '" data-reveal-delay="' + (i % 3) * 80 + '">' +
        SP.servicePhoto(s, "service-card__icon service-card__icon--photo") +
        '<h3 class="service-card__title">' + esc(s.title) + "</h3>" +
        '<p class="service-card__desc">' + esc(s.desc) + "</p>" +
        '<div class="service-card__meta">' +
          '<span>' + icon("clock") + esc(TRANSIT[s.id]) + "</span>" +
        "</div>" +
      "</a>";
    }).join("");
  }

  function serviceDetails() {
    const host = $("#serviceDetails");
    host.innerHTML = SP.SERVICES.map(function (s, i) {
      const flip = i % 2 === 1;
      const zone = SP.ZONES.filter(function (z) { return z.id === s.zone; })[0];
      return '' +
      '<section class="section' + (flip ? " section--soft" : "") + '" id="' + s.id + '" aria-labelledby="svc-' + s.id + '">' +
        '<div class="container">' +
          /* .split, not a hard coded two track grid: minmax(0, 1fr) beside a
             fixed 440px has no width to give the first column on a phone, so
             it collapsed to 0px and the title, lead, feature list and buttons
             were all rendered at zero width. .split carries the same aside
             width and folds to one fluid column instead. */
          '<div class="split" style="--split-side:440px">' +
            "<div>" +
              SP.servicePhoto(s, "icon-box icon-box--photo" + (i % 3 === 1 ? " icon-box--gold" : "")) +
              '<h2 class="section-title" id="svc-' + s.id + '" style="margin-top:var(--sp-4)">' + esc(s.title) + "</h2>" +
              '<p class="lead mt-4">' + esc(s.desc) + "</p>" +
              '<div class="grid grid--2 mt-6" style="gap:var(--sp-4)">' +
                s.features.map(function (f) {
                  return '<div class="flex gap-2 items-start"><span style="color:var(--sp-success);flex:none;margin-top:2px">' + icon("check-circle", "", { size: 18 }) + "</span>" +
                    '<span class="text-sm">' + esc(f) + "</span></div>";
                }).join("") +
              "</div>" +
              '<div class="flex flex-wrap gap-3 mt-6">' +
                '<a class="btn btn--primary" href="send.html?service=' + s.id + '">' + icon("send", "", { size: 18 }) + "Book this service</a>" +
                '<a class="btn btn--outline" href="rates.html?service=' + s.id + '">See rates</a>' +
              "</div>" +
            "</div>" +
            '<div class="card card--raised">' +
              '<div class="card__body">' +
                '<h3 style="font-size:var(--fs-md)">Service summary</h3>' +
                '<dl class="dl mt-4">' +
                  '<div class="dl__row"><dt>Typical transit</dt><dd>' + esc(TRANSIT[s.id]) + "</dd></div>" +
                  '<div class="dl__row"><dt>Coverage zone</dt><dd>' + esc(zone ? zone.name : "Custom") + "</dd></div>" +
                  '<div class="dl__row"><dt>Collection</dt><dd>Door pickup or branch drop-off</dd></div>' +
                  '<div class="dl__row"><dt>Tracking</dt><dd>Online, SMS, email &amp; WhatsApp</dd></div>' +
                  '<div class="dl__row"><dt>Proof of delivery</dt><dd>' + (USABLE.indexOf(s.id) > -1 || s.id === "ecommerce" ? "Signature mandatory" : "On request") + "</dd></div>" +
                  '<div class="dl__row"><dt>Insurance</dt><dd>2% of declared value</dd></div>' +
                "</dl>" +
                '<hr class="mt-5 mb-4">' +
                '<div class="text-xs text-muted fw-700 uppercase" style="letter-spacing:var(--ls-wider)">Popular destinations</div>' +
                '<div class="chip-row mt-3">' +
                  (zone ? zone.destinations.slice(0, 4).map(function (d) {
                    return '<span class="chip" style="pointer-events:none">' + esc(d) + "</span>";
                  }).join("") : "") +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</section>";
    }).join("");
  }

  function processSteps() {
    const host = $("#serviceProcess");
    host.innerHTML = SP.PROCESS.map(function (p, i) {
      return '' +
      '<div class="step reveal" data-reveal-delay="' + i * 90 + '">' +
        '<div class="step__num">' + esc(p.num) + "</div>" +
        '<h3 class="step__title" style="color:var(--sp-white)">' + esc(p.title) + "</h3>" +
        '<p class="step__desc" style="color:var(--sp-navy-200)">' + esc(p.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  function comparison() {
    const host = $("#compareBody");
    host.innerHTML = SP.SERVICES.map(function (s) {
      return '' +
      "<tr>" +
        "<td><span class=\"table__primary\">" + esc(s.title) + "</span></td>" +
        "<td>" + esc(TRANSIT[s.id]) + "</td>" +
        '<td class="text-muted">' + esc(BEST_FOR[s.id]) + "</td>" +
        '<td><span class="badge badge--success badge--none">' + icon("check") + "</span></td>" +
        '<td><span class="badge badge--success badge--none">' + icon("check") + "</span></td>" +
        '<td><a class="btn btn--outline btn--xs" href="send.html?service=' + s.id + '">Book</a></td>' +
      "</tr>";
    }).join("");
  }

  function faqs() {
    const host = $("#serviceFaq");
    host.innerHTML = SP.FAQS.map(function (f, i) {
      return '<details class="accordion__item"' + (i === 0 ? " open" : "") + "><summary>" + esc(f.q) +
        '</summary><div class="accordion__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  function init() {
    serviceIndex();
    serviceDetails();
    processSteps();
    comparison();
    faqs();

    /* highlight active service in the index when jumping via anchor */
    const links = $$("#serviceIndex a");
    if (links.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id); });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      SP.SERVICES.forEach(function (s) {
        const node = document.getElementById(s.id);
        if (node) io.observe(node);
      });
    }
    SP.initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
