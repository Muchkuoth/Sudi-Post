/* ==========================================================================
   SUDI-POST — About page
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, esc, countUp } = SP;

  const STORY = [
    "Sudi-Post began in 2019 in a rented garage on Malakia Road, Juba. Two people, no vehicle of our own, and a simple observation: families and small businesses were sending parcels across the Juba–Addis Ababa corridor in private vehicles with no way to know whether the parcel had arrived, or who had taken it.",
    "The first thing we built was not the network — it was the record. Every parcel was weighed, logged with a reference, and its holder's name written down. That habit is still the backbone of how we operate, and it is why our customers can look at a delivery and see exactly who signed for it and when.",
    "As demand grew we added branches across South Sudan, then a scheduled corridor service to Addis Ababa with fixed weekly departures. Today we handle domestic, regional and international consignments for households, small traders, NGOs, corporates and e-commerce sellers — with the same principle throughout: a promise you can check."
  ];

  const TIMELINE = [
    { year: "2019", title: "The first corridor run", desc: "Founded in Juba with no vehicle of our own, carrying parcels on the Juba–Addis Ababa corridor twice a week with handwritten tracking registers." },
    { year: "2020", title: "A second route and a second office", desc: "Demand from businesses drove us to add a dedicated Addis Ababa branch and a scheduled weekly departure." },
    { year: "2021", title: "Branches across South Sudan", desc: "Opened Yei, Nimule and Torit, extending coverage to three states and adding first-mile pickup in Juba metro." },
    { year: "2022", title: "Digital tracking", desc: "Launched online Track & Trace with SMS and WhatsApp notifications, replacing the paper register for customers." },
    { year: "2023", title: "Ten states, and counting", desc: "Expanded to Wau, Malakal, Rumbek, Bor and Aweil. All ten states now have a Sudi-Post location." },
    { year: "2024", title: "Business accounts", desc: "Introduced corporate accounts with consolidated invoicing, scheduled collections and named account managers." },
    { year: "2025", title: "4 international destinations", desc: "Partner last-mile coverage across South Sudan, Ethiopia, Kenya and Uganda." },
    { year: "2026", title: "Proof of delivery, digitised", desc: "Digital signatures and delivery photographs on every shipment, viewable in the customer portal the moment a parcel is delivered." }
  ];

  const PILLARS = [
    { icon: "target", title: "Our mission", desc: "To make sending a parcel in South Sudan and Ethiopia as dependable and as visible as ordering anything else — priced honestly, tracked end to end, and delivered to the person who is expecting it." },
    { icon: "eye", title: "Our vision", desc: "To be the delivery network East Africa trusts: the one businesses build their supply chain around and the one families recommend to each other." },
    { icon: "route", title: "Our approach", desc: "Scheduled departures, published transit times, chain-of-custody at every step and a support team that tells you the truth about your parcel." }
  ];

  const TEAM = [
    { name: "Mouch Gatluak Puk", role: "Co-Founder & CEO", note: "Co-founded Sudi-Post in 2019 and leads strategy, partnerships and corridor expansion.", initials: "MG", photo: "mo.jpg" },
    { name: "Makol Samuel Majiok", role: "Head of Operations", note: "Runs the Juba processing hub, branch network and the delivery agent teams.", initials: "MS", photo: "mk.jpg" },
    { name: "Angelo Khor Biel", role: "Head of International & Corridor", note: "Manages the Juba ⇄ Addis schedule, customs clearance and partner last-mile agreements.", initials: "AB", photo: "kb.jpg" },
    { name: "Dominic Gatluak Dak", role: "Head of Customer Experience", note: "Leads support, the contact centre and the delivery feedback loop that shapes our service levels.", initials: "DD", photo: "dg.jpg" }
  ];

  const WHY = [
    { icon: "timer", title: "Published transit times", desc: "Every service states how long it takes, and we report against it. If we miss, you hear it from us first." },
    { icon: "cloud", title: "Low-bandwidth by design", desc: "A lightweight site, no tracking scripts, no map tiles. Tracking works on a basic smartphone and a weak connection." },
    { icon: "wallet", title: "Clear pricing in SSP", desc: "Chargeable weight explained plainly, surcharges itemised, and the USD equivalent shown for planning." },
    { icon: "users", title: "Local people, local knowledge", desc: "Agents recruited in the towns they deliver to. They know the streets that are not on the map." },
    { icon: "shield", title: "Chain of custody", desc: "Every handover logged, every signature captured, every exception recorded with a reason and an owner." },
    { icon: "headset", title: "Support that answers", desc: "Phone, WhatsApp and email, answered within one business day — usually the same day." }
  ];

  const COMMITMENTS = [
    "We quote the same price online as at the counter.",
    "We collect free of charge within Juba metro.",
    "We re-attempt a failed delivery twice at no charge.",
    "We tell you about an exception the day we find it, not the day you call.",
    "We record the name of whoever signs for your parcel.",
    "We refund what we cannot deliver, less only the charges already incurred."
  ];

  const PARTNERS = [
    { icon: "globe", title: "Postal operators", desc: "Inbound and outbound parcel handling with national postal services.", photo: "pos.jpg" },
    { icon: "container", title: "Clearing agents", desc: "Customs documentation and clearance support for cross-border consignments.", photo: "cle.jpg" },
    { icon: "send", title: "Airlines", desc: "Air freight capacity on the Juba and Addis lanes for express consignments.", photo: "air.jpg" },
    { icon: "handshake", title: "Last-mile partners", desc: "Delivery partners in destination cities where we do not operate directly.", photo: "pat.jpg" }
  ];

  /* ------------------------------------------------------------- renderers */
  function stats() {
    const S = SP.STATS;
    var PHOTO = {
      shipments: { f: "van.jpg", a: "A Sudi-Post delivery van loaded with parcels" },
      countries: { f: "air.jpg", a: "A cargo aircraft on an international freight route" },
      branches: { f: "loc.jpg", a: "A Sudi-Post branch and parcel pickup point" },
      onTimeRate: { f: "time.jpg", a: "A consignment handed over inside the delivery window" },
      staff: { f: "pipo.jpg", a: "Sudi-Post staff and delivery agents at a Juba depot" }
    };
    function photo(key, iconName) {
      var p = PHOTO[key];
      if (!p) return "";
      return '<span class="stat__photo">' + icon(iconName) +
        '<img src="assets/img/' + p.f + '" alt="' + esc(p.a) + '"' +
        ' loading="lazy" decoding="async" onerror="this.remove()">' +
        "</span>";
    }
    const tiles = [
      { n: S.shipments, l: "Shipments delivered", i: "package", p: "shipments" },
      { n: S.countries, l: "International destinations", i: "globe", p: "countries" },
      { n: S.branches, l: "Branches & pickup points", i: "map-pin", p: "branches" },
      { n: S.onTimeRate, l: "On-time delivery rate (%)", i: "timer", p: "onTimeRate" },
      { n: S.satisfaction, l: "Customer rating (of 5)", i: "star" },
      { n: S.staff, l: "People employed", i: "users", p: "staff" }
    ];
    $("#aboutStats").innerHTML = tiles.map(function (t, i) {
      return '' +
      '<div class="stat reveal" data-reveal-delay="' + i * 60 + '">' +
        (t.p ? photo(t.p, t.i) : '<span class="stat__icon">' + icon(t.i) + "</span>") +
        '<div class="stat__value" data-count="' + t.n + '" data-decimals="' + (t.n % 1 ? 1 : 0) + '">0</div>' +
        '<div class="stat__label">' + esc(t.l) + "</div>" +
      "</div>";
    }).join("");
  }

  function story() {
    $("#storyProse").innerHTML = STORY.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");

    const B = SP.BRAND;
    const facts = [
      { t: "Legal name", v: B.legalName },
      { t: "Founded", v: B.founded },
      { t: "Headquarters", v: B.address.city + ", " + B.address.country },
      { t: "Second hub", v: B.addisAddress.city + ", " + B.addisAddress.country },
      { t: "Services", v: SP.SERVICES.length + " delivery and logistics services" },
      { t: "Coverage", v: "All 10 states + 4 countries" }
    ];
    $("#aboutFacts").innerHTML = facts.map(function (f) {
      return '<div class="dl__row"><dt>' + esc(f.t) + "</dt><dd>" + esc(f.v) + "</dd></div>";
    }).join("");
  }

  function timeline() {
    $("#aboutTimeline").innerHTML = TIMELINE.map(function (t, i) {
      return '' +
      '<div class="timeline__item reveal" data-reveal-delay="' + i * 50 + '">' +
        '<div class="timeline__marker">' + icon("flag", "", { size: 16 }) + "</div>" +
        '<div class="timeline__content">' +
          '<div class="timeline__meta">' + esc(t.year) + "</div>" +
          '<h3 class="timeline__title">' + esc(t.title) + "</h3>" +
          '<p class="timeline__note">' + esc(t.desc) + "</p>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  function pillars() {
    $("#aboutPillars").innerHTML = PILLARS.map(function (p, i) {
      return '' +
      '<div class="card service-card reveal" data-reveal-delay="' + i * 90 + '">' +
        '<span class="service-card__icon">' + icon(p.icon) + "</span>" +
        '<h3 class="service-card__title" style="font-size:var(--fs-lg)">' + esc(p.title) + "</h3>" +
        '<p class="service-card__desc">' + esc(p.desc) + "</p>" +
      "</div>";
    }).join("");

    $("#aboutValues").innerHTML = SP.VALUES.map(function (v, i) {
      return '' +
      '<div class="card card--pad reveal" data-reveal-delay="' + i * 60 + '">' +
        '<span class="icon-box icon-box--soft icon-box--sm">' + icon(v.icon) + "</span>" +
        '<h3 style="font-size:var(--fs-md);margin-top:var(--sp-3)">' + esc(v.title) + "</h3>" +
        '<p class="text-sm text-muted mt-2">' + esc(v.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  function team() {
    $("#aboutTeam").innerHTML = TEAM.map(function (m, i) {
      return '' +
      '<div class="card service-card service-card--person reveal" data-reveal-delay="' + i * 80 + '">' +
        '<span class="photo-plate photo-plate--person">' +
          (m.photo ? '<img src="assets/img/' + esc(m.photo) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '<span class="avatar avatar--gold" aria-hidden="true">' + esc(m.initials) + "</span>") +
        "</span>" +
        '<h3 class="service-card__title" style="font-size:var(--fs-md)">' + esc(m.name) + "</h3>" +
        '<p class="text-xs fw-700 uppercase" style="letter-spacing:var(--ls-wide);color:var(--sp-gold-700)">' + esc(m.role) + "</p>" +
        '<p class="service-card__desc">' + esc(m.note) + "</p>" +
      "</div>";
    }).join("");
  }

  function why() {
    $("#whyList").innerHTML = WHY.map(function (w) {
      return "<li>" + icon(w.icon, "", { size: 20 }) + "<span><strong>" + esc(w.title) + "</strong> — " + esc(w.desc) + "</span></li>";
    }).join("");

    $("#commitList").innerHTML = COMMITMENTS.map(function (c) {
      return "<li>" + icon("check-circle") + "<span>" + esc(c) + "</span></li>";
    }).join("");

    $("#partnerTiles").innerHTML = PARTNERS.map(function (p, i) {
      return '' +
      '<div class="card card--invert card--pad reveal" data-reveal-delay="' + i * 80 + '">' +
        '<span class="photo-plate photo-plate--wide">' +
          (p.photo ? '<img src="assets/img/' + esc(p.photo) + '" alt="" loading="lazy" decoding="async">' : icon(p.icon)) +
        "</span>" +
        '<h3 style="font-size:var(--fs-md);color:var(--sp-white)">' + esc(p.title) + "</h3>" +
        '<p class="text-sm mt-2" style="color:var(--sp-navy-100)">' + esc(p.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    stats();
    story();
    timeline();
    pillars();
    team();
    why();
    SP.initReveal();
    SP.initCounters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
