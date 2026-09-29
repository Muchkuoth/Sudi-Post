/* ==========================================================================
   SUDI-POST — Business solutions
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, toast } = SP;

  const AUDIENCE = [
    { icon: "cart", t: "Retail & e-commerce", d: "Order intake, dispatch, cash on delivery and returns." },
    { icon: "lightbulb", t: "NGOs & non-profits", d: "Field supplies, office kits and scheduled county drops." },
    { icon: "briefcase", t: "Corporates", d: "Document circulation, staff parcels and multi-site delivery." },
    { icon: "graduation", t: "Education", d: "Student materials, examination papers and campus runs." }
  ];

  const DETAIL = {
    "Corporate Deliveries": {
      points: ["Named account manager", "Consolidated monthly invoice", "Scheduled collection windows", "Delivery reporting by department"],
      note: "Ideal for organisations moving paperwork and small parcels internally or between branches."
    },
    "Bulk Shipments": {
      points: ["Reserved loading capacity", "Pallet and carton handling", "Manifested and reconciled loads", "Direct-from-supplier pickup"],
      note: "For regular consignments above 50 kg or 20 cartons per collection."
    },
    "E-Commerce Logistics": {
      points: ["Cash on delivery", "Failed-delivery follow-up", "Customer SMS and WhatsApp alerts", "Reverse logistics and returns"],
      note: "Sellers get a daily dispatch list and a weekly settlement report."
    },
    "Document Delivery": {
      points: ["Sealed, tamper-evident handling", "Signature by named recipient", "Chain-of-custody log", "Court and registry accepted"],
      note: "Built for legal, HR, procurement and audit documentation."
    },
    "Procurement Delivery": {
      points: ["Supplier-to-site delivery", "Receiving reports", "Discrepancy handling", "Site-hours scheduling"],
      note: "Goods moved from suppliers to your stores, offices or project sites."
    },
    "Business Parcels": {
      points: ["Same-day within Juba", "Next-day regional", "High-value handling", "Priority exception response"],
      note: "For urgent, time-critical consignments where a delay costs more than the freight."
    },
    "Recurring Contracts": {
      points: ["Fixed weekly or monthly schedule", "One invoice, one reconciliation", "Contracted rate card", "Reviewed annually"],
      note: "Plan the collection calendar once, then stop thinking about it."
    },
    "Customised Solutions": {
      points: ["Multi-stop collections", "Dedicated vehicles", "Warehouse and cross-dock handling", "Route design and planning"],
      note: "Where the standard services do not fit, we design the operation with you."
    }
  };

  const TIERS = [
    {
      name: "Business", volume: "50–199 shipments / month", price: "From 12% below list",
      featured: false,
      points: ["Consolidated monthly invoicing", "Scheduled collection windows", "Named contact, not an account manager", "Standard SLA with 2 free re-attempts"]
    },
    {
      name: "Corporate", volume: "200–999 shipments / month", price: "From 20% below list",
      featured: true,
      points: ["Everything in Business", "Dedicated account manager", "Reserved capacity on departure days", "Priority exception handling", "Quarterly service review"]
    },
    {
      name: "Enterprise", volume: "1,000+ shipments / month", price: "Negotiated",
      featured: false,
      points: ["Everything in Corporate", "Custom rate card and credit terms", "Dedicated vehicles or scheduled charter", "SLA credits applied automatically", "API and system integration"]
    }
  ];

  const INCLUDED = [
    "Online tracking for every consignment", "Digital proof of delivery with signature",
    "SMS and WhatsApp notifications", "One consolidated monthly invoice",
    "Named point of contact", "Delivery reporting by branch and department",
    "Declared-value handling up to USD 5,000", "Automatic SLA credit calculation",
    "Free collections within Juba metro", "Escalation contact for unresolved exceptions"
  ];

  const CLIENTS = [
    "Retail and marketplace sellers in Juba", "National NGO programme offices",
    "University and school administration", "Banking and microfinance branches",
    "Construction and procurement teams", "Medical supply distributors",
    "Telecommunications and network operators", "Government ministries and agencies",
    "Importers and wholesalers", "Agricultural cooperatives"
  ];

  const ONBOARD = [
    { num: "1", title: "Enquiry", desc: "Tell us your volumes, routes, weights and the windows that matter to you. A form or a phone call — both work.", icon: "message" },
    { num: "2", title: "Assessment", desc: "We review your current operation, visit if useful, and map the routes and volumes you actually run.", icon: "chart" },
    { num: "3", title: "Proposal", desc: "You receive a tiered proposal with a rate card, service levels, volumes and credit terms — within one business day.", icon: "receipt" },
    { num: "4", title: "Pilot", desc: "We run a trial period on your agreed routes so your team learns the process before it matters.", icon: "zap" },
    { num: "5", title: "Go live", desc: "Scheduled collections begin, invoices consolidate monthly, and your account manager reviews performance with you.", icon: "zap" }
  ];

  const SLA = [
    { n: 94.6, l: "On-time delivery", s: "%" },
    { n: 2, l: "Free re-attempts", s: "" },
    { n: 1, l: "Business day response", s: "" },
    { n: 100, l: "Proof of delivery", s: "%" }
  ];

  /* ------------------------------------------------------------- renderers */
  function audience() {
    $("#bizAudience").innerHTML = AUDIENCE.map(function (a, i) {
      return '' +
      '<div class="card service-card reveal" data-reveal-delay="' + i * 80 + '">' +
        '<span class="service-card__icon">' + icon(a.icon) + "</span>" +
        '<h3 class="service-card__title" style="font-size:var(--fs-md)">' + esc(a.t) + "</h3>" +
        '<p class="service-card__desc">' + esc(a.d) + "</p>" +
      "</div>";
    }).join("");
  }

  function solutions() {
    $("#bizSolutions").innerHTML = SP.BUSINESS_SOLUTIONS.map(function (s, i) {
      const d = DETAIL[s.title] || { points: [], note: "" };
      return '' +
      '<article class="card card--pad reveal" data-reveal-delay="' + (i % 2) * 80 + '" id="sol-' + i + '">' +
        '<div class="flex items-start gap-3">' +
          '<span class="icon-box icon-box--soft icon-box--sm">' + icon(s.icon) + "</span>" +
          "<div>" +
            "<h3 style=\"font-size:var(--fs-lg)\">" + esc(s.title) + "</h3>" +
            '<p class="text-sm text-muted mt-2">' + esc(s.desc) + "</p>" +
          "</div>" +
        "</div>" +
        (d.points.length
          ? '<ul class="check-list mt-4">' + d.points.map(function (p) {
              return "<li>" + icon("check-circle", "", { size: 18 }) + "<span>" + esc(p) + "</span></li>";
            }).join("") + "</ul>"
          : "") +
        (d.note ? '<p class="text-xs text-muted mt-4" style="padding-top:var(--sp-3);border-top:1px dashed var(--color-border)">' +
          esc(d.note) + "</p>" : "") +
      "</article>";
    }).join("");
  }

  function tiers() {
    $("#bizTiers").innerHTML = TIERS.map(function (t, i) {
      return '' +
      '<div class="card card--pad card--raised reveal' + (t.featured ? " card--featured" : "") + '" data-reveal-delay="' + i * 90 + '">' +
        (t.featured ? '<span class="badge badge--solid-gold" style="margin-bottom:var(--sp-3)">Most popular</span>' : "") +
        "<h3 style=\"font-size:var(--fs-xl)\">" + esc(t.name) + "</h3>" +
        '<p class="text-sm text-muted mt-1">' + esc(t.volume) + "</p>" +
        '<div class="fw-800" style="font-size:var(--fs-lg);color:var(--sp-gold-700);margin-top:var(--sp-3)">' + esc(t.price) + "</div>" +
        '<ul class="check-list mt-4">' + t.points.map(function (p) {
          return "<li>" + icon("check-circle", "", { size: 18 }) + "<span>" + esc(p) + "</span></li>";
        }).join("") + "</ul>" +
        '<a class="btn btn--' + (t.featured ? "gold" : "outline") + ' btn--block mt-5" href="#quote">' +
          "Request " + esc(t.name) + "</a>" +
      "</div>";
    }).join("");
  }

  function process() {
    $("#bizProcess").innerHTML = ONBOARD.map(function (p, i) {
      return '' +
      '<div class="step reveal" data-reveal-delay="' + i * 80 + '">' +
        '<div class="step__num">' + esc(p.num) + "</div>" +
        '<h3 class="step__title" style="color:var(--sp-navy-800)">' + esc(p.title) + "</h3>" +
        '<p class="step__desc">' + esc(p.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  function included() {
    const half = Math.ceil(INCLUDED.length / 2);
    $("#bizIncludedA").innerHTML = INCLUDED.slice(0, half).map(function (t) {
      return "<li>" + icon("check-circle") + "<span>" + esc(t) + "</span></li>";
    }).join("");
    $("#bizIncludedB").innerHTML = INCLUDED.slice(half).map(function (t) {
      return "<li>" + icon("check-circle") + "<span>" + esc(t) + "</span></li>";
    }).join("");

    $("#bizSla").innerHTML = SLA.map(function (s) {
      return '' +
      '<div class="stat" style="padding:var(--sp-3) 0">' +
        '<div class="stat__value stat__value--gold" data-count="' + s.n + '"' +
          (String(s.n).indexOf(".") > -1 ? ' data-decimals="1"' : "") + ">0</div>" +
        '<div class="stat__label" style="color:var(--sp-navy-100)">' + esc(s.l) + "</div>" +
      "</div>";
    }).join("");
  }

  function testimonials() {
    const picks = [1, 3, 5];
    $("#bizQuotes").innerHTML = picks.map(function (i, n) {
      const t = SP.TESTIMONIALS[i];
      const stars = new Array(t.rating).fill(0).map(function () { return "★"; }).join("");
      return '' +
      '<figure class="card card--pad reveal" data-reveal-delay="' + n * 90 + '">' +
        '<div style="color:var(--sp-gold-500);letter-spacing:2px" aria-label="' + t.rating + ' out of 5">' + stars + "</div>" +
        '<blockquote class="mt-4" style="font-size:var(--fs-sm);line-height:var(--lh-loose);color:var(--sp-grey-600)">' +
          "“" + esc(t.text) + "”</blockquote>" +
        "<figcaption class=\"mt-4\"><strong>" + esc(t.name) + "</strong><br>" +
          '<span class="text-sm text-muted">' + esc(t.role) + "</span></figcaption>" +
      "</figure>";
    }).join("");
  }

  function sideCards() {
    $("#bizClients").innerHTML = CLIENTS.map(function (c) {
      return "<li>" + icon("check", "", { size: 18 }) + "<span>" + esc(c) + "</span></li>";
    }).join("");
  }

  /* ------------------------------------------------------------------ form */
  function form() {
    const cities = [];
    SP.LOCATIONS.forEach(function (l) { if (cities.indexOf(l.city) === -1) cities.push(l.city); });
    cities.sort();
    $("#bCity").innerHTML = '<option value="">Select location</option>' +
      cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    $("#bizServiceChips").innerHTML = SP.BUSINESS_SOLUTIONS.map(function (s) {
      return '<label class="chip"><input type="checkbox" name="bizServices" value="' + esc(s.title) +
        '" class="visually-hidden">' + icon(s.icon, "", { size: 15 }) + esc(s.title) + "</label>";
    }).join("");

    const form = $("#bizForm");
    SP.bindValidation(form);

    $$("#bizServiceChips input").forEach(function (c) {
      c.addEventListener("change", function () {
        const picked = $$("#bizServiceChips input:checked").map(function (x) { return x.value; });
        $("#bizServicesValue").value = picked.join(", ");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const picked = $$("#bizServiceChips input:checked").length;
      if (!picked) {
        $("#bizServiceChips").scrollIntoView({ behavior: "smooth", block: "center" });
        $("#bServErr").textContent = "Choose at least one service.";
        toast("Please choose at least one service.", "error");
        return;
      }
      if (!SP.validateForm(form)) { toast("Please complete the highlighted fields.", "error"); return; }

      const d = SP.getData(form);
      const btn = $('button[type="submit"]', form);
      SP.setLoading(btn, true, "Sending.");
      const ref = "BIZ-" + Date.now().toString().slice(-6);

      /* simulated submit — replace with POST /api/v1/business-enquiries */
      setTimeout(function () {
        SP.setLoading(btn, false);
        SP.store.addMessage({
          id: ref, name: d.contact, email: d.email, phone: d.phone,
          topic: "business", message: d.org + " (" + d.sector + ", " + d.volume + " shipments/month) — " +
            d.services + (d.notes ? "\n" + d.notes : ""), at: new Date().toISOString()
        });

        form.innerHTML = '' +
        '<div class="text-center" style="padding:var(--sp-6) 0">' +
          '<div class="done-mark">' + icon("check") + "</div>" +
          '<h2 style="font-size:var(--fs-2xl)">Proposal requested</h2>' +
          '<p class="lead mt-3">Thank you, ' + esc(String(d.contact).split(" ")[0]) + ". A sales manager will review " +
            "your enquiry and respond to <strong>" + esc(d.email) + "</strong> within one business day. " +
            "Reference <strong class=\"mono\">" + esc(ref) + "</strong>.</p>" +
          '<div class="flex flex-wrap gap-3 mt-6" style="justify-content:center">' +
            '<a class="btn btn--gold" href="send.html">' + icon("send") + "Book a trial shipment</a>" +
            '<a class="btn btn--outline" href="rates.html">' + icon("percent") + "See list rates</a>" +
            '<a class="btn btn--ghost" href="index.html">Back to home</a>' +
          "</div>" +
        "</div>";
        SP.hydrateIcons(form);
        toast("Business enquiry received. Reference " + ref, "success");
      }, 800);
    });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    audience();
    solutions();
    tiers();
    process();
    included();
    testimonials();
    sideCards();
    form();
    SP.initReveal();
    SP.initCounters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
