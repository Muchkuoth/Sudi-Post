/* ==========================================================================
   SUDI-POST — Track & Trace
   ========================================================================== */
(function () {
  "use strict";
  const { icon, $, $$, esc, statusBadge, openModal, toast, copyText } = SP;
  const F = SP.fmt;
  let current = null;

  /* ---------------------------------------------------------------------
     Status legend + help FAQ
     --------------------------------------------------------------------- */
  function renderLegend() {
    const host = $("#statusLegend");
    const order = ["pending", "received", "processing", "transit", "arrived", "outfordeliv", "delivered", "delayed", "returned"];
    host.innerHTML = order.map(function (key) {
      const s = SP.STATUSES[key];
      return '' +
      '<div class="card card--pad reveal">' +
        '<div class="flex items-center justify-between gap-3">' +
          '<span class="' + s.badge + '">' + esc(s.label) + "</span>" +
          '<span class="icon-box icon-box--sm icon-box--soft" style="width:36px;height:36px;color:' + s.color + '">' + icon(s.icon) + "</span>" +
        "</div>" +
        '<p class="text-sm text-muted mt-4">' + esc(s.desc) + "</p>" +
      "</div>";
    }).join("");
  }

  function renderFaq() {
    const host = $("#trackFaq");
    const picks = [0, 1, 5, 6];
    host.innerHTML = picks.map(function (i, n) {
      const f = SP.FAQS[i];
      return '<details class="accordion__item"' + (n === 0 ? " open" : "") + "><summary>" + esc(f.q) +
        '</summary><div class="accordion__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  function renderDemoRefs() {
    const host = $("#demoRefs");
    const samples = ["SUD-2026-000125", "SUD-2026-000123", "SUD-2026-000122", "SUD-2026-000121", "SUD-2026-000119"];
    host.innerHTML = '<span class="text-sm text-muted fw-600" style="align-self:center;margin-right:var(--sp-2)">Demo references:</span>' +
      samples.map(function (s) {
        return '<button class="btn btn--outline btn--xs" type="button" data-ref="' + s + '">' + s + "</button>";
      }).join("");
    $$("[data-ref]", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $("#trackingInput").value = btn.dataset.ref;
        run(btn.dataset.ref);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Timeline
     --------------------------------------------------------------------- */
  function timeline(s) {
    const reached = {};
    s.history.forEach(function (h) { reached[h.key] = h; });
    const currentStep = SP.ship.stepIndex(s.history);
    const exception = s.status === "delayed" || s.status === "returned";

    const items = SP.TRACK_STEPS.map(function (st) {
      const ev = reached[st.key];
      const done = !!ev;
      const isCurrent = st.step === currentStep && s.status !== "delivered";
      let cls = "";
      if (done) cls = "is-done";
      if (isCurrent) cls = exception ? "is-failed" : "is-current";

      return '' +
      '<li class="timeline__item ' + cls + '">' +
        '<span class="timeline__marker">' + icon(done || isCurrent ? st.icon : "clock") + "</span>" +
        '<div class="timeline__content">' +
          '<div class="flex flex-wrap items-center gap-3">' +
            '<h3 class="timeline__title">' + esc(st.label) + "</h3>" +
            (done ? '<span class="badge badge--none badge--success">Completed</span>' : "") +
            (isCurrent ? '<span class="badge badge--none badge--gold">Current</span>' : "") +
          "</div>" +
          (ev ?
            '<div class="timeline__meta">' +
              '<span>' + icon("calendar") + F.dateTime(ev.at) + "</span>" +
              '<span>' + icon("map-pin") + esc(ev.location) + "</span>" +
            "</div>" +
            (ev.note ? '<div class="timeline__note">' + esc(ev.note) + "</div>" : "")
            :
            '<div class="timeline__meta"><span>' + icon("clock") + "Awaiting" + "</span></div>"
          ) +
        "</div>" +
      "</li>";
    }).join("");

    /* Exception entries appended to the timeline */
    let extra = "";
    if (exception && s.exception) {
      extra = '' +
      '<li class="timeline__item is-failed">' +
        '<span class="timeline__marker">' + icon("alert") + "</span>" +
        '<div class="timeline__content">' +
          '<h3 class="timeline__title">' + esc(SP.STATUSES[s.exception.type].label) + "</h3>" +
          '<div class="timeline__meta"><span>' + icon("calendar") + F.dateTime(s.exception.openedAt) + "</span>" +
          '<span>' + icon("user") + esc(s.exception.owner) + "</span></div>" +
          '<div class="timeline__note">' + esc(s.exception.reason) + "</div>" +
        "</div>" +
      "</li>";
    }

    return '<ol class="timeline">' + items + extra + "</ol>";
  }

  /* Compact horizontal progress */
  function progressStrip(s) {
    const currentStep = SP.ship.stepIndex(s.history);
    return '<div class="timeline-h">' + SP.TRACK_STEPS.map(function (st) {
      const done = st.step < currentStep;
      const isCur = st.step === currentStep && s.status !== "delivered";
      return '' +
      '<div class="timeline-h__step ' + (done ? "is-done" : isCur ? "is-current" : "") + '">' +
        '<span class="timeline-h__dot">' + (done ? icon("check") : String(st.step)) + "</span>" +
        '<span class="timeline-h__label">' + esc(st.label) + "</span>" +
      "</div>";
    }).join("") + "</div>";
  }

  /* ---------------------------------------------------------------------
     Result renderer
     --------------------------------------------------------------------- */
  function renderResult(s) {
    const status = SP.STATUSES[s.status] || SP.STATUSES.pending;
    const eta = s.status === "delivered" ? (s.deliveredAt || s.estimatedDelivery) : s.estimatedDelivery;
    const etaLabel = s.status === "delivered" ? "Delivered on" : "Estimated delivery";

    const kv = function (label, value, sub) {
      return '<div class="tr-kv__item"><div class="tr-kv__label">' + esc(label) + "</div>" +
        '<div class="tr-kv__value">' + esc(value) + (sub ? ' <span class="text-xs text-muted fw-600">' + esc(sub) + "</span>" : "") + "</div></div>";
    };

    const html = '' +
    /* Hero status */
    '<div class="tr-hero">' +
      '<div class="tr-hero__top">' +
        '<div class="tr-hero__status">' +
          '<span class="icon-box" style="background:rgba(255,255,255,0.12);box-shadow:none">' + icon(status.icon) + "</span>" +
          "<div><div class=\"tr-hero__status-text\">" + esc(status.label) + "</div>" +
          '<div class="tr-hero__status-sub">' + esc(status.desc) + "</div></div>" +
        "</div>" +
        '<div class="tr-hero__eta"><div class="tr-hero__eta-label">' + etaLabel + "</div>" +
        '<div class="tr-hero__eta-value">' + F.date(eta) + "</div></div>" +
      "</div>" +
      '<div class="route">' +
        '<div class="route__end"><div class="route__flag">🇸🇸</div><div class="route__city">' + esc(s.origin) + "</div>" +
          '<div class="route__code">Origin</div></div>' +
        '<div class="route__line"></div>' +
        '<div class="route__end"><div class="route__flag">📦</div><div class="route__city">' + esc(s.destination) + "</div>" +
          '<div class="route__code">Destination</div></div>' +
      "</div>" +
    "</div>" +

    /* Summary */
    '<div class="tr-summary">' +
      "<div>" +
        '<div class="tr-summary__id">' +
          '<span class="tr-summary__code">' + esc(s.tracking) + "</span>" +
          statusBadge(s.status) +
          SP.paymentBadge(s.payment ? s.payment.status : "pending") +
        "</div>" +
        '<div class="tr-summary__route mt-4">' + progressStrip(s) + "</div>" +
        '<div class="flex flex-wrap gap-2 mt-5">' +
          '<button class="btn btn--outline btn--sm" type="button" id="copyRef">' + icon("clipboard") + "Copy reference</button>" +
          '<button class="btn btn--outline btn--sm" type="button" id="printRef">' + icon("print") + "Print details</button>" +
          '<a class="btn btn--outline btn--sm" href="contact.html?topic=tracking">' + icon("headset") + "Report a problem</a>" +
        "</div>" +
      "</div>" +
      '<div class="tr-summary__meta"><div class="tr-kv">' +
        kv("Current location", s.currentLocation) +
        kv("Shipment type", SP.serviceIcon(s.type), serviceName(s.type)) +
        kv("Service level", s.service.charAt(0).toUpperCase() + s.service.slice(1)) +
        kv("Declared value", s.declaredValue ? F.money(s.declaredValue) : "Not declared") +
        kv("Chargeable weight", (s.chargeable || s.weight) + " kg") +
      "</div></div>" +
    "</div>" +

    /* Parties & addresses */
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))">' +
      '<div class="card card--pad">' +
        '<h3 class="flex items-center gap-2" style="font-size:var(--fs-md)">' + icon("user", "", { size: 18 }) + "Sender</h3>" +
        '<dl class="dl mt-4">' +
          '<div class="dl__row"><dt>Name</dt><dd>' + esc(s.sender.name) + "</dd></div>" +
          '<div class="dl__row"><dt>Phone</dt><dd>' + esc(s.sender.phone) + "</dd></div>" +
          '<div class="dl__row"><dt>Email</dt><dd>' + esc(s.sender.email) + "</dd></div>" +
          '<div class="dl__row"><dt>Address</dt><dd>' + esc(s.sender.address) + "</dd></div>" +
        "</dl>" +
      "</div>" +
      '<div class="card card--pad">' +
        '<h3 class="flex items-center gap-2" style="font-size:var(--fs-md)">' + icon("map-pin", "", { size: 18 }) + "Receiver &amp; delivery address</h3>" +
        '<dl class="dl mt-4">' +
          '<div class="dl__row"><dt>Name</dt><dd>' + esc(s.receiver.name) + "</dd></div>" +
          '<div class="dl__row"><dt>Phone</dt><dd>' + esc(s.receiver.phone) + "</dd></div>" +
          '<div class="dl__row"><dt>Email</dt><dd>' + esc(s.receiver.email) + "</dd></div>" +
          '<div class="dl__row"><dt>Delivery address</dt><dd>' + esc(s.receiver.address) + "</dd></div>" +
          '<div class="dl__row"><dt>Booked on</dt><dd>' + F.date(s.createdAt) + "</dd></div>" +
        "</dl>" +
      "</div>" +
    "</div>" +

    /* History timeline */
    '<div class="card card--pad">' +
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
        "<h3>Shipment history</h3>" +
        '<span class="text-sm text-muted">' + s.history.length + " scan events</span>" +
      "</div>" +
      '<hr class="mt-4 mb-5">' +
      timeline(s) +
    "</div>" +

    /* Proof of delivery */
    (s.pod ? podCard(s.pod) : '<div class="card card--pad"><div class="flex items-center gap-3">' +
      '<span class="icon-box icon-box--sm icon-box--soft">' + icon("file") + "</span>" +
      "<div><h3 style=\"font-size:var(--fs-md)\">Proof of delivery</h3>" +
      '<p class="text-sm text-muted">Recorded by the delivery agent at the point of handover. Available as soon as the shipment is delivered.</p></div></div></div>');

    $("#trackResult").innerHTML = html;
    $("#resultSection").hidden = false;

    $("#copyRef").addEventListener("click", function () {
      copyText(s.tracking).then(function (ok) {
        toast(ok ? "Reference " + s.tracking + " copied to clipboard." : "Could not copy automatically.", ok ? "success" : "error");
      });
    });
    $("#printRef").addEventListener("click", function () { window.print(); });
  }

  function podCard(p) {
    return '' +
    '<div class="card card--pad" style="border-color:var(--sp-success)">' +
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
        '<h3 class="flex items-center gap-2" style="font-size:var(--fs-md);color:var(--sp-success)">' +
          icon("check-circle") + "Proof of delivery</h3>" +
        '<span class="badge badge--success">Verified</span>' +
      "</div>" +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:var(--sp-4);margin-top:var(--sp-4)">' +
        '<div><div class="tr-kv__label">Recipient</div><div class="tr-kv__value">' + esc(p.recipient) + "</div></div>" +
        '<div><div class="tr-kv__label">Date &amp; time</div><div class="tr-kv__value">' + esc(p.date) + " • " + esc(p.time) + "</div></div>" +
        '<div><div class="tr-kv__label">Signature</div><div class="tr-kv__value" style="font-family:var(--font-display);font-style:italic">' + esc(p.signature) + "</div></div>" +
        '<div><div class="tr-kv__label">Location record</div><div class="tr-kv__value">' +
          (p.gps ? p.gps.lat.toFixed(4) + ", " + p.gps.lon.toFixed(4) : "Not captured") + "</div></div>" +
      "</div>" +
      (p.note ? '<p class="text-sm text-muted mt-4">' + esc(p.note) + "</p>" : "") +
    "</div>";
  }

  function serviceName(id) {
    const m = {
      document: "Document", small: "Small Parcel", medium: "Medium Parcel", large: "Large Parcel",
      fragile: "Fragile / Electronics", cargo: "Cargo", student: "Student Package"
    };
    return m[id] || "Parcel";
  }

  /* ---------------------------------------------------------------------
     Actions
     --------------------------------------------------------------------- */
  function notFound(no) {
    $("#trackResult").innerHTML = '' +
    '<div class="card card--pad">' +
      '<div class="empty-state">' +
        '<div class="empty-state__icon">' + icon("search") + "</div>" +
        "<h3>We could not find that reference</h3>" +
        "<p>No shipment matches <strong>" + esc(no) + "</strong>. Check the reference on your receipt, " +
        "or contact support and we will look it up from your name and address.</p>" +
        '<div class="flex flex-wrap gap-3" style="justify-content:center">' +
          '<a class="btn btn--primary" href="contact.html?topic=tracking">Contact support</a>' +
          '<button class="btn btn--outline" type="button" id="retry">Try another reference</button>' +
        "</div>" +
      "</div>" +
    "</div>";
    $("#resultSection").hidden = false;
    $("#retry").addEventListener("click", function () {
      $("#trackingInput").focus();
      $("#trackingInput").select();
      $("#resultSection").hidden = true;
    });
  }

  function run(no) {
    const btn = $("#trackForm button[type=submit]");
    SP.setLoading(btn, true, "Tracking…");
    SP.store.getShipment(no).then(function (s) {
      SP.setLoading(btn, false);
      if (!s) { notFound(no); return; }
      current = s;
      renderResult(s);
      const url = new URL(window.location.href);
      url.searchParams.set("no", s.tracking);
      history.replaceState(null, "", url);
      $("#resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
      SP.store.pushNotification({
        type: "tracking", title: "Tracking checked", tracking: s.tracking,
        body: s.tracking + " is " + SP.STATUSES[s.status].label.toLowerCase() + "."
      });
    }).catch(function () {
      SP.setLoading(btn, false);
      notFound(no);
    });
  }

  function init() {
    renderLegend();
    renderFaq();
    renderDemoRefs();

    const form = $("#trackForm");
    const input = $("#trackingInput");
    SP.bindValidation(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SP.validateForm(form)) return;
      run(input.value.trim().toUpperCase());
    });

    /* deep link */
    const params = new URLSearchParams(window.location.search);
    const no = params.get("no") || params.get("tracking");
    if (no) { input.value = no.toUpperCase(); run(no.toUpperCase()); }

    SP.initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
